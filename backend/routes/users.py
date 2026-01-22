"""
Users Router - Handles user authentication and management
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
import logging
import uuid
import hashlib

logger = logging.getLogger(__name__)

# Create router
users_router = APIRouter(prefix="/users", tags=["users"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database


# Pydantic models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserRegistration(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    requestedRole: str = "guest"
    requestedTeam: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    roles: Optional[List[str]] = None
    teamId: Optional[str] = None
    teamAssignments: Optional[List[Dict]] = None
    status: Optional[str] = None
    playerNumber: Optional[str] = None
    position: Optional[str] = None
    jerseySize: Optional[str] = None
    emergencyContact: Optional[str] = None
    notificationPreferences: Optional[Dict] = None
    photoUrl: Optional[str] = None
    lacrosseHistory: Optional[str] = None
    funFacts: Optional[str] = None
    socialMedia: Optional[Dict] = None


@users_router.post("/login")
async def login_user(login_data: LoginRequest):
    """User login endpoint"""
    try:
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


@users_router.post("/register")
async def register_user(user_data: UserRegistration):
    """Public user registration endpoint"""
    try:
        # Check if email already exists
        existing = await db.users.find_one({"email": user_data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
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


@users_router.get("")
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


@users_router.post("/{user_id}/approve")
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


@users_router.post("/{user_id}/reject")
async def reject_user(user_id: str):
    """Reject a pending user"""
    try:
        await db.users.delete_one({"id": user_id})
        
        logger.info(f"✅ User rejected: {user_id}")
        
        return {"status": "success", "message": "User rejected"}
        
    except Exception as e:
        logger.error(f"❌ Error rejecting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@users_router.patch("/{user_id}")
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


@users_router.post("/{user_id}/default-landing-page")
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
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        
        logger.info(f"✅ Default landing page set for user {user_id}: {landing_page}")
        
        return {"status": "success", "message": "Default landing page updated", "user": user}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error setting default landing page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@users_router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Delete a user"""
    try:
        await db.users.delete_one({"id": user_id})
        
        logger.info(f"✅ User deleted: {user_id}")
        
        return {"status": "success", "message": "User deleted"}
        
    except Exception as e:
        logger.error(f"❌ Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@users_router.post("/{user_id}/reset-password")
async def reset_user_password(user_id: str, data: Dict[str, Any]):
    """Admin endpoint to reset user password"""
    try:
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


# ============= Google OAuth Login =============

class GoogleLoginRequest(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None
    session_token: str
    google_id: str


@users_router.post("/google-login")
async def google_login(login_data: GoogleLoginRequest):
    """Handle Google OAuth login - create or update user"""
    try:
        # Check if user exists by email
        existing_user = await db.users.find_one(
            {"email": login_data.email},
            {"_id": 0, "password": 0}
        )
        
        if existing_user:
            # Update existing user with Google info if not already set
            update_data = {
                "lastLogin": datetime.now(timezone.utc).isoformat()
            }
            
            # Link Google account if not already linked
            if not existing_user.get("googleId"):
                update_data["googleId"] = login_data.google_id
            
            # Update photo if user doesn't have one
            if not existing_user.get("photoUrl") and login_data.picture:
                update_data["photoUrl"] = login_data.picture
            
            await db.users.update_one(
                {"email": login_data.email},
                {"$set": update_data}
            )
            
            # Get updated user
            user = await db.users.find_one(
                {"email": login_data.email},
                {"_id": 0, "password": 0}
            )
            
            logger.info(f"✅ Existing user logged in via Google: {user['email']}")
            
            return {
                "status": "success",
                "user": user,
                "session_token": login_data.session_token,
                "message": "Login successful"
            }
        
        else:
            # Create new user from Google profile
            new_user = {
                "id": str(uuid.uuid4()),
                "name": login_data.name,
                "email": login_data.email,
                "googleId": login_data.google_id,
                "photoUrl": login_data.picture,
                "role": "guest",  # New Google users start as guests
                "roles": ["guest"],
                "status": "pending",  # Require admin approval
                "teamId": None,
                "teamAssignments": [],
                "notificationPreferences": {
                    "email": True,
                    "sms": False,
                    "groupme": True
                },
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "lastLogin": datetime.now(timezone.utc).isoformat(),
                "authProvider": "google"
            }
            
            await db.users.insert_one(new_user)
            
            # Remove MongoDB _id for response
            new_user.pop("_id", None)
            
            logger.info(f"✅ New user created via Google: {new_user['email']}")
            
            return {
                "status": "success",
                "user": new_user,
                "session_token": login_data.session_token,
                "message": "Account created - pending admin approval",
                "is_new_user": True
            }
        
    except Exception as e:
        logger.error(f"❌ Error during Google login: {e}")
        raise HTTPException(status_code=500, detail=str(e))

