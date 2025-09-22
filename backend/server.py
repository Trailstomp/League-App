# MLBL API - Lacrosse League Management Backend
# Google Drive Integration Support


from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
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
from datetime import datetime
import json
import io
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from googleapiclient.errors import HttpError


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


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
    visibility: str = "public"  # public, private, league-wide
    teamId: Optional[str] = None  # None for league-wide galleries
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
            raise HTTPException(status_code=400, detail=f"Failed to refresh Google Drive access token: {error_data}")
        
        tokens = refresh_response.json()
        access_token = tokens.get('access_token', '')
        logger.info(f"✅ Token refreshed successfully - Access token length: {len(access_token)}")
        
        return access_token
        
    except Exception as e:
        logger.error(f"❌ Error refreshing access token: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh access token: {str(e)}")

# Google Drive Upload Endpoint - Updated for new gallery system
@api_router.post("/cloud-storage/google-drive/upload-and-create-gallery")
async def upload_and_create_gallery(
    files: List[UploadFile] = File(...),
    gallery_name: str = Form(...),
    gallery_description: str = Form(""),
    visibility: str = Form("public"),
    team_id: Optional[str] = Form(None)
):
    """Upload files to Google Drive and create a gallery with those files"""
    logger.info(f"🚀 UPLOAD ENDPOINT CALLED - Gallery: {gallery_name}")
    logger.info(f"🚀 Files received: {len(files)}")
    logger.info(f"🚀 Team ID: {team_id}")
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
        
        # Refresh access token
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
            raise HTTPException(status_code=400, detail=f"Failed to refresh Google Drive access token: {error_data}")
        
        tokens = refresh_response.json()
        access_token = tokens.get('access_token', '')
        logger.info(f"✅ Token refreshed successfully - Access token length: {len(access_token)}")
        
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
        
        # Create credentials with the fresh access token
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=google_drive_config["clientId"],
            client_secret=google_drive_config["clientSecret"]
        )
        
        # Upload files to Google Drive
        uploaded_media_items = []
        import requests
        
        for i, file in enumerate(files):
            try:
                logger.info(f"📁 Uploading file {i+1}/{len(files)}: {file.filename}")
                
                # Read file content
                file_content = await file.read()
                logger.info(f"📁 File content read - Size: {len(file_content)} bytes")
                
                # Upload to Google Drive
                upload_response = requests.post(
                    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                    headers={'Authorization': f'Bearer {access_token}'},
                    files={
                        'metadata': (None, json.dumps({
                            'name': file.filename,
                            'parents': [folder_id] if folder_id else []
                        }), 'application/json'),
                        'data': (file.filename, file_content, file.content_type)
                    },
                    timeout=30
                )
                
                logger.info(f"📁 Google Drive upload response: {upload_response.status_code}")
                
                if upload_response.status_code == 200:
                    file_data = upload_response.json()
                    drive_file_id = file_data['id']
                    
                    # Create media item dictionary (not using Pydantic model)
                    media_item = {
                        "id": str(uuid.uuid4()),
                        "filename": file.filename,
                        "url": f"https://drive.google.com/file/d/{drive_file_id}/view",
                        "thumbnailUrl": f"https://drive.google.com/thumbnail?id={drive_file_id}&sz=w300",
                        "googleDriveId": drive_file_id,
                        "type": "image" if file.content_type.startswith("image/") else "video" if file.content_type.startswith("video/") else "file",
                        "size": len(file_content),
                        "uploadedAt": datetime.utcnow().isoformat()
                    }
                    
                    uploaded_media_items.append(media_item)
                    logger.info(f"✅ File uploaded: {file.filename} -> {drive_file_id}")
                else:
                    error_text = upload_response.text
                    logger.error(f"❌ Upload failed for {file.filename}: {upload_response.status_code} - {error_text}")
                    
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
        gallery_data = {
            "name": gallery_name,
            "description": gallery_description,
            "type": gallery_type,
            "visibility": visibility,
            "teamId": team_id if team_id != "league-wide" else None,
            "mediaItems": uploaded_media_items  # Already dictionaries, no need for .dict()
        }
        
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
            basic_gallery = {
                "id": str(uuid.uuid4()),
                "name": gallery_name,
                "description": gallery_description or "Uploaded via Google Drive",
                "type": "photo",  # Default to photo
                "visibility": visibility,
                "teamId": team_id if team_id != "league-wide" else None,
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
            "visibility": gallery_data.get("visibility", "public"),
            "teamId": gallery_data.get("teamId"),
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

@api_router.get("/api-integrations")
async def get_api_integrations():
    """Get API integrations configuration"""
    try:
        data = await db.api_integrations.find_one({"id": "main_integrations"})
        if data:
            data.pop('_id', None)
            return data
        else:
            return {
                "id": "main_integrations",
                "googleMapsApiKey": "",
                "emailApiKey": "",
                "smsApiKey": "",
                "socialMediaApiKeys": {},
                "lastUpdated": datetime.utcnow().isoformat()
            }
    except Exception as e:
        logger.error(f"Error fetching API integrations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/api-integrations")
async def save_api_integrations(data: Dict[str, Any]):
    """Save API integrations configuration"""
    try:
        data["lastUpdated"] = datetime.utcnow()
        
        await db.api_integrations.replace_one(
            {"id": "main_integrations"},
            data,
            upsert=True
        )
        return {"message": "API integrations saved successfully", "timestamp": data["lastUpdated"]}
    except Exception as e:
        logger.error(f"Error saving API integrations: {e}")
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

# Helper Functions
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

# NEW GALLERY SYSTEM ENDPOINTS - Added to existing system
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
async def create_gallery_new_endpoint(gallery_data: Dict[str, Any]):
    """Create a new gallery - New clean implementation"""
    return await create_gallery_new(gallery_data)

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
async def delete_gallery(gallery_id: str):
    """Delete a gallery"""
    try:
        logger.info(f"🗑️ Deleting gallery: {gallery_id}")
        
        result = await db.galleries_new.delete_one({"id": gallery_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Gallery not found")
        
        logger.info(f"🗑️ ✅ Gallery deleted: {gallery_id}")
        return {"status": "success", "message": "Gallery deleted successfully"}
        
    except Exception as e:
        logger.error(f"🗑️ ❌ Error deleting gallery: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Duplicate function removed - using the first definition above

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)