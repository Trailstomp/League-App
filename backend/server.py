from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


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


from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime


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
                "lastUpdated": datetime.utcnow().isoformat()
            }
    except Exception as e:
        logger.error(f"Error fetching league data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/league-data")
async def save_league_data(data: Dict[str, Any]):
    """Save all league data"""
    try:
        data["id"] = "main_league"
        data["lastUpdated"] = datetime.utcnow()
        
        # Upsert the data (update if exists, insert if not)
        await db.league_data.replace_one(
            {"id": "main_league"},
            data,
            upsert=True
        )
        return {"message": "League data saved successfully", "timestamp": data["lastUpdated"]}
    except Exception as e:
        logger.error(f"Error saving league data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/league-data/{data_type}")
async def update_specific_data(data_type: str, data: List[Any] | Dict[str, Any]):
    """Update specific data type (teams, players, users, etc.)"""
    try:
        valid_types = ["teams", "players", "users", "newsItems", "gameTickerData", "leagueSchedule", "leagueInfo", "websiteStyle"]
        if data_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid data type. Must be one of: {valid_types}")
        
        update_data = {
            f"{data_type}": data,
            "lastUpdated": datetime.utcnow()
        }
        
        await db.league_data.update_one(
            {"id": "main_league"},
            {"$set": update_data},
            upsert=True
        )
        return {"message": f"{data_type} updated successfully", "timestamp": update_data["lastUpdated"]}
    except HTTPException:
        raise  # Re-raise HTTPException as-is (400, 404, etc.)
    except Exception as e:
        logger.error(f"Error updating {data_type}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# CRITICAL INFRASTRUCTURE: Teams and Players Database Persistence
# Dedicated collections and CRUD endpoints to prevent data loss

# Style model for team styling
class TeamStyle(BaseModel):
    primaryColor: Optional[str] = "#dc2626"
    backgroundColor: Optional[str] = "#fef2f2"
    accentColor: Optional[str] = "#7c2d12"
    logoUrl: Optional[str] = ""
    logoOpacity: Optional[float] = 1.0
    bannerUrl: Optional[str] = ""
    # Team card background image
    cardBackgroundImage: Optional[str] = ""
    cardBackgroundOpacity: Optional[float] = 0.3
    # Team page background
    pageBackgroundType: Optional[str] = "color"
    pageBackgroundColor: Optional[str] = ""  # Defaults to backgroundColor if empty
    pageBackgroundImage: Optional[str] = ""
    # Team form background controls
    formBackgroundColor: Optional[str] = "#ffffff"
    formBackgroundImage: Optional[str] = ""
    formBackgroundType: Optional[str] = "color"
    formTextColor: Optional[str] = "#374151"

# Pydantic models for Teams and Players
class Team(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    division: Optional[str] = "Field"
    coach: Optional[str] = ""
    homeField: Optional[str] = ""
    logo: Optional[str] = ""
    contactEmail: Optional[str] = ""
    active: bool = True
    wins: int = 0
    losses: int = 0
    ties: int = 0
    style: Optional[TeamStyle] = Field(default_factory=TeamStyle)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    teamId: str
    position: Optional[str] = ""
    jerseyNumber: Optional[int] = None
    email: Optional[str] = ""
    phone: Optional[str] = ""
    handedness: Optional[str] = ""  # Left, Right, or Ambidextrous
    details: Optional[str] = ""  # Additional player information
    photoUrl: Optional[str] = ""  # Player photo
    # Multiple teams and positions support
    additionalTeams: Optional[List[str]] = Field(default_factory=list)  # Additional team IDs
    additionalPositions: Optional[List[str]] = Field(default_factory=list)  # Additional positions
    # Social media links
    social: Optional[Dict[str, str]] = Field(default_factory=dict)  # Instagram, Twitter, Facebook, LinkedIn
    active: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# Teams CRUD Endpoints
@api_router.get("/teams", response_model=List[Team])
async def get_teams():
    """Get all teams from dedicated teams collection"""
    try:
        teams = await db.teams.find().to_list(length=None)
        return [Team(**team) for team in teams] if teams else []
    except Exception as e:
        logger.error(f"Error fetching teams: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/teams", response_model=Team)
async def create_team(team: Team):
    """Create a new team in dedicated teams collection"""
    try:
        # Create backup before operation
        await create_teams_backup()
        
        team_dict = team.dict()
        team_dict["createdAt"] = datetime.utcnow()
        team_dict["updatedAt"] = datetime.utcnow()
        
        result = await db.teams.insert_one(team_dict)
        if result.inserted_id:
            created_team = await db.teams.find_one({"_id": result.inserted_id})
            return Team(**created_team)
        else:
            raise HTTPException(status_code=500, detail="Failed to create team")
    except Exception as e:
        logger.error(f"Error creating team: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/teams/{team_id}", response_model=Team)
async def update_team(team_id: str, team: Team):
    """Update an existing team"""
    try:
        # Create backup before operation
        await create_teams_backup()
        
        team_dict = team.dict()
        team_dict["updatedAt"] = datetime.utcnow()
        
        result = await db.teams.update_one(
            {"id": team_id},
            {"$set": team_dict}
        )
        
        if result.modified_count:
            updated_team = await db.teams.find_one({"id": team_id})
            return Team(**updated_team)
        else:
            raise HTTPException(status_code=404, detail="Team not found")
    except Exception as e:
        logger.error(f"Error updating team: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/teams/{team_id}")
async def delete_team(team_id: str):
    """Delete a team (with backup)"""
    try:
        # Create backup before operation
        await create_teams_backup()
        
        result = await db.teams.delete_one({"id": team_id})
        if result.deleted_count:
            # Also remove associated players
            await db.players.delete_many({"teamId": team_id})
            return {"message": "Team deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Team not found")
    except Exception as e:
        logger.error(f"Error deleting team: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Players CRUD Endpoints
@api_router.get("/players", response_model=List[Player])
async def get_players():
    """Get all players from dedicated players collection"""
    try:
        players = await db.players.find().to_list(length=None)
        return [Player(**player) for player in players] if players else []
    except Exception as e:
        logger.error(f"Error fetching players: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/players", response_model=Player)
async def create_player(player: Player):
    """Create a new player"""
    try:
        # Create backup before operation
        await create_players_backup()
        
        player_dict = player.dict()
        player_dict["createdAt"] = datetime.utcnow()
        player_dict["updatedAt"] = datetime.utcnow()
        
        result = await db.players.insert_one(player_dict)
        if result.inserted_id:
            created_player = await db.players.find_one({"_id": result.inserted_id})
            return Player(**created_player)
        else:
            raise HTTPException(status_code=500, detail="Failed to create player")
    except Exception as e:
        logger.error(f"Error creating player: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/players/{player_id}", response_model=Player)
async def update_player(player_id: str, player: Player):
    """Update an existing player"""
    try:
        # Create backup before operation
        await create_players_backup()
        
        player_dict = player.dict()
        player_dict["updatedAt"] = datetime.utcnow()
        
        result = await db.players.update_one(
            {"id": player_id},
            {"$set": player_dict}
        )
        
        if result.modified_count:
            updated_player = await db.players.find_one({"id": player_id})
            return Player(**updated_player)
        else:
            raise HTTPException(status_code=404, detail="Player not found")
    except Exception as e:
        logger.error(f"Error updating player: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/players/{player_id}")
async def delete_player(player_id: str):
    """Delete a player (with backup)"""
    try:
        # Create backup before operation
        await create_players_backup()
        
        result = await db.players.delete_one({"id": player_id})
        if result.deleted_count:
            return {"message": "Player deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Player not found")
    except Exception as e:
        logger.error(f"Error deleting player: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Backup and Safety Functions
async def create_teams_backup():
    """Create automatic backup of teams before destructive operations"""
    try:
        teams = await db.teams.find().to_list(length=None)
        backup_doc = {
            "type": "teams_backup",
            "timestamp": datetime.utcnow(),
            "data": teams
        }
        await db.backups.insert_one(backup_doc)
        logger.info(f"Teams backup created: {backup_doc['timestamp']}")
    except Exception as e:
        logger.error(f"Error creating teams backup: {e}")

async def create_players_backup():
    """Create automatic backup of players before destructive operations"""
    try:
        players = await db.players.find().to_list(length=None)
        backup_doc = {
            "type": "players_backup", 
            "timestamp": datetime.utcnow(),
            "data": players
        }
        await db.backups.insert_one(backup_doc)
        logger.info(f"Players backup created: {backup_doc['timestamp']}")
    except Exception as e:
        logger.error(f"Error creating players backup: {e}")

# Backup and Restore Endpoints
@api_router.get("/backup/teams")
async def backup_teams():
    """Manual backup of teams data"""
    try:
        await create_teams_backup()
        return {"message": "Teams backup created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/backup/players")
async def backup_players():
    """Manual backup of players data"""
    try:
        await create_players_backup()
        return {"message": "Players backup created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# END CRITICAL INFRASTRUCTURE

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
