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


@cleanup_router.get("/team/{team_id}/player-sources")
async def get_team_player_sources(team_id: str):
    """
    Diagnostic: Show ALL sources where players are coming from for a team
    This helps identify where 'phantom' players might be stored
    """
    try:
        sources = {
            "team_id": team_id,
            "users_with_teamId": [],
            "users_with_teamAssignment": [],
            "legacy_league_data_players": [],
            "team_roster_array": [],
            "team_players_array": [],
            "total_unique_players": 0
        }
        
        # Source 1: Users with direct teamId field
        users_direct = await db.users.find(
            {"teamId": team_id},
            {"_id": 0, "id": 1, "name": 1, "email": 1, "status": 1, "teamId": 1}
        ).to_list(1000)
        sources["users_with_teamId"] = users_direct
        
        # Source 2: Users with teamAssignments containing this team
        users_assigned = await db.users.find(
            {"teamAssignments.teamId": team_id},
            {"_id": 0, "id": 1, "name": 1, "email": 1, "status": 1, "teamAssignments": 1}
        ).to_list(1000)
        sources["users_with_teamAssignment"] = [
            {"id": u.get("id"), "name": u.get("name"), "email": u.get("email"), "status": u.get("status")}
            for u in users_assigned
        ]
        
        # Source 3: Legacy league_data.players array
        league_data = await db.league_data.find_one({"id": "main_league"})
        if league_data:
            legacy_players = league_data.get("players", [])
            for p in legacy_players:
                if p.get("teamId") == team_id or p.get("team_id") == team_id:
                    sources["legacy_league_data_players"].append({
                        "id": p.get("id"),
                        "name": p.get("name"),
                        "email": p.get("email"),
                        "teamId": p.get("teamId") or p.get("team_id")
                    })
            
            # Source 4 & 5: Team object roster and players arrays
            teams = league_data.get("teams", [])
            for t in teams:
                if t.get("id") == team_id:
                    roster = t.get("roster", [])
                    if roster:
                        sources["team_roster_array"] = roster
                    
                    players = t.get("players", [])
                    if players:
                        sources["team_players_array"] = players
                    break
        
        # Count unique players
        all_ids = set()
        for u in sources["users_with_teamId"]:
            all_ids.add(u.get("id"))
        for u in sources["users_with_teamAssignment"]:
            all_ids.add(u.get("id"))
        for p in sources["legacy_league_data_players"]:
            all_ids.add(p.get("id"))
        for r in sources["team_roster_array"]:
            if isinstance(r, str):
                all_ids.add(r)
            elif isinstance(r, dict):
                all_ids.add(r.get("id"))
        
        sources["total_unique_players"] = len(all_ids)
        
        return sources
        
    except Exception as e:
        logger.error(f"❌ Error getting player sources: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@cleanup_router.post("/team/{team_id}/clear-all-players")
async def clear_all_team_players(team_id: str, confirm: bool = False):
    """
    Clear ALL player references for a team from ALL sources
    Set confirm=True to actually perform the deletion
    """
    try:
        if not confirm:
            # Preview mode
            sources = await get_team_player_sources(team_id)
            return {
                "preview": True,
                "sources": sources,
                "message": "Set confirm=true to clear all these player references"
            }
        
        results = {
            "users_teamId_cleared": 0,
            "users_teamAssignment_cleared": 0,
            "legacy_players_cleared": 0,
            "team_roster_cleared": 0,
            "team_players_cleared": 0
        }
        
        # Clear Source 1: Users with direct teamId field
        result1 = await db.users.update_many(
            {"teamId": team_id},
            {"$unset": {"teamId": ""}}
        )
        results["users_teamId_cleared"] = result1.modified_count
        
        # Clear Source 2: Remove this team from teamAssignments
        result2 = await db.users.update_many(
            {"teamAssignments.teamId": team_id},
            {"$pull": {"teamAssignments": {"teamId": team_id}}}
        )
        results["users_teamAssignment_cleared"] = result2.modified_count
        
        # Clear Sources 3, 4, 5 from league_data
        league_data = await db.league_data.find_one({"id": "main_league"})
        if league_data:
            modified = False
            
            # Source 3: Remove from legacy players array
            legacy_players = league_data.get("players", [])
            original_count = len(legacy_players)
            league_data["players"] = [
                p for p in legacy_players 
                if p.get("teamId") != team_id and p.get("team_id") != team_id
            ]
            results["legacy_players_cleared"] = original_count - len(league_data["players"])
            if results["legacy_players_cleared"] > 0:
                modified = True
            
            # Sources 4 & 5: Clear team's roster and players arrays
            teams = league_data.get("teams", [])
            for i, t in enumerate(teams):
                if t.get("id") == team_id:
                    if t.get("roster"):
                        results["team_roster_cleared"] = len(t.get("roster", []))
                        teams[i]["roster"] = []
                        modified = True
                    if t.get("players"):
                        results["team_players_cleared"] = len(t.get("players", []))
                        teams[i]["players"] = []
                        modified = True
                    break
            
            if modified:
                league_data["teams"] = teams
                await db.league_data.replace_one(
                    {"id": "main_league"},
                    league_data,
                    upsert=True
                )
        
        total_cleared = sum(results.values())
        logger.info(f"✅ Cleared {total_cleared} player references for team {team_id}")
        
        return {
            "status": "success",
            "results": results,
            "total_cleared": total_cleared
        }
        
    except Exception as e:
        logger.error(f"❌ Error clearing team players: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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


@cleanup_router.get("/orphaned-events/preview")
async def preview_orphaned_events(team_id: str = None):
    """
    Preview events that may be orphaned or associated with invalid teams
    """
    try:
        # Get valid team IDs
        league_data = await db.league_data.find_one({"id": "main_league"})
        valid_team_ids = {t.get("id") for t in league_data.get("teams", [])} if league_data else set()
        
        # Get all events from both collections
        events_from_schedule = await db.league_schedule.find({}, {"_id": 0}).to_list(1000)
        
        orphaned_events = []
        
        for event in events_from_schedule:
            event_teams = event.get("teams", [])
            home_team = event.get("homeTeam")
            away_team = event.get("awayTeam")
            
            # If filtering by team
            if team_id:
                if team_id not in event_teams and team_id != home_team and team_id != away_team:
                    continue
            
            # Check for invalid team references
            invalid_teams = []
            for t in event_teams:
                if t and t not in valid_team_ids:
                    invalid_teams.append(t)
            if home_team and home_team not in valid_team_ids:
                invalid_teams.append(home_team)
            if away_team and away_team not in valid_team_ids:
                invalid_teams.append(away_team)
            
            if invalid_teams:
                orphaned_events.append({
                    "id": event.get("id"),
                    "title": event.get("title"),
                    "date": event.get("date"),
                    "teams": event_teams,
                    "invalid_teams": invalid_teams,
                    "reason": f"References non-existent team(s): {invalid_teams}"
                })
        
        return {
            "total_orphaned": len(orphaned_events),
            "orphaned_events": orphaned_events,
            "valid_teams": list(valid_team_ids)
        }
        
    except Exception as e:
        logger.error(f"❌ Error previewing orphaned events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@cleanup_router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    """Delete a specific event by ID"""
    try:
        result = await db.league_schedule.delete_one({"id": event_id})
        
        if result.deleted_count > 0:
            # Also clean up any RSVPs for this event
            await db.event_rsvps.delete_many({"event_id": event_id})
            
            return {
                "status": "success",
                "message": f"Event {event_id} deleted"
            }
        else:
            raise HTTPException(status_code=404, detail="Event not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@cleanup_router.post("/team/{team_id}/clear-events")
async def clear_team_events(team_id: str):
    """Remove all events associated with a specific team"""
    try:
        # Find and delete events where this team is involved
        result = await db.league_schedule.delete_many({
            "$or": [
                {"teams": team_id},
                {"homeTeam": team_id},
                {"awayTeam": team_id}
            ]
        })
        
        return {
            "status": "success",
            "deleted_count": result.deleted_count,
            "message": f"Deleted {result.deleted_count} events for team {team_id}"
        }
        
    except Exception as e:
        logger.error(f"❌ Error clearing team events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@cleanup_router.post("/team/{team_id}/clear-roster")
async def clear_team_roster(team_id: str):
    """Remove all players from a team's roster (in users collection)"""
    try:
        # Remove team from all user's teamAssignments
        result = await db.users.update_many(
            {"teamAssignments.teamId": team_id},
            {"$pull": {"teamAssignments": {"teamId": team_id}}}
        )
        
        # Also clear the team's roster in league_data
        league_data = await db.league_data.find_one({"id": "main_league"})
        if league_data:
            teams = league_data.get("teams", [])
            for team in teams:
                if team.get("id") == team_id:
                    team["roster"] = []
                    break
            
            await db.league_data.replace_one(
                {"id": "main_league"},
                league_data,
                upsert=True
            )
        
        return {
            "status": "success",
            "users_updated": result.modified_count,
            "message": f"Cleared roster for team {team_id}"
        }
        
    except Exception as e:
        logger.error(f"❌ Error clearing team roster: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= Health Alert Endpoints =============

@cleanup_router.get("/health-alerts/settings")
async def get_health_alert_settings():
    """Get current health alert settings"""
    try:
        league_data = await db.league_data.find_one({"id": "main_league"})
        if not league_data:
            return {
                "enabled": False,
                "recipient_emails": [],
                "orphaned_threshold": 5,
                "pending_users_threshold": 10,
                "legacy_players_threshold": 5
            }
        
        settings = league_data.get("healthAlertSettings", {})
        return {
            "enabled": settings.get("enabled", False),
            "recipient_emails": settings.get("recipient_emails", []),
            "orphaned_threshold": settings.get("orphaned_threshold", 5),
            "pending_users_threshold": settings.get("pending_users_threshold", 10),
            "legacy_players_threshold": settings.get("legacy_players_threshold", 5),
            "last_alert_sent": settings.get("last_alert_sent"),
            "last_check": settings.get("last_check")
        }
    except Exception as e:
        logger.error(f"❌ Error getting health alert settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@cleanup_router.post("/health-alerts/settings")
async def update_health_alert_settings(settings: HealthAlertSettings):
    """Update health alert settings"""
    try:
        await db.league_data.update_one(
            {"id": "main_league"},
            {
                "$set": {
                    "healthAlertSettings": {
                        "enabled": settings.enabled,
                        "recipient_emails": settings.recipient_emails,
                        "orphaned_threshold": settings.orphaned_threshold,
                        "pending_users_threshold": settings.pending_users_threshold,
                        "legacy_players_threshold": settings.legacy_players_threshold
                    }
                }
            },
            upsert=True
        )
        
        return {"status": "success", "message": "Health alert settings updated"}
    except Exception as e:
        logger.error(f"❌ Error updating health alert settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@cleanup_router.post("/health-alerts/check")
async def check_and_send_health_alert(force: bool = False):
    """
    Check database health and send alert if thresholds are exceeded
    Set force=True to send alert regardless of thresholds
    """
    try:
        # Get settings
        league_data = await db.league_data.find_one({"id": "main_league"})
        if not league_data:
            return {"status": "error", "message": "League data not found"}
        
        settings = league_data.get("healthAlertSettings", {})
        
        if not settings.get("enabled") and not force:
            return {"status": "skipped", "message": "Health alerts are disabled"}
        
        recipient_emails = settings.get("recipient_emails", [])
        if not recipient_emails:
            return {"status": "skipped", "message": "No recipient emails configured"}
        
        # Get current health status
        stats = await get_database_stats_internal()
        orphaned = await get_orphaned_preview_internal()
        
        # Check thresholds
        issues = []
        orphaned_count = orphaned.get("total_issues", 0)
        pending_users = stats.get("users", {}).get("pending", 0)
        legacy_players = stats.get("legacy_players", 0)
        
        orphaned_threshold = settings.get("orphaned_threshold", 5)
        pending_threshold = settings.get("pending_users_threshold", 10)
        legacy_threshold = settings.get("legacy_players_threshold", 5)
        
        if orphaned_count >= orphaned_threshold:
            issues.append(f"Orphaned records: {orphaned_count} (threshold: {orphaned_threshold})")
        if pending_users >= pending_threshold:
            issues.append(f"Pending users: {pending_users} (threshold: {pending_threshold})")
        if legacy_players >= legacy_threshold:
            issues.append(f"Legacy players: {legacy_players} (threshold: {legacy_threshold})")
        
        if not issues and not force:
            # Update last check time
            await db.league_data.update_one(
                {"id": "main_league"},
                {"$set": {"healthAlertSettings.last_check": datetime.now(timezone.utc).isoformat()}}
            )
            return {
                "status": "healthy",
                "message": "All metrics within thresholds",
                "stats": {
                    "orphaned_records": orphaned_count,
                    "pending_users": pending_users,
                    "legacy_players": legacy_players
                }
            }
        
        # Send alert email
        smtp_config = league_data.get("smtpConfig")
        if not smtp_config or not smtp_config.get("email"):
            return {"status": "error", "message": "SMTP not configured. Cannot send alerts."}
        
        # Build email content
        league_name = league_data.get("name", "MLBL")
        subject = f"⚠️ Database Health Alert - {league_name}"
        
        issues_html = "".join([f"<li style='margin: 8px 0;'>{issue}</li>" for issue in issues]) if issues else "<li>Manual check requested</li>"
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #dc2626, #f97316); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .alert-box {{ background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .stats-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }}
        .stat-card {{ background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }}
        .stat-value {{ font-size: 24px; font-weight: bold; color: #1e40af; }}
        .stat-label {{ font-size: 12px; color: #64748b; }}
        .cta-button {{ display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Database Health Alert</h1>
            <p>{league_name}</p>
        </div>
        <div class="content">
            <p>The following issues were detected in your database:</p>
            
            <div class="alert-box">
                <ul style="margin: 0; padding-left: 20px;">
                    {issues_html}
                </ul>
            </div>
            
            <h3>Current Statistics</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{stats.get('users', {}).get('active', 0)}</div>
                    <div class="stat-label">Active Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{pending_users}</div>
                    <div class="stat-label">Pending Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{orphaned_count}</div>
                    <div class="stat-label">Orphaned Records</div>
                </div>
            </div>
            
            <p style="text-align: center;">
                <a href="#" class="cta-button">Open Admin Portal</a>
            </p>
            
            <p>To resolve these issues, go to <strong>Admin Portal → Settings → Data Cleanup</strong> and run the cleanup utility.</p>
        </div>
        <div class="footer">
            <p>This is an automated health alert from {league_name}.</p>
            <p>Generated at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
        </div>
    </div>
</body>
</html>
"""
        
        text_body = f"""
Database Health Alert - {league_name}

The following issues were detected:
{chr(10).join(['- ' + issue for issue in issues]) if issues else '- Manual check requested'}

Current Statistics:
- Active Users: {stats.get('users', {}).get('active', 0)}
- Pending Users: {pending_users}
- Orphaned Records: {orphaned_count}

To resolve these issues, go to Admin Portal → Settings → Data Cleanup.

Generated at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
"""
        
        # Send email
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{smtp_config.get('sender_name', league_name)} <{smtp_config['email']}>"
            msg['To'] = ", ".join(recipient_emails)
            
            msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))
            
            with smtplib.SMTP(smtp_config['host'], smtp_config.get('port', 587)) as server:
                server.starttls()
                server.login(smtp_config['email'], smtp_config['password'])
                server.send_message(msg)
            
            # Update last alert sent time
            await db.league_data.update_one(
                {"id": "main_league"},
                {
                    "$set": {
                        "healthAlertSettings.last_alert_sent": datetime.now(timezone.utc).isoformat(),
                        "healthAlertSettings.last_check": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            logger.info(f"✅ Health alert sent to {recipient_emails}")
            return {
                "status": "sent",
                "message": f"Alert sent to {len(recipient_emails)} recipient(s)",
                "recipients": recipient_emails,
                "issues": issues
            }
            
        except Exception as email_error:
            logger.error(f"❌ Failed to send health alert: {email_error}")
            return {"status": "error", "message": f"Failed to send email: {str(email_error)}"}
        
    except Exception as e:
        logger.error(f"❌ Error checking health alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@cleanup_router.post("/health-alerts/test")
async def send_test_health_alert():
    """Send a test health alert email to verify configuration"""
    return await check_and_send_health_alert(force=True)


# Internal helper functions
async def get_database_stats_internal():
    """Internal function to get database stats"""
    stats = {
        "users": {"total": 0, "active": 0, "pending": 0, "inactive": 0},
        "teams": {"total": 0},
        "legacy_players": 0,
        "team_roster_entries": 0
    }
    
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
    
    league_data = await db.league_data.find_one({"id": "main_league"})
    if league_data:
        stats["legacy_players"] = len(league_data.get("players", []))
        teams = league_data.get("teams", [])
        stats["teams"]["total"] = len(teams)
        for team in teams:
            stats["team_roster_entries"] += len(team.get("roster", []))
    
    return stats


async def get_orphaned_preview_internal():
    """Internal function to get orphaned data preview"""
    orphaned_data = {
        "legacy_players": [],
        "orphaned_team_assignments": [],
        "users_without_valid_teams": [],
        "total_issues": 0
    }
    
    active_users = await db.users.find({"status": "active"}, {"_id": 0}).to_list(1000)
    active_user_ids = {u.get("id") for u in active_users}
    active_user_emails = {u.get("email", "").lower() for u in active_users if u.get("email")}
    
    league_data = await db.league_data.find_one({"id": "main_league"})
    
    if league_data:
        legacy_players = league_data.get("players", [])
        teams = league_data.get("teams", [])
        
        for player in legacy_players:
            player_id = player.get("id")
            player_email = player.get("email", "").lower()
            
            if player_id and player_id not in active_user_ids:
                if not player_email or player_email not in active_user_emails:
                    orphaned_data["legacy_players"].append(player)
        
        for team in teams:
            roster = team.get("roster", [])
            for roster_entry in roster:
                if isinstance(roster_entry, str):
                    if roster_entry not in active_user_ids:
                        orphaned_data["orphaned_team_assignments"].append({"teamId": team.get("id"), "playerId": roster_entry})
                elif isinstance(roster_entry, dict):
                    entry_id = roster_entry.get("id") or roster_entry.get("playerId")
                    if entry_id and entry_id not in active_user_ids:
                        orphaned_data["orphaned_team_assignments"].append({"teamId": team.get("id"), "playerId": entry_id})
    
    orphaned_data["total_issues"] = len(orphaned_data["legacy_players"]) + len(orphaned_data["orphaned_team_assignments"])
    
    return orphaned_data
