# Add GroupMe integration to existing events.py

# Add these imports at the top
from ..services.groupme_service import GroupMeService
from ..models.groupme import GroupMeChannel, EventRSVP

# Add after existing imports
import os

# Add this function to enhance event creation with GroupMe notifications
@router.post("/", response_model=EventResponse)
async def create_event(
    event_data: EventCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Create a new event and send GroupMe notifications"""
    
    # Create event (existing logic)
    event = Event(**event_data.dict())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    # Send GroupMe notifications in background
    background_tasks.add_task(send_groupme_event_notification, event.id, db)
    
    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        start_datetime=event.start_datetime,
        location=event.location,
        requires_rsvp=event.requires_rsvp,
        rsvp_count=0
    )

async def send_groupme_event_notification(event_id: str, db: AsyncSession):
    """Background task to send GroupMe event notifications"""
    
    try:
        # Get event
        stmt = select(Event).where(Event.id == event_id)
        result = await db.execute(stmt)
        event = result.scalar_one_or_none()
        
        if not event:
            return
        
        # Get team if applicable
        team = None
        if event.team_id:
            stmt = select(Team).where(Team.id == event.team_id)
            result = await db.execute(stmt)
            team = result.scalar_one_or_none()
        
        # Determine which channels to notify
        channel_conditions = [GroupMeChannel.is_active == True]
        
        if team:
            # Notify team channel and league channels
            channel_conditions.append(
                or_(
                    and_(
                        GroupMeChannel.channel_type == "team",
                        GroupMeChannel.team_id == team.id
                    ),
                    GroupMeChannel.channel_type == "league"
                )
            )
        else:
            # League-wide event - notify all channels
            pass  # No additional conditions needed
        
        stmt = select(GroupMeChannel).where(and_(*channel_conditions))
        result = await db.execute(stmt)
        channels = result.scalars().all()
        
        if not channels:
            return
        
        # Prepare event data for GroupMe
        event_data = {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type,
            "start_datetime": event.start_datetime.strftime("%m/%d/%Y at %I:%M %p"),
            "location": event.location,
            "requires_rsvp": event.requires_rsvp
        }
        
        # Add RSVP deadline if exists
        if hasattr(event, 'rsvp_deadline') and event.rsvp_deadline:
            event_data["rsvp_deadline"] = event.rsvp_deadline.strftime("%m/%d/%Y at %I:%M %p")
        
        # Send notifications
        groupme_token = os.environ.get('GROUPME_ACCESS_TOKEN')
        if groupme_token:
            service = GroupMeService(groupme_token)
            channel_ids = [c.id for c in channels]
            await service.send_event_notification(event_data, channel_ids, db)
        
    except Exception as e:
        import logging
        logging.error(f"Failed to send GroupMe event notification: {str(e)}")

# Add endpoint to get event RSVPs with GroupMe integration
@router.get("/{event_id}/rsvps-detailed")
async def get_event_rsvps_detailed(event_id: str, db: AsyncSession = Depends(get_db)):
    """Get detailed RSVP information including GroupMe data"""
    
    # Get event
    stmt = select(Event).where(Event.id == event_id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get GroupMe RSVPs
    stmt = select(EventRSVP).where(EventRSVP.event_id == event_id).order_by(EventRSVP.response_time.desc())
    result = await db.execute(stmt)
    rsvps = result.scalars().all()
    
    # Group and format RSVPs
    rsvp_data = {
        "event": {
            "id": event.id,
            "title": event.title,
            "start_datetime": event.start_datetime,
            "requires_rsvp": event.requires_rsvp
        },
        "summary": {
            "total_responses": len(rsvps),
            "attending_count": len([r for r in rsvps if r.response == "attending"]),
            "not_attending_count": len([r for r in rsvps if r.response == "not_attending"]), 
            "maybe_count": len([r for r in rsvps if r.response == "maybe"])
        },
        "responses": []
    }
    
    for rsvp in rsvps:
        rsvp_data["responses"].append({
            "id": rsvp.id,
            "user_name": rsvp.user_name,
            "user_avatar_url": rsvp.user_avatar_url,
            "response": rsvp.response,
            "response_time": rsvp.response_time
        })
    
    return rsvp_data

# Add endpoint for manual RSVP management
@router.post("/{event_id}/rsvps")
async def manual_rsvp_entry(
    event_id: str,
    rsvp_data: dict,  # {"user_name": str, "response": str, "groupme_user_id": str}
    db: AsyncSession = Depends(get_db)
):
    """Manually add/update RSVP (for admin use)"""
    
    # Validate event exists
    stmt = select(Event).where(Event.id == event_id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Validate response
    if rsvp_data.get("response") not in ["attending", "not_attending", "maybe"]:
        raise HTTPException(status_code=400, detail="Invalid response")
    
    # Check for existing RSVP
    stmt = select(EventRSVP).where(
        and_(
            EventRSVP.event_id == event_id,
            EventRSVP.groupme_user_id == rsvp_data["groupme_user_id"]
        )
    )
    result = await db.execute(stmt)
    existing_rsvp = result.scalar_one_or_none()
    
    if existing_rsvp:
        # Update existing
        existing_rsvp.response = rsvp_data["response"]
        existing_rsvp.response_time = datetime.now(timezone.utc)
        existing_rsvp.user_name = rsvp_data.get("user_name", existing_rsvp.user_name)
    else:
        # Create new
        new_rsvp = EventRSVP(
            event_id=event_id,
            groupme_user_id=rsvp_data["groupme_user_id"],
            user_name=rsvp_data["user_name"],
            response=rsvp_data["response"]
        )
        db.add(new_rsvp)
    
    await db.commit()
    
    return {"message": "RSVP recorded successfully"}