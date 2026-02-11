"""
Media Router - Handles galleries, YouTube, uploads, proxy-image, cloud storage
Extracted from server.py during backend refactoring
"""
from fastapi import APIRouter, HTTPException, File, UploadFile
from fastapi.responses import Response, JSONResponse
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import uuid
import os
import logging

logger = logging.getLogger("server")

media_router = APIRouter(tags=["media"])

db = None

def set_db(database):
    global db
    db = database

@media_router.get("/proxy-image")
async def proxy_image(url: str):
    """Proxy images to avoid CORS issues for color extraction"""
    try:
        import urllib.request
        import urllib.parse
        
        # Decode URL if it's encoded
        decoded_url = urllib.parse.unquote(url)
        
        # Security: Only allow image URLs from trusted sources
        allowed_domains = [
            "drive.google.com",
            "googleusercontent.com",
            "emergent.host",
            "localhost",
            "127.0.0.1"
        ]
        
        is_allowed = any(domain in decoded_url for domain in allowed_domains)
        
        # Also allow if it's a relative URL (starts with /api/uploads)
        if decoded_url.startswith("/api/uploads") or decoded_url.startswith("http://localhost"):
            is_allowed = True
        
        if not is_allowed:
            raise HTTPException(status_code=400, detail="URL domain not allowed. Supported: Google Drive, Emergent hosted images")
        
        # Handle relative URLs by prepending the backend URL
        if decoded_url.startswith("/api/uploads"):
            # This is a local upload, read directly from disk
            filename = decoded_url.replace("/api/uploads/", "")
            file_path = f"/app/uploads/{filename}"
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    image_data = f.read()
                # Determine content type from extension
                ext = filename.split('.')[-1].lower()
                content_types = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp'}
                content_type = content_types.get(ext, 'image/jpeg')
            else:
                raise HTTPException(status_code=404, detail="Image not found")
        else:
            # Fetch the image from URL
            request = urllib.request.Request(decoded_url)
            request.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            with urllib.request.urlopen(request, timeout=10) as response:
                image_data = response.read()
                content_type = response.headers.get('Content-Type', 'image/jpeg')
        
        # Return with proper CORS headers
        from fastapi.responses import Response
        
        return Response(
            content=image_data,
            media_type=content_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*",
                "Cache-Control": "public, max-age=3600"
            }
        )
        
    except HTTPException:
        # Re-raise HTTPExceptions (like our 400 security validation) without modification
        raise
    except Exception as e:
        logger.error(f"❌ Error proxying image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch image: {str(e)}")

@media_router.post("/league-logo-upload")
async def upload_league_logo(file: UploadFile = File(...)):
    """Upload league logo to Google Drive"""
    try:
        # Get Google Drive configuration
        config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
        
        if not config:
            raise HTTPException(status_code=400, detail="Google Drive not configured")
            
        google_drive_config = config.get("googleDrive", {})
        
        if not google_drive_config.get("refreshToken"):
            raise HTTPException(status_code=400, detail="Google Drive not authorized")
        
        refresh_token = google_drive_config["refreshToken"]
        main_folder_id = google_drive_config.get("folderId")
        
        # Get fresh access token
        access_token = await get_fresh_access_token(google_drive_config, refresh_token)
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Check file size (5MB limit)
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")
        
        # Create unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"league_logo_{str(uuid.uuid4())[:8]}.{file_extension}"
        
        # Create "League Images" folder if it doesn't exist
        league_folder_id = await create_organized_folder(access_token, main_folder_id, "League Images")
        
        # Upload to Google Drive
        upload_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
        
        metadata = {
            'name': unique_filename,
            'parents': [league_folder_id]
        }
        
        files_data = {
            'metadata': (None, json.dumps(metadata), 'application/json'),
            'file': (unique_filename, content, file.content_type)
        }
        
        headers = {'Authorization': f'Bearer {access_token}'}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(upload_url, headers=headers, files=files_data)
        
        if response.status_code != 200:
            logger.error(f"Google Drive upload failed: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail="Failed to upload logo to Google Drive")
        
        file_data = response.json()
        file_id = file_data['id']
        
        # File is uploaded and accessible via Google Drive
        
        # Generate public URL using thumbnail format
        photo_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1000"
        
        logger.info(f"✅ League logo uploaded successfully - ID: {file_id}")
        
        return {
            "success": True,
            "photo_url": photo_url,
            "filename": unique_filename,
            "file_size": file_size,
            "google_drive_id": file_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uploading league logo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@media_router.post("/upload/image")
async def upload_general_image(
    file: UploadFile = File(...),
    type: str = Form("general")
):
    """Upload an image (event, team, etc.) to Google Drive or local storage"""
    try:
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Check file size (5MB limit)
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")
        
        # Validate image type
        content_type = file.content_type
        if not content_type or not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed")
        
        # Try Google Drive upload first
        try:
            config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
            
            if config and config.get("googleDrive", {}).get("refreshToken"):
                google_drive_config = config["googleDrive"]
                refresh_token = google_drive_config["refreshToken"]
                main_folder_id = google_drive_config.get("folderId")
                
                # Get fresh access token
                access_token = await get_fresh_access_token(google_drive_config, refresh_token)
                
                # Create unique filename
                timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
                extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
                filename = f"{type}_{timestamp}.{extension}"
                
                # Upload to Google Drive
                upload_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
                
                metadata = {
                    "name": filename,
                    "parents": [main_folder_id] if main_folder_id else []
                }
                
                headers = {
                    "Authorization": f"Bearer {access_token}"
                }
                
                import httpx
                import json
                
                files_data = {
                    "metadata": (None, json.dumps(metadata), "application/json"),
                    "file": (filename, content, content_type)
                }
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(upload_url, headers=headers, files=files_data)
                    
                    if response.status_code not in [200, 201]:
                        logger.error(f"Google Drive upload failed: {response.status_code} - {response.text}")
                        raise Exception("Drive upload failed")
                    
                    result = response.json()
                    file_id = result.get("id")
                    
                    # Make file public - this is CRITICAL for the URL to work
                    permission_url = f"https://www.googleapis.com/drive/v3/files/{file_id}/permissions"
                    permission_data = {"role": "reader", "type": "anyone"}
                    perm_response = await client.post(permission_url, headers=headers, json=permission_data)
                    
                    if perm_response.status_code not in [200, 201]:
                        logger.warning(f"⚠️ Failed to set public permission for file {file_id}: {perm_response.status_code} - {perm_response.text}")
                        # Since permission failed, use proxy URL instead
                        public_url = f"https://lh3.googleusercontent.com/d/{file_id}"
                    else:
                        logger.info(f"✅ File {file_id} made public")
                        # Use the direct lh3 URL which is more reliable than drive.google.com/uc
                        public_url = f"https://lh3.googleusercontent.com/d/{file_id}"
                    
                    logger.info(f"✅ Image uploaded to Google Drive: {file_id}, URL: {public_url}")
                    
                    return {
                        "url": public_url,
                        "file_id": file_id,
                        "filename": filename,
                        "storage": "google_drive"
                    }
                    
        except Exception as drive_error:
            logger.warning(f"Google Drive upload failed, falling back to local: {drive_error}")
        
        # Fallback: Save locally
        import os
        import base64
        
        upload_dir = "/app/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        filename = f"{type}_{timestamp}.{extension}"
        filepath = os.path.join(upload_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(content)
        
        # Return local URL (will be served by static files under /api/uploads)
        local_url = f"/api/uploads/{filename}"
        
        logger.info(f"✅ Image saved locally: {filepath}")
        
        return {
            "url": local_url,
            "filename": filename,
            "storage": "local"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.post("/league-background-upload")
async def upload_league_background(file: UploadFile = File(...)):
    """Upload league background image to Google Drive"""
    try:
        # Get Google Drive configuration
        config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
        
        if not config:
            raise HTTPException(status_code=400, detail="Google Drive not configured")
            
        google_drive_config = config.get("googleDrive", {})
        
        if not google_drive_config.get("refreshToken"):
            raise HTTPException(status_code=400, detail="Google Drive not authorized")
        
        refresh_token = google_drive_config["refreshToken"]
        main_folder_id = google_drive_config.get("folderId")
        
        # Get fresh access token
        access_token = await get_fresh_access_token(google_drive_config, refresh_token)
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Check file size (10MB limit for backgrounds)
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        # Create unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"league_bg_{str(uuid.uuid4())[:8]}.{file_extension}"
        
        # Create "League Images" folder if it doesn't exist
        league_folder_id = await create_organized_folder(access_token, main_folder_id, "League Images")
        
        # Upload to Google Drive
        upload_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
        
        metadata = {
            'name': unique_filename,
            'parents': [league_folder_id]
        }
        
        files_data = {
            'metadata': (None, json.dumps(metadata), 'application/json'),
            'file': (unique_filename, content, file.content_type)
        }
        
        headers = {'Authorization': f'Bearer {access_token}'}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(upload_url, headers=headers, files=files_data)
        
        if response.status_code != 200:
            logger.error(f"Google Drive upload failed: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail="Failed to upload background to Google Drive")
        
        file_data = response.json()
        file_id = file_data['id']
        
        # File is uploaded and accessible via Google Drive
        
        # Generate public URL using thumbnail format for large images
        photo_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w2000"
        
        logger.info(f"✅ League background uploaded successfully - ID: {file_id}")
        
        return {
            "success": True,
            "photo_url": photo_url,
            "filename": unique_filename,
            "file_size": file_size,
            "google_drive_id": file_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uploading league background: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.post("/player-photo-upload")
async def upload_player_photo(file: UploadFile = File(...)):
    """Upload a player photo to Google Drive with organized folder structure"""
    try:
        logger.info(f"📸 Player photo upload started - File: {file.filename}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Check file size (5MB limit)
        content = await file.read()
        file_size = len(content)
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Get Google Drive configuration
        config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
        
        if not config:
            raise HTTPException(status_code=400, detail="Google Drive not configured")
            
        google_drive_config = config.get("googleDrive", {})
        
        if not google_drive_config.get("refreshToken"):
            raise HTTPException(status_code=400, detail="Google Drive not authorized")
        
        refresh_token = google_drive_config["refreshToken"]
        main_folder_id = google_drive_config.get("folderId")
        
        # Get fresh access token
        access_token = await get_fresh_access_token(google_drive_config, refresh_token)
        
        # Create or get "Player Images" folder
        player_folder_id = await create_organized_folder(access_token, main_folder_id, "Player Images")
        logger.info(f"📁 Player Images folder ID: {player_folder_id}")
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
        unique_filename = f"player_photo_{uuid.uuid4()}{file_extension}"
        
        # Upload to Google Drive in Player Images folder
        upload_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
        
        # Create metadata - upload to Player Images folder
        metadata = {
            'name': unique_filename,
            'parents': [player_folder_id]  # Upload to Player Images folder
        }
        
        # Create multipart data
        files_data = {
            'metadata': (None, json.dumps(metadata), 'application/json'),
            'file': (file.filename, content, file.content_type)
        }
        
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        async with httpx.AsyncClient() as client:
            upload_response = await client.post(upload_url, headers=headers, files=files_data)
        
        if upload_response.status_code != 200:
            logger.error(f"❌ Google Drive upload failed: {upload_response.status_code} - {upload_response.text}")
            raise HTTPException(status_code=500, detail="Failed to upload photo to Google Drive")
        
        upload_data = upload_response.json()
        file_id = upload_data.get('id')
        
        # Make file publicly viewable
        permissions_url = f"https://www.googleapis.com/drive/v3/files/{file_id}/permissions"
        permission_data = {
            'role': 'reader',
            'type': 'anyone'
        }
        
        async with httpx.AsyncClient() as client:
            permissions_response = await client.post(
                permissions_url,
                headers=headers,
                json=permission_data
            )
        
        if permissions_response.status_code != 200:
            logger.error(f"⚠️ Failed to set public permissions on file {file_id}: {permissions_response.status_code} - {permissions_response.text}")
            # Continue anyway - file is uploaded, just may not be publicly accessible
        else:
            logger.info(f"✅ File {file_id} set to public access")
        
        # Generate public URL - use thumbnail format for better image loading
        photo_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1000"
        
        logger.info(f"✅ Player photo uploaded successfully - ID: {file_id}")
        logger.info(f"📸 Thumbnail URL: {photo_url}")
        
        return {
            "success": True,
            "photo_url": photo_url,
            "filename": unique_filename,
            "file_size": file_size,
            "google_drive_id": file_id
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uploading player photo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.get("/league-data/teams/{team_id}")
async def get_single_team(team_id: str):
    """Get a single team by ID with all its data."""
    try:
        # First check the teams collection (primary source)
        team = await db.teams.find_one({"id": team_id}, {"_id": 0})
        
        if team:
            logger.info(f"✅ Found team in teams collection: {team_id}")
            return team
        
        # Fallback: Check league_data
        league_data = await db.league_data.find_one({"id": "main_league"})
        if league_data:
            teams = league_data.get("teams", [])
            for t in teams:
                if t.get("id") == team_id:
                    logger.info(f"✅ Found team in league_data: {team_id}")
                    return t
        
        raise HTTPException(status_code=404, detail=f"Team not found: {team_id}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting team: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.put("/league-data/teams/{team_id}")
async def update_team_data(team_id: str, team_data: Dict[str, Any]):
    """Update specific team data including logo, style, social media, etc."""
    try:
        # Update the team in league_data using $set to avoid _id conflicts
        league_data = await db.league_data.find_one({"id": "main_league"})
        if not league_data:
            league_data = {
                "id": "main_league",
                "teams": [],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {},
                "websiteStyle": {}
            }
        
        # Find and update the specific team in league_data
        teams = league_data.get("teams", [])
        team_found = False
        
        for i, team in enumerate(teams):
            if team.get("id") == team_id:
                teams[i] = {**team, **team_data}
                team_found = True
                logger.info(f"Updated existing team in league_data: {team_id}")
                break
        
        if not team_found:
            team_data["id"] = team_id
            teams.append(team_data)
            logger.info(f"Added new team to league_data: {team_id}")
        
        # Use $set instead of replace_one to avoid _id conflicts
        await db.league_data.update_one(
            {"id": "main_league"},
            {"$set": {
                "teams": teams,
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        # ALSO update the teams collection with style data
        teams_collection_update = {}
        
        if "style" in team_data:
            style = team_data["style"]
            teams_collection_update["color"] = style.get("primaryColor", "#3b82f6")
            teams_collection_update["secondary_color"] = style.get("secondaryColor", "")
            teams_collection_update["accent_color"] = style.get("accentColor", "")
            teams_collection_update["logo"] = style.get("logoUrl", "")
            teams_collection_update["style"] = style  # Store full style object
        
        if "socialMedia" in team_data:
            teams_collection_update["socialMedia"] = team_data["socialMedia"]
        
        if "paymentLinks" in team_data:
            teams_collection_update["paymentLinks"] = team_data["paymentLinks"]
        
        if teams_collection_update:
            teams_collection_update["updatedAt"] = datetime.now(timezone.utc).isoformat()
            await db.teams.update_one(
                {"id": team_id},
                {"$set": teams_collection_update}
            )
            logger.info(f"Also updated teams collection for: {team_id}")
        
        logger.info(f"Team {team_id} data saved successfully")
        
        return {
            "status": "success",
            "message": f"Team {team_id} updated successfully",
            "team_data": team_data
        }
        
    except Exception as e:
        logger.error(f"Error updating team {team_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Gallery endpoints moved to bottom of file to avoid duplicates

# Helper function for Google Drive token management
async def get_fresh_access_token(google_drive_config: Dict[str, Any], refresh_token: str) -> str:
    """Get or refresh Google Drive access token"""
    try:
        import requests as token_requests
        token_data = {
            'client_id': google_drive_config["clientId"],
            'client_secret': google_drive_config["clientSecret"],
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }
        
        logger.info("🔄 Refreshing Google Drive access token...")
        refresh_response = token_requests.post(
            'https://oauth2.googleapis.com/token',
            data=token_data,
            timeout=15
        )
        
        logger.info(f"🔄 Token refresh response: {refresh_response.status_code}")
        
        if refresh_response.status_code != 200:
            error_data = refresh_response.json()
            logger.error(f"❌ Token refresh failed: {error_data}")
            
            # Provide more specific error messages
            error_type = error_data.get('error', 'unknown_error')
            if error_type == 'invalid_grant':
                error_msg = "Google Drive refresh token is invalid or expired. Please re-authorize the application."
            elif error_type == 'invalid_client':
                error_msg = "Google Drive client credentials are invalid. Please check your OAuth configuration."
            else:
                error_msg = f"Google Drive token refresh failed: {error_data.get('error_description', error_type)}"
            
            raise HTTPException(status_code=400, detail=error_msg)
        
        tokens = refresh_response.json()
        access_token = tokens.get('access_token', '')
        logger.info(f"✅ Token refreshed successfully - Access token length: {len(access_token)}")
        
        return access_token
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error refreshing access token: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh access token: {str(e)}")

# Debug endpoint to check database contents
@media_router.get("/debug/galleries")
async def debug_galleries():
    """Debug endpoint to see all galleries and their media items"""
    try:
        # Check all collections
        galleries_new = await db.galleries_new.find().to_list(length=None)
        
        # Try to access old galleries collection if it exists
        try:
            galleries_old = await db.galleries.find().to_list(length=None)
        except:
            galleries_old = []
        
        # Format the results
        result = {
            "galleries_new": {
                "count": len(galleries_new),
                "galleries": []
            },
            "galleries_old": {
                "count": len(galleries_old),
                "galleries": []
            }
        }
        
        # Process new galleries
        for gallery in galleries_new:
            gallery.pop('_id', None)
            media_items_info = []
            for item in gallery.get('mediaItems', []):
                media_items_info.append({
                    "filename": item.get('filename'),
                    "url": item.get('url'),
                    "thumbnailUrl": item.get('thumbnailUrl'),
                    "googleDriveId": item.get('googleDriveId')
                })
            
            result["galleries_new"]["galleries"].append({
                "id": gallery.get('id'),
                "name": gallery.get('name'),
                "mediaItemsCount": len(gallery.get('mediaItems', [])),
                "mediaItems": media_items_info
            })
        
        # Process old galleries
        for gallery in galleries_old:
            gallery.pop('_id', None)
            media_items_info = []
            for item in gallery.get('mediaItems', []):
                media_items_info.append({
                    "filename": item.get('filename'),
                    "url": item.get('url'),
                    "thumbnailUrl": item.get('thumbnailUrl'),
                    "googleDriveId": item.get('googleDriveId')
                })
            
            result["galleries_old"]["galleries"].append({
                "id": gallery.get('id'),
                "name": gallery.get('name'),
                "mediaItemsCount": len(gallery.get('mediaItems', [])),
                "mediaItems": media_items_info
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Debug error: {e}")
        return {"error": str(e)}
async def handle_drive_error(response, operation: str) -> str:
    """Handle Google Drive API errors and provide meaningful messages"""
    try:
        error_data = response.json() if response.content else {}
        error_msg = error_data.get('error', {}).get('message', 'Unknown error')
        
        if response.status_code == 401:
            return f"Google Drive authentication failed during {operation}. Token may be expired."
        elif response.status_code == 403:
            return f"Google Drive access denied for {operation}. Check permissions and quotas."
        elif response.status_code == 404:
            return f"Google Drive resource not found during {operation}."
        elif response.status_code == 429:
            return f"Google Drive API rate limit exceeded for {operation}. Please try again later."
        else:
            return f"Google Drive {operation} failed with status {response.status_code}: {error_msg}"
    except:
        return f"Google Drive {operation} failed with status {response.status_code}"

# Google Drive Upload Endpoint - Updated for new gallery system
@media_router.post("/cloud-storage/google-drive/upload-and-create-gallery")
async def upload_and_create_gallery(
    files: List[UploadFile] = File(...),
    gallery_name: str = Form(...),
    gallery_description: str = Form(""),
    visibility: str = Form("all_pages"),
    status: str = Form("active"),
    selected_teams: List[str] = Form([]),
    context_team_id: Optional[str] = Form(None),
    expiration_date: Optional[str] = Form(None)
):
    """Upload files to Google Drive and create a gallery with those files"""
    logger.info(f"🚀 UPLOAD ENDPOINT CALLED - Gallery: {gallery_name}")
    logger.info(f"🚀 Files received: {len(files)}")
    logger.info(f"🚀 Context Team ID: {context_team_id}")
    logger.info(f"🚀 Selected Teams: {selected_teams}")
    logger.info(f"🚀 Visibility: {visibility}")
    
    try:
        # Validate inputs
        if not files or len(files) == 0:
            raise HTTPException(status_code=400, detail="No files provided for upload")
            
        if not gallery_name or not gallery_name.strip():
            raise HTTPException(status_code=400, detail="Gallery name is required")
        
        # Get Google Drive configuration
        logger.info("🔍 Looking for Google Drive configuration...")
        config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
        logger.info(f"🔍 Config found: {config is not None}")
        
        if not config:
            logger.error("❌ No cloud storage config found in database")
            raise HTTPException(status_code=400, detail="Google Drive not configured - no config found")
            
        google_drive_config = config.get("googleDrive", {})
        logger.info(f"🔍 Google Drive config exists: {bool(google_drive_config)}")
        logger.info(f"🔍 Refresh token exists: {bool(google_drive_config.get('refreshToken'))}")
        
        if not google_drive_config.get("refreshToken"):
            logger.error("❌ No refresh token found in Google Drive config")
            raise HTTPException(status_code=400, detail="Google Drive not authorized - no refresh token")
        
        google_drive_config = config["googleDrive"]
        refresh_token = google_drive_config["refreshToken"]
        folder_id = google_drive_config.get("folderId")
        folder_name = google_drive_config.get("folderName", "MLBLGallery2")
        
        logger.info(f"🔧 Drive config - Folder ID: {folder_id}")
        logger.info(f"🔧 Drive config - Refresh token length: {len(refresh_token) if refresh_token else 0}")
        
        # If no folder ID, create/find the main folder
        if not folder_id:
            logger.warning("⚠️ No folder ID found - creating main folder")
        
        # Get or refresh access token
        access_token = await get_fresh_access_token(google_drive_config, refresh_token)
        
        # If no folder ID, create/find the main folder now with fresh access token
        if not folder_id:
            folder_id = await create_main_folder(access_token, folder_name)
            
            # Update the configuration with the folder ID
            config["googleDrive"]["folderId"] = folder_id
            await db.cloud_storage.replace_one(
                {"id": "main_cloud_storage"},
                config,
                upsert=True
            )
            logging.info(f"✅ Folder ID saved to database: {folder_id}")
        
        # Create gallery-specific folder
        gallery_folder_id = await create_gallery_folder(access_token, folder_id, gallery_name)
        logger.info(f"📁 Gallery folder created: {gallery_folder_id}")
        
        # Create credentials with the fresh access token
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=google_drive_config["clientId"],
            client_secret=google_drive_config["clientSecret"]
        )
        
        # Upload files to Google Drive with retry on token expiration
        uploaded_media_items = []
        import requests
        
        for i, file in enumerate(files):
            try:
                logger.info(f"📁 Uploading file {i+1}/{len(files)}: {file.filename}")
                
                # Read file content
                file_content = await file.read()
                logger.info(f"📁 File content read - Size: {len(file_content)} bytes")
                
                # Upload to Google Drive with retry logic
                upload_success = False
                retry_count = 0
                max_retries = 2
                
                while not upload_success and retry_count <= max_retries:
                    upload_response = requests.post(
                        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                        headers={'Authorization': f'Bearer {access_token}'},
                        files={
                            'metadata': (None, json.dumps({
                                'name': file.filename,
                                'parents': [gallery_folder_id]  # Use gallery-specific folder
                            }), 'application/json'),
                            'data': (file.filename, file_content, file.content_type)
                        },
                        timeout=30
                    )
                    
                    logger.info(f"📁 Google Drive upload response: {upload_response.status_code} (attempt {retry_count + 1})")
                    
                    if upload_response.status_code == 200:
                        upload_success = True
                    elif upload_response.status_code == 401 and retry_count < max_retries:
                        # Token expired, refresh and retry
                        logger.warning(f"🔄 Token expired during upload, refreshing... (retry {retry_count + 1})")
                        access_token = await get_fresh_access_token(google_drive_config, refresh_token)
                        retry_count += 1
                    else:
                        # Other error or max retries reached
                        break
                
                if upload_response.status_code == 200:
                    file_data = upload_response.json()
                    drive_file_id = file_data['id']
                    
                    # Make the file publicly accessible
                    try:
                        make_file_public_response = requests.post(
                            f'https://www.googleapis.com/drive/v3/files/{drive_file_id}/permissions',
                            headers={'Authorization': f'Bearer {access_token}'},
                            json={
                                'role': 'reader',
                                'type': 'anyone'
                            },
                            timeout=15
                        )
                        
                        if make_file_public_response.status_code == 200:
                            logger.info(f"✅ File made public: {drive_file_id}")
                        else:
                            logger.warning(f"⚠️ Could not make file public: {make_file_public_response.status_code}")
                    except Exception as perm_error:
                        logger.warning(f"⚠️ Error making file public: {perm_error}")
                    
                    # Create media item dictionary with proper public URLs
                    media_item = {
                        "id": str(uuid.uuid4()),
                        "filename": file.filename,
                        "url": f"https://drive.google.com/thumbnail?id={drive_file_id}&sz=w1000",  # Thumbnail format for better loading
                        "thumbnailUrl": f"https://drive.google.com/thumbnail?id={drive_file_id}&sz=w400",  # Smaller thumbnail
                        "googleDriveId": drive_file_id,
                        "type": "image" if file.content_type.startswith("image/") else "video" if file.content_type.startswith("video/") else "file",
                        "size": len(file_content),
                        "uploadedAt": datetime.now(timezone.utc).isoformat()
                    }
                    
                    uploaded_media_items.append(media_item)
                    logger.info(f"✅ File uploaded: {file.filename} -> {drive_file_id}")
                else:
                    error_msg = await handle_drive_error(upload_response, "file upload")
                    logger.error(f"❌ Upload failed for {file.filename}: {error_msg}")
                    # Continue with other files rather than failing completely
                    
            except Exception as file_error:
                logger.error(f"❌ Error uploading file {file.filename}: {file_error}")
                import traceback
                logger.error(f"❌ File upload traceback: {traceback.format_exc()}")
                continue
        
        if not uploaded_media_items:
            raise HTTPException(status_code=400, detail="No files were successfully uploaded to Google Drive")
        
        # Determine gallery type based on uploaded files
        has_images = any(item["type"] == "image" for item in uploaded_media_items)
        has_videos = any(item["type"] == "video" for item in uploaded_media_items)
        gallery_type = "video" if has_videos and not has_images else "photo"
        
        logger.info(f"📡 Gallery type determined: {gallery_type} (images: {has_images}, videos: {has_videos})")
        
        # Create gallery with uploaded files using NEW system
        # Handle team assignment based on new parameters
        team_id = context_team_id if context_team_id and context_team_id != "league-wide" else None
        
        gallery_data = {
            "name": gallery_name,
            "description": gallery_description,
            "type": "photo",  # Default type
            "visibility": visibility,
            "status": status,
            "teamId": team_id,
            "selectedTeams": selected_teams,  # Store selected teams for multi-team galleries
            "googleDriveFolderId": gallery_folder_id,  # Store gallery folder ID
            "expirationDate": None,
            "mediaItems": uploaded_media_items  # Already dictionaries, no need for .dict()
        }
        
        # Parse expiration date if provided
        if expiration_date:
            try:
                parsed_date = datetime.fromisoformat(expiration_date.replace('T', ' ').replace('Z', '+00:00'))
                gallery_data["expirationDate"] = parsed_date.isoformat()
            except ValueError:
                logger.warning(f"⚠️ Invalid expiration date format: {expiration_date}")
                # Continue without expiration date
        
        logger.info(f"📡 Creating gallery using NEW system: {gallery_name}")
        
        # Try to create gallery, but don't fail if it doesn't work
        try:
            result = await create_gallery_new(gallery_data)
            gallery_dict = result["gallery"]
            logger.info(f"🎉 Gallery created successfully: {gallery_dict['id']} with {len(uploaded_media_items)} items")
            
            return {
                "status": "success",
                "message": f"Successfully uploaded {len(uploaded_media_items)} files and created gallery '{gallery_name}'",
                "uploadedFiles": len(uploaded_media_items),
                "gallery": gallery_dict,
                "galleryId": gallery_dict["id"]
            }
        except Exception as gallery_error:
            logger.error(f"❌ Gallery creation failed but files uploaded successfully: {gallery_error}")
            
            # Return success anyway since files are uploaded
            return {
                "status": "success",
                "message": f"Successfully uploaded {len(uploaded_media_items)} files to Google Drive. Gallery creation pending.",
                "uploadedFiles": len(uploaded_media_items),
                "warning": "Gallery creation failed but files are safely stored in Google Drive"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in upload and create gallery: {e}")
        import traceback
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        
        # Return success anyway since files uploaded to Google Drive
        logger.info(f"🔄 Attempting to save files as basic gallery despite error")
        
        try:
            # Create a basic gallery entry manually to ensure data is saved
            team_id = context_team_id if context_team_id and context_team_id != "league-wide" else None
            
            basic_gallery = {
                "id": str(uuid.uuid4()),
                "name": gallery_name,
                "description": gallery_description or "Uploaded via Google Drive",
                "type": "photo",  # Default to photo
                "visibility": visibility,
                "teamId": team_id,
                "selectedTeams": selected_teams,
                "mediaItems": uploaded_media_items if 'uploaded_media_items' in locals() else [],
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "updatedAt": datetime.now(timezone.utc).isoformat()
            }
            
            await db.galleries_new.insert_one(basic_gallery)
            logger.info(f"✅ Basic gallery created successfully: {basic_gallery['id']}")
            
            return {
                "status": "success",
                "message": f"Successfully uploaded {len(uploaded_media_items) if 'uploaded_media_items' in locals() else 0} files and created gallery",
                "uploadedFiles": len(uploaded_media_items) if 'uploaded_media_items' in locals() else 0,
                "galleryId": basic_gallery["id"]
            }
            
        except Exception as final_error:
            logger.error(f"❌ Even basic gallery creation failed: {final_error}")
            return {
                "status": "partial_success",
                "message": f"Files uploaded to Google Drive successfully, but gallery creation failed",
                "uploadedFiles": len(uploaded_media_items) if 'uploaded_media_items' in locals() else 0
            }

# Helper function for folder creation
async def create_main_folder_helper(access_token: str, folder_name: str) -> str:
    """Create the main folder in Google Drive and return its ID"""
    try:
        from googleapiclient.discovery import build
        from google.oauth2.credentials import Credentials
        
        # Create credentials from access token
        creds = Credentials(token=access_token)
        service = build('drive', 'v3', credentials=creds)
        
        # Check if folder already exists
        results = service.files().list(
            q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="files(id, name)"
        ).execute()
        
        existing_folders = results.get('files', [])
        if existing_folders:
            logging.info(f"Google Drive folder '{folder_name}' already exists")
            return existing_folders[0]['id']
        
        # Create the folder
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        folder_id = folder.get('id')
        
        # Make the folder publicly readable (optional)
        permission = {
            'type': 'anyone',
            'role': 'reader'
        }
        service.permissions().create(fileId=folder_id, body=permission).execute()
        
        logging.info(f"Created Google Drive folder '{folder_name}' with ID: {folder_id}")
        return folder_id
        
    except Exception as e:
        logging.error(f"Error creating Google Drive folder: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create Drive folder: {str(e)}")

# Keep all other existing endpoints (league-data, etc.) - they remain unchanged
# ... [rest of the existing code continues as before]

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# NEW GALLERY SYSTEM - Clean implementation

# Test endpoint to verify basic functionality
@media_router.post("/galleries-test")
async def test_gallery_creation():
    """Simple test endpoint to verify basic functionality"""
    try:
        logger.info("🧪 Testing basic gallery creation...")
        
        test_data = {
            "id": str(uuid.uuid4()),
            "name": "Test Gallery",
            "description": "Test description",
            "type": "photo",
            "visibility": "public",
            "teamId": None,
            "mediaItems": [],
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"🧪 Test data created: {test_data}")
        return {"status": "success", "message": "Test data created", "data": test_data}
        
    except Exception as e:
        logger.error(f"🧪 Test error: {e}")
        import traceback
        logger.error(f"🧪 Test traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.get("/galleries")
async def get_galleries():
    """Get all galleries - Use galleries_new collection"""
    try:
        logger.info("📡 Getting galleries from database...")
        galleries = await db.galleries_new.find().to_list(length=None)
        
        # Convert MongoDB documents to proper format
        result_galleries = []
        for gallery in galleries:
            gallery.pop('_id', None)  # Remove MongoDB _id
            result_galleries.append(gallery)
        
        logger.info(f"📡 Retrieved {len(result_galleries)} galleries")
        return {"galleries": result_galleries}
    
    except Exception as e:
        logger.error(f"📡 Error getting galleries: {e}")
        return {"galleries": []}

@media_router.post("/galleries")
async def create_gallery_new(gallery_data: Dict[str, Any]):
    """Create a new gallery - New clean implementation"""
    try:
        logger.info(f"📡 Creating new gallery: {gallery_data.get('name', 'Unnamed')}")
        logger.info(f"📡 Input data: {gallery_data}")
        
        # Ensure required fields
        gallery_dict = {
            "id": str(uuid.uuid4()),
            "name": gallery_data.get("name", "New Gallery"),
            "description": gallery_data.get("description", ""),
            "type": gallery_data.get("type", "photo"),
            "visibility": gallery_data.get("visibility", "all_pages"),
            "status": gallery_data.get("status", "active"),
            "teamId": gallery_data.get("teamId"),
            "selectedTeams": gallery_data.get("selectedTeams", []),
            "googleDriveFolderId": gallery_data.get("googleDriveFolderId"),
            "expirationDate": gallery_data.get("expirationDate"),
            "mediaItems": gallery_data.get("mediaItems", []),
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"📡 Gallery dict before insert: {gallery_dict}")
        logger.info(f"📡 Using collection: db.galleries_new")
        
        result = await db.galleries_new.insert_one(gallery_dict)
        logger.info(f"📡 MongoDB insert result: {result}")
        logger.info(f"📡 Inserted ID: {result.inserted_id}")
        logger.info(f"📡 Gallery dict after insert: {gallery_dict}")
        
        # Remove MongoDB's _id field to prevent ObjectId serialization issues
        if '_id' in gallery_dict:
            removed_id = gallery_dict.pop('_id', None)
            logger.info(f"📡 Removed _id: {removed_id}")
        else:
            logger.info("📡 No _id field found in gallery_dict")
        
        logger.info(f"📡 Gallery dict for response: {gallery_dict}")
        
        response_data = {
            "status": "success",
            "message": "Gallery created successfully",
            "galleryId": gallery_dict["id"],
            "gallery": gallery_dict
        }
        
        logger.info(f"📡 Response data prepared: {response_data}")
        logger.info(f"📡 ✅ Gallery created successfully with ID: {gallery_dict['id']}")
        
        return response_data
        
    except Exception as e:
        logger.error(f"📡 Error creating gallery: {e}")
        logger.error(f"📡 Error type: {type(e)}")
        logger.error(f"📡 Error details: {str(e)}")
        import traceback
        logger.error(f"📡 Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

# MISSING ENDPOINTS - Add back critical endpoints
@media_router.get("/youtube-integration")
async def get_youtube_config():
    """Get YouTube integration configuration"""
    try:
        data = await db.youtube_integration.find_one({"id": "main_youtube"})
        if data:
            data.pop('_id', None)
            # Mask API key for security - only show if exists
            if data.get('apiKey'):
                data['apiKeyConfigured'] = True
                data['apiKeyMasked'] = '••••••••' + data['apiKey'][-4:] if len(data.get('apiKey', '')) > 4 else '••••••••'
            else:
                data['apiKeyConfigured'] = False
                data['apiKeyMasked'] = ''
            return data
        else:
            return {
                "id": "main_youtube",
                "channelId": "",
                "channelUrl": "",
                "apiKey": "",
                "apiKeyConfigured": False,
                "apiKeyMasked": "",
                "playlistIds": [],
                "enabled": False,
                "showLiveStreams": True,
                "showRecentVideos": True,
                "maxVideos": 12,
                "teamOverrides": {},
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
    except Exception as e:
        logger.error(f"Error fetching YouTube config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.post("/youtube-integration")
async def save_youtube_config(data: Dict[str, Any]):
    """Save YouTube integration configuration"""
    try:
        data["lastUpdated"] = datetime.now(timezone.utc).isoformat()
        
        # If apiKey is empty string or None, preserve existing key
        if not data.get('apiKey'):
            existing = await db.youtube_integration.find_one({"id": "main_youtube"})
            if existing and existing.get('apiKey'):
                data['apiKey'] = existing['apiKey']
        
        await db.youtube_integration.replace_one(
            {"id": "main_youtube"},
            data,
            upsert=True
        )
        return {"message": "YouTube integration configuration saved successfully", "timestamp": data["lastUpdated"]}
    except Exception as e:
        logger.error(f"Error saving YouTube config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to get YouTube service with API key from database
async def get_youtube_service_with_key():
    """Get YouTube service instance with API key loaded from database"""
    from services.youtube_service import YouTubeService
    
    # Try to get API key from database config
    config = await db.youtube_integration.find_one({"id": "main_youtube"})
    api_key = None
    
    if config and config.get('apiKey'):
        api_key = config['apiKey']
    
    # Fall back to environment variable if not in database
    if not api_key:
        api_key = os.environ.get('YOUTUBE_API_KEY')
    
    return YouTubeService(api_key=api_key)

# YouTube Video Fetching Endpoints
@media_router.get("/youtube/videos/{channel_id}")
async def get_youtube_videos(channel_id: str, max_results: int = 12):
    """Get videos from a YouTube channel"""
    try:
        service = await get_youtube_service_with_key()
        videos = await service.get_channel_videos(channel_id, max_results)
        return {"videos": videos, "channelId": channel_id}
    except Exception as e:
        logger.error(f"Error fetching YouTube videos: {e}")
        return {"videos": [], "error": str(e)}

@media_router.get("/youtube/channel/{channel_id}")
async def get_youtube_channel_info(channel_id: str):
    """Get YouTube channel information"""
    try:
        service = await get_youtube_service_with_key()
        info = await service.get_channel_info(channel_id)
        return info
    except Exception as e:
        logger.error(f"Error fetching YouTube channel info: {e}")
        return {"error": str(e)}

@media_router.get("/youtube/live/{channel_id}")
async def get_youtube_live_streams(channel_id: str):
    """Get current live streams from a channel"""
    try:
        service = await get_youtube_service_with_key()
        live_streams = await service.get_live_streams(channel_id)
        upcoming = await service.get_upcoming_streams(channel_id)
        return {
            "liveStreams": live_streams,
            "upcomingStreams": upcoming,
            "channelId": channel_id
        }
    except Exception as e:
        logger.error(f"Error fetching YouTube live streams: {e}")
        return {"liveStreams": [], "upcomingStreams": [], "error": str(e)}

@media_router.get("/youtube/playlist/{playlist_id}")
async def get_youtube_playlist_videos(playlist_id: str, max_results: int = 12):
    """Get videos from a YouTube playlist"""
    try:
        service = await get_youtube_service_with_key()
        videos = await service.get_playlist_videos(playlist_id, max_results)
        return {"videos": videos, "playlistId": playlist_id}
    except Exception as e:
        logger.error(f"Error fetching YouTube playlist videos: {e}")
        return {"videos": [], "error": str(e)}

@media_router.get("/youtube/video/{video_id}")
async def get_youtube_video_details(video_id: str):
    """Get detailed information about a specific video"""
    try:
        service = await get_youtube_service_with_key()
        details = await service.get_video_details(video_id)
        return details
    except Exception as e:
        logger.error(f"Error fetching YouTube video details: {e}")
        return {"error": str(e)}

@media_router.get("/youtube/playlists/{channel_id}")
async def get_youtube_channel_playlists(channel_id: str, max_results: int = 10):
    """Get playlists from a YouTube channel"""
    try:
        service = await get_youtube_service_with_key()
        playlists = await service.get_channel_playlists(channel_id, max_results)
        return {"playlists": playlists, "channelId": channel_id}
    except Exception as e:
        logger.error(f"Error fetching YouTube playlists: {e}")
        return {"playlists": [], "error": str(e)}

@media_router.get("/youtube/search/{channel_id}")
async def search_youtube_channel_videos(channel_id: str, q: str, max_results: int = 10):
    """Search for videos within a channel"""
    try:
        service = await get_youtube_service_with_key()
        videos = await service.search_videos(channel_id, q, max_results)
        return {"videos": videos, "query": q, "channelId": channel_id}
    except Exception as e:
        logger.error(f"Error searching YouTube videos: {e}")
        return {"videos": [], "error": str(e)}

# Team YouTube Configuration
@media_router.get("/teams/{team_id}/youtube")
async def get_team_youtube_config(team_id: str):
    """Get YouTube configuration for a specific team"""
    try:
        team = await db.teams.find_one({"id": team_id}, {"_id": 0})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        youtube_config = team.get('youtubeConfig', {
            'enabled': False,
            'channelId': '',
            'channelUrl': '',
            'playlistIds': []
        })
        return youtube_config
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching team YouTube config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.put("/teams/{team_id}/youtube")
async def update_team_youtube_config(team_id: str, config: Dict[str, Any]):
    """Update YouTube configuration for a specific team"""
    try:
        config['lastUpdated'] = datetime.now(timezone.utc).isoformat()
        
        result = await db.teams.update_one(
            {"id": team_id},
            {"$set": {"youtubeConfig": config}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Team not found")
        
        return {"status": "success", "message": "Team YouTube config updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating team YouTube config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.get("/cloud-storage")
async def get_cloud_storage():
    """Get cloud storage configuration"""
    try:
        data = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
        if data:
            data.pop('_id', None)
            return data
        else:
            return {
                "id": "main_cloud_storage",
                "activeProvider": "google-drive",
                "googleCloud": {"projectId": "", "bucketName": "", "serviceAccountKey": "", "enabled": False},
                "googleDrive": {"clientId": "", "clientSecret": "", "redirectUri": "", "refreshToken": "", "folderName": "", "enabled": False},
                "thumbnailCacheSize": 100,
                "maxFileSize": 1000,
                "allowedFileTypes": ["jpg", "jpeg", "png", "gif", "mp4", "mov", "avi"],
                "teamOverrides": {},
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
    except Exception as e:
        logger.error(f"Error fetching cloud storage config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.post("/cloud-storage")
async def save_cloud_storage(data: Dict[str, Any]):
    """Save cloud storage configuration"""
    try:
        logger.info("💾 Saving cloud storage configuration...")
        data["lastUpdated"] = datetime.now(timezone.utc)
        
        await db.cloud_storage.replace_one(
            {"id": "main_cloud_storage"},
            data,
            upsert=True
        )
        
        logger.info("💾 ✅ Cloud storage configuration saved successfully")
        return {"message": "Cloud storage configuration saved successfully", "timestamp": data["lastUpdated"]}
    except Exception as e:
        logger.error(f"💾 ❌ Error saving cloud storage config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.post("/cloud-storage/test-connection")
async def test_cloud_storage_connection(data: Dict[str, Any]):
    """Test cloud storage connection"""
    try:
        provider = data.get("provider", "google-drive")
        
        if provider == "google-drive":
            config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
            if config and config.get("googleDrive", {}).get("refreshToken"):
                return {"status": "success", "message": "Google Drive authorization completed and ready to use!"}
            else:
                return {"status": "error", "message": "Google Drive not configured or authorized"}
        else:
            return {"status": "error", "message": f"Provider {provider} not supported"}
            
    except Exception as e:
        logger.error(f"Error testing cloud storage connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.get("/cloud-storage/debug-status")
async def get_debug_status():
    """Debug endpoint to check Google Drive configuration status"""
    try:
        config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
        
        if not config:
            return {"status": "no_config", "message": "No cloud storage configuration found"}
        
        google_drive = config.get("googleDrive", {})
        
        return {
            "status": "config_found",
            "google_drive_enabled": google_drive.get("enabled", False),
            "has_client_id": bool(google_drive.get("clientId")),
            "has_client_secret": bool(google_drive.get("clientSecret")),
            "has_refresh_token": bool(google_drive.get("refreshToken")),
            "has_folder_id": bool(google_drive.get("folderId")),
            "folder_name": google_drive.get("folderName", "Not set")
        }
        
    except Exception as e:
        logger.error(f"Debug status error: {e}")
        return {"status": "error", "message": str(e)}

@media_router.get("/cloud-storage/google-drive/auth-url")
async def get_google_drive_auth_url():
    """Get Google Drive authorization URL"""
    try:
        config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
        if not config or not config.get("googleDrive", {}).get("clientId"):
            raise HTTPException(status_code=400, detail="Google Drive not configured")
        
        google_drive_config = config["googleDrive"]
        
        # Generate OAuth2 URL
        from urllib.parse import urlencode
        params = {
            'client_id': google_drive_config["clientId"],
            'redirect_uri': google_drive_config.get("redirectUri", "https://team-lax-portal.emergent.host"),
            'scope': 'https://www.googleapis.com/auth/drive.file',
            'response_type': 'code',
            'access_type': 'offline',
            'prompt': 'consent'
        }
        
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        
        return {"authUrl": auth_url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating Google Drive auth URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.post("/cloud-storage/google-drive/complete-auth")
async def complete_google_drive_auth(data: Dict[str, Any]):
    """Complete Google Drive OAuth authorization"""
    try:
        auth_code = data.get("auth_code")
        if not auth_code:
            raise HTTPException(status_code=400, detail="Authorization code is required")
        
        logger.info(f"🔑 Completing Google Drive OAuth with auth code: {auth_code[:20]}...")
        
        # Get configuration
        config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
        if not config or not config.get("googleDrive", {}).get("clientId"):
            raise HTTPException(status_code=400, detail="Google Drive not configured")
        
        google_drive_config = config["googleDrive"]
        
        # Exchange authorization code for tokens
        import requests
        token_data = {
            'client_id': google_drive_config["clientId"],
            'client_secret': google_drive_config["clientSecret"],
            'code': auth_code,
            'grant_type': 'authorization_code',
            'redirect_uri': google_drive_config.get("redirectUri", "https://team-lax-portal.emergent.host")
        }
        
        logger.info("🔑 Exchanging auth code for tokens...")
        token_response = requests.post(
            'https://oauth2.googleapis.com/token', 
            data=token_data,
            timeout=30
        )
        
        if token_response.status_code == 200:
            tokens = token_response.json()
            refresh_token = tokens.get('refresh_token')
            access_token = tokens.get('access_token')
            
            logger.info(f"🔑 Tokens received - Access: {'✅' if access_token else '❌'}, Refresh: {'✅' if refresh_token else '❌'}")
            
            if not refresh_token:
                raise HTTPException(status_code=400, detail="No refresh token received. Please revoke app permissions in Google and try again.")
            
            # Create the main folder
            folder_id = await create_main_folder(access_token, config["googleDrive"].get("folderName", "MLBLGallery2"))
            
            # Store tokens and folder ID
            config["googleDrive"]["refreshToken"] = refresh_token
            config["googleDrive"]["accessToken"] = access_token
            config["googleDrive"]["folderId"] = folder_id
            config["googleDrive"]["enabled"] = True
            config["lastUpdated"] = datetime.now(timezone.utc)
            
            await db.cloud_storage.replace_one(
                {"id": "main_cloud_storage"},
                config,
                upsert=True
            )
            
            logger.info("🔑 ✅ Google Drive authorization completed successfully!")
            
            return {
                "status": "success",
                "message": "Google Drive authorization completed successfully!",
                "folderId": folder_id
            }
        else:
            error_data = token_response.json()
            logger.error(f"🔑 ❌ Token exchange failed: {error_data}")
            raise HTTPException(status_code=400, detail=f"Google OAuth Error: {error_data}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🔑 ❌ Error completing Google Drive auth: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.post("/cloud-storage/google-drive/upload-json")
async def process_google_credentials_file(file: UploadFile = File(...)):
    """Process Google OAuth credentials JSON file and configure Google Drive"""
    try:
        logger.info(f"📤 Processing Google credentials file: {file.filename}")
        
        # Read and parse the JSON file
        content = await file.read()
        credentials_data = json.loads(content.decode('utf-8'))
        
        # Extract credentials from the JSON structure
        # Google OAuth credentials file has either "web" or "installed" key
        client_data = credentials_data.get('web') or credentials_data.get('installed')
        
        if not client_data:
            raise HTTPException(
                status_code=400, 
                detail="Invalid Google OAuth credentials file. Expected 'web' or 'installed' key."
            )
        
        client_id = client_data.get('client_id')
        client_secret = client_data.get('client_secret')
        redirect_uris = client_data.get('redirect_uris', [])
        
        if not client_id or not client_secret:
            raise HTTPException(
                status_code=400,
                detail="Missing client_id or client_secret in credentials file"
            )
        
        # Get or create cloud storage config
        config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
        
        if not config:
            config = {
                "id": "main_cloud_storage",
                "googleDrive": {
                    "enabled": False,
                    "folderName": "MLBL Gallery"
                }
            }
        
        # Update Google Drive configuration with credentials
        if "googleDrive" not in config:
            config["googleDrive"] = {}
        
        config["googleDrive"]["clientId"] = client_id
        config["googleDrive"]["clientSecret"] = client_secret
        backend_url = os.environ.get('BACKEND_URL', 'http://localhost:8001')
        config["googleDrive"]["redirectUri"] = redirect_uris[0] if redirect_uris else f"{backend_url}/api/google-reauth/callback"
        config["lastUpdated"] = datetime.now(timezone.utc)
        
        # Save to database
        await db.cloud_storage.replace_one(
            {"id": "main_cloud_storage"},
            config,
            upsert=True
        )
        
        logger.info(f"✅ Google credentials configured successfully")
        
        return {
            "status": "success",
            "message": "Google OAuth credentials configured successfully!",
            "nextStep": "Click 'Authorize Google Drive' to complete the setup",
            "clientId": client_id[:20] + "..." if len(client_id) > 20 else client_id
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON file: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON file format")
    except Exception as e:
        logger.error(f"❌ Error processing Google credentials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to create gallery folder in Google Drive
async def create_gallery_folder(access_token: str, main_folder_id: str, gallery_name: str) -> str:
    """Create a subfolder for a specific gallery in Google Drive"""
    try:
        import requests
        
        # Clean gallery name for folder (remove special characters)
        import re
        clean_name = re.sub(r'[<>:"/\\|?*]', '_', gallery_name)
        clean_name = clean_name.strip()[:50]  # Limit length
        
        # Create the gallery folder
        folder_metadata = {
            'name': clean_name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [main_folder_id]
        }
        
        response = requests.post(
            'https://www.googleapis.com/drive/v3/files',
            headers={'Authorization': f'Bearer {access_token}'},
            json=folder_metadata,
            timeout=15
        )
        
        if response.status_code == 200:
            folder_data = response.json()
            gallery_folder_id = folder_data['id']
            
            # Make the folder publicly readable
            permission_response = requests.post(
                f'https://www.googleapis.com/drive/v3/files/{gallery_folder_id}/permissions',
                headers={'Authorization': f'Bearer {access_token}'},
                json={
                    'role': 'reader',
                    'type': 'anyone'
                },
                timeout=15
            )
            
            if permission_response.status_code == 200:
                logger.info(f"✅ Created and shared gallery folder: {clean_name} -> {gallery_folder_id}")
            else:
                logger.warning(f"⚠️ Gallery folder created but sharing failed: {permission_response.status_code}")
            
            return gallery_folder_id
        else:
            logger.error(f"❌ Failed to create gallery folder: {response.status_code} - {response.text}")
            return main_folder_id  # Fall back to main folder
            
    except Exception as e:
        logger.error(f"❌ Error creating gallery folder: {e}")
        return main_folder_id  # Fall back to main folder

# Helper function to delete files from Google Drive
async def delete_drive_files(access_token: str, file_ids: List[str]) -> dict:
    """Delete multiple files from Google Drive"""
    try:
        import requests
        deleted_count = 0
        failed_count = 0
        
        for file_id in file_ids:
            try:
                response = requests.delete(
                    f'https://www.googleapis.com/drive/v3/files/{file_id}',
                    headers={'Authorization': f'Bearer {access_token}'},
                    timeout=15
                )
                
                if response.status_code == 200:
                    deleted_count += 1
                    logger.info(f"✅ Deleted file from Drive: {file_id}")
                else:
                    failed_count += 1
                    logger.warning(f"⚠️ Failed to delete file: {file_id} - {response.status_code}")
                    
            except Exception as file_error:
                failed_count += 1
                logger.error(f"❌ Error deleting file {file_id}: {file_error}")
        
        return {
            "deleted": deleted_count,
            "failed": failed_count,
            "total": len(file_ids)
        }
        
    except Exception as e:
        logger.error(f"❌ Error in bulk delete: {e}")
        return {"deleted": 0, "failed": len(file_ids), "total": len(file_ids)}
async def create_main_folder(access_token: str, folder_name: str) -> str:
    """Create the main folder in Google Drive and return its ID"""
    try:
        from googleapiclient.discovery import build
        from google.oauth2.credentials import Credentials
        
        # Create credentials from access token
        creds = Credentials(token=access_token)
        service = build('drive', 'v3', credentials=creds)
        
        # Check if folder already exists
        results = service.files().list(
            q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="files(id, name)"
        ).execute()
        
        existing_folders = results.get('files', [])
        if existing_folders:
            logger.info(f"Google Drive folder '{folder_name}' already exists")
            return existing_folders[0]['id']
        
        # Create the folder
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        folder_id = folder.get('id')
        
        # Make the folder publicly readable (optional)
        permission = {
            'type': 'anyone',
            'role': 'reader'
        }
        service.permissions().create(fileId=folder_id, body=permission).execute()
        
        logger.info(f"Created Google Drive folder '{folder_name}' with ID: {folder_id}")
        return folder_id
        
    except Exception as e:
        logger.error(f"Error creating Google Drive folder: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create Drive folder: {str(e)}")

# Proxy endpoint to serve Google Drive images (bypasses CORS)
@media_router.get("/media/drive/{file_id}")
async def proxy_drive_image(file_id: str, size: str = "w300-h300-c"):
    """Proxy Google Drive images to bypass CORS restrictions"""
    try:
        import requests
        
        # Construct Google Drive thumbnail URL
        drive_url = f"https://drive.google.com/thumbnail?id={file_id}&sz={size}"
        
        # Fetch the image from Google Drive
        response = requests.get(drive_url, timeout=10)
        
        if response.status_code == 200:
            # Return the image with proper headers
            return Response(
                content=response.content,
                media_type=response.headers.get('content-type', 'image/jpeg'),
                headers={
                    "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
                    "Access-Control-Allow-Origin": "*"
                }
            )
        else:
            raise HTTPException(status_code=404, detail="Image not found")
            
    except Exception as e:
        logger.error(f"Error proxying Drive image: {e}")
        raise HTTPException(status_code=500, detail="Failed to load image")

# Migration endpoint to fix existing Google Drive URLs
@media_router.post("/galleries/fix-drive-urls")
async def fix_google_drive_urls():
    """Fix existing Google Drive URLs to use public format"""
    try:
        logger.info("🔧 Starting Google Drive URL migration...")
        
        # Get all galleries from both collections
        galleries_new = await db.galleries_new.find().to_list(length=None)
        galleries_old = await db.galleries.find().to_list(length=None) if hasattr(db, 'galleries') else []
        
        all_galleries = galleries_new + galleries_old
        updated_count = 0
        
        logger.info(f"🔧 Found {len(galleries_new)} galleries in new collection")
        logger.info(f"🔧 Found {len(galleries_old)} galleries in old collection")
        
        for gallery in all_galleries:
            if not gallery.get('mediaItems'):
                continue
                
            needs_update = False
            updated_media_items = []
            
            logger.info(f"🔧 Checking gallery: {gallery.get('name', 'Unknown')} with {len(gallery['mediaItems'])} media items")
            
            for item in gallery['mediaItems']:
                updated_item = item.copy()
                
                # Check if URL needs updating (old format)
                if item.get('url', '').startswith('https://drive.google.com/file/d/'):
                    # Extract file ID from old URL
                    old_url = item['url']
                    if '/d/' in old_url and '/view' in old_url:
                        file_id = old_url.split('/d/')[1].split('/view')[0]
                        updated_item['url'] = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1000"
                        needs_update = True
                        logger.info(f"🔧 Updated URL for {item.get('filename', 'unknown')}: {file_id}")
                
                # Check if thumbnail URL needs updating
                if item.get('thumbnailUrl', '').startswith('https://drive.google.com/thumbnail?id='):
                    old_thumb = item['thumbnailUrl']
                    if 'id=' in old_thumb:
                        file_id = old_thumb.split('id=')[1].split('&')[0]
                        # Use the actual BACKEND_URL instead of placeholder
                        updated_item['thumbnailUrl'] = f"{BACKEND_URL}/api/media/drive/{file_id}?size=w300-h300-c"
                        needs_update = True
                        logger.info(f"🔧 Updated thumbnail to use proxy for {item.get('filename', 'unknown')}: {file_id}")
                
                updated_media_items.append(updated_item)
            
            if needs_update:
                # Update the gallery in the appropriate collection
                gallery['mediaItems'] = updated_media_items
                gallery['updatedAt'] = datetime.now(timezone.utc).isoformat()
                
                # Get the gallery ID (could be 'id' or '_id')
                gallery_id = gallery.get('id') or str(gallery.get('_id'))
                
                # Try to update in both collections
                result_new = await db.galleries_new.replace_one({"id": gallery_id}, gallery)
                result_old = await db.galleries.replace_one({"id": gallery_id}, gallery) if hasattr(db, 'galleries') else None
                
                if result_new.modified_count > 0 or (result_old and result_old.modified_count > 0):
                    updated_count += 1
                    logger.info(f"🔧 ✅ Updated gallery: {gallery.get('name', 'Unknown')}")
        
        logger.info(f"🔧 ✅ Migration completed. Updated {updated_count} galleries.")
        
        return {
            "status": "success",
            "message": f"Migration completed. Updated {updated_count} galleries with new Google Drive URLs.",
            "updatedGalleries": updated_count,
            "totalGalleriesChecked": len(all_galleries),
            "galleriesWithMedia": len([g for g in all_galleries if g.get('mediaItems')])
        }
        
    except Exception as e:
        logger.error(f"🔧 ❌ Error during URL migration: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@media_router.get("/galleries-new")
async def get_galleries_new():
    """Get all galleries - New clean implementation"""
    try:
        logger.info("📡 NEW: Getting galleries from database...")
        galleries = await db.galleries_new.find().to_list(length=None)
        
        # Convert MongoDB documents to proper format
        result_galleries = []
        for gallery in galleries:
            gallery.pop('_id', None)  # Remove MongoDB _id
            result_galleries.append(gallery)
        
        logger.info(f"📡 NEW: Retrieved {len(result_galleries)} galleries")
        return {"galleries": result_galleries}
    
    except Exception as e:
        logger.error(f"📡 NEW: Error getting galleries: {e}")
        return {"galleries": []}

@media_router.post("/galleries-new")
async def create_gallery_new_endpoint(
    gallery_name: str = Form(...),
    gallery_description: str = Form(""),
    gallery_type: str = Form("photo"),
    visibility: str = Form("all_pages"),
    status: str = Form("active"),
    selected_teams: List[str] = Form([]),
    context_team_id: Optional[str] = Form(None),
    expiration_date: Optional[str] = Form(None)
):
    """Create a new gallery with enhanced options"""
    try:
        # Validate inputs
        if status not in ["active", "hidden", "archived"]:
            raise HTTPException(status_code=400, detail="Invalid status. Must be: active, hidden, or archived")
        
        if visibility not in ["all_pages", "league_only", "team_only"]:
            raise HTTPException(status_code=400, detail="Invalid visibility. Must be: all_pages, league_only, or team_only")
        
        gallery_data = {
            "name": gallery_name,
            "description": gallery_description,
            "type": gallery_type,
            "visibility": visibility,
            "status": status,
            "teamId": context_team_id if context_team_id != "league-wide" else None,
            "selectedTeams": selected_teams,
            "googleDriveFolderId": None,  # Will be set when files are uploaded
            "expirationDate": None,
            "mediaItems": []
        }
        
        # Parse expiration date if provided
        if expiration_date:
            try:
                parsed_date = datetime.fromisoformat(expiration_date.replace('Z', '+00:00'))
                gallery_data["expirationDate"] = parsed_date.isoformat()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid expiration date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)")
        
        return await create_gallery_new(gallery_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"📡 Error creating gallery endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.put("/galleries-new/{gallery_id}")
async def update_gallery(gallery_id: str, gallery_data: Dict[str, Any]):
    """Update an existing gallery"""
    try:
        logger.info(f"📝 Updating gallery: {gallery_id}")
        
        gallery_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
        gallery_data.pop("_id", None)  # Remove MongoDB _id if present
        
        result = await db.galleries_new.replace_one(
            {"id": gallery_id},
            gallery_data
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Gallery not found")
        
        logger.info(f"📝 ✅ Gallery updated: {gallery_id}")
        return {"status": "success", "message": "Gallery updated successfully"}
        
    except Exception as e:
        logger.error(f"📝 ❌ Error updating gallery: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.delete("/galleries-new/{gallery_id}")
async def delete_gallery(gallery_id: str, delete_files: bool = False):
    """Delete a gallery with optional Google Drive file cleanup"""
    try:
        logger.info(f"🗑️ Deleting gallery: {gallery_id} (delete_files: {delete_files})")
        
        # Get gallery first to check for Google Drive files
        gallery = await db.galleries_new.find_one({"id": gallery_id})
        if not gallery:
            raise HTTPException(status_code=404, detail="Gallery not found")
        
        deleted_files_info = {"deleted": 0, "failed": 0, "total": 0}
        
        # If delete_files is True, delete from Google Drive
        if delete_files and gallery.get('mediaItems'):
            try:
                # Get Google Drive config for access token
                config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
                if config and config.get("googleDrive", {}).get("refreshToken"):
                    google_drive_config = config["googleDrive"]
                    refresh_token = google_drive_config["refreshToken"]
                    
                    # Get fresh access token
                    access_token = await get_fresh_access_token(google_drive_config, refresh_token)
                    
                    # Extract file IDs from media items
                    file_ids = [item.get('googleDriveId') for item in gallery['mediaItems'] if item.get('googleDriveId')]
                    
                    if file_ids:
                        deleted_files_info = await delete_drive_files(access_token, file_ids)
                        logger.info(f"🗑️ Google Drive cleanup: {deleted_files_info}")
                    
                    # Also try to delete the gallery folder if it exists
                    if gallery.get('googleDriveFolderId'):
                        try:
                            import requests
                            folder_response = requests.delete(
                                f'https://www.googleapis.com/drive/v3/files/{gallery["googleDriveFolderId"]}',
                                headers={'Authorization': f'Bearer {access_token}'},
                                timeout=15
                            )
                            if folder_response.status_code == 200:
                                logger.info(f"🗑️ Deleted gallery folder: {gallery['googleDriveFolderId']}")
                            else:
                                logger.warning(f"⚠️ Could not delete gallery folder: {folder_response.status_code}")
                        except Exception as folder_error:
                            logger.warning(f"⚠️ Error deleting gallery folder: {folder_error}")
                
            except Exception as drive_error:
                logger.error(f"❌ Error during Google Drive cleanup: {drive_error}")
        
        # Delete gallery from database
        result = await db.galleries_new.delete_one({"id": gallery_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Gallery not found")
        
        logger.info(f"🗑️ ✅ Gallery deleted: {gallery_id}")
        
        response_data = {
            "status": "success", 
            "message": "Gallery deleted successfully",
            "deletedFiles": deleted_files_info if delete_files else None
        }
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🗑️ ❌ Error deleting gallery: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.patch("/galleries-new/{gallery_id}/status")
async def update_gallery_status(
    gallery_id: str, 
    status: str = Form(...), 
    expiration_date: Optional[str] = Form(None)
):
    """Update gallery status (active, hidden, archived) and expiration date"""
    try:
        logger.info(f"📝 Updating gallery status: {gallery_id} -> {status}")
        
        # Validate status
        if status not in ["active", "hidden", "archived"]:
            raise HTTPException(status_code=400, detail="Invalid status. Must be: active, hidden, or archived")
        
        update_data = {
            "status": status,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
        
        # Parse and validate expiration date if provided
        if expiration_date:
            try:
                parsed_date = datetime.fromisoformat(expiration_date.replace('Z', '+00:00'))
                update_data["expirationDate"] = parsed_date.isoformat()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid expiration date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)")
        
        result = await db.galleries_new.update_one(
            {"id": gallery_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Gallery not found")
        
        logger.info(f"📝 ✅ Gallery status updated: {gallery_id}")
        return {"status": "success", "message": f"Gallery status updated to {status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"📝 ❌ Error updating gallery status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.post("/galleries-new/{gallery_id}/add-images")
async def add_images_to_gallery(
    gallery_id: str,
    files: List[UploadFile] = File(...),
):
    """Add images to an existing gallery"""
    try:
        logger.info(f"📤 Adding {len(files)} files to existing gallery: {gallery_id}")
        
        # Get the existing gallery
        gallery = await db.galleries_new.find_one({"id": gallery_id})
        if not gallery:
            raise HTTPException(status_code=404, detail="Gallery not found")
        
        # Get cloud storage configuration
        config = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
        if not config or not config.get("googleDrive", {}).get("refreshToken"):
            raise HTTPException(status_code=400, detail="Google Drive not configured")
        
        google_drive_config = config["googleDrive"]
        refresh_token = google_drive_config["refreshToken"]
        folder_id = google_drive_config.get("folderId")
        folder_name = google_drive_config.get("folderName", "League Media")
        
        # Get or refresh access token
        access_token = await get_fresh_access_token(google_drive_config, refresh_token)
        
        # Use existing gallery folder or create one if needed
        gallery_folder_id = gallery.get('googleDriveFolderId')
        if not gallery_folder_id:
            # Create gallery folder if it doesn't exist
            gallery_folder_id = await create_gallery_folder(access_token, folder_id, gallery['name'])
            # Update the gallery with the folder ID
            await db.galleries_new.update_one(
                {"id": gallery_id},
                {"$set": {"googleDriveFolderId": gallery_folder_id}}
            )
        
        # Upload files to Google Drive with retry logic
        uploaded_media_items = []
        import requests
        
        for i, file in enumerate(files):
            try:
                logger.info(f"📁 Uploading file {i+1}/{len(files)}: {file.filename}")
                
                # Read file content
                file_content = await file.read()
                logger.info(f"📁 File content read - Size: {len(file_content)} bytes")
                
                # Upload to Google Drive with retry logic
                upload_success = False
                retry_count = 0
                max_retries = 2
                
                while not upload_success and retry_count <= max_retries:
                    upload_response = requests.post(
                        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                        headers={'Authorization': f'Bearer {access_token}'},
                        files={
                            'metadata': (None, json.dumps({
                                'name': file.filename,
                                'parents': [gallery_folder_id]
                            }), 'application/json'),
                            'data': (file.filename, file_content, file.content_type)
                        },
                        timeout=30
                    )
                    
                    logger.info(f"📁 Google Drive upload response: {upload_response.status_code} (attempt {retry_count + 1})")
                    
                    if upload_response.status_code == 200:
                        upload_success = True
                    elif upload_response.status_code == 401 and retry_count < max_retries:
                        logger.warning(f"🔄 Token expired during upload, refreshing... (retry {retry_count + 1})")
                        access_token = await get_fresh_access_token(google_drive_config, refresh_token)
                        retry_count += 1
                    else:
                        break
                
                if upload_response.status_code == 200:
                    file_data = upload_response.json()
                    drive_file_id = file_data['id']
                    
                    # Make the file publicly accessible
                    try:
                        make_file_public_response = requests.post(
                            f'https://www.googleapis.com/drive/v3/files/{drive_file_id}/permissions',
                            headers={'Authorization': f'Bearer {access_token}'},
                            json={'role': 'reader', 'type': 'anyone'},
                            timeout=15
                        )
                        if make_file_public_response.status_code == 200:
                            logger.info(f"✅ File made public: {drive_file_id}")
                    except Exception as perm_error:
                        logger.warning(f"⚠️ Error making file public: {perm_error}")
                    
                    # Create media item dictionary
                    media_item = {
                        "id": str(uuid.uuid4()),
                        "filename": file.filename,
                        "url": f"https://drive.google.com/thumbnail?id={drive_file_id}&sz=w1000",  # Thumbnail format for better loading
                        "thumbnailUrl": f"https://drive.google.com/thumbnail?id={drive_file_id}&sz=w400",  # Smaller thumbnail
                        "googleDriveId": drive_file_id,
                        "type": "image" if file.content_type.startswith("image/") else "video" if file.content_type.startswith("video/") else "file",
                        "size": len(file_content),
                        "uploadedAt": datetime.now(timezone.utc).isoformat()
                    }
                    
                    uploaded_media_items.append(media_item)
                    logger.info(f"✅ File uploaded: {file.filename} -> {drive_file_id}")
                else:
                    error_msg = await handle_drive_error(upload_response, "file upload")
                    logger.error(f"❌ Upload failed for {file.filename}: {error_msg}")
                    
            except Exception as file_error:
                logger.error(f"❌ Error uploading {file.filename}: {file_error}")
                continue
        
        if not uploaded_media_items:
            raise HTTPException(status_code=500, detail="No files were uploaded successfully")
        
        # Add the new media items to the existing gallery
        existing_media_items = gallery.get('mediaItems', [])
        all_media_items = existing_media_items + uploaded_media_items
        
        # Update the gallery
        result = await db.galleries_new.update_one(
            {"id": gallery_id},
            {
                "$set": {
                    "mediaItems": all_media_items,
                    "updatedAt": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update gallery")
        
        logger.info(f"📤 ✅ Added {len(uploaded_media_items)} files to gallery: {gallery['name']}")
        
        return {
            "status": "success",
            "message": f"Added {len(uploaded_media_items)} files to gallery",
            "galleryId": gallery_id,
            "uploadedFiles": len(uploaded_media_items),
            "totalFiles": len(all_media_items)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"📤 ❌ Error adding images to gallery: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.delete("/galleries-new/{gallery_id}/images/{image_id}")
async def remove_image_from_gallery(gallery_id: str, image_id: str):
    """Remove a specific image from a gallery"""
    try:
        logger.info(f"🖼️ Removing image {image_id} from gallery {gallery_id}")
        
        # Get the gallery
        gallery = await db.galleries_new.find_one({"id": gallery_id})
        if not gallery:
            raise HTTPException(status_code=404, detail="Gallery not found")
        
        # Find and remove the specific image
        media_items = gallery.get('mediaItems', [])
        original_count = len(media_items)
        
        # Remove the image with the matching ID
        updated_media_items = [item for item in media_items if item.get('id') != image_id]
        
        if len(updated_media_items) == original_count:
            raise HTTPException(status_code=404, detail="Image not found in gallery")
        
        # Update the gallery
        gallery['mediaItems'] = updated_media_items
        gallery['updatedAt'] = datetime.now(timezone.utc).isoformat()
        
        result = await db.galleries_new.replace_one(
            {"id": gallery_id},
            gallery
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update gallery")
        
        removed_count = original_count - len(updated_media_items)
        logger.info(f"🖼️ ✅ Removed {removed_count} image(s) from gallery {gallery_id}")
        
        return {
            "status": "success",
            "message": f"Image removed from gallery",
            "removedImages": removed_count,
            "remainingImages": len(updated_media_items)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🖼️ ❌ Error removing image from gallery: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@media_router.get("/galleries-new/active")
async def get_active_galleries():
    """Get only active galleries (not hidden/archived and not expired)"""
    try:
        logger.info("📡 Getting active galleries only...")
        current_time = datetime.now(timezone.utc)
        
        # Query for active galleries that are not expired
        query = {
            "status": "active",
            "$or": [
                {"expirationDate": None},
                {"expirationDate": {"$gt": current_time.isoformat()}}
            ]
        }
        
        galleries = await db.galleries_new.find(query).to_list(length=None)
        
        # Convert MongoDB documents to proper format
        result_galleries = []
        for gallery in galleries:
            gallery.pop('_id', None)  # Remove MongoDB _id
            result_galleries.append(gallery)
        
        logger.info(f"📡 Retrieved {len(result_galleries)} active galleries")
        return {"galleries": result_galleries}
        
    except Exception as e:
        logger.error(f"📡 Error getting active galleries: {e}")
        return {"galleries": []}

# Duplicate function removed - using the first definition above

# Add this at the end of server.py before the GroupMe endpoints

# API Integrations Management Endpoints
import sys
import os
sys.path.append(os.path.dirname(__file__))
from services.api_integrations_service import APIIntegrationsService
from services.encryption_service import encryption_service
from models.api_integrations import APIIntegrationCreate, APIIntegrationUpdate, APIIntegrationResponse

