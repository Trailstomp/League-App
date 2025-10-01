"""
Event Recurrence Generator
Handles creating recurring event instances
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any
import uuid


def generate_recurring_events(
    base_event: Dict[str, Any],
    recurrence_pattern: Dict[str, Any],
    end_date: str
) -> List[Dict[str, Any]]:
    """
    Generate recurring event instances based on pattern
    
    Args:
        base_event: The original event data
        recurrence_pattern: {
            "type": "daily" | "weekly" | "monthly" | "custom",
            "interval": int,  # e.g., every 2 weeks
            "days_of_week": [0,1,2,3,4,5,6],  # for weekly (0=Monday)
            "end_date": "YYYY-MM-DD"
        }
        end_date: When to stop generating instances
    
    Returns:
        List of event instances
    """
    instances = []
    
    # Parse start date
    start_datetime = datetime.fromisoformat(base_event['start_datetime'].replace('Z', '+00:00'))
    end_datetime = datetime.fromisoformat(end_date)
    
    pattern_type = recurrence_pattern.get('type', 'weekly')
    interval = recurrence_pattern.get('interval', 1)
    
    current_date = start_datetime
    
    while current_date <= end_datetime:
        # Create instance
        instance = base_event.copy()
        instance['id'] = str(uuid.uuid4())
        instance['start_datetime'] = current_date.isoformat()
        
        # Calculate end time if duration exists
        if 'duration' in base_event:
            end_time = current_date + timedelta(minutes=base_event['duration'])
            instance['end_datetime'] = end_time.isoformat()
        
        instance['is_recurring_instance'] = True
        instance['parent_event_id'] = base_event.get('id')
        instance['recurrence_date'] = current_date.date().isoformat()
        
        instances.append(instance)
        
        # Calculate next occurrence
        if pattern_type == 'daily':
            current_date += timedelta(days=interval)
        elif pattern_type == 'weekly':
            current_date += timedelta(weeks=interval)
        elif pattern_type == 'monthly':
            # Add months
            month = current_date.month + interval
            year = current_date.year
            while month > 12:
                month -= 12
                year += 1
            current_date = current_date.replace(year=year, month=month)
        elif pattern_type == 'custom':
            # Custom interval in days
            current_date += timedelta(days=interval)
    
    return instances
