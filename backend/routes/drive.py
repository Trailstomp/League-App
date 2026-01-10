"""
Google Drive Folder Management Router
Handles organized folder structure for league media
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import logging
import httpx

logger = logging.getLogger(__name__)

# Create router
drive_router = APIRouter(prefix="/drive", tags=["google-drive"])

# Database reference - set from server.py
db = None

def set_db(database):
    global db
    db = database


async def get_drive_config():
    """Get Google Drive configuration from database"""
    config = await db.cloud_storage_config.find_one({"id": "main_config"})
    if not config or not config.get("googleDrive", {}).get("refreshToken"):
        return None
    return config.get("googleDrive", {})


async def get_access_token(drive_config: Dict) -> str:
    """Get fresh access token from refresh token"""
    try:
        token_data = {
            'client_id': drive_config["clientId"],
            'client_secret': drive_config["clientSecret"],
            'refresh_token': drive_config["refreshToken"],
            'grant_type': 'refresh_token'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://oauth2.googleapis.com/token',
                data=token_data,
                timeout=15
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to refresh Google Drive token")
            
            tokens = response.json()
            return tokens.get('access_token', '')
            
    except Exception as e:
        logger.error(f"❌ Error getting access token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def create_folder(access_token: str, name: str, parent_id: str = None) -> Dict:
    """Create a folder in Google Drive"""
    try:
        metadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent_id:
            metadata['parents'] = [parent_id]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://www.googleapis.com/drive/v3/files',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                },
                json=metadata,
                timeout=30
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Failed to create folder: {response.text}")
                return None
            
            folder = response.json()
            
            # Make folder publicly viewable
            await client.post(
                f'https://www.googleapis.com/drive/v3/files/{folder["id"]}/permissions',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                },
                json={'type': 'anyone', 'role': 'reader'},
                timeout=15
            )
            
            return folder
            
    except Exception as e:
        logger.error(f"❌ Error creating folder: {e}")
        return None


async def find_or_create_folder(access_token: str, name: str, parent_id: str = None) -> str:
    """Find existing folder or create new one"""
    try:
        # Search for existing folder
        query = f"name='{name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        if parent_id:
            query += f" and '{parent_id}' in parents"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://www.googleapis.com/drive/v3/files',
                headers={'Authorization': f'Bearer {access_token}'},
                params={'q': query, 'fields': 'files(id,name)'},
                timeout=15
            )
            
            if response.status_code == 200:
                files = response.json().get('files', [])
                if files:
                    return files[0]['id']
        
        # Create new folder if not found
        folder = await create_folder(access_token, name, parent_id)
        return folder['id'] if folder else None
        
    except Exception as e:
        logger.error(f"❌ Error finding/creating folder: {e}")
        return None


@drive_router.get("/folders")
async def get_folder_structure():
    """Get the current Google Drive folder structure"""
    try:
        drive_config = await get_drive_config()
        if not drive_config:
            return {"status": "not_configured", "message": "Google Drive not configured"}
        
        # Get folder structure from database
        folder_structure = await db.drive_folders.find_one({"id": "league_structure"})
        
        return {
            "status": "ok",
            "configured": True,
            "root_folder_id": drive_config.get("folderId"),
            "folder_structure": folder_structure or {}
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting folder structure: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@drive_router.post("/folders/initialize")
async def initialize_folder_structure():
    """Initialize the organized folder structure in Google Drive"""
    try:
        drive_config = await get_drive_config()
        if not drive_config:
            raise HTTPException(status_code=400, detail="Google Drive not configured. Please set up Google Drive first.")
        
        access_token = await get_access_token(drive_config)
        root_folder_id = drive_config.get("folderId")
        
        if not root_folder_id:
            raise HTTPException(status_code=400, detail="No root folder configured in Google Drive settings")
        
        logger.info("📁 Initializing Google Drive folder structure...")
        
        # Create main folders under root
        team_logos_id = await find_or_create_folder(access_token, "Team Logos", root_folder_id)
        league_gallery_id = await find_or_create_folder(access_token, "League Gallery", root_folder_id)
        teams_folder_id = await find_or_create_folder(access_token, "Teams", root_folder_id)
        
        # Store the folder structure
        folder_structure = {
            "id": "league_structure",
            "root_folder_id": root_folder_id,
            "team_logos_folder_id": team_logos_id,
            "league_gallery_folder_id": league_gallery_id,
            "teams_folder_id": teams_folder_id,
            "team_folders": {},
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.drive_folders.replace_one(
            {"id": "league_structure"},
            folder_structure,
            upsert=True
        )
        
        logger.info(f"✅ Folder structure initialized: Logos={team_logos_id}, Gallery={league_gallery_id}, Teams={teams_folder_id}")
        
        return {
            "status": "success",
            "message": "Folder structure initialized",
            "folders": {
                "root": root_folder_id,
                "team_logos": team_logos_id,
                "league_gallery": league_gallery_id,
                "teams": teams_folder_id
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error initializing folder structure: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@drive_router.post("/folders/team/{team_id}")
async def create_team_folders(team_id: str):
    """Create folder structure for a specific team"""
    try:
        drive_config = await get_drive_config()
        if not drive_config:
            raise HTTPException(status_code=400, detail="Google Drive not configured")
        
        # Get team info
        team = await db.teams.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        team_name = team.get("name", f"Team_{team_id}")
        
        # Get folder structure
        folder_structure = await db.drive_folders.find_one({"id": "league_structure"})
        if not folder_structure or not folder_structure.get("teams_folder_id"):
            raise HTTPException(status_code=400, detail="Please initialize folder structure first")
        
        access_token = await get_access_token(drive_config)
        teams_folder_id = folder_structure["teams_folder_id"]
        
        # Create team's main folder
        team_folder_id = await find_or_create_folder(access_token, team_name, teams_folder_id)
        
        if team_folder_id:
            # Create subfolders
            player_photos_id = await find_or_create_folder(access_token, "Player Photos", team_folder_id)
            team_gallery_id = await find_or_create_folder(access_token, "Team Gallery", team_folder_id)
            
            # Update folder structure in database
            folder_structure["team_folders"] = folder_structure.get("team_folders", {})
            folder_structure["team_folders"][team_id] = {
                "team_name": team_name,
                "folder_id": team_folder_id,
                "player_photos_folder_id": player_photos_id,
                "team_gallery_folder_id": team_gallery_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            folder_structure["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            await db.drive_folders.replace_one(
                {"id": "league_structure"},
                folder_structure,
                upsert=True
            )
            
            # Also update team record with folder info
            await db.teams.update_one(
                {"id": team_id},
                {"$set": {
                    "driveFolders": {
                        "main": team_folder_id,
                        "playerPhotos": player_photos_id,
                        "gallery": team_gallery_id
                    }
                }}
            )
            
            logger.info(f"✅ Created folders for team {team_name}: Main={team_folder_id}")
            
            return {
                "status": "success",
                "message": f"Folders created for {team_name}",
                "folders": {
                    "main": team_folder_id,
                    "player_photos": player_photos_id,
                    "team_gallery": team_gallery_id
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create team folder")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating team folders: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@drive_router.get("/folders/team/{team_id}")
async def get_team_folders(team_id: str):
    """Get folder IDs for a specific team"""
    try:
        folder_structure = await db.drive_folders.find_one({"id": "league_structure"})
        if not folder_structure:
            return {"status": "not_initialized", "folders": None}
        
        team_folders = folder_structure.get("team_folders", {}).get(team_id)
        if not team_folders:
            return {"status": "not_created", "folders": None}
        
        return {
            "status": "ok",
            "folders": team_folders
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting team folders: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@drive_router.delete("/cleanup/orphaned")
async def cleanup_orphaned_data():
    """Clean up galleries and media linked to deleted teams"""
    try:
        # Get all current team IDs
        teams = await db.teams.find({}, {"id": 1}).to_list(None)
        valid_team_ids = {team["id"] for team in teams}
        valid_team_ids.add(None)  # League-level items have no teamId
        valid_team_ids.add("")    # Some might have empty string
        
        cleanup_report = {
            "galleries_removed": 0,
            "media_items_removed": 0,
            "player_photos_removed": 0,
            "folder_references_removed": 0
        }
        
        # Clean up galleries with orphaned teamIds
        orphan_galleries = await db.galleries_new.find({
            "teamId": {"$nin": list(valid_team_ids), "$ne": None}
        }).to_list(None)
        
        if orphan_galleries:
            gallery_ids = [g["id"] for g in orphan_galleries]
            result = await db.galleries_new.delete_many({
                "teamId": {"$nin": list(valid_team_ids), "$ne": None}
            })
            cleanup_report["galleries_removed"] = result.deleted_count
            logger.info(f"🗑️ Removed {result.deleted_count} orphaned galleries")
        
        # Clean up old galleries collection too
        try:
            result = await db.galleries.delete_many({
                "teamId": {"$nin": list(valid_team_ids), "$ne": None}
            })
            cleanup_report["galleries_removed"] += result.deleted_count
        except:
            pass
        
        # Clean up folder structure references
        folder_structure = await db.drive_folders.find_one({"id": "league_structure"})
        if folder_structure and folder_structure.get("team_folders"):
            team_folders = folder_structure["team_folders"]
            orphan_folder_teams = [tid for tid in team_folders.keys() if tid not in valid_team_ids]
            
            for tid in orphan_folder_teams:
                del team_folders[tid]
                cleanup_report["folder_references_removed"] += 1
            
            if orphan_folder_teams:
                folder_structure["team_folders"] = team_folders
                folder_structure["updated_at"] = datetime.now(timezone.utc).isoformat()
                await db.drive_folders.replace_one(
                    {"id": "league_structure"},
                    folder_structure
                )
                logger.info(f"🗑️ Removed {len(orphan_folder_teams)} orphaned folder references")
        
        # Clean up any orphaned user teamAssignments
        # (Users assigned to teams that no longer exist)
        
        return {
            "status": "success",
            "message": "Orphaned data cleaned up",
            "report": cleanup_report
        }
        
    except Exception as e:
        logger.error(f"❌ Error cleaning up orphaned data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@drive_router.get("/cleanup/preview")
async def preview_cleanup():
    """Preview what would be cleaned up without actually deleting"""
    try:
        # Get all current team IDs
        teams = await db.teams.find({}, {"id": 1, "name": 1}).to_list(None)
        valid_team_ids = {team["id"] for team in teams}
        valid_team_ids.add(None)
        valid_team_ids.add("")
        
        preview = {
            "orphaned_galleries": [],
            "orphaned_folder_references": [],
            "valid_teams": [{"id": t["id"], "name": t.get("name", "Unknown")} for t in teams]
        }
        
        # Find orphaned galleries
        orphan_galleries = await db.galleries_new.find({
            "teamId": {"$nin": list(valid_team_ids), "$ne": None}
        }, {"_id": 0, "id": 1, "name": 1, "teamId": 1}).to_list(None)
        preview["orphaned_galleries"] = orphan_galleries
        
        # Find orphaned folder references
        folder_structure = await db.drive_folders.find_one({"id": "league_structure"})
        if folder_structure and folder_structure.get("team_folders"):
            for tid, folder_info in folder_structure["team_folders"].items():
                if tid not in valid_team_ids:
                    preview["orphaned_folder_references"].append({
                        "team_id": tid,
                        "team_name": folder_info.get("team_name", "Unknown"),
                        "folder_id": folder_info.get("folder_id")
                    })
        
        return preview
        
    except Exception as e:
        logger.error(f"❌ Error previewing cleanup: {e}")
        raise HTTPException(status_code=500, detail=str(e))
