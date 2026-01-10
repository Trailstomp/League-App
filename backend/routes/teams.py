"""
Teams Router - Handles team-related operations including roster management
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# Create router
teams_router = APIRouter(prefix="/team", tags=["teams"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database


@teams_router.get("/{team_id}/players")
async def get_team_players(team_id: str):
    """Get players for a specific team - checks both users collection and legacy league_data.players"""
    try:
        team_players = []
        
        # First, check the users collection (new format)
        users_cursor = db.users.find({
            "$or": [
                {"teamId": team_id},
                {"teamAssignments.teamId": team_id}
            ],
            "status": "active"
        }, {"_id": 0, "password": 0})
        
        users_list = await users_cursor.to_list(1000)
        for user in users_list:
            # Convert user to player format for consistency
            player = {
                "id": user.get("id"),
                "name": user.get("name"),
                "email": user.get("email"),
                "phone": user.get("phone"),
                "teamId": team_id,
                "position": user.get("position", ""),
                "jerseyNumber": user.get("playerNumber", user.get("jerseyNumber", "")),
                "photoUrl": user.get("photoUrl", ""),
                "roles": user.get("roles", []),
                "status": user.get("status", "active"),
                "goals": user.get("goals", 0),
                "assists": user.get("assists", 0),
                "lacrosseHistory": user.get("lacrosseHistory"),
                "funFacts": user.get("funFacts"),
                "socialMedia": user.get("socialMedia"),
                "teamAssignments": user.get("teamAssignments", [])
            }
            # Get team-specific info from teamAssignments if available
            for assignment in user.get("teamAssignments", []):
                if assignment.get("teamId") == team_id:
                    player["position"] = assignment.get("position") or player["position"]
                    player["jerseyNumber"] = assignment.get("playerNumber") or player["jerseyNumber"]
                    if assignment.get("photoUrl"):
                        player["photoUrl"] = assignment.get("photoUrl")
                    break
            team_players.append(player)
        
        # Also check legacy league_data.players
        league_data = await db.league_data.find_one({"id": "main_league"})
        if league_data and league_data.get("players"):
            for player in league_data["players"]:
                if player.get("team_id") == team_id or player.get("teamId") == team_id:
                    if not any(p.get("id") == player.get("id") for p in team_players):
                        team_players.append(player)
        
        logger.info(f"✅ Loaded {len(team_players)} players for team {team_id}")
        return team_players
        
    except Exception as e:
        logger.error(f"❌ Error fetching team players: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@teams_router.post("/{team_id}/player")
async def add_player_to_team(team_id: str, data: Dict[str, Any]):
    """Add an existing user to a team roster"""
    try:
        user_id = data.get("userId")
        if not user_id:
            raise HTTPException(status_code=400, detail="userId is required")
        
        # Get the user
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if already on team
        existing_assignments = user.get("teamAssignments", [])
        if any(a.get("teamId") == team_id for a in existing_assignments):
            raise HTTPException(status_code=400, detail="User is already on this team")
        
        # Create new team assignment
        new_assignment = {
            "teamId": team_id,
            "playerNumber": data.get("jerseyNumber", ""),
            "position": data.get("position", ""),
            "isPrimary": len(existing_assignments) == 0
        }
        
        # Update user with new team assignment
        await db.users.update_one(
            {"id": user_id},
            {
                "$push": {"teamAssignments": new_assignment},
                "$set": {"updatedAt": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        # If this is their first team, also set teamId
        if len(existing_assignments) == 0:
            await db.users.update_one(
                {"id": user_id},
                {"$set": {"teamId": team_id}}
            )
        
        logger.info(f"✅ Added user {user_id} to team {team_id}")
        
        return {
            "status": "success",
            "message": "Player added to team",
            "assignment": new_assignment
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error adding player to team: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@teams_router.put("/{team_id}/player/{player_id}")
async def update_team_player(team_id: str, player_id: str, data: Dict[str, Any]):
    """Update a player's info on a team (jersey number, position)"""
    try:
        # Get the user
        user = await db.users.find_one({"id": player_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Find and update the team assignment
        assignments = user.get("teamAssignments", [])
        updated = False
        
        for i, assignment in enumerate(assignments):
            if assignment.get("teamId") == team_id:
                if "jerseyNumber" in data:
                    assignments[i]["playerNumber"] = data["jerseyNumber"]
                if "position" in data:
                    assignments[i]["position"] = data["position"]
                updated = True
                break
        
        if not updated:
            raise HTTPException(status_code=404, detail="Player not found on this team")
        
        # Save updated assignments
        await db.users.update_one(
            {"id": player_id},
            {
                "$set": {
                    "teamAssignments": assignments,
                    "updatedAt": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"✅ Updated player {player_id} on team {team_id}")
        
        return {
            "status": "success",
            "message": "Player updated"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating player: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@teams_router.delete("/{team_id}/player/{player_id}")
async def remove_player_from_team(team_id: str, player_id: str):
    """Remove a player from a team roster"""
    try:
        # Get the user
        user = await db.users.find_one({"id": player_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Remove team assignment
        assignments = user.get("teamAssignments", [])
        new_assignments = [a for a in assignments if a.get("teamId") != team_id]
        
        if len(new_assignments) == len(assignments):
            raise HTTPException(status_code=404, detail="Player not found on this team")
        
        # Update user
        update_data = {
            "teamAssignments": new_assignments,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
        
        # If removed from primary team, update teamId
        if user.get("teamId") == team_id:
            if new_assignments:
                # Set to first remaining team
                update_data["teamId"] = new_assignments[0].get("teamId")
            else:
                update_data["teamId"] = None
        
        await db.users.update_one(
            {"id": player_id},
            {"$set": update_data}
        )
        
        logger.info(f"✅ Removed player {player_id} from team {team_id}")
        
        return {
            "status": "success",
            "message": "Player removed from team"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error removing player: {e}")
        raise HTTPException(status_code=500, detail=str(e))
