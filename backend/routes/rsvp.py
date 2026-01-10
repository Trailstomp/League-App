"""
RSVP Router - Handles event RSVP operations
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime, timezone
import logging
import uuid

logger = logging.getLogger(__name__)

# Create router
rsvp_router = APIRouter(prefix="/events", tags=["rsvp"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database


@rsvp_router.post("/{event_id}/rsvp")
async def create_or_update_rsvp(event_id: str, rsvp_data: Dict[str, Any]):
    """Create or update an RSVP for an event"""
    try:
        user_id = rsvp_data.get('user_id')
        user_email = rsvp_data.get('user_email')
        response = rsvp_data.get('response')  # 'going', 'not_going', 'maybe'
        
        if not (user_id or user_email) or not response:
            raise HTTPException(status_code=400, detail="user_id or user_email and response are required")
        
        if response not in ['going', 'not_going', 'maybe']:
            raise HTTPException(status_code=400, detail="Invalid response type")
        
        # If email provided, find user
        user_name = rsvp_data.get('user_name', 'Unknown')
        if user_email and not user_id:
            user = await db.users.find_one({"email": user_email}, {"_id": 0})
            if user:
                user_id = user["id"]
                user_name = user["name"]
            else:
                user_name = user_email
        
        # Check if RSVP already exists
        query = {"event_id": event_id}
        if user_id:
            query["user_id"] = user_id
        elif user_email:
            query["user_email"] = user_email
            
        existing_rsvp = await db.event_rsvps.find_one(query)
        
        rsvp_record = {
            "event_id": event_id,
            "user_id": user_id,
            "user_email": user_email,
            "response": response,
            "user_name": user_name,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if existing_rsvp:
            # Update existing RSVP
            await db.event_rsvps.update_one(
                query,
                {"$set": rsvp_record}
            )
            logger.info(f"✅ Updated RSVP for event {event_id} by {user_email or user_id}: {response}")
        else:
            # Create new RSVP
            rsvp_record['id'] = str(uuid.uuid4())
            rsvp_record['created_at'] = datetime.now(timezone.utc).isoformat()
            await db.event_rsvps.insert_one(rsvp_record)
            logger.info(f"✅ Created RSVP for event {event_id} by {user_email or user_id}: {response}")
        
        return {"status": "success", "message": "RSVP recorded"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating/updating RSVP: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@rsvp_router.get("/{event_id}/rsvps")
async def get_event_rsvps(event_id: str):
    """Get all RSVPs for an event with summary"""
    try:
        rsvps_cursor = db.event_rsvps.find({"event_id": event_id})
        rsvps = await rsvps_cursor.to_list(length=None)
        
        # Remove MongoDB _id
        for rsvp in rsvps:
            rsvp.pop('_id', None)
        
        # Calculate summary
        going = [r for r in rsvps if r['response'] == 'going']
        not_going = [r for r in rsvps if r['response'] == 'not_going']
        maybe = [r for r in rsvps if r['response'] == 'maybe']
        
        return {
            "rsvps": rsvps,
            "summary": {
                "going": len(going),
                "not_going": len(not_going),
                "maybe": len(maybe),
                "total": len(rsvps)
            },
            "details": {
                "going": going,
                "not_going": not_going,
                "maybe": maybe
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching RSVPs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
