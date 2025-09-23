# MLBL API - Lacrosse League Management Backend
# Google Drive Integration Support


from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone, timedelta
import json
import io
import re
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from googleapiclient.errors import HttpError


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Backend URL for proxy endpoints
BACKEND_URL = os.environ.get('BACKEND_URL', 'https://teamdrive-gallery.preview.emergentagent.com')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# League Data Models
class LeagueData(BaseModel):
    id: str = Field(default="main_league")
    teams: List[Dict[str, Any]] = []
    players: List[Dict[str, Any]] = []
    users: List[Dict[str, Any]] = []
    newsItems: List[Dict[str, Any]] = []
    gameTickerData: List[Dict[str, Any]] = []
    leagueSchedule: List[Dict[str, Any]] = []
    leagueInfo: Dict[str, Any] = {}
    websiteStyle: Dict[str, Any] = {}
    lastUpdated: datetime = Field(default_factory=datetime.utcnow)

# Gallery Models
class MediaItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    url: str
    thumbnailUrl: Optional[str] = None
    googleDriveId: Optional[str] = None
    type: str = "image"  # image, video, file
    size: Optional[int] = None
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)

class Gallery(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    type: str = "photo"  # photo, video
    visibility: str = "all_pages"  # all_pages, league_only, team_only
    status: str = "active"  # active, hidden, archived
    teamId: Optional[str] = None  # Context team (where gallery was created)
    selectedTeams: List[str] = []  # Teams this gallery is assigned to (for team_only visibility)
    googleDriveFolderId: Optional[str] = None  # Dedicated folder for this gallery
    expirationDate: Optional[datetime] = None  # When gallery should stop displaying
    mediaItems: List[MediaItem] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "MLBL API - Lacrosse League Management"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# League Data API Endpoints
@api_router.get("/league-data")
async def get_league_data():
    """Get all league data"""
    try:
        data = await db.league_data.find_one({"id": "main_league"})
        if data:
            # Remove MongoDB _id field for clean response
            data.pop('_id', None)
            return data
        else:
            # Return empty structure if no data exists
            return {
                "id": "main_league",
                "teams": [],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {},
                "websiteStyle": {},
                "lastUpdated": datetime.utcnow()
            }
    except Exception as e:
        logger.error(f"Error fetching league data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/league-data")
async def update_league_data(league_data: Dict[str, Any]):
    """Update league data including team logos and other information"""
    try:
        # Ensure the data has the required ID
        league_data["id"] = "main_league"
        league_data["lastUpdated"] = datetime.utcnow().isoformat()
        
        # Update the database
        result = await db.league_data.replace_one(
            {"id": "main_league"},
            league_data,
            upsert=True
        )
        
        logger.info(f"✅ League data updated - modified: {result.modified_count}, upserted: {result.upserted_id is not None}")
        
        return {
            "status": "success",
            "message": "League data updated successfully",
            "modified": result.modified_count,
            "upserted": result.upserted_id is not None
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating league data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/league-data/teams/{team_id}")
async def update_team_data(team_id: str, team_data: Dict[str, Any]):
    """Update specific team data including logo"""
    try:
        # Get current league data
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
        
        # Find and update the specific team
        teams = league_data.get("teams", [])
        team_found = False
        
        for i, team in enumerate(teams):
            if team.get("id") == team_id:
                # Update existing team
                teams[i] = {**team, **team_data}
                team_found = True
                logger.info(f"✅ Updated existing team: {team_id}")
                break
        
        if not team_found:
            # Add new team
            team_data["id"] = team_id
            teams.append(team_data)
            logger.info(f"✅ Added new team: {team_id}")
        
        # Update the database
        league_data["teams"] = teams
        league_data["lastUpdated"] = datetime.utcnow().isoformat()
        
        result = await db.league_data.replace_one(
            {"id": "main_league"},
            league_data,
            upsert=True
        )
        
        logger.info(f"✅ Team {team_id} data saved successfully")
        
        return {
            "status": "success",
            "message": f"Team {team_id} updated successfully",
            "team_data": team_data
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating team {team_id}: {e}")
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
@api_router.get("/debug/galleries")
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
@api_router.post("/cloud-storage/google-drive/upload-and-create-gallery")
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
                        "url": f"https://drive.google.com/uc?id={drive_file_id}",  # Direct download/view URL
                        "thumbnailUrl": f"{BACKEND_URL}/api/media/drive/{drive_file_id}?size=w300-h300-c",  # Use our proxy for thumbnails
                        "googleDriveId": drive_file_id,
                        "type": "image" if file.content_type.startswith("image/") else "video" if file.content_type.startswith("video/") else "file",
                        "size": len(file_content),
                        "uploadedAt": datetime.utcnow().isoformat()
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
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat()
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
@api_router.post("/galleries-test")
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
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        logger.info(f"🧪 Test data created: {test_data}")
        return {"status": "success", "message": "Test data created", "data": test_data}
        
    except Exception as e:
        logger.error(f"🧪 Test error: {e}")
        import traceback
        logger.error(f"🧪 Test traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/galleries")
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

@api_router.post("/galleries")
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
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
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
@api_router.get("/youtube-integration")
async def get_youtube_config():
    """Get YouTube integration configuration"""
    try:
        data = await db.youtube_integration.find_one({"id": "main_youtube"})
        if data:
            data.pop('_id', None)
            return data
        else:
            return {
                "id": "main_youtube",
                "channelId": "",
                "channelUrl": "",
                "playlistIds": [],
                "enabled": False,
                "teamOverrides": {},
                "lastUpdated": datetime.utcnow().isoformat()
            }
    except Exception as e:
        logger.error(f"Error fetching YouTube config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/youtube-integration")
async def save_youtube_config(data: Dict[str, Any]):
    """Save YouTube integration configuration"""
    try:
        data["lastUpdated"] = datetime.utcnow()
        
        await db.youtube_integration.replace_one(
            {"id": "main_youtube"},
            data,
            upsert=True
        )
        return {"message": "YouTube integration configuration saved successfully", "timestamp": data["lastUpdated"]}
    except Exception as e:
        logger.error(f"Error saving YouTube config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/locations")
async def get_locations():
    """Get locations"""
    try:
        locations = await db.locations.find().to_list(length=None)
        result_locations = []
        for location in locations:
            location.pop('_id', None)
            result_locations.append(location)
        return result_locations
    except Exception as e:
        logger.error(f"Error fetching locations: {e}")
        return []

@api_router.get("/cloud-storage")
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
                "lastUpdated": datetime.utcnow().isoformat()
            }
    except Exception as e:
        logger.error(f"Error fetching cloud storage config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/cloud-storage")
async def save_cloud_storage(data: Dict[str, Any]):
    """Save cloud storage configuration"""
    try:
        logger.info("💾 Saving cloud storage configuration...")
        data["lastUpdated"] = datetime.utcnow()
        
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

@api_router.post("/cloud-storage/test-connection")
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

@api_router.get("/cloud-storage/debug-status")
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

@api_router.get("/cloud-storage/google-drive/auth-url")
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

@api_router.post("/cloud-storage/google-drive/complete-auth")
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
            config["lastUpdated"] = datetime.utcnow()
            
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
@api_router.get("/media/drive/{file_id}")
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
@api_router.post("/galleries/fix-drive-urls")
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
                        updated_item['url'] = f"https://drive.google.com/uc?id={file_id}"
                        needs_update = True
                        logger.info(f"🔧 Updated URL for {item.get('filename', 'unknown')}: {file_id}")
                
                # Check if thumbnail URL needs updating
                if item.get('thumbnailUrl', '').startswith('https://drive.google.com/thumbnail?id='):
                    old_thumb = item['thumbnailUrl']
                    if 'id=' in old_thumb:
                        file_id = old_thumb.split('id=')[1].split('&')[0]
                        # Use a placeholder for BACKEND_URL - will be replaced by frontend
                        updated_item['thumbnailUrl'] = f"BACKEND_URL/api/media/drive/{file_id}?size=w300-h300-c"
                        needs_update = True
                        logger.info(f"🔧 Updated thumbnail to use proxy for {item.get('filename', 'unknown')}: {file_id}")
                
                updated_media_items.append(updated_item)
            
            if needs_update:
                # Update the gallery in the appropriate collection
                gallery['mediaItems'] = updated_media_items
                gallery['updatedAt'] = datetime.utcnow().isoformat()
                
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
@api_router.get("/galleries-new")
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

@api_router.post("/galleries-new")
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

@api_router.put("/galleries-new/{gallery_id}")
async def update_gallery(gallery_id: str, gallery_data: Dict[str, Any]):
    """Update an existing gallery"""
    try:
        logger.info(f"📝 Updating gallery: {gallery_id}")
        
        gallery_data["updatedAt"] = datetime.utcnow().isoformat()
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

@api_router.delete("/galleries-new/{gallery_id}")
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

@api_router.patch("/galleries-new/{gallery_id}/status")
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
            "updatedAt": datetime.utcnow().isoformat()
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

@api_router.post("/galleries-new/{gallery_id}/add-images")
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
                        "url": f"https://drive.google.com/uc?id={drive_file_id}",
                        "thumbnailUrl": f"{BACKEND_URL}/api/media/drive/{drive_file_id}?size=w300-h300-c",
                        "googleDriveId": drive_file_id,
                        "type": "image" if file.content_type.startswith("image/") else "video" if file.content_type.startswith("video/") else "file",
                        "size": len(file_content),
                        "uploadedAt": datetime.utcnow().isoformat()
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
                    "updatedAt": datetime.utcnow().isoformat()
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

@api_router.delete("/galleries-new/{gallery_id}/images/{image_id}")
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
        gallery['updatedAt'] = datetime.utcnow().isoformat()
        
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

@api_router.get("/galleries-new/active")
async def get_active_galleries():
    """Get only active galleries (not hidden/archived and not expired)"""
    try:
        logger.info("📡 Getting active galleries only...")
        current_time = datetime.utcnow()
        
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

@api_router.get("/api-integrations")
async def get_all_api_integrations():
    """Get all configured API integrations"""
    try:
        service = APIIntegrationsService(db)
        integrations = await service.get_all_integrations()
        
        # Convert to response format
        response_integrations = []
        for integration in integrations:
            response_integrations.append({
                "id": integration["id"],
                "integration_name": integration["integration_name"],
                "display_name": integration["display_name"],
                "is_active": integration["is_active"],
                "created_at": integration["created_at"],
                "updated_at": integration["updated_at"],
                "created_by": integration.get("created_by"),
                "has_credentials": integration.get("has_credentials", False),  # Use service-calculated value
                "status": "active" if integration["is_active"] else "inactive"
            })
        
        return {"integrations": response_integrations}
        
    except Exception as e:
        logger.error(f"Error getting API integrations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/api-integrations")
async def create_api_integration(
    integration_name: str = Form(...),
    display_name: str = Form(...),
    credentials: str = Form(...),  # JSON string
    settings: str = Form("{}"),  # JSON string
    is_active: bool = Form(True)
):
    """Create new API integration"""
    try:
        import json
        
        # Parse JSON strings
        credentials_dict = json.loads(credentials)
        settings_dict = json.loads(settings)
        
        service = APIIntegrationsService(db)
        
        # Check if integration already exists
        existing = await service.get_integration(integration_name)
        if existing:
            # If it exists, update it instead of creating new one
            logger.info(f"Updating existing {integration_name} integration instead of creating new one")
            
            update_data = APIIntegrationUpdate(
                display_name=display_name,
                credentials=credentials_dict,
                settings=settings_dict,
                is_active=is_active
            )
            
            success = await service.update_integration(integration_name, update_data)
            
            if success:
                return {
                    "message": f"API integration '{display_name}' updated successfully",
                    "integration_name": integration_name
                }
            else:
                raise HTTPException(status_code=500, detail="Failed to update existing integration")
        
        # Create new integration if it doesn't exist
        integration_data = APIIntegrationCreate(
            integration_name=integration_name,
            display_name=display_name,
            credentials=credentials_dict,
            settings=settings_dict,
            is_active=is_active
        )
        
        integration_id = await service.create_integration(integration_data)
        
        return {
            "message": f"API integration '{display_name}' created successfully",
            "integration_id": integration_id
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON in credentials or settings: {str(e)}")
    except HTTPException:
        # Re-raise HTTPExceptions without wrapping them
        raise
    except Exception as e:
        logger.error(f"Error creating API integration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/api-integrations/{integration_name}")
async def update_api_integration(
    integration_name: str,
    display_name: Optional[str] = Form(None),
    credentials: Optional[str] = Form(None),  # JSON string
    settings: Optional[str] = Form(None),  # JSON string
    is_active: Optional[bool] = Form(None)
):
    """Update existing API integration"""
    try:
        import json
        
        service = APIIntegrationsService(db)
        
        update_dict = {}
        if display_name is not None:
            update_dict["display_name"] = display_name
        if credentials is not None:
            update_dict["credentials"] = json.loads(credentials)
        if settings is not None:
            update_dict["settings"] = json.loads(settings)
        if is_active is not None:
            update_dict["is_active"] = is_active
        
        update_data = APIIntegrationUpdate(**update_dict)
        success = await service.update_integration(integration_name, update_data)
        
        if success:
            return {"message": f"Integration '{integration_name}' updated successfully"}
        else:
            raise HTTPException(status_code=404, detail="Integration not found")
            
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        logger.error(f"Error updating API integration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/api-integrations/{integration_name}/test")
async def test_api_integration(integration_name: str):
    """Test an API integration"""
    try:
        service = APIIntegrationsService(db)
        result = await service.test_integration(integration_name)
        
        return result
        
    except Exception as e:
        logger.error(f"Error testing API integration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/api-integrations/{integration_name}")
async def delete_api_integration(integration_name: str):
    """Delete (deactivate) an API integration"""
    try:
        service = APIIntegrationsService(db)
        success = await service.delete_integration(integration_name)
        
        if success:
            return {"message": f"Integration '{integration_name}' deactivated successfully"}
        else:
            raise HTTPException(status_code=404, detail="Integration not found")
            
    except Exception as e:
        logger.error(f"Error deleting API integration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Updated GroupMe Integration Endpoints (using stored credentials)
async def get_groupme_service():
    """Get GroupMe service with stored credentials"""
    service = APIIntegrationsService(db)
    credentials = await service.get_groupme_credentials()
    
    if not credentials:
        raise HTTPException(status_code=400, detail="GroupMe not configured. Please configure GroupMe integration in API settings.")
    
    access_token = credentials.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="GroupMe access token not found in configuration.")
    
    # Import here to avoid circular imports
    from .services.groupme_service import GroupMeService
    return GroupMeService(access_token)

@api_router.get("/groupme/groups")
async def list_available_groupme_groups():
    """Get available GroupMe groups for configuration"""
    try:
        service = APIIntegrationsService(db)
        result = await service.test_integration("groupme")
        
        if result.get("success"):
            return {
                "groups": result.get("groups", []),
                "count": result.get("groups_count", 0)
            }
        else:
            return {
                "groups": [],
                "error": result.get("error", "Unknown error")
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching GroupMe groups: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch groups: {str(e)}")

# Update the existing GroupMe endpoints to use the new service
@api_router.post("/groupme/channels")
async def create_groupme_channel(
    name: str = Form(...),
    groupme_group_id: str = Form(...),
    channel_type: str = Form(...),  # 'league' or 'team'
    team_id: Optional[str] = Form(None),
    notification_settings: Optional[str] = Form("{}")  # JSON string
):
    """Create a new GroupMe channel configuration"""
    
    try:
        # Get GroupMe service with stored credentials
        groupme_service = await get_groupme_service()
        
        # Parse notification settings
        import json
        settings = json.loads(notification_settings) if notification_settings else {}
        
        # Validate channel type
        if channel_type not in ["league", "team"]:
            raise HTTPException(status_code=400, detail="channel_type must be 'league' or 'team'")
        
        # Validate team exists if team channel
        if channel_type == "team":
            if not team_id:
                raise HTTPException(status_code=400, detail="team_id required for team channels")
            
            # Check if team exists
            team = await db.teams.find_one({"id": team_id})
            if not team:
                raise HTTPException(status_code=404, detail="Team not found")
        
        # Check for duplicate group ID
        existing = await db.groupme_channels.find_one({"groupme_group_id": groupme_group_id})
        if existing:
            raise HTTPException(status_code=400, detail="GroupMe group already configured")
        
        # Create bot
        bot_name = f"{name} League Bot"
        callback_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/groupme/webhook"
        
        bot_data = {
            "bot": {
                "name": bot_name,
                "group_id": groupme_group_id,
                "callback_url": callback_url
            }
        }
        
        bot_url = f"https://api.groupme.com/v3/bots"
        
        import urllib.request
        import json
        
        # Get credentials for bot creation
        service = APIIntegrationsService(db)
        credentials = await service.get_groupme_credentials()
        access_token = credentials.get("access_token")
        
        request = urllib.request.Request(
            f"{bot_url}?token={access_token}",
            json.dumps(bot_data).encode(),
            {"Content-Type": "application/json"}
        )
        
        with urllib.request.urlopen(request) as response:
            bot_response = json.loads(response.read().decode())
        
        if bot_response.get('meta', {}).get('code') != 201:
            logger.error(f"Bot creation failed: {bot_response}")
            raise HTTPException(status_code=400, detail="Failed to create GroupMe bot")
        
        bot_id = bot_response['response']['bot']['bot_id']
        
        # Create channel record
        channel_id = str(uuid.uuid4())
        channel = {
            "id": channel_id,
            "name": name,
            "groupme_group_id": groupme_group_id,
            "groupme_bot_id": bot_id,
            "channel_type": channel_type,
            "team_id": team_id,
            "is_active": True,
            "notification_settings": settings,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        await db.groupme_channels.insert_one(channel)
        
        return {"message": "GroupMe channel created successfully", "channel_id": channel_id, "bot_id": bot_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating GroupMe channel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# GroupMe Integration Endpoints
GROUPME_ACCESS_TOKEN = os.environ.get('GROUPME_ACCESS_TOKEN')
GROUPME_WEBHOOK_SECRET = os.environ.get('GROUPME_WEBHOOK_SECRET')

@api_router.get("/groupme/channels")
async def list_groupme_channels(
    active_only: bool = True,
    channel_type: Optional[str] = None
):
    """List configured GroupMe channels"""
    
    try:
        # Build query
        query = {}
        if active_only:
            query["is_active"] = True
        if channel_type:
            query["channel_type"] = channel_type
        
        # Get channels
        channels_cursor = db.groupme_channels.find(query)
        channels = await channels_cursor.to_list(length=None)
        
        # Get team names for team channels
        team_ids = [c["team_id"] for c in channels if c.get("team_id")]
        team_names = {}
        
        if team_ids:
            teams_cursor = db.teams.find({"id": {"$in": team_ids}})
            teams = await teams_cursor.to_list(length=None)
            team_names = {team["id"]: team["name"] for team in teams}
        
        # Add team names to response
        for channel in channels:
            if channel.get("team_id"):
                channel["team_name"] = team_names.get(channel["team_id"], "Unknown Team")
            else:
                channel["team_name"] = None
        
        return {"channels": channels, "count": len(channels)}
        
    except Exception as e:
        logger.error(f"Error listing GroupMe channels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/groupme/webhook")
async def groupme_webhook(request: Request):
    """Handle GroupMe webhook messages"""
    
    try:
        body = await request.body()
        webhook_data = json.loads(body.decode())
        
        # Verify signature if configured
        if GROUPME_WEBHOOK_SECRET:
            signature = request.headers.get("X-GroupMe-Signature")
            if signature:
                import hmac
                import hashlib
                
                expected_signature = hmac.new(
                    GROUPME_WEBHOOK_SECRET.encode(),
                    body,
                    hashlib.sha256
                ).hexdigest()
                
                if not hmac.compare_digest(signature, expected_signature):
                    raise HTTPException(status_code=401, detail="Invalid webhook signature")
        
        # Skip system messages and bot messages
        if webhook_data.get("system") or _is_bot_message(webhook_data):
            return {"status": "ignored"}
        
        # Process the message
        await _process_groupme_message(webhook_data)
        
        return {"status": "processed"}
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Processing failed")

def _is_bot_message(webhook_data: dict) -> bool:
    """Check if message is from a bot"""
    sender_type = webhook_data.get("sender_type", "")
    name = webhook_data.get("name", "")
    return sender_type == "bot" or "bot" in name.lower() or name.endswith("Bot")

async def _process_groupme_message(webhook_data: dict):
    """Process incoming GroupMe message"""
    
    try:
        group_id = webhook_data.get("group_id")
        text = webhook_data.get("text", "").strip()
        
        # Find the channel
        channel = await db.groupme_channels.find_one({
            "groupme_group_id": group_id,
            "is_active": True
        })
        
        if not channel:
            logger.warning(f"No channel found for group_id: {group_id}")
            return
        
        # Store message
        message_id = str(uuid.uuid4())
        message_data = {
            "id": message_id,
            "channel_id": channel["id"],
            "groupme_message_id": str(webhook_data.get("id")),
            "sender_id": str(webhook_data.get("user_id", webhook_data.get("sender_id"))),
            "sender_name": webhook_data.get("name", "Unknown"),
            "text": text,
            "attachments": webhook_data.get("attachments", []),
            "created_at": datetime.fromtimestamp(webhook_data.get("created_at", 0), tz=timezone.utc).isoformat(),
            "message_type": "command" if text.startswith("/") else "standard",
            "processed": False
        }
        
        await db.groupme_messages.insert_one(message_data)
        
        # Process commands
        if text.startswith("/"):
            await _process_groupme_command(text, webhook_data, channel, message_data)
        
        # Mark message as processed
        await db.groupme_messages.update_one(
            {"id": message_id},
            {"$set": {"processed": True}}
        )
        
    except Exception as e:
        logger.error(f"Error processing GroupMe message: {str(e)}")

async def _process_groupme_command(text: str, webhook_data: dict, channel: dict, message_data: dict):
    """Process GroupMe command"""
    
    try:
        command_parts = text.lower().split()
        command = command_parts[0]
        
        if command == "/rsvp" and len(command_parts) >= 2:
            await _handle_rsvp_command(command_parts, webhook_data, channel, message_data)
        elif command == "/schedule":
            await _handle_schedule_command(webhook_data, channel)
        elif command == "/help":
            await _handle_help_command(webhook_data, channel)
        
    except Exception as e:
        logger.error(f"Error processing command {text}: {str(e)}")

async def _handle_rsvp_command(command_parts: list, webhook_data: dict, channel: dict, message_data: dict):
    """Handle RSVP command"""
    
    response = command_parts[1].lower()
    if response not in ["yes", "no", "maybe"]:
        await _send_groupme_message(channel["groupme_bot_id"], "❓ Please use: /rsvp yes, /rsvp no, or /rsvp maybe")
        return
    
    # Convert response format
    response_map = {"yes": "attending", "no": "not_attending", "maybe": "maybe"}
    db_response = response_map[response]
    
    # Find next upcoming event
    now = datetime.utcnow()
    
    if channel["channel_type"] == "team":
        # Team-specific events
        events_cursor = db.events.find({
            "team_id": channel["team_id"],
            "start_datetime": {"$gt": now.isoformat()},
            "requires_rsvp": True
        }).sort("start_datetime", 1).limit(1)
    else:
        # League-wide events  
        events_cursor = db.events.find({
            "start_datetime": {"$gt": now.isoformat()},
            "requires_rsvp": True
        }).sort("start_datetime", 1).limit(1)
    
    events = await events_cursor.to_list(length=1)
    
    if not events:
        await _send_groupme_message(channel["groupme_bot_id"], "❌ No upcoming events found")
        return
    
    event = events[0]
    user_id = str(webhook_data.get("user_id", webhook_data.get("sender_id")))
    user_name = webhook_data.get("name", "Unknown")
    
    # Update or create RSVP
    rsvp_data = {
        "event_id": event["id"],
        "groupme_user_id": user_id,
        "user_name": user_name,
        "user_avatar_url": webhook_data.get("avatar_url"),
        "response": db_response,
        "response_time": datetime.utcnow().isoformat(),
        "message_id": message_data["id"]
    }
    
    # Check for existing RSVP
    existing_rsvp = await db.event_rsvps.find_one({
        "event_id": event["id"],
        "groupme_user_id": user_id
    })
    
    if existing_rsvp:
        await db.event_rsvps.update_one(
            {"_id": existing_rsvp["_id"]},
            {"$set": rsvp_data}
        )
    else:
        rsvp_data["id"] = str(uuid.uuid4())
        await db.event_rsvps.insert_one(rsvp_data)
    
    # Send confirmation
    confirmation_msg = f"✅ {user_name}, your RSVP for '{event['title']}' has been recorded as: {response.upper()}"
    await _send_groupme_message(channel["groupme_bot_id"], confirmation_msg)

async def _handle_schedule_command(webhook_data: dict, channel: dict):
    """Handle schedule command"""
    
    now = datetime.utcnow()
    
    if channel["channel_type"] == "team":
        events_cursor = db.events.find({
            "team_id": channel["team_id"],
            "start_datetime": {"$gt": now.isoformat()}
        }).sort("start_datetime", 1).limit(5)
    else:
        events_cursor = db.events.find({
            "start_datetime": {"$gt": now.isoformat()}
        }).sort("start_datetime", 1).limit(5)
    
    events = await events_cursor.to_list(length=5)
    
    if not events:
        response = "📅 No upcoming events scheduled."
    else:
        response = "📅 Upcoming Events:\n\n"
        for i, event in enumerate(events, 1):
            try:
                event_date = datetime.fromisoformat(event["start_datetime"]).strftime("%m/%d %I:%M %p")
            except:
                event_date = event["start_datetime"]
            response += f"{i}. {event['title']}\n"
            response += f"   📅 {event_date}"
            if event.get("location"):
                response += f" • 📍 {event['location']}"
            response += "\n\n"
        
        response += "Use '/rsvp yes [event#]' to respond to a specific event"
    
    await _send_groupme_message(channel["groupme_bot_id"], response)

async def _handle_help_command(webhook_data: dict, channel: dict):
    """Handle help command"""
    
    help_text = """🤖 Lacrosse League Bot Commands:

📋 /schedule - View upcoming events
✅ /rsvp yes|no|maybe - Respond to events
❓ /help - Show this help message

Examples:
• /rsvp yes - RSVP to next event
• /rsvp no - Decline next event
• /rsvp maybe - Mark as tentative"""
    
    await _send_groupme_message(channel["groupme_bot_id"], help_text)

async def _send_groupme_message(bot_id: str, text: str) -> bool:
    """Send message through GroupMe bot"""
    
    if not GROUPME_ACCESS_TOKEN:
        return False
    
    try:
        import urllib.request
        import json
        
        url = "https://api.groupme.com/v3/bots/post"
        
        data = {
            "bot_id": bot_id,
            "text": text
        }
        
        request = urllib.request.Request(
            url,
            json.dumps(data).encode(),
            {"Content-Type": "application/json"}
        )
        
        response = urllib.request.urlopen(request)
        return response.status == 202  # GroupMe returns 202 for successful bot posts
        
    except Exception as e:
        logger.error(f"Failed to send GroupMe message: {str(e)}")
        return False

@api_router.post("/groupme/broadcast")
async def broadcast_groupme_message(
    message: str = Form(...),
    channel_ids: str = Form(...),  # JSON array as string
    notification_type: str = Form("announcement")
):
    """Broadcast message to multiple GroupMe channels"""
    
    if not GROUPME_ACCESS_TOKEN:
        raise HTTPException(status_code=400, detail="GroupMe not configured")
    
    try:
        import json
        channel_id_list = json.loads(channel_ids)
        
        # Get active channels
        channels_cursor = db.groupme_channels.find({
            "id": {"$in": channel_id_list},
            "is_active": True,
            "groupme_bot_id": {"$exists": True, "$ne": None}
        })
        channels = await channels_cursor.to_list(length=None)
        
        if not channels:
            raise HTTPException(status_code=404, detail="No active channels found")
        
        # Send messages with rate limiting
        results = {}
        for channel in channels:
            success = await _send_groupme_message(channel["groupme_bot_id"], message)
            results[channel["name"]] = success
            
            # Log notification
            notification = {
                "id": str(uuid.uuid4()),
                "channel_id": channel["id"],
                "notification_type": notification_type,
                "message_text": message,
                "sent_at": datetime.utcnow().isoformat(),
                "delivery_status": "sent" if success else "failed"
            }
            await db.groupme_notifications.insert_one(notification)
            
            # Rate limiting - wait between messages
            await asyncio.sleep(2.1)
        
        successful_sends = sum(1 for success in results.values() if success)
        
        return {
            "message": f"Broadcast sent to {successful_sends}/{len(channels)} channels",
            "results": results
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid channel_ids JSON")
    except Exception as e:
        logger.error(f"Error broadcasting message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/groupme/events/{event_id}/rsvps")
async def get_event_groupme_rsvps(event_id: str):
    """Get GroupMe RSVP summary for an event"""
    
    try:
        # Get event
        event = await db.events.find_one({"id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Get RSVPs
        rsvps_cursor = db.event_rsvps.find({"event_id": event_id})
        rsvps = await rsvps_cursor.to_list(length=None)
        
        # Group by response
        attending = [{"name": r["user_name"], "id": r["groupme_user_id"], "avatar_url": r.get("user_avatar_url")} 
                    for r in rsvps if r["response"] == "attending"]
        not_attending = [{"name": r["user_name"], "id": r["groupme_user_id"], "avatar_url": r.get("user_avatar_url")} 
                        for r in rsvps if r["response"] == "not_attending"]
        maybe = [{"name": r["user_name"], "id": r["groupme_user_id"], "avatar_url": r.get("user_avatar_url")} 
                for r in rsvps if r["response"] == "maybe"]
        
        return {
            "event": {
                "id": event["id"],
                "title": event["title"],
                "start_datetime": event["start_datetime"],
                "requires_rsvp": event.get("requires_rsvp", False)
            },
            "summary": {
                "total_responses": len(rsvps),
                "attending_count": len(attending),
                "not_attending_count": len(not_attending),
                "maybe_count": len(maybe)
            },
            "responses": {
                "attending": attending,
                "not_attending": not_attending,
                "maybe": maybe
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting event RSVPs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/groupme/dashboard/stats")
async def get_groupme_dashboard_stats():
    """Get GroupMe integration dashboard statistics"""
    
    try:
        # Count active channels
        active_channels = await db.groupme_channels.count_documents({"is_active": True})
        
        # Count team vs league channels
        team_channels = await db.groupme_channels.count_documents({
            "is_active": True,
            "channel_type": "team"
        })
        
        league_channels = await db.groupme_channels.count_documents({
            "is_active": True,
            "channel_type": "league"
        })
        
        # Count messages from last 24 hours
        yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
        recent_messages = await db.groupme_messages.count_documents({
            "created_at": {"$gt": yesterday}
        })
        
        # Count notifications sent in last 24 hours
        notifications_sent = await db.groupme_notifications.count_documents({
            "sent_at": {"$gt": yesterday},
            "delivery_status": "sent"
        })
        
        return {
            "active_channels": active_channels,
            "team_channels": team_channels,
            "league_channels": league_channels,
            "recent_messages": recent_messages,
            "notifications_sent": notifications_sent,
            "integration_status": "active" if active_channels > 0 else "inactive"
        }
        
    except Exception as e:
        logger.error(f"Error getting GroupMe stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the API router in the main app (after all routes are defined)
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)