from fastapi import APIRouter, Depends, HTTPException, Request, Header, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json
import logging

from ..database import get_db
from ..models.groupme import (
    GroupMeChannel, GroupMeMessage, GroupMeNotification, 
    EventRSVP, NotificationFilter
)
from ..models.event import Event
from ..models.team import Team
from ..services.groupme_service import GroupMeService
from ..services.groupme_webhook_processor import GroupMeWebhookProcessor
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

# Environment variables
GROUPME_ACCESS_TOKEN = os.environ.get('GROUPME_ACCESS_TOKEN')
GROUPME_WEBHOOK_SECRET = os.environ.get('GROUPME_WEBHOOK_SECRET')

# Pydantic models
class ChannelCreate(BaseModel):
    name: str
    groupme_group_id: str
    channel_type: str  # 'league' or 'team'
    team_id: Optional[str] = None
    notification_settings: Optional[Dict[str, Any]] = {}

class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    notification_settings: Optional[Dict[str, Any]] = None

class ChannelResponse(BaseModel):
    id: str
    name: str
    groupme_group_id: str
    groupme_bot_id: Optional[str]
    channel_type: str
    team_id: Optional[str]
    team_name: Optional[str]
    is_active: bool
    notification_settings: Dict[str, Any]
    created_at: datetime

class MessageResponse(BaseModel):
    id: str
    sender_name: str
    text: str
    created_at: datetime
    message_type: str

class NotificationCreate(BaseModel):
    channel_ids: List[str]
    message: str
    notification_type: str = "announcement"
    title: Optional[str] = None

class RSVPSummaryResponse(BaseModel):
    event_id: str
    event_title: str
    total_responses: int
    attending: List[Dict[str, str]]
    not_attending: List[Dict[str, str]]
    maybe: List[Dict[str, str]]

# Initialize services
def get_groupme_service():
    if not GROUPME_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="GroupMe access token not configured")
    return GroupMeService(GROUPME_ACCESS_TOKEN)

def get_webhook_processor():
    service = get_groupme_service()
    return GroupMeWebhookProcessor(service)

@router.get("/groups")
async def list_available_groups(service: GroupMeService = Depends(get_groupme_service)):
    """Get available GroupMe groups for configuration"""
    groups = await service.get_groups()
    return {"groups": groups}

@router.post("/channels", response_model=ChannelResponse)
async def create_channel(
    channel_data: ChannelCreate,
    db: AsyncSession = Depends(get_db),
    service: GroupMeService = Depends(get_groupme_service)
):
    """Create a new GroupMe channel configuration"""
    
    # Validate team exists if team channel
    if channel_data.channel_type == "team":
        if not channel_data.team_id:
            raise HTTPException(status_code=400, detail="team_id required for team channels")
        
        stmt = select(Team).where(Team.id == channel_data.team_id)
        result = await db.execute(stmt)
        team = result.scalar_one_or_none()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
    
    # Check for duplicate group ID
    stmt = select(GroupMeChannel).where(GroupMeChannel.groupme_group_id == channel_data.groupme_group_id)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="GroupMe group already configured")
    
    # Create bot
    bot_name = f"{channel_data.name} League Bot"
    callback_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/groupme/webhook"
    
    bot_response = await service.create_bot(channel_data.groupme_group_id, bot_name, callback_url)
    
    if bot_response.get('error') or bot_response.get('meta', {}).get('code') != 201:
        raise HTTPException(status_code=400, detail="Failed to create GroupMe bot")
    
    bot_id = bot_response['response']['bot']['bot_id']
    
    # Create channel
    channel = GroupMeChannel(
        name=channel_data.name,
        groupme_group_id=channel_data.groupme_group_id,
        groupme_bot_id=bot_id,
        channel_type=channel_data.channel_type,
        team_id=channel_data.team_id,
        notification_settings=channel_data.notification_settings or {}
    )
    
    db.add(channel)
    await db.commit()
    await db.refresh(channel)
    
    # Get team name if applicable
    team_name = None
    if channel.team_id:
        stmt = select(Team).where(Team.id == channel.team_id)
        result = await db.execute(stmt)
        team = result.scalar_one_or_none()
        team_name = team.name if team else None
    
    return ChannelResponse(
        id=channel.id,
        name=channel.name,
        groupme_group_id=channel.groupme_group_id,
        groupme_bot_id=channel.groupme_bot_id,
        channel_type=channel.channel_type,
        team_id=channel.team_id,
        team_name=team_name,
        is_active=channel.is_active,
        notification_settings=channel.notification_settings,
        created_at=channel.created_at
    )

@router.get("/channels", response_model=List[ChannelResponse])
async def list_channels(
    active_only: bool = True,
    channel_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List configured GroupMe channels"""
    
    conditions = []
    if active_only:
        conditions.append(GroupMeChannel.is_active == True)
    if channel_type:
        conditions.append(GroupMeChannel.channel_type == channel_type)
    
    stmt = select(GroupMeChannel)
    if conditions:
        stmt = stmt.where(and_(*conditions))
    
    result = await db.execute(stmt)
    channels = result.scalars().all()
    
    # Get team names
    team_names = {}
    if channels:
        team_ids = [c.team_id for c in channels if c.team_id]
        if team_ids:
            stmt = select(Team).where(Team.id.in_(team_ids))
            result = await db.execute(stmt)
            teams = result.scalars().all()
            team_names = {team.id: team.name for team in teams}
    
    return [
        ChannelResponse(
            id=channel.id,
            name=channel.name,
            groupme_group_id=channel.groupme_group_id,
            groupme_bot_id=channel.groupme_bot_id,
            channel_type=channel.channel_type,
            team_id=channel.team_id,
            team_name=team_names.get(channel.team_id),
            is_active=channel.is_active,
            notification_settings=channel.notification_settings or {},
            created_at=channel.created_at
        )
        for channel in channels
    ]

@router.put("/channels/{channel_id}", response_model=ChannelResponse)
async def update_channel(
    channel_id: str,
    update_data: ChannelUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update GroupMe channel configuration"""
    
    stmt = select(GroupMeChannel).where(GroupMeChannel.id == channel_id)
    result = await db.execute(stmt)
    channel = result.scalar_one_or_none()
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(channel, field, value)
    
    await db.commit()
    await db.refresh(channel)
    
    # Get team name
    team_name = None
    if channel.team_id:
        stmt = select(Team).where(Team.id == channel.team_id)
        result = await db.execute(stmt)
        team = result.scalar_one_or_none()
        team_name = team.name if team else None
    
    return ChannelResponse(
        id=channel.id,
        name=channel.name,
        groupme_group_id=channel.groupme_group_id,
        groupme_bot_id=channel.groupme_bot_id,
        channel_type=channel.channel_type,
        team_id=channel.team_id,
        team_name=team_name,
        is_active=channel.is_active,
        notification_settings=channel.notification_settings or {},
        created_at=channel.created_at
    )

@router.delete("/channels/{channel_id}")
async def delete_channel(channel_id: str, db: AsyncSession = Depends(get_db)):
    """Delete GroupMe channel configuration"""
    
    stmt = select(GroupMeChannel).where(GroupMeChannel.id == channel_id)
    result = await db.execute(stmt)
    channel = result.scalar_one_or_none()
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Soft delete
    channel.is_active = False
    await db.commit()
    
    return {"message": "Channel deactivated successfully"}

@router.post("/webhook")
async def groupme_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    x_groupme_signature: Optional[str] = Header(None)
):
    """Handle GroupMe webhook messages"""
    
    try:
        body = await request.body()
        webhook_data = json.loads(body.decode())
        
        # Verify signature if configured
        if GROUPME_WEBHOOK_SECRET:
            if not GroupMeService.verify_webhook_signature(body, x_groupme_signature, GROUPME_WEBHOOK_SECRET):
                raise HTTPException(status_code=401, detail="Invalid webhook signature")
        
        # Process in background
        background_tasks.add_task(process_webhook_message, webhook_data, db)
        
        return {"status": "received"}
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Processing failed")

async def process_webhook_message(webhook_data: Dict[str, Any], db: AsyncSession):
    """Background task to process webhook message"""
    try:
        processor = get_webhook_processor()
        await processor.process_message(webhook_data, db)
    except Exception as e:
        logger.error(f"Background webhook processing error: {str(e)}")

@router.post("/broadcast")
async def broadcast_message(
    notification_data: NotificationCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    service: GroupMeService = Depends(get_groupme_service)
):
    """Broadcast message to multiple channels"""
    
    # Validate channels exist
    stmt = select(GroupMeChannel).where(
        and_(
            GroupMeChannel.id.in_(notification_data.channel_ids),
            GroupMeChannel.is_active == True
        )
    )
    result = await db.execute(stmt)
    channels = result.scalars().all()
    
    if not channels:
        raise HTTPException(status_code=404, detail="No active channels found")
    
    # Send in background
    background_tasks.add_task(
        service.broadcast_message,
        notification_data.channel_ids,
        notification_data.message,
        db
    )
    
    return {
        "message": "Broadcast queued",
        "channels": len(channels)
    }

@router.get("/channels/{channel_id}/messages", response_model=List[MessageResponse])
async def get_channel_messages(
    channel_id: str,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Get messages from a GroupMe channel"""
    
    # Verify channel exists
    stmt = select(GroupMeChannel).where(GroupMeChannel.id == channel_id)
    result = await db.execute(stmt)
    channel = result.scalar_one_or_none()
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Get messages
    stmt = select(GroupMeMessage).where(
        GroupMeMessage.channel_id == channel_id
    ).order_by(GroupMeMessage.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    return [
        MessageResponse(
            id=msg.id,
            sender_name=msg.sender_name,
            text=msg.text or "",
            created_at=msg.created_at,
            message_type=msg.message_type
        )
        for msg in messages
    ]

@router.get("/events/{event_id}/rsvps", response_model=RSVPSummaryResponse)
async def get_event_rsvps(event_id: str, db: AsyncSession = Depends(get_db)):
    """Get RSVP summary for an event"""
    
    # Get event
    stmt = select(Event).where(Event.id == event_id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get RSVPs
    stmt = select(EventRSVP).where(EventRSVP.event_id == event_id)
    result = await db.execute(stmt)
    rsvps = result.scalars().all()
    
    # Group by response
    attending = [{"name": r.user_name, "id": r.groupme_user_id} for r in rsvps if r.response == "attending"]
    not_attending = [{"name": r.user_name, "id": r.groupme_user_id} for r in rsvps if r.response == "not_attending"]
    maybe = [{"name": r.user_name, "id": r.groupme_user_id} for r in rsvps if r.response == "maybe"]
    
    return RSVPSummaryResponse(
        event_id=event.id,
        event_title=event.title,
        total_responses=len(rsvps),
        attending=attending,
        not_attending=not_attending,
        maybe=maybe
    )

@router.post("/events/{event_id}/send-rsvp-summary")
async def send_rsvp_summary(
    event_id: str,
    channel_ids: List[str],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    service: GroupMeService = Depends(get_groupme_service)
):
    """Send RSVP summary to specified channels"""
    
    # Validate event and channels
    stmt = select(Event).where(Event.id == event_id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    stmt = select(GroupMeChannel).where(
        and_(
            GroupMeChannel.id.in_(channel_ids),
            GroupMeChannel.is_active == True
        )
    )
    result = await db.execute(stmt)
    channels = result.scalars().all()
    
    if not channels:
        raise HTTPException(status_code=404, detail="No active channels found")
    
    # Send summaries in background
    for channel in channels:
        background_tasks.add_task(service.send_rsvp_summary, event_id, channel.id, db)
    
    return {
        "message": "RSVP summaries queued",
        "channels": len(channels)
    }

@router.get("/dashboard/stats")
async def get_groupme_stats(db: AsyncSession = Depends(get_db)):
    """Get GroupMe integration dashboard statistics"""
    
    # Count active channels
    stmt = select(GroupMeChannel).where(GroupMeChannel.is_active == True)
    result = await db.execute(stmt)
    active_channels = len(result.scalars().all())
    
    # Count team vs league channels
    stmt = select(GroupMeChannel).where(
        and_(
            GroupMeChannel.is_active == True,
            GroupMeChannel.channel_type == "team"
        )
    )
    result = await db.execute(stmt)
    team_channels = len(result.scalars().all())
    
    stmt = select(GroupMeChannel).where(
        and_(
            GroupMeChannel.is_active == True,
            GroupMeChannel.channel_type == "league"
        )
    )
    result = await db.execute(stmt)
    league_channels = len(result.scalars().all())
    
    # Count messages from last 24 hours
    from datetime import timedelta
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    stmt = select(GroupMeMessage).where(GroupMeMessage.created_at > yesterday)
    result = await db.execute(stmt)
    recent_messages = len(result.scalars().all())
    
    # Count notifications sent
    stmt = select(GroupMeNotification).where(
        and_(
            GroupMeNotification.sent_at > yesterday,
            GroupMeNotification.delivery_status == "sent"
        )
    )
    result = await db.execute(stmt)
    notifications_sent = len(result.scalars().all())
    
    return {
        "active_channels": active_channels,
        "team_channels": team_channels,
        "league_channels": league_channels,
        "recent_messages": recent_messages,
        "notifications_sent": notifications_sent,
        "integration_status": "active" if active_channels > 0 else "inactive"
    }