"""
Data Cleanup Router - Handles cleanup of orphaned data in the database
Helps clean up old/retired users and orphaned references
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# Create router
cleanup_router = APIRouter(prefix="/cleanup", tags=["cleanup"])

# Database reference - set from server.py
db = None

def set_db(database):
    global db
    db = database


class HealthAlertSettings(BaseModel):
    enabled: bool = False
    recipient_emails: List[str] = []
    orphaned_threshold: int = 5
    pending_users_threshold: int = 10
    legacy_players_threshold: int = 5


@cleanup_router.get("/orphaned-players/preview")
async def preview_orphaned_players():
    """
    Preview orphaned player data without deleting anything
    Returns:
    - Players in legacy league_data.players that don't exist in users collection
    - Team roster references to non-existent users
    """
    try:
        orphaned_data = {
            "legacy_players": [],
            "orphaned_team_assignments": [],
            "users_without_valid_teams": [],
            "total_issues": 0
        }
        
        # Get all active users
        active_users = await db.users.find({"status": "active"}, {"_id": 0}).to_list(1000)
        active_user_ids = {u.get("id") for u in active_users}
        active_user_emails = {u.get("email", "").lower() for u in active_users if u.get("email")}
        
        logger.info(f"Found {len(active_users)} active users")
        
        # Get league data
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        if league_data:
            # Check legacy players array
            legacy_players = league_data.get("players", [])
            teams = league_data.get("teams", [])
            
            for player in legacy_players:
                player_id = player.get("id")
                player_email = player.get("email", "").lower()
                player_name = player.get("name", "Unknown")
                
                # Check if this player exists in active users
                if player_id and player_id not in active_user_ids:
                    # Also check by email
                    if not player_email or player_email not in active_user_emails:
                        orphaned_data["legacy_players"].append({
                            "id": player_id,
                            "name": player_name,
                            "email": player.get("email"),
                            "teamId": player.get("teamId") or player.get("team_id"),
                            "reason": "Not found in active users by ID or email"
                        })
            
            # Check for team references to deleted players
            for team in teams:
                team_id = team.get("id")
                team_name = team.get("name", "Unknown Team")
                roster = team.get("roster", [])
                
                for roster_entry in roster:
                    if isinstance(roster_entry, str):
                        # roster is list of IDs
                        if roster_entry not in active_user_ids:
                            orphaned_data["orphaned_team_assignments"].append({
                                "teamId": team_id,
                                "teamName": team_name,
                                "playerId": roster_entry,
                                "reason": "Player ID not found in active users"
                            })
                    elif isinstance(roster_entry, dict):
                        # roster is list of objects
                        entry_id = roster_entry.get("id") or roster_entry.get("playerId")
                        if entry_id and entry_id not in active_user_ids:
                            orphaned_data["orphaned_team_assignments"].append({
                                "teamId": team_id,
                                "teamName": team_name,
                                "playerId": entry_id,
                                "playerName": roster_entry.get("name", "Unknown"),
                                "reason": "Player not found in active users"
                            })
        
        # Check users with invalid team assignments
        for user in active_users:
            team_assignments = user.get("teamAssignments", [])
            for assignment in team_assignments:
                team_id = assignment.get("teamId")
                if team_id:
                    # Verify this team exists
                    team_exists = any(t.get("id") == team_id for t in league_data.get("teams", []))
                    if not team_exists:
                        orphaned_data["users_without_valid_teams"].append({
                            "userId": user.get("id"),
                            "userName": user.get("name"),
                            "invalidTeamId": team_id,
                            "reason": "Team assignment references non-existent team"
                        })
        
        orphaned_data["total_issues"] = (
            len(orphaned_data["legacy_players"]) +
            len(orphaned_data["orphaned_team_assignments"]) +
            len(orphaned_data["users_without_valid_teams"])
        )
        
        logger.info(f"Found {orphaned_data['total_issues']} total orphaned data issues")
        
        return orphaned_data
        
    except Exception as e:
        logger.error(f"❌ Error previewing orphaned players: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@cleanup_router.post("/orphaned-players/clean")
async def clean_orphaned_players():
    """
    Remove orphaned player data
    - Removes entries from legacy league_data.players that don't exist in users
    - Cleans up team roster references to deleted users
    """
    try:
        cleanup_results = {
            "legacy_players_removed": 0,
            "team_roster_entries_removed": 0,
            "invalid_team_assignments_removed": 0,
            "errors": []
        }
        
        # Get all active users
        active_users = await db.users.find({"status": "active"}, {"_id": 0}).to_list(1000)
        active_user_ids = {u.get("id") for u in active_users}
        active_user_emails = {u.get("email", "").lower() for u in active_users if u.get("email")}
        
        # Get league data
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        if league_data:
            modified = False
            
            # Clean legacy players array
            original_players = league_data.get("players", [])
            cleaned_players = []
            
            for player in original_players:
                player_id = player.get("id")
                player_email = player.get("email", "").lower()
                
                # Keep player if they exist in active users
                if player_id in active_user_ids:
                    cleaned_players.append(player)
                elif player_email and player_email in active_user_emails:
                    cleaned_players.append(player)
                else:
                    cleanup_results["legacy_players_removed"] += 1
                    logger.info(f"Removing orphaned player: {player.get('name', 'Unknown')} (id={player_id})")
            
            if len(cleaned_players) != len(original_players):
                league_data["players"] = cleaned_players
                modified = True
            
            # Clean team rosters
            teams = league_data.get("teams", [])
            for i, team in enumerate(teams):
                roster = team.get("roster", [])
                if roster:
                    cleaned_roster = []
                    
                    for roster_entry in roster:
                        if isinstance(roster_entry, str):
                            if roster_entry in active_user_ids:
                                cleaned_roster.append(roster_entry)
                            else:
                                cleanup_results["team_roster_entries_removed"] += 1
                        elif isinstance(roster_entry, dict):
                            entry_id = roster_entry.get("id") or roster_entry.get("playerId")
                            if entry_id in active_user_ids:
                                cleaned_roster.append(roster_entry)
                            else:
                                cleanup_results["team_roster_entries_removed"] += 1
                    
                    if len(cleaned_roster) != len(roster):
                        teams[i]["roster"] = cleaned_roster
                        modified = True
            
            if modified:
                league_data["teams"] = teams
                league_data["lastUpdated"] = datetime.now(timezone.utc).isoformat()
                
                await db.league_data.replace_one(
                    {"id": "main_league"},
                    league_data,
                    upsert=True
                )
                logger.info("✅ League data cleaned and saved")
        
        # Clean invalid team assignments from users
        for user in active_users:
            team_assignments = user.get("teamAssignments", [])
            if team_assignments:
                # Get valid team IDs
                valid_team_ids = {t.get("id") for t in league_data.get("teams", [])}
                
                cleaned_assignments = [
                    a for a in team_assignments 
                    if a.get("teamId") in valid_team_ids
                ]
                
                if len(cleaned_assignments) != len(team_assignments):
                    removed_count = len(team_assignments) - len(cleaned_assignments)
                    cleanup_results["invalid_team_assignments_removed"] += removed_count
                    
                    await db.users.update_one(
                        {"id": user.get("id")},
                        {
                            "$set": {
                                "teamAssignments": cleaned_assignments,
                                "updatedAt": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    logger.info(f"Cleaned {removed_count} invalid assignments for user {user.get('name')}")
        
        total_cleaned = (
            cleanup_results["legacy_players_removed"] +
            cleanup_results["team_roster_entries_removed"] +
            cleanup_results["invalid_team_assignments_removed"]
        )
        
        cleanup_results["status"] = "success"
        cleanup_results["total_cleaned"] = total_cleaned
        cleanup_results["message"] = f"Cleaned {total_cleaned} orphaned data entries"
        
        logger.info(f"✅ Cleanup complete: {cleanup_results}")
        
        return cleanup_results
        
    except Exception as e:
        logger.error(f"❌ Error cleaning orphaned players: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@cleanup_router.get("/database-stats")
async def get_database_stats():
    """Get statistics about the database for cleanup review"""
    try:
        stats = {
            "users": {
                "total": 0,
                "active": 0,
                "pending": 0,
                "inactive": 0
            },
            "teams": {
                "total": 0
            },
            "legacy_players": 0,
            "team_roster_entries": 0
        }
        
        # Count users by status
        all_users = await db.users.find({}, {"_id": 0, "status": 1}).to_list(1000)
        stats["users"]["total"] = len(all_users)
        
        for user in all_users:
            status = user.get("status", "unknown")
            if status == "active":
                stats["users"]["active"] += 1
            elif status == "pending":
                stats["users"]["pending"] += 1
            else:
                stats["users"]["inactive"] += 1
        
        # Get league data stats
        league_data = await db.league_data.find_one({"id": "main_league"})
        if league_data:
            stats["legacy_players"] = len(league_data.get("players", []))
            teams = league_data.get("teams", [])
            stats["teams"]["total"] = len(teams)
            
            for team in teams:
                stats["team_roster_entries"] += len(team.get("roster", []))
        
        return stats
        
    except Exception as e:
        logger.error(f"❌ Error getting database stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@cleanup_router.delete("/inactive-users")
async def remove_inactive_users(confirm: bool = False):
    """
    Remove all inactive/deleted users from the database
    Set confirm=True to actually delete
    """
    try:
        if not confirm:
            # Preview mode - just count
            inactive_users = await db.users.find(
                {"$or": [{"status": "inactive"}, {"status": "deleted"}]},
                {"_id": 0, "id": 1, "name": 1, "email": 1, "status": 1}
            ).to_list(1000)
            
            return {
                "preview": True,
                "count": len(inactive_users),
                "users": inactive_users,
                "message": f"Found {len(inactive_users)} inactive/deleted users. Set confirm=true to delete."
            }
        
        # Actually delete inactive users
        result = await db.users.delete_many(
            {"$or": [{"status": "inactive"}, {"status": "deleted"}]}
        )
        
        return {
            "status": "success",
            "deleted_count": result.deleted_count,
            "message": f"Deleted {result.deleted_count} inactive/deleted users"
        }
        
    except Exception as e:
        logger.error(f"❌ Error removing inactive users: {e}")
        raise HTTPException(status_code=500, detail=str(e))
