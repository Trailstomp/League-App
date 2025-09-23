import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..models.groupme import (
    GroupMeChannel, GroupMeMessage, EventRSVP, NotificationFilter
)
from ..models.event import Event
from .groupme_service import GroupMeService

logger = logging.getLogger(__name__)

class GroupMeWebhookProcessor:
    """Process incoming GroupMe webhook messages"""
    
    def __init__(self, groupme_service: GroupMeService):
        self.groupme_service = groupme_service
    
    async def process_message(self, webhook_data: Dict[str, Any], db: AsyncSession) -> bool:
        """Process incoming GroupMe webhook message"""
        try:
            # Skip system messages and bot messages
            if webhook_data.get("system") or self._is_bot_message(webhook_data):
                return True
            
            # Find channel
            channel = await self._get_channel_by_group_id(webhook_data.get("group_id"), db)
            if not channel:
                logger.warning(f"No channel found for group_id: {webhook_data.get('group_id')}")
                return False
            
            # Store message
            message = await self._store_message(webhook_data, channel, db)
            
            # Process commands
            text = webhook_data.get("text", "").strip()
            if text.startswith("/"):
                await self._process_command(text, webhook_data, channel, message, db)
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing GroupMe webhook: {str(e)}")
            return False
    
    async def _get_channel_by_group_id(self, group_id: str, db: AsyncSession) -> Optional[GroupMeChannel]:
        """Get channel by GroupMe group ID"""
        if not group_id:
            return None
            
        stmt = select(GroupMeChannel).where(
            and_(
                GroupMeChannel.groupme_group_id == group_id,
                GroupMeChannel.is_active == True
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def _store_message(
        self, 
        webhook_data: Dict[str, Any], 
        channel: GroupMeChannel, 
        db: AsyncSession
    ) -> GroupMeMessage:
        """Store GroupMe message in database"""
        message = GroupMeMessage(
            channel_id=channel.id,
            groupme_message_id=str(webhook_data.get("id")),
            sender_id=str(webhook_data.get("user_id", webhook_data.get("sender_id"))),
            sender_name=webhook_data.get("name", "Unknown"),
            text=webhook_data.get("text", ""),
            attachments=webhook_data.get("attachments", []),
            created_at=datetime.fromtimestamp(webhook_data.get("created_at", 0), tz=timezone.utc),
            message_type="standard"
        )
        
        db.add(message)
        await db.commit()
        await db.refresh(message)
        
        return message
    
    async def _process_command(
        self, 
        text: str, 
        webhook_data: Dict[str, Any], 
        channel: GroupMeChannel, 
        message: GroupMeMessage, 
        db: AsyncSession
    ):
        """Process command messages"""
        command_parts = text.lower().split()
        command = command_parts[0]
        
        message.message_type = "command"
        
        if command == "/rsvp":
            await self._handle_rsvp_command(command_parts, webhook_data, channel, message, db)
        elif command == "/schedule":
            await self._handle_schedule_command(webhook_data, channel, db)
        elif command == "/help":
            await self._handle_help_command(webhook_data, channel, db)
        elif command == "/notifications":
            await self._handle_notifications_command(command_parts, webhook_data, channel, db)
        
        message.processed = True
        await db.commit()
    
    async def _handle_rsvp_command(
        self, 
        command_parts: list, 
        webhook_data: Dict[str, Any], 
        channel: GroupMeChannel, 
        message: GroupMeMessage, 
        db: AsyncSession
    ):
        """Handle RSVP command: /rsvp yes|no|maybe [event_id]"""
        if len(command_parts) < 2:
            await self._send_help_response("rsvp", channel, db)
            return
        
        response = command_parts[1].lower()
        if response not in ["yes", "no", "maybe"]:
            await self._send_help_response("rsvp", channel, db)
            return
        
        # Convert response format
        response_map = {"yes": "attending", "no": "not_attending", "maybe": "maybe"}
        db_response = response_map[response]
        
        # Find event
        event = None
        if len(command_parts) > 2:
            # Specific event ID provided
            try:
                event_id = command_parts[2]
                stmt = select(Event).where(Event.id == event_id)
                result = await db.execute(stmt)
                event = result.scalar_one_or_none()
            except ValueError:
                await self._send_error_response("Invalid event ID", channel, db)
                return
        else:
            # Find next upcoming event for this channel
            event = await self._get_next_event_for_channel(channel, db)
        
        if not event:
            await self._send_error_response("No upcoming events found", channel, db)
            return
        
        # Update or create RSVP
        user_id = str(webhook_data.get("user_id", webhook_data.get("sender_id")))
        user_name = webhook_data.get("name", "Unknown")
        avatar_url = webhook_data.get("avatar_url")
        
        stmt = select(EventRSVP).where(
            and_(
                EventRSVP.event_id == event.id,
                EventRSVP.groupme_user_id == user_id
            )
        )
        result = await db.execute(stmt)
        existing_rsvp = result.scalar_one_or_none()
        
        if existing_rsvp:
            existing_rsvp.response = db_response
            existing_rsvp.response_time = datetime.now(timezone.utc)
            existing_rsvp.message_id = message.id
        else:
            rsvp = EventRSVP(
                event_id=event.id,
                groupme_user_id=user_id,
                user_name=user_name,
                user_avatar_url=avatar_url,
                response=db_response,
                message_id=message.id
            )
            db.add(rsvp)
        
        await db.commit()
        
        # Send confirmation
        confirmation_msg = f"✅ {user_name}, your RSVP for '{event.title}' has been recorded as: {response.upper()}"
        await self.groupme_service.send_message(channel.groupme_bot_id, confirmation_msg)
    
    async def _handle_schedule_command(
        self, 
        webhook_data: Dict[str, Any], 
        channel: GroupMeChannel, 
        db: AsyncSession
    ):
        """Handle schedule command: /schedule"""
        events = await self._get_upcoming_events_for_channel(channel, db, limit=5)
        
        if not events:
            response = "📅 No upcoming events scheduled."
        else:
            response = "📅 Upcoming Events:\n\n"
            for i, event in enumerate(events, 1):
                event_date = event.start_datetime.strftime("%m/%d %I:%M %p")
                response += f"{i}. {event.title}\n"
                response += f"   📅 {event_date}"
                if event.location:
                    response += f" • 📍 {event.location}"
                response += "\n\n"
            
            response += "Use '/rsvp yes [event#]' to respond to a specific event"
        
        await self.groupme_service.send_message(channel.groupme_bot_id, response)
    
    async def _handle_help_command(
        self, 
        webhook_data: Dict[str, Any], 
        channel: GroupMeChannel, 
        db: AsyncSession
    ):
        """Handle help command: /help"""
        help_text = """🤖 Lacrosse League Bot Commands:

📋 /schedule - View upcoming events
✅ /rsvp yes|no|maybe [event#] - Respond to events
🔔 /notifications on|off [type] - Manage notifications
❓ /help - Show this help message

Examples:
• /rsvp yes - RSVP to next event
• /rsvp no 2 - RSVP no to event #2
• /notifications off games - Turn off game notifications"""
        
        await self.groupme_service.send_message(channel.groupme_bot_id, help_text)
    
    async def _handle_notifications_command(
        self, 
        command_parts: list, 
        webhook_data: Dict[str, Any], 
        channel: GroupMeChannel, 
        db: AsyncSession
    ):
        """Handle notifications command: /notifications on|off [type]"""
        if len(command_parts) < 2:
            await self._send_help_response("notifications", channel, db)
            return
        
        user_id = str(webhook_data.get("user_id", webhook_data.get("sender_id")))
        user_name = webhook_data.get("name", "Unknown")
        
        # Get or create notification filter
        stmt = select(NotificationFilter).where(
            and_(
                NotificationFilter.channel_id == channel.id,
                NotificationFilter.groupme_user_id == user_id
            )
        )
        result = await db.execute(stmt)
        notification_filter = result.scalar_one_or_none()
        
        if not notification_filter:
            notification_filter = NotificationFilter(
                channel_id=channel.id,
                groupme_user_id=user_id,
                user_name=user_name
            )
            db.add(notification_filter)
        
        setting = command_parts[1].lower()
        notification_type = command_parts[2] if len(command_parts) > 2 else "all"
        
        if setting not in ["on", "off"]:
            await self._send_help_response("notifications", channel, db)
            return
        
        enabled = setting == "on"
        preferences = notification_filter.preferences.copy()
        
        if notification_type == "all":
            # Update all notification types
            for category in preferences:
                if isinstance(preferences[category], dict):
                    for key in preferences[category]:
                        preferences[category][key] = enabled
                else:
                    preferences[category] = enabled
        else:
            # Update specific type
            # Map common aliases
            type_mapping = {
                "games": ("events", "games"),
                "practices": ("events", "practices"),
                "meetings": ("events", "meetings"),
                "reminders": ("events", "reminders"),
                "announcements": ("announcements",)
            }
            
            if notification_type in type_mapping:
                path = type_mapping[notification_type]
                if len(path) == 2:
                    preferences[path[0]][path[1]] = enabled
                else:
                    preferences[path[0]] = enabled
        
        notification_filter.preferences = preferences
        await db.commit()
        
        response = f"✅ {user_name}, notifications for '{notification_type}' have been turned {setting.upper()}"
        await self.groupme_service.send_message(channel.groupme_bot_id, response)
    
    async def _get_next_event_for_channel(self, channel: GroupMeChannel, db: AsyncSession) -> Optional[Event]:
        """Get the next upcoming event for a channel"""
        now = datetime.now(timezone.utc)
        
        if channel.channel_type == "league":
            # League channel gets all events
            stmt = select(Event).where(
                and_(
                    Event.start_datetime > now,
                    Event.requires_rsvp == True
                )
            ).order_by(Event.start_datetime).limit(1)
        else:
            # Team channel gets only team events
            stmt = select(Event).where(
                and_(
                    Event.team_id == channel.team_id,
                    Event.start_datetime > now,
                    Event.requires_rsvp == True
                )
            ).order_by(Event.start_datetime).limit(1)
        
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def _get_upcoming_events_for_channel(
        self, 
        channel: GroupMeChannel, 
        db: AsyncSession, 
        limit: int = 10
    ) -> list:
        """Get upcoming events for a channel"""
        now = datetime.now(timezone.utc)
        
        if channel.channel_type == "league":
            stmt = select(Event).where(
                Event.start_datetime > now
            ).order_by(Event.start_datetime).limit(limit)
        else:
            stmt = select(Event).where(
                and_(
                    Event.team_id == channel.team_id,
                    Event.start_datetime > now
                )
            ).order_by(Event.start_datetime).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    async def _send_help_response(self, command: str, channel: GroupMeChannel, db: AsyncSession):
        """Send command-specific help"""
        help_texts = {
            "rsvp": "Usage: /rsvp yes|no|maybe [event#]\nExample: /rsvp yes (for next event) or /rsvp no 2 (for event #2)",
            "notifications": "Usage: /notifications on|off [type]\nTypes: games, practices, meetings, reminders, announcements, all\nExample: /notifications off games"
        }
        
        help_text = help_texts.get(command, "Type /help for available commands")
        await self.groupme_service.send_message(channel.groupme_bot_id, f"❓ {help_text}")
    
    async def _send_error_response(self, error_msg: str, channel: GroupMeChannel, db: AsyncSession):
        """Send error response"""
        await self.groupme_service.send_message(channel.groupme_bot_id, f"❌ {error_msg}")
    
    def _is_bot_message(self, webhook_data: Dict[str, Any]) -> bool:
        """Check if message is from a bot"""
        sender_type = webhook_data.get("sender_type", "")
        name = webhook_data.get("name", "")
        return sender_type == "bot" or "bot" in name.lower() or name.endswith("Bot")