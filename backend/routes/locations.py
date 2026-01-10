"""
Locations Router - Handles venue/location management
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

# Create router
locations_router = APIRouter(prefix="/locations", tags=["locations"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database


@locations_router.get("")
async def get_locations():
    """Get all locations"""
    try:
        locations = await db.locations.find().to_list(length=None)
        result_locations = []
        for location in locations:
            location.pop('_id', None)
            result_locations.append(location)
        return result_locations
    except Exception as e:
        logger.error(f"Error fetching locations: {e}")
        return []


@locations_router.post("")
async def add_location(location_data: Dict[str, Any]):
    """Add a new location"""
    try:
        logger.info(f"📍 Adding new location: {location_data.get('name')}")
        
        # Add timestamp if not present
        if 'createdAt' not in location_data:
            location_data['createdAt'] = datetime.utcnow().isoformat()
        
        # Generate ID if not present
        if 'id' not in location_data:
            location_data['id'] = str(uuid.uuid4())
        
        # Insert into database
        result = await db.locations.insert_one(location_data)
        
        logger.info(f"✅ Location added successfully: {location_data['id']}")
        
        # Remove MongoDB _id before returning
        location_data.pop('_id', None)
        
        return {
            "status": "success",
            "message": "Location added successfully",
            "location": location_data
        }
        
    except Exception as e:
        logger.error(f"❌ Error adding location: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@locations_router.put("/{location_id}")
async def update_location(location_id: str, location_data: Dict[str, Any]):
    """Update an existing location"""
    try:
        logger.info(f"📍 Updating location: {location_id}")
        
        # Add update timestamp
        location_data['updatedAt'] = datetime.utcnow().isoformat()
        
        # Update in database
        result = await db.locations.update_one(
            {"id": location_id},
            {"$set": location_data}
        )
        
        if result.matched_count == 0:
            logger.warning(f"⚠️ No location found with id: {location_id}")
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Fetch and return the updated location
        updated_location = await db.locations.find_one({"id": location_id})
        if updated_location:
            updated_location.pop('_id', None)
        
        logger.info(f"✅ Location updated successfully: {location_id}")
        
        return updated_location
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating location: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@locations_router.delete("/{location_id}")
async def delete_location(location_id: str):
    """Delete a location"""
    try:
        logger.info(f"📍 Deleting location: {location_id}")
        
        # Delete from database
        result = await db.locations.delete_one({"id": location_id})
        
        if result.deleted_count == 0:
            logger.warning(f"⚠️ No location found with id: {location_id}")
            raise HTTPException(status_code=404, detail="Location not found")
        
        logger.info(f"✅ Location deleted successfully: {location_id}")
        
        return {
            "status": "success",
            "message": "Location deleted successfully",
            "deleted": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting location: {e}")
        raise HTTPException(status_code=500, detail=str(e))
