"""
Documents/File Manager Router
Supports Google Drive and OneDrive as storage backends.
League-level and team-level configurations.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uuid
import json
import os
import logging

logger = logging.getLogger("server")

docs_router = APIRouter(tags=["documents"])

db = None

def set_db(database):
    global db
    db = database


# ============================================================================
# STORAGE CONFIG (per-team or league-level)
# ============================================================================

async def _get_storage_config(team_id: str = None):
    """Get storage config for a team (falls back to league-level)"""
    if team_id:
        team_config = await db.team_storage_configs.find_one({"team_id": team_id}, {"_id": 0})
        if team_config:
            # If team explicitly chose "use_league", skip to league config
            if team_config.get("use_league"):
                pass  # fall through to league config below
            elif team_config.get("provider"):
                return team_config
    
    # Fallback to league-level cloud_storage
    league_config = await db.cloud_storage.find_one({"id": "main_cloud_storage"}, {"_id": 0})
    if league_config and league_config.get("googleDrive", {}).get("refreshToken"):
        return {
            "provider": "google_drive",
            "google_drive": league_config["googleDrive"],
            "team_id": None,
            "is_league_level": True
        }
    return None


async def _get_gdrive_token(config: dict) -> str:
    """Get a fresh Google Drive access token from refresh token"""
    import httpx
    gd = config.get("google_drive") or config.get("googleDrive", {})
    refresh_token = gd.get("refreshToken")
    client_id = gd.get("clientId")
    client_secret = gd.get("clientSecret")
    
    if not refresh_token or not client_id or not client_secret:
        raise HTTPException(status_code=400, detail="Google Drive not fully configured (missing credentials)")
    
    async with httpx.AsyncClient() as client:
        resp = await client.post("https://oauth2.googleapis.com/token", data={
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        })
    
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to refresh Google Drive token. Please re-authorize.")
    
    return resp.json()["access_token"]


async def _gdrive_request(method: str, url: str, token: str, **kwargs):
    """Make an authenticated Google Drive API request"""
    import httpx
    headers = {"Authorization": f"Bearer {token}"}
    if "headers" in kwargs:
        headers.update(kwargs.pop("headers"))
    
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await getattr(client, method)(url, headers=headers, **kwargs)
    return resp


# ============================================================================
# TEAM STORAGE CONFIGURATION ENDPOINTS
# ============================================================================

@docs_router.get("/documents/config")
async def get_docs_config(team_id: str = None):
    """Get document storage configuration"""
    try:
        # Always check league-level availability
        league_config = await db.cloud_storage.find_one({"id": "main_cloud_storage"}, {"_id": 0})
        league_available = bool(league_config and league_config.get("googleDrive", {}).get("refreshToken"))
        league_provider = "google_drive" if league_available else None
        
        if team_id:
            config = await db.team_storage_configs.find_one({"team_id": team_id}, {"_id": 0})
            if config:
                # Mask sensitive fields
                if config.get("google_drive", {}).get("clientSecret"):
                    config["google_drive"]["clientSecret"] = "••••••••"
                if config.get("google_drive", {}).get("refreshToken"):
                    config["google_drive"]["refreshToken"] = "••••configured••••"
                if config.get("onedrive", {}).get("clientSecret"):
                    config["onedrive"]["clientSecret"] = "••••••••"
                if config.get("onedrive", {}).get("refreshToken"):
                    config["onedrive"]["refreshToken"] = "••••configured••••"
                
                is_using_league = config.get("use_league", False)
                has_own = bool(config.get("provider")) and not is_using_league
                
                return {
                    "configured": has_own or (is_using_league and league_available),
                    "use_league": is_using_league,
                    "provider": league_provider if is_using_league else config.get("provider"),
                    "league_available": league_available,
                    "league_provider": league_provider,
                    **{k: v for k, v in config.items() if k not in ["_id"]}
                }
            return {
                "configured": league_available,  # falls back to league
                "team_id": team_id,
                "provider": league_provider,
                "use_league": league_available,  # default: use league if available
                "league_available": league_available,
                "league_provider": league_provider
            }
        
        # League level
        return {
            "configured": league_available,
            "provider": league_provider,
            "league_available": league_available,
            "google_drive_email": league_config.get("googleDrive", {}).get("email", "") if league_config else "",
            "google_drive_folder": league_config.get("googleDrive", {}).get("folderName", "") if league_config else ""
        }
    except Exception as e:
        logger.error(f"Error getting docs config: {e}")
        return {"configured": False, "provider": None, "league_available": False}


@docs_router.post("/documents/config")
async def save_docs_config(data: Dict[str, Any]):
    """Save team-level document storage configuration"""
    try:
        team_id = data.get("team_id")
        provider = data.get("provider")  # "google_drive" or "onedrive"
        
        if not team_id:
            raise HTTPException(status_code=400, detail="team_id is required")
        if provider not in ["google_drive", "onedrive"]:
            raise HTTPException(status_code=400, detail="provider must be 'google_drive' or 'onedrive'")
        
        config = {
            "team_id": team_id,
            "provider": provider,
            "configured_at": datetime.now(timezone.utc).isoformat()
        }
        
        if provider == "google_drive":
            gd = data.get("google_drive", {})
            config["google_drive"] = {
                "clientId": gd.get("clientId", ""),
                "clientSecret": gd.get("clientSecret", ""),
                "refreshToken": gd.get("refreshToken", ""),
                "folderId": gd.get("folderId", ""),
                "folderName": gd.get("folderName", "Team Documents")
            }
        elif provider == "onedrive":
            od = data.get("onedrive", {})
            config["onedrive"] = {
                "clientId": od.get("clientId", ""),
                "clientSecret": od.get("clientSecret", ""),
                "tenantId": od.get("tenantId", ""),
                "refreshToken": od.get("refreshToken", ""),
                "folderId": od.get("folderId", ""),
                "folderName": od.get("folderName", "Team Documents")
            }
        
        await db.team_storage_configs.update_one(
            {"team_id": team_id},
            {"$set": config},
            upsert=True
        )
        
        return {"status": "success", "message": f"{provider} configuration saved for team"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving docs config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# FILE BROWSING / LISTING
# ============================================================================

@docs_router.get("/documents/files")
async def list_files(team_id: str = None, folder_id: str = None):
    """List files and folders from the configured storage provider"""
    try:
        config = await _get_storage_config(team_id)
        if not config:
            return {"files": [], "provider": None, "configured": False}
        
        provider = config.get("provider", "google_drive")
        
        if provider == "google_drive":
            return await _gdrive_list_files(config, folder_id)
        elif provider == "onedrive":
            return await _onedrive_list_files(config, folder_id)
        
        return {"files": [], "provider": provider, "configured": False}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _gdrive_list_files(config: dict, folder_id: str = None):
    """List files from Google Drive"""
    token = await _get_gdrive_token(config)
    
    gd = config.get("google_drive") or config.get("googleDrive", {})
    parent_id = folder_id or gd.get("folderId") or "root"
    
    query = f"'{parent_id}' in parents and trashed=false"
    url = f"https://www.googleapis.com/drive/v3/files?q={query}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,iconLink)&orderBy=folder,name&pageSize=100"
    
    resp = await _gdrive_request("get", url, token)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Failed to list Google Drive files")
    
    data = resp.json()
    files = []
    for f in data.get("files", []):
        is_folder = f["mimeType"] == "application/vnd.google-apps.folder"
        files.append({
            "id": f["id"],
            "name": f["name"],
            "type": "folder" if is_folder else "file",
            "mimeType": f["mimeType"],
            "size": int(f.get("size", 0)),
            "modifiedTime": f.get("modifiedTime"),
            "webViewLink": f.get("webViewLink"),
            "thumbnailLink": f.get("thumbnailLink"),
            "provider": "google_drive"
        })
    
    return {"files": files, "provider": "google_drive", "configured": True, "parent_id": parent_id}


async def _onedrive_list_files(config: dict, folder_id: str = None):
    """List files from OneDrive (Microsoft Graph API)"""
    od = config.get("onedrive", {})
    token = await _get_onedrive_token(od)
    
    if folder_id:
        url = f"https://graph.microsoft.com/v1.0/me/drive/items/{folder_id}/children?$top=100"
    else:
        folder_path = od.get("folderName", "Team Documents")
        url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{folder_path}:/children?$top=100"
    
    resp = await _gdrive_request("get", url, token)  # reusing the helper
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Failed to list OneDrive files")
    
    data = resp.json()
    files = []
    for item in data.get("value", []):
        is_folder = "folder" in item
        files.append({
            "id": item["id"],
            "name": item["name"],
            "type": "folder" if is_folder else "file",
            "mimeType": item.get("file", {}).get("mimeType", "application/octet-stream") if not is_folder else "folder",
            "size": item.get("size", 0),
            "modifiedTime": item.get("lastModifiedDateTime"),
            "webViewLink": item.get("webUrl"),
            "provider": "onedrive"
        })
    
    return {"files": files, "provider": "onedrive", "configured": True, "parent_id": folder_id}


async def _get_onedrive_token(od_config: dict) -> str:
    """Get a fresh OneDrive access token"""
    import httpx
    client_id = od_config.get("clientId")
    client_secret = od_config.get("clientSecret")
    tenant_id = od_config.get("tenantId")
    refresh_token = od_config.get("refreshToken")
    
    if not all([client_id, client_secret, tenant_id, refresh_token]):
        raise HTTPException(status_code=400, detail="OneDrive not fully configured")
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
                "scope": "https://graph.microsoft.com/.default"
            }
        )
    
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to refresh OneDrive token")
    
    return resp.json()["access_token"]


# ============================================================================
# CREATE FOLDER
# ============================================================================

@docs_router.post("/documents/folders")
async def create_folder(data: Dict[str, Any]):
    """Create a new folder"""
    try:
        team_id = data.get("team_id")
        folder_name = data.get("name", "").strip()
        parent_id = data.get("parent_id")
        
        if not folder_name:
            raise HTTPException(status_code=400, detail="Folder name is required")
        
        config = await _get_storage_config(team_id)
        if not config:
            raise HTTPException(status_code=400, detail="Storage not configured")
        
        provider = config.get("provider", "google_drive")
        
        if provider == "google_drive":
            token = await _get_gdrive_token(config)
            gd = config.get("google_drive") or config.get("googleDrive", {})
            parent = parent_id or gd.get("folderId") or "root"
            
            metadata = {
                "name": folder_name,
                "mimeType": "application/vnd.google-apps.folder",
                "parents": [parent]
            }
            resp = await _gdrive_request("post", "https://www.googleapis.com/drive/v3/files", token, json=metadata)
            if resp.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to create folder")
            folder = resp.json()
            return {"status": "success", "folder": {"id": folder["id"], "name": folder["name"]}}
        
        elif provider == "onedrive":
            od = config.get("onedrive", {})
            token = await _get_onedrive_token(od)
            
            if parent_id:
                url = f"https://graph.microsoft.com/v1.0/me/drive/items/{parent_id}/children"
            else:
                folder_path = od.get("folderName", "Team Documents")
                url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{folder_path}:/children"
            
            resp = await _gdrive_request("post", url, token, json={
                "name": folder_name,
                "folder": {},
                "@microsoft.graph.conflictBehavior": "rename"
            })
            if resp.status_code not in [200, 201]:
                raise HTTPException(status_code=500, detail="Failed to create folder")
            folder = resp.json()
            return {"status": "success", "folder": {"id": folder["id"], "name": folder["name"]}}
        
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating folder: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# UPLOAD FILE
# ============================================================================

@docs_router.post("/documents/upload")
async def upload_file(
    file: UploadFile = File(...),
    team_id: str = Form(None),
    folder_id: str = Form(None)
):
    """Upload a file to the configured storage"""
    try:
        config = await _get_storage_config(team_id)
        if not config:
            raise HTTPException(status_code=400, detail="Storage not configured")
        
        content = await file.read()
        if len(content) > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(status_code=400, detail="File too large (50MB max)")
        
        provider = config.get("provider", "google_drive")
        
        if provider == "google_drive":
            token = await _get_gdrive_token(config)
            gd = config.get("google_drive") or config.get("googleDrive", {})
            parent = folder_id or gd.get("folderId") or "root"
            
            metadata = {"name": file.filename, "parents": [parent]}
            
            import httpx
            files_data = {
                "metadata": (None, json.dumps(metadata), "application/json"),
                "file": (file.filename, content, file.content_type or "application/octet-stream")
            }
            
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType,webViewLink",
                    headers={"Authorization": f"Bearer {token}"},
                    files=files_data
                )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=500, detail="Upload to Google Drive failed")
            
            file_data = resp.json()
            return {
                "status": "success",
                "file": {
                    "id": file_data["id"],
                    "name": file_data["name"],
                    "size": int(file_data.get("size", 0)),
                    "mimeType": file_data.get("mimeType"),
                    "webViewLink": file_data.get("webViewLink"),
                    "provider": "google_drive"
                }
            }
        
        elif provider == "onedrive":
            od = config.get("onedrive", {})
            token = await _get_onedrive_token(od)
            
            if folder_id:
                url = f"https://graph.microsoft.com/v1.0/me/drive/items/{folder_id}:/{file.filename}:/content"
            else:
                folder_path = od.get("folderName", "Team Documents")
                url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{folder_path}/{file.filename}:/content"
            
            import httpx
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.put(
                    url,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": file.content_type or "application/octet-stream"},
                    content=content
                )
            
            if resp.status_code not in [200, 201]:
                raise HTTPException(status_code=500, detail="Upload to OneDrive failed")
            
            file_data = resp.json()
            return {
                "status": "success",
                "file": {
                    "id": file_data["id"],
                    "name": file_data["name"],
                    "size": file_data.get("size", 0),
                    "webViewLink": file_data.get("webUrl"),
                    "provider": "onedrive"
                }
            }
        
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DELETE FILE/FOLDER
# ============================================================================

@docs_router.delete("/documents/files/{file_id}")
async def delete_file(file_id: str, team_id: str = None, provider: str = "google_drive"):
    """Delete a file or folder"""
    try:
        config = await _get_storage_config(team_id)
        if not config:
            raise HTTPException(status_code=400, detail="Storage not configured")
        
        actual_provider = config.get("provider", provider)
        
        if actual_provider == "google_drive":
            token = await _get_gdrive_token(config)
            resp = await _gdrive_request("delete", f"https://www.googleapis.com/drive/v3/files/{file_id}", token)
            if resp.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to delete from Google Drive")
            return {"status": "success"}
        
        elif actual_provider == "onedrive":
            od = config.get("onedrive", {})
            token = await _get_onedrive_token(od)
            resp = await _gdrive_request("delete", f"https://graph.microsoft.com/v1.0/me/drive/items/{file_id}", token)
            if resp.status_code not in [200, 204]:
                raise HTTPException(status_code=500, detail="Failed to delete from OneDrive")
            return {"status": "success"}
        
        raise HTTPException(status_code=400, detail=f"Unknown provider: {actual_provider}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
