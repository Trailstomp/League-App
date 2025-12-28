"""
SMTP Email Service for Event Notifications
Simple, free email notifications using standard SMTP
"""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class SMTPEmailService:
    """Service for sending emails via SMTP"""
    
    # Common SMTP configurations
    SMTP_CONFIGS = {
        'gmail.com': {'host': 'smtp.gmail.com', 'port': 587, 'tls': True},
        'googlemail.com': {'host': 'smtp.gmail.com', 'port': 587, 'tls': True},
        'outlook.com': {'host': 'smtp-mail.outlook.com', 'port': 587, 'tls': True},
        'hotmail.com': {'host': 'smtp-mail.outlook.com', 'port': 587, 'tls': True},
        'yahoo.com': {'host': 'smtp.mail.yahoo.com', 'port': 587, 'tls': True},
        'mlbl.org': {'host': 'smtp.gmail.com', 'port': 587, 'tls': True}  # Google Workspace
    }
    
    def __init__(self, smtp_config: Dict[str, str]):
        """
        Initialize with SMTP configuration
        
        Args:
            smtp_config: Dict with email, password, host (optional), port (optional)
        """
        self.sender_email = smtp_config.get('email')
        self.password = smtp_config.get('password')
        self.sender_name = smtp_config.get('sender_name', 'League Admin')
        
        # Auto-detect SMTP settings based on email domain
        email_domain = self.sender_email.split('@')[1] if '@' in self.sender_email else ''
        auto_config = self.SMTP_CONFIGS.get(email_domain, {})
        
        self.smtp_host = smtp_config.get('host') or auto_config.get('host', 'smtp.gmail.com')
        self.smtp_port = smtp_config.get('port') or auto_config.get('port', 587)
        self.use_tls = smtp_config.get('tls', auto_config.get('tls', True))
    
    def send_event_notification(
        self,
        to_emails: List[str],
        event_title: str,
        event_date: str,
        event_time: str,
        event_location: str,
        event_description: str = '',
        rsvp_link: str = '',
        team_logos: List[str] = None,
        calendar_event: str = None
    ) -> Dict[str, Any]:
        """
        Send event notification email
        
        Args:
            to_emails: List of recipient emails
            event_title: Event title
            event_date: Event date (YYYY-MM-DD)
            event_time: Event time (HH:MM)
            event_location: Event location
            event_description: Optional description
            rsvp_link: Link to RSVP page
            team_logos: Optional list of team logo URLs
            calendar_event: Optional .ics calendar file content
            
        Returns:
            Dict with send status
        """
        try:
            sent_count = 0
            failed = []
            
            for to_email in to_emails:
                try:
                    # Create message
                    msg = MIMEMultipart('alternative')
                    msg['Subject'] = f'Event Reminder: {event_title}'
                    msg['From'] = f'{self.sender_name} <{self.sender_email}>'
                    msg['To'] = to_email
                    
                    # Build HTML email
                    html_body = self._build_event_email_html(
                        event_title=event_title,
                        event_date=event_date,
                        event_time=event_time,
                        event_location=event_location,
                        event_description=event_description,
                        rsvp_link=rsvp_link,
                        team_logos=team_logos
                    )
                    
                    # Attach HTML
                    msg.attach(MIMEText(html_body, 'html'))
                    
                    # Attach calendar file if provided
                    if calendar_event:
                        cal_part = MIMEBase('text', 'calendar', method='REQUEST', name='event.ics')
                        cal_part.set_payload(calendar_event.encode('utf-8'))
                        encoders.encode_base64(cal_part)
                        cal_part.add_header('Content-Description', 'Event')
                        cal_part.add_header('Content-Disposition', 'attachment; filename="event.ics"')
                        msg.attach(cal_part)
                    
                    # Send email
                    with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                        if self.use_tls:
                            server.starttls()
                        server.login(self.sender_email, self.password)
                        server.send_message(msg)
                    
                    sent_count += 1
                    logger.info(f"✅ Email sent to {to_email}")
                    
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
            logger.error(f"❌ Error sending notifications: {e}")
            raise
    
    def send_rsvp_confirmation(
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
            status_emoji = {
                'going': '✅',
                'maybe': '❓',
                'not_going': '❌'
            }.get(rsvp_status, '📝')
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'RSVP Confirmed: {event_title}'
            msg['From'] = f'{self.sender_name} <{self.sender_email}>'
            msg['To'] = to_email
            
            html = f"""
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
                    </div>
                </body>
            </html>
            """
            
            msg.attach(MIMEText(html, 'html'))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.sender_email, self.password)
                server.send_message(msg)
            
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
        team_logos: List[str]
    ) -> str:
        """Build rich HTML email template"""
        
        # Team logos section
        logos_html = ''
        if team_logos:
            logos_html = '<div style="text-align: center; margin: 20px 0;">'
            for logo_url in team_logos[:2]:
                logos_html += f'<img src="{logo_url}" style="width: 80px; height: 80px; margin: 0 20px; border-radius: 50%; object-fit: cover;" alt="Team Logo" />'
            logos_html += '</div>'
        
        # RSVP buttons
        rsvp_buttons = ''
        if rsvp_link:
            # Note: recipient email will be added when sending individual emails
            rsvp_buttons = f"""
            <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666; margin-bottom: 15px;">Please respond:</p>
                <a href="{rsvp_link}&response=going" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; margin: 5px; text-decoration: none; border-radius: 6px; font-weight: bold;">✅ I'm Going</a>
                <a href="{rsvp_link}&response=maybe" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; margin: 5px; text-decoration: none; border-radius: 6px; font-weight: bold;">❓ Maybe</a>
                <a href="{rsvp_link}&response=not_going" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; margin: 5px; text-decoration: none; border-radius: 6px; font-weight: bold;">❌ Can't Make It</a>
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
                    
                    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 30px; border-radius: 4px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            <strong>📎 Calendar Attachment:</strong> This email includes a calendar file you can add to your calendar app.
                        </p>
                    </div>
                </div>
                
                <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-radius: 0 0 12px 12px; margin: 0 20px;">
                    <p style="margin: 5px 0;">Sent by {self.sender_name}</p>
                    <p style="margin: 5px 0;">This is an automated notification</p>
                </div>
            </body>
        </html>
        """
        
        return html
    
    @staticmethod
    def generate_ics_calendar_event(
        event_title: str,
        event_date: str,
        event_time: str,
        event_location: str,
        event_description: str,
        duration_hours: int = 2,
        organizer_email: str = ''
    ) -> str:
        """
        Generate .ics calendar file content
        
        Args:
            event_title: Event title
            event_date: Event date (YYYY-MM-DD)
            event_time: Event time (HH:MM)
            event_location: Event location
            event_description: Event description
            duration_hours: Event duration in hours
            organizer_email: Organizer email
            
        Returns:
            .ics file content as string
        """
        try:
            # Parse datetime
            start_dt = datetime.strptime(f"{event_date} {event_time}", "%Y-%m-%d %H:%M")
            end_dt = start_dt + timedelta(hours=duration_hours)
            
            # Format for iCalendar (UTC)
            start_str = start_dt.strftime("%Y%m%dT%H%M%S")
            end_str = end_dt.strftime("%Y%m%dT%H%M%S")
            timestamp = datetime.now().strftime("%Y%m%dT%H%M%SZ")
            
            # Build .ics content
            ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//League Event Management//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:{start_str}
DTEND:{end_str}
DTSTAMP:{timestamp}
ORGANIZER;CN={organizer_email}:mailto:{organizer_email}
UID:event-{event_date}-{event_time}@league.com
SUMMARY:{event_title}
DESCRIPTION:{event_description}
LOCATION:{event_location}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT24H
DESCRIPTION:Event reminder - 24 hours
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
DESCRIPTION:Event reminder - 1 hour
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR"""
            
            return ics_content
            
        except Exception as e:
            logger.error(f"❌ Error generating .ics file: {e}")
            return None
    
    def test_connection(self) -> Dict[str, Any]:
        """Test SMTP connection and credentials"""
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.sender_email, self.password)
            
            logger.info(f"✅ SMTP connection test successful for {self.sender_email}")
            return {
                'status': 'success',
                'message': 'Connection successful! Email is configured correctly.'
            }
            
        except smtplib.SMTPAuthenticationError:
            return {
                'status': 'error',
                'message': 'Authentication failed. Check email and password.'
            }
        except smtplib.SMTPConnectError:
            return {
                'status': 'error',
                'message': f'Cannot connect to {self.smtp_host}:{self.smtp_port}'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Connection test failed: {str(e)}'
            }
