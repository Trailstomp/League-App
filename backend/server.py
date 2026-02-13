# MLBL API - Lacrosse League Management Backend
# Google Drive Integration Support


from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, Response, HTMLResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
import uuid
from datetime import datetime, timezone, timedelta
import json
import urllib.parse
import io
import re
import httpx
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from googleapiclient.errors import HttpError

# Import feature-based routers
from routes import finance_router, locations_router, teams_router, teams_public_router, users_router, rsvp_router, drive_router, cleanup_router, set_finance_db, set_locations_db, set_teams_db, set_users_db, set_rsvp_db, set_drive_db, set_cleanup_db
from routes.setup import setup_router, set_setup_db
from routes.media import media_router, set_db as set_media_db
from routes.groupme import groupme_router, set_db as set_groupme_db, set_groupme_service_class
from routes.communication import comms_router, set_db as set_comms_db
from routes.joinus import joinus_router, set_db as set_joinus_db
from routes.documents import docs_router, set_db as set_docs_db


ROOT_DIR = Path(__file__).parent

# Create uploads directory (use /app/uploads for consistency)
UPLOADS_DIR = Path("/app/uploads")
UPLOADS_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

# Initialize logger
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:%(name)s:%(message)s'
)

# Backend URL for proxy endpoints
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8001')

# MongoDB connection with error handling and increased pool size
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
try:
    client = AsyncIOMotorClient(
        mongo_url, 
        serverSelectionTimeoutMS=10000,  # Increased from 5s to 10s
        maxPoolSize=20,  # Increased from default 5 to 20
        minPoolSize=5,   # Keep minimum connections alive
        maxIdleTimeMS=60000,  # Close idle connections after 60s
        retryWrites=True,
        retryReads=True,
        connectTimeoutMS=20000,
        socketTimeoutMS=30000,
        waitQueueTimeoutMS=30000
    )
    db = client[os.environ.get('DB_NAME', 'mlbl_database')]
except Exception as e:
    logger.error(f"MongoDB connection error: {e}")
    # Create a fallback client that will retry on first use
    client = AsyncIOMotorClient(
        mongo_url, 
        serverSelectionTimeoutMS=10000,
        maxPoolSize=20,
        retryWrites=True,
        retryReads=True
    )
    db = client[os.environ.get('DB_NAME', 'mlbl_database')]

# Initialize routers with database connection
set_finance_db(db)
set_locations_db(db)
set_teams_db(db)
set_users_db(db)
set_rsvp_db(db)
set_drive_db(db)
set_cleanup_db(db)
set_setup_db(db)
set_media_db(db)
set_groupme_db(db)
set_comms_db(db)
set_joinus_db(db)

# Create the main app without a prefix
app = FastAPI()

# Health check endpoint for Kubernetes/deployment health checks
@app.get("/health")
async def health_check():
    """Health check endpoint that verifies the service is running"""
    try:
        # Basic health response
        return {
            "status": "healthy",
            "service": "mlbl-backend",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Also expose health at /api/health for routing compatibility
@app.get("/api/health")
async def api_health_check():
    """Health check endpoint under /api prefix for proxy routing"""
    return {
        "status": "healthy",
        "service": "mlbl-backend",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Mount uploads directory for serving uploaded files (under /api/uploads for proxy routing)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event for logging
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 MLBL Backend starting up...")
    logger.info(f"📁 Uploads directory: {UPLOADS_DIR}")
    logger.info(f"🗄️ Database: {os.environ.get('DB_NAME', 'mlbl_database')}")
    # Inject SimpleGroupMeService into groupme router
    set_groupme_service_class(SimpleGroupMeService)
    logger.info("✅ Backend startup complete")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# User Models
class TeamAssignment(BaseModel):
    teamId: str
    teamName: Optional[str] = None
    playerNumber: Optional[str] = None
    position: Optional[str] = None
    photoUrl: Optional[str] = None  # Team-specific photo
    isPrimary: bool = False  # Designates the primary team

class User(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    password: str  # Will be hashed
    role: str = "guest"  # Legacy - primary role: guest, player, coach, admin
    roles: List[str] = []  # Multi-role support: ["player", "coach"], ["admin", "player"], etc.
    teamId: Optional[str] = None  # Legacy - primary team
    teamName: Optional[str] = None  # Legacy - primary team name
    # Multi-team support
    teamAssignments: List[TeamAssignment] = []
    status: str = "guest"  # guest, pending, active, inactive, archived
    requestedRole: Optional[str] = None
    requestedTeam: Optional[str] = None
    phone: Optional[str] = None
    # Player-specific attributes (legacy - use teamAssignments for multi-team)
    playerNumber: Optional[str] = None
    position: Optional[str] = None
    jerseySize: Optional[str] = None
    emergencyContact: Optional[str] = None
    notificationPreferences: Dict[str, bool] = {
        "email": True,
        "sms": False,
        "groupme": True
    }
    createdAt: Optional[str] = None
    approvedAt: Optional[str] = None
    approvedBy: Optional[str] = None

class UserRegistration(BaseModel):
    name: str
    email: str
    password: str
    requestedRole: str  # guest, player, coach
    requestedTeam: Optional[str] = None
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None  # Legacy support
    roles: Optional[List[str]] = None  # Multi-role support
    teamId: Optional[str] = None  # Legacy support
    status: Optional[str] = None
    phone: Optional[str] = None
    playerNumber: Optional[str] = None  # Legacy support
    position: Optional[str] = None  # Legacy support
    jerseySize: Optional[str] = None
    emergencyContact: Optional[Union[str, Dict[str, str]]] = None  # Support both legacy string and new object format
    notificationPreferences: Optional[Dict[str, bool]] = None
    # Multi-team support
    teamAssignments: Optional[List[Dict[str, Any]]] = None
    # Enhanced player profile fields
    photoUrl: Optional[str] = None
    lacrosseHistory: Optional[Dict[str, Any]] = None  # {highSchool: {teamName, graduationYear}, college: {...}, postGrad: [...]}
    funFacts: Optional[str] = None
    socialMedia: Optional[Dict[str, str]] = None  # {instagram, twitter, tiktok, facebook}
    # User preferences
    defaultLandingPage: Optional[Dict[str, Any]] = None  # {type: 'team'|'page', teamId?: string, tabId?: string, pageName?: string}

class LoginRequest(BaseModel):
    email: str
    password: str

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
                "lastUpdated": datetime.now(timezone.utc)
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
        league_data["lastUpdated"] = datetime.now(timezone.utc).isoformat()
        
        # Update the database
        league_data.pop('_id', None)
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
        # Added limits to prevent memory issues in production
        league_data_task = db.league_data.find_one({"id": "main_league"})
        teams_task = db.teams.find().to_list(100)  # Limit to 100 teams
        galleries_task = get_active_galleries_internal()
        youtube_task = db.youtube_integration.find_one({"id": "main_youtube"})
        unified_events_task = db.unified_events.find({}, {"_id": 0}).to_list(500)  # Limit to 500 events
        # Fetch active players from users collection (player role)
        players_task = db.users.find(
            {"status": "active", "$or": [{"roles": "player"}, {"role": "player"}]},
            {"_id": 0, "password": 0}
        ).to_list(1000)  # Limit to 1000 players
        
        # Execute all queries in parallel
        league_data, teams_from_collection, galleries_data, youtube_config, unified_events, active_players = await asyncio.gather(
            league_data_task,
            teams_task,
            galleries_task,
            youtube_task,
            unified_events_task,
            players_task,
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
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
        
        # Process unified events - merge with leagueSchedule
        if isinstance(unified_events, Exception):
            logger.error(f"Error fetching unified events: {unified_events}")
            unified_events = []
        
        # First, deduplicate leagueSchedule itself (in case of duplicates in source)
        seen_ids = set()
        deduped_schedule = []
        for event in league_data.get('leagueSchedule', []):
            event_id = event.get('id')
            if event_id and event_id not in seen_ids:
                deduped_schedule.append(event)
                seen_ids.add(event_id)
            elif not event_id:
                # Keep events without IDs but they won't be deduped
                deduped_schedule.append(event)
        
        # Now merge unified_events into the deduped leagueSchedule
        for event in (unified_events or []):
            event_id = event.get('id')
            if event_id and event_id not in seen_ids:
                deduped_schedule.append(event)
                seen_ids.add(event_id)
        
        league_data['leagueSchedule'] = deduped_schedule
        logger.info(f"✅ Merged events: {len(deduped_schedule)} total ({len(unified_events or [])} from unified_events)")
            
        # Process teams from new collection (prioritize over league_data teams)
        if isinstance(teams_from_collection, Exception):
            logger.error(f"Error fetching teams from collection: {teams_from_collection}")
            teams_from_collection = []
        
        if teams_from_collection:
            # Convert teams collection format to frontend format
            formatted_teams = []
            for team in teams_from_collection:
                team.pop('_id', None)  # Remove MongoDB ID
                # Use full style object if available, otherwise build from basic fields
                team_style = team.get("style") if isinstance(team.get("style"), dict) else {
                    "logoUrl": team.get("logo", ""),
                    "primaryColor": team.get("color", "#3b82f6"),
                    "secondaryColor": team.get("secondary_color", ""),
                    "accentColor": team.get("accent_color", "")
                }
                # Ensure all style fields have defaults
                team_style.setdefault("logoUrl", team.get("logo", ""))
                team_style.setdefault("primaryColor", team.get("color", "#3b82f6"))
                team_style.setdefault("secondaryColor", team.get("secondary_color", ""))
                team_style.setdefault("accentColor", team.get("accent_color", ""))
                team_style.setdefault("backgroundColor", "#f8fafc")
                team_style.setdefault("textColor", "#1e293b")
                team_style.setdefault("headerTextColor", "#ffffff")
                
                # Convert new format to old format for compatibility
                formatted_team = {
                    "id": team.get("id", ""),
                    "name": team.get("name", ""),
                    "division": team.get("division", ""),
                    "division_id": team.get("division_id"),  # Include division_id for filtering
                    "league_id": team.get("league_id", "main_league"),
                    "color": team.get("color", "#3b82f6"),
                    "logo": team.get("logo", ""),
                    "active": team.get("active", True),
                    "isExternal": team.get("isExternal", False),
                    # Use full style object
                    "style": team_style,
                    # Include social media and payment links if available
                    "socialMedia": team.get("socialMedia", {}),
                    "paymentLinks": team.get("paymentLinks", {}),
                    # Preserve stat fields from teams collection
                    "wins": team.get("wins", 0),
                    "losses": team.get("losses", 0),
                    "ties": team.get("ties", 0),
                    "points": team.get("points", 0),
                    "goals_for": team.get("goals_for", team.get("pf", 0)),
                    "goals_against": team.get("goals_against", team.get("pa", 0)),
                    "goal_diff": team.get("goal_diff", 0),
                    "games_played": team.get("games_played", 0),
                    "pf": team.get("pf", team.get("goals_for", 0)),
                    "pa": team.get("pa", team.get("goals_against", 0))
                }
                formatted_teams.append(formatted_team)
            
            league_data["teams"] = formatted_teams
            logger.info(f"✅ Using {len(formatted_teams)} teams from teams collection")
        else:
            logger.info(f"✅ Using {len(league_data.get('teams', []))} teams from league_data")
        
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
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
        
        # Process active players from users collection
        if isinstance(active_players, Exception):
            logger.error(f"Error fetching active players: {active_players}")
            active_players = []
        
        # Format players for frontend - merge legacy players with users collection players
        all_players = []
        seen_player_ids = set()
        
        # First add players from users collection (with teamAssignments)
        for user in (active_players or []):
            player_id = user.get("id")
            if player_id and player_id not in seen_player_ids:
                # Get primary team assignment
                team_assignments = user.get("teamAssignments", [])
                primary_assignment = next((a for a in team_assignments if a.get("isPrimary")), team_assignments[0] if team_assignments else None)
                
                player = {
                    "id": player_id,
                    "name": user.get("name", ""),
                    "email": user.get("email", ""),
                    "phone": user.get("phone", ""),
                    "teamId": primary_assignment.get("teamId") if primary_assignment else user.get("teamId", ""),
                    "team_id": primary_assignment.get("teamId") if primary_assignment else user.get("teamId", ""),  # Legacy field
                    "teamName": primary_assignment.get("teamName") if primary_assignment else user.get("teamName", ""),
                    "position": primary_assignment.get("position") if primary_assignment else user.get("position", ""),
                    "jerseyNumber": primary_assignment.get("playerNumber") if primary_assignment else user.get("playerNumber", ""),
                    "playerNumber": primary_assignment.get("playerNumber") if primary_assignment else user.get("playerNumber", ""),
                    "photoUrl": user.get("photoUrl", ""),
                    "roles": user.get("roles", []),
                    "status": user.get("status", "active"),
                    "teamAssignments": team_assignments,  # Include full team assignments for multi-team support
                    # Include player stats
                    "goals": user.get("goals", 0),
                    "assists": user.get("assists", 0),
                    "shots": user.get("shots", 0),
                    "penalties": user.get("penalties", 0),
                    "gamesPlayed": user.get("gamesPlayed", 0),
                    "saves": user.get("saves", 0),
                    "goalsAgainst": user.get("goalsAgainst", 0)
                }
                all_players.append(player)
                seen_player_ids.add(player_id)
        
        # Then add any legacy players from league_data.players (avoiding duplicates)
        legacy_players = league_data.get("players", [])
        for player in legacy_players:
            player_id = player.get("id")
            if player_id and player_id not in seen_player_ids:
                all_players.append(player)
                seen_player_ids.add(player_id)
        
        # Update league_data with merged players
        league_data["players"] = all_players
        logger.info(f"✅ Merged players: {len(all_players)} total ({len(active_players or [])} from users, {len(legacy_players)} from legacy)")
        
        # Return consolidated response
        dashboard_data = {
            **league_data,  # teams, players, events, websiteStyle, etc.
            "galleries": galleries_data.get("galleries", []),
            "youtubeConfig": youtube_config,
            "loadedAt": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"✅ Dashboard data loaded: {len(dashboard_data.get('teams', []))} teams, {len(dashboard_data.get('players', []))} players, {len(dashboard_data.get('galleries', []))} galleries, YouTube: {'enabled' if youtube_config.get('enabled') else 'disabled'}")
        
        return dashboard_data
        
    except Exception as e:
        logger.error(f"❌ Error fetching dashboard data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_active_galleries_internal():
    """Internal function to get active galleries (for parallel execution)"""
    try:
        current_time = datetime.now(timezone.utc)
        
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
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
        
        # Update the teams field
        league_doc["teams"] = teams_data
        league_doc["lastUpdated"] = datetime.now(timezone.utc).isoformat()
        
        # Save back to database
        league_data.pop('_id', None)
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
            # Extract logo URL from style object if it exists
            logo_url = team_data.get("logo", "")
            if team_data.get("style") and team_data["style"].get("logoUrl"):
                logo_url = team_data["style"]["logoUrl"]
            
            team_doc = {
                "id": team_data.get("id", team_data.get("name", "").lower().replace(" ", "-")),
                "name": team_data.get("name", "Unknown Team"),
                "league_id": "main_league",
                "division_id": None,  # Will be set based on division
                "division": team_data.get("division", ""),
                "color": team_data.get("color", "#3b82f6"),
                "logo": logo_url,
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
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
        
        # Update the players field
        league_doc["players"] = players_data
        league_doc["lastUpdated"] = datetime.now(timezone.utc).isoformat()
        
        # Save back to database
        league_data.pop('_id', None)
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
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
        
        # Update the seasons field
        league_doc["seasons"] = seasons_data
        league_doc["lastUpdated"] = datetime.now(timezone.utc).isoformat()
        
        # Save back to database
        league_data.pop('_id', None)
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
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
        
        # Update the leagueSchedule field
        league_doc["leagueSchedule"] = schedule_data
        league_doc["lastUpdated"] = datetime.now(timezone.utc).isoformat()
        
        # Save back to database
        league_data.pop('_id', None)
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
        result = await db.league_data.update_one(
            {"id": "main_league"},
            {"$set": {
                "websiteStyle": style_data,
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        logger.info(f"✅ Website style updated - {len(style_data)} settings, modified: {result.modified_count}")
        
        return {
            "status": "success", 
            "message": f"Successfully updated website style with {len(style_data)} settings",
            "modified": result.modified_count
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating website style: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/pwa/manifest.json")
async def get_pwa_manifest():
    """Generate dynamic PWA manifest based on websiteStyle settings"""
    try:
        # Get the current league data for PWA settings
        league_doc = await db.league_data.find_one({"id": "main_league"})
        style = league_doc.get("websiteStyle", {}) if league_doc else {}
        
        # Build manifest from websiteStyle or use defaults
        manifest = {
            "short_name": style.get("pwaShortName", "MLBL"),
            "name": style.get("pwaAppName", style.get("navLeagueName", "Midwest Lacrosse League")),
            "description": style.get("pwaDescription", "League management portal for schedules, rosters, and stats"),
            "icons": [
                {
                    "src": style.get("pwaIconUrl") or style.get("navLogoUrl") or "/icon-192.png",
                    "sizes": "192x192",
                    "type": "image/png",
                    "purpose": "any maskable"
                },
                {
                    "src": style.get("pwaIconUrl") or style.get("navLogoUrl") or "/icon-512.png",
                    "sizes": "512x512",
                    "type": "image/png",
                    "purpose": "any maskable"
                }
            ],
            "start_url": "/",
            "display": "standalone",
            "theme_color": style.get("pwaThemeColor", style.get("primaryColor", "#1e40af")),
            "background_color": style.get("pwaBackgroundColor", "#f8fafc"),
            "orientation": "portrait-primary",
            "scope": "/",
            "categories": ["sports", "productivity"],
            "shortcuts": [
                {
                    "name": "View Schedule",
                    "short_name": "Schedule",
                    "description": "View upcoming games and events",
                    "url": "/?page=events"
                },
                {
                    "name": "Standings",
                    "short_name": "Standings", 
                    "description": "View league standings",
                    "url": "/?page=standings"
                }
            ]
        }
        
        from fastapi.responses import JSONResponse
        return JSONResponse(content=manifest, media_type="application/manifest+json")
        
    except Exception as e:
        logger.error(f"❌ Error generating PWA manifest: {e}")
        # Return default manifest on error
        return JSONResponse(content={
            "short_name": "MLBL",
            "name": "Midwest Lacrosse League",
            "start_url": "/",
            "display": "standalone",
            "theme_color": "#1e40af",
            "background_color": "#f8fafc"
        }, media_type="application/manifest+json")


@api_router.post("/league-data/liveViewSettings")
async def update_live_view_settings(settings_data: Dict[str, Any]):
    """Update live view styling settings in the league database"""
    try:
        # Get the current league data
        league_doc = await db.league_data.find_one({"id": "main_league"})
        if not league_doc:
            # Create new league data if it doesn't exist
            league_doc = {
                "id": "main_league",
                "liveViewSettings": {},
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
        
        # Update the liveViewSettings field
        league_doc["liveViewSettings"] = settings_data
        league_doc["lastUpdated"] = datetime.now(timezone.utc).isoformat()
        
        # Save back to database
        league_data.pop('_id', None)
        result = await db.league_data.replace_one(
            {"id": "main_league"},
            league_doc,
            upsert=True
        )
        
        logger.info(f"✅ Live view settings updated - {len(settings_data)} settings, modified: {result.modified_count}")
        
        return {
            "status": "success", 
            "message": f"Successfully updated live view settings with {len(settings_data)} settings",
            "modified": result.modified_count,
            "upserted": result.upserted_id is not None
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating live view settings: {e}")
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
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
        
        # Update the newsItems field
        league_doc["newsItems"] = news_data
        league_doc["lastUpdated"] = datetime.now(timezone.utc).isoformat()
        
        # Save back to database
        league_data.pop('_id', None)
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

# ==================== SPONSORS ====================

@api_router.get("/sponsors")
async def get_league_sponsors():
    """Get all league-level sponsors"""
    try:
        sponsors = await db.sponsors.find({"scope": "league"}, {"_id": 0}).sort("order", 1).to_list(100)
        return {"sponsors": sponsors}
    except Exception as e:
        logger.error(f"Error fetching league sponsors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/sponsors")
async def create_sponsor(data: Dict[str, Any]):
    """Create a league or team sponsor"""
    try:
        import uuid
        sponsor = {
            "id": str(uuid.uuid4()),
            "name": data.get("name", ""),
            "message": data.get("message", ""),
            "imageUrl": data.get("imageUrl", ""),
            "websiteUrl": data.get("websiteUrl", ""),
            "socials": data.get("socials", {}),
            "scope": data.get("scope", "league"),
            "teamId": data.get("teamId"),
            "order": data.get("order", 0),
            "active": True,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        await db.sponsors.insert_one(sponsor)
        return {"status": "success", "sponsor": {k: v for k, v in sponsor.items() if k != "_id"}}
    except Exception as e:
        logger.error(f"Error creating sponsor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/sponsors/{sponsor_id}")
async def update_sponsor(sponsor_id: str, data: Dict[str, Any]):
    """Update a sponsor"""
    try:
        update_fields = {k: v for k, v in data.items() if k not in ["id", "_id"]}
        update_fields["updatedAt"] = datetime.now(timezone.utc).isoformat()
        result = await db.sponsors.update_one({"id": sponsor_id}, {"$set": update_fields})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Sponsor not found")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating sponsor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/sponsors/{sponsor_id}")
async def delete_sponsor(sponsor_id: str):
    """Delete a sponsor"""
    try:
        result = await db.sponsors.delete_one({"id": sponsor_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Sponsor not found")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting sponsor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/teams/{team_id}/sponsors")
async def get_team_sponsors(team_id: str):
    """Get sponsors for a specific team"""
    try:
        sponsors = await db.sponsors.find({"teamId": team_id}, {"_id": 0}).sort("order", 1).to_list(100)
        return {"sponsors": sponsors}
    except Exception as e:
        logger.error(f"Error fetching team sponsors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MEDIA ROUTES EXTRACTED TO routes/media.py ====================

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


# ==================== GROUPME ROUTES EXTRACTED TO routes/groupme.py ====================


@api_router.get("/events/{event_id}/calendar-link")
async def get_event_calendar_link(event_id: str):
    """Get Google Calendar link for an event"""
    try:
        from services.event_card_service import event_card_service
        
        # Get event
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
        
        # Parse datetime
        event_datetime = None
        try:
            if target_event.get("start_datetime"):
                event_datetime = datetime.fromisoformat(target_event["start_datetime"].replace('Z', '+00:00'))
            elif target_event.get("date"):
                date_str = target_event["date"]
                event_datetime = datetime.strptime(date_str, '%Y-%m-%d')
                if target_event.get("time"):
                    try:
                        time_parts = target_event["time"].replace(' ', '').upper()
                        if 'PM' in time_parts or 'AM' in time_parts:
                            time_obj = datetime.strptime(time_parts, '%I:%M%p')
                        else:
                            time_obj = datetime.strptime(target_event["time"], '%H:%M')
                        event_datetime = event_datetime.replace(hour=time_obj.hour, minute=time_obj.minute)
                    except:
                        pass
        except:
            pass
        
        if not event_datetime:
            raise HTTPException(status_code=400, detail="Could not parse event date/time")
        
        calendar_url = event_card_service.generate_google_calendar_url(
            title=target_event.get("title", "Event"),
            start_datetime=event_datetime,
            location=target_event.get("location"),
            description=target_event.get("description")
        )
        
        return {
            "event_id": event_id,
            "title": target_event.get("title"),
            "google_calendar_url": calendar_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating calendar link: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/events/{event_id}/ics")
async def download_event_ics(event_id: str):
    """Download ICS file for an event"""
    try:
        from services.event_card_service import event_card_service
        from fastapi.responses import Response
        
        # Get event
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
        
        # Parse datetime
        event_datetime = datetime.now()
        try:
            if target_event.get("start_datetime"):
                event_datetime = datetime.fromisoformat(target_event["start_datetime"].replace('Z', '+00:00'))
            elif target_event.get("date"):
                date_str = target_event["date"]
                event_datetime = datetime.strptime(date_str, '%Y-%m-%d')
        except:
            pass
        
        ics_content = event_card_service.generate_ics_content(
            event_id=event_id,
            title=target_event.get("title", "Event"),
            start_datetime=event_datetime,
            location=target_event.get("location"),
            description=target_event.get("description")
        )
        
        return Response(
            content=ics_content,
            media_type="text/calendar",
            headers={
                "Content-Disposition": f"attachment; filename=event_{event_id}.ics"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating ICS: {e}")
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
            "created_at": datetime.now(timezone.utc).isoformat(),
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
                    "updated_at": datetime.now(timezone.utc).isoformat(),
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
            document["created_at"] = datetime.now(timezone.utc).isoformat()
        if "updated_at" not in document:
            document["updated_at"] = datetime.now(timezone.utc).isoformat()
            
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
        document["updated_at"] = datetime.now(timezone.utc).isoformat()
        
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


# ============================================================================
# RECRUITING / INVITATIONS
# ============================================================================

@api_router.post("/team/{team_id}/invites")
async def send_recruitment_invite(team_id: str, invite_data: Dict[str, Any]):
    """Send a recruitment invitation via email or SMS"""
    try:
        import secrets
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        name = invite_data.get("name", "").strip()
        email = invite_data.get("email", "").strip().lower()
        phone = invite_data.get("phone", "").strip()
        method = invite_data.get("method", "email")  # "email" or "sms"
        position = invite_data.get("position", "")
        message = invite_data.get("message", "")
        sent_by = invite_data.get("sentBy", "")
        sent_by_name = invite_data.get("sentByName", "Coach")
        
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")
        
        if method == "email" and not email:
            raise HTTPException(status_code=400, detail="Email is required for email invites")
        
        if method == "sms" and not phone:
            raise HTTPException(status_code=400, detail="Phone number is required for SMS invites")
        
        # Check if already invited or already a user
        if email:
            existing_user = await db.users.find_one({"email": email})
            if existing_user:
                raise HTTPException(status_code=400, detail="This person is already registered in the system")
            
            existing_invite = await db.recruitment_invites.find_one({
                "email": email,
                "teamId": team_id,
                "status": {"$in": ["sent", "viewed"]}
            })
            if existing_invite:
                raise HTTPException(status_code=400, detail="An invite has already been sent to this email")
        
        # Get team info
        team = await db.teams.find_one({"id": team_id}, {"_id": 0})
        team_name = team.get("name", "the team") if team else "the team"
        
        # Generate unique invite token
        invite_token = secrets.token_urlsafe(32)
        
        # Create invite record
        invite = {
            "id": str(uuid.uuid4()),
            "teamId": team_id,
            "teamName": team_name,
            "name": name,
            "email": email,
            "phone": phone,
            "position": position,
            "message": message,
            "method": method,
            "token": invite_token,
            "status": "sending",  # sending, sent, viewed, accepted, declined, expired
            "sentBy": sent_by,
            "sentByName": sent_by_name,
            "sentAt": datetime.now(timezone.utc).isoformat(),
            "viewedAt": None,
            "respondedAt": None
        }
        
        # Get frontend URL for invite link
        frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000')).replace('/api', '').rstrip('/')
        invite_link = f"{frontend_url}?invite={invite_token}"
        
        # Send the invitation
        if method == "sms":
            # Send via Twilio SMS
            sms_config = await db.sms_config.find_one({})
            if not sms_config or not sms_config.get("account_sid"):
                raise HTTPException(status_code=400, detail="SMS is not configured. Please use email instead.")
            
            try:
                from twilio.rest import Client
                client = Client(sms_config['account_sid'], sms_config['auth_token'])
                
                sms_body = f"Hi {name}! You've been invited to join {team_name}"
                if position:
                    sms_body += f" as a {position}"
                sms_body += f".\n\n"
                if message:
                    sms_body += f'"{message}"\n\n'
                sms_body += f"Join here: {invite_link}\n\n- {sent_by_name}"
                
                sms_message = client.messages.create(
                    body=sms_body,
                    from_=sms_config['phone_number'],
                    to=phone
                )
                logger.info(f"✅ Recruitment SMS sent to {phone}")
                invite["status"] = "sent"
            except Exception as sms_error:
                logger.error(f"❌ SMS send error: {sms_error}")
                invite["status"] = "failed"
                invite["error"] = str(sms_error)
        else:
            # Send via email
            league_data = await db.league_data.find_one({"id": "main_league"})
            smtp_config = league_data.get("smtpConfig") if league_data else None
            
            if not smtp_config or not smtp_config.get("email"):
                raise HTTPException(status_code=400, detail="Email is not configured. Please contact the league admin.")
            
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = f"You're Invited to Join {team_name}!"
                msg['From'] = f"{smtp_config.get('sender_name', 'MLBL')} <{smtp_config['email']}>"
                msg['To'] = email
                
                # Plain text version
                text_body = f"Hi {name}!\n\nYou've been invited to join {team_name}"
                if position:
                    text_body += f" as a {position}"
                text_body += "!\n\n"
                text_body += f'{sent_by_name} says:\n"{message if message else "We would love to have you on our team!"}"\n\n'
                text_body += f"Click here to accept the invitation and create your account:\n{invite_link}\n\n"
                text_body += f"See you on the field!\n- {team_name}"
                
                # HTML version
                html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .message-box {{ background: white; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .cta-button {{ display: inline-block; background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🥍 You're Invited!</h1>
            <p>Join {team_name}{f' as a {position}' if position else ''}</p>
        </div>
        <div class="content">
            <p>Hi {name}!</p>
            
            <p><strong>{sent_by_name}</strong> has invited you to join <strong>{team_name}</strong>!</p>
            
            <div class="message-box">
                <p style="margin: 0; font-style: italic;">"{message if message else 'We would love to have you on our team!'}"</p>
            </div>
            
            <p style="text-align: center;">
                <a href="{invite_link}" class="cta-button">Accept Invitation</a>
            </p>
            
            <p>We look forward to seeing you on the field!</p>
            
            <p>- {team_name}</p>
        </div>
        <div class="footer">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
"""
                
                msg.attach(MIMEText(text_body, 'plain'))
                msg.attach(MIMEText(html_body, 'html'))
                
                with smtplib.SMTP(smtp_config['host'], smtp_config.get('port', 587)) as server:
                    server.starttls()
                    server.login(smtp_config['email'], smtp_config['password'])
                    server.send_message(msg)
                
                logger.info(f"✅ Recruitment email sent to {email}")
                invite["status"] = "sent"
            except Exception as email_error:
                logger.error(f"❌ Email send error: {email_error}")
                invite["status"] = "failed"
                invite["error"] = str(email_error)
        
        # Save invite to database
        await db.recruitment_invites.insert_one(invite)
        invite.pop("_id", None)
        
        # Return error if the invite failed to send
        if invite.get("status") == "failed":
            error_msg = invite.get("error", "Failed to send invitation")
            # Simplify the error message for the user
            if "Username and Password not accepted" in error_msg or "Authentication" in error_msg:
                error_msg = "Email configuration error. Please contact the league admin to verify SMTP settings."
            elif "Connection refused" in error_msg or "timed out" in error_msg.lower():
                error_msg = "Could not connect to email server. Please try again later."
            raise HTTPException(status_code=500, detail=error_msg)
        
        return {"status": "success", "invite": invite}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sending recruitment invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/team/{team_id}/invites")
async def get_team_invites(team_id: str):
    """Get all recruitment invites for a team"""
    try:
        invites_cursor = db.recruitment_invites.find(
            {"teamId": team_id},
            {"_id": 0}
        ).sort("sentAt", -1)
        
        invites = await invites_cursor.to_list(1000)
        
        logger.info(f"✅ Retrieved {len(invites)} invites for team {team_id}")
        
        return {"invites": invites}
        
    except Exception as e:
        logger.error(f"❌ Error fetching team invites: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/invite/{token}")
async def get_invite_details(token: str):
    """Get invite details by token (for the invite landing page)"""
    try:
        invite = await db.recruitment_invites.find_one({"token": token}, {"_id": 0})
        
        if not invite:
            raise HTTPException(status_code=404, detail="Invite not found or expired")
        
        # Mark as viewed if not already
        if invite.get("status") == "sent":
            await db.recruitment_invites.update_one(
                {"token": token},
                {"$set": {"status": "viewed", "viewedAt": datetime.now(timezone.utc).isoformat()}}
            )
            invite["status"] = "viewed"
            invite["viewedAt"] = datetime.now(timezone.utc).isoformat()
        
        # Return limited info (not the full token)
        return {
            "id": invite.get("id"),
            "teamId": invite.get("teamId"),
            "teamName": invite.get("teamName"),
            "name": invite.get("name"),
            "email": invite.get("email"),
            "phone": invite.get("phone"),
            "position": invite.get("position"),
            "message": invite.get("message"),
            "sentByName": invite.get("sentByName"),
            "status": invite.get("status")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/invite/{token}/accept")
async def accept_invite(token: str, user_data: Dict[str, Any]):
    """Accept an invite and create user account"""
    try:
        import hashlib
        
        invite = await db.recruitment_invites.find_one({"token": token}, {"_id": 0})
        
        if not invite:
            raise HTTPException(status_code=404, detail="Invite not found or expired")
        
        if invite.get("status") == "accepted":
            raise HTTPException(status_code=400, detail="This invite has already been accepted")
        
        # Check if email already exists
        email = user_data.get("email", invite.get("email", "")).lower().strip()
        existing = await db.users.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail="An account with this email already exists")
        
        # Create user account
        password = user_data.get("password", "")
        if not password or len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        team_id = invite.get("teamId")
        team_name = invite.get("teamName")
        
        new_user = {
            "id": str(uuid.uuid4()),
            "name": user_data.get("name", invite.get("name", "")),
            "email": email,
            "password": password_hash,
            "phone": user_data.get("phone", invite.get("phone", "")),
            "role": "player",
            "roles": ["player"],
            "teamId": team_id,
            "teamName": team_name,
            "teamAssignments": [{
                "teamId": team_id,
                "teamName": team_name,
                "position": invite.get("position", ""),
                "playerNumber": user_data.get("playerNumber", ""),
                "isPrimary": True
            }],
            "status": "active",
            "inviteId": invite.get("id"),
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "approvedAt": datetime.now(timezone.utc).isoformat(),
            "approvedBy": "invite"
        }
        
        await db.users.insert_one(new_user)
        
        # Update invite status
        await db.recruitment_invites.update_one(
            {"token": token},
            {"$set": {
                "status": "accepted",
                "respondedAt": datetime.now(timezone.utc).isoformat(),
                "acceptedUserId": new_user["id"]
            }}
        )
        
        # Remove sensitive data before returning
        new_user.pop("password", None)
        new_user.pop("_id", None)
        
        logger.info(f"✅ Invite accepted, new user created: {new_user['email']}")
        
        return {"status": "success", "user": new_user}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error accepting invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/invite/{invite_id}")
async def cancel_invite(invite_id: str):
    """Cancel/delete a recruitment invite"""
    try:
        result = await db.recruitment_invites.delete_one({"id": invite_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Invite not found")
        
        logger.info(f"✅ Invite cancelled: {invite_id}")
        
        return {"status": "success", "message": "Invite cancelled"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error cancelling invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/invite/{invite_id}/resend")
async def resend_invite(invite_id: str):
    """Resend a recruitment invite"""
    try:
        invite = await db.recruitment_invites.find_one({"id": invite_id}, {"_id": 0})
        
        if not invite:
            raise HTTPException(status_code=404, detail="Invite not found")
        
        # Re-use the send logic by calling the send endpoint internally
        invite_data = {
            "name": invite.get("name"),
            "email": invite.get("email"),
            "phone": invite.get("phone"),
            "method": invite.get("method"),
            "position": invite.get("position"),
            "message": invite.get("message"),
            "sentBy": invite.get("sentBy"),
            "sentByName": invite.get("sentByName")
        }
        
        # Delete old invite
        await db.recruitment_invites.delete_one({"id": invite_id})
        
        # Send new invite
        return await send_recruitment_invite(invite.get("teamId"), invite_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error resending invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# TEAM INVITATIONS (League Admin inviting teams to join)
# ============================================================================

@api_router.post("/league/team-invites")
async def send_team_invite(invite_data: Dict[str, Any]):
    """Send an invitation for a team to join the league"""
    try:
        import secrets
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        team_name = invite_data.get("teamName", "").strip()
        contact_name = invite_data.get("contactName", "").strip()
        email = invite_data.get("email", "").strip().lower()
        phone = invite_data.get("phone", "").strip()
        method = invite_data.get("method", "email")
        division = invite_data.get("division", "")
        message = invite_data.get("message", "")
        sent_by = invite_data.get("sentBy", "")
        sent_by_name = invite_data.get("sentByName", "League Admin")
        
        if not team_name:
            raise HTTPException(status_code=400, detail="Team name is required")
        
        if not contact_name:
            raise HTTPException(status_code=400, detail="Contact name is required")
        
        if method == "email" and not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        if method == "sms" and not phone:
            raise HTTPException(status_code=400, detail="Phone is required for SMS")
        
        # Check if team already exists or invite sent
        existing_team = await db.teams.find_one({"name": {"$regex": f"^{team_name}$", "$options": "i"}})
        if existing_team:
            raise HTTPException(status_code=400, detail="A team with this name already exists")
        
        existing_invite = await db.team_invites.find_one({
            "email": email,
            "status": {"$in": ["sent", "viewed"]}
        })
        if existing_invite:
            raise HTTPException(status_code=400, detail="An invite has already been sent to this email")
        
        # Get league info
        league_data = await db.league_data.find_one({"id": "main_league"})
        league_name = league_data.get("name", "the league") if league_data else "the league"
        
        # Generate invite token
        invite_token = secrets.token_urlsafe(32)
        
        # Create invite record
        invite = {
            "id": str(uuid.uuid4()),
            "teamName": team_name,
            "contactName": contact_name,
            "email": email,
            "phone": phone,
            "division": division,
            "message": message,
            "method": method,
            "token": invite_token,
            "status": "sending",
            "sentBy": sent_by,
            "sentByName": sent_by_name,
            "sentAt": datetime.now(timezone.utc).isoformat(),
            "viewedAt": None,
            "respondedAt": None
        }
        
        # Get frontend URL
        frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000')).replace('/api', '').rstrip('/')
        invite_link = f"{frontend_url}?team_invite={invite_token}"
        
        # Send invitation
        if method == "sms":
            sms_config = await db.sms_config.find_one({})
            if not sms_config or not sms_config.get("account_sid"):
                raise HTTPException(status_code=400, detail="SMS not configured")
            
            try:
                from twilio.rest import Client
                client = Client(sms_config['account_sid'], sms_config['auth_token'])
                
                sms_body = f"Hi {contact_name}! {team_name} has been invited to join {league_name}!"
                if division:
                    sms_body += f" (Division: {division})"
                sms_body += f"\n\nJoin here: {invite_link}\n\n- {sent_by_name}"
                
                client.messages.create(
                    body=sms_body,
                    from_=sms_config['phone_number'],
                    to=phone
                )
                invite["status"] = "sent"
                logger.info(f"✅ Team invite SMS sent to {phone}")
            except Exception as sms_error:
                logger.error(f"❌ SMS error: {sms_error}")
                invite["status"] = "failed"
                invite["error"] = str(sms_error)
        else:
            smtp_config = league_data.get("smtpConfig") if league_data else None
            if not smtp_config or not smtp_config.get("email"):
                raise HTTPException(status_code=400, detail="Email not configured")
            
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = f"{team_name} is Invited to Join {league_name}!"
                msg['From'] = f"{smtp_config.get('sender_name', 'MLBL')} <{smtp_config['email']}>"
                msg['To'] = email
                
                text_body = f"Hi {contact_name}!\n\n"
                text_body += f"{team_name} has been invited to join {league_name}!\n\n"
                if division:
                    text_body += f"Proposed Division: {division}\n\n"
                if message:
                    text_body += f'Message from {sent_by_name}:\n"{message}"\n\n'
                text_body += f"Click here to accept and set up your team:\n{invite_link}\n\n"
                text_body += f"See you on the field!\n- {league_name}"
                
                html_body = f'''
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .cta-button {{ display: inline-block; background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🥍 Team Invitation!</h1>
            <p>{team_name} is invited to join {league_name}</p>
        </div>
        <div class="content">
            <p>Hi {contact_name}!</p>
            <p>Great news! <strong>{team_name}</strong> has been invited to join <strong>{league_name}</strong>!</p>
            {"<p><strong>Proposed Division:</strong> " + division + "</p>" if division else ""}
            {"<p><em>" + message + "</em></p>" if message else ""}
            <p style="text-align: center; margin: 30px 0;">
                <a href="{invite_link}" class="cta-button">Accept & Set Up Team</a>
            </p>
            <p>We look forward to having you in the league!</p>
            <p>- {league_name}</p>
        </div>
    </div>
</body>
</html>
'''
                
                msg.attach(MIMEText(text_body, 'plain'))
                msg.attach(MIMEText(html_body, 'html'))
                
                with smtplib.SMTP(smtp_config['host'], smtp_config.get('port', 587)) as server:
                    server.starttls()
                    server.login(smtp_config['email'], smtp_config['password'])
                    server.send_message(msg)
                
                invite["status"] = "sent"
                logger.info(f"✅ Team invite email sent to {email}")
            except Exception as email_error:
                logger.error(f"❌ Email error: {email_error}")
                invite["status"] = "failed"
                invite["error"] = str(email_error)
        
        await db.team_invites.insert_one(invite)
        invite.pop("_id", None)
        
        return {"status": "success", "invite": invite}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sending team invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/league/team-invites")
async def get_league_team_invites():
    """Get all team invitations"""
    try:
        invites = await db.team_invites.find({}, {"_id": 0}).sort("sentAt", -1).to_list(1000)
        return {"invites": invites}
    except Exception as e:
        logger.error(f"❌ Error fetching team invites: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/team-invite/{token}")
async def get_team_invite_details(token: str):
    """Get team invite details"""
    try:
        invite = await db.team_invites.find_one({"token": token}, {"_id": 0})
        if not invite:
            raise HTTPException(status_code=404, detail="Invite not found")
        
        if invite.get("status") == "sent":
            await db.team_invites.update_one(
                {"token": token},
                {"$set": {"status": "viewed", "viewedAt": datetime.now(timezone.utc).isoformat()}}
            )
        
        return invite
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/team-invite/{token}/accept")
async def accept_team_invite(token: str, team_data: Dict[str, Any]):
    """Accept team invite and create team with coach account"""
    try:
        import hashlib
        
        invite = await db.team_invites.find_one({"token": token}, {"_id": 0})
        if not invite:
            raise HTTPException(status_code=404, detail="Invite not found")
        
        if invite.get("status") == "accepted":
            raise HTTPException(status_code=400, detail="Already accepted")
        
        # Create team
        team_id = str(uuid.uuid4())[:8] + "_team"
        team = {
            "id": team_id,
            "name": invite.get("teamName"),
            "division": invite.get("division") or team_data.get("division", ""),
            "color": team_data.get("color", "#3b82f6"),
            "abbreviation": team_data.get("abbreviation", invite.get("teamName", "")[:3].upper()),
            "coach": team_data.get("coachName", invite.get("contactName")),
            "status": "active",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "inviteId": invite.get("id")
        }
        
        await db.teams.insert_one(team)
        
        # Create coach user account
        email = team_data.get("email", invite.get("email", "")).lower().strip()
        password = team_data.get("password", "")
        
        if password and len(password) >= 6:
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            coach = {
                "id": str(uuid.uuid4()),
                "name": team_data.get("coachName", invite.get("contactName")),
                "email": email,
                "password": password_hash,
                "phone": team_data.get("phone", invite.get("phone", "")),
                "role": "coach",
                "roles": ["coach"],
                "teamId": team_id,
                "teamName": team.get("name"),
                "teamAssignments": [{
                    "teamId": team_id,
                    "teamName": team.get("name"),
                    "position": "Head Coach",
                    "isPrimary": True
                }],
                "status": "active",
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "approvedAt": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(coach)
            coach.pop("password", None)
            coach.pop("_id", None)
        
        # Update invite
        await db.team_invites.update_one(
            {"token": token},
            {"$set": {
                "status": "accepted",
                "respondedAt": datetime.now(timezone.utc).isoformat(),
                "acceptedTeamId": team_id
            }}
        )
        
        team.pop("_id", None)
        logger.info(f"✅ Team invite accepted: {team.get('name')}")
        
        return {"status": "success", "team": team}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error accepting team invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/team-invite/{invite_id}")
async def cancel_team_invite(invite_id: str):
    """Cancel a team invite"""
    try:
        result = await db.team_invites.delete_one({"id": invite_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Invite not found")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/team/{team_id}/users")
async def get_team_users(team_id: str):
    """Get users associated with a specific team - checks users collection"""
    try:
        team_users = []
        
        # Check the users collection
        users_cursor = db.users.find({
            "$or": [
                {"teamId": team_id},
                {"teamAssignments.teamId": team_id}
            ]
        }, {"_id": 0, "password": 0})
        
        team_users = await users_cursor.to_list(1000)
        
        # Also check legacy league_data.users
        league_data = await db.league_data.find_one({"id": "main_league"})
        if league_data and league_data.get("users"):
            for user in league_data["users"]:
                if user.get("team_id") == team_id or user.get("teamId") == team_id:
                    # Avoid duplicates
                    if not any(u.get("id") == user.get("id") for u in team_users):
                        team_users.append(user)
        
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
        user_id = gmid or f"web_user_{int(datetime.now(timezone.utc).timestamp())}"
        
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
            "updated_at": datetime.now(timezone.utc).isoformat(),
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
            rsvp_record['created_at'] = datetime.now(timezone.utc).isoformat()
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

@api_router.post("/events")
async def create_event(event_data: Dict[str, Any]):
    """Create a new event (simple endpoint for team schedule)"""
    try:
        # Generate ID if not provided
        if not event_data.get('id'):
            event_data['id'] = f"event_{int(datetime.now().timestamp() * 1000)}"
        
        # Set timestamps
        now = datetime.now(timezone.utc).isoformat()
        event_data['created_at'] = now
        event_data['updated_at'] = now
        
        # Ensure proper structure
        if not event_data.get('status'):
            event_data['status'] = 'scheduled'
        
        logger.info(f"📅 Creating event: {event_data.get('title')} for team(s): {event_data.get('teamIds', [])}")
        
        # Add to leagueSchedule in league_data
        league_doc = await db.league_data.find_one({"id": "main_league"})
        if not league_doc:
            league_doc = {"id": "main_league", "leagueSchedule": []}
            await db.league_data.insert_one(league_doc)
        
        current_schedule = league_doc.get("leagueSchedule", [])
        
        # Format for leagueSchedule compatibility
        schedule_event = {
            "id": event_data['id'],
            "title": event_data.get("title", ""),
            "type": event_data.get("type", "event"),
            "date": event_data.get("date", ""),
            "time": event_data.get("time", ""),
            "location": event_data.get("location", ""),
            "description": event_data.get("description", ""),
            "homeTeam": event_data.get("homeTeam"),
            "awayTeam": event_data.get("awayTeam"),
            "teams": event_data.get("teamIds", []),
            "teamIds": event_data.get("teamIds", []),
            "status": event_data.get("status", "scheduled"),
            "createdBy": event_data.get("createdBy"),
            "created_at": now,
            "updated_at": now
        }
        
        current_schedule.append(schedule_event)
        
        # Update the schedule
        await db.league_data.update_one(
            {"id": "main_league"},
            {"$set": {"leagueSchedule": current_schedule, "lastUpdated": now}}
        )
        
        logger.info(f"✅ Event created: {schedule_event['id']}")
        return schedule_event
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/events/{event_id}/rsvp")
async def create_or_update_rsvp(event_id: str, rsvp_data: Dict[str, Any]):
    """Create or update an RSVP for an event"""
    try:
        user_id = rsvp_data.get('user_id')
        user_email = rsvp_data.get('user_email')
        response = rsvp_data.get('response')  # 'going', 'not_going', 'maybe'
        
        if not (user_id or user_email) or not response:
            raise HTTPException(status_code=400, detail="user_id or user_email and response are required")
        
        if response not in ['going', 'not_going', 'maybe']:
            raise HTTPException(status_code=400, detail="Invalid response type")
        
        # If email provided, find user
        if user_email and not user_id:
            user = await db.users.find_one({"email": user_email}, {"_id": 0})
            if user:
                user_id = user["id"]
                user_name = user["name"]
            else:
                user_name = user_email
        else:
            user_name = rsvp_data.get('user_name', 'Unknown')
        
        # Check if RSVP already exists
        query = {"event_id": event_id}
        if user_id:
            query["user_id"] = user_id
        elif user_email:
            query["user_email"] = user_email
            
        existing_rsvp = await db.event_rsvps.find_one(query)
        
        rsvp_record = {
            "event_id": event_id,
            "user_id": user_id,
            "user_email": user_email,
            "response": response,
            "user_name": user_name,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if existing_rsvp:
            # Update existing RSVP
            await db.event_rsvps.update_one(
                query,
                {"$set": rsvp_record}
            )
            logger.info(f"✅ Updated RSVP for event {event_id} by {user_email or user_id}: {response}")
        else:
            # Create new RSVP
            rsvp_record['id'] = str(uuid.uuid4())
            rsvp_record['created_at'] = datetime.now(timezone.utc).isoformat()
            await db.event_rsvps.insert_one(rsvp_record)
            logger.info(f"✅ Created RSVP for event {event_id} by {user_email or user_id}: {response}")
        
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
                        recent_time = datetime.now(timezone.utc).timestamp() - 10  # Within last 10 seconds
                        
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
                                "created_at": int(datetime.now(timezone.utc).timestamp()),
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
            "sent_at": datetime.now(timezone.utc).isoformat()
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
        preferences['updated_at'] = datetime.now(timezone.utc).isoformat()
        
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
        league_doc.pop('_id', None)
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

# Backend Timer Management Endpoints
@api_router.post("/events/{event_id}/timer/start")
async def start_game_timer(event_id: str):
    """Start or resume the game timer"""
    try:
        # Get current game stats
        stats = await db.game_stats.find_one({"event_id": event_id})
        
        if not stats:
            raise HTTPException(status_code=404, detail="Game stats not found")
        
        # Update the timer state
        stats["is_running"] = True
        stats["last_update_timestamp"] = datetime.now(timezone.utc).isoformat()
        
        # Save to database
        await db.game_stats.update_one(
            {"event_id": event_id},
            {"$set": {
                "is_running": True,
                "last_update_timestamp": stats["last_update_timestamp"]
            }}
        )
        
        # Also update unified_events
        await db.unified_events.update_one(
            {"id": event_id},
            {"$set": {
                "scores.is_running": True,
                "scores.last_update_timestamp": stats["last_update_timestamp"]
            }}
        )
        
        return {"status": "success", "is_running": True, "timestamp": stats["last_update_timestamp"]}
    
    except Exception as e:
        logger.error(f"Error starting game timer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/events/{event_id}/timer/pause")
async def pause_game_timer(event_id: str):
    """Pause the game timer"""
    try:
        # Get current game stats
        stats = await db.game_stats.find_one({"event_id": event_id})
        
        if not stats:
            raise HTTPException(status_code=404, detail="Game stats not found")
        
        # Calculate elapsed time since last update
        if stats.get("is_running") and stats.get("last_update_timestamp"):
            last_update = datetime.fromisoformat(stats["last_update_timestamp"].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            elapsed_seconds = int((now - last_update).total_seconds())
            
            # Update time remaining
            current_time = stats.get("time_remaining", 900)
            if isinstance(current_time, str):
                # Parse MM:SS format
                parts = current_time.split(':')
                current_time = int(parts[0]) * 60 + int(parts[1])
            
            new_time_remaining = max(0, current_time - elapsed_seconds)
            stats["time_remaining"] = new_time_remaining
        else:
            new_time_remaining = stats.get("time_remaining", 900)
            if isinstance(new_time_remaining, str):
                parts = new_time_remaining.split(':')
                new_time_remaining = int(parts[0]) * 60 + int(parts[1])
        
        # Update the timer state
        stats["is_running"] = False
        stats["last_update_timestamp"] = datetime.now(timezone.utc).isoformat()
        
        # Save to database
        await db.game_stats.update_one(
            {"event_id": event_id},
            {"$set": {
                "is_running": False,
                "time_remaining": new_time_remaining,
                "last_update_timestamp": stats["last_update_timestamp"]
            }}
        )
        
        # Also update unified_events
        await db.unified_events.update_one(
            {"id": event_id},
            {"$set": {
                "scores.is_running": False,
                "scores.time_remaining": new_time_remaining,
                "scores.last_update_timestamp": stats["last_update_timestamp"]
            }}
        )
        
        return {"status": "success", "is_running": False, "time_remaining": new_time_remaining, "timestamp": stats["last_update_timestamp"]}
    
    except Exception as e:
        logger.error(f"Error pausing game timer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/events/{event_id}/timer/state")
async def get_game_timer_state(event_id: str):
    """Get the current state of the game timer"""
    try:
        # Get current game stats
        stats = await db.game_stats.find_one({"event_id": event_id})
        
        if not stats:
            return {"status": "not_found", "is_running": False, "time_remaining": 900}
        
        # Calculate current time if timer is running
        time_remaining = stats.get("time_remaining", 900)
        if isinstance(time_remaining, str):
            parts = time_remaining.split(':')
            time_remaining = int(parts[0]) * 60 + int(parts[1])
        
        if stats.get("is_running") and stats.get("last_update_timestamp"):
            last_update = datetime.fromisoformat(stats["last_update_timestamp"].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            elapsed_seconds = int((now - last_update).total_seconds())
            time_remaining = max(0, time_remaining - elapsed_seconds)
        
        return {
            "status": "success",
            "is_running": stats.get("is_running", False),
            "time_remaining": time_remaining,
            "current_period": stats.get("current_period", 1),
            "period_length": stats.get("period_length", 15),
            "last_update_timestamp": stats.get("last_update_timestamp")
        }
    
    except Exception as e:
        logger.error(f"Error getting game timer state: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/teams/{team_id}/season-stats")
async def get_team_season_stats(team_id: str, season_id: Optional[str] = None):
    """Get aggregated season stats for a team"""
    try:
        # Build query filter - always look for final games for this team
        query_home = {"home_team.team_id": team_id, "status": "final"}
        query_away = {"away_team.team_id": team_id, "status": "final"}
        
        # If season specified, filter by it; otherwise get all final games
        # (removed auto-season filter to ensure games without season_id are counted)
        if season_id:
            query_home["season_id"] = season_id
            query_away["season_id"] = season_id
        
        # Get all game stats for this team
        games_home = await db.game_stats.find(query_home).to_list(500)
        games_away = await db.game_stats.find(query_away).to_list(500)
        
        logger.info(f"📊 Found {len(games_home)} home games and {len(games_away)} away games for team {team_id}")
        
        games_played = 0
        wins = 0
        losses = 0
        ties = 0
        goals_for = 0
        goals_against = 0
        
        # Process home games
        for game in games_home:
            games_played += 1
            home_goals = game.get("home_team", {}).get("goals_for", 0) or 0
            away_goals = game.get("home_team", {}).get("goals_against", 0) or 0
            
            # Also check for score in home_team directly if goals_for not present
            if home_goals == 0 and "score" in game.get("home_team", {}):
                home_goals = game["home_team"].get("score", 0) or 0
            if away_goals == 0 and "score" in game.get("away_team", {}):
                away_goals = game["away_team"].get("score", 0) or 0
            
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
                away_goals = game.get("away_team", {}).get("goals_for", 0) or 0
                home_goals = game.get("away_team", {}).get("goals_against", 0) or 0
                
                # Also check for score directly if goals_for not present
                if away_goals == 0 and "score" in game.get("away_team", {}):
                    away_goals = game["away_team"].get("score", 0) or 0
                if home_goals == 0 and "score" in game.get("home_team", {}):
                    home_goals = game["home_team"].get("score", 0) or 0
                
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
        
        logger.info(f"📈 Team {team_id} stats: {wins}W-{losses}L-{ties}T, {goals_for}GF-{goals_against}GA")
        
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
        games_home = await db.game_stats.find(query_home).to_list(500)
        games_away = await db.game_stats.find(query_away).to_list(500)
        
        player_stats = {}  # player_id -> aggregated stats
        goalie_stats = {}  # goalie_id -> aggregated stats
        
        def process_game(team_data, result):
            # Process players
            for player in team_data.get("players", []):
                pid = player.get("player_id") or player.get("id")
                if not pid:
                    continue  # Skip players without ID
                pname = player.get("player_name") or player.get("name") or "Unknown"
                    
                if pid not in player_stats:
                    player_stats[pid] = {
                        "player_id": pid,
                        "player_name": pname,
                        "games_played": 0,
                        "wins": 0,
                        "losses": 0,
                        "ties": 0,
                        "shots": 0,
                        "goals": 0,
                        "assists": 0,
                        "faceoffs": 0,
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
                player_stats[pid]["assists"] += player.get("assists", 0)
                player_stats[pid]["faceoffs"] += player.get("faceoffs", 0)
                player_stats[pid]["ground_balls"] += player.get("ground_balls", player.get("groundBalls", 0))
            
            # Process goalies
            for goalie in team_data.get("goalies", []):
                gid = goalie.get("player_id") or goalie.get("id")
                if not gid:
                    continue  # Skip goalies without ID
                gname = goalie.get("player_name") or goalie.get("name") or "Unknown"
                
                if gid not in goalie_stats:
                    goalie_stats[gid] = {
                        "player_id": gid,
                        "player_name": gname,
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
            home_team = game.get("home_team", {})
            result = home_team.get("result", "")
            process_game(home_team, result)
        
        for game in games_away:
            away_team = game.get("away_team", {})
            if away_team:
                result = away_team.get("result", "")
                process_game(away_team, result)
        
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


@api_router.get("/players/{player_id}/stats-by-year")
async def get_player_stats_by_year(player_id: str):
    """Get a player's stats grouped by year/season"""
    try:
        # Get all game stats where this player participated
        all_games = await db.game_stats.find({
            "$or": [
                {"home_team.players.player_id": player_id},
                {"away_team.players.player_id": player_id}
            ],
            "status": "final"
        }).to_list(500)
        
        # Group stats by year
        stats_by_year = {}
        
        for game in all_games:
            # Extract year from game date or season
            game_date = game.get("game_date") or game.get("created_at")
            if game_date:
                if isinstance(game_date, str):
                    year = game_date[:4]  # Get YYYY from ISO date
                else:
                    year = str(game_date.year)
            else:
                year = "Unknown"
            
            if year not in stats_by_year:
                stats_by_year[year] = {
                    "year": year,
                    "gamesPlayed": 0,
                    "goals": 0,
                    "assists": 0,
                    "shots": 0,
                    "faceoffs": 0,
                    "groundBalls": 0,
                    "wins": 0,
                    "losses": 0,
                    "ties": 0
                }
            
            # Check home team
            home_team = game.get("home_team", {})
            for player in home_team.get("players", []):
                if player.get("player_id") == player_id:
                    if player.get("was_present", True):
                        stats_by_year[year]["gamesPlayed"] += 1
                        result = home_team.get("result", "")
                        if result == "win":
                            stats_by_year[year]["wins"] += 1
                        elif result == "loss":
                            stats_by_year[year]["losses"] += 1
                        elif result == "tie":
                            stats_by_year[year]["ties"] += 1
                    stats_by_year[year]["goals"] += player.get("goals", 0)
                    stats_by_year[year]["assists"] += player.get("assists", 0)
                    stats_by_year[year]["shots"] += player.get("shots", 0)
                    stats_by_year[year]["faceoffs"] += player.get("faceoffs", 0)
                    stats_by_year[year]["groundBalls"] += player.get("ground_balls", player.get("groundBalls", 0))
                    break
            
            # Check away team
            away_team = game.get("away_team", {})
            if away_team:
                for player in away_team.get("players", []):
                    if player.get("player_id") == player_id:
                        if player.get("was_present", True):
                            stats_by_year[year]["gamesPlayed"] += 1
                            result = away_team.get("result", "")
                            if result == "win":
                                stats_by_year[year]["wins"] += 1
                            elif result == "loss":
                                stats_by_year[year]["losses"] += 1
                            elif result == "tie":
                                stats_by_year[year]["ties"] += 1
                        stats_by_year[year]["goals"] += player.get("goals", 0)
                        stats_by_year[year]["assists"] += player.get("assists", 0)
                        stats_by_year[year]["shots"] += player.get("shots", 0)
                        stats_by_year[year]["faceoffs"] += player.get("faceoffs", 0)
                        stats_by_year[year]["groundBalls"] += player.get("ground_balls", player.get("groundBalls", 0))
                        break
        
        # Sort by year descending
        sorted_stats = dict(sorted(stats_by_year.items(), reverse=True))
        
        return {
            "player_id": player_id,
            "statsByYear": sorted_stats,
            "totalYears": len(sorted_stats)
        }
    
    except Exception as e:
        logger.error(f"Error getting player stats by year: {e}")
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
        teams = await db.teams.find(query).to_list(500)
        
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
        # Include goals_for/goals_against (also as pf/pa for legacy compatibility)
        await db.teams.update_one(
            {"id": team_id},
            {"$set": {
                "wins": stats["wins"],
                "losses": stats["losses"],
                "ties": stats.get("ties", 0),
                "points": stats["points"],
                "goals_for": stats.get("goals_for", 0),
                "goals_against": stats.get("goals_against", 0),
                "goal_diff": stats.get("goal_diff", 0),
                "pf": stats.get("goals_for", 0),  # Legacy field
                "pa": stats.get("goals_against", 0),  # Legacy field
                "games_played": stats.get("games_played", 0)
            }}
        )
        logger.info(f"✅ Updated team {team_id} stats: W{stats['wins']}-L{stats['losses']}, GF:{stats.get('goals_for',0)}")
    except Exception as e:
        logger.error(f"Error updating team season stats: {e}")


async def _update_player_stats_from_game(game_stats: Dict[str, Any]):
    """Update individual player stats from a game"""
    try:
        # Process home team players
        home_team = game_stats.get('home_team', {})
        home_players = home_team.get('players', [])
        
        for player in home_players:
            player_id = player.get('id')
            if not player_id:
                continue
                
            stats = player.get('stats', {})
            goals = stats.get('goals', 0)
            assists = stats.get('assists', 0)
            shots = stats.get('shots', 0)
            penalties = stats.get('penalties', 0)
            faceoffs = stats.get('faceoffs', 0)
            ground_balls = stats.get('groundBalls', stats.get('ground_balls', 0))
            
            # Update user's stats - increment totals
            await db.users.update_one(
                {"id": player_id},
                {
                    "$inc": {
                        "goals": goals,
                        "assists": assists,
                        "shots": shots,
                        "penalties": penalties,
                        "faceoffs": faceoffs,
                        "groundBalls": ground_balls,
                        "gamesPlayed": 1
                    }
                }
            )
            logger.info(f"📊 Updated stats for player {player_id}: +{goals}G +{assists}A +{faceoffs}FO +{ground_balls}GB")
        
        # Process away team players
        away_team = game_stats.get('away_team', {})
        away_players = away_team.get('players', [])
        
        for player in away_players:
            player_id = player.get('id')
            if not player_id:
                continue
                
            stats = player.get('stats', {})
            goals = stats.get('goals', 0)
            assists = stats.get('assists', 0)
            shots = stats.get('shots', 0)
            penalties = stats.get('penalties', 0)
            faceoffs = stats.get('faceoffs', 0)
            ground_balls = stats.get('groundBalls', stats.get('ground_balls', 0))
            
            # Update user's stats - increment totals
            await db.users.update_one(
                {"id": player_id},
                {
                    "$inc": {
                        "goals": goals,
                        "assists": assists,
                        "shots": shots,
                        "penalties": penalties,
                        "faceoffs": faceoffs,
                        "groundBalls": ground_balls,
                        "gamesPlayed": 1
                    }
                }
            )
            logger.info(f"📊 Updated stats for player {player_id}: +{goals}G +{assists}A +{faceoffs}FO +{ground_balls}GB")
        
        # Process goalies
        goalies = game_stats.get('goalies', {})
        for team_key in ['home', 'away']:
            team_goalies = goalies.get(team_key, [])
            for goalie in team_goalies:
                goalie_id = goalie.get('id')
                if not goalie_id:
                    continue
                    
                stats = goalie.get('stats', {})
                saves = stats.get('saves', 0)
                goals_against = stats.get('goals_against', 0)
                
                await db.users.update_one(
                    {"id": goalie_id},
                    {
                        "$inc": {
                            "saves": saves,
                            "goalsAgainst": goals_against,
                            "gamesPlayed": 1
                        }
                    }
                )
                logger.info(f"🧤 Updated goalie stats for {goalie_id}: +{saves} saves")
                
    except Exception as e:
        logger.error(f"Error updating player stats from game: {e}")



@api_router.post("/admin/recalculate-stats")
async def recalculate_all_stats():
    """Admin endpoint to recalculate all team and player stats from final games"""
    try:
        # Get all teams
        teams = await db.teams.find().to_list(100)  # Limit teams
        updated_teams = 0
        
        for team in teams:
            team_id = team.get("id")
            if team_id:
                await _update_team_season_stats(team_id)
                updated_teams += 1
        
        # Get all final games and update player stats
        final_games = await db.game_stats.find({"status": "final"}).to_list(500)
        
        # Reset all player stats first
        await db.users.update_many(
            {"$or": [{"roles": "player"}, {"role": "player"}]},
            {"$set": {
                "goals": 0,
                "assists": 0,
                "shots": 0,
                "penalties": 0,
                "gamesPlayed": 0,
                "saves": 0,
                "goalsAgainst": 0
            }}
        )
        
        # Recalculate from all final games
        for game in final_games:
            await _update_player_stats_from_game(game)
        
        logger.info(f"✅ Recalculated stats: {updated_teams} teams, {len(final_games)} final games")
        
        return {
            "success": True,
            "teams_updated": updated_teams,
            "games_processed": len(final_games)
        }
    except Exception as e:
        logger.error(f"Error recalculating stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/admin/teams/{team_id}")
async def admin_update_team(team_id: str, data: Dict[str, Any]):
    """Admin endpoint to update team data in the teams collection"""
    try:
        result = await db.teams.update_one(
            {"id": team_id},
            {"$set": data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"Team {team_id} not found")
        
        return {
            "success": True,
            "message": f"Team {team_id} updated",
            "modified_count": result.modified_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating team {team_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SEASON MANAGEMENT API ENDPOINTS
# ============================================

@api_router.get("/seasons")
async def get_seasons(league_id: str = "main_league"):
    """Get all seasons for a league"""
    try:
        seasons = await db.seasons.find({"league_id": league_id}).sort("start_date", -1).to_list(500)
        
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
        leagues = await db.leagues.find().to_list(50)  # Limit leagues
        
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

# ==================== DESIGN TEMPLATES ====================

@api_router.get("/design-templates")
async def get_design_templates():
    """Get all saved design templates"""
    try:
        templates = await db.design_templates.find({}, {"_id": 0}).sort("createdAt", -1).to_list(100)
        return {"templates": templates}
    except Exception as e:
        logger.error(f"Error fetching design templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/design-templates")
async def save_design_template(template_data: Dict[str, Any]):
    """Save a new design template"""
    try:
        import uuid
        template = {
            "id": str(uuid.uuid4()),
            "name": template_data.get("name", "Untitled"),
            "style": template_data.get("style", {}),
            "createdAt": template_data.get("createdAt", datetime.now(timezone.utc).isoformat()),
        }
        await db.design_templates.insert_one(template)
        return {"status": "success", "template": {k: v for k, v in template.items() if k != "_id"}}
    except Exception as e:
        logger.error(f"Error saving design template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/design-templates/{template_id}")
async def delete_design_template(template_id: str):
    """Delete a design template"""
    try:
        result = await db.design_templates.delete_one({"id": template_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        return {"status": "success", "message": "Template deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting design template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DIVISIONS ====================

@api_router.get("/divisions")
async def get_all_divisions():
    """Get all divisions (not league-specific)"""
    try:
        divisions = await db.divisions.find({}).sort("level", 1).to_list(500)
        
        # If no divisions in database, extract from teams
        if not divisions:
            league_data = await db.league_data.find_one({"id": "main_league"})
            teams = league_data.get("teams", []) if league_data else []
            
            # Also check teams collection
            teams_collection = await db.teams.find({}).to_list(500)
            all_teams = teams + [t for t in teams_collection if t.get('id') not in [x.get('id') for x in teams]]
            
            # Extract unique divisions from teams
            unique_divisions = {}
            for team in all_teams:
                div_name = team.get("division")
                if div_name and div_name not in unique_divisions:
                    unique_divisions[div_name] = {
                        "id": f"div_{div_name.lower().replace(' ', '_')}",
                        "name": div_name,
                        "level": len(unique_divisions) + 1,
                        "color": "#3b82f6",
                        "teamCount": 0
                    }
                if div_name:
                    unique_divisions[div_name]["teamCount"] = unique_divisions[div_name].get("teamCount", 0) + 1
            
            divisions = list(unique_divisions.values())
        
        # Remove MongoDB _id
        for division in divisions:
            if "_id" in division:
                del division["_id"]
        
        return {"divisions": divisions}
    except Exception as e:
        logger.error(f"Error getting divisions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/divisions")
async def create_division_general(division_data: Dict[str, Any]):
    """Create a new division"""
    try:
        # Generate ID if not provided
        if not division_data.get('id'):
            division_data['id'] = f"div_{int(datetime.now().timestamp() * 1000)}"
        
        # Set timestamps
        now = datetime.now(timezone.utc).isoformat()
        division_data['createdAt'] = division_data.get('createdAt', now)
        division_data['updatedAt'] = now
        
        # Ensure required fields
        if not division_data.get('name'):
            raise HTTPException(status_code=400, detail="Division name is required")
        
        # Check for duplicate name
        existing = await db.divisions.find_one({"name": division_data['name']})
        if existing:
            raise HTTPException(status_code=400, detail=f"Division '{division_data['name']}' already exists")
        
        # Insert division
        await db.divisions.insert_one(division_data)
        
        # Remove _id before returning
        division_data.pop('_id', None)
        
        logger.info(f"✅ Created division: {division_data['name']}")
        return {"status": "success", "division": division_data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating division: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/divisions/{division_id}")
async def update_division(division_id: str, division_data: Dict[str, Any]):
    """Update a division"""
    try:
        # Set updated timestamp
        division_data['updatedAt'] = datetime.now(timezone.utc).isoformat()
        
        # Update division
        result = await db.divisions.update_one(
            {"id": division_id},
            {"$set": division_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"Division not found: {division_id}")
        
        logger.info(f"✅ Updated division: {division_id}")
        return {"status": "success", "division_id": division_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating division: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/divisions/{division_id}")
async def delete_division(division_id: str):
    """Delete a division"""
    try:
        # Check if any teams use this division
        division = await db.divisions.find_one({"id": division_id})
        if division:
            div_name = division.get('name')
            # Check teams collection
            teams_with_division = await db.teams.find({"division": div_name}).to_list(100)
            if teams_with_division:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot delete: {len(teams_with_division)} team(s) are assigned to this division"
                )
        
        # Delete division
        result = await db.divisions.delete_one({"id": division_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"Division not found: {division_id}")
        
        logger.info(f"✅ Deleted division: {division_id}")
        return {"status": "success", "message": "Division deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting division: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== LEAGUE SETTINGS ENDPOINTS =====

@api_router.get("/league-settings/welcome-message")
async def get_welcome_message():
    """Get the league welcome message"""
    try:
        settings = await db.league_settings.find_one({"type": "welcome_message"}, {"_id": 0})
        if settings:
            return settings
        return {"type": "welcome_message", "title": "", "content": ""}
    except Exception as e:
        logger.error(f"Error getting welcome message: {e}")
        return {"type": "welcome_message", "title": "", "content": ""}

@api_router.put("/league-settings/welcome-message")
async def update_welcome_message(data: Dict[str, Any]):
    """Update the league welcome message (admin only)"""
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        update_data = {
            "type": "welcome_message",
            "title": data.get("title", "Welcome to Our League!"),
            "content": data.get("content", ""),
            "backgroundColor": data.get("backgroundColor", "#eff6ff"),
            "textColor": data.get("textColor", "#1e293b"),
            "titleColor": data.get("titleColor", "#1e40af"),
            "fontFamily": data.get("fontFamily", "Inter, system-ui, sans-serif"),
            "imageUrl": data.get("imageUrl", ""),
            "imagePosition": data.get("imagePosition", "right"),
            "updatedAt": now,
            "updatedBy": data.get("updatedBy")
        }
        
        await db.league_settings.update_one(
            {"type": "welcome_message"},
            {"$set": update_data},
            upsert=True
        )
        
        logger.info("✅ Welcome message updated")
        return {"status": "success", "message": "Welcome message updated"}
    except Exception as e:
        logger.error(f"Error updating welcome message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/leagues/{league_id}/divisions")
async def get_league_divisions(league_id: str):
    """Get all divisions for a specific league"""
    try:
        divisions = await db.divisions.find({"league_id": league_id}).sort("level", 1).to_list(500)
        
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
        teams = await db.teams.find({"league_id": league_id}).to_list(500)
        
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
        teams = await db.teams.find({"division_id": division_id}).to_list(500)
        
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
        teams = await db.teams.find({"league_id": league_id}).to_list(500)
        
        # Get all divisions in this league
        divisions = await db.divisions.find({"league_id": league_id}).sort("level", 1).to_list(500)
        
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

@api_router.get("/test-proxy")
async def test_proxy():
    """Test if proxy endpoint exists and works"""
    try:
        test_url = "https://drive.google.com/uc?id=1YpDiOBNe8Twc1aFSF6rrUxounnnehWp6"
        
        # Test if we can access Google Drive directly
        async with httpx.AsyncClient() as client:
            response = await client.get(test_url, timeout=10)
            return {
                "status": "success",
                "test_url": test_url,
                "status_code": response.status_code,
                "content_type": response.headers.get("content-type", "unknown"),
                "can_access_google_drive": response.status_code == 200
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "can_access_google_drive": False
        }

@api_router.post("/fix-gallery-urls")
async def fix_gallery_urls():
    """Fix old gallery URLs that have wrong domain/endpoint"""
    try:
        fixed_count = 0
        
        # Get all galleries
        galleries = await db.media_galleries.find().to_list(100)  # Limit galleries
        
        for gallery in galleries:
            needs_update = False
            media_items = gallery.get('mediaItems', [])
            
            for item in media_items:
                # Fix thumbnailUrl if it has old domain/endpoint
                if item.get('thumbnailUrl') and 'sports-connect-8.preview.emergentagent.com' in item['thumbnailUrl']:
                    # Extract Google Drive file ID and create correct proxy URL
                    if '/drive/' in item['thumbnailUrl'] and '?size=' in item['thumbnailUrl']:
                        file_id = item['thumbnailUrl'].split('/drive/')[1].split('?')[0]
                        item['thumbnailUrl'] = f"https://team-lax-portal.emergent.host/api/proxy-image?url={urllib.parse.quote(f'https://drive.google.com/uc?id={file_id}')}"
                        needs_update = True
                
                # Fix url if it needs fixing
                if item.get('url') and 'sports-connect-8.preview.emergentagent.com' in item['url']:
                    if '/drive/' in item['url']:
                        file_id = item['url'].split('/drive/')[1].split('?')[0]
                        item['url'] = f"https://drive.google.com/uc?id={file_id}"
                        needs_update = True
            
            # Update gallery if needed
            if needs_update:
                await db.media_galleries.update_one(
                    {"_id": gallery["_id"]},
                    {"$set": {"mediaItems": media_items}}
                )
                fixed_count += 1
        
        return {
            "status": "success",
            "message": f"Fixed URLs in {fixed_count} galleries",
            "fixed_count": fixed_count
        }
        
    except Exception as e:
        logger.error(f"Error fixing gallery URLs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/debug/team-ids")
async def debug_team_ids():
    """Debug team ID mismatches between teams and game stats"""
    try:
        # Get teams from teams collection
        teams = await db.teams.find().to_list(100)  # Limit teams
        team_info = []
        for team in teams:
            team_info.append({
                "name": team.get("name"),
                "id": team.get("id"),
                "slug": team.get("name", "").lower().replace(" ", "-").replace("'", "")
            })
        
        # Get unique team IDs from game stats
        game_stats = await db.game_stats.find().to_list(500)  # Limit game stats
        game_team_ids = set()
        for game in game_stats:
            home_id = game.get("home_team", {}).get("team_id")
            away_id = game.get("away_team", {}).get("team_id")
            if home_id:
                game_team_ids.add(home_id)
            if away_id:
                game_team_ids.add(away_id)
        
        return {
            "teams_collection": team_info,
            "game_stats_team_ids": list(game_team_ids),
            "mismatches": [
                team_id for team_id in game_team_ids 
                if not any(team["id"] == team_id for team in team_info)
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fix/team-ids")
async def fix_team_id_mismatches():
    """Fix team ID mismatches in game stats"""
    try:
        # Get all teams to create name->id mapping
        teams = await db.teams.find().to_list(100)  # Limit teams
        name_to_id = {}
        id_to_name = {}
        
        for team in teams:
            team_name = team.get("name", "")
            team_id = team.get("id", "")
            name_to_id[team_name] = team_id
            id_to_name[team_id] = team_name
            
            # Also map slugified versions
            slug = team_name.lower().replace(" ", "-").replace("'", "")
            name_to_id[slug] = team_id
        
        # Fix game stats with wrong team IDs
        game_stats = await db.game_stats.find().to_list(500)  # Limit game stats
        fixed_count = 0
        
        for game in game_stats:
            needs_update = False
            
            # Fix home team ID
            home_team = game.get("home_team", {})
            home_id = home_team.get("team_id", "")
            if home_id and home_id in name_to_id and name_to_id[home_id] != home_id:
                home_team["team_id"] = name_to_id[home_id]
                needs_update = True
            
            # Fix away team ID  
            away_team = game.get("away_team", {})
            away_id = away_team.get("team_id", "")
            if away_id and away_id in name_to_id and name_to_id[away_id] != away_id:
                away_team["team_id"] = name_to_id[away_id]
                needs_update = True
            
            if needs_update:
                await db.game_stats.update_one(
                    {"_id": game["_id"]},
                    {"$set": {
                        "home_team": home_team,
                        "away_team": away_team
                    }}
                )
                fixed_count += 1
        
        return {
            "status": "success",
            "fixed_count": fixed_count,
            "team_mapping": name_to_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/game-stats")
async def create_game_stats(game_stats: Dict[str, Any]):
    """Create or update game statistics from tournament bracket or manual entry"""
    try:
        event_id = game_stats.get('event_id')
        logger.info(f"📊 Creating/updating game stats for event: {event_id}")
        
        # Validate required fields
        required_fields = ['event_id', 'home_team', 'away_team']
        for field in required_fields:
            if field not in game_stats:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Add/update timestamps
        current_time = datetime.now(timezone.utc)
        if 'created_at' not in game_stats:
            game_stats['created_at'] = current_time
        game_stats['updated_at'] = current_time
        
        # Generate ID if not present
        if 'id' not in game_stats:
            game_stats['id'] = str(uuid.uuid4())
        
        # UPSERT: Update if exists, insert if not
        existing_stats = await db.game_stats.find_one({"event_id": event_id})
        
        if existing_stats:
            # Update existing record
            logger.info(f"📝 Updating existing game stats for event: {event_id}")
            await db.game_stats.update_one(
                {"event_id": event_id},
                {"$set": game_stats}
            )
            logger.info(f"✅ Game stats updated for event: {event_id}")
            action = "updated"
        else:
            # Insert new record
            logger.info(f"➕ Creating new game stats for event: {event_id}")
            result = await db.game_stats.insert_one(game_stats)
            logger.info(f"✅ Game stats created with ID: {game_stats['id']}")
            action = "created"
        
        # If status is "final", update team season stats and player stats
        if game_stats.get('status') == 'final':
            logger.info(f"🏁 Game marked as FINAL - updating team and player stats")
            
            # Update team season stats
            home_team_id = game_stats.get('home_team', {}).get('team_id')
            away_team_id = game_stats.get('away_team', {}).get('team_id')
            
            if home_team_id:
                await _update_team_season_stats(home_team_id)
                logger.info(f"📈 Updated season stats for home team: {home_team_id}")
            
            if away_team_id:
                await _update_team_season_stats(away_team_id)
                logger.info(f"📈 Updated season stats for away team: {away_team_id}")
            
            # Update player stats
            await _update_player_stats_from_game(game_stats)
            logger.info(f"👤 Updated player stats from game")
        
        return {
            "status": "success",
            "message": "Game statistics saved successfully",
            "game_stat_id": game_stats['id'],
            "action": action,
            "stats_updated": game_stats.get('status') == 'final'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating/updating game stats: {e}")
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
        games = await db.game_stats.find({"season_id": season_id, "status": "final"}).to_list(500)
        
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

# ============= UNIFIED EVENTS SYSTEM API =============

# Pydantic models for unified events
class UnifiedEvent(BaseModel):
    id: Optional[str] = None
    type: str = "regular_game"  # regular_game, tournament, practice, social, external
    title: str
    description: Optional[str] = ""
    date: Optional[str] = ""  # Optional for placeholder events
    time: Optional[str] = ""  # Optional for placeholder events
    location: Optional[str] = ""  # Optional for placeholder events
    locationId: Optional[str] = ""  # Reference to saved location
    imageUrl: Optional[str] = ""
    teams: List[str] = []
    status: str = "scheduled"  # scheduled, in_progress, completed, cancelled
    rsvp_enabled: bool = True
    groupme_integration: bool = False
    email_notifications: bool = False
    auto_create_polls: bool = False
    tournament_config: Optional[Dict[str, Any]] = None
    bracket: Optional[Dict[str, Any]] = None
    scores: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    # External event fields
    is_external: bool = False
    external_url: Optional[str] = ""
    external_organizer: Optional[str] = ""
    # Recurring event fields
    is_recurring: bool = False
    recurrence: Optional[Dict[str, Any]] = None  # {frequency, daysOfWeek, endType, count, endDate}

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    locationId: Optional[str] = None
    imageUrl: Optional[str] = None
    teams: Optional[List[str]] = None
    status: Optional[str] = None
    rsvp_enabled: Optional[bool] = None
    groupme_integration: Optional[bool] = None
    email_notifications: Optional[bool] = None
    tournament_config: Optional[Dict[str, Any]] = None
    bracket: Optional[Dict[str, Any]] = None
    scores: Optional[Dict[str, Any]] = None
    # External event fields
    is_external: Optional[bool] = None
    external_url: Optional[str] = None
    external_organizer: Optional[str] = None

@api_router.get("/unified-events")
async def get_unified_events():
    """Get all unified events"""
    try:
        events = await db.unified_events.find().sort("date", 1).to_list(500)  # Limit events
        
        # Remove MongoDB _id field
        for event in events:
            if "_id" in event:
                del event["_id"]
        
        return {"events": events}
        
    except Exception as e:
        logger.error(f"Error getting unified events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/unified-events")
async def create_unified_event(event: UnifiedEvent):
    """Create a new unified event (or multiple for recurring events)"""
    try:
        # Check if this is a recurring event
        event_dict = event.dict()
        is_recurring = event_dict.get("is_recurring", False)
        recurrence = event_dict.get("recurrence", {})
        
        if is_recurring and recurrence and event_dict.get("date"):
            # Generate recurring event instances
            return await _create_recurring_events(event_dict, recurrence)
        
        # Generate ID if not provided
        if not event.id:
            event.id = str(uuid.uuid4())
        
        # Set timestamps
        now = datetime.now(timezone.utc).isoformat()
        event.created_at = now
        event.updated_at = now
        
        # Convert to dict for MongoDB
        event_data = event.dict()
        
        # Check for duplicate event ID
        existing = await db.unified_events.find_one({"id": event.id})
        if existing:
            raise HTTPException(status_code=400, detail="Event with this ID already exists")
        
        # Insert event into unified_events collection
        await db.unified_events.insert_one(event_data)
        
        # ALSO add to leagueSchedule for ticker compatibility
        try:
            league_doc = await db.league_data.find_one({"id": "main_league"})
            if not league_doc:
                league_doc = {"id": "main_league", "leagueSchedule": []}
                await db.league_data.insert_one(league_doc)
            
            current_schedule = league_doc.get("leagueSchedule", [])
            
            # Create leagueSchedule compatible event format
            schedule_event = {
                "id": event.id,
                "title": event_data.get("title", ""),
                "type": event_data.get("type", "event"),
                "event_type": event_data.get("type", "event"),
                "date": event_data.get("date", ""),
                "time": event_data.get("time", ""),
                "location": event_data.get("location", ""),
                "description": event_data.get("description", ""),
                "homeTeam": event_data.get("teams", [None])[0] if event_data.get("teams") else None,
                "awayTeam": event_data.get("teams", [None, None])[1] if len(event_data.get("teams", [])) > 1 else None,
                "teams": event_data.get("teams", []),
                "status": event_data.get("status", "scheduled"),
                "imageUrl": event_data.get("imageUrl", ""),
                "is_external": event_data.get("is_external", False),
                "external_url": event_data.get("external_url", ""),
                "external_organizer": event_data.get("external_organizer", ""),
                "rsvp_enabled": event_data.get("rsvp_enabled", True),
                "created_at": now,
                "updated_at": now
            }
            
            # Add start_datetime if date and time are provided
            if event_data.get("date") and event_data.get("time"):
                try:
                    schedule_event["start_datetime"] = f"{event_data['date']}T{event_data['time']}:00"
                except:
                    pass
            elif event_data.get("date"):
                schedule_event["start_datetime"] = f"{event_data['date']}T00:00:00"
            
            current_schedule.append(schedule_event)
            
            await db.league_data.update_one(
                {"id": "main_league"},
                {"$set": {"leagueSchedule": current_schedule}},
                upsert=True
            )
            logger.info(f"✅ Event also added to leagueSchedule for ticker")
        except Exception as schedule_err:
            logger.warning(f"Failed to add event to leagueSchedule: {schedule_err}")
        
        # Create GroupMe integration if enabled
        if event.groupme_integration and event.auto_create_polls:
            try:
                await _create_groupme_poll_for_event(event_data)
            except Exception as e:
                logger.warning(f"Failed to create GroupMe poll: {e}")
        
        # Send email notifications if enabled
        if event_data.get("email_notifications", False):
            try:
                logger.info(f"📧 Email notifications enabled for event {event.id}, sending...")
                # Send emails immediately (not as background task to avoid silent failures)
                await send_email_event_notifications(event.id, {})
                logger.info(f"✅ Email notifications sent for event {event.id}")
            except Exception as e:
                logger.error(f"❌ Failed to send email notifications: {e}")
                # Don't fail event creation if email fails
        
        # Remove MongoDB _id field for response
        if "_id" in event_data:
            del event_data["_id"]
            
        logger.info(f"Created unified event: {event.id}")
        return event_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating unified event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _create_recurring_events(base_event: Dict[str, Any], recurrence: Dict[str, Any]):
    """
    Generate and save recurring event instances
    
    Args:
        base_event: The original event data
        recurrence: {
            "frequency": "daily" | "weekly" | "biweekly" | "monthly",
            "daysOfWeek": [0,1,2,3,4,5,6] (0=Sunday for weekly),
            "endType": "count" | "date" | "never",
            "count": int,
            "endDate": "YYYY-MM-DD"
        }
    """
    try:
        from datetime import datetime, timedelta
        
        logger.info(f"📅 Creating recurring events: {recurrence}")
        
        frequency = recurrence.get("frequency", "weekly")
        end_type = recurrence.get("endType", "count")
        count = recurrence.get("count", 10)
        end_date_str = recurrence.get("endDate")
        days_of_week = recurrence.get("daysOfWeek", [])
        
        # Parse start date
        start_date_str = base_event.get("date")
        if not start_date_str:
            raise HTTPException(status_code=400, detail="Date is required for recurring events")
        
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        
        # Determine end condition
        if end_type == "date" and end_date_str:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
            max_instances = 365  # Safety limit
        elif end_type == "never":
            # Generate for 1 year ahead
            end_date = start_date + timedelta(days=365)
            max_instances = 52  # ~1 year of weekly events
        else:  # count
            end_date = start_date + timedelta(days=365)  # Max 1 year
            max_instances = count
        
        # Generate instances
        instances = []
        current_date = start_date
        parent_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        while len(instances) < max_instances and current_date <= end_date:
            # For weekly with specific days, check if this day matches
            if frequency == "weekly" and days_of_week:
                # Convert Python weekday (0=Monday) to UI weekday (0=Sunday)
                ui_weekday = (current_date.weekday() + 1) % 7
                if ui_weekday not in days_of_week:
                    current_date += timedelta(days=1)
                    continue
            
            # Create instance
            instance = {
                **base_event,
                "id": str(uuid.uuid4()),
                "date": current_date.strftime("%Y-%m-%d"),
                "is_recurring_instance": True,
                "parent_event_id": parent_id,
                "recurrence_index": len(instances),
                "created_at": now,
                "updated_at": now,
                "status": "scheduled"
            }
            
            # Add start_datetime
            if base_event.get("time"):
                instance["start_datetime"] = f"{instance['date']}T{base_event['time']}:00"
            else:
                instance["start_datetime"] = f"{instance['date']}T00:00:00"
            
            # Clean up recurrence from instance (don't want nested recurrence)
            instance.pop("is_recurring", None)
            instance.pop("recurrence", None)
            
            instances.append(instance)
            
            # Calculate next occurrence
            if frequency == "daily":
                current_date += timedelta(days=1)
            elif frequency == "weekly":
                if days_of_week:
                    current_date += timedelta(days=1)  # Daily check for matching days
                else:
                    current_date += timedelta(weeks=1)
            elif frequency == "biweekly":
                current_date += timedelta(weeks=2)
            elif frequency == "monthly":
                # Add one month
                month = current_date.month + 1
                year = current_date.year
                if month > 12:
                    month = 1
                    year += 1
                try:
                    current_date = current_date.replace(year=year, month=month)
                except ValueError:
                    # Handle end-of-month edge cases (e.g., Jan 31 -> Feb 28)
                    current_date = current_date.replace(year=year, month=month, day=28)
            else:
                current_date += timedelta(weeks=1)  # Default weekly
        
        logger.info(f"📅 Generated {len(instances)} recurring event instances")
        
        # Save all instances to unified_events collection
        if instances:
            await db.unified_events.insert_many(instances)
            
            # Also add to leagueSchedule for ticker
            try:
                league_doc = await db.league_data.find_one({"id": "main_league"})
                if not league_doc:
                    league_doc = {"id": "main_league", "leagueSchedule": []}
                    await db.league_data.insert_one(league_doc)
                
                current_schedule = league_doc.get("leagueSchedule", [])
                
                for instance in instances:
                    schedule_event = {
                        "id": instance["id"],
                        "title": instance.get("title", ""),
                        "type": instance.get("type", "event"),
                        "event_type": instance.get("type", "event"),
                        "date": instance.get("date", ""),
                        "time": instance.get("time", ""),
                        "location": instance.get("location", ""),
                        "description": instance.get("description", ""),
                        "homeTeam": instance.get("teams", [None])[0] if instance.get("teams") else None,
                        "awayTeam": instance.get("teams", [None, None])[1] if len(instance.get("teams", [])) > 1 else None,
                        "teams": instance.get("teams", []),
                        "status": instance.get("status", "scheduled"),
                        "imageUrl": instance.get("imageUrl", ""),
                        "is_external": instance.get("is_external", False),
                        "rsvp_enabled": instance.get("rsvp_enabled", True),
                        "is_recurring_instance": True,
                        "parent_event_id": parent_id,
                        "start_datetime": instance.get("start_datetime"),
                        "created_at": now,
                        "updated_at": now
                    }
                    current_schedule.append(schedule_event)
                
                await db.league_data.update_one(
                    {"id": "main_league"},
                    {"$set": {"leagueSchedule": current_schedule}},
                    upsert=True
                )
                logger.info(f"✅ Recurring events added to leagueSchedule for ticker")
            except Exception as schedule_err:
                logger.warning(f"Failed to add recurring events to leagueSchedule: {schedule_err}")
        
        # Return first instance as the response
        if instances:
            first_instance = instances[0]
            if "_id" in first_instance:
                del first_instance["_id"]
            first_instance["recurring_instances_created"] = len(instances)
            return first_instance
        
        raise HTTPException(status_code=400, detail="No recurring instances could be generated")
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"❌ Error creating recurring events: {e}\n{error_details}")
        raise HTTPException(status_code=500, detail=f"Error creating recurring events: {str(e)}")

@api_router.get("/unified-events/{event_id}")
async def get_unified_event(event_id: str):
    """Get a specific unified event"""
    try:
        event = await db.unified_events.find_one({"id": event_id})
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Remove MongoDB _id field
        if "_id" in event:
            del event["_id"]
            
        return event
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting unified event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/unified-events/{event_id}")
async def update_unified_event(event_id: str, updates: EventUpdate):
    """Update a unified event"""
    try:
        # Check if event exists
        existing_event = await db.unified_events.find_one({"id": event_id})
        if not existing_event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Prepare update data
        update_data = {}
        for field, value in updates.dict().items():
            if value is not None:
                update_data[field] = value
        
        # Add updated timestamp
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Update event in unified_events
        await db.unified_events.update_one(
            {"id": event_id},
            {"$set": update_data}
        )
        
        # Get updated event
        updated_event = await db.unified_events.find_one({"id": event_id})
        
        # ALSO update in leagueSchedule for ticker compatibility
        try:
            league_doc = await db.league_data.find_one({"id": "main_league"})
            if league_doc:
                current_schedule = league_doc.get("leagueSchedule", [])
                for i, evt in enumerate(current_schedule):
                    if evt.get("id") == event_id:
                        # Update relevant fields
                        for key, value in update_data.items():
                            current_schedule[i][key] = value
                        # Update specific ticker fields
                        if "title" in update_data:
                            current_schedule[i]["title"] = update_data["title"]
                        if "date" in update_data:
                            current_schedule[i]["date"] = update_data["date"]
                        if "time" in update_data:
                            current_schedule[i]["time"] = update_data["time"]
                        if "location" in update_data:
                            current_schedule[i]["location"] = update_data["location"]
                        if "teams" in update_data and update_data["teams"]:
                            current_schedule[i]["homeTeam"] = update_data["teams"][0] if len(update_data["teams"]) > 0 else None
                            current_schedule[i]["awayTeam"] = update_data["teams"][1] if len(update_data["teams"]) > 1 else None
                        if "date" in update_data and "time" in update_data:
                            try:
                                current_schedule[i]["start_datetime"] = f"{update_data['date']}T{update_data['time']}:00"
                            except:
                                pass
                        break
                
                await db.league_data.update_one(
                    {"id": "main_league"},
                    {"$set": {"leagueSchedule": current_schedule}}
                )
                logger.info(f"✅ Event also updated in leagueSchedule")
        except Exception as schedule_err:
            logger.warning(f"Failed to update event in leagueSchedule: {schedule_err}")
        
        # Send email notifications if enabled (and email was just enabled in this update)
        if update_data.get("email_notifications", False):
            try:
                logger.info(f"📧 Email notifications enabled for updated event {event_id}, sending...")
                await send_email_event_notifications(event_id, {})
                logger.info(f"✅ Email notifications sent for updated event {event_id}")
            except Exception as e:
                logger.error(f"❌ Failed to send email notifications: {e}")
        
        # Remove MongoDB _id field
        if "_id" in updated_event:
            del updated_event["_id"]
            
        logger.info(f"Updated unified event: {event_id}")
        return updated_event
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating unified event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/unified-events/{event_id}")
async def delete_unified_event(event_id: str):
    """Delete a unified event"""
    try:
        # Check if event exists
        existing_event = await db.unified_events.find_one({"id": event_id})
        if not existing_event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Delete event from unified_events
        await db.unified_events.delete_one({"id": event_id})
        
        # ALSO remove from leagueSchedule for ticker compatibility
        try:
            league_doc = await db.league_data.find_one({"id": "main_league"})
            if league_doc:
                current_schedule = league_doc.get("leagueSchedule", [])
                current_schedule = [evt for evt in current_schedule if evt.get("id") != event_id]
                await db.league_data.update_one(
                    {"id": "main_league"},
                    {"$set": {"leagueSchedule": current_schedule}}
                )
                logger.info(f"✅ Event also removed from leagueSchedule")
        except Exception as schedule_err:
            logger.warning(f"Failed to remove event from leagueSchedule: {schedule_err}")
        
        # Also delete related game stats if they exist
        await db.game_stats.delete_many({"event_id": event_id})
        
        logger.info(f"Deleted unified event: {event_id}")
        return {"message": "Event deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting unified event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# EVENT CHAT AND MEDIA ENDPOINTS
# ============================================================================

# Pydantic models for chat
class ChatMessage(BaseModel):
    message: str
    event_id: str
    timestamp: str
    user_name: Optional[str] = "Anonymous"
    user_id: Optional[str] = None

@api_router.post("/events/{event_id}/chat")
async def post_event_chat_message(event_id: str, chat_message: ChatMessage):
    """Post a chat message for a live event"""
    try:
        message_data = {
            "id": str(uuid.uuid4()),
            "event_id": event_id,
            "user_name": chat_message.user_name,
            "user_id": chat_message.user_id,
            "message": chat_message.message,
            "timestamp": chat_message.timestamp,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Store in database
        await db.event_chat.insert_one(message_data)
        
        logger.info(f"✅ Chat message posted for event {event_id}")
        return {"status": "success", "message_id": message_data["id"]}
        
    except Exception as e:
        logger.error(f"❌ Error posting chat message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/events/{event_id}/chat")
async def get_event_chat_messages(event_id: str, limit: int = 100):
    """Get chat messages for an event"""
    try:
        messages = await db.event_chat.find(
            {"event_id": event_id}
        ).sort("created_at", -1).limit(limit).to_list(length=limit)
        
        # Reverse to get chronological order and remove MongoDB _id
        messages.reverse()
        for msg in messages:
            msg.pop('_id', None)
        
        return {"messages": messages}
        
    except Exception as e:
        logger.error(f"❌ Error fetching chat messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/events/{event_id}/media")
async def upload_event_media(event_id: str, files: List[UploadFile] = File(...)):
    """Upload media (photos/videos) for an event to Google Drive"""
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaIoBaseUpload
        import io
        
        uploaded_files = []
        
        # Get Google Drive credentials from environment
        google_drive_folder_id = os.environ.get('GOOGLE_DRIVE_FOLDER_ID', '')
        
        # For now, we'll store metadata in MongoDB and files can be uploaded to Google Drive
        for file in files:
            file_data = await file.read()
            
            # Store metadata
            media_metadata = {
                "id": str(uuid.uuid4()),
                "event_id": event_id,
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_data),
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
                "url": f"/api/events/{event_id}/media/{file.filename}"  # Placeholder URL
            }
            
            await db.event_media.insert_one(media_metadata)
            uploaded_files.append(media_metadata)
            
            logger.info(f"✅ Media uploaded for event {event_id}: {file.filename}")
        
        return {
            "status": "success",
            "files": uploaded_files,
            "count": len(uploaded_files)
        }
        
    except Exception as e:
        logger.error(f"❌ Error uploading media: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/events/{event_id}/media")
async def get_event_media(event_id: str):
    """Get all media for an event"""
    try:
        media = await db.event_media.find(
            {"event_id": event_id}
        ).sort("uploaded_at", -1).to_list(length=None)
        
        # Remove MongoDB _id
        for item in media:
            item.pop('_id', None)
        
        return {"media": media, "count": len(media)}
        
    except Exception as e:
        logger.error(f"❌ Error fetching event media: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _create_groupme_poll_for_event(event_data):
    """Helper function to create GroupMe polls for events"""
    try:
        # This would integrate with existing GroupMe functionality
        # For now, just log that it would create a poll
        logger.info(f"Would create GroupMe poll for event: {event_data['title']}")
        
        # TODO: Integrate with existing GroupMe poll creation logic
        # poll_data = {
        #     "subject": f"RSVP for {event_data['title']}",
        #     "options": ["Going", "Not Going", "Maybe"],
        #     "expiration": event_data['date']
        # }
        
    except Exception as e:
        logger.error(f"Error creating GroupMe poll: {e}")
        raise


# ============================================================================
# USER MANAGEMENT & REGISTRATION
# ============================================================================

@api_router.post("/users/login")
async def login_user(login_data: LoginRequest):
    """User login endpoint"""
    try:
        import hashlib
        
        # Hash the provided password
        password_hash = hashlib.sha256(login_data.password.encode()).hexdigest()
        
        # Find user by email and password
        user = await db.users.find_one({
            "email": login_data.email,
            "password": password_hash
        }, {"_id": 0, "password": 0})
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if account is active
        if user["status"] not in ["active", "guest"]:
            raise HTTPException(status_code=403, detail=f"Account is {user['status']}. Please contact an administrator.")
        
        logger.info(f"✅ User logged in: {user['email']}")
        
        return {
            "status": "success",
            "user": user,
            "message": "Login successful"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error during login: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/users/{user_id}/reset-password")
async def reset_user_password(user_id: str, data: Dict[str, Any]):
    """Admin endpoint to reset user password"""
    try:
        import hashlib
        
        new_password = data.get("newPassword")
        if not new_password or len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Hash new password
        password_hash = hashlib.sha256(new_password.encode()).hexdigest()
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "password": password_hash,
                "requirePasswordReset": False,
                "passwordResetToken": None,
                "passwordResetExpires": None
            }}
        )
        
        logger.info(f"✅ Password reset for user: {user_id}")
        
        return {"status": "success", "message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error resetting password: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/password-reset/token")
async def reset_password_with_token(data: Dict[str, Any]):
    """Reset password using a token (from welcome email)"""
    try:
        import hashlib
        
        token = data.get("token")
        new_password = data.get("newPassword")
        
        if not token:
            raise HTTPException(status_code=400, detail="Reset token is required")
        if not new_password or len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Find user with this token
        user = await db.users.find_one({"passwordResetToken": token})
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        # Check if token is expired
        expires = user.get("passwordResetExpires")
        if expires:
            expiry_date = datetime.fromisoformat(expires.replace('Z', '+00:00'))
            if datetime.now(timezone.utc) > expiry_date:
                raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")
        
        # Hash new password
        password_hash = hashlib.sha256(new_password.encode()).hexdigest()
        
        # Update user
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {
                "password": password_hash,
                "requirePasswordReset": False,
                "passwordResetToken": None,
                "passwordResetExpires": None,
                "status": "active"
            }}
        )
        
        logger.info(f"✅ Password set via token for user: {user['email']}")
        
        return {"status": "success", "message": "Password set successfully. You can now log in."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error resetting password with token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/password-reset/validate/{token}")
async def validate_reset_token(token: str):
    """Validate a password reset token"""
    try:
        user = await db.users.find_one({"passwordResetToken": token}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        # Check if token is expired
        expires = user.get("passwordResetExpires")
        if expires:
            expiry_date = datetime.fromisoformat(expires.replace('Z', '+00:00'))
            if datetime.now(timezone.utc) > expiry_date:
                raise HTTPException(status_code=400, detail="Reset token has expired")
        
        return {"valid": True, "email": user.get("email"), "name": user.get("name")}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error validating reset token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/password-reset/request")
async def request_password_reset(data: Dict[str, Any]):
    """Request a password reset - sends code via email or SMS"""
    try:
        import hashlib
        import secrets
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        email = data.get("email", "").lower().strip()
        method = data.get("method", "email")  # "email" or "sms"
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Find user by email
        user = await db.users.find_one({"email": email}, {"_id": 0})
        if not user:
            # Don't reveal if email exists or not for security
            return {"status": "success", "message": "If an account exists, a reset code has been sent"}
        
        # Generate 6-digit reset code
        reset_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        reset_token = secrets.token_urlsafe(32)
        
        # Store reset token with expiry (15 minutes)
        await db.password_resets.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "user_id": user.get("id"),
                    "code": reset_code,
                    "token": reset_token,
                    "created_at": datetime.now(timezone.utc),
                    "expires_at": datetime.now(timezone.utc) + timedelta(minutes=15),
                    "used": False
                }
            },
            upsert=True
        )
        
        # Send via chosen method
        if method == "sms" and user.get("phone"):
            # Send via Twilio SMS
            sms_config = await db.sms_config.find_one({})
            if sms_config and sms_config.get("account_sid"):
                try:
                    from twilio.rest import Client
                    client = Client(sms_config['account_sid'], sms_config['auth_token'])
                    
                    message = client.messages.create(
                        body=f"Your MLBL password reset code is: {reset_code}\n\nThis code expires in 15 minutes.",
                        from_=sms_config['phone_number'],
                        to=user['phone']
                    )
                    logger.info(f"✅ Password reset SMS sent to {user['phone']}")
                except Exception as sms_error:
                    logger.error(f"❌ SMS send error: {sms_error}")
                    raise HTTPException(status_code=500, detail="Failed to send SMS. Try email instead.")
            else:
                raise HTTPException(status_code=400, detail="SMS not configured. Please use email.")
        else:
            # Send via email (default)
            league_data = await db.league_data.find_one({"id": "main_league"})
            smtp_config = league_data.get("smtpConfig") if league_data else None
            
            if smtp_config and smtp_config.get("email"):
                try:
                    msg = MIMEMultipart()
                    msg['Subject'] = "MLBL Password Reset Code"
                    msg['From'] = f"{smtp_config.get('sender_name', 'MLBL')} <{smtp_config['email']}>"
                    msg['To'] = email
                    
                    body = f"""
Hello {user.get('name', 'there')},

You requested a password reset for your MLBL account.

Your reset code is: {reset_code}

This code expires in 15 minutes.

If you didn't request this, please ignore this email.

- The MLBL Team
                    """
                    msg.attach(MIMEText(body, 'plain'))
                    
                    with smtplib.SMTP(smtp_config['host'], smtp_config.get('port', 587)) as server:
                        server.starttls()
                        server.login(smtp_config['email'], smtp_config['password'])
                        server.send_message(msg)
                    
                    logger.info(f"✅ Password reset email sent to {email}")
                except Exception as email_error:
                    logger.error(f"❌ Email send error: {email_error}")
                    raise HTTPException(status_code=500, detail="Failed to send email")
            else:
                raise HTTPException(status_code=500, detail="Email not configured")
        
        return {"status": "success", "message": "Reset code sent", "token": reset_token}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error requesting password reset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/password-reset/verify")
async def verify_reset_code(data: Dict[str, Any]):
    """Verify the reset code"""
    try:
        token = data.get("token")
        code = data.get("code")
        
        if not token or not code:
            raise HTTPException(status_code=400, detail="Token and code are required")
        
        # Find reset request
        reset_request = await db.password_resets.find_one({
            "token": token,
            "code": code,
            "used": False
        }, {"_id": 0})
        
        if not reset_request:
            raise HTTPException(status_code=400, detail="Invalid or expired code")
        
        # Check expiry
        expires_at = reset_request.get("expires_at")
        if expires_at and datetime.now(timezone.utc) > expires_at.replace(tzinfo=timezone.utc):
            raise HTTPException(status_code=400, detail="Code has expired")
        
        return {"status": "success", "message": "Code verified", "user_id": reset_request.get("user_id")}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error verifying reset code: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/password-reset/complete")
async def complete_password_reset(data: Dict[str, Any]):
    """Complete password reset with new password"""
    try:
        import hashlib
        
        token = data.get("token")
        code = data.get("code")
        new_password = data.get("newPassword")
        
        if not token or not code or not new_password:
            raise HTTPException(status_code=400, detail="Token, code, and new password are required")
        
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Find and validate reset request
        reset_request = await db.password_resets.find_one({
            "token": token,
            "code": code,
            "used": False
        }, {"_id": 0})
        
        if not reset_request:
            raise HTTPException(status_code=400, detail="Invalid or expired reset request")
        
        # Check expiry
        expires_at = reset_request.get("expires_at")
        if expires_at and datetime.now(timezone.utc) > expires_at.replace(tzinfo=timezone.utc):
            raise HTTPException(status_code=400, detail="Reset code has expired")
        
        # Hash new password
        password_hash = hashlib.sha256(new_password.encode()).hexdigest()
        
        # Update user password
        result = await db.users.update_one(
            {"id": reset_request["user_id"]},
            {"$set": {"password": password_hash}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Mark reset request as used
        await db.password_resets.update_one(
            {"token": token},
            {"$set": {"used": True}}
        )
        
        logger.info(f"✅ Password reset completed for user: {reset_request['user_id']}")
        
        return {"status": "success", "message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error completing password reset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/users/register")
async def register_user(user_data: UserRegistration):
    """Public user registration endpoint"""
    try:
        import hashlib
        
        # Check if email already exists
        existing = await db.users.find_one({"email": user_data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password (simple hash for now - should use bcrypt in production)
        password_hash = hashlib.sha256(user_data.password.encode()).hexdigest()
        
        # Determine status based on requested role
        if user_data.requestedRole == "guest":
            status = "guest"
            role = "guest"
            approved_at = datetime.now(timezone.utc).isoformat()
        else:
            status = "pending"
            role = "guest"  # Stays guest until approved
            approved_at = None
        
        # Get team name if team selected
        team_name = None
        if user_data.requestedTeam:
            team = await db.teams.find_one({"id": user_data.requestedTeam}, {"_id": 0})
            team_name = team.get("name") if team else None
        
        # Create user
        user = {
            "id": str(uuid.uuid4()),
            "name": user_data.name,
            "email": user_data.email,
            "password": password_hash,
            "role": role,
            "teamId": user_data.requestedTeam if status != "pending" else None,
            "teamName": team_name if status != "pending" else None,
            "status": status,
            "requestedRole": user_data.requestedRole,
            "requestedTeam": user_data.requestedTeam,
            "phone": user_data.phone or "",
            "notificationPreferences": {
                "email": True,
                "sms": False,
                "groupme": True
            },
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "approvedAt": approved_at,
            "approvedBy": None
        }
        
        await db.users.insert_one(user)
        
        # Remove password from response
        user.pop("password")
        user.pop("_id", None)
        
        logger.info(f"✅ User registered: {user['email']} as {status}")
        
        return {
            "status": "success",
            "user": user,
            "message": "Guest account created" if status == "guest" else "Registration submitted for approval"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error registering user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/users")
async def get_users(status: str = None, role: str = None, teamId: str = None):
    """Get all users with optional filters"""
    try:
        query = {}
        if status:
            query["status"] = status
        if role:
            query["role"] = role
        if teamId:
            query["teamId"] = teamId
        
        users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
        
        return {"users": users, "count": len(users)}
        
    except Exception as e:
        logger.error(f"❌ Error getting users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/users/{user_id}/approve")
async def approve_user(user_id: str, approval_data: Dict[str, Any]):
    """Approve a pending user"""
    try:
        approved_role = approval_data.get("role")
        team_id = approval_data.get("teamId")
        approved_by = approval_data.get("approvedBy", "admin")
        
        # Get team name
        team_name = None
        if team_id:
            team = await db.teams.find_one({"id": team_id}, {"_id": 0})
            team_name = team.get("name") if team else None
        
        # Update user
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "status": "active",
                "role": approved_role,
                "teamId": team_id,
                "teamName": team_name,
                "approvedAt": datetime.now(timezone.utc).isoformat(),
                "approvedBy": approved_by
            }}
        )
        
        logger.info(f"✅ User approved: {user_id} as {approved_role}")
        
        return {"status": "success", "message": "User approved"}
        
    except Exception as e:
        logger.error(f"❌ Error approving user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/users/{user_id}/reject")
async def reject_user(user_id: str):
    """Reject a pending user"""
    try:
        await db.users.delete_one({"id": user_id})
        
        logger.info(f"✅ User rejected: {user_id}")
        
        return {"status": "success", "message": "User rejected"}
        
    except Exception as e:
        logger.error(f"❌ Error rejecting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/users/{user_id}")
async def update_user(user_id: str, updates: UserUpdate):
    """Update user details"""
    try:
        update_data = {}
        for field, value in updates.dict().items():
            if value is not None:
                update_data[field] = value
        
        # Handle multi-roles - sync with legacy role field
        if "roles" in update_data and update_data["roles"]:
            roles = update_data["roles"]
            # Set primary role for legacy compatibility (use highest privilege)
            role_priority = {"admin": 4, "coach": 3, "player": 2, "guest": 1}
            primary_role = max(roles, key=lambda r: role_priority.get(r, 0))
            update_data["role"] = primary_role
        
        # Handle teamAssignments - sync with legacy teamId field
        if "teamAssignments" in update_data and update_data["teamAssignments"]:
            assignments = update_data["teamAssignments"]
            # Find primary team or use first assignment
            primary = next((a for a in assignments if a.get("isPrimary")), assignments[0] if assignments else None)
            if primary:
                update_data["teamId"] = primary.get("teamId")
                update_data["playerNumber"] = primary.get("playerNumber")
                update_data["position"] = primary.get("position")
                # Get team name
                team = await db.teams.find_one({"id": primary.get("teamId")}, {"_id": 0})
                update_data["teamName"] = team.get("name") if team else None
        # Get team name if legacy teamId is being updated
        elif "teamId" in update_data and update_data["teamId"]:
            team = await db.teams.find_one({"id": update_data["teamId"]}, {"_id": 0})
            update_data["teamName"] = team.get("name") if team else None
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        
        logger.info(f"✅ User updated: {user_id}")
        
        return {"status": "success", "message": "User updated"}
        
    except Exception as e:
        logger.error(f"❌ Error updating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/users/{user_id}/default-landing-page")
async def set_default_landing_page(user_id: str, landing_page: Dict[str, Any]):
    """Set user's default landing page preference"""
    try:
        # Validate the landing page structure
        page_type = landing_page.get("type")
        if page_type not in ["team", "page"]:
            raise HTTPException(status_code=400, detail="Invalid landing page type. Must be 'team' or 'page'")
        
        if page_type == "team":
            if not landing_page.get("teamId"):
                raise HTTPException(status_code=400, detail="teamId is required for team landing page")
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"defaultLandingPage": landing_page}}
        )
        
        # Return updated user
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        logger.info(f"✅ Default landing page set for user {user_id}: {landing_page}")
        
        return {"status": "success", "message": "Default landing page updated", "user": user}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error setting default landing page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Delete a user"""
    try:
        await db.users.delete_one({"id": user_id})
        
        logger.info(f"✅ User deleted: {user_id}")
        
        return {"status": "success", "message": "User deleted"}
        
    except Exception as e:
        logger.error(f"❌ Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/users/create")
@api_router.post("/users/admin-create")
async def create_user_admin(user_data: Dict[str, Any]):
    """Admin endpoint to create users directly"""
    try:
        import hashlib
        
        # Check if email exists
        existing = await db.users.find_one({"email": user_data["email"]})
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        # Hash password
        password_hash = hashlib.sha256(user_data["password"].encode()).hexdigest()
        
        # Get team name - support both legacy teamId and new teamAssignments
        team_name = None
        team_id = user_data.get("teamId")
        team_assignments = user_data.get("teamAssignments", [])
        
        # If teamAssignments provided, extract primary team info
        if team_assignments:
            primary = next((a for a in team_assignments if a.get("isPrimary")), team_assignments[0] if team_assignments else None)
            if primary:
                team_id = primary.get("teamId")
        
        if team_id:
            team = await db.teams.find_one({"id": team_id}, {"_id": 0})
            team_name = team.get("name") if team else None
        
        # Handle multi-roles
        roles = user_data.get("roles", [])
        primary_role = user_data.get("role", "player")
        if roles:
            # Set primary role for legacy compatibility (use highest privilege)
            role_priority = {"admin": 4, "coach": 3, "player": 2, "guest": 1}
            primary_role = max(roles, key=lambda r: role_priority.get(r, 0))
        elif primary_role:
            roles = [primary_role]
        
        # Generate password reset token if required
        password_reset_token = None
        password_reset_expires = None
        if user_data.get("requirePasswordReset"):
            password_reset_token = str(uuid.uuid4())
            password_reset_expires = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        
        user = {
            "id": str(uuid.uuid4()),
            "name": user_data["name"],
            "email": user_data["email"],
            "password": password_hash,
            "role": primary_role,
            "roles": roles,
            "teamId": team_id,
            "teamName": team_name,
            "teamAssignments": team_assignments,
            "status": "active",
            "phone": user_data.get("phone", ""),
            "playerNumber": user_data.get("playerNumber", ""),
            "position": user_data.get("position", ""),
            "jerseySize": user_data.get("jerseySize", ""),
            "emergencyContact": user_data.get("emergencyContact", ""),
            "notificationPreferences": user_data.get("notificationPreferences", {
                "email": True,
                "sms": False,
                "groupme": True
            }),
            # New enhanced profile fields
            "photoUrl": user_data.get("photoUrl"),
            "lacrosseHistory": user_data.get("lacrosseHistory"),
            "funFacts": user_data.get("funFacts"),
            "socialMedia": user_data.get("socialMedia"),
            # Password reset fields
            "requirePasswordReset": user_data.get("requirePasswordReset", False),
            "passwordResetToken": password_reset_token,
            "passwordResetExpires": password_reset_expires,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "approvedAt": datetime.now(timezone.utc).isoformat(),
            "approvedBy": user_data.get("createdBy", "admin")
        }
        
        await db.users.insert_one(user)
        
        # Send welcome email if requested
        if user_data.get("sendWelcomeEmail") and password_reset_token:
            try:
                await send_welcome_email(user, password_reset_token)
            except Exception as email_error:
                logger.error(f"❌ Failed to send welcome email: {email_error}")
        
        user.pop("password")
        user.pop("_id", None)
        
        logger.info(f"✅ Admin created user: {user['email']}")
        
        return {"status": "success", "user": user}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def send_welcome_email(user: dict, reset_token: str):
    """Send welcome email with password reset link"""
    try:
        league_data = await db.league_data.find_one({}, {"_id": 0}) or {}
        smtp_config = league_data.get("smtpConfig", {})
        
        if not smtp_config.get("email") or not smtp_config.get("password"):
            logger.warning("SMTP not configured, skipping welcome email")
            return
        
        # Get the production domain for the reset link
        production_domain = league_data.get("productionDomain", "mlbl.org")
        reset_link = f"https://{production_domain}/reset-password?token={reset_token}"
        
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Welcome to {league_data.get('leagueName', 'the League')}!"
        msg['From'] = smtp_config['email']
        msg['To'] = user['email']
        
        text_body = f"""
Welcome to {league_data.get('leagueName', 'the League')}, {user['name']}!

Your account has been created. To get started, please set your password by clicking the link below:

{reset_link}

This link will expire in 7 days.

If you didn't request this account, please ignore this email.

Best regards,
{league_data.get('leagueName', 'League')} Team
        """
        
        html_body = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Welcome to {league_data.get('leagueName', 'the League')}!</h2>
    <p>Hi {user['name']},</p>
    <p>Your account has been created. To get started, please set your password:</p>
    <p style="text-align: center; margin: 30px 0;">
        <a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Set Your Password
        </a>
    </p>
    <p style="color: #6b7280; font-size: 14px;">This link will expire in 7 days.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 12px;">
        If you didn't request this account, please ignore this email.
    </p>
</div>
        """
        
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        with smtplib.SMTP(smtp_config['host'], smtp_config.get('port', 587)) as server:
            server.starttls()
            server.login(smtp_config['email'], smtp_config['password'])
            server.send_message(msg)
        
        logger.info(f"✅ Welcome email sent to {user['email']}")
        
    except Exception as e:
        logger.error(f"❌ Error sending welcome email: {e}")
        raise



# ============================================================================
# TEAM COACHES API
# ============================================================================

@api_router.get("/teams/{team_id}/coaches")
async def get_team_coaches(team_id: str):
    """Get all coaches for a specific team"""
    try:
        # Find users who are coaches for this team
        # Check both teamAssignments and legacy teamId field
        coaches = await db.users.find({
            "$or": [
                # New format: check teamAssignments array
                {"teamAssignments.teamId": team_id, "roles": "coach"},
                # Legacy format: check teamId field
                {"teamId": team_id, "roles": "coach"},
                {"teamId": team_id, "role": "coach"},
            ]
        }, {"_id": 0, "password": 0}).to_list(500)
        
        logger.info(f"📋 Found {len(coaches)} coaches for team {team_id}")
        
        return {"coaches": coaches, "team_id": team_id}
        
    except Exception as e:
        logger.error(f"Error getting team coaches: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/coaches")
async def get_all_coaches():
    """Get all coaches in the system"""
    try:
        coaches = await db.users.find({
            "$or": [
                {"roles": "coach"},
                {"role": "coach"}
            ]
        }, {"_id": 0, "password": 0}).to_list(500)
        
        # Group coaches by team
        coaches_by_team = {}
        for coach in coaches:
            # Check teamAssignments first
            team_assignments = coach.get("teamAssignments", [])
            if team_assignments:
                for assignment in team_assignments:
                    team_id = assignment.get("teamId")
                    if team_id:
                        if team_id not in coaches_by_team:
                            coaches_by_team[team_id] = []
                        coaches_by_team[team_id].append(coach)
            # Fall back to legacy teamId
            elif coach.get("teamId"):
                team_id = coach["teamId"]
                if team_id not in coaches_by_team:
                    coaches_by_team[team_id] = []
                coaches_by_team[team_id].append(coach)
        
        logger.info(f"📋 Found {len(coaches)} total coaches across {len(coaches_by_team)} teams")
        
        return {
            "coaches": coaches,
            "coaches_by_team": coaches_by_team,
            "total_coaches": len(coaches)
        }
        
    except Exception as e:
        logger.error(f"Error getting coaches: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/events/{event_id}/notify-coaches")
async def notify_event_coaches(event_id: str, notification: dict):
    """Send notifications to coaches of teams participating in an event"""
    try:
        # Get the event
        event = await db.unified_events.find_one({"id": event_id})
        if not event:
            # Try legacy events
            league_data = await db.league_data.find_one({"id": "main_league"})
            if league_data:
                event = next((e for e in league_data.get("leagueSchedule", []) if e.get("id") == event_id), None)
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Get teams from event
        team_ids = event.get("teams", [])
        if event.get("homeTeam"):
            team_ids.append(event["homeTeam"])
        if event.get("awayTeam"):
            team_ids.append(event["awayTeam"])
        
        # Handle team objects vs strings
        team_ids = [t if isinstance(t, str) else t.get("id") for t in team_ids]
        team_ids = list(set(filter(None, team_ids)))  # Unique, non-null
        
        if not team_ids:
            return {"success": False, "message": "No teams assigned to this event"}
        
        # Get coaches for these teams
        coaches = await db.users.find({
            "$or": [
                {"teamAssignments.teamId": {"$in": team_ids}, "roles": "coach"},
                {"teamId": {"$in": team_ids}, "roles": "coach"},
                {"teamId": {"$in": team_ids}, "role": "coach"},
            ]
        }, {"_id": 0, "password": 0}).to_list(500)
        
        if not coaches:
            return {"success": False, "message": "No coaches found for the event teams"}
        
        # Prepare notification data
        message = notification.get("message", f"Event notification for: {event.get('title', 'Upcoming Event')}")
        subject = notification.get("subject", f"Event Update: {event.get('title', 'League Event')}")
        include_rsvp = notification.get("include_rsvp", True)
        
        results = {
            "email_sent": 0,
            "sms_sent": 0,
            "failed": 0,
            "coaches_notified": []
        }
        
        # Send notifications based on coach preferences
        for coach in coaches:
            coach_name = f"{coach.get('firstName', '')} {coach.get('lastName', '')}".strip() or coach.get('email', 'Unknown')
            prefs = coach.get("notificationPreferences", {"email": True})
            
            # Email notification
            if prefs.get("email", True) and coach.get("email"):
                try:
                    # Get SMTP config
                    league_data = await db.league_data.find_one({"id": "main_league"})
                    smtp_config = league_data.get("smtpConfig") if league_data else None
                    
                    if smtp_config and smtp_config.get("email"):
                        import smtplib
                        from email.mime.text import MIMEText
                        from email.mime.multipart import MIMEMultipart
                        
                        msg = MIMEMultipart()
                        msg['From'] = f"{smtp_config.get('sender_name', 'League')} <{smtp_config['email']}>"
                        msg['To'] = coach['email']
                        msg['Subject'] = subject
                        
                        # Build email body
                        body = f"""
Hi {coach.get('firstName', 'Coach')},

{message}

Event Details:
- Title: {event.get('title', 'N/A')}
- Date: {event.get('date', 'TBD')}
- Time: {event.get('time', 'TBD')}
- Location: {event.get('location', 'TBD')}
"""
                        if include_rsvp:
                            rsvp_url = f"{notification.get('base_url', '')}/rsvp/{event_id}"
                            body += f"\nRSVP Link: {rsvp_url}\n"
                        
                        msg.attach(MIMEText(body, 'plain'))
                        
                        with smtplib.SMTP(smtp_config['host'], smtp_config.get('port', 587)) as server:
                            server.starttls()
                            server.login(smtp_config['email'], smtp_config['password'])
                            server.send_message(msg)
                        
                        results["email_sent"] += 1
                        results["coaches_notified"].append({
                            "name": coach_name,
                            "email": coach['email'],
                            "method": "email"
                        })
                except Exception as e:
                    logger.error(f"Failed to send email to {coach.get('email')}: {e}")
                    results["failed"] += 1
            
            # SMS notification (if Twilio configured and coach has phone)
            if prefs.get("sms", False) and coach.get("phone"):
                try:
                    sms_config = await db.sms_configs.find_one({})
                    if sms_config:
                        from twilio.rest import Client
                        client = Client(sms_config['account_sid'], sms_config['auth_token'])
                        
                        sms_body = f"{subject}\n\n{message[:100]}..."
                        if include_rsvp:
                            sms_body += f"\nRSVP: {notification.get('base_url', '')}/rsvp/{event_id}"
                        
                        client.messages.create(
                            body=sms_body[:160],  # SMS character limit
                            from_=sms_config['phone_number'],
                            to=coach['phone']
                        )
                        
                        results["sms_sent"] += 1
                        results["coaches_notified"].append({
                            "name": coach_name,
                            "phone": coach['phone'],
                            "method": "sms"
                        })
                except Exception as e:
                    logger.error(f"Failed to send SMS to {coach.get('phone')}: {e}")
                    results["failed"] += 1
        
        logger.info(f"📧 Coach notifications sent for event {event_id}: {results}")
        
        return {
            "success": True,
            "event_id": event_id,
            "event_title": event.get("title"),
            "team_ids": team_ids,
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error notifying coaches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================

# ==================== SMTP ROUTES EXTRACTED TO routes/communication.py ====================

@api_router.post("/events/{event_id}/send-email-notifications")
async def send_email_event_notifications(event_id: str, options: Dict[str, Any] = None):
    """Send event notifications via SMTP email"""
    try:
        options = options or {}
        
        # Get event
        event = await db.unified_events.find_one({"id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Get SMTP config
        league_data = await db.league_data.find_one({"id": "main_league"})
        if not league_data or not league_data.get("smtpConfig"):
            raise HTTPException(status_code=400, detail="SMTP not configured")
        
        smtp_config = league_data["smtpConfig"]
        
        # Get user emails based on event teams
        user_emails = []
        
        if event.get("teams"):
            # Get all active users from the teams in this event
            users_cursor = db.users.find({
                "teamId": {"$in": event["teams"]},
                "status": {"$in": ["active", "guest"]},
                "notificationPreferences.email": True
            }, {"_id": 0})
            
            users = await users_cursor.to_list(1000)
            user_emails = [u["email"] for u in users if u.get("email")]
            
            logger.info(f"📧 Found {len(user_emails)} users to notify for teams: {event['teams']}")
        
        # If no users found from teams, try getting all active users (for league-wide events)
        if not user_emails and not event.get("teams"):
            users_cursor = db.users.find({
                "status": {"$in": ["active", "guest"]},
                "notificationPreferences.email": True
            }, {"_id": 0})
            
            users = await users_cursor.to_list(1000)
            user_emails = [u["email"] for u in users if u.get("email")]
            logger.info(f"📧 League-wide event - found {len(user_emails)} users to notify")
        
        # Add additional emails if provided
        if options.get("additional_emails"):
            user_emails.extend(options["additional_emails"])
        
        user_emails = list(set(user_emails))  # Deduplicate
        
        if not user_emails:
            logger.warning(f"⚠️ No email addresses found for event {event_id}")
            return {
                "status": "no_recipients",
                "message": "No email addresses found for this event. Make sure users are assigned to the event's teams."
            }
        
        # Get team logos
        team_logos = []
        if event.get("teams"):
            for team_id in event["teams"][:2]:
                team = await db.teams.find_one({"id": team_id}, {"_id": 0})
                if team and team.get("style", {}).get("logoUrl"):
                    team_logos.append(team["style"]["logoUrl"])
        
        # Generate calendar file
        from services.smtp_email_service import SMTPEmailService
        calendar_content = SMTPEmailService.generate_ics_calendar_event(
            event_title=event["title"],
            event_date=event["date"],
            event_time=event["time"],
            event_location=event.get("location", ""),
            event_description=event.get("description", ""),
            duration_hours=2,
            organizer_email=smtp_config["email"]
        )
        
        # Build RSVP link
        frontend_url = os.environ.get('FRONTEND_URL', 'https://team-lax-portal.emergent.host')
        rsvp_link = f"{frontend_url}/#/events/{event_id}"
        
        # Send emails
        smtp_service = SMTPEmailService(smtp_config)
        result = smtp_service.send_event_notification(
            to_emails=user_emails,
            event_title=event["title"],
            event_date=event["date"],
            event_time=event["time"],
            event_location=event.get("location", ""),
            event_description=event.get("description", ""),
            rsvp_link=rsvp_link,
            team_logos=team_logos,
            calendar_event=calendar_content,
            event_image_url=event.get("imageUrl", "")
        )
        
        logger.info(f"✅ Email notifications sent for event {event_id} - {result['sent_count']} sent, {result['failed_count']} failed")
        
        return {
            "status": "success",
            "event_id": event_id,
            "recipients_count": len(user_emails),
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sending email notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GOOGLE CREDENTIALS SETUP
# ============================================================================

@api_router.get("/google-credentials/status")
async def get_google_credentials_status():
    """Check if Google credentials are configured"""
    try:
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        if not league_data or not league_data.get("googleDrive"):
            return {"configured": False}
        
        google_config = league_data.get("googleDrive", {})
        
        return {
            "configured": True,
            "clientId": google_config.get("clientId", ""),
            "folderId": google_config.get("folderId", ""),
            "hasRefreshToken": bool(google_config.get("refreshToken"))
        }
        
    except Exception as e:
        logger.error(f"❌ Error checking credentials status: {e}")
        return {"configured": False}


@api_router.post("/google-credentials/save")
async def save_google_credentials(credentials: Dict[str, Any]):
    """Save Google OAuth credentials"""
    try:
        client_id = credentials.get("clientId", "").strip()
        client_secret = credentials.get("clientSecret", "").strip()
        refresh_token = credentials.get("refreshToken", "").strip()
        folder_id = credentials.get("folderId", "").strip()
        
        if not client_id or not client_secret:
            raise HTTPException(status_code=400, detail="Client ID and Client Secret are required")
        
        # Get or create league data
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        update_data = {
            "googleDrive.clientId": client_id,
            "googleDrive.clientSecret": client_secret,
            "googleDrive.folderId": folder_id,
            "googleDrive.configuredAt": datetime.now(timezone.utc).isoformat()
        }
        
        # Add refresh token if provided
        if refresh_token:
            update_data["googleDrive.refreshToken"] = refresh_token
            logger.info(f"✅ Refresh token provided - Google fully configured!")
        
        if not league_data:
            # Create new league data
            league_data = {
                "id": "main_league",
                "googleDrive": {
                    "clientId": client_id,
                    "clientSecret": client_secret,
                    "folderId": folder_id,
                    "configuredAt": datetime.now(timezone.utc).isoformat()
                }
            }
            if refresh_token:
                league_data["googleDrive"]["refreshToken"] = refresh_token
            
            await db.league_data.insert_one(league_data)
        else:
            # Update existing
            await db.league_data.update_one(
                {"id": "main_league"},
                {"$set": update_data}
            )
        
        logger.info(f"✅ Google credentials saved successfully")
        
        message = "Credentials saved."
        if refresh_token:
            message += " Google is now fully configured!"
        else:
            message += " Use OAuth Playground to get refresh token."
        
        return {
            "status": "success",
            "message": message,
            "hasRefreshToken": bool(refresh_token)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error saving credentials: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GOOGLE RE-AUTHORIZATION
# ============================================================================

@api_router.get("/google-reauth/status")
async def get_google_reauth_status():
    """Check if Google needs re-authorization for new scopes"""
    try:
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        if not league_data:
            return {"status": "not_configured", "config": None}
        
        google_config = league_data.get("googleDrive", {})
        
        # Check if credentials exist
        has_client_id = bool(google_config.get("clientId"))
        has_refresh_token = bool(google_config.get("refreshToken"))
        
        if not has_client_id:
            return {"status": "not_configured", "config": None}
        
        # If we have credentials but no refresh token, need to authorize
        if has_client_id and not has_refresh_token:
            return {
                "status": "needs_reauth",
                "config": {
                    "clientId": google_config.get("clientId", ""),
                    "hasRefreshToken": False
                }
            }
        
        # If we have refresh token, check if communication settings indicate it's being used
        comm_settings = league_data.get("communicationSettings", {})
        
        # If either Calendar or Gmail is enabled, assume it's been authorized properly
        if comm_settings.get("useGoogleCalendar") or comm_settings.get("useGmail"):
            status = "ready"
        else:
            # Has token but services not enabled yet - still ready
            status = "ready"
        
        return {
            "status": status,
            "config": {
                "clientId": google_config.get("clientId", ""),
                "hasRefreshToken": True
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error checking reauth status: {e}")
        return {"status": "error", "config": None}


@api_router.get("/google-reauth/start")
async def start_google_reauthorization():
    """Generate OAuth URL for re-authorization with new scopes"""
    try:
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        if not league_data:
            raise HTTPException(status_code=404, detail="League data not found")
        
        google_config = league_data.get("googleDrive", {})
        client_id = google_config.get("clientId")
        
        if not client_id:
            raise HTTPException(status_code=400, detail="Google client ID not configured")
        
        # Get the backend URL for redirect
        backend_url = os.environ.get('BACKEND_URL', 'http://localhost:8001')
        redirect_uri = f"{backend_url}/api/google-reauth/callback"
        
        # Build authorization URL with all required scopes
        scopes = [
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/gmail.send"
        ]
        
        scope_string = " ".join(scopes)
        
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={scope_string}&"
            f"access_type=offline&"
            f"prompt=consent"  # Force consent to get new refresh token
        )
        
        logger.info(f"✅ Generated OAuth URL for re-authorization")
        
        return {"auth_url": auth_url}
        
    except Exception as e:
        logger.error(f"❌ Error generating auth URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/google-reauth/callback")
async def google_reauth_callback(code: str = None, error: str = None):
    """Handle OAuth callback and exchange code for tokens"""
    try:
        if error:
            logger.error(f"❌ OAuth error: {error}")
            return HTMLResponse(f"""
                <html>
                    <body style="font-family: Arial; padding: 50px; text-align: center;">
                        <h2>❌ Authorization Failed</h2>
                        <p>Error: {error}</p>
                        <p>You can close this window and try again.</p>
                    </body>
                </html>
            """)
        
        if not code:
            raise HTTPException(status_code=400, detail="No authorization code received")
        
        # Get Google credentials
        league_data = await db.league_data.find_one({"id": "main_league"})
        google_config = league_data.get("googleDrive", {})
        
        client_id = google_config.get("clientId")
        client_secret = google_config.get("clientSecret")
        backend_url = os.environ.get('BACKEND_URL', 'http://localhost:8001')
        redirect_uri = f"{backend_url}/api/google-reauth/callback"
        
        # Exchange code for tokens
        token_data = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://oauth2.googleapis.com/token',
                data=token_data,
                timeout=15
            )
            
            if response.status_code != 200:
                error_data = response.json()
                logger.error(f"❌ Token exchange failed: {error_data}")
                raise HTTPException(status_code=400, detail=f"Token exchange failed: {error_data}")
            
            tokens = response.json()
            refresh_token = tokens.get('refresh_token')
            access_token = tokens.get('access_token')
            
            if not refresh_token:
                # Sometimes Google doesn't return a new refresh token
                # In that case, we keep the old one but update the access token
                logger.warning("⚠️ No new refresh token received, keeping existing one")
                refresh_token = google_config.get("refreshToken")
            
            # Update the refresh token in database
            await db.league_data.update_one(
                {"id": "main_league"},
                {"$set": {
                    "googleDrive.refreshToken": refresh_token,
                    "googleDrive.lastAuthorized": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            logger.info(f"✅ Successfully re-authorized Google with new scopes")
            
            return HTMLResponse("""
                <html>
                    <body style="font-family: Arial; padding: 50px; text-align: center;">
                        <h2 style="color: green;">✅ Authorization Successful!</h2>
                        <p>Google Calendar and Gmail are now authorized.</p>
                        <p>You can close this window and return to the admin page.</p>
                        <script>
                            setTimeout(function() {
                                window.close();
                            }, 3000);
                        </script>
                    </body>
                </html>
            """)
        
    except Exception as e:
        logger.error(f"❌ Error in OAuth callback: {e}")
        return HTMLResponse(f"""
            <html>
                <body style="font-family: Arial; padding: 50px; text-align: center;">
                    <h2>❌ Error</h2>
                    <p>{str(e)}</p>
                    <p>You can close this window and try again.</p>
                </body>
            </html>
        """)


# ============================================================================
# GOOGLE CALENDAR & GMAIL INTEGRATION
# ============================================================================

@api_router.get("/google-communication/status")
async def get_google_communication_status():
    """Check if Google communication is configured"""
    try:
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        if not league_data:
            return {"configured": False, "services": {"calendar": False, "gmail": False}}
        
        google_config = league_data.get("googleDrive", {})
        has_credentials = bool(google_config.get("refreshToken"))
        
        # Check communication preferences
        comm_settings = league_data.get("communicationSettings", {})
        
        return {
            "configured": has_credentials,
            "services": {
                "calendar": comm_settings.get("useGoogleCalendar", False),
                "gmail": comm_settings.get("useGmail", False),
                "groupme": comm_settings.get("useGroupMe", True)
            },
            "sender_email": comm_settings.get("senderEmail", "admin@mlbl.org")
        }
        
    except Exception as e:
        logger.error(f"❌ Error checking Google status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/google-communication/settings")
async def update_google_communication_settings(settings: Dict[str, Any]):
    """Update Google communication settings"""
    try:
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        if not league_data:
            raise HTTPException(status_code=404, detail="League data not found")
        
        # Update communication settings
        await db.league_data.update_one(
            {"id": "main_league"},
            {"$set": {"communicationSettings": settings}}
        )
        
        logger.info(f"✅ Updated Google communication settings")
        
        return {"status": "success", "settings": settings}
        
    except Exception as e:
        logger.error(f"❌ Error updating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/events/{event_id}/send-google-notifications")
async def send_google_event_notifications(event_id: str, options: Dict[str, Any] = None):
    """Send event notifications via Google Calendar and/or Gmail"""
    try:
        options = options or {}
        
        # Get event details
        event = await db.unified_events.find_one({"id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Get Google credentials and settings
        league_data = await db.league_data.find_one({"id": "main_league"})
        if not league_data:
            raise HTTPException(status_code=404, detail="League data not found")
        
        google_config = league_data.get("googleDrive", {})
        if not google_config.get("refreshToken"):
            raise HTTPException(status_code=400, detail="Google not configured")
        
        comm_settings = league_data.get("communicationSettings", {})
        
        # Get user emails (from teams in event)
        user_emails = []
        if event.get("teams"):
            # Get emails from team rosters
            for team_id in event["teams"]:
                team_data = await db.teams.find_one({"id": team_id}, {"_id": 0})
                if team_data and team_data.get("players"):
                    for player in team_data["players"]:
                        if player.get("email"):
                            user_emails.append(player["email"])
        
        # Add any manually specified emails
        if options.get("additional_emails"):
            user_emails.extend(options["additional_emails"])
        
        user_emails = list(set(user_emails))  # Deduplicate
        
        if not user_emails:
            logger.warning(f"⚠️ No email addresses found for event {event_id}")
            return {
                "status": "no_recipients",
                "message": "No email addresses found for this event"
            }
        
        results = {}
        
        # Send Google Calendar invite
        if comm_settings.get("useGoogleCalendar", False):
            try:
                from services.google_calendar_service import GoogleCalendarService
                
                calendar_service = GoogleCalendarService(google_config)
                
                # Calculate end time (add 2 hours to start)
                start_datetime = f"{event['date']}T{event['time']}:00"
                from datetime import datetime, timedelta
                start = datetime.fromisoformat(start_datetime)
                end = start + timedelta(hours=2)
                end_datetime = end.isoformat()
                
                # Create calendar event
                calendar_result = await calendar_service.create_event(
                    title=event["title"],
                    description=event.get("description", ""),
                    start_datetime=start_datetime,
                    end_datetime=end_datetime,
                    location=event.get("location", ""),
                    attendees=user_emails,
                    timezone="America/New_York"
                )
                
                # Save Google event ID to database
                await db.unified_events.update_one(
                    {"id": event_id},
                    {"$set": {"google_event_id": calendar_result["google_event_id"]}}
                )
                
                results["calendar"] = calendar_result
                logger.info(f"✅ Calendar invite sent for event {event_id}")
                
            except Exception as e:
                logger.error(f"❌ Calendar error: {e}")
                results["calendar"] = {"status": "error", "error": str(e)}
        
        # Send Gmail notification
        if comm_settings.get("useGmail", False):
            try:
                from services.gmail_service import GmailService
                
                sender_email = comm_settings.get("senderEmail", "admin@mlbl.org")
                gmail_service = GmailService(google_config, sender_email)
                
                # Get team logos
                team_logos = []
                if event.get("teams"):
                    for team_id in event["teams"][:2]:  # Max 2 logos
                        team = await db.teams.find_one({"id": team_id}, {"_id": 0})
                        if team and team.get("style", {}).get("logoUrl"):
                            team_logos.append(team["style"]["logoUrl"])
                
                # Build RSVP link
                frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
                rsvp_link = f"{frontend_url}/events/{event_id}"
                
                gmail_result = await gmail_service.send_event_notification(
                    to_emails=user_emails,
                    event_title=event["title"],
                    event_date=event["date"],
                    event_time=event["time"],
                    event_location=event.get("location", ""),
                    event_description=event.get("description", ""),
                    rsvp_link=rsvp_link,
                    calendar_link=results.get("calendar", {}).get("html_link", ""),
                    team_logos=team_logos
                )
                
                results["gmail"] = gmail_result
                logger.info(f"✅ Gmail notifications sent for event {event_id}")
                
            except Exception as e:
                logger.error(f"❌ Gmail error: {e}")
                results["gmail"] = {"status": "error", "error": str(e)}
        
        return {
            "status": "success",
            "event_id": event_id,
            "recipients_count": len(user_emails),
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sending Google notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/events/{event_id}/sync-google-rsvps")
async def sync_google_rsvps(event_id: str):
    """Sync RSVP responses from Google Calendar to local database"""
    try:
        # Get event
        event = await db.unified_events.find_one({"id": event_id})
        if not event or not event.get("google_event_id"):
            raise HTTPException(status_code=404, detail="Event or Google event ID not found")
        
        # Get Google credentials
        league_data = await db.league_data.find_one({"id": "main_league"})
        google_config = league_data.get("googleDrive", {})
        
        from services.google_calendar_service import GoogleCalendarService
        calendar_service = GoogleCalendarService(google_config)
        
        # Get RSVP responses from Google
        responses = await calendar_service.get_rsvp_responses(event["google_event_id"])
        
        # Update local RSVPs
        for response in responses:
            email = response["email"]
            status = response["response_status"]
            
            # Map Google status to our status
            local_status = {
                "accepted": "going",
                "declined": "not_going",
                "tentative": "maybe",
                "needsAction": "pending"
            }.get(status, "pending")
            
            # Update or create RSVP
            await db.event_rsvps.update_one(
                {"event_id": event_id, "user_email": email},
                {
                    "$set": {
                        "response": local_status,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                        "source": "google_calendar"
                    }
                },
                upsert=True
            )
        
        logger.info(f"✅ Synced {len(responses)} RSVPs from Google Calendar")
        
        return {
            "status": "success",
            "synced_count": len(responses),
            "responses": responses
        }
        
    except Exception as e:
        logger.error(f"❌ Error syncing Google RSVPs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FEE MANAGEMENT ROUTES ====================

from services.fee_service import FeeService

# Initialize fee service
fee_service = FeeService(db)

# Fee Definitions
@api_router.get("/fees")
async def get_fees(scope: str = None, team_id: str = None, include_archived: bool = False):
    """Get all fee definitions"""
    try:
        fees = await fee_service.get_fees(scope=scope, team_id=team_id, include_archived=include_archived)
        return {"fees": fees}
    except Exception as e:
        logger.error(f"Error getting fees: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Fee Summaries & Reports (must be before /fees/{fee_id})
@api_router.get("/fees/summary")
async def get_fee_summary(fee_id: str = None, team_id: str = None):
    """Get fee collection summary"""
    try:
        summary = await fee_service.get_fee_summary(fee_id=fee_id, team_id=team_id)
        return summary
    except Exception as e:
        logger.error(f"Error getting fee summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/fees/overdue")
async def get_overdue_fees():
    """Get all overdue fee assignments"""
    try:
        overdue = await fee_service.get_overdue_assignments()
        return {"overdue_assignments": overdue, "count": len(overdue)}
    except Exception as e:
        logger.error(f"Error getting overdue fees: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/fees/{fee_id}")
async def get_fee(fee_id: str):
    """Get a single fee by ID"""
    try:
        fee = await fee_service.get_fee(fee_id)
        if not fee:
            raise HTTPException(status_code=404, detail="Fee not found")
        return fee
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting fee: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fees")
async def create_fee(fee_data: Dict[str, Any]):
    """Create a new fee definition"""
    try:
        created_by = fee_data.pop("created_by", "system")
        fee = await fee_service.create_fee(fee_data, created_by)
        return {"status": "success", "fee": fee}
    except Exception as e:
        logger.error(f"Error creating fee: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/fees/{fee_id}")
async def update_fee(fee_id: str, updates: Dict[str, Any]):
    """Update a fee definition"""
    try:
        updated_by = updates.pop("updated_by", "system")
        fee = await fee_service.update_fee(fee_id, updates, updated_by)
        if not fee:
            raise HTTPException(status_code=404, detail="Fee not found")
        return {"status": "success", "fee": fee}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating fee: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/fees/{fee_id}")
async def archive_fee(fee_id: str):
    """Archive a fee (soft delete)"""
    try:
        success = await fee_service.archive_fee(fee_id)
        if not success:
            raise HTTPException(status_code=404, detail="Fee not found")
        return {"status": "success", "message": "Fee archived"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving fee: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Fee Assignments
@api_router.post("/fees/assign")
async def assign_fee(assignment_data: Dict[str, Any]):
    """Assign a fee to players or teams"""
    try:
        fee_id = assignment_data.get("fee_id")
        assigned_by = assignment_data.get("assigned_by", "system")
        player_ids = assignment_data.get("player_ids", [])
        team_ids = assignment_data.get("team_ids", [])
        use_payment_plan = assignment_data.get("use_payment_plan", False)
        installments = assignment_data.get("installments", 1)
        custom_due_date = assignment_data.get("custom_due_date")
        notes = assignment_data.get("notes")
        
        assignments = await fee_service.assign_fee(
            fee_id=fee_id,
            assigned_by=assigned_by,
            player_ids=player_ids,
            team_ids=team_ids,
            use_payment_plan=use_payment_plan,
            installments=installments,
            custom_due_date=custom_due_date,
            notes=notes
        )
        
        return {"status": "success", "assignments": assignments, "count": len(assignments)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error assigning fee: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/fee-assignments")
async def get_fee_assignments(
    fee_id: str = None,
    player_id: str = None,
    team_id: str = None,
    status: str = None
):
    """Get fee assignments with optional filters"""
    try:
        assignments = await fee_service.get_assignments(
            fee_id=fee_id,
            player_id=player_id,
            team_id=team_id,
            status=status
        )
        return {"assignments": assignments}
    except Exception as e:
        logger.error(f"Error getting assignments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/fee-assignments/{assignment_id}")
async def get_fee_assignment(assignment_id: str):
    """Get a single fee assignment"""
    try:
        assignment = await fee_service.get_assignment(assignment_id)
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        return assignment
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting assignment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/fee-assignments/{assignment_id}/payment")
async def record_assignment_payment(assignment_id: str, payment_data: Dict[str, Any]):
    """Record a payment for a specific fee assignment"""
    try:
        amount = float(payment_data.get("amount", 0))
        payment_method = payment_data.get("payment_method", "cash")
        recorded_by = payment_data.get("recorded_by", "system")
        payment_date = payment_data.get("payment_date")
        notes = payment_data.get("notes")
        check_number = payment_data.get("check_number")
        
        # Add check number to notes if provided
        if check_number:
            notes = f"Check #{check_number}" + (f" - {notes}" if notes else "")
        
        payment = await fee_service.record_payment(
            assignment_id=assignment_id,
            amount=amount,
            payment_method=payment_method,
            recorded_by=recorded_by,
            payment_date=payment_date,
            notes=notes
        )
        
        return {"status": "success", "payment": payment}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error recording payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Payments
@api_router.post("/payments")
async def record_payment(payment_data: Dict[str, Any]):
    """Record a payment for a fee assignment"""
    try:
        assignment_id = payment_data.get("assignment_id")
        amount = float(payment_data.get("amount", 0))
        payment_method = payment_data.get("payment_method", "cash")
        recorded_by = payment_data.get("recorded_by", "system")
        transaction_id = payment_data.get("transaction_id")
        payment_date = payment_data.get("payment_date")
        paid_by = payment_data.get("paid_by")
        paid_by_name = payment_data.get("paid_by_name")
        notes = payment_data.get("notes")
        receipt_url = payment_data.get("receipt_url")
        
        payment = await fee_service.record_payment(
            assignment_id=assignment_id,
            amount=amount,
            payment_method=payment_method,
            recorded_by=recorded_by,
            transaction_id=transaction_id,
            payment_date=payment_date,
            paid_by=paid_by,
            paid_by_name=paid_by_name,
            notes=notes,
            receipt_url=receipt_url
        )
        
        return {"status": "success", "payment": payment}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error recording payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments")
async def get_payments(
    assignment_id: str = None,
    fee_id: str = None,
    payment_method: str = None
):
    """Get payment records"""
    try:
        payments = await fee_service.get_payments(
            assignment_id=assignment_id,
            fee_id=fee_id,
            payment_method=payment_method
        )
        return {"payments": payments}
    except Exception as e:
        logger.error(f"Error getting payments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Payment Configuration
@api_router.get("/payment-config")
async def get_payment_config(scope: str = "league", team_id: str = None):
    """Get payment configuration"""
    try:
        config = await fee_service.get_payment_config(scope=scope, team_id=team_id)
        return config
    except Exception as e:
        logger.error(f"Error getting payment config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payment-config")
async def update_payment_config(config_data: Dict[str, Any]):
    """Update payment configuration"""
    try:
        scope = config_data.pop("scope", "league")
        team_id = config_data.pop("team_id", None)
        updated_by = config_data.pop("updated_by", None)
        
        config = await fee_service.update_payment_config(
            config_data=config_data,
            scope=scope,
            team_id=team_id,
            updated_by=updated_by
        )
        return {"status": "success", "config": config}
    except Exception as e:
        logger.error(f"Error updating payment config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/players/{player_id}/fees")
async def get_player_fees(player_id: str):
    """Get all fees for a specific player"""
    try:
        fees = await fee_service.get_player_fees(player_id)
        return fees
    except Exception as e:
        logger.error(f"Error getting player fees: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Stripe Checkout Integration
@api_router.post("/payments/stripe/checkout")
async def create_stripe_checkout(checkout_data: Dict[str, Any], request: Request):
    """Create a Stripe checkout session for fee payment"""
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        
        assignment_id = checkout_data.get("assignment_id")
        origin_url = checkout_data.get("origin_url", str(request.base_url).rstrip('/'))
        
        # Get assignment to get amount
        assignment = await fee_service.get_assignment(assignment_id)
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        amount = float(assignment.get("amount_due", 0))
        if amount <= 0:
            raise HTTPException(status_code=400, detail="No amount due")
        
        # Initialize Stripe
        api_key = os.environ.get('STRIPE_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        webhook_url = f"{BACKEND_URL}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        
        # Build URLs
        success_url = f"{origin_url}/fees/payment-success?session_id={{CHECKOUT_SESSION_ID}}&assignment_id={assignment_id}"
        cancel_url = f"{origin_url}/fees"
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency=assignment.get("currency", "USD").lower(),
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "assignment_id": assignment_id,
                "fee_id": assignment.get("fee_id", ""),
                "player_id": assignment.get("player_id", ""),
                "fee_name": assignment.get("fee_name", "")
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store pending transaction
        await db.payment_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "assignment_id": assignment_id,
            "amount": amount,
            "currency": assignment.get("currency", "USD"),
            "status": "pending",
            "payment_method": "stripe",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {"checkout_url": session.url, "session_id": session.session_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Stripe checkout: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/stripe/status/{session_id}")
async def get_stripe_payment_status(session_id: str):
    """Get Stripe checkout session status"""
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        api_key = os.environ.get('STRIPE_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # If paid, record the payment
        if status.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            if transaction and transaction.get("status") != "completed":
                # Update transaction
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "completed", "payment_status": status.payment_status}}
                )
                
                # Record payment
                assignment_id = transaction.get("assignment_id") or status.metadata.get("assignment_id")
                if assignment_id:
                    await fee_service.record_payment(
                        assignment_id=assignment_id,
                        amount=status.amount_total / 100,  # Convert from cents
                        payment_method="stripe",
                        recorded_by="stripe_webhook",
                        transaction_id=session_id
                    )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Error getting Stripe status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        api_key = os.environ.get('STRIPE_API_KEY')
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
        
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Stripe webhook: {webhook_response.event_type} - {webhook_response.session_id}")
        
        if webhook_response.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
            if transaction and transaction.get("status") != "completed":
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"status": "completed", "payment_status": "paid"}}
                )
                
                assignment_id = transaction.get("assignment_id") or webhook_response.metadata.get("assignment_id")
                if assignment_id:
                    await fee_service.record_payment(
                        assignment_id=assignment_id,
                        amount=transaction.get("amount", 0),
                        payment_method="stripe",
                        recorded_by="stripe_webhook",
                        transaction_id=webhook_response.session_id
                    )
        
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")
        return {"status": "error", "message": str(e)}


# ==================== PAYPAL PAYMENT ROUTES ====================

@api_router.post("/payments/paypal/create-order")
async def create_paypal_order(order_data: Dict[str, Any]):
    """Create a PayPal order for fee payment"""
    try:
        from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment, LiveEnvironment
        from paypalcheckoutsdk.orders import OrdersCreateRequest
        
        assignment_id = order_data.get("assignment_id")
        if not assignment_id:
            raise HTTPException(status_code=400, detail="assignment_id required")
        
        # Get assignment details
        assignment = await fee_service.get_assignment(assignment_id)
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        # Get PayPal config
        config = await fee_service.get_payment_config()
        paypal_client_id = config.get("paypal_client_id")
        paypal_secret = config.get("paypal_secret")
        paypal_mode = config.get("paypal_mode", "sandbox")
        
        if not paypal_client_id or not paypal_secret:
            raise HTTPException(status_code=400, detail="PayPal not configured. Please add Client ID and Secret in payment settings.")
        
        # Create PayPal environment
        if paypal_mode == "live":
            environment = LiveEnvironment(client_id=paypal_client_id, client_secret=paypal_secret)
        else:
            environment = SandboxEnvironment(client_id=paypal_client_id, client_secret=paypal_secret)
        
        client = PayPalHttpClient(environment)
        
        # Determine amount to pay
        amount_to_pay = assignment.get("amount_due", 0)
        if assignment.get("is_payment_plan") and assignment.get("next_installment_amount"):
            amount_to_pay = assignment["next_installment_amount"]
        
        # Create order request
        request = OrdersCreateRequest()
        request.prefer('return=representation')
        request.request_body({
            "intent": "CAPTURE",
            "purchase_units": [{
                "reference_id": assignment_id,
                "description": f"Fee payment: {assignment.get('fee_name', 'Fee')}",
                "amount": {
                    "currency_code": assignment.get("currency", "USD"),
                    "value": f"{amount_to_pay:.2f}"
                }
            }],
            "application_context": {
                "brand_name": "League Fee Payment",
                "landing_page": "BILLING",
                "user_action": "PAY_NOW",
                "return_url": order_data.get("return_url", "https://example.com/success"),
                "cancel_url": order_data.get("cancel_url", "https://example.com/cancel")
            }
        })
        
        response = client.execute(request)
        
        logger.info(f"PayPal order created: {response.result.id}")
        
        # Find approval URL
        approval_url = None
        for link in response.result.links:
            if link.rel == "approve":
                approval_url = link.href
                break
        
        return {
            "order_id": response.result.id,
            "approval_url": approval_url,
            "status": response.result.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PayPal order creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating PayPal order: {str(e)}")


@api_router.post("/payments/paypal/capture-order/{order_id}")
async def capture_paypal_order(order_id: str, capture_data: Dict[str, Any] = None):
    """Capture a PayPal order after approval"""
    try:
        from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment, LiveEnvironment
        from paypalcheckoutsdk.orders import OrdersCaptureRequest, OrdersGetRequest
        
        # Get PayPal config
        config = await fee_service.get_payment_config()
        paypal_client_id = config.get("paypal_client_id")
        paypal_secret = config.get("paypal_secret")
        paypal_mode = config.get("paypal_mode", "sandbox")
        
        if not paypal_client_id or not paypal_secret:
            raise HTTPException(status_code=400, detail="PayPal not configured")
        
        # Create PayPal environment
        if paypal_mode == "live":
            environment = LiveEnvironment(client_id=paypal_client_id, client_secret=paypal_secret)
        else:
            environment = SandboxEnvironment(client_id=paypal_client_id, client_secret=paypal_secret)
        
        client = PayPalHttpClient(environment)
        
        # Capture the order
        request = OrdersCaptureRequest(order_id)
        response = client.execute(request)
        
        if response.result.status == "COMPLETED":
            # Get assignment ID from reference_id
            assignment_id = response.result.purchase_units[0].reference_id
            capture = response.result.purchase_units[0].payments.captures[0]
            amount = float(capture.amount.value)
            
            # Record the payment
            if fee_service:
                payment = await fee_service.record_payment(
                    assignment_id=assignment_id,
                    amount=amount,
                    payment_method="paypal",
                    recorded_by="paypal_capture",
                    transaction_id=capture.id,
                    notes=f"PayPal Order: {order_id}"
                )
                logger.info(f"PayPal payment recorded: {payment['id']}")
            
            return {
                "status": "COMPLETED",
                "transaction_id": capture.id,
                "amount": amount,
                "order_id": order_id
            }
        else:
            return {
                "status": response.result.status,
                "order_id": order_id
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PayPal capture error: {e}")
        raise HTTPException(status_code=500, detail=f"Error capturing PayPal order: {str(e)}")


@api_router.get("/payments/paypal/order/{order_id}")
async def get_paypal_order_status(order_id: str):
    """Get PayPal order status"""
    try:
        from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment, LiveEnvironment
        from paypalcheckoutsdk.orders import OrdersGetRequest
        
        # Get PayPal config
        config = await fee_service.get_payment_config()
        paypal_client_id = config.get("paypal_client_id")
        paypal_secret = config.get("paypal_secret")
        paypal_mode = config.get("paypal_mode", "sandbox")
        
        if not paypal_client_id or not paypal_secret:
            raise HTTPException(status_code=400, detail="PayPal not configured")
        
        # Create PayPal environment
        if paypal_mode == "live":
            environment = LiveEnvironment(client_id=paypal_client_id, client_secret=paypal_secret)
        else:
            environment = SandboxEnvironment(client_id=paypal_client_id, client_secret=paypal_secret)
        
        client = PayPalHttpClient(environment)
        
        request = OrdersGetRequest(order_id)
        response = client.execute(request)
        
        return {
            "order_id": order_id,
            "status": response.result.status,
            "create_time": response.result.create_time,
            "amount": response.result.purchase_units[0].amount.value if response.result.purchase_units else None
        }
        
    except Exception as e:
        logger.error(f"PayPal order status error: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting order status: {str(e)}")


# ============================================================================
# SMS/TWILIO INTEGRATION
# ============================================================================

class SMSConfig(BaseModel):
    enabled: bool = False
    account_sid: Optional[str] = ""
    auth_token: Optional[str] = ""
    phone_number: Optional[str] = ""  # Twilio phone number to send from
    # Message templates
    event_reminder_template: str = "📅 Reminder: {event_title} on {event_date} at {event_time}. Location: {location}. RSVP: {rsvp_link}"
    rsvp_confirmation_template: str = "✅ Your RSVP for {event_title} has been recorded as: {response}"
    custom_template: str = ""

class SMSRequest(BaseModel):
    to_numbers: List[str]  # List of phone numbers
    message: str
    event_id: Optional[str] = None


# ==================== SMS/TWILIO ROUTES EXTRACTED TO routes/communication.py ====================


# ============ DATABASE ADMIN ENDPOINTS ============

@api_router.get("/database/stats")
async def get_database_stats():
    """Get database statistics and collection info"""
    try:
        # Get all collection names
        collection_names = await db.list_collection_names()
        
        collections_info = []
        total_documents = 0
        
        for name in collection_names:
            if name.startswith('system.'):
                continue
            collection = db[name]
            count = await collection.count_documents({})
            total_documents += count
            
            # Get sample document to show fields
            sample = await collection.find_one({}, {"_id": 0})
            fields = list(sample.keys()) if sample else []
            
            collections_info.append({
                "name": name,
                "documents": count,
                "fields": fields[:10],  # Limit to first 10 fields
                "fieldCount": len(fields)
            })
        
        # Sort by document count
        collections_info.sort(key=lambda x: x['documents'], reverse=True)
        
        return {
            "collections": len(collections_info),
            "documents": total_documents,
            "size": "N/A",  # Would need admin access to get actual size
            "collectionsInfo": collections_info
        }
        
    except Exception as e:
        logger.error(f"Error getting database stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/database/collections/{collection_name}")
async def get_collection_data(collection_name: str, limit: int = 100):
    """Get data from a specific collection"""
    try:
        collection = db[collection_name]
        documents = await collection.find({}, {"_id": 0}).limit(limit).to_list(500)
        count = await collection.count_documents({})
        
        return {
            "collection": collection_name,
            "totalDocuments": count,
            "returnedDocuments": len(documents),
            "documents": documents
        }
        
    except Exception as e:
        logger.error(f"Error getting collection data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/database/collections/{collection_name}/{record_id}")
async def update_collection_record(collection_name: str, record_id: str, data: dict):
    """Update a record in a collection"""
    try:
        collection = db[collection_name]
        
        # Remove _id from data if present (can't update _id)
        data.pop('_id', None)
        
        # Try to find by 'id' field first, then by '_id'
        result = await collection.update_one(
            {"id": record_id},
            {"$set": data}
        )
        
        if result.matched_count == 0:
            # Try with ObjectId if string id didn't match
            from bson import ObjectId
            try:
                result = await collection.update_one(
                    {"_id": ObjectId(record_id)},
                    {"$set": data}
                )
            except:
                pass
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        
        return {"status": "success", "message": "Record updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating record: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/database/collections/{collection_name}/{record_id}")
async def delete_collection_record(collection_name: str, record_id: str):
    """Delete a record from a collection"""
    try:
        collection = db[collection_name]
        
        # Try to delete by 'id' field first
        result = await collection.delete_one({"id": record_id})
        
        if result.deleted_count == 0:
            # Try with ObjectId if string id didn't match
            from bson import ObjectId
            try:
                result = await collection.delete_one({"_id": ObjectId(record_id)})
            except:
                pass
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        
        return {"status": "success", "message": "Record deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting record: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/database/backup")
async def create_backup():
    """Create a database backup (placeholder - actual backup would need mongodump)"""
    try:
        # This is a placeholder - actual backup would require mongodump or Atlas backup
        return {
            "status": "info",
            "message": "Database backup must be performed through MongoDB Atlas or mongodump CLI tool"
        }
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# Include feature-based routers in api_router
api_router.include_router(finance_router)
api_router.include_router(locations_router)
api_router.include_router(teams_router)
api_router.include_router(teams_public_router)
api_router.include_router(media_router)
api_router.include_router(groupme_router)
api_router.include_router(comms_router)
api_router.include_router(users_router)
api_router.include_router(rsvp_router)
api_router.include_router(drive_router)
api_router.include_router(cleanup_router)
api_router.include_router(joinus_router)

# Setup router - for first-time setup wizard
app.include_router(setup_router)

# Include the API router in the main app (after all routes are defined)
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)