"""
Teams Router - Handles team-related operations including roster management
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timezone
import uuid
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# Create router
teams_router = APIRouter(prefix="/team", tags=["teams"])

# Secondary router for /teams prefix endpoints
teams_public_router = APIRouter(prefix="/teams", tags=["teams-public"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database


async def send_join_request_email(
    to_email: str,
    to_name: str,
    subject: str,
    html_content: str,
    text_content: str
):
    """Send email notification for join requests"""
    try:
        # Get SMTP config from league_data
        league_data = await db.league_data.find_one({"id": "main_league"})
        smtp_config = league_data.get("smtpConfig") if league_data else None
        
        if not smtp_config or not smtp_config.get("email"):
            logger.warning("⚠️ Email not configured - skipping notification")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{smtp_config.get('sender_name', 'MLBL')} <{smtp_config['email']}>"
        msg['To'] = to_email
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        with smtplib.SMTP(smtp_config['host'], smtp_config.get('port', 587)) as server:
            server.starttls()
            server.login(smtp_config['email'], smtp_config['password'])
            server.send_message(msg)
        
        logger.info(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {e}")
        return False


async def notify_user_request_received(user_email: str, user_name: str, team_name: str):
    """Send confirmation email to user when they submit a join request"""
    subject = f"Request Received - {team_name}"
    
    text_content = f"""Hi {user_name}!

We've received your request to join {team_name}!

The team admin will review your request and get back to you soon. You'll receive an email notification when your request is approved.

Thanks for your interest in joining the team!

Best regards,
{team_name}
"""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .status-box {{ background: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📬 Request Received!</h1>
            <p>{team_name}</p>
        </div>
        <div class="content">
            <p>Hi {user_name}!</p>
            
            <p>We've received your request to join <strong>{team_name}</strong>!</p>
            
            <div class="status-box">
                <p style="margin: 0;"><strong>Status:</strong> ⏳ Pending Review</p>
            </div>
            
            <p>The team admin will review your request and get back to you soon. You'll receive an email notification when your request is approved.</p>
            
            <p>Thanks for your interest in joining the team!</p>
            
            <p>Best regards,<br><strong>{team_name}</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
    
    await send_join_request_email(user_email, user_name, subject, html_content, text_content)


async def notify_admin_new_request(admin_email: str, admin_name: str, team_name: str, requester_name: str, requester_email: str, position: str, message: str):
    """Send notification to team admin when a new join request is received"""
    subject = f"New Join Request - {requester_name} wants to join {team_name}"
    
    text_content = f"""Hi {admin_name}!

You have a new request to join {team_name}!

Player Details:
- Name: {requester_name}
- Email: {requester_email}
- Position: {position or 'Not specified'}
- Message: {message or 'No message'}

Log in to your team admin portal to approve or decline this request.

Best regards,
{team_name}
"""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .player-card {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e2e8f0; }}
        .player-detail {{ margin: 8px 0; }}
        .label {{ color: #64748b; font-size: 12px; text-transform: uppercase; }}
        .value {{ font-weight: 500; }}
        .message-box {{ background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; font-style: italic; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🆕 New Join Request!</h1>
            <p>{team_name}</p>
        </div>
        <div class="content">
            <p>Hi {admin_name}!</p>
            
            <p>Someone wants to join your team!</p>
            
            <div class="player-card">
                <div class="player-detail">
                    <div class="label">Name</div>
                    <div class="value">{requester_name}</div>
                </div>
                <div class="player-detail">
                    <div class="label">Email</div>
                    <div class="value">{requester_email}</div>
                </div>
                <div class="player-detail">
                    <div class="label">Position</div>
                    <div class="value">{position or 'Not specified'}</div>
                </div>
                {f'<div class="message-box">"{message}"</div>' if message else ''}
            </div>
            
            <p>Log in to your <strong>Team Admin → Recruiting</strong> section to approve or decline this request.</p>
            
            <p>Best regards,<br><strong>{team_name}</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from your league management system.</p>
        </div>
    </div>
</body>
</html>
"""
    
    await send_join_request_email(admin_email, admin_name, subject, html_content, text_content)


async def notify_user_request_approved(user_email: str, user_name: str, team_name: str):
    """Send approval notification to user"""
    subject = f"Welcome to {team_name}! 🎉"
    
    text_content = f"""Hi {user_name}!

Great news - your request to join {team_name} has been approved!

You're now officially part of the team. Log in to the league portal to view the team schedule, roster, and more.

See you on the field!

Best regards,
{team_name}
"""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .status-box {{ background: white; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to the Team!</h1>
            <p>{team_name}</p>
        </div>
        <div class="content">
            <p>Hi {user_name}!</p>
            
            <p>Great news - your request to join <strong>{team_name}</strong> has been approved!</p>
            
            <div class="status-box">
                <p style="margin: 0;"><strong>Status:</strong> ✅ Approved - You're on the team!</p>
            </div>
            
            <p>You're now officially part of the team. Log in to the league portal to view the team schedule, roster, and more.</p>
            
            <p>See you on the field!</p>
            
            <p>Best regards,<br><strong>{team_name}</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
    
    await send_join_request_email(user_email, user_name, subject, html_content, text_content)


async def notify_user_request_rejected(user_email: str, user_name: str, team_name: str, reason: str = ""):
    """Send rejection notification to user"""
    subject = f"Update on your {team_name} request"
    
    reason_text = f"\n\nReason: {reason}" if reason else ""
    
    text_content = f"""Hi {user_name}!

Thank you for your interest in joining {team_name}.

Unfortunately, we're unable to approve your request at this time.{reason_text}

We appreciate your interest and encourage you to check back in the future!

Best regards,
{team_name}
"""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #64748b, #94a3b8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .status-box {{ background: white; border-left: 4px solid #94a3b8; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Request Update</h1>
            <p>{team_name}</p>
        </div>
        <div class="content">
            <p>Hi {user_name}!</p>
            
            <p>Thank you for your interest in joining <strong>{team_name}</strong>.</p>
            
            <div class="status-box">
                <p style="margin: 0;">Unfortunately, we're unable to approve your request at this time.</p>
                {f'<p style="margin: 10px 0 0 0; color: #64748b;"><em>{reason}</em></p>' if reason else ''}
            </div>
            
            <p>We appreciate your interest and encourage you to check back in the future!</p>
            
            <p>Best regards,<br><strong>{team_name}</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
    
    await send_join_request_email(user_email, user_name, subject, html_content, text_content)


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
                "teamAssignments": user.get("teamAssignments", []),
                # Payment and availability fields (user-level defaults)
                "paymentStatus": user.get("paymentStatus", "unpaid"),
                "amountPaid": user.get("amountPaid", 0),
                "amountOwed": user.get("amountOwed", 0),
                "paymentNotes": user.get("paymentNotes", ""),
                "lastPaymentDate": user.get("lastPaymentDate", ""),
                "availability": user.get("availability", "active"),
                # Additional fields for player management
                "graduationYear": user.get("graduationYear", ""),
                "height": user.get("height", ""),
                "weight": user.get("weight", ""),
                "school": user.get("school", ""),
                "emergencyContactName": user.get("emergencyContactName", ""),
                "emergencyContactPhone": user.get("emergencyContactPhone", ""),
                "emergencyContactRelationship": user.get("emergencyContactRelationship", ""),
                "jerseySize": user.get("jerseySize", "")
            }
            # Get team-specific info from teamAssignments if available
            for assignment in user.get("teamAssignments", []):
                if assignment.get("teamId") == team_id:
                    player["position"] = assignment.get("position") or player["position"]
                    player["jerseyNumber"] = assignment.get("playerNumber") or player["jerseyNumber"]
                    if assignment.get("photoUrl"):
                        player["photoUrl"] = assignment.get("photoUrl")
                    # Team-specific payment/availability overrides
                    if "paymentStatus" in assignment:
                        player["paymentStatus"] = assignment["paymentStatus"]
                    if "amountPaid" in assignment:
                        player["amountPaid"] = assignment["amountPaid"]
                    if "amountOwed" in assignment:
                        player["amountOwed"] = assignment["amountOwed"]
                    if "paymentNotes" in assignment:
                        player["paymentNotes"] = assignment["paymentNotes"]
                    if "lastPaymentDate" in assignment:
                        player["lastPaymentDate"] = assignment["lastPaymentDate"]
                    if "paymentMethod" in assignment:
                        player["paymentMethod"] = assignment["paymentMethod"]
                    if "checkNumber" in assignment:
                        player["checkNumber"] = assignment["checkNumber"]
                    if "availability" in assignment:
                        player["availability"] = assignment["availability"]
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



@teams_router.post("/{team_id}/create-player")
async def create_team_player(team_id: str, data: Dict[str, Any]):
    """Create a new player and add them directly to a team (for team admins)"""
    try:
        # Validate required fields
        if not data.get("name"):
            raise HTTPException(status_code=400, detail="Player name is required")
        
        # Check if email already exists (if provided)
        if data.get("email"):
            existing_user = await db.users.find_one({"email": data["email"].lower().strip()})
            if existing_user:
                raise HTTPException(status_code=400, detail="A user with this email already exists")
        
        # Create the new player
        new_player = {
            "id": str(uuid.uuid4()),
            "name": data.get("name", "").strip(),
            "email": data.get("email", "").lower().strip() if data.get("email") else "",
            "phone": data.get("phone", "").strip(),
            "position": data.get("position", "").strip(),
            "jerseyNumber": data.get("jerseyNumber", "").strip(),
            "playerNumber": data.get("jerseyNumber", "").strip(),  # Alias for compatibility
            "teamId": team_id,
            "teamAssignments": [{
                "teamId": team_id,
                "position": data.get("position", "").strip(),
                "playerNumber": data.get("jerseyNumber", "").strip(),
                "isPrimary": True
            }],
            "roles": ["player"],
            "status": "active",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "createdByTeamAdmin": True
        }
        
        await db.users.insert_one(new_player)
        
        logger.info(f"✅ Team admin created new player: {new_player['name']} (#{new_player.get('jerseyNumber', 'N/A')}) for team {team_id}")
        
        return {
            "status": "success",
            "message": f"Player {new_player['name']} created and added to team",
            "playerId": new_player["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating player: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@teams_router.put("/{team_id}/player/{player_id}")
async def update_team_player(team_id: str, player_id: str, data: Dict[str, Any]):
    """Update a player's info on a team - coaches can edit all player details"""
    try:
        # Get the user
        user = await db.users.find_one({"id": player_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Verify player is on this team
        assignments = user.get("teamAssignments", [])
        team_assignment_idx = None
        
        for i, assignment in enumerate(assignments):
            if assignment.get("teamId") == team_id:
                team_assignment_idx = i
                break
        
        if team_assignment_idx is None:
            raise HTTPException(status_code=404, detail="Player not found on this team")
        
        # Build update data - separate user-level and team-level updates
        user_update = {}
        
        # User-level fields that coaches can update
        user_fields = [
            "name", "email", "phone", "photoUrl", 
            "graduationYear", "height", "weight", "school",
            "emergencyContactName", "emergencyContactPhone", "emergencyContactRelationship",
            "jerseySize", "funFacts", "lacrosseHistory", "socialMedia"
        ]
        
        for field in user_fields:
            if field in data and data[field] is not None:
                user_update[field] = data[field]
        
        # Team-specific fields go into the team assignment
        if "jerseyNumber" in data:
            assignments[team_assignment_idx]["playerNumber"] = data["jerseyNumber"]
        if "position" in data:
            assignments[team_assignment_idx]["position"] = data["position"]
        if "availability" in data:
            assignments[team_assignment_idx]["availability"] = data["availability"]
            # Also update at user level if this is primary team
            if user.get("teamId") == team_id:
                user_update["availability"] = data["availability"]
        
        user_update["teamAssignments"] = assignments
        user_update["updatedAt"] = datetime.now(timezone.utc).isoformat()
        
        # Also update legacy fields for compatibility
        if "jerseyNumber" in data and user.get("teamId") == team_id:
            user_update["playerNumber"] = data["jerseyNumber"]
        if "position" in data and user.get("teamId") == team_id:
            user_update["position"] = data["position"]
        
        # Save updates
        await db.users.update_one(
            {"id": player_id},
            {"$set": user_update}
        )
        
        logger.info(f"✅ Updated player {player_id} on team {team_id}: {list(user_update.keys())}")
        
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


@teams_router.put("/{team_id}/player/{player_id}/payment")
async def update_player_payment(team_id: str, player_id: str, data: Dict[str, Any]):
    """Update a player's payment status for a team"""
    try:
        # Get the user
        user = await db.users.find_one({"id": player_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Verify player is on this team
        assignments = user.get("teamAssignments", [])
        team_assignment_idx = None
        
        for i, assignment in enumerate(assignments):
            if assignment.get("teamId") == team_id:
                team_assignment_idx = i
                break
        
        if team_assignment_idx is None:
            raise HTTPException(status_code=404, detail="Player not found on this team")
        
        # Update payment fields in the team assignment
        payment_fields = ["paymentStatus", "amountPaid", "amountOwed", "paymentNotes", "lastPaymentDate", "paymentMethod", "checkNumber"]
        for field in payment_fields:
            if field in data:
                assignments[team_assignment_idx][field] = data[field]
        
        # Also store at user level for convenience
        user_update = {
            "teamAssignments": assignments,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
        
        # If this is the primary team, also update user-level payment fields
        if user.get("teamId") == team_id:
            for field in payment_fields:
                if field in data:
                    user_update[field] = data[field]
        
        await db.users.update_one(
            {"id": player_id},
            {"$set": user_update}
        )
        
        logger.info(f"✅ Updated payment for player {player_id} on team {team_id}: {data.get('paymentStatus')} via {data.get('paymentMethod', 'unknown')}")
        
        return {
            "status": "success",
            "message": "Payment status updated"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating player payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ============================================================================
# Public Team Endpoints (for /join/{team_id} page)
# ============================================================================

@teams_public_router.get("/{team_id}/public")
async def get_team_public_info(team_id: str):
    """Get public team information for the join page (no auth required)"""
    try:
        # First check the teams collection
        team = await db.teams.find_one({"id": team_id}, {"_id": 0})
        
        if not team:
            # Fallback to league_data.teams
            league_data = await db.league_data.find_one({"id": "main_league"})
            if league_data and league_data.get("teams"):
                for t in league_data["teams"]:
                    if t.get("id") == team_id:
                        team = t
                        break
        
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Return only public-safe information
        return {
            "id": team.get("id"),
            "name": team.get("name"),
            "division": team.get("division"),
            "type": team.get("type"),
            "style": {
                "primaryColor": team.get("style", {}).get("primaryColor") or team.get("primaryColor"),
                "logoUrl": team.get("style", {}).get("logoUrl") or team.get("logoUrl"),
                "bannerUrl": team.get("style", {}).get("bannerUrl") or team.get("bannerUrl")
            },
            "sportType": team.get("sportType")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching public team info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@teams_public_router.post("/{team_id}/join-requests")
async def submit_join_request(team_id: str, data: Dict[str, Any]):
    """Submit a request to join a team (public endpoint)"""
    try:
        # Validate team exists
        team = await db.teams.find_one({"id": team_id}, {"_id": 0})
        if not team:
            league_data = await db.league_data.find_one({"id": "main_league"})
            if league_data and league_data.get("teams"):
                team = next((t for t in league_data["teams"] if t.get("id") == team_id), None)
        
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Validate required fields
        if not data.get("name"):
            raise HTTPException(status_code=400, detail="Name is required")
        if not data.get("email"):
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Check for duplicate pending request with same email
        existing_request = await db.join_requests.find_one({
            "teamId": team_id,
            "email": data.get("email").lower().strip(),
            "status": "pending"
        })
        
        if existing_request:
            raise HTTPException(status_code=400, detail="You already have a pending request for this team")
        
        # Create join request
        join_request = {
            "id": str(uuid.uuid4()),
            "teamId": team_id,
            "teamName": team.get("name"),
            "name": data.get("name", "").strip(),
            "email": data.get("email", "").lower().strip(),
            "phone": data.get("phone", "").strip(),
            "position": data.get("position", "").strip(),
            "desiredNumber": data.get("desiredNumber", "").strip(),
            "experience": data.get("experience", ""),
            "message": data.get("message", "").strip(),
            "status": "pending",
            "requestedAt": datetime.now(timezone.utc).isoformat(),
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        
        await db.join_requests.insert_one(join_request)
        
        logger.info(f"✅ New join request from {join_request['name']} for team {team.get('name')}")
        
        # Send email notifications (async, don't block response)
        team_name = team.get("name", "Team")
        user_name = join_request["name"]
        user_email = join_request["email"]
        
        # 1. Send confirmation email to user
        try:
            await notify_user_request_received(user_email, user_name, team_name)
        except Exception as email_err:
            logger.warning(f"⚠️ Failed to send user confirmation email: {email_err}")
        
        # 2. Send notification to team admin(s)
        try:
            # Find team admins/coaches
            team_admins = await db.users.find({
                "$or": [
                    {"teamId": team_id, "roles": {"$in": ["coach", "admin", "league_admin"]}},
                    {"teamAssignments.teamId": team_id, "roles": {"$in": ["coach", "admin", "league_admin"]}}
                ]
            }, {"_id": 0, "email": 1, "name": 1}).to_list(10)
            
            for admin in team_admins:
                if admin.get("email"):
                    await notify_admin_new_request(
                        admin["email"],
                        admin.get("name", "Team Admin"),
                        team_name,
                        user_name,
                        user_email,
                        join_request.get("position", ""),
                        join_request.get("message", "")
                    )
        except Exception as admin_email_err:
            logger.warning(f"⚠️ Failed to send admin notification email: {admin_email_err}")
        
        return {
            "status": "success",
            "message": "Join request submitted successfully",
            "requestId": join_request["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error submitting join request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Team Admin Endpoints for Join Requests (authenticated)
# ============================================================================

@teams_router.get("/{team_id}/requests")
async def get_team_join_requests(team_id: str):
    """Get pending join requests for a team (for team admins)"""
    try:
        cursor = db.join_requests.find(
            {"teamId": team_id, "status": "pending"},
            {"_id": 0}
        ).sort("requestedAt", -1)
        
        requests = await cursor.to_list(100)
        
        logger.info(f"✅ Loaded {len(requests)} pending join requests for team {team_id}")
        
        return {"requests": requests}
        
    except Exception as e:
        logger.error(f"❌ Error fetching join requests: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@teams_router.put("/{team_id}/requests/{request_id}")
async def handle_join_request(team_id: str, request_id: str, data: Dict[str, Any]):
    """Approve or reject a join request"""
    try:
        action = data.get("action")  # 'approve' or 'reject'
        
        if action not in ["approve", "reject"]:
            raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
        
        # Get the request
        join_request = await db.join_requests.find_one(
            {"id": request_id, "teamId": team_id},
            {"_id": 0}
        )
        
        if not join_request:
            raise HTTPException(status_code=404, detail="Join request not found")
        
        if join_request.get("status") != "pending":
            raise HTTPException(status_code=400, detail="Request has already been processed")
        
        team_name = join_request.get("teamName", "Team")
        user_name = join_request.get("name", "Player")
        user_email = join_request.get("email")
        
        if action == "approve":
            # Check if user already exists with this email
            existing_user = await db.users.find_one({"email": join_request["email"]}, {"_id": 0})
            
            if existing_user:
                # Add team to existing user
                user_id = existing_user["id"]
                existing_assignments = existing_user.get("teamAssignments", [])
                
                if not any(a.get("teamId") == team_id for a in existing_assignments):
                    new_assignment = {
                        "teamId": team_id,
                        "position": join_request.get("position", ""),
                        "playerNumber": "",
                        "isPrimary": len(existing_assignments) == 0
                    }
                    
                    await db.users.update_one(
                        {"id": user_id},
                        {
                            "$push": {"teamAssignments": new_assignment},
                            "$set": {"updatedAt": datetime.now(timezone.utc).isoformat()}
                        }
                    )
                    
                    if len(existing_assignments) == 0:
                        await db.users.update_one(
                            {"id": user_id},
                            {"$set": {"teamId": team_id}}
                        )
            else:
                # Create a new user record (active since they've been approved)
                new_user = {
                    "id": str(uuid.uuid4()),
                    "name": join_request.get("name"),
                    "email": join_request.get("email"),
                    "phone": join_request.get("phone", ""),
                    "position": join_request.get("position", ""),
                    "playerNumber": join_request.get("desiredNumber", ""),
                    "teamId": team_id,
                    "teamAssignments": [{
                        "teamId": team_id,
                        "position": join_request.get("position", ""),
                        "playerNumber": join_request.get("desiredNumber", ""),
                        "isPrimary": True
                    }],
                    "roles": ["player"],
                    "status": "active",  # Set as active so they show up in roster
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                    "joinRequestId": request_id
                }
                
                await db.users.insert_one(new_user)
                logger.info(f"✅ Created new active player: {new_user['name']} ({new_user['id']}) - Jersey #{new_user.get('playerNumber', 'N/A')}")
            
            # Update request status
            await db.join_requests.update_one(
                {"id": request_id},
                {
                    "$set": {
                        "status": "approved",
                        "processedAt": datetime.now(timezone.utc).isoformat(),
                        "processedBy": data.get("processedBy")
                    }
                }
            )
            
            logger.info(f"✅ Approved join request {request_id} for {join_request.get('name')}")
            
            # Send approval email to user
            try:
                await notify_user_request_approved(user_email, user_name, team_name)
            except Exception as email_err:
                logger.warning(f"⚠️ Failed to send approval email: {email_err}")
            
            return {
                "status": "success",
                "message": f"Request approved. {join_request.get('name')} has been added to the team."
            }
            
        else:  # reject
            await db.join_requests.update_one(
                {"id": request_id},
                {
                    "$set": {
                        "status": "rejected",
                        "processedAt": datetime.now(timezone.utc).isoformat(),
                        "processedBy": data.get("processedBy"),
                        "rejectionReason": data.get("reason", "")
                    }
                }
            )
            
            logger.info(f"✅ Rejected join request {request_id}")
            
            # Send rejection email to user
            try:
                await notify_user_request_rejected(user_email, user_name, team_name, data.get("reason", ""))
            except Exception as email_err:
                logger.warning(f"⚠️ Failed to send rejection email: {email_err}")
            
            return {
                "status": "success",
                "message": "Request has been declined"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error processing join request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@teams_router.get("/{team_id}/invites")
async def get_team_invites(team_id: str):
    """Get sent invites for a team"""
    try:
        cursor = db.team_invites.find(
            {"teamId": team_id},
            {"_id": 0}
        ).sort("sentAt", -1)
        
        invites = await cursor.to_list(100)
        
        return {"invites": invites}
        
    except Exception as e:
        logger.error(f"❌ Error fetching team invites: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@teams_router.post("/{team_id}/invite")
async def send_team_invite(team_id: str, data: Dict[str, Any]):
    """Send an invite to join a team via email"""
    try:
        email = data.get("email", "").lower().strip()
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Check for existing invite
        existing_invite = await db.team_invites.find_one({
            "teamId": team_id,
            "email": email,
            "status": "pending"
        })
        
        if existing_invite:
            raise HTTPException(status_code=400, detail="An invite has already been sent to this email")
        
        # Get team info
        team = await db.teams.find_one({"id": team_id}, {"_id": 0, "name": 1})
        if not team:
            league_data = await db.league_data.find_one({"id": "main_league"})
            if league_data and league_data.get("teams"):
                team = next((t for t in league_data["teams"] if t.get("id") == team_id), None)
        
        team_name = team.get("name") if team else "Team"
        
        # Create invite record
        invite = {
            "id": str(uuid.uuid4()),
            "teamId": team_id,
            "teamName": team_name,
            "email": email,
            "message": data.get("message", ""),
            "invitedBy": data.get("invitedBy"),
            "status": "pending",
            "sentAt": datetime.now(timezone.utc).isoformat()
        }
        
        await db.team_invites.insert_one(invite)
        
        # TODO: Actually send the email (integrate with email service)
        # For now, just record the invite
        
        logger.info(f"✅ Team invite created for {email} to join {team_name}")
        
        return {
            "status": "success",
            "message": f"Invite recorded for {email}",
            "inviteId": invite["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sending team invite: {e}")
        raise HTTPException(status_code=500, detail=str(e))
