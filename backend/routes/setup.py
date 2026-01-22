"""
Setup Router - Handles first-time setup wizard endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone
import uuid
import hashlib
import os
from motor.motor_asyncio import AsyncIOMotorClient

setup_router = APIRouter(prefix="/api/setup", tags=["setup"])

# Get database connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "league_db")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ============= Models =============

class AdminSetupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LeagueSetupRequest(BaseModel):
    leagueName: str
    leagueTagline: Optional[str] = ""
    sportType: str = "lacrosse"
    primaryColor: str = "#2563eb"
    accentColor: str = "#3b82f6"


# ============= Endpoints =============

@setup_router.get("/status")
async def get_setup_status():
    """Check if initial setup has been completed"""
    try:
        league_data = await db.league_data.find_one({})
        
        if not league_data:
            return {"setup_complete": False, "reason": "no_league_data"}
        
        # Check if setup wizard was completed
        if league_data.get("setupComplete"):
            return {"setup_complete": True}
        
        # Check if there are any admin users
        admin_count = await db.users.count_documents({
            "roles": {"$in": ["admin", "league_admin"]}
        })
        
        if admin_count == 0:
            return {"setup_complete": False, "reason": "no_admin"}
        
        # Check if league has a name set
        if not league_data.get("leagueName") and not league_data.get("websiteStyle", {}).get("navLeagueName"):
            return {"setup_complete": False, "reason": "no_league_name"}
        
        return {"setup_complete": True}
        
    except Exception as e:
        print(f"Error checking setup status: {e}")
        return {"setup_complete": True}  # Default to true to avoid blocking


@setup_router.post("/admin")
async def create_admin_account(request: AdminSetupRequest):
    """Create the first admin account during setup"""
    try:
        # Check if any admin already exists
        existing_admin = await db.users.find_one({
            "roles": {"$in": ["admin", "league_admin"]}
        })
        
        if existing_admin:
            raise HTTPException(
                status_code=400,
                detail="An admin account already exists. Please login instead."
            )
        
        # Check if email already taken
        existing_user = await db.users.find_one({"email": request.email})
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="This email is already registered"
            )
        
        # Hash password
        password_hash = hashlib.sha256(request.password.encode()).hexdigest()
        
        # Create admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "name": request.name,
            "email": request.email,
            "password": password_hash,
            "role": "admin",
            "roles": ["admin", "league_admin", "coach"],
            "status": "active",
            "teamId": None,
            "teamAssignments": [],
            "notificationPreferences": {
                "email": True,
                "sms": False,
                "groupme": True
            },
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "lastLogin": datetime.now(timezone.utc).isoformat(),
            "isSetupAdmin": True  # Mark as the setup admin
        }
        
        await db.users.insert_one(admin_user)
        
        # Remove password from response
        admin_user.pop("password", None)
        admin_user.pop("_id", None)
        
        return {
            "status": "success",
            "message": "Admin account created",
            "user": admin_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating admin: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@setup_router.post("/league")
async def setup_league(request: LeagueSetupRequest):
    """Save initial league settings"""
    try:
        # Get or create league_data document
        league_data = await db.league_data.find_one({})
        
        if league_data:
            # Update existing
            await db.league_data.update_one(
                {"_id": league_data["_id"]},
                {"$set": {
                    "leagueName": request.leagueName,
                    "websiteStyle": {
                        **league_data.get("websiteStyle", {}),
                        "navLeagueName": request.leagueName,
                        "navTagline": request.leagueTagline,
                        "sportType": request.sportType,
                        "navBackgroundColor": request.primaryColor,
                        "navTextColor": "#ffffff",
                        "bannerHeadline": request.leagueName,
                        "bannerSubheadline": request.leagueTagline
                    },
                    "sportType": request.sportType,
                    "updatedAt": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # Create new
            await db.league_data.insert_one({
                "leagueName": request.leagueName,
                "sportType": request.sportType,
                "websiteStyle": {
                    "navLeagueName": request.leagueName,
                    "navTagline": request.leagueTagline,
                    "sportType": request.sportType,
                    "navBackgroundColor": request.primaryColor,
                    "navTextColor": "#ffffff",
                    "bannerHeadline": request.leagueName,
                    "bannerSubheadline": request.leagueTagline
                },
                "teams": [],
                "players": [],
                "createdAt": datetime.now(timezone.utc).isoformat()
            })
        
        return {
            "status": "success",
            "message": "League settings saved"
        }
        
    except Exception as e:
        print(f"Error setting up league: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@setup_router.post("/complete")
async def complete_setup():
    """Mark setup as complete"""
    try:
        await db.league_data.update_one(
            {},
            {"$set": {
                "setupComplete": True,
                "setupCompletedAt": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "status": "success",
            "message": "Setup completed!"
        }
        
    except Exception as e:
        print(f"Error completing setup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@setup_router.post("/reset")
async def reset_setup():
    """Reset setup status (for testing/development)"""
    try:
        # Only allow in development
        if os.environ.get("ENVIRONMENT") == "production":
            raise HTTPException(status_code=403, detail="Cannot reset in production")
        
        await db.league_data.update_one(
            {},
            {"$set": {"setupComplete": False}}
        )
        
        return {"status": "success", "message": "Setup reset"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
