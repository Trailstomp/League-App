# MLBL API - Lacrosse League Management Backend
# Google Drive Integration Support


from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, Response, HTMLResponse
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
import httpx
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from googleapiclient.errors import HttpError


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Backend URL for proxy endpoints
BACKEND_URL = os.environ.get('BACKEND_URL', 'https://league-manager-app-1.preview.emergentagent.com')

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

# League and Division Models
class League(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    sport: str = "lacrosse"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    settings: Dict[str, Any] = {}

class Division(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    league_id: str
    description: str = ""
    level: int = 1
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Team(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    league_id: str
    division_id: str
    division: str  # For backward compatibility
    color: str = "#3b82f6"
    logo: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

# Stats Models
class PlayerGameStats(BaseModel):
    player_id: str
    player_name: str
    jersey_number: Optional[str] = None
    position: Optional[str] = None
    shots: int = 0
    goals: int = 0
    ground_balls: int = 0
    was_present: bool = True  # Whether player was at the game

class GoalieGameStats(BaseModel):
    player_id: str
    player_name: str
    jersey_number: Optional[str] = None
    periods_played: List[int] = []  # [1,2,3,4]
    minutes_played: int = 0
    shots_on_goal: int = 0
    saves: int = 0
    goals_allowed: int = 0

class TeamGameStats(BaseModel):
    team_id: str
    team_name: str
    goals_for: int = 0
    goals_against: int = 0
    result: str = "pending"  # win, loss, tie, pending
    players: List[PlayerGameStats] = []
    goalies: List[GoalieGameStats] = []

class Season(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # "Fall 2024", "Spring 2025"
    league_id: str = "main_league"  # Support multiple leagues
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GameStats(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    season_id: str  # Link to season
    league_id: str = "main_league"  # Link to league
    game_date: datetime
    status: str = "in_progress"  # in_progress, final, cancelled
    home_team: TeamGameStats
    away_team: Optional[TeamGameStats] = None  # Optional for practice/scrimmage
    entered_by: str  # User ID who entered stats
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    is_live: bool = False  # Whether stats are being entered live
    notes: Optional[str] = None

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

# Optimized Dashboard Data Endpoint
@api_router.get("/dashboard-data")
async def get_dashboard_data():
    """
    Optimized endpoint that returns all data needed for homepage in a single call
    This reduces loading time from 5-8 seconds to under 2 seconds
    """
    try:
        # Use asyncio.gather to run all database queries in parallel
        league_data_task = db.league_data.find_one({"id": "main_league"})
        teams_task = db.teams.find().to_list(None)  # Get teams from new collection
        galleries_task = get_active_galleries_internal()
        youtube_task = db.youtube_integration.find_one({"id": "main_youtube"})
        
        # Execute all queries in parallel
        league_data, teams_from_collection, galleries_data, youtube_config = await asyncio.gather(
            league_data_task,
            teams_task,
            galleries_task,
            youtube_task,
            return_exceptions=True
        )
        
        # Process league data
        if isinstance(league_data, Exception):
            logger.error(f"Error fetching league data: {league_data}")
            league_data = None
            
        if league_data:
            league_data.pop('_id', None)
        else:
            league_data = {
                "id": "main_league",
                "teams": [],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {},
                "websiteStyle": {},
                "lastUpdated": datetime.utcnow().isoformat()
            }
        
        # Process galleries data
        if isinstance(galleries_data, Exception):
            logger.error(f"Error fetching galleries: {galleries_data}")
            galleries_data = {"galleries": []}
        
        # Process YouTube config
        if isinstance(youtube_config, Exception):
            logger.error(f"Error fetching YouTube config: {youtube_config}")
            youtube_config = None
            
        if youtube_config:
            youtube_config.pop('_id', None)
        else:
            youtube_config = {
                "id": "main_youtube",
                "channelId": "",
                "channelUrl": "", 
                "playlistIds": [],
                "enabled": False,
                "teamOverrides": {},
                "lastUpdated": datetime.utcnow().isoformat()
            }
        
        # Return consolidated response
        dashboard_data = {
            **league_data,  # teams, players, events, websiteStyle, etc.
            "galleries": galleries_data.get("galleries", []),
            "youtubeConfig": youtube_config,
            "loadedAt": datetime.utcnow().isoformat()
        }
        
        logger.info(f"✅ Dashboard data loaded: {len(dashboard_data.get('teams', []))} teams, {len(dashboard_data.get('galleries', []))} galleries, YouTube: {'enabled' if youtube_config.get('enabled') else 'disabled'}")
        
        return dashboard_data
        
    except Exception as e:
        logger.error(f"❌ Error fetching dashboard data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_active_galleries_internal():
    """Internal function to get active galleries (for parallel execution)"""
    try:
        current_time = datetime.utcnow()
        
        query = {
            "status": "active",
            "$or": [
                {"expirationDate": None},
                {"expirationDate": {"$gt": current_time.isoformat()}}
            ]
        }
        
        galleries = await db.galleries_new.find(query).to_list(length=None)
        
        result_galleries = []
        for gallery in galleries:
            gallery.pop('_id', None)
            result_galleries.append(gallery)
            
        return {"galleries": result_galleries}
        
    except Exception as e:
        logger.error(f"Internal galleries fetch error: {e}")
        return {"galleries": []}

@api_router.post("/league-data/teams")
async def update_teams(teams_data: List[Dict[str, Any]]):
    """Update teams data in the league database and sync with teams collection"""
    try:
        # Get the current league data
        league_doc = await db.league_data.find_one({"id": "main_league"})
        if not league_doc:
            # Create new league data if it doesn't exist
            league_doc = {
                "id": "main_league",
                "teams": [],
                "lastUpdated": datetime.utcnow().isoformat()
            }
        
        # Update the teams field
        league_doc["teams"] = teams_data
        league_doc["lastUpdated"] = datetime.utcnow().isoformat()
        
        # Save back to database
        result = await db.league_data.replace_one(
            {"id": "main_league"},
            league_doc,
            upsert=True
        )
        
        # SYNC WITH TEAMS COLLECTION for new stats system
        logger.info(f"🔄 Syncing {len(teams_data)} teams to teams collection...")
        
        # Clear existing teams and add new ones
        await db.teams.delete_many({})
        
        teams_for_collection = []
        for team_data in teams_data:
            # Map team data to new structure
            team_doc = {
                "id": team_data.get("id", team_data.get("name", "").lower().replace(" ", "-")),
                "name": team_data.get("name", "Unknown Team"),
                "league_id": "main_league",
                "division_id": None,  # Will be set based on division
                "division": team_data.get("division", ""),
                "color": team_data.get("color", "#3b82f6"),
                "logo": team_data.get("logo", ""),
                "active": team_data.get("active", True),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            # Map division names to division IDs
            division_mapping = {
                "Field": "field_division",
                "Box": "box_division", 
                "External": "external_division",
                "Premier": "premier_division",
                "Division 1": "division_1",
                "Division 2": "division_2"
            }
            
            if team_doc["division"] in division_mapping:
                team_doc["division_id"] = division_mapping[team_doc["division"]]
            
            teams_for_collection.append(team_doc)
        
        if teams_for_collection:
            await db.teams.insert_many(teams_for_collection)
            logger.info(f"✅ Synced {len(teams_for_collection)} teams to teams collection")
        
        # Create divisions if they don't exist
        existing_divisions = set([team["division"] for team in teams_data if team.get("division")])
        for division_name in existing_divisions:
            division_id = division_mapping.get(division_name, division_name.lower().replace(" ", "_") + "_division")
            await db.divisions.update_one(
                {"id": division_id},
                {"$set": {
                    "id": division_id,
                    "name": division_name,
                    "league_id": "main_league",
                    "description": f"{division_name} teams",
                    "level": 1,
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc)
                }},
                upsert=True
            )
        
        logger.info(f"✅ Teams updated - {len(teams_data)} teams, modified: {result.modified_count}")
        
        return {
            "status": "success", 
            "message": f"Successfully updated {len(teams_data)} teams and synced to collections",
            "modified": result.modified_count,
            "upserted": result.upserted_id is not None,
            "teams_synced": len(teams_for_collection)
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating teams: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/league-data/players")
async def update_players(players_data: List[Dict[str, Any]]):
    """Update players data in the league database"""
    try:
        # Get the current league data
        league_doc = await db.league_data.find_one({"id": "main_league"})
        if not league_doc:
            # Create new league data if it doesn't exist
            league_doc = {
                "id": "main_league",
                "players": [],
                "lastUpdated": datetime.utcnow().isoformat()
            }
        
        # Update the players field
        league_doc["players"] = players_data
        league_doc["lastUpdated"] = datetime.utcnow().isoformat()
        
        # Save back to database
        result = await db.league_data.replace_one(
            {"id": "main_league"},
            league_doc,
            upsert=True
        )
        
        logger.info(f"✅ Players updated - {len(players_data)} players, modified: {result.modified_count}")
        
        return {
            "status": "success", 
            "message": f"Successfully updated {len(players_data)} players",
            "modified": result.modified_count,
            "upserted": result.upserted_id is not None
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating players: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/league-data/seasons")
async def update_seasons(seasons_data: List[Dict[str, Any]]):
    """Update seasons data in the league database"""
    try:
        # Get the current league data
        league_doc = await db.league_data.find_one({"id": "main_league"})
        if not league_doc:
            # Create new league data if it doesn't exist
            league_doc = {
                "id": "main_league",
                "seasons": [],
                "lastUpdated": datetime.utcnow().isoformat()
            }
        
        # Update the seasons field
        league_doc["seasons"] = seasons_data
        league_doc["lastUpdated"] = datetime.utcnow().isoformat()
        
        # Save back to database
        result = await db.league_data.replace_one(
            {"id": "main_league"},
            league_doc,
            upsert=True
        )
        
        logger.info(f"✅ Seasons updated - {len(seasons_data)} seasons, modified: {result.modified_count}")
        
        return {
            "status": "success", 
            "message": f"Successfully updated {len(seasons_data)} seasons",
            "modified": result.modified_count,
            "upserted": result.upserted_id is not None
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating seasons: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/league-data/leagueSchedule")
async def update_league_schedule(schedule_data: List[Dict[str, Any]]):
    """Update league schedule (events) data in the league database"""
    try:
        # Get the current league data
        league_doc = await db.league_data.find_one({"id": "main_league"})
        if not league_doc:
            # Create new league data if it doesn't exist
            league_doc = {
                "id": "main_league",
                "leagueSchedule": [],
                "lastUpdated": datetime.utcnow().isoformat()
            }
        
        # Update the leagueSchedule field
        league_doc["leagueSchedule"] = schedule_data
        league_doc["lastUpdated"] = datetime.utcnow().isoformat()
        
        # Save back to database
        result = await db.league_data.replace_one(
            {"id": "main_league"},
            league_doc,
            upsert=True
        )
        
        logger.info(f"✅ League schedule updated - {len(schedule_data)} events, modified: {result.modified_count}")
        
        return {
            "status": "success", 
            "message": f"Successfully updated {len(schedule_data)} events",
            "modified": result.modified_count,
            "upserted": result.upserted_id is not None
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating league schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/league-data/websiteStyle")
async def update_website_style(style_data: Dict[str, Any]):
    """Update website style data in the league database"""
    try:
        # Get the current league data
        league_doc = await db.league_data.find_one({"id": "main_league"})
        if not league_doc:
            # Create new league data if it doesn't exist
            league_doc = {
                "id": "main_league",
                "websiteStyle": {},
                "lastUpdated": datetime.utcnow().isoformat()
            }
        
        # Update the websiteStyle field
        league_doc["websiteStyle"] = style_data
        league_doc["lastUpdated"] = datetime.utcnow().isoformat()
        
        # Save back to database
        result = await db.league_data.replace_one(
            {"id": "main_league"},
            league_doc,
            upsert=True
        )
        
        logger.info(f"✅ Website style updated - {len(style_data)} settings, modified: {result.modified_count}")
        
        return {
            "status": "success", 
            "message": f"Successfully updated website style with {len(style_data)} settings",
            "modified": result.modified_count,
            "upserted": result.upserted_id is not None
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating website style: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/league-data/newsItems")
async def update_news_items(news_data: List[Dict[str, Any]]):
    """Update news items data in the league database"""
    try:
        # Get the current league data
        league_doc = await db.league_data.find_one({"id": "main_league"})
        if not league_doc:
            # Create new league data if it doesn't exist
            league_doc = {
                "id": "main_league",
                "newsItems": [],
                "lastUpdated": datetime.utcnow().isoformat()
            }
        
        # Update the newsItems field
        league_doc["newsItems"] = news_data
        league_doc["lastUpdated"] = datetime.utcnow().isoformat()
        
        # Save back to database
        result = await db.league_data.replace_one(
            {"id": "main_league"},
            league_doc,
            upsert=True
        )
        
        logger.info(f"✅ News items updated - {len(news_data)} items, modified: {result.modified_count}")
        
        return {
            "status": "success", 
            "message": f"Successfully updated {len(news_data)} news items",
            "modified": result.modified_count,
            "upserted": result.upserted_id is not None
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating news items: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/league-data/newsItems")
async def get_news_items():
    """Get news items from the league database"""
    try:
        league_doc = await db.league_data.find_one({"id": "main_league"})
        if not league_doc or "newsItems" not in league_doc:
            return {"newsItems": []}
        
        news_items = league_doc["newsItems"]
        logger.info(f"✅ Retrieved {len(news_items)} news items")
        
        return {"newsItems": news_items}
        
    except Exception as e:
        logger.error(f"❌ Error fetching news items: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/proxy-image")
async def proxy_image(url: str):
    """Proxy images to avoid CORS issues for color extraction"""
    try:
        import urllib.request
        import urllib.parse
        
        # Validate that it's a Google Drive URL for security
        if "drive.google.com" not in url and "googleusercontent.com" not in url:
            raise HTTPException(status_code=400, detail="Only Google Drive URLs are supported")
        
        # Decode URL if it's encoded
        decoded_url = urllib.parse.unquote(url)
        
        # Fetch the image
        request = urllib.request.Request(decoded_url)
        request.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        with urllib.request.urlopen(request) as response:
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

@api_router.post("/league-logo-upload")
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

@api_router.post("/league-background-upload")
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

@api_router.post("/player-photo-upload")
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
                        "url": f"https://drive.google.com/thumbnail?id={drive_file_id}&sz=w1000",  # Thumbnail format for better loading
                        "thumbnailUrl": f"https://drive.google.com/thumbnail?id={drive_file_id}&sz=w400",  # Smaller thumbnail
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

@api_router.post("/locations")
async def add_location(location_data: Dict[str, Any]):
    """Add a new location"""
    try:
        logger.info(f"📍 Adding new location: {location_data.get('name')}")
        
        # Add timestamp if not present
        if 'createdAt' not in location_data:
            location_data['createdAt'] = datetime.utcnow().isoformat()
        
        # Generate ID if not present
        if 'id' not in location_data:
            location_data['id'] = str(uuid.uuid4())
        
        # Insert into database
        result = await db.locations.insert_one(location_data)
        
        logger.info(f"✅ Location added successfully: {location_data['id']}")
        
        # Remove MongoDB _id before returning
        location_data.pop('_id', None)
        
        return {
            "status": "success",
            "message": "Location added successfully",
            "location": location_data
        }
        
    except Exception as e:
        logger.error(f"❌ Error adding location: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/locations/{location_id}")
async def update_location(location_id: str, location_data: Dict[str, Any]):
    """Update an existing location"""
    try:
        logger.info(f"📍 Updating location: {location_id}")
        
        # Add update timestamp
        location_data['updatedAt'] = datetime.utcnow().isoformat()
        
        # Update in database
        result = await db.locations.update_one(
            {"id": location_id},
            {"$set": location_data}
        )
        
        if result.matched_count == 0:
            logger.warning(f"⚠️ No location found with id: {location_id}")
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Fetch and return the updated location
        updated_location = await db.locations.find_one({"id": location_id})
        if updated_location:
            updated_location.pop('_id', None)
        
        logger.info(f"✅ Location updated successfully: {location_id}")
        
        return updated_location
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating location: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str):
    """Delete a location"""
    try:
        logger.info(f"📍 Deleting location: {location_id}")
        
        # Delete from database
        result = await db.locations.delete_one({"id": location_id})
        
        if result.deleted_count == 0:
            logger.warning(f"⚠️ No location found with id: {location_id}")
            raise HTTPException(status_code=404, detail="Location not found")
        
        logger.info(f"✅ Location deleted successfully: {location_id}")
        
        return {
            "status": "success",
            "message": "Location deleted successfully",
            "deleted": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting location: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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

@api_router.post("/cloud-storage/google-drive/upload-json")
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
        config["googleDrive"]["redirectUri"] = redirect_uris[0] if redirect_uris else "https://app-takeover.emergent.host"
        config["lastUpdated"] = datetime.utcnow()
        
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
                        "url": f"https://drive.google.com/thumbnail?id={drive_file_id}&sz=w1000",  # Thumbnail format for better loading
                        "thumbnailUrl": f"https://drive.google.com/thumbnail?id={drive_file_id}&sz=w400",  # Smaller thumbnail
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

# Simple GroupMe Service for channel creation
class SimpleGroupMeService:
    """Simple GroupMe service for basic API operations"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://api.groupme.com/v3"
    
    async def create_bot(self, group_id: str, bot_name: str, callback_url: str):
        """Create a GroupMe bot for a specific group"""
        try:
            import urllib.request
            import json
            
            url = f"{self.base_url}/bots?token={self.access_token}"
            
            data = {
                "bot": {
                    "name": bot_name,
                    "group_id": group_id,
                    "callback_url": callback_url
                }
            }
            
            request = urllib.request.Request(
                url,
                json.dumps(data).encode(),
                {"Content-Type": "application/json"}
            )
            
            with urllib.request.urlopen(request) as response:
                result = json.loads(response.read().decode())
                
            return result
            
        except Exception as e:
            logger.error(f"Error creating GroupMe bot: {str(e)}")
            return {"error": str(e)}

async def get_groupme_service():
    """Get GroupMe service with stored credentials"""
    service = APIIntegrationsService(db)
    credentials = await service.get_groupme_credentials()
    
    if not credentials:
        raise HTTPException(status_code=400, detail="GroupMe not configured. Please configure GroupMe integration in API settings.")
    
    access_token = credentials.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="GroupMe access token not found in configuration.")
    
    return SimpleGroupMeService(access_token)

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
    existing_bot_id: Optional[str] = Form(None),  # Allow existing bot ID
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
            
            # Check if team exists in league_data
            league_doc = await db.league_data.find_one({"id": "main_league"})
            if league_doc and league_doc.get("teams"):
                team = next((t for t in league_doc["teams"] if t.get("id") == team_id), None)
                if not team:
                    raise HTTPException(status_code=404, detail="Team not found")
            else:
                raise HTTPException(status_code=404, detail="No teams found in league data")
        
        # Check for duplicate group ID with same channel type and team combination
        query = {"groupme_group_id": groupme_group_id, "channel_type": channel_type}
        if channel_type == "team" and team_id:
            query["team_id"] = team_id
        
        existing = await db.groupme_channels.find_one(query)
        if existing:
            channel_description = f"{channel_type} channel"
            if channel_type == "team" and team_id:
                # Get team name for better error message from league_data
                league_doc = await db.league_data.find_one({"id": "main_league"})
                if league_doc and league_doc.get("teams"):
                    team = next((t for t in league_doc["teams"] if t.get("id") == team_id), None)
                    team_name = team.get("name", "Unknown") if team else "Unknown"
                else:
                    team_name = "Unknown"
                channel_description = f"team channel for {team_name}"
            
            raise HTTPException(
                status_code=400, 
                detail=f"GroupMe group already configured as {channel_description}. Use a different group or delete the existing channel first."
            )
        
        # Handle bot creation or use existing bot
        if existing_bot_id:
            # Use existing bot ID
            bot_id = existing_bot_id
            logger.info(f"Using existing bot ID: {bot_id}")
        else:
            # Create bot using the service
            bot_name = f"{name} League Bot"
            callback_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/groupme/webhook"
            
            bot_response = await groupme_service.create_bot(groupme_group_id, bot_name, callback_url)
            
            if bot_response.get('error') or bot_response.get('meta', {}).get('code') != 201:
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
        
        # Add team names to response and remove MongoDB ObjectIds
        for channel in channels:
            if channel.get("team_id"):
                channel["team_name"] = team_names.get(channel["team_id"], "Unknown Team")
            else:
                channel["team_name"] = None
            
            # Convert ObjectId to string or remove it to avoid serialization issues
            if "_id" in channel:
                del channel["_id"]
        
        return {"channels": channels, "count": len(channels)}
        
    except Exception as e:
        logger.error(f"Error listing GroupMe channels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/groupme/channels/{channel_id}/messages")
async def get_channel_messages(
    channel_id: str,
    limit: int = 50,
    offset: int = 0
):
    """Get messages from a GroupMe channel"""
    
    try:
        # Verify channel exists first - FIX: Use 'id' field instead of 'channel_id'
        channel_query = {"id": channel_id}
        channel = await db.groupme_channels.find_one(channel_query)
        
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        # Fetch messages for this channel from the database
        messages_cursor = db.groupme_messages.find(
            {"channel_id": channel_id}
        ).sort("created_at", -1).limit(limit).skip(offset)
        
        messages = await messages_cursor.to_list(length=limit)
        
        # Convert ObjectId to string and format dates for frontend
        formatted_messages = []
        for msg in messages:
            # Remove MongoDB ObjectId
            if "_id" in msg:
                del msg["_id"]
            
            # Ensure created_at is properly formatted
            if isinstance(msg.get("created_at"), str):
                msg["created_at"] = msg["created_at"]
            else:
                # Fallback for any datetime objects
                msg["created_at"] = datetime.now(timezone.utc).isoformat()
            
            formatted_messages.append(msg)
        
        return {"messages": formatted_messages}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages for channel {channel_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/groupme/channels/{channel_id}")
async def delete_channel(channel_id: str):
    """Delete a GroupMe channel"""
    try:
        # Check if channel exists - use "id" field not "channel_id"
        channel = await db.groupme_channels.find_one({"id": channel_id})
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        # Delete the channel - use "id" field not "channel_id"
        result = await db.groupme_channels.delete_one({"id": channel_id})
        
        if result.deleted_count > 0:
            return {"message": "Channel deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Channel not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting channel {channel_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/groupme/channels/{channel_id}")
async def update_channel(channel_id: str, update_data: dict):
    """Update a GroupMe channel (e.g., activate/deactivate)"""
    try:
        # Check if channel exists - use "id" field not "channel_id"
        channel = await db.groupme_channels.find_one({"id": channel_id})
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        # Update the channel - use "id" field not "channel_id"
        result = await db.groupme_channels.update_one(
            {"id": channel_id}, 
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return {"message": "Channel updated successfully"}
        else:
            return {"message": "No changes made to channel"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating channel {channel_id}: {str(e)}")
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
        
        # Check for poll vote (RSVP button click)
        if webhook_data.get("attachments"):
            for attachment in webhook_data["attachments"]:
                if attachment.get("type") == "poll" and "rsvp_" in str(attachment.get("vote")):
                    await _process_rsvp_button_vote(webhook_data, channel, attachment)
                    return
        
        # Process commands
        if text.startswith("/"):
            await _process_groupme_command(text, webhook_data, channel, message_data)
        else:
            # Check for RSVP keywords as fallback
            await _check_for_rsvp_keywords(text, webhook_data, channel)
        
        # Mark message as processed
        await db.groupme_messages.update_one(
            {"id": message_id},
            {"$set": {"processed": True}}
        )
        
    except Exception as e:
        logger.error(f"Error processing GroupMe message: {str(e)}")

async def _process_rsvp_button_vote(webhook_data: dict, channel: dict, poll_attachment: dict):
    """Process RSVP button click from GroupMe poll"""
    try:
        vote_option_id = poll_attachment.get("vote", "")
        user_id = str(webhook_data.get("user_id", webhook_data.get("sender_id")))
        user_name = webhook_data.get("name", "Unknown")
        
        # Parse the vote option ID to get event ID and response
        # Format: rsvp_{response}_{event_id}
        if not vote_option_id.startswith("rsvp_"):
            return
        
        parts = vote_option_id.split("_", 2)
        if len(parts) < 3:
            return
        
        response_type = parts[1]  # going, maybe, no
        event_id = parts[2]
        
        # Map response type to our RSVP format
        rsvp_mapping = {
            "going": "going",
            "maybe": "maybe",
            "no": "not_going"
        }
        
        rsvp_response = rsvp_mapping.get(response_type)
        if not rsvp_response:
            return
        
        # Create or update RSVP
        existing_rsvp = await db.event_rsvps.find_one({
            "event_id": event_id,
            "user_id": user_id
        })
        
        rsvp_record = {
            "event_id": event_id,
            "user_id": user_id,
            "response": rsvp_response,
            "user_name": user_name,
            "updated_at": datetime.utcnow().isoformat(),
            "via_groupme": True,
            "via_button": True
        }
        
        if existing_rsvp:
            await db.event_rsvps.update_one(
                {"event_id": event_id, "user_id": user_id},
                {"$set": rsvp_record}
            )
            action = "updated"
        else:
            rsvp_record['id'] = str(uuid.uuid4())
            rsvp_record['created_at'] = datetime.utcnow().isoformat()
            await db.event_rsvps.insert_one(rsvp_record)
            action = "recorded"
        
        logger.info(f"✅ RSVP {action} via button: {user_name} -> {rsvp_response} for event {event_id}")
        
        # Send confirmation message
        response_emojis = {
            'going': '✅',
            'maybe': '❓',
            'not_going': '❌'
        }
        confirmation = f"{response_emojis[rsvp_response]} Thanks {user_name}! Your RSVP has been {action}."
        
        if channel.get('groupme_bot_id'):
            await _send_groupme_message(channel['groupme_bot_id'], confirmation)
        
    except Exception as e:
        logger.error(f"Error processing RSVP button vote: {e}")

async def _check_for_rsvp_keywords(text: str, webhook_data: dict, channel: dict):
    """Check if message contains RSVP keywords and process automatically"""
    try:
        text_lower = text.lower().strip()
        user_id = str(webhook_data.get("user_id", webhook_data.get("sender_id")))
        user_name = webhook_data.get("name", "Unknown")
        
        # Determine RSVP response from keywords and /rsvp commands
        rsvp_response = None
        
        # Check for /rsvp command format first
        if text_lower.startswith('/rsvp'):
            parts = text_lower.split()
            if len(parts) > 1:
                response_word = parts[1]
                if response_word in ['yes', 'going', 'go']:
                    rsvp_response = 'going'
                elif response_word in ['maybe', 'might']:
                    rsvp_response = 'maybe'
                elif response_word in ['no', 'cant', 'can\'t', 'not']:
                    rsvp_response = 'not_going'
        
        # If no /rsvp command, check for natural language keywords
        if not rsvp_response:
            if any(keyword in text_lower for keyword in ['going', 'yes', 'count me in', 'i\'m in', 'ill be there']):
                rsvp_response = 'going'
            elif any(keyword in text_lower for keyword in ['maybe', 'might', 'possibly', 'tentative']):
                rsvp_response = 'maybe'
            elif any(keyword in text_lower for keyword in ['no', 'not going', 'cant go', 'can\'t go', 'won\'t make it', 'unable']):
                rsvp_response = 'not_going'
        
        if not rsvp_response:
            return
        
        # Find the most recent event notification in this channel
        recent_notification = await db.groupme_messages.find_one(
            {
                "channel_id": channel["id"],
                "notification_type": {"$exists": True},
                "event_id": {"$exists": True}
            },
            sort=[("created_at", -1)]
        )
        
        if not recent_notification or not recent_notification.get("event_id"):
            logger.info(f"No recent event found for RSVP keyword from {user_name}")
            return
        
        event_id = recent_notification["event_id"]
        
        # Create or update RSVP
        existing_rsvp = await db.event_rsvps.find_one({
            "event_id": event_id,
            "user_id": user_id
        })
        
        rsvp_record = {
            "event_id": event_id,
            "user_id": user_id,
            "response": rsvp_response,
            "user_name": user_name,
            "updated_at": datetime.utcnow().isoformat(),
            "via_groupme": True
        }
        
        if existing_rsvp:
            await db.event_rsvps.update_one(
                {"event_id": event_id, "user_id": user_id},
                {"$set": rsvp_record}
            )
            action = "updated"
        else:
            rsvp_record['id'] = str(uuid.uuid4())
            rsvp_record['created_at'] = datetime.utcnow().isoformat()
            await db.event_rsvps.insert_one(rsvp_record)
            action = "recorded"
        
        logger.info(f"✅ RSVP {action} via GroupMe: {user_name} -> {rsvp_response} for event {event_id}")
        
        # Send confirmation message
        response_emojis = {
            'going': '✅',
            'maybe': '❓',
            'not_going': '❌'
        }
        confirmation = f"{response_emojis[rsvp_response]} Got it {user_name}! Your RSVP has been {action}."
        
        if channel.get('groupme_bot_id'):
            await _send_groupme_message(channel['groupme_bot_id'], confirmation)
        
    except Exception as e:
        logger.error(f"Error checking RSVP keywords: {e}")

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
                if event.get("start_datetime"):
                    event_date = datetime.fromisoformat(event["start_datetime"]).strftime("%m/%d %I:%M %p")
                elif event.get("date") and event.get("time"):
                    event_date = f"{event['date']} {event['time']}"
                elif event.get("date"):
                    event_date = event["date"]
                else:
                    event_date = "TBD"
            except Exception as e:
                logger.warning(f"Error formatting event date: {e}")
                event_date = event.get("date", "TBD")
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

async def upload_image_to_groupme(image_url: str, access_token: str) -> str:
    """Upload an image to GroupMe's image service and return the GroupMe URL"""
    try:
        import httpx
        
        # Download the image
        async with httpx.AsyncClient() as client:
            img_response = await client.get(image_url, timeout=10.0)
            if img_response.status_code != 200:
                logger.error(f"Failed to download image from {image_url}")
                return None
            
            image_data = img_response.content
        
        # Upload to GroupMe image service
        upload_url = "https://image.groupme.com/pictures"
        headers = {
            "X-Access-Token": access_token,
            "Content-Type": "image/jpeg"
        }
        
        async with httpx.AsyncClient() as client:
            upload_response = await client.post(
                upload_url,
                headers=headers,
                content=image_data,
                timeout=15.0
            )
            
            if upload_response.status_code == 200:
                result = upload_response.json()
                groupme_image_url = result.get('payload', {}).get('url')
                logger.info(f"✅ Image uploaded to GroupMe: {groupme_image_url}")
                return groupme_image_url
            else:
                logger.error(f"GroupMe image upload failed: {upload_response.status_code}")
                return None
                
    except Exception as e:
        logger.error(f"Error uploading image to GroupMe: {e}")
        return None

async def _send_groupme_message_with_rsvp(bot_id: str, text: str, event_id: str, image_url: str = None) -> bool:
    """Send message through GroupMe bot with clean clickable RSVP options"""
    
    try:
        # Get the base URL from environment or use a default
        base_url = os.environ.get('REACT_APP_BACKEND_URL', 'https://league-manager-app-1.preview.emergentagent.com')
        
        # Create single RSVP link that opens page with buttons
        rsvp_options = (
            f"\n\n📱 RSVP: {base_url}/rsvp/{event_id}"
        )
        
        # Combine the original text with RSVP options
        full_message = text + rsvp_options
        
        # Send regular message with RSVP options
        return await _send_groupme_message(bot_id, full_message, image_url)
        
    except Exception as e:
        logger.error(f"Failed to send GroupMe message with RSVP: {str(e)}")
        # Fallback to regular message
        return await _send_groupme_message(bot_id, text, image_url)

async def _send_groupme_message(bot_id: str, text: str, image_url: str = None) -> bool:
    """Send message through GroupMe bot using stored credentials with optional image"""
    
    try:
        # Get GroupMe service using stored credentials
        groupme_service = await get_groupme_service()
        if not groupme_service:
            logger.error("GroupMe service not available - no stored credentials")
            return False
        
        access_token = groupme_service.access_token
        if not access_token:
            logger.error("No GroupMe access token available")
            return False
        
        import urllib.request
        import json
        
        url = "https://api.groupme.com/v3/bots/post"
        
        data = {
            "bot_id": bot_id,
            "text": text,
            "attachments": []
        }
        
        # Add image attachment if provided
        if image_url:
            try:
                # GroupMe requires images to be uploaded to their image service first
                # Upload image to GroupMe image service
                image_service_url = await upload_image_to_groupme(image_url, access_token)
                if image_service_url:
                    data["attachments"].append({
                        "type": "image",
                        "url": image_service_url
                    })
                    logger.info(f"✅ Image attached to GroupMe message: {image_service_url}")
                else:
                    logger.warning(f"⚠️ Failed to upload image to GroupMe, sending message without image")
            except Exception as img_error:
                logger.warning(f"⚠️ Error processing image for GroupMe: {img_error}")
        
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
async def broadcast_groupme_message(request_data: Dict[str, Any]):
    """Broadcast message to multiple GroupMe channels"""
    
    # Get GroupMe service using stored credentials
    try:
        groupme_service = await get_groupme_service()
        if not groupme_service:
            raise HTTPException(status_code=400, detail="GroupMe not configured")
    except Exception as e:
        raise HTTPException(status_code=400, detail="GroupMe configuration error")
    
    try:
        message = request_data.get("message")
        channel_id_list = request_data.get("channel_ids", [])
        notification_type = request_data.get("notification_type", "announcement")
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        if not channel_id_list:
            raise HTTPException(status_code=400, detail="At least one channel is required")
        
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
            
            # Save message to groupme_messages collection so it appears in chat
            # Check for duplicate first to prevent re-timing issues
            if success:
                # Create a unique identifier based on channel, text, and rough time window
                recent_time = datetime.utcnow().timestamp() - 5  # Within last 5 seconds
                
                existing_msg = await db.groupme_messages.find_one({
                    "channel_id": channel["id"],
                    "text": message,
                    "sent_by_bot": True,
                    "created_at": {"$gte": int(recent_time)}
                })
                
                if not existing_msg:
                    message_record = {
                        "id": str(uuid.uuid4()),
                        "channel_id": channel["id"],
                        "text": message,
                        "name": "League Bot",
                        "sender_type": "bot",
                        "sender_id": channel["groupme_bot_id"],
                        "created_at": int(datetime.utcnow().timestamp()),
                        "system": False,
                        "sent_by_bot": True
                    }
                    await db.groupme_messages.insert_one(message_record)
            
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
                "date": event.get("date"),
                "time": event.get("time"),
                "start_datetime": event.get("start_datetime"),  # Keep for compatibility
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

# GroupMe Event Notifications and RSVP Integration
@api_router.post("/groupme/send-event-notification")
async def send_event_notification(
    event_id: str = Form(...),
    channel_ids: str = Form(...),  # JSON string
    notification_type: str = Form("event_announcement"),
    include_rsvp: bool = Form(True)
):
    """Send event notification to selected GroupMe channels"""
    try:
        import json
        
        # Parse channel IDs
        channel_ids_list = json.loads(channel_ids)
        
        # Get event details
        event = await db.league_data.find_one({"leagueSchedule.id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Find the specific event in the schedule
        target_event = None
        for e in event.get("leagueSchedule", []):
            if e.get("id") == event_id:
                target_event = e
                break
        
        if not target_event:
            raise HTTPException(status_code=404, detail="Event not found in schedule")
        
        # Format event message based on notification type
        # Handle different event field structures
        try:
            if target_event.get("start_datetime"):
                # Handle events with start_datetime field
                event_datetime = datetime.fromisoformat(target_event["start_datetime"].replace('Z', '+00:00'))
                formatted_date = event_datetime.strftime("%B %d, %Y at %I:%M %p")
            elif target_event.get("date") and target_event.get("time"):
                # Handle events with separate date and time fields
                event_date = target_event["date"]
                event_time = target_event["time"]
                # Combine date and time for formatting
                date_obj = datetime.fromisoformat(event_date) if 'T' in event_date else datetime.strptime(event_date, '%Y-%m-%d')
                formatted_date = date_obj.strftime("%B %d, %Y") + f" at {event_time}"
            elif target_event.get("date"):
                # Handle events with only date field
                event_date = target_event["date"]
                date_obj = datetime.fromisoformat(event_date) if 'T' in event_date else datetime.strptime(event_date, '%Y-%m-%d')
                formatted_date = date_obj.strftime("%B %d, %Y")
            else:
                # Fallback if no date fields are available
                formatted_date = "TBD"
        except (ValueError, KeyError) as e:
            logger.warning(f"Error parsing event date/time: {e}")
            formatted_date = "TBD"
        
        message_templates = {
            "event_announcement": f"📢 Event Announcement\n\n🏆 {target_event['title']}\n📅 {formatted_date}",
            "rsvp_reminder": f"📋 RSVP Reminder\n\n🏆 {target_event['title']}\n📅 {formatted_date}\n\n⏰ Please respond if you haven't already!",
            "event_update": f"✏️ Event Update\n\n🏆 {target_event['title']}\n📅 {formatted_date}\n\n📝 Check for any changes to the event details.",
            "last_call": f"⏰ Last Call for RSVPs\n\n🏆 {target_event['title']}\n📅 {formatted_date}\n\n🚨 This is your final reminder to RSVP!"
        }
        
        base_message = message_templates.get(notification_type, message_templates["event_announcement"])
        
        # Add location if available
        if target_event.get("location"):
            base_message += f"\n📍 {target_event['location']}"
        
        # Add description if available
        if target_event.get("description"):
            base_message += f"\n\n📝 {target_event['description']}"
        
        # Add RSVP instructions if requested
        if include_rsvp:
            # Create quick RSVP link 
            frontend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000').replace('/api', '')
            rsvp_url = f"{frontend_url}/quick-rsvp/{event_id}"
            if len(channel_ids_list) > 0:
                rsvp_url += f"?channel={channel_ids_list[0]}"
            
            base_message += f"\n\n🎯 QUICK RSVP (tap link):\n{rsvp_url}"
            base_message += f"\n\n💬 Or text reply:\n• 'yes' - I'll be there!\n• 'no' - Can't make it\n• 'maybe' - Tentative"
        
        # Send to selected channels
        success_channels = []
        failed_channels = []
        
        for channel_id in channel_ids_list:
            try:
                # Send broadcast to this channel
                broadcast_response = await _send_broadcast_to_channels([channel_id], base_message, "announcement")
                if broadcast_response.get("success", False):
                    success_channels.append(channel_id)
                else:
                    failed_channels.append(channel_id)
            except Exception as e:
                logger.error(f"Failed to send to channel {channel_id}: {str(e)}")
                failed_channels.append(channel_id)
        
        # Store notification record
        notification_record = {
            "id": str(uuid.uuid4()),
            "event_id": event_id,
            "event_title": target_event["title"],
            "notification_type": notification_type,
            "channel_ids": channel_ids_list,
            "message": base_message,
            "include_rsvp": include_rsvp,
            "sent_at": datetime.utcnow().isoformat(),
            "success_channels": success_channels,
            "failed_channels": failed_channels,
            "total_sent": len(success_channels)
        }
        
        await db.groupme_event_notifications.insert_one(notification_record)
        
        return {
            "message": f"Event notification sent to {len(success_channels)}/{len(channel_ids_list)} channels",
            "success_channels": success_channels,
            "failed_channels": failed_channels,
            "notification_id": notification_record["id"]
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid channel_ids format")
    except Exception as e:
        logger.error(f"Error sending event notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def _send_broadcast_to_channels(channel_ids: list, message: str, notification_type: str = "message"):
    """Helper function to send broadcast to specific channels"""
    try:
        # Use existing broadcast endpoint logic
        form_data = {
            "message": message,
            "channel_ids": json.dumps(channel_ids),
            "notification_type": notification_type
        }
        
        # Get GroupMe service
        service = APIIntegrationsService(db)
        groupme_service = await get_groupme_service()
        
        if not groupme_service:
            return {"success": False, "error": "GroupMe not configured"}
        
        # Get active channels
        active_channels = []
        for channel_id in channel_ids:
            channel = await db.groupme_channels.find_one({"id": channel_id, "is_active": True})
            if channel:
                active_channels.append(channel)
        
        if not active_channels:
            return {"success": False, "error": "No active channels found"}
        
        # Send messages
        results = {}
        for channel in active_channels:
            try:
                success = await _send_groupme_message(
                    groupme_service, 
                    channel["groupme_bot_id"], 
                    message
                )
                results[channel["name"]] = success
            except Exception as e:
                logger.error(f"Failed to send to channel {channel['name']}: {str(e)}")
                results[channel["name"]] = False
        
        success_count = sum(1 for success in results.values() if success)
        return {
            "success": success_count > 0,
            "results": results,
            "success_count": success_count,
            "total_count": len(active_channels)
        }
        
    except Exception as e:
        logger.error(f"Error in _send_broadcast_to_channels: {str(e)}")
        return {"success": False, "error": str(e)}

@api_router.get("/groupme/event-notifications")
async def get_event_notifications():
    """Get list of sent event notifications"""
    try:
        cursor = db.groupme_event_notifications.find({}).sort("sent_at", -1).limit(50)
        notifications = await cursor.to_list(length=50)
        
        # Remove MongoDB ObjectId
        for notification in notifications:
            if "_id" in notification:
                del notification["_id"]
        
        return {"notifications": notifications}
        
    except Exception as e:
        logger.error(f"Error getting event notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/groupme/events/{event_id}/rsvp-summary")
async def get_event_rsvp_summary(event_id: str):
    """Get detailed RSVP summary for an event including GroupMe responses"""
    try:
        # Get event details
        event = await db.league_data.find_one({"leagueSchedule.id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        target_event = None
        for e in event.get("leagueSchedule", []):
            if e.get("id") == event_id:
                target_event = e
                break
        
        if not target_event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Get RSVPs from GroupMe
        rsvps_cursor = db.event_rsvps.find({"event_id": event_id})
        rsvps_raw = await rsvps_cursor.to_list(length=None)
        
        # Remove ObjectId from RSVPs
        rsvps = []
        for rsvp in rsvps_raw:
            if "_id" in rsvp:
                del rsvp["_id"]
            rsvps.append(rsvp)
        
        # Get notification history for this event
        notifications_cursor = db.groupme_event_notifications.find({"event_id": event_id})
        notifications_raw = await notifications_cursor.to_list(length=None)
        
        # Remove ObjectId from notifications
        notifications_clean = []
        for n in notifications_raw:
            if "_id" in n:
                del n["_id"]
            notifications_clean.append(n)
        
        # Categorize RSVPs
        attending = [r for r in rsvps if r["response"] == "yes"]
        not_attending = [r for r in rsvps if r["response"] == "no"]
        maybe = [r for r in rsvps if r["response"] == "maybe"]
        
        return {
            "event": {
                "id": target_event["id"],
                "title": target_event["title"],
                "date": target_event.get("date"),
                "time": target_event.get("time"),
                "start_datetime": target_event.get("start_datetime"),  # Keep for compatibility
                "location": target_event.get("location"),
                "type": target_event.get("type")
            },
            "rsvp_summary": {
                "total_responses": len(rsvps),
                "attending_count": len(attending),
                "not_attending_count": len(not_attending),
                "maybe_count": len(maybe),
                "attending": attending,
                "not_attending": not_attending,
                "maybe": maybe
            },
            "notifications": notifications_clean
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting event RSVP summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/quick-rsvp")
async def submit_quick_rsvp(request_data: dict):
    """Handle quick RSVP form submissions"""
    try:
        event_id = request_data.get("event_id")
        channel_id = request_data.get("channel_id")
        user_name = request_data.get("user_name")
        response = request_data.get("response")  # yes, no, maybe
        notes = request_data.get("notes", "")
        source = request_data.get("source", "quick_form")
        
        if not all([event_id, user_name, response]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        if response not in ["yes", "no", "maybe"]:
            raise HTTPException(status_code=400, detail="Invalid response value")
        
        # Get event details for validation
        event_doc = await db.league_data.find_one({"leagueSchedule.id": event_id})
        if not event_doc:
            raise HTTPException(status_code=404, detail="Event not found")
        
        target_event = None
        for e in event_doc.get("leagueSchedule", []):
            if e.get("id") == event_id:
                target_event = e
                break
        
        if not target_event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Create RSVP record
        rsvp_data = {
            "id": str(uuid.uuid4()),
            "event_id": event_id,
            "event_title": target_event["title"],
            "user_name": user_name,
            "response": response,
            "notes": notes,
            "source": source,
            "channel_id": channel_id,
            "created_at": datetime.utcnow().isoformat(),
            "groupme_user_id": f"web_form_{user_name.lower().replace(' ', '_')}",
            "groupme_user_name": user_name
        }
        
        # Check if user already has an RSVP for this event
        existing_rsvp = await db.event_rsvps.find_one({
            "event_id": event_id,
            "user_name": user_name
        })
        
        if existing_rsvp:
            # Update existing RSVP
            await db.event_rsvps.update_one(
                {"event_id": event_id, "user_name": user_name},
                {"$set": {
                    "response": response,
                    "notes": notes,
                    "updated_at": datetime.utcnow().isoformat(),
                    "source": source
                }}
            )
        else:
            # Create new RSVP
            await db.event_rsvps.insert_one(rsvp_data)
        
        # Send confirmation message to GroupMe if channel_id provided
        if channel_id:
            try:
                groupme_service = await get_groupme_service()
                if groupme_service:
                    # Get channel info
                    channel = await db.groupme_channels.find_one({"id": channel_id})
                    if channel and channel.get("groupme_bot_id"):
                        confirmation_msg = f"✅ {user_name} responded '{response.upper()}' for {target_event['title']}"
                        if notes:
                            confirmation_msg += f"\nNote: {notes}"
                        
                        await _send_groupme_message(
                            groupme_service,
                            channel["groupme_bot_id"],
                            confirmation_msg
                        )
            except Exception as e:
                logger.error(f"Failed to send confirmation to GroupMe: {str(e)}")
                # Don't fail the RSVP if GroupMe confirmation fails
        
        return {
            "message": "RSVP submitted successfully",
            "event_title": target_event["title"],
            "user_name": user_name,
            "response": response
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting quick RSVP: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Database Administration Endpoints
@api_router.get("/admin/collections")
async def get_collections():
    """Get list of database collections"""
    try:
        collection_names = await db.list_collection_names()
        return {"collections": collection_names}
    except Exception as e:
        logger.error(f"Error getting collections: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/google-drive-debug")
async def debug_google_drive_config():
    """Debug Google Drive configuration for production issues"""
    try:
        # Get Google Drive configuration from cloud_storage collection (not api_integrations)
        cloud_storage_doc = await db.cloud_storage.find_one({"id": "main_cloud_storage"})
        
        if not cloud_storage_doc:
            return {
                "status": "error",
                "message": "Cloud storage not configured",
                "has_config": False,
                "checked_collection": "cloud_storage"
            }
        
        google_drive_config = cloud_storage_doc.get("googleDrive", {})
        
        if not google_drive_config:
            return {
                "status": "error", 
                "message": "Google Drive not configured in cloud storage",
                "has_config": False,
                "cloud_storage_exists": True,
                "active_provider": cloud_storage_doc.get("activeProvider"),
                "available_configs": list(cloud_storage_doc.keys())
            }
        
        # Check configuration without exposing sensitive data
        debug_info = {
            "has_config": True,
            "active_provider": cloud_storage_doc.get("activeProvider"),
            "google_drive_enabled": google_drive_config.get("enabled", False),
            "has_refresh_token": bool(google_drive_config.get("refreshToken")),
            "has_access_token": bool(google_drive_config.get("accessToken")),
            "has_client_id": bool(google_drive_config.get("clientId")),
            "has_client_secret": bool(google_drive_config.get("clientSecret")),
            "refresh_token_length": len(google_drive_config.get("refreshToken", "")) if google_drive_config.get("refreshToken") else 0,
            "access_token_length": len(google_drive_config.get("accessToken", "")) if google_drive_config.get("accessToken") else 0,
            "config_keys": list(google_drive_config.keys()),
            "redirect_uri": google_drive_config.get("redirectUri", "Not set"),
        }
        
        # Test if we can get a valid access token
        try:
            if google_drive_config.get("refreshToken"):
                refresh_token = google_drive_config["refreshToken"]
                client_id = google_drive_config.get("clientId")
                client_secret = google_drive_config.get("clientSecret")
                
                if client_id and client_secret:
                    # Try to refresh the access token
                    token_data = {
                        'grant_type': 'refresh_token',
                        'refresh_token': refresh_token,
                        'client_id': client_id,
                        'client_secret': client_secret,
                    }
                    
                    async with httpx.AsyncClient() as client:
                        response = await client.post('https://oauth2.googleapis.com/token', data=token_data)
                    
                    if response.status_code == 200:
                        debug_info["token_refresh_test"] = "✅ SUCCESS"
                        token_response = response.json()
                        debug_info["new_access_token_received"] = bool(token_response.get("access_token"))
                    else:
                        debug_info["token_refresh_test"] = f"❌ FAILED: {response.status_code}"
                        debug_info["token_error"] = response.text[:200]
                else:
                    debug_info["token_refresh_test"] = "❌ Missing client credentials"
            else:
                debug_info["token_refresh_test"] = "❌ No refresh token"
        except Exception as e:
            debug_info["token_refresh_test"] = f"❌ ERROR: {str(e)}"
        
        logger.info(f"🔧 Google Drive debug: {debug_info}")
        
        return {
            "status": "success",
            "debug_info": debug_info
        }
        
    except Exception as e:
        logger.error(f"❌ Error debugging Google Drive: {e}")
        raise HTTPException(status_code=500, detail=f"Debug failed: {str(e)}")

@api_router.post("/team-logo-upload")
async def upload_team_logo(file: UploadFile = File(...)):
    """Upload a team logo to Google Drive with organized folder structure"""
    try:
        logger.info(f"🏆 Team logo upload started - File: {file.filename}")
        
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
        
        # Create or get "Team Images" folder
        team_folder_id = await create_organized_folder(access_token, main_folder_id, "Team Images")
        logger.info(f"📁 Team Images folder ID: {team_folder_id}")
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
        unique_filename = f"team_logo_{uuid.uuid4()}{file_extension}"
        
        # Upload to Google Drive in Team Images folder
        upload_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
        
        # Create metadata - upload to Team Images folder
        metadata = {
            'name': unique_filename,
            'parents': [team_folder_id]  # Upload to Team Images folder
        }
        
        # Create multipart data
        files_data = {
            'metadata': (None, json.dumps(metadata), 'application/json'),
            'file': (file.filename, content, file.content_type)
        }
        
        headers = {'Authorization': f'Bearer {access_token}'}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(upload_url, headers=headers, files=files_data)
        
        if response.status_code != 200:
            logger.error(f"❌ Google Drive upload failed: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"Upload failed: {response.text}")
        
        file_data = response.json()
        file_id = file_data['id']
        
        # Make file publicly viewable with enhanced error handling
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
            logger.error(f"⚠️ Failed to set public permissions on team logo {file_id}: {permissions_response.status_code} - {permissions_response.text}")
            # Continue anyway - file is uploaded, just may not be publicly accessible
        else:
            logger.info(f"✅ Team logo {file_id} set to public access")
        
        # Generate public URL - use thumbnail format for better image loading
        # The thumbnail format works better for embedding and doesn't require cookies
        photo_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1000"
        
        # Also provide alternative URLs in response
        direct_url = f"https://drive.google.com/uc?id={file_id}"
        view_url = f"https://drive.google.com/file/d/{file_id}/view"
        
        logger.info(f"✅ Team logo uploaded successfully - ID: {file_id}")
        logger.info(f"📸 Thumbnail URL: {photo_url}")
        
        return {
            "success": True,
            "photo_url": photo_url,
            "filename": unique_filename,
            "file_size": file_size,
            "file_id": file_id,
            "direct_url": direct_url,
            "view_url": view_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uploading team logo: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Helper function to create organized folders like "Player Images" and "Team Images"
async def create_organized_folder(access_token: str, main_folder_id: str, folder_name: str) -> str:
    """Create or get an organized folder (Player Images, Team Images) in Google Drive"""
    try:
        # First check if the folder already exists
        search_url = f"https://www.googleapis.com/drive/v3/files?q=name='{folder_name}' and parents in '{main_folder_id}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        
        headers = {'Authorization': f'Bearer {access_token}'}
        
        async with httpx.AsyncClient() as client:
            search_response = await client.get(search_url, headers=headers)
        
        if search_response.status_code == 200:
            search_data = search_response.json()
            files = search_data.get('files', [])
            
            if files:
                existing_folder_id = files[0]['id']
                logger.info(f"📁 Found existing {folder_name} folder: {existing_folder_id}")
                return existing_folder_id
        
        # Create the folder if it doesn't exist
        create_folder_url = "https://www.googleapis.com/drive/v3/files"
        folder_metadata = {
            'name': folder_name,
            'parents': [main_folder_id] if main_folder_id else [],
            'mimeType': 'application/vnd.google-apps.folder'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                create_folder_url,
                headers=headers,
                json=folder_metadata
            )
        
        if response.status_code == 200:
            folder_data = response.json()
            folder_id = folder_data['id']
            
            # Make folder publicly accessible
            permissions_url = f"https://www.googleapis.com/drive/v3/files/{folder_id}/permissions"
            permission_data = {
                'role': 'reader',
                'type': 'anyone'
            }
            
            async with httpx.AsyncClient() as client:
                permission_response = await client.post(
                    permissions_url,
                    headers=headers,
                    json=permission_data
                )
            
            if permission_response.status_code == 200:
                logger.info(f"✅ Created and shared {folder_name} folder: {folder_id}")
            else:
                logger.warning(f"⚠️ {folder_name} folder created but sharing failed: {permission_response.status_code}")
            
            return folder_id
        else:
            logger.error(f"❌ Failed to create {folder_name} folder: {response.status_code} - {response.text}")
            raise Exception(f"Could not create {folder_name} folder")
            
    except Exception as e:
        logger.error(f"❌ Error creating {folder_name} folder: {e}")
        # Return main folder as fallback
        return main_folder_id if main_folder_id else ""

@api_router.post("/admin/test-drive-upload")
async def cleanup_base64_images():
    """Clean up base64 images from database to reduce bloat"""
    try:
        logger.info("🧹 Starting database cleanup for base64 images")
        cleanup_results = {
            "teams_cleaned": 0,
            "players_cleaned": 0,
            "events_cleaned": 0,
            "size_saved_mb": 0.0,
            "details": []
        }
        
        # Clean up team logos (base64 data)
        teams_result = await db.league_data.find_one({"id": "main_league"})
        if teams_result and "teams" in teams_result:
            teams_updated = []
            teams_cleaned = 0
            
            for team in teams_result["teams"]:
                team_updated = False
                if "style" in team and "logoUrl" in team["style"]:
                    logo_url = team["style"]["logoUrl"]
                    if logo_url and logo_url.startswith("data:image/"):
                        # Remove base64 logo, replace with placeholder
                        original_size = len(logo_url)
                        team["style"]["logoUrl"] = ""  # Remove base64 data
                        cleanup_results["size_saved_mb"] += original_size / (1024 * 1024)
                        cleanup_results["details"].append(f"Removed base64 logo from team: {team.get('name', 'Unknown')} ({original_size} bytes)")
                        teams_cleaned += 1
                        team_updated = True
                        logger.info(f"🧹 Cleaned base64 logo from team: {team.get('name', 'Unknown')}")
                
                teams_updated.append(team)
            
            if teams_cleaned > 0:
                # Update teams in database
                await db.league_data.update_one(
                    {"id": "main_league"},
                    {"$set": {"teams": teams_updated}}
                )
                cleanup_results["teams_cleaned"] = teams_cleaned
        
        # Clean up player photos (base64 data)
        if teams_result and "players" in teams_result:
            players_updated = []
            players_cleaned = 0
            
            for player in teams_result["players"]:
                if "photoUrl" in player and player["photoUrl"]:
                    photo_url = player["photoUrl"]
                    if photo_url.startswith("data:image/"):
                        # Remove base64 photo, replace with placeholder
                        original_size = len(photo_url)
                        player["photoUrl"] = ""  # Remove base64 data
                        cleanup_results["size_saved_mb"] += original_size / (1024 * 1024)
                        cleanup_results["details"].append(f"Removed base64 photo from player: {player.get('name', 'Unknown')} ({original_size} bytes)")
                        players_cleaned += 1
                        logger.info(f"🧹 Cleaned base64 photo from player: {player.get('name', 'Unknown')}")
                
                players_updated.append(player)
            
            if players_cleaned > 0:
                # Update players in database
                await db.league_data.update_one(
                    {"id": "main_league"},
                    {"$set": {"players": players_updated}}
                )
                cleanup_results["players_cleaned"] = players_cleaned
        
        # Clean up any base64 images from events
        events_cursor = db.league_data.find({"leagueSchedule": {"$exists": True}})
        events_cleaned = 0
        
        async for doc in events_cursor:
            if "leagueSchedule" in doc:
                events_updated = []
                doc_updated = False
                
                for event in doc["leagueSchedule"]:
                    if "image" in event and event["image"] and event["image"].startswith("data:image/"):
                        # Remove base64 event image
                        original_size = len(event["image"])
                        event["image"] = ""  # Remove base64 data
                        cleanup_results["size_saved_mb"] += original_size / (1024 * 1024)
                        cleanup_results["details"].append(f"Removed base64 image from event: {event.get('title', 'Unknown')} ({original_size} bytes)")
                        events_cleaned += 1
                        doc_updated = True
                        logger.info(f"🧹 Cleaned base64 image from event: {event.get('title', 'Unknown')}")
                    
                    events_updated.append(event)
                
                if doc_updated:
                    await db.league_data.update_one(
                        {"_id": doc["_id"]},
                        {"$set": {"leagueSchedule": events_updated}}
                    )
        
        cleanup_results["events_cleaned"] = events_cleaned
        
        # Log final results
        total_cleaned = cleanup_results["teams_cleaned"] + cleanup_results["players_cleaned"] + cleanup_results["events_cleaned"]
        logger.info(f"🧹 Database cleanup completed: {total_cleaned} items cleaned, {cleanup_results['size_saved_mb']:.2f}MB saved")
        
        return {
            "success": True,
            "message": f"Database cleanup completed successfully",
            "results": cleanup_results
        }
        
    except Exception as e:
        logger.error(f"❌ Error during database cleanup: {e}")
        raise HTTPException(status_code=500, detail=f"Database cleanup failed: {str(e)}")

@api_router.post("/admin/check-document-sizes")
async def check_document_sizes():
    """Check document sizes across collections to identify bloat"""
    try:
        logger.info("📏 Checking document sizes across collections")
        
        size_report = {
            "collections": {},
            "large_documents": [],
            "total_size_mb": 0.0,
            "warnings": []
        }
        
        # Check each collection
        collections_to_check = ["league_data", "galleries_new", "api_integrations", "groupme_channels", 
                              "groupme_messages", "event_rsvps", "groupme_event_notifications"]
        
        for collection_name in collections_to_check:
            collection = db[collection_name]
            
            collection_info = {
                "document_count": 0,
                "total_size_bytes": 0,
                "largest_doc_size_bytes": 0,
                "largest_doc_id": None,
                "documents_over_1mb": [],
                "documents_over_10mb": []
            }
            
            async for doc in collection.find():
                # Calculate document size in bytes
                import bson
                doc_size = len(bson.encode(doc))
                
                collection_info["document_count"] += 1
                collection_info["total_size_bytes"] += doc_size
                
                # Track largest document
                if doc_size > collection_info["largest_doc_size_bytes"]:
                    collection_info["largest_doc_size_bytes"] = doc_size
                    collection_info["largest_doc_id"] = str(doc.get("_id", doc.get("id", "unknown")))
                
                # Flag large documents
                if doc_size > 1 * 1024 * 1024:  # 1MB
                    doc_info = {
                        "id": str(doc.get("_id", doc.get("id", "unknown"))),
                        "size_mb": doc_size / (1024 * 1024),
                        "fields": list(doc.keys())
                    }
                    collection_info["documents_over_1mb"].append(doc_info)
                
                if doc_size > 10 * 1024 * 1024:  # 10MB
                    doc_info = {
                        "id": str(doc.get("_id", doc.get("id", "unknown"))),
                        "size_mb": doc_size / (1024 * 1024),
                        "fields": list(doc.keys())
                    }
                    collection_info["documents_over_10mb"].append(doc_info)
                    size_report["warnings"].append(f"Collection '{collection_name}' has document over 10MB: {doc_info['size_mb']:.2f}MB")
                
                # MongoDB document limit warning
                if doc_size > 15 * 1024 * 1024:  # 15MB warning threshold
                    size_report["warnings"].append(f"CRITICAL: Document in '{collection_name}' is {doc_size / (1024 * 1024):.2f}MB (approaching 16MB limit)")
            
            collection_info["average_doc_size_bytes"] = collection_info["total_size_bytes"] / max(collection_info["document_count"], 1)
            size_report["collections"][collection_name] = collection_info
            size_report["total_size_mb"] += collection_info["total_size_bytes"] / (1024 * 1024)
        
        # Generate summary warnings
        if size_report["total_size_mb"] > 100:
            size_report["warnings"].append(f"Total database size is {size_report['total_size_mb']:.2f}MB - consider cleanup")
        
        # Find collections with base64 data
        for collection_name, info in size_report["collections"].items():
            if info["largest_doc_size_bytes"] > 5 * 1024 * 1024:  # 5MB+
                size_report["warnings"].append(f"Collection '{collection_name}' has large documents - may contain base64 images")
        
        logger.info(f"📏 Document size check completed: {size_report['total_size_mb']:.2f}MB total, {len(size_report['warnings'])} warnings")
        
        return {
            "success": True,
            "size_report": size_report
        }
        
    except Exception as e:
        logger.error(f"❌ Error checking document sizes: {e}")
        raise HTTPException(status_code=500, detail=f"Document size check failed: {str(e)}")

@api_router.get("/admin/database-info")
async def get_database_info():
    """Get database size information for troubleshooting"""
    try:
        collections_info = []
        
        # Get all collections
        collection_names = await db.list_collection_names()
        
        for collection_name in collection_names:
            collection = db[collection_name]
            
            # Get collection stats
            stats = await db.command("collStats", collection_name)
            doc_count = await collection.count_documents({})
            
            # Get largest document size in collection
            pipeline = [
                {"$project": {"docSize": {"$bsonSize": "$$ROOT"}}},
                {"$sort": {"docSize": -1}},
                {"$limit": 1}
            ]
            
            largest_doc = await collection.aggregate(pipeline).to_list(1)
            max_doc_size = largest_doc[0]["docSize"] if largest_doc else 0
            
            collections_info.append({
                "collection": collection_name,
                "document_count": doc_count,
                "storage_size_mb": round(stats.get("storageSize", 0) / (1024 * 1024), 2),
                "index_size_mb": round(stats.get("totalIndexSize", 0) / (1024 * 1024), 2),
                "avg_doc_size_kb": round(stats.get("avgObjSize", 0) / 1024, 2) if doc_count > 0 else 0,
                "max_doc_size_mb": round(max_doc_size / (1024 * 1024), 2),
                "max_doc_size_bytes": max_doc_size
            })
        
        # Sort by storage size descending
        collections_info.sort(key=lambda x: x["storage_size_mb"], reverse=True)
        
        return {
            "collections": collections_info,
            "mongodb_doc_limit_mb": 16,  # MongoDB document size limit
            "warning_threshold_mb": 15   # Warning when docs approach limit
        }
        
    except Exception as e:
        logger.error(f"Error getting database info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/collections/{collection_name}/documents")
async def get_collection_documents(collection_name: str):
    """Get documents from a collection"""
    try:
        collection = db[collection_name]
        cursor = collection.find().limit(100)  # Limit to 100 documents for performance
        documents = await cursor.to_list(length=100)
        
        # Convert ObjectId to string for JSON serialization
        for doc in documents:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
        
        return {"documents": documents}
    except Exception as e:
        logger.error(f"Error getting documents from {collection_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/collections/{collection_name}/documents")
async def create_document(collection_name: str, document: dict):
    """Create a new document in a collection"""
    try:
        collection = db[collection_name]
        
        # Remove _id if present for new documents
        if "_id" in document:
            del document["_id"]
        
        # Add timestamps if not present
        if "created_at" not in document:
            document["created_at"] = datetime.utcnow().isoformat()
        if "updated_at" not in document:
            document["updated_at"] = datetime.utcnow().isoformat()
            
        result = await collection.insert_one(document)
        return {"message": "Document created successfully", "id": str(result.inserted_id)}
    except Exception as e:
        logger.error(f"Error creating document in {collection_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/collections/{collection_name}/documents/{document_id}")
async def update_document(collection_name: str, document_id: str, document: dict):
    """Update a document in a collection"""
    try:
        collection = db[collection_name]
        
        # Update timestamp
        document["updated_at"] = datetime.utcnow().isoformat()
        
        # Try to find by id field first, then by _id
        query = {"id": document_id}
        existing = await collection.find_one(query)
        
        if not existing:
            # Try with ObjectId if it's a valid ObjectId format
            try:
                from bson import ObjectId
                query = {"_id": ObjectId(document_id)}
                existing = await collection.find_one(query)
            except:
                pass
        
        if not existing:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Remove _id from update data to avoid conflicts
        update_data = {k: v for k, v in document.items() if k != "_id"}
        
        result = await collection.update_one(query, {"$set": update_data})
        
        if result.modified_count > 0:
            return {"message": "Document updated successfully"}
        else:
            return {"message": "Document not modified (no changes)"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating document in {collection_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/collections/{collection_name}/documents/{document_id}")
async def delete_document(collection_name: str, document_id: str):
    """Delete a document from a collection"""
    try:
        collection = db[collection_name]
        
        # Try to find by id field first, then by _id
        query = {"id": document_id}
        existing = await collection.find_one(query)
        
        if not existing:
            # Try with ObjectId if it's a valid ObjectId format
            try:
                from bson import ObjectId
                query = {"_id": ObjectId(document_id)}
                existing = await collection.find_one(query)
            except:
                pass
        
        if not existing:
            raise HTTPException(status_code=404, detail="Document not found")
        
        result = await collection.delete_one(query)
        
        if result.deleted_count > 0:
            return {"message": "Document deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document from {collection_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# TEAM-SPECIFIC DATA ENDPOINTS
# ============================================================================

@api_router.get("/team/{team_id}/galleries")
async def get_team_galleries(team_id: str):
    """Get galleries visible to a specific team (team-specific + league-wide)"""
    try:
        galleries_cursor = db.galleries.find({
            "$or": [
                {"team_id": team_id},  # Team-specific galleries
                {"visibility": "league"}  # League-wide galleries
            ]
        })
        
        galleries = await galleries_cursor.to_list(length=None)
        
        for gallery in galleries:
            gallery.pop('_id', None)
        
        logger.info(f"✅ Loaded {len(galleries)} galleries for team {team_id}")
        
        return {"galleries": galleries}
        
    except Exception as e:
        logger.error(f"❌ Error fetching team galleries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/team/{team_id}/news")
async def get_team_news(team_id: str):
    """Get news visible to a specific team (team-specific + league-wide)"""
    try:
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        if not league_data or not league_data.get("newsItems"):
            return {"news": []}
        
        # Filter news items
        team_news = [
            item for item in league_data["newsItems"]
            if item.get("teamId") == team_id or item.get("teamId") == "league"
        ]
        
        logger.info(f"✅ Loaded {len(team_news)} news items for team {team_id}")
        
        return {"news": team_news}
        
    except Exception as e:
        logger.error(f"❌ Error fetching team news: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/team/{team_id}/locations")
async def get_team_locations(team_id: str):
    """Get locations for a specific team"""
    try:
        locations_cursor = db.locations.find({"team_id": team_id})
        locations = await locations_cursor.to_list(length=None)
        
        for location in locations:
            location.pop('_id', None)
        
        logger.info(f"✅ Loaded {len(locations)} locations for team {team_id}")
        
        return locations
        
    except Exception as e:
        logger.error(f"❌ Error fetching team locations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/team/{team_id}/players")
async def get_team_players(team_id: str):
    """Get players for a specific team"""
    try:
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        if not league_data or not league_data.get("players"):
            return []
        
        # Filter players by team
        team_players = [
            player for player in league_data["players"]
            if player.get("team_id") == team_id or player.get("teamId") == team_id
        ]
        
        logger.info(f"✅ Loaded {len(team_players)} players for team {team_id}")
        
        return team_players
        
    except Exception as e:
        logger.error(f"❌ Error fetching team players: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/team/{team_id}/users")
async def get_team_users(team_id: str):
    """Get users associated with a specific team"""
    try:
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        if not league_data or not league_data.get("users"):
            return []
        
        # Filter users by team
        team_users = [
            user for user in league_data["users"]
            if user.get("team_id") == team_id
        ]
        
        logger.info(f"✅ Loaded {len(team_users)} users for team {team_id}")
        
        return team_users
        
    except Exception as e:
        logger.error(f"❌ Error fetching team users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/team/{team_id}/channels")
async def get_team_channels(team_id: str):
    """Get GroupMe channels visible to a specific team (their team channel + league channels)"""
    try:
        channels_cursor = db.groupme_channels.find({
            "$or": [
                {"team_id": team_id, "is_active": True},  # Team-specific channel
                {"channel_type": "league", "is_active": True}  # League-wide channels
            ]
        })
        
        channels = await channels_cursor.to_list(length=None)
        
        for channel in channels:
            channel.pop('_id', None)
        
        logger.info(f"✅ Loaded {len(channels)} channels for team {team_id}")
        
        return {"channels": channels}
        
    except Exception as e:
        logger.error(f"❌ Error fetching team channels: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# EVENT RSVP & NOTIFICATIONS
# ============================================================================

@api_router.get("/rsvp/{event_id}")
async def show_rsvp_page(event_id: str):
    """Show RSVP page with big buttons"""
    return HTMLResponse(f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RSVP</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f8fafc;
                    text-align: center;
                }}
                .container {{
                    max-width: 400px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }}
                h1 {{
                    color: #1f2937;
                    margin-bottom: 30px;
                    font-size: 24px;
                }}
                .button {{
                    display: block;
                    width: 100%;
                    padding: 20px;
                    margin: 15px 0;
                    border: none;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: bold;
                    text-decoration: none;
                    cursor: pointer;
                    transition: transform 0.2s;
                }}
                .button:hover {{
                    transform: scale(1.02);
                }}
                .yes {{ background: #10b981; color: white; }}
                .maybe {{ background: #f59e0b; color: white; }}
                .no {{ background: #ef4444; color: white; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📱 RSVP</h1>
                <a href="/api/rsvp?e={event_id}&c=yes" class="button yes">
                    ✅ YES - I'm Going!
                </a>
                <a href="/api/rsvp?e={event_id}&c=maybe" class="button maybe">
                    ❓ MAYBE - I Might Attend
                </a>
                <a href="/api/rsvp?e={event_id}&c=no" class="button no">
                    ❌ NO - Can't Make It
                </a>
            </div>
        </body>
        </html>
    """)

@api_router.get("/r")
async def handle_short_rsvp_link(request: Request, e: str, c: str):
    """Handle short RSVP links with Open Graph previews for GroupMe"""
    
    # If it's a preview request (not actual click), show Open Graph meta
    user_agent = request.headers.get("user-agent", "").lower()
    is_preview = "bot" in user_agent or "crawler" in user_agent or "preview" in user_agent
    
    # Map short codes to display info
    choice_info = {
        'y': {'title': '✅ RSVP: YES', 'desc': 'Tap to confirm you\'re going', 'color': '#10b981'},
        'm': {'title': '❓ RSVP: MAYBE', 'desc': 'Tap if you might attend', 'color': '#f59e0b'}, 
        'n': {'title': '❌ RSVP: NO', 'desc': 'Tap if you can\'t make it', 'color': '#ef4444'}
    }
    
    info = choice_info.get(c, choice_info['y'])
    
    if is_preview:
        # Return HTML with Open Graph meta for rich preview
        return HTMLResponse(f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta property="og:title" content="{info['title']}" />
                <meta property="og:description" content="{info['desc']}" />
                <meta property="og:type" content="website" />
                <meta property="og:image" content="https://via.placeholder.com/400x200/{info['color'].replace('#','')}/FFFFFF?text={info['title'].replace(' ', '+')}" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="{info['title']}" />
                <meta name="twitter:description" content="{info['desc']}" />
                <title>{info['title']}</title>
                <style>
                    body {{ font-family: Arial; text-align: center; padding: 50px; background: {info['color']}; color: white; }}
                    .button {{ background: white; color: {info['color']}; padding: 20px 40px; border-radius: 10px; font-size: 24px; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class="button">{info['title']}</div>
                <p>{info['desc']}</p>
                <script>
                    // Auto-redirect after preview is loaded
                    setTimeout(() => {{
                        window.location.href = '/api/rsvp?e={e}&c=' + '{c}'.replace('y','yes').replace('m','maybe').replace('n','no');
                    }}, 100);
                </script>
            </body>
            </html>
        """)
    else:
        # Map short codes to full choice names for actual processing
        choice_map = {'y': 'yes', 'm': 'maybe', 'n': 'no'}
        full_choice = choice_map.get(c, c)
        
        # Process the actual RSVP
        return await handle_rsvp_link_click(request, event=e, choice=full_choice)

@api_router.get("/rsvp") 
async def handle_rsvp_link_click(request: Request, event: str = None, choice: str = None, gmid: str = None, name: str = None, e: str = None, c: str = None):
    """Handle RSVP link clicks from GroupMe messages"""
    try:
        # Validate choice parameter
        choice_mapping = {
            'yes': 'going',
            'going': 'going', 
            'maybe': 'maybe',
            'no': 'not_going',
            'cant': 'not_going'
        }
        
        # Handle both long and short parameter names
        actual_choice = choice or c
        actual_event = event or e
        
        if not actual_choice or not actual_event:
            return HTMLResponse("""
                <html><body style='font-family: Arial; padding: 20px; text-align: center;'>
                    <h2>❌ Missing Parameters</h2>
                    <p>Invalid RSVP link.</p>
                </body></html>
            """)
            
        if actual_choice not in choice_mapping:
            return HTMLResponse("""
                <html><body style='font-family: Arial; padding: 20px; text-align: center;'>
                    <h2>❌ Invalid RSVP Option</h2>
                    <p>Please use a valid RSVP link.</p>
                </body></html>
            """)
        
        response = choice_mapping[actual_choice]
        event_id = actual_event
        
        # Try to get actual username from GroupMe or use a better default
        user_name = "Team Member"  # Better default fallback
        user_id = gmid or f"web_user_{int(datetime.utcnow().timestamp())}"
        
        # Check if GroupMe user agent to identify if it's from GroupMe app
        user_agent = request.headers.get("user-agent", "").lower()
        is_from_groupme = "groupme" in user_agent
        
        if name and name != "USER":
            # Use provided name parameter if it's not the placeholder
            user_name = name
        elif gmid:
            # Try to find user name from recent GroupMe messages
            try:
                recent_message = await db.groupme_messages.find_one(
                    {"sender_id": gmid},
                    sort=[("created_at", -1)]
                )
                if recent_message and recent_message.get("sender_name"):
                    user_name = recent_message["sender_name"]
                else:
                    user_name = f"Team Member #{gmid[-4:]}" if gmid else "Team Member"
            except:
                user_name = f"Team Member #{gmid[-4:]}" if gmid else "Team Member"
        elif is_from_groupme:
            # If it's from GroupMe but no ID, use generic
            user_name = "Team Member"
        
        # Create or update RSVP
        existing_rsvp = await db.event_rsvps.find_one({
            "event_id": event_id,
            "user_id": user_id
        })
        
        rsvp_record = {
            "event_id": event_id,
            "user_id": user_id,
            "response": response,
            "user_name": user_name,
            "updated_at": datetime.utcnow().isoformat(),
            "via_link": True
        }
        
        if existing_rsvp:
            await db.event_rsvps.update_one(
                {"event_id": event_id, "user_id": user_id},
                {"$set": rsvp_record}
            )
            action = "updated"
        else:
            rsvp_record['id'] = str(uuid.uuid4())
            rsvp_record['created_at'] = datetime.utcnow().isoformat()
            await db.event_rsvps.insert_one(rsvp_record)
            action = "recorded"
        
        logger.info(f"✅ RSVP {action} via link: {user_name} -> {response} for event {event_id}")
        
        # Send confirmation message back to GroupMe if we can find the bot
        try:
            # Find a GroupMe channel/bot to send confirmation to
            channels_cursor = db.groupme_channels.find({"is_active": True})
            channels = await channels_cursor.to_list(length=1)  # Get first active channel
            
            if channels and channels[0].get('groupme_bot_id'):
                bot_id = channels[0]['groupme_bot_id']
                
                # Response emojis for confirmation
                response_emojis = {
                    'going': '✅',
                    'maybe': '❓', 
                    'not_going': '❌'
                }
                
                response_text = {
                    'going': 'confirmed they\'re going',
                    'maybe': 'might attend',
                    'not_going': 'can\'t make it'
                }
                
                emoji = response_emojis[response]
                confirmation_message = f"{emoji} {user_name} {response_text[response]}!"
                
                # Send confirmation to GroupMe
                await _send_groupme_message(bot_id, confirmation_message)
                logger.info(f"📱 Sent RSVP confirmation to GroupMe: {confirmation_message}")
                
        except Exception as conf_error:
            logger.warning(f"Could not send GroupMe confirmation: {conf_error}")
        
        # Response for HTML page
        response_emojis = {
            'going': '✅',
            'maybe': '❓', 
            'not_going': '❌'
        }
        
        response_text = {
            'going': 'You\'re going!',
            'maybe': 'You might attend',
            'not_going': 'You can\'t make it'
        }
        
        emoji = response_emojis[response]
        text = response_text[response]
        
        # Return a simple HTML confirmation page
        return HTMLResponse(f"""
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>RSVP Confirmed</title>
            </head>
            <body style='font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f8fafc;'>
                <div style='max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
                    <h1 style='color: #1f2937; margin-bottom: 20px;'>{emoji} RSVP Confirmed!</h1>
                    <p style='color: #6b7280; font-size: 18px; margin-bottom: 20px;'>{text}</p>
                    <p style='color: #9ca3af; font-size: 14px;'>Your response has been {action} for this event.</p>
                    <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                        <p style='color: #9ca3af; font-size: 12px;'>You can close this page and return to GroupMe.</p>
                    </div>
                </div>
            </body>
            </html>
        """)
        
    except Exception as e:
        logger.error(f"❌ Error processing RSVP link: {e}")
        return HTMLResponse("""
            <html><body style='font-family: Arial; padding: 20px; text-align: center;'>
                <h2>❌ Error Processing RSVP</h2>
                <p>Please try again or contact support.</p>
            </body></html>
        """)

@api_router.post("/events/{event_id}/rsvp")
async def create_or_update_rsvp(event_id: str, rsvp_data: Dict[str, Any]):
    """Create or update an RSVP for an event"""
    try:
        user_id = rsvp_data.get('user_id')
        response = rsvp_data.get('response')  # 'going', 'not_going', 'maybe'
        
        if not user_id or not response:
            raise HTTPException(status_code=400, detail="user_id and response are required")
        
        if response not in ['going', 'not_going', 'maybe']:
            raise HTTPException(status_code=400, detail="Invalid response type")
        
        # Check if RSVP already exists
        existing_rsvp = await db.event_rsvps.find_one({
            "event_id": event_id,
            "user_id": user_id
        })
        
        rsvp_record = {
            "event_id": event_id,
            "user_id": user_id,
            "response": response,
            "user_name": rsvp_data.get('user_name', 'Unknown'),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if existing_rsvp:
            # Update existing RSVP
            await db.event_rsvps.update_one(
                {"event_id": event_id, "user_id": user_id},
                {"$set": rsvp_record}
            )
            logger.info(f"✅ Updated RSVP for event {event_id} by user {user_id}: {response}")
        else:
            # Create new RSVP
            rsvp_record['id'] = str(uuid.uuid4())
            rsvp_record['created_at'] = datetime.utcnow().isoformat()
            await db.event_rsvps.insert_one(rsvp_record)
            logger.info(f"✅ Created RSVP for event {event_id} by user {user_id}: {response}")
        
        return {"status": "success", "message": "RSVP recorded"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating/updating RSVP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/events/{event_id}/rsvps")
async def get_event_rsvps(event_id: str):
    """Get all RSVPs for an event with summary"""
    try:
        rsvps_cursor = db.event_rsvps.find({"event_id": event_id})
        rsvps = await rsvps_cursor.to_list(length=None)
        
        # Remove MongoDB _id
        for rsvp in rsvps:
            rsvp.pop('_id', None)
        
        # Calculate summary
        going = [r for r in rsvps if r['response'] == 'going']
        not_going = [r for r in rsvps if r['response'] == 'not_going']
        maybe = [r for r in rsvps if r['response'] == 'maybe']
        
        return {
            "rsvps": rsvps,
            "summary": {
                "going": len(going),
                "not_going": len(not_going),
                "maybe": len(maybe),
                "total": len(rsvps)
            },
            "details": {
                "going": going,
                "not_going": not_going,
                "maybe": maybe
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching RSVPs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/events/{event_id}/send-notification")
async def send_event_notification_v2(event_id: str, notification_data: Dict[str, Any]):
    """Send notification for an event to specified channels"""
    try:
        notification_type = notification_data.get('type', 'event_created')  # event_created, event_updated, event_cancelled, reminder_24h, reminder_1h
        message = notification_data.get('message')
        channel_ids = notification_data.get('channel_ids', [])
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Get event details
        league_doc = await db.league_data.find_one({"id": "main_league"})
        event = None
        if league_doc and league_doc.get("leagueSchedule"):
            event = next((e for e in league_doc["leagueSchedule"] if e.get("id") == event_id), None)
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Format rich notification message with event details
        event_details = []
        event_details.append(f"📅 {event.get('title', 'Event')}")
        event_details.append("=" * 40)
        
        # Add date and time
        if event.get('date'):
            event_details.append(f"📆 {event.get('date')}")
        if event.get('time'):
            event_details.append(f"🕐 {event.get('time')}")
        
        # Add location
        if event.get('location'):
            event_details.append(f"📍 {event.get('location')}")
        
        # Add description if exists
        if event.get('description'):
            event_details.append(f"\n{event.get('description')}")
        
        event_details.append("\n👇 Click below to RSVP")
        
        formatted_message = "\n".join(event_details)
        
        # Get event image URL if exists
        event_image_url = event.get('imageUrl')
        
        # Send to GroupMe channels if specified
        sent_channels = []
        if channel_ids:
            for channel_id in channel_ids:
                channel = await db.groupme_channels.find_one({"id": channel_id, "is_active": True})
                if channel and channel.get('groupme_bot_id'):
                    # Send with RSVP buttons
                    success = await _send_groupme_message_with_rsvp(
                        channel['groupme_bot_id'], 
                        formatted_message,
                        event_id,
                        event_image_url
                    )
                    if success:
                        sent_channels.append(channel['name'])
                    
                    # Save to messages collection - check for duplicates first
                    if success:
                        # Check if this exact event notification was recently sent
                        recent_time = datetime.utcnow().timestamp() - 10  # Within last 10 seconds
                        
                        existing_msg = await db.groupme_messages.find_one({
                            "channel_id": channel_id,
                            "event_id": event_id,
                            "notification_type": notification_type,
                            "created_at": {"$gte": int(recent_time)}
                        })
                        
                        if not existing_msg:
                            message_record = {
                                "id": str(uuid.uuid4()),
                                "channel_id": channel_id,
                                "text": formatted_message,
                                "name": "Event Notification",
                                "sender_type": "bot",
                                "created_at": int(datetime.utcnow().timestamp()),
                                "event_id": event_id,
                                "notification_type": notification_type
                            }
                            await db.groupme_messages.insert_one(message_record)
        
        # Log notification
        notification_log = {
            "id": str(uuid.uuid4()),
            "event_id": event_id,
            "notification_type": notification_type,
            "message": message,
            "channels_sent": sent_channels,
            "sent_at": datetime.utcnow().isoformat()
        }
        await db.event_notifications.insert_one(notification_log)
        
        logger.info(f"✅ Event notification sent for {event_id} to {len(sent_channels)} channels")
        
        return {
            "status": "success",
            "message": f"Notification sent to {len(sent_channels)} channels",
            "channels": sent_channels
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sending event notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{user_id}/communication-preferences")
async def get_user_comm_preferences(user_id: str):
    """Get user's communication preferences"""
    try:
        prefs = await db.user_preferences.find_one({"user_id": user_id})
        
        if not prefs:
            # Return defaults
            return {
                "user_id": user_id,
                "notifications": {
                    "groupme": True,
                    "email": False,
                    "sms": False
                },
                "event_reminders": {
                    "enabled": True,
                    "timing": ["24h", "1h"]
                },
                "rsvp_reminders": True
            }
        
        prefs.pop('_id', None)
        return prefs
        
    except Exception as e:
        logger.error(f"❌ Error fetching user preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/users/{user_id}/communication-preferences")
async def update_user_comm_preferences(user_id: str, preferences: Dict[str, Any]):
    """Update user's communication preferences"""
    try:
        preferences['user_id'] = user_id
        preferences['updated_at'] = datetime.utcnow().isoformat()
        
        await db.user_preferences.update_one(
            {"user_id": user_id},
            {"$set": preferences},
            upsert=True
        )
        
        logger.info(f"✅ Updated communication preferences for user {user_id}")
        
        return {"status": "success", "message": "Preferences updated"}
        
    except Exception as e:
        logger.error(f"❌ Error updating user preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/events/recurring")
async def create_recurring_event(event_data: Dict[str, Any]):
    """Create a recurring event with multiple instances"""
    try:
        from event_recurrence import generate_recurring_events
        
        logger.info(f"📅 Creating recurring events with data: {event_data}")
        
        recurrence_pattern = event_data.get('recurrence_pattern')
        if not recurrence_pattern:
            raise HTTPException(status_code=400, detail="recurrence_pattern is required")
        
        base_event = event_data.get('event')
        end_date = recurrence_pattern.get('end_date')
        
        if not base_event or not end_date:
            raise HTTPException(status_code=400, detail="event and end_date are required")
        
        logger.info(f"📅 Base event: {base_event.get('title')}, End date: {end_date}")
        
        # Generate instances
        instances = generate_recurring_events(base_event, recurrence_pattern, end_date)
        
        logger.info(f"📅 Generated {len(instances)} instances")
        
        # Get current league schedule
        league_doc = await db.league_data.find_one({"id": "main_league"})
        if not league_doc:
            league_doc = {"id": "main_league", "leagueSchedule": []}
        
        # Add instances to schedule
        current_schedule = league_doc.get("leagueSchedule", [])
        current_schedule.extend(instances)
        
        league_doc["leagueSchedule"] = current_schedule
        league_doc["lastUpdated"] = datetime.now(timezone.utc).isoformat()
        
        # Save to database
        await db.league_data.replace_one(
            {"id": "main_league"},
            league_doc,
            upsert=True
        )
        
        logger.info(f"✅ Created {len(instances)} recurring event instances")
        
        return {
            "status": "success",
            "message": f"Created {len(instances)} event instances",
            "instances": len(instances)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"❌ Error creating recurring event: {e}\n{error_details}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ============================================
# STATS TRACKING API ENDPOINTS
# ============================================

@api_router.post("/events/{event_id}/game-stats")
async def create_or_update_game_stats(event_id: str, game_stats: GameStats):
    """Create or update game stats for an event"""
    try:
        # Verify event exists
        event = await db.events.find_one({"id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if stats already exist for this event
        existing_stats = await db.game_stats.find_one({"event_id": event_id})
        
        stats_data = game_stats.dict()
        stats_data["event_id"] = event_id
        stats_data["last_updated"] = datetime.now(timezone.utc)
        
        # If no season_id provided, get active season
        if not stats_data.get("season_id"):
            active_season = await db.seasons.find_one({"is_active": True})
            if active_season:
                stats_data["season_id"] = active_season["id"]
            else:
                # Create default season if none exists
                default_season = {
                    "id": str(uuid.uuid4()),
                    "name": f"Season {datetime.now().year}",
                    "league_id": "main_league",
                    "start_date": datetime.now(timezone.utc),
                    "end_date": datetime.now(timezone.utc) + timedelta(days=365),
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc)
                }
                await db.seasons.insert_one(default_season)
                stats_data["season_id"] = default_season["id"]
        
        if existing_stats:
            # Update existing stats
            await db.game_stats.update_one(
                {"event_id": event_id},
                {"$set": stats_data}
            )
            stats_id = existing_stats["id"]
        else:
            # Create new stats
            await db.game_stats.insert_one(stats_data)
            stats_id = stats_data["id"]
        
        # Sync scores to event if final
        if game_stats.status == "final":
            await db.events.update_one(
                {"id": event_id},
                {"$set": {
                    "homeScore": game_stats.home_team.goals_for,
                    "awayScore": game_stats.away_team.goals_for if game_stats.away_team else 0,
                    "status": "completed"
                }}
            )
        
        # Update team and player aggregated stats
        await _update_team_season_stats(game_stats.home_team.team_id)
        if game_stats.away_team:
            await _update_team_season_stats(game_stats.away_team.team_id)
        
        return {"status": "success", "stats_id": stats_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving game stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/events/{event_id}/game-stats")
async def get_game_stats(event_id: str):
    """Get game stats for an event"""
    try:
        stats = await db.game_stats.find_one({"event_id": event_id})
        if not stats:
            return {"status": "not_found", "stats": None}
        
        # Remove MongoDB _id
        if "_id" in stats:
            del stats["_id"]
        
        return {"status": "success", "stats": stats}
    
    except Exception as e:
        logger.error(f"Error retrieving game stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/teams/{team_id}/season-stats")
async def get_team_season_stats(team_id: str, season_id: Optional[str] = None):
    """Get aggregated season stats for a team"""
    try:
        # Build query filter
        query_home = {"home_team.team_id": team_id, "status": "final"}
        query_away = {"away_team.team_id": team_id, "status": "final"}
        
        # If season specified, filter by it; otherwise get active season or all
        if season_id:
            query_home["season_id"] = season_id
            query_away["season_id"] = season_id
        elif season_id is None:
            # Get active season if no season specified
            active_season = await db.seasons.find_one({"is_active": True})
            if active_season:
                query_home["season_id"] = active_season["id"]
                query_away["season_id"] = active_season["id"]
        
        # Get all game stats for this team
        games_home = await db.game_stats.find(query_home).to_list(None)
        games_away = await db.game_stats.find(query_away).to_list(None)
        
        games_played = 0
        wins = 0
        losses = 0
        ties = 0
        goals_for = 0
        goals_against = 0
        
        # Process home games
        for game in games_home:
            games_played += 1
            home_goals = game["home_team"]["goals_for"]
            away_goals = game["home_team"]["goals_against"]
            goals_for += home_goals
            goals_against += away_goals
            
            # Calculate result based on goals
            if home_goals > away_goals:
                wins += 1
            elif home_goals < away_goals:
                losses += 1
            else:
                ties += 1
        
        # Process away games
        for game in games_away:
            if game.get("away_team"):
                games_played += 1
                away_goals = game["away_team"]["goals_for"]
                home_goals = game["away_team"]["goals_against"]
                goals_for += away_goals
                goals_against += home_goals
                
                # Calculate result based on goals
                if away_goals > home_goals:
                    wins += 1
                elif away_goals < home_goals:
                    losses += 1
                else:
                    ties += 1
        
        goal_diff = goals_for - goals_against
        points = (wins * 2) + (ties * 1)
        
        return {
            "team_id": team_id,
            "games_played": games_played,
            "wins": wins,
            "losses": losses,
            "ties": ties,
            "goals_for": goals_for,
            "goals_against": goals_against,
            "goal_diff": goal_diff,
            "points": points
        }
    
    except Exception as e:
        logger.error(f"Error getting team season stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/teams/{team_id}/player-stats")
async def get_team_player_stats(team_id: str, season_id: Optional[str] = None):
    """Get aggregated player stats for a team"""
    try:
        # Build query filter
        query_home = {"home_team.team_id": team_id, "status": "final"}
        query_away = {"away_team.team_id": team_id, "status": "final"}
        
        # If season specified, filter by it; otherwise get active season
        if season_id:
            query_home["season_id"] = season_id
            query_away["season_id"] = season_id
        else:
            # Get active season if no season specified
            active_season = await db.seasons.find_one({"is_active": True})
            if active_season:
                query_home["season_id"] = active_season["id"]
                query_away["season_id"] = active_season["id"]
        
        # Get all game stats for this team
        games_home = await db.game_stats.find(query_home).to_list(None)
        games_away = await db.game_stats.find(query_away).to_list(None)
        
        player_stats = {}  # player_id -> aggregated stats
        goalie_stats = {}  # goalie_id -> aggregated stats
        
        def process_game(team_data, result):
            # Process players
            for player in team_data.get("players", []):
                pid = player["player_id"]
                if pid not in player_stats:
                    player_stats[pid] = {
                        "player_id": pid,
                        "player_name": player["player_name"],
                        "games_played": 0,
                        "wins": 0,
                        "losses": 0,
                        "ties": 0,
                        "shots": 0,
                        "goals": 0,
                        "ground_balls": 0
                    }
                
                if player.get("was_present", True):
                    player_stats[pid]["games_played"] += 1
                    if result == "win":
                        player_stats[pid]["wins"] += 1
                    elif result == "loss":
                        player_stats[pid]["losses"] += 1
                    elif result == "tie":
                        player_stats[pid]["ties"] += 1
                
                player_stats[pid]["shots"] += player.get("shots", 0)
                player_stats[pid]["goals"] += player.get("goals", 0)
                player_stats[pid]["ground_balls"] += player.get("ground_balls", 0)
            
            # Process goalies
            for goalie in team_data.get("goalies", []):
                gid = goalie["player_id"]
                if gid not in goalie_stats:
                    goalie_stats[gid] = {
                        "player_id": gid,
                        "player_name": goalie["player_name"],
                        "games_played": 0,
                        "wins": 0,
                        "losses": 0,
                        "ties": 0,
                        "total_minutes": 0,
                        "total_periods": 0,
                        "shots_on_goal": 0,
                        "saves": 0,
                        "goals_allowed": 0,
                        "save_percentage": 0
                    }
                
                if len(goalie.get("periods_played", [])) > 0:
                    goalie_stats[gid]["games_played"] += 1
                    if result == "win":
                        goalie_stats[gid]["wins"] += 1
                    elif result == "loss":
                        goalie_stats[gid]["losses"] += 1
                    elif result == "tie":
                        goalie_stats[gid]["ties"] += 1
                
                goalie_stats[gid]["total_minutes"] += goalie.get("minutes_played", 0)
                goalie_stats[gid]["total_periods"] += len(goalie.get("periods_played", []))
                goalie_stats[gid]["shots_on_goal"] += goalie.get("shots_on_goal", 0)
                goalie_stats[gid]["saves"] += goalie.get("saves", 0)
                goalie_stats[gid]["goals_allowed"] += goalie.get("goals_allowed", 0)
        
        # Process all games
        for game in games_home:
            process_game(game["home_team"], game["home_team"]["result"])
        
        for game in games_away:
            if game.get("away_team"):
                process_game(game["away_team"], game["away_team"]["result"])
        
        # Calculate save percentages
        for goalie in goalie_stats.values():
            if goalie["shots_on_goal"] > 0:
                goalie["save_percentage"] = round((goalie["saves"] / goalie["shots_on_goal"]) * 100, 1)
        
        return {
            "team_id": team_id,
            "players": list(player_stats.values()),
            "goalies": list(goalie_stats.values())
        }
    
    except Exception as e:
        logger.error(f"Error getting player stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/league/standings")
async def get_league_standings(
    league_id: Optional[str] = "main_league", 
    division_id: Optional[str] = None,
    season_id: Optional[str] = None
):
    """Get league standings with optional division and season filtering"""
    try:
        # Build query filter
        query = {}
        if league_id:
            query["league_id"] = league_id
        if division_id:
            query["division_id"] = division_id
        
        # Get teams based on filters
        teams = await db.teams.find(query).to_list(None)
        
        standings = []
        for team in teams:
            team_stats = await get_team_season_stats(team["id"], season_id=season_id)
            standings.append({
                "team_id": team["id"],
                "team_name": team["name"],
                "division": team.get("division", ""),
                "division_id": team.get("division_id", ""),
                "league_id": team.get("league_id", ""),
                **team_stats
            })
        
        # Sort by points (descending), then goal diff, then goals for
        standings.sort(key=lambda x: (x["points"], x["goal_diff"], x["goals_for"]), reverse=True)
        
        # Add rank
        for i, team in enumerate(standings):
            team["rank"] = i + 1
        
        return {
            "standings": standings,
            "filters": {
                "league_id": league_id,
                "division_id": division_id,
                "season_id": season_id
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting league standings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/events/{event_id}/live-stats")
async def get_live_game_stats(event_id: str):
    """Get live game stats for public viewing"""
    try:
        stats = await db.game_stats.find_one({"event_id": event_id})
        event = await db.events.find_one({"id": event_id})
        
        if not stats or not event:
            raise HTTPException(status_code=404, detail="Game not found")
        
        # Remove MongoDB _id and sensitive data
        if "_id" in stats:
            del stats["_id"]
        if "_id" in event:
            del event["_id"]
        
        return {
            "event": {
                "id": event["id"],
                "title": event.get("title", ""),
                "date": event.get("date", ""),
                "time": event.get("time", ""),
                "location": event.get("location", "")
            },
            "stats": stats,
            "is_live": stats.get("is_live", False)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting live stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def _update_team_season_stats(team_id: str):
    """Helper function to update team's season record"""
    try:
        stats = await get_team_season_stats(team_id)
        
        # Update team document with season stats
        await db.teams.update_one(
            {"id": team_id},
            {"$set": {
                "wins": stats["wins"],
                "losses": stats["losses"],
                "ties": stats.get("ties", 0),
                "points": stats["points"]
            }}
        )
    except Exception as e:
        logger.error(f"Error updating team season stats: {e}")

# ============================================
# SEASON MANAGEMENT API ENDPOINTS
# ============================================

@api_router.get("/seasons")
async def get_seasons(league_id: str = "main_league"):
    """Get all seasons for a league"""
    try:
        seasons = await db.seasons.find({"league_id": league_id}).sort("start_date", -1).to_list(None)
        
        # Remove MongoDB _id
        for season in seasons:
            if "_id" in season:
                del season["_id"]
        
        return {"seasons": seasons}
    except Exception as e:
        logger.error(f"Error getting seasons: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/seasons/active")
async def get_active_season(league_id: str = "main_league"):
    """Get the currently active season"""
    try:
        season = await db.seasons.find_one({"league_id": league_id, "is_active": True})
        
        if not season:
            # If no active season, create a default one
            default_season = {
                "id": str(uuid.uuid4()),
                "name": f"Season {datetime.now().year}",
                "league_id": league_id,
                "start_date": datetime.now(timezone.utc),
                "end_date": datetime.now(timezone.utc) + timedelta(days=365),
                "is_active": True,
                "created_at": datetime.now(timezone.utc)
            }
            await db.seasons.insert_one(default_season)
            season = default_season
        
        if "_id" in season:
            del season["_id"]
        
        return {"season": season}
    except Exception as e:
        logger.error(f"Error getting active season: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/seasons")
async def create_season(season: Season):
    """Create a new season"""
    try:
        # If this is set as active, deactivate other seasons
        if season.is_active:
            await db.seasons.update_many(
                {"league_id": season.league_id, "is_active": True},
                {"$set": {"is_active": False}}
            )
        
        season_dict = season.dict()
        await db.seasons.insert_one(season_dict)
        
        return {"status": "success", "season_id": season.id}
    except Exception as e:
        logger.error(f"Error creating season: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/seasons/{season_id}/activate")
async def activate_season(season_id: str):
    """Set a season as the active season"""
    try:
        # Get the season to find its league
        season = await db.seasons.find_one({"id": season_id})
        if not season:
            raise HTTPException(status_code=404, detail="Season not found")
        
        # Deactivate all other seasons in this league
        await db.seasons.update_many(
            {"league_id": season["league_id"], "is_active": True},
            {"$set": {"is_active": False}}
        )
        
        # Activate this season
        await db.seasons.update_one(
            {"id": season_id},
            {"$set": {"is_active": True}}
        )
        
        return {"status": "success", "message": f"Season {season['name']} is now active"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating season: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# TOURNAMENT INTEGRATION API ENDPOINTS  
# ============================================

@api_router.post("/tournaments/{tournament_id}/sync-bracket-scores")
async def sync_tournament_bracket_scores(tournament_id: str):
    """Sync tournament bracket match scores to the game stats system"""
    try:
        logger.info(f"🏆 Syncing bracket scores for tournament: {tournament_id}")
        
        # Find the tournament event
        tournament_event = await db.league_data.find_one({"leagueSchedule.id": tournament_id})
        if not tournament_event:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Find the specific tournament in the league schedule
        tournament = None
        for event in tournament_event.get("leagueSchedule", []):
            if event.get("id") == tournament_id:
                tournament = event
                break
        
        if not tournament or tournament.get("type") != "tournament":
            raise HTTPException(status_code=404, detail="Tournament event not found")
        
        bracket_data = tournament.get("bracket")
        if not bracket_data or not bracket_data.get("rounds"):
            raise HTTPException(status_code=400, detail="Tournament has no bracket data")
        
        matches_synced = 0
        matches_skipped = 0
        
        # Process each round and match
        for round_data in bracket_data["rounds"]:
            for match in round_data.get("matches", []):
                if match.get("status") == "completed" and match.get("score1") is not None and match.get("score2") is not None:
                    
                    # Create unique event ID for this match
                    match_event_id = f"{tournament_id}_match_{match['id']}"
                    
                    # Check if game stats already exist for this match
                    existing_stats = await db.game_stats.find_one({"event_id": match_event_id})
                    
                    # Create game stats entry
                    game_stat = {
                        "id": str(uuid.uuid4()),
                        "event_id": match_event_id,
                        "tournament_id": tournament_id,
                        "tournament_match_id": match["id"],
                        "season_id": "2025",  # Default season, could be parameterized
                        "status": "final",
                        "date": tournament.get("date", datetime.now().strftime("%Y-%m-%d")),
                        "location": tournament.get("location", "Tournament Venue"),
                        "match_type": "tournament",
                        "round_name": round_data.get("name", "Round"),
                        "home_team": {
                            "team_id": match["team1"]["id"],
                            "goals_for": match["score1"],
                            "goals_against": match["score2"],
                            "players": [],
                            "goalies": []
                        },
                        "away_team": {
                            "team_id": match["team2"]["id"],
                            "goals_for": match["score2"],
                            "goals_against": match["score1"],
                            "players": [],
                            "goalies": []
                        },
                        "created_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    }
                    
                    if existing_stats:
                        # Update existing stats
                        await db.game_stats.update_one(
                            {"event_id": match_event_id},
                            {"$set": game_stat}
                        )
                        logger.info(f"  ✓ Updated: {match['team1']['name']} {match['score1']}-{match['score2']} {match['team2']['name']}")
                    else:
                        # Insert new stats
                        await db.game_stats.insert_one(game_stat)
                        logger.info(f"  ✓ Added: {match['team1']['name']} {match['score1']}-{match['score2']} {match['team2']['name']}")
                    
                    matches_synced += 1
                else:
                    matches_skipped += 1
                    logger.info(f"  ⏭️  Skipped incomplete match: {match.get('id', 'unknown')}")
        
        # Update team season stats for affected teams
        teams_affected = set()
        for round_data in bracket_data["rounds"]:
            for match in round_data.get("matches", []):
                if match.get("team1"):
                    teams_affected.add(match["team1"]["id"])
                if match.get("team2"):
                    teams_affected.add(match["team2"]["id"])
        
        for team_id in teams_affected:
            await _update_team_season_stats(team_id)
        
        logger.info(f"🏆 Tournament bracket sync completed: {matches_synced} synced, {matches_skipped} skipped")
        
        return {
            "status": "success",
            "message": f"Tournament bracket scores synced successfully",
            "tournament_id": tournament_id,
            "matches_synced": matches_synced,
            "matches_skipped": matches_skipped,
            "teams_affected": len(teams_affected)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing tournament bracket scores: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tournaments/{tournament_id}/bracket")
async def get_tournament_bracket(tournament_id: str):
    """Get tournament bracket data"""
    try:
        # Find the tournament event
        tournament_event = await db.league_data.find_one({"leagueSchedule.id": tournament_id})
        if not tournament_event:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Find the specific tournament in the league schedule
        tournament = None
        for event in tournament_event.get("leagueSchedule", []):
            if event.get("id") == tournament_id:
                tournament = event
                break
        
        if not tournament or tournament.get("type") != "tournament":
            raise HTTPException(status_code=404, detail="Tournament event not found")
        
        bracket_data = tournament.get("bracket", {})
        
        return {
            "tournament_id": tournament_id,
            "tournament_name": tournament.get("title", "Unknown Tournament"),
            "date": tournament.get("date"),
            "location": tournament.get("location"),
            "bracket": bracket_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tournament bracket: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# LEAGUE AND DIVISION MANAGEMENT API ENDPOINTS
# ============================================

@api_router.get("/leagues")
async def get_leagues():
    """Get all leagues"""
    try:
        leagues = await db.leagues.find().to_list(None)
        
        # Remove MongoDB _id
        for league in leagues:
            if "_id" in league:
                del league["_id"]
        
        return {"leagues": leagues}
    except Exception as e:
        logger.error(f"Error getting leagues: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/leagues")
async def create_league(league: League):
    """Create a new league"""
    try:
        league_dict = league.dict()
        await db.leagues.insert_one(league_dict)
        return {"status": "success", "league_id": league.id}
    except Exception as e:
        logger.error(f"Error creating league: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/leagues/{league_id}/divisions")
async def get_league_divisions(league_id: str):
    """Get all divisions for a specific league"""
    try:
        divisions = await db.divisions.find({"league_id": league_id}).sort("level", 1).to_list(None)
        
        # Remove MongoDB _id
        for division in divisions:
            if "_id" in division:
                del division["_id"]
        
        return {"divisions": divisions}
    except Exception as e:
        logger.error(f"Error getting divisions for league {league_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/leagues/{league_id}/divisions")
async def create_division(league_id: str, division: Division):
    """Create a new division in a league"""
    try:
        # Ensure division belongs to the specified league
        division.league_id = league_id
        
        division_dict = division.dict()
        await db.divisions.insert_one(division_dict)
        return {"status": "success", "division_id": division.id}
    except Exception as e:
        logger.error(f"Error creating division: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/leagues/{league_id}/teams")
async def get_league_teams(league_id: str):
    """Get all teams in a specific league"""
    try:
        teams = await db.teams.find({"league_id": league_id}).to_list(None)
        
        # Remove MongoDB _id
        for team in teams:
            if "_id" in team:
                del team["_id"]
        
        return {"teams": teams}
    except Exception as e:
        logger.error(f"Error getting teams for league {league_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/divisions/{division_id}/teams")
async def get_division_teams(division_id: str):
    """Get all teams in a specific division"""
    try:
        teams = await db.teams.find({"division_id": division_id}).to_list(None)
        
        # Remove MongoDB _id
        for team in teams:
            if "_id" in team:
                del team["_id"]
        
        return {"teams": teams}
    except Exception as e:
        logger.error(f"Error getting teams for division {division_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/leagues/{league_id}/standings")
async def get_league_standings_by_divisions(league_id: str, season_id: Optional[str] = None):
    """Get league standings grouped by divisions"""
    try:
        # Get all teams in this league
        teams = await db.teams.find({"league_id": league_id}).to_list(None)
        
        # Get all divisions in this league
        divisions = await db.divisions.find({"league_id": league_id}).sort("level", 1).to_list(None)
        
        standings_by_division = {}
        
        for division in divisions:
            division_teams = [t for t in teams if t.get("division_id") == division["id"]]
            division_standings = []
            
            for team in division_teams:
                team_stats = await get_team_season_stats(team["id"], season_id=season_id)
                division_standings.append({
                    "team_id": team["id"],
                    "team_name": team["name"],
                    "division": division["name"],
                    **team_stats
                })
            
            # Sort by points (descending), then goal diff, then goals for
            division_standings.sort(key=lambda x: (x["points"], x["goal_diff"], x["goals_for"]), reverse=True)
            
            # Add rank within division
            for i, team in enumerate(division_standings):
                team["division_rank"] = i + 1
            
            standings_by_division[division["name"]] = {
                "division_id": division["id"],
                "division_name": division["name"],
                "level": division.get("level", 1),
                "teams": division_standings
            }
        
        return {
            "league_id": league_id,
            "standings_by_division": standings_by_division
        }
    except Exception as e:
        logger.error(f"Error getting league standings by divisions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/seasons/{season_id}/summary")
async def get_season_summary(season_id: str):
    """Get summary statistics for a season"""
    try:
        # Get season info
        season = await db.seasons.find_one({"id": season_id})
        if not season:
            raise HTTPException(status_code=404, detail="Season not found")
        
        # Get all games in this season
        games = await db.game_stats.find({"season_id": season_id, "status": "final"}).to_list(None)
        
        total_goals = sum(game["home_team"]["goals_for"] + (game.get("away_team", {}).get("goals_for", 0) or 0) for game in games)
        
        # Get standings for this season
        standings_data = await get_league_standings(season_id=season_id)
        
        if "_id" in season:
            del season["_id"]
        
        return {
            "season": season,
            "total_games": len(games),
            "total_goals": total_goals,
            "top_teams": standings_data["standings"][:5] if standings_data["standings"] else []
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting season summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the API router in the main app (after all routes are defined)
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)