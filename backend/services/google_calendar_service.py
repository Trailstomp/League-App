"""
Google Calendar Service for Event Management
Handles calendar event creation, invites, and RSVP tracking
"""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import httpx

logger = logging.getLogger(__name__)


class GoogleCalendarService:
    """Service for managing Google Calendar events and RSVPs"""
    
    def __init__(self, credentials_config: Dict[str, str]):
        """
        Initialize with Google OAuth credentials
        
        Args:
            credentials_config: Dict with clientId, clientSecret, refreshToken
        """
        self.credentials_config = credentials_config
        self.service = None
        
    async def _get_service(self):
        """Get or create Calendar API service with fresh access token"""
        try:
            # Get fresh access token
            access_token = await self._refresh_access_token()
            
            # Create credentials object
            creds = Credentials(token=access_token)
            
            # Build and return service
            return build('calendar', 'v3', credentials=creds)
            
        except Exception as e:
            logger.error(f"❌ Error building Calendar service: {e}")
            raise
    
    async def _refresh_access_token(self) -> str:
        """Refresh the OAuth access token"""
        try:
            token_data = {
                'client_id': self.credentials_config['clientId'],
                'client_secret': self.credentials_config['clientSecret'],
                'refresh_token': self.credentials_config['refreshToken'],
                'grant_type': 'refresh_token'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://oauth2.googleapis.com/token',
                    data=token_data,
                    timeout=15
                )
                
                if response.status_code != 200:
                    error_data = response.json()
                    raise Exception(f"Token refresh failed: {error_data}")
                
                tokens = response.json()
                return tokens.get('access_token', '')
                
        except Exception as e:
            logger.error(f"❌ Error refreshing access token: {e}")
            raise
    
    async def create_event(
        self,
        title: str,
        description: str,
        start_datetime: str,
        end_datetime: str,
        location: str,
        attendees: List[str],
        timezone: str = 'America/New_York'
    ) -> Dict[str, Any]:
        """
        Create a calendar event and send invites
        
        Args:
            title: Event title
            description: Event description
            start_datetime: ISO format datetime (YYYY-MM-DDTHH:MM:SS)
            end_datetime: ISO format datetime
            location: Event location
            attendees: List of email addresses
            timezone: Timezone for the event
            
        Returns:
            Dict with event details including google_event_id
        """
        try:
            service = await self._get_service()
            
            # Build event object
            event = {
                'summary': title,
                'location': location,
                'description': description,
                'start': {
                    'dateTime': start_datetime,
                    'timeZone': timezone,
                },
                'end': {
                    'dateTime': end_datetime,
                    'timeZone': timezone,
                },
                'attendees': [{'email': email} for email in attendees],
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 24 hours
                        {'method': 'popup', 'minutes': 60},        # 1 hour
                    ],
                },
                'guestsCanModify': False,
                'guestsCanInviteOthers': False,
                'guestsCanSeeOtherGuests': True,
            }
            
            # Create event
            created_event = service.events().insert(
                calendarId='primary',
                body=event,
                sendUpdates='all'  # Send invites to all attendees
            ).execute()
            
            logger.info(f"✅ Calendar event created: {created_event['id']}")
            
            return {
                'google_event_id': created_event['id'],
                'html_link': created_event.get('htmlLink'),
                'status': 'created',
                'attendees_count': len(attendees)
            }
            
        except HttpError as e:
            logger.error(f"❌ Calendar API error: {e}")
            raise Exception(f"Failed to create calendar event: {e}")
        except Exception as e:
            logger.error(f"❌ Error creating calendar event: {e}")
            raise
    
    async def create_event_with_meet(
        self,
        title: str,
        description: str,
        start_datetime: str,
        end_datetime: str,
        location: str,
        attendees: List[str],
        timezone: str = 'America/New_York'
    ) -> Dict[str, Any]:
        """
        Create a calendar event with Google Meet link
        """
        try:
            service = await self._get_service()
            
            event = {
                'summary': title,
                'location': location,
                'description': description,
                'start': {
                    'dateTime': start_datetime,
                    'timeZone': timezone,
                },
                'end': {
                    'dateTime': end_datetime,
                    'timeZone': timezone,
                },
                'attendees': [{'email': email} for email in attendees],
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},
                        {'method': 'popup', 'minutes': 60},
                    ],
                },
                'conferenceData': {
                    'createRequest': {
                        'requestId': f'meet-{datetime.now(timezone.utc).timestamp()}',
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                },
            }
            
            created_event = service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1,
                sendUpdates='all'
            ).execute()
            
            meet_link = created_event.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri')
            
            logger.info(f"✅ Calendar event with Meet created: {created_event['id']}")
            
            return {
                'google_event_id': created_event['id'],
                'html_link': created_event.get('htmlLink'),
                'meet_link': meet_link,
                'status': 'created',
                'attendees_count': len(attendees)
            }
            
        except Exception as e:
            logger.error(f"❌ Error creating event with Meet: {e}")
            raise
    
    async def update_event(
        self,
        google_event_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing calendar event"""
        try:
            service = await self._get_service()
            
            # Get current event
            event = service.events().get(
                calendarId='primary',
                eventId=google_event_id
            ).execute()
            
            # Apply updates
            for key, value in updates.items():
                event[key] = value
            
            # Update event
            updated_event = service.events().update(
                calendarId='primary',
                eventId=google_event_id,
                body=event,
                sendUpdates='all'
            ).execute()
            
            logger.info(f"✅ Calendar event updated: {google_event_id}")
            
            return {
                'google_event_id': updated_event['id'],
                'status': 'updated'
            }
            
        except Exception as e:
            logger.error(f"❌ Error updating calendar event: {e}")
            raise
    
    async def get_rsvp_responses(self, google_event_id: str) -> List[Dict[str, Any]]:
        """
        Get RSVP responses for an event
        
        Returns:
            List of dicts with email and responseStatus
            responseStatus: 'accepted', 'declined', 'tentative', 'needsAction'
        """
        try:
            service = await self._get_service()
            
            event = service.events().get(
                calendarId='primary',
                eventId=google_event_id
            ).execute()
            
            attendees = event.get('attendees', [])
            
            responses = []
            for attendee in attendees:
                responses.append({
                    'email': attendee['email'],
                    'response_status': attendee.get('responseStatus', 'needsAction'),
                    'display_name': attendee.get('displayName', ''),
                    'optional': attendee.get('optional', False)
                })
            
            logger.info(f"✅ Retrieved {len(responses)} RSVP responses for event {google_event_id}")
            
            return responses
            
        except Exception as e:
            logger.error(f"❌ Error getting RSVP responses: {e}")
            raise
    
    async def delete_event(self, google_event_id: str) -> bool:
        """Delete a calendar event"""
        try:
            service = await self._get_service()
            
            service.events().delete(
                calendarId='primary',
                eventId=google_event_id,
                sendUpdates='all'
            ).execute()
            
            logger.info(f"✅ Calendar event deleted: {google_event_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error deleting calendar event: {e}")
            return False
