"""
Event Card Image Generator Service
Generates visual event cards for GroupMe notifications with team branding
"""

import io
import base64
import logging
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from urllib.parse import urlencode, quote
import requests

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

logger = logging.getLogger(__name__)


class EventCardService:
    """Service for generating visual event card images"""
    
    # Default colors
    DEFAULT_PRIMARY = "#2563eb"
    DEFAULT_ACCENT = "#3b82f6"
    DEFAULT_BG = "#ffffff"
    DEFAULT_TEXT = "#1e293b"
    
    # Card dimensions
    CARD_WIDTH = 600
    CARD_HEIGHT = 400
    
    def __init__(self):
        self.font_cache = {}
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def _get_contrast_color(self, bg_color: str) -> str:
        """Get contrasting text color (black or white) based on background"""
        r, g, b = self._hex_to_rgb(bg_color)
        # Calculate luminance
        luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        return "#ffffff" if luminance < 0.5 else "#1e293b"
    
    def _load_font(self, size: int, bold: bool = False) -> Any:
        """Load a font, falling back to default if needed"""
        if not PIL_AVAILABLE:
            return None
            
        cache_key = f"{size}_{bold}"
        if cache_key in self.font_cache:
            return self.font_cache[cache_key]
        
        try:
            # Try to load system fonts
            font_paths = [
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            ]
            
            for path in font_paths:
                try:
                    font = ImageFont.truetype(path, size)
                    self.font_cache[cache_key] = font
                    return font
                except:
                    continue
            
            # Fallback to default
            font = ImageFont.load_default()
            self.font_cache[cache_key] = font
            return font
            
        except Exception as e:
            logger.warning(f"Could not load font: {e}")
            return ImageFont.load_default()
    
    def _download_logo(self, logo_url: str, max_size: Tuple[int, int] = (80, 80)) -> Optional[Image.Image]:
        """Download and resize team logo"""
        if not logo_url or not PIL_AVAILABLE:
            return None
            
        try:
            response = requests.get(logo_url, timeout=5)
            if response.status_code == 200:
                logo = Image.open(io.BytesIO(response.content))
                logo.thumbnail(max_size, Image.Resampling.LANCZOS)
                # Convert to RGBA for transparency support
                if logo.mode != 'RGBA':
                    logo = logo.convert('RGBA')
                return logo
        except Exception as e:
            logger.warning(f"Could not download logo: {e}")
        
        return None
    
    def generate_event_card(
        self,
        event_data: Dict[str, Any],
        team_data: Optional[Dict[str, Any]] = None,
        rsvp_stats: Optional[Dict[str, int]] = None,
        rsvp_url: Optional[str] = None
    ) -> Optional[bytes]:
        """
        Generate a visual event card image
        
        Args:
            event_data: Event details (title, date, location, etc.)
            team_data: Team info (name, colors, logo_url)
            rsvp_stats: RSVP counts {"yes": 5, "no": 2, "maybe": 3}
            rsvp_url: URL for RSVP link
            
        Returns:
            PNG image bytes or None if failed
        """
        if not PIL_AVAILABLE:
            logger.error("PIL not available for image generation")
            return None
        
        try:
            # Get colors from team data or use defaults
            primary_color = team_data.get('primaryColor', self.DEFAULT_PRIMARY) if team_data else self.DEFAULT_PRIMARY
            accent_color = team_data.get('accentColor', self.DEFAULT_ACCENT) if team_data else self.DEFAULT_ACCENT
            
            # Create canvas with gradient background
            img = Image.new('RGB', (self.CARD_WIDTH, self.CARD_HEIGHT), self._hex_to_rgb(primary_color))
            draw = ImageDraw.Draw(img)
            
            # Draw gradient overlay
            for i in range(self.CARD_HEIGHT):
                alpha = i / self.CARD_HEIGHT
                r1, g1, b1 = self._hex_to_rgb(primary_color)
                r2, g2, b2 = self._hex_to_rgb(accent_color)
                r = int(r1 + (r2 - r1) * alpha * 0.5)
                g = int(g1 + (g2 - g1) * alpha * 0.5)
                b = int(b1 + (b2 - b1) * alpha * 0.5)
                draw.line([(0, i), (self.CARD_WIDTH, i)], fill=(r, g, b))
            
            # Text color based on background
            text_color = self._hex_to_rgb(self._get_contrast_color(primary_color))
            dim_text_color = tuple(int(c * 0.8) for c in text_color)
            
            # Draw white content area
            content_margin = 20
            content_rect = [
                content_margin, 
                80, 
                self.CARD_WIDTH - content_margin, 
                self.CARD_HEIGHT - content_margin
            ]
            draw.rounded_rectangle(content_rect, radius=15, fill=(255, 255, 255))
            
            # Draw team logo if available
            if team_data and team_data.get('logoUrl'):
                logo = self._download_logo(team_data['logoUrl'])
                if logo:
                    logo_x = self.CARD_WIDTH - 90
                    logo_y = 10
                    # Create circular mask
                    mask = Image.new('L', logo.size, 0)
                    mask_draw = ImageDraw.Draw(mask)
                    mask_draw.ellipse([0, 0, logo.size[0], logo.size[1]], fill=255)
                    img.paste(logo, (logo_x, logo_y), mask if logo.mode == 'RGBA' else None)
            
            # Draw team name in header
            team_name = team_data.get('name', 'League Event') if team_data else 'League Event'
            title_font = self._load_font(24, bold=True)
            draw.text((content_margin + 10, 25), team_name, font=title_font, fill=text_color)
            
            # Event type emoji
            event_type = event_data.get('event_type', 'event').lower()
            emoji_map = {
                'game': '🏑',
                'practice': '🥍',
                'meeting': '📋',
                'tournament': '🏆',
                'scrimmage': '⚔️',
                'event': '📅'
            }
            emoji = emoji_map.get(event_type, '📅')
            
            # Draw event title
            event_title = f"{emoji} {event_data.get('title', 'Event')}"
            event_font = self._load_font(22, bold=True)
            draw.text((40, 100), event_title, font=event_font, fill=(30, 41, 59))
            
            # Draw date/time
            date_font = self._load_font(18)
            start_time = event_data.get('start_datetime', '')
            if isinstance(start_time, datetime):
                date_str = start_time.strftime('%A, %B %d at %I:%M %p')
            else:
                date_str = str(start_time)
            draw.text((40, 135), f"📅 {date_str}", font=date_font, fill=(71, 85, 105))
            
            # Draw location
            location = event_data.get('location', '')
            if location:
                draw.text((40, 165), f"📍 {location}", font=date_font, fill=(71, 85, 105))
            
            # Draw RSVP stats if available
            if rsvp_stats:
                stats_y = 210
                stats_font = self._load_font(16)
                
                yes_count = rsvp_stats.get('yes', 0)
                no_count = rsvp_stats.get('no', 0)
                maybe_count = rsvp_stats.get('maybe', 0)
                
                # Draw RSVP boxes
                box_width = 80
                box_height = 50
                spacing = 15
                start_x = 40
                
                # Yes box
                draw.rounded_rectangle(
                    [start_x, stats_y, start_x + box_width, stats_y + box_height],
                    radius=8, fill=(220, 252, 231)
                )
                draw.text((start_x + 15, stats_y + 5), "✅ Yes", font=stats_font, fill=(21, 128, 61))
                count_font = self._load_font(20, bold=True)
                draw.text((start_x + 30, stats_y + 25), str(yes_count), font=count_font, fill=(21, 128, 61))
                
                # No box
                no_x = start_x + box_width + spacing
                draw.rounded_rectangle(
                    [no_x, stats_y, no_x + box_width, stats_y + box_height],
                    radius=8, fill=(254, 226, 226)
                )
                draw.text((no_x + 15, stats_y + 5), "❌ No", font=stats_font, fill=(185, 28, 28))
                draw.text((no_x + 30, stats_y + 25), str(no_count), font=count_font, fill=(185, 28, 28))
                
                # Maybe box
                maybe_x = no_x + box_width + spacing
                draw.rounded_rectangle(
                    [maybe_x, stats_y, maybe_x + box_width, stats_y + box_height],
                    radius=8, fill=(254, 249, 195)
                )
                draw.text((maybe_x + 10, stats_y + 5), "❓ Maybe", font=stats_font, fill=(161, 98, 7))
                draw.text((maybe_x + 30, stats_y + 25), str(maybe_count), font=count_font, fill=(161, 98, 7))
            
            # Draw RSVP URL if available
            if rsvp_url:
                url_y = 290 if rsvp_stats else 210
                url_font = self._load_font(14)
                draw.text((40, url_y), "🔗 RSVP:", font=url_font, fill=(71, 85, 105))
                
                # Truncate URL if too long
                display_url = rsvp_url if len(rsvp_url) < 45 else rsvp_url[:42] + "..."
                draw.text((40, url_y + 20), display_url, font=url_font, fill=(37, 99, 235))
            
            # Draw footer with branding
            footer_y = self.CARD_HEIGHT - 45
            footer_font = self._load_font(12)
            draw.text(
                (40, footer_y), 
                "Reply: /rsvp yes • /rsvp no • /rsvp maybe",
                font=footer_font, 
                fill=(148, 163, 184)
            )
            
            # Convert to bytes
            buffer = io.BytesIO()
            img.save(buffer, format='PNG', optimize=True)
            buffer.seek(0)
            
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Error generating event card: {e}")
            return None
    
    def generate_google_calendar_url(
        self,
        title: str,
        start_datetime: datetime,
        end_datetime: Optional[datetime] = None,
        location: Optional[str] = None,
        description: Optional[str] = None
    ) -> str:
        """
        Generate a Google Calendar add event URL
        
        Args:
            title: Event title
            start_datetime: Event start time
            end_datetime: Event end time (defaults to 2 hours after start)
            location: Event location
            description: Event description
            
        Returns:
            Google Calendar URL for adding the event
        """
        if end_datetime is None:
            from datetime import timedelta
            end_datetime = start_datetime + timedelta(hours=2)
        
        # Format dates for Google Calendar (YYYYMMDDTHHMMSS format)
        def format_datetime(dt: datetime) -> str:
            return dt.strftime('%Y%m%dT%H%M%S')
        
        params = {
            'action': 'TEMPLATE',
            'text': title,
            'dates': f"{format_datetime(start_datetime)}/{format_datetime(end_datetime)}",
        }
        
        if location:
            params['location'] = location
        
        if description:
            params['details'] = description
        
        base_url = "https://calendar.google.com/calendar/render"
        return f"{base_url}?{urlencode(params)}"
    
    def generate_ics_content(
        self,
        event_id: str,
        title: str,
        start_datetime: datetime,
        end_datetime: Optional[datetime] = None,
        location: Optional[str] = None,
        description: Optional[str] = None
    ) -> str:
        """Generate ICS file content for calendar download"""
        from datetime import timedelta
        
        if end_datetime is None:
            end_datetime = start_datetime + timedelta(hours=2)
        
        def format_dt(dt: datetime) -> str:
            return dt.strftime('%Y%m%dT%H%M%SZ')
        
        ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//League Events//EN',
            'BEGIN:VEVENT',
            f'UID:{event_id}@league.app',
            f'DTSTART:{format_dt(start_datetime)}',
            f'DTEND:{format_dt(end_datetime)}',
            f'SUMMARY:{title}',
        ]
        
        if location:
            ics.append(f'LOCATION:{location}')
        
        if description:
            # Escape newlines and commas in description
            safe_desc = description.replace('\n', '\\n').replace(',', '\\,')
            ics.append(f'DESCRIPTION:{safe_desc}')
        
        ics.extend([
            'END:VEVENT',
            'END:VCALENDAR'
        ])
        
        return '\r\n'.join(ics)


# Singleton instance
event_card_service = EventCardService()
