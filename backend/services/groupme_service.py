import os
import json
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import hmac
import hashlib

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..models.groupme import (
    GroupMeChannel, GroupMeMessage, GroupMeNotification, 
    EventRSVP, NotificationFilter
)

logger = logging.getLogger(__name__)

class GroupMeService:
    """Service for GroupMe API integration"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://api.groupme.com/v3"
        self.rate_limit_delay = 2.1  # Conservative rate limiting (25 per 60 seconds)
        
    async def get_groups(self) -> List[Dict[str, Any]]:
        """Retrieve all accessible GroupMe groups"""
        try:
            url = f"{self.base_url}/groups?token={self.access_token}"
            request = Request(url)
            
            with urlopen(request) as response:
                data = json.loads(response.read().decode())
                
            if data.get('meta', {}).get('code') == 200:
                return data.get('response', [])
            else:
                logger.error(f"Failed to get groups: {data}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting GroupMe groups: {str(e)}")
            return []
    
    async def create_bot(self, group_id: str, bot_name: str, callback_url: str) -> Dict[str, Any]:
        """Create a GroupMe bot for a specific group"""
        try:
            url = f"{self.base_url}/bots?token={self.access_token}"
            
            data = {
                "bot": {
                    "name": bot_name,
                    "group_id": group_id,
                    "callback_url": callback_url
                }
            }
            
            request = Request(
                url,
                json.dumps(data).encode(),
                {"Content-Type": "application/json"}
            )
            
            with urlopen(request) as response:
                result = json.loads(response.read().decode())
                
            return result
            
        except Exception as e:
            logger.error(f"Error creating GroupMe bot: {str(e)}")
            return {"error": str(e)}
    
    async def send_message(self, bot_id: str, text: str, attachments: List[Dict] = None) -> bool:
        """Send a message through GroupMe bot"""
        try:
            url = f"{self.base_url}/bots/post"
            
            data = {
                "bot_id": bot_id,
                "text": text
            }
            
            if attachments:
                data["attachments"] = attachments
            
            request = Request(
                url,
                json.dumps(data).encode(),
                {"Content-Type": "application/json"}
            )
            
            response = urlopen(request)
            
            # Rate limiting
            await asyncio.sleep(self.rate_limit_delay)
            
            return response.status == 202  # GroupMe returns 202 for successful bot posts
            
        except Exception as e:
            logger.error(f"Failed to send GroupMe message: {str(e)}")
            return False
    
    async def broadcast_message(self, channel_ids: List[str], message: str, db: AsyncSession) -> Dict[str, bool]:
        """Send message to multiple channels with rate limiting"""
        results = {}
        
        # Get channels with bot IDs
        stmt = select(GroupMeChannel).where(
            and_(
                GroupMeChannel.id.in_(channel_ids),
                GroupMeChannel.is_active == True,
                GroupMeChannel.groupme_bot_id.isnot(None)
            )
        )
        result = await db.execute(stmt)
        channels = result.scalars().all()
        
        for channel in channels:
            success = await self.send_message(channel.groupme_bot_id, message)
            results[channel.name] = success
            
            # Log notification
            notification = GroupMeNotification(
                channel_id=channel.id,
                notification_type="announcement",
                message_text=message,
                delivery_status="sent" if success else "failed"
            )
            db.add(notification)
        
        await db.commit()
        return results
    
    async def send_event_notification(
        self, 
        event_data: Dict[str, Any], 
        channel_ids: List[str], 
        db: AsyncSession
    ) -> Dict[str, bool]:
        """Send event notification to specified channels"""
        message = self._format_event_message(event_data)
        results = {}
        
        # Get active channels
        stmt = select(GroupMeChannel).where(
            and_(
                GroupMeChannel.id.in_(channel_ids),
                GroupMeChannel.is_active == True,
                GroupMeChannel.groupme_bot_id.isnot(None)
            )
        )
        result = await db.execute(stmt)
        channels = result.scalars().all()
        
        for channel in channels:
            # Check notification filters for this channel
            if await self._should_send_notification(channel.id, "events", event_data.get("event_type"), db):
                success = await self.send_message(channel.groupme_bot_id, message)
                results[channel.name] = success
                
                # Log notification
                notification = GroupMeNotification(
                    channel_id=channel.id,
                    event_id=event_data.get("id"),
                    notification_type="event_created",
                    title=event_data.get("title"),
                    message_text=message,
                    delivery_status="sent" if success else "failed"
                )
                db.add(notification)
        
        await db.commit()
        return results
    
    async def send_rsvp_summary(self, event_id: str, channel_id: str, db: AsyncSession) -> bool:
        """Send RSVP summary for an event"""
        from ..models.event import Event
        
        # Get event and RSVPs
        stmt = select(Event).where(Event.id == event_id)
        result = await db.execute(stmt)
        event = result.scalar_one_or_none()
        
        if not event:
            return False
        
        # Get channel
        stmt = select(GroupMeChannel).where(GroupMeChannel.id == channel_id)
        result = await db.execute(stmt)
        channel = result.scalar_one_or_none()
        
        if not channel or not channel.groupme_bot_id:
            return False
        
        # Get RSVPs
        stmt = select(EventRSVP).where(EventRSVP.event_id == event_id)
        result = await db.execute(stmt)
        rsvps = result.scalars().all()
        
        # Format summary
        message = self._format_rsvp_summary(event, rsvps)
        
        # Send message
        success = await self.send_message(channel.groupme_bot_id, message)
        
        # Log notification
        notification = GroupMeNotification(
            channel_id=channel.id,
            event_id=event_id,
            notification_type="rsvp_summary",
            title=f"RSVP Summary: {event.title}",
            message_text=message,
            delivery_status="sent" if success else "failed"
        )
        db.add(notification)
        await db.commit()
        
        return success
    
    def _format_event_message(self, event_data: Dict[str, Any]) -> str:
        """Format event data into GroupMe message"""
        event_type_emoji = {
            "game": "🏑",
            "practice": "🥍", 
            "meeting": "📋",
            "tournament": "🏆"
        }
        
        emoji = event_type_emoji.get(event_data.get("event_type", "").lower(), "📅")
        
        message = f"{emoji} {event_data['title']}\n"
        message += f"📅 {event_data['start_datetime']}\n"
        
        if event_data.get('location'):
            message += f"📍 {event_data['location']}\n"
        
        if event_data.get('description'):
            message += f"ℹ️ {event_data['description']}\n"
        
        if event_data.get('requires_rsvp'):
            message += "\n💬 Reply with '/rsvp yes', '/rsvp no', or '/rsvp maybe' to respond"
            
            # Add RSVP deadline if available
            if event_data.get('rsvp_deadline'):
                message += f"\n⏰ RSVP by {event_data['rsvp_deadline']}"
        
        return message
    
    def _format_rsvp_summary(self, event, rsvps: List[EventRSVP]) -> str:
        """Format RSVP summary message"""
        attending = [r for r in rsvps if r.response == "attending"]
        not_attending = [r for r in rsvps if r.response == "not_attending"] 
        maybe = [r for r in rsvps if r.response == "maybe"]
        
        message = f"📊 RSVP Summary: {event.title}\n"
        message += f"📅 {event.start_datetime.strftime('%m/%d/%Y at %I:%M %p')}\n\n"
        
        message += f"✅ Attending ({len(attending)}):\n"
        if attending:
            message += "  • " + "\n  • ".join([r.user_name for r in attending]) + "\n"
        else:
            message += "  None yet\n"
        
        message += f"\n❌ Not Attending ({len(not_attending)}):\n"
        if not_attending:
            message += "  • " + "\n  • ".join([r.user_name for r in not_attending]) + "\n"
        else:
            message += "  None\n"
        
        message += f"\n❓ Maybe ({len(maybe)}):\n"
        if maybe:
            message += "  • " + "\n  • ".join([r.user_name for r in maybe])
        else:
            message += "  None"
        
        return message
    
    async def _should_send_notification(
        self, 
        channel_id: str, 
        notification_category: str, 
        notification_type: str, 
        db: AsyncSession
    ) -> bool:
        """Check if notification should be sent based on channel settings"""
        # Get channel notification settings
        stmt = select(GroupMeChannel).where(GroupMeChannel.id == channel_id)
        result = await db.execute(stmt)
        channel = result.scalar_one_or_none()
        
        if not channel:
            return False
        
        # Check channel-level settings
        settings = channel.notification_settings or {}
        category_settings = settings.get(notification_category, {})
        
        # Default to True if not specified
        return category_settings.get(notification_type, True)
    
    @staticmethod
    def verify_webhook_signature(body: bytes, signature: str, secret: str) -> bool:
        """Verify GroupMe webhook signature"""
        if not signature or not secret:
            return False
        
        expected_signature = hmac.new(
            secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)