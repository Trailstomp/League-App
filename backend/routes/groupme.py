"""
GroupMe Router - Handles GroupMe integration, channels, messages, broadcasting, notifications
Extracted from server.py during backend refactoring
"""
from fastapi import APIRouter, HTTPException, Form, Request
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import uuid
import json
import os
import logging

logger = logging.getLogger("server")

groupme_router = APIRouter(tags=["groupme"])

db = None

def set_db(database):
    global db
    db = database

# Import needed classes
try:
    from services.api_integrations_service import APIIntegrationsService
except ImportError:
    APIIntegrationsService = None

# SimpleGroupMeService is defined in server.py and injected via set_groupme_service
_SimpleGroupMeServiceClass = None

def set_groupme_service_class(cls):
    global _SimpleGroupMeServiceClass
    _SimpleGroupMeServiceClass = cls

async def get_groupme_service():
    """Get GroupMe service with stored credentials"""
    if not APIIntegrationsService:
        raise HTTPException(status_code=500, detail="GroupMe services not available")
    
    service = APIIntegrationsService(db)
    credentials = await service.get_groupme_credentials()
    
    if not credentials:
        raise HTTPException(status_code=400, detail="GroupMe not configured. Please configure GroupMe integration in API settings.")
    
    access_token = credentials.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="GroupMe access token not found in configuration.")
    
    if _SimpleGroupMeServiceClass:
        return _SimpleGroupMeServiceClass(access_token)
    
    # Fallback: create a minimal service inline
    class MinimalGroupMeService:
        def __init__(self, token):
            self.access_token = token
            self.base_url = "https://api.groupme.com/v3"
        async def create_bot(self, group_id, bot_name, callback_url):
            import urllib.request
            url = f"{self.base_url}/bots?token={self.access_token}"
            data = {"bot": {"name": bot_name, "group_id": group_id, "callback_url": callback_url}}
            request = urllib.request.Request(url, json.dumps(data).encode(), {"Content-Type": "application/json"})
            with urllib.request.urlopen(request) as response:
                return json.loads(response.read().decode())
    
    return MinimalGroupMeService(access_token)

# GroupMe webhook secret
GROUPME_WEBHOOK_SECRET = os.environ.get("GROUPME_WEBHOOK_SECRET", "")

@groupme_router.get("/groupme/groups")
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
@groupme_router.post("/groupme/channels")
async def create_groupme_channel(
    name: str = Form(...),
    groupme_group_id: str = Form(...),
    channel_type: str = Form(...),  # 'league' or 'team'
    team_id: Optional[str] = Form(None),
    team_ids: Optional[str] = Form(None),  # JSON array of team IDs for multi-select
    existing_bot_id: Optional[str] = Form(None),  # Allow existing bot ID
    notification_settings: Optional[str] = Form("{}"),  # JSON string
    access_roles: Optional[str] = Form('["admin", "coach", "player"]')  # JSON array of roles
):
    """Create a new GroupMe channel configuration"""
    
    try:
        # Parse notification settings and access roles
        settings = json.loads(notification_settings) if notification_settings else {}
        roles = json.loads(access_roles) if access_roles else ["admin", "coach", "player"]
        parsed_team_ids = json.loads(team_ids) if team_ids else []
        
        # Use team_ids if provided, otherwise use single team_id
        if not parsed_team_ids and team_id:
            parsed_team_ids = [team_id]
        
        # Validate channel type
        if channel_type not in ["league", "team"]:
            raise HTTPException(status_code=400, detail="channel_type must be 'league' or 'team'")
        
        # Validate teams exist if team channel
        if channel_type == "team":
            if not parsed_team_ids:
                raise HTTPException(status_code=400, detail="At least one team_id required for team channels")
            
            # Check if teams exist
            league_doc = await db.league_data.find_one({"id": "main_league"})
            if league_doc and league_doc.get("teams"):
                for tid in parsed_team_ids:
                    team = next((t for t in league_doc["teams"] if t.get("id") == tid), None)
                    if not team:
                        raise HTTPException(status_code=404, detail=f"Team {tid} not found")
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
            # Use existing bot ID - no need to call GroupMe API
            bot_id = existing_bot_id
            logger.info(f"Using existing bot ID: {bot_id}")
        else:
            # Need GroupMe API service to create bot
            groupme_service = await get_groupme_service()
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
            "team_id": parsed_team_ids[0] if parsed_team_ids else None,  # Keep for backwards compat
            "team_ids": parsed_team_ids,  # New multi-team support
            "access_roles": roles,  # New role-based access
            "is_active": True,
            "notification_settings": settings,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
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
# GROUPME_WEBHOOK_SECRET already defined above

@groupme_router.get("/groupme/channels")
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

@groupme_router.get("/groupme/channels/{channel_id}/messages")
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

@groupme_router.delete("/groupme/channels/{channel_id}")
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

@groupme_router.patch("/groupme/channels/{channel_id}")
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

@groupme_router.post("/groupme/webhook")
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
            "updated_at": datetime.now(timezone.utc).isoformat(),
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
            rsvp_record['created_at'] = datetime.now(timezone.utc).isoformat()
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
            "updated_at": datetime.now(timezone.utc).isoformat(),
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
            rsvp_record['created_at'] = datetime.now(timezone.utc).isoformat()
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
    now = datetime.now(timezone.utc)
    
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
        "response_time": datetime.now(timezone.utc).isoformat(),
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
    
    now = datetime.now(timezone.utc)
    
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
        base_url = os.environ.get('REACT_APP_BACKEND_URL', 'https://league-manager-35.preview.emergentagent.com')
        
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

@groupme_router.post("/groupme/broadcast")
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
                recent_time = datetime.now(timezone.utc).timestamp() - 5  # Within last 5 seconds
                
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
                        "created_at": int(datetime.now(timezone.utc).timestamp()),
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
                "sent_at": datetime.now(timezone.utc).isoformat(),
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

@groupme_router.get("/groupme/events/{event_id}/rsvps")
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

@groupme_router.get("/groupme/dashboard/stats")
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
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
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
@groupme_router.post("/groupme/send-event-notification")
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
            frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000')).replace('/api', '')
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
            "sent_at": datetime.now(timezone.utc).isoformat(),
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

@groupme_router.get("/groupme/event-notifications")
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

@groupme_router.get("/groupme/events/{event_id}/rsvp-summary")
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

# ==================== ENHANCED GROUPME NOTIFICATIONS WITH IMAGES ====================

@groupme_router.post("/groupme/send-enhanced-notification")
async def send_enhanced_event_notification(
    event_id: str = Form(...),
    channel_ids: str = Form(...),  # JSON string array
    notification_type: str = Form("event_announcement"),
    include_image: bool = Form(True),
    include_calendar_link: bool = Form(True),
    include_rsvp: bool = Form(True)
):
    """
    Send enhanced event notification with visual card image, Google Calendar link, and RSVP
    
    This creates a rich GroupMe message with:
    - Visual event card image with team branding
    - Google Calendar "Add to Calendar" link
    - RSVP link and text commands
    """
    try:
        from services.event_card_service import event_card_service
        import json
        import base64
        
        # Parse channel IDs
        channel_ids_list = json.loads(channel_ids)
        
        # Try to find event in multiple locations
        target_event = None
        
        # First, check unified_events collection
        unified_event = await db.unified_events.find_one({"id": event_id}, {"_id": 0})
        if unified_event:
            target_event = unified_event
            logger.info(f"Found event in unified_events: {event_id}")
        
        # If not found, check leagueSchedule in league_data
        if not target_event:
            event_doc = await db.league_data.find_one({"leagueSchedule.id": event_id})
            if event_doc:
                for e in event_doc.get("leagueSchedule", []):
                    if e.get("id") == event_id:
                        target_event = e
                        logger.info(f"Found event in leagueSchedule: {event_id}")
                        break
        
        if not target_event:
            logger.error(f"Event not found anywhere: {event_id}")
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Parse event datetime
        event_datetime = None
        try:
            if target_event.get("start_datetime"):
                event_datetime = datetime.fromisoformat(target_event["start_datetime"].replace('Z', '+00:00'))
            elif target_event.get("date") and target_event.get("time"):
                date_str = target_event["date"]
                time_str = target_event["time"]
                # Parse date
                date_obj = datetime.strptime(date_str, '%Y-%m-%d') if '-' in date_str else datetime.fromisoformat(date_str)
                # Parse time (handle various formats)
                try:
                    time_parts = time_str.replace(' ', '').upper()
                    if 'PM' in time_parts or 'AM' in time_parts:
                        time_obj = datetime.strptime(time_parts, '%I:%M%p')
                    else:
                        time_obj = datetime.strptime(time_str, '%H:%M')
                    event_datetime = date_obj.replace(hour=time_obj.hour, minute=time_obj.minute)
                except:
                    event_datetime = date_obj
            elif target_event.get("date"):
                date_str = target_event["date"]
                event_datetime = datetime.strptime(date_str, '%Y-%m-%d') if '-' in date_str else datetime.fromisoformat(date_str)
        except Exception as e:
            logger.warning(f"Could not parse event datetime: {e}")
        
        # Get team info for styling
        team_data = None
        team_id = target_event.get("team_id") or target_event.get("homeTeam")
        if team_id:
            team = await db.teams.find_one({"id": team_id}, {"_id": 0})
            if team:
                team_data = {
                    "name": team.get("name", ""),
                    "primaryColor": team.get("style", {}).get("primaryColor", "#2563eb"),
                    "accentColor": team.get("style", {}).get("accentColor", "#3b82f6"),
                    "logoUrl": team.get("style", {}).get("logoUrl")
                }
        
        # Get RSVP stats
        rsvps_cursor = db.event_rsvps.find({"event_id": event_id})
        rsvps = await rsvps_cursor.to_list(length=None)
        rsvp_stats = {
            "yes": len([r for r in rsvps if r.get("response") == "yes"]),
            "no": len([r for r in rsvps if r.get("response") == "no"]),
            "maybe": len([r for r in rsvps if r.get("response") == "maybe"])
        }
        
        # Generate URLs
        frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000')).replace('/api', '').rstrip('/')
        rsvp_url = f"{frontend_url}/quick-rsvp/{event_id}"
        
        # Generate Google Calendar URL
        calendar_url = None
        if include_calendar_link and event_datetime:
            calendar_url = event_card_service.generate_google_calendar_url(
                title=target_event.get("title", "Event"),
                start_datetime=event_datetime,
                location=target_event.get("location"),
                description=target_event.get("description")
            )
        
        # Generate event card image
        image_attachment = None
        if include_image:
            event_data = {
                "title": target_event.get("title", "Event"),
                "event_type": target_event.get("type", target_event.get("event_type", "event")),
                "start_datetime": event_datetime,
                "location": target_event.get("location"),
                "description": target_event.get("description")
            }
            
            image_bytes = event_card_service.generate_event_card(
                event_data=event_data,
                team_data=team_data,
                rsvp_stats=rsvp_stats,
                rsvp_url=rsvp_url
            )
            
            if image_bytes:
                # Upload image to GroupMe's image service
                try:
                    groupme_service = await get_groupme_service()
                    if groupme_service:
                        # GroupMe image upload endpoint
                        import requests
                        upload_url = "https://image.groupme.com/pictures"
                        headers = {
                            "X-Access-Token": groupme_service.access_token,
                            "Content-Type": "image/png"
                        }
                        
                        upload_response = requests.post(upload_url, headers=headers, data=image_bytes)
                        if upload_response.status_code == 200:
                            image_url = upload_response.json().get("payload", {}).get("url")
                            if image_url:
                                image_attachment = {
                                    "type": "image",
                                    "url": image_url
                                }
                                logger.info(f"Uploaded event card image: {image_url}")
                except Exception as e:
                    logger.warning(f"Could not upload image to GroupMe: {e}")
        
        # Build message text
        formatted_date = event_datetime.strftime("%A, %B %d at %I:%M %p") if event_datetime else "TBD"
        
        notification_templates = {
            "event_announcement": f"📢 NEW EVENT\n\n🏆 {target_event['title']}\n📅 {formatted_date}",
            "rsvp_reminder": f"⏰ RSVP REMINDER\n\n🏆 {target_event['title']}\n📅 {formatted_date}",
            "event_update": f"✏️ EVENT UPDATED\n\n🏆 {target_event['title']}\n📅 {formatted_date}",
            "last_call": f"🚨 LAST CALL\n\n🏆 {target_event['title']}\n📅 {formatted_date}"
        }
        
        message = notification_templates.get(notification_type, notification_templates["event_announcement"])
        
        # Add location
        if target_event.get("location"):
            message += f"\n📍 {target_event['location']}"
        
        # Add RSVP stats
        message += f"\n\n✅ {rsvp_stats['yes']} Yes  ❌ {rsvp_stats['no']} No  ❓ {rsvp_stats['maybe']} Maybe"
        
        # Add calendar link
        if calendar_url:
            message += f"\n\n📆 Add to Calendar:\n{calendar_url}"
        
        # Add RSVP link
        if include_rsvp:
            message += f"\n\n🎯 RSVP Here:\n{rsvp_url}"
            message += f"\n\n💬 Or reply: yes / no / maybe"
        
        # Send to channels
        success_channels = []
        failed_channels = []
        
        groupme_service = await get_groupme_service()
        if not groupme_service:
            raise HTTPException(status_code=400, detail="GroupMe not configured")
        
        for channel_id in channel_ids_list:
            try:
                channel = await db.groupme_channels.find_one({"id": channel_id, "is_active": True})
                if channel and channel.get("groupme_bot_id"):
                    # Send message with image attachment if available
                    image_url = image_attachment.get("url") if image_attachment else None
                    success = await _send_groupme_message(
                        channel["groupme_bot_id"],
                        message,
                        image_url=image_url
                    )
                    
                    if success:
                        success_channels.append(channel_id)
                    else:
                        failed_channels.append(channel_id)
                else:
                    failed_channels.append(channel_id)
            except Exception as e:
                logger.error(f"Failed to send to channel {channel_id}: {e}")
                failed_channels.append(channel_id)
        
        # Store notification record
        notification_record = {
            "id": str(uuid.uuid4()),
            "event_id": event_id,
            "event_title": target_event["title"],
            "notification_type": notification_type,
            "enhanced": True,
            "include_image": include_image,
            "include_calendar_link": include_calendar_link,
            "image_uploaded": image_attachment is not None,
            "calendar_url": calendar_url,
            "rsvp_url": rsvp_url,
            "channel_ids": channel_ids_list,
            "message": message,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "success_channels": success_channels,
            "failed_channels": failed_channels,
            "total_sent": len(success_channels)
        }
        
        await db.groupme_event_notifications.insert_one(notification_record)
        
        return {
            "message": f"Enhanced notification sent to {len(success_channels)}/{len(channel_ids_list)} channels",
            "success_channels": success_channels,
            "failed_channels": failed_channels,
            "notification_id": notification_record["id"],
            "image_included": image_attachment is not None,
            "calendar_link_included": calendar_url is not None
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid channel_ids format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending enhanced notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

