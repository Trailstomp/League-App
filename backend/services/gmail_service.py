"""
Gmail Service for Event Notifications
Handles sending rich HTML email notifications
"""

import logging
import base64
from email.message import EmailMessage
from typing import Dict, List, Any
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import httpx

logger = logging.getLogger(__name__)


class GmailService:
    """Service for sending Gmail notifications"""
    
    def __init__(self, credentials_config: Dict[str, str], sender_email: str):
        """
        Initialize with Google OAuth credentials
        
        Args:
            credentials_config: Dict with clientId, clientSecret, refreshToken
            sender_email: Email address to send from (e.g., admin@mlbl.org)
        """
        self.credentials_config = credentials_config
        self.sender_email = sender_email
        self.service = None
        
    async def _get_service(self):
        """Get or create Gmail API service with fresh access token"""
        try:
            # Get fresh access token
            access_token = await self._refresh_access_token()
            
            # Create credentials object
            creds = Credentials(token=access_token)
            
            # Build and return service
            return build('gmail', 'v1', credentials=creds)
            
        except Exception as e:
            logger.error(f"❌ Error building Gmail service: {e}")
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
    
    async def send_event_notification(
        self,
        to_emails: List[str],
        event_title: str,
        event_date: str,
        event_time: str,
        event_location: str,
        event_description: str = '',
        rsvp_link: str = '',
        calendar_link: str = '',
        team_logos: List[str] = None
    ) -> Dict[str, Any]:
        """
        Send event notification email with rich HTML
        
        Args:
            to_emails: List of recipient email addresses
            event_title: Event title
            event_date: Event date
            event_time: Event time
            event_location: Event location
            event_description: Optional description
            rsvp_link: Link to RSVP page
            calendar_link: Link to Google Calendar event
            team_logos: Optional list of team logo URLs
            
        Returns:
            Dict with send status and message IDs
        """
        try:
            service = await self._get_service()
            
            # Build HTML email
            html_body = self._build_event_email_html(
                event_title=event_title,
                event_date=event_date,
                event_time=event_time,
                event_location=event_location,
                event_description=event_description,
                rsvp_link=rsvp_link,
                calendar_link=calendar_link,
                team_logos=team_logos
            )
            
            sent_count = 0
            failed = []
            
            for to_email in to_emails:
                try:
                    message = EmailMessage()
                    message['To'] = to_email
                    message['From'] = self.sender_email
                    message['Subject'] = f'Event Reminder: {event_title}'
                    
                    # Add HTML content
                    message.add_alternative(html_body, subtype='html')
                    
                    # Encode and send
                    encoded = base64.urlsafe_b64encode(message.as_bytes()).decode()
                    
                    send_result = service.users().messages().send(
                        userId='me',
                        body={'raw': encoded}
                    ).execute()
                    
                    sent_count += 1
                    logger.info(f"✅ Email sent to {to_email}: {send_result['id']}")
                    
                except Exception as e:
                    logger.error(f"❌ Failed to send to {to_email}: {e}")
                    failed.append(to_email)
            
            return {
                'status': 'success' if sent_count > 0 else 'failed',
                'sent_count': sent_count,
                'failed_count': len(failed),
                'failed_emails': failed
            }
            
        except Exception as e:
            logger.error(f"❌ Error sending event notifications: {e}")
            raise
    
    async def send_rsvp_confirmation(
        self,
        to_email: str,
        event_title: str,
        rsvp_status: str,
        event_date: str,
        event_time: str,
        event_location: str
    ) -> bool:
        """Send RSVP confirmation email"""
        try:
            service = await self._get_service()
            
            status_emoji = {
                'going': '✅',
                'maybe': '❓',
                'not_going': '❌'
            }.get(rsvp_status, '📝')
            
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">RSVP Confirmed {status_emoji}</h1>
                    </div>
                    <div style="padding: 30px; background: #f8f9fa;">
                        <h2 style="color: #333;">Thank you for your response!</h2>
                        <p style="font-size: 16px; color: #666;">
                            You have responded <strong>{rsvp_status.replace('_', ' ').title()}</strong> for:
                        </p>
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #667eea;">{event_title}</h3>
                            <p style="margin: 10px 0;"><strong>📅 Date:</strong> {event_date}</p>
                            <p style="margin: 10px 0;"><strong>🕐 Time:</strong> {event_time}</p>
                            <p style="margin: 10px 0;"><strong>📍 Location:</strong> {event_location}</p>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            You can change your RSVP at any time by visiting the event page.
                        </p>
                    </div>
                    <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
                        <p>Sent by Midwest Lacrosse League</p>
                    </div>
                </body>
            </html>
            """
            
            message = EmailMessage()
            message['To'] = to_email
            message['From'] = self.sender_email
            message['Subject'] = f'RSVP Confirmed: {event_title}'
            message.add_alternative(html_body, subtype='html')
            
            encoded = base64.urlsafe_b64encode(message.as_bytes()).decode()
            service.users().messages().send(
                userId='me',
                body={'raw': encoded}
            ).execute()
            
            logger.info(f"✅ RSVP confirmation sent to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error sending RSVP confirmation: {e}")
            return False
    
    def _build_event_email_html(
        self,
        event_title: str,
        event_date: str,
        event_time: str,
        event_location: str,
        event_description: str,
        rsvp_link: str,
        calendar_link: str,
        team_logos: List[str]
    ) -> str:
        """Build rich HTML email template"""
        
        # Team logos section
        logos_html = ''
        if team_logos:
            logos_html = '<div style="text-align: center; margin: 20px 0;">'
            for logo_url in team_logos[:2]:  # Max 2 logos
                logos_html += f'<img src="{logo_url}" style="width: 80px; height: 80px; margin: 0 20px; border-radius: 50%; object-fit: cover;" />'
            logos_html += '</div>'
        
        # RSVP buttons
        rsvp_buttons = ''
        if rsvp_link:
            rsvp_buttons = f"""
            <div style="text-align: center; margin: 30px 0;">
                <a href="{rsvp_link}?response=going" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; margin: 5px; text-decoration: none; border-radius: 6px; font-weight: bold;">✅ I'm Going</a>
                <a href="{rsvp_link}?response=maybe" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; margin: 5px; text-decoration: none; border-radius: 6px; font-weight: bold;">❓ Maybe</a>
                <a href="{rsvp_link}?response=not_going" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; margin: 5px; text-decoration: none; border-radius: 6px; font-weight: bold;">❌ Can't Make It</a>
            </div>
            """
        
        # Calendar button
        calendar_button = ''
        if calendar_link:
            calendar_button = f"""
            <div style="text-align: center; margin: 20px 0;">
                <a href="{calendar_link}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">📅 Add to Calendar</a>
            </div>
            """
        
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f3f4f6;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 32px;">📅 Event Notification</h1>
                </div>
                
                {logos_html}
                
                <div style="background: white; padding: 30px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; font-size: 28px; margin-top: 0;">{event_title}</h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 12px 0; font-size: 16px;"><strong>📅 Date:</strong> {event_date}</p>
                        <p style="margin: 12px 0; font-size: 16px;"><strong>🕐 Time:</strong> {event_time}</p>
                        <p style="margin: 12px 0; font-size: 16px;"><strong>📍 Location:</strong> {event_location}</p>
                    </div>
                    
                    {f'<p style="color: #666; font-size: 16px; line-height: 1.6;">{event_description}</p>' if event_description else ''}
                    
                    {rsvp_buttons}
                    {calendar_button}
                    
                    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 30px; border-radius: 4px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            <strong>⏰ Reminders:</strong> You'll receive reminders 24 hours and 1 hour before the event.
                        </p>
                    </div>
                </div>
                
                <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-radius: 0 0 12px 12px;">
                    <p style="margin: 5px 0;">Midwest Lacrosse League</p>
                    <p style="margin: 5px 0;">This is an automated notification</p>
                </div>
            </body>
        </html>
        """
        
        return html
