"""
Join Us Router - Handles team registration, player applications, and volunteer signups
With email and in-app notification support
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# Create router
joinus_router = APIRouter(prefix="/join-us", tags=["join-us"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database


# ==================== PYDANTIC MODELS ====================

class TeamRegistrationRequest(BaseModel):
    """Team registration form data"""
    team_name: str
    primary_contact_name: str
    primary_contact_email: str
    primary_contact_phone: Optional[str] = None
    lacrosse_type: str  # 'field', 'box', 'both'
    preferred_division: Optional[str] = None
    logo_url: Optional[str] = None
    home_field_location: Optional[str] = None
    estimated_roster_size: Optional[int] = None
    comments: Optional[str] = None


class PlayerApplicationRequest(BaseModel):
    """Player application form data"""
    name: str
    email: str
    phone: Optional[str] = None
    team_id: str  # Specific team they're applying to
    position: Optional[str] = None
    experience_level: Optional[str] = None  # 'beginner', 'intermediate', 'advanced', 'pro'
    age: Optional[int] = None
    previous_teams: Optional[str] = None
    comments: Optional[str] = None


class VolunteerSignupRequest(BaseModel):
    """Volunteer signup form data"""
    name: str
    email: str
    phone: Optional[str] = None
    interests: List[str] = []  # ['referee', 'scorekeeper', 'coach', 'event_help', 'admin', 'sponsor', 'other']
    availability: Optional[str] = None  # 'weekdays', 'weekends', 'both', 'flexible'
    experience: Optional[str] = None
    comments: Optional[str] = None


class NotificationCreate(BaseModel):
    """Create a new notification"""
    user_id: str
    type: str  # 'team_registration', 'player_application', 'volunteer_signup', 'general'
    title: str
    message: str
    link: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


# ==================== EMAIL HELPERS ====================

async def get_smtp_config():
    """Get SMTP configuration from league_data"""
    try:
        league_data = await db.league_data.find_one({"id": "main_league"})
        return league_data.get("smtpConfig") if league_data else None
    except Exception as e:
        logger.error(f"Error getting SMTP config: {e}")
        return None


async def send_email(to_email: str, subject: str, html_content: str, text_content: str):
    """Send an email using configured SMTP"""
    try:
        smtp_config = await get_smtp_config()
        
        if not smtp_config or not smtp_config.get("email"):
            logger.warning("⚠️ Email not configured - skipping notification")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{smtp_config.get('sender_name', 'League Admin')} <{smtp_config['email']}>"
        msg['To'] = to_email
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        with smtplib.SMTP(smtp_config['host'], smtp_config.get('port', 587)) as server:
            server.starttls()
            server.login(smtp_config['email'], smtp_config['password'])
            server.send_message(msg)
        
        logger.info(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {e}")
        return False


async def get_league_admins():
    """Get all league admin users"""
    try:
        admins = await db.users.find({
            "$or": [
                {"role": "admin"},
                {"role": "league_admin"},
                {"roles": {"$in": ["admin", "league_admin"]}}
            ],
            "status": "active"
        }, {"_id": 0, "password": 0}).to_list(100)
        
        # Deduplicate by email
        seen_emails = set()
        unique_admins = []
        for admin in admins:
            email = admin.get("email")
            if email and email not in seen_emails:
                seen_emails.add(email)
                unique_admins.append(admin)
        
        return unique_admins
    except Exception as e:
        logger.error(f"Error getting league admins: {e}")
        return []


async def get_team_coaches(team_id: str):
    """Get coaches for a specific team"""
    try:
        coaches = await db.users.find({
            "$or": [
                {"teamId": team_id, "roles": {"$in": ["coach"]}},
                {"teamAssignments.teamId": team_id, "roles": {"$in": ["coach"]}}
            ],
            "status": "active"
        }, {"_id": 0, "password": 0}).to_list(50)
        
        return coaches
    except Exception as e:
        logger.error(f"Error getting team coaches: {e}")
        return []


async def create_in_app_notification(user_id: str, notification_type: str, title: str, message: str, link: str = None, metadata: dict = None):
    """Create an in-app notification for a user"""
    try:
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "link": link,
            "metadata": metadata or {},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.notifications.insert_one(notification)
        logger.info(f"✅ In-app notification created for user {user_id}")
        return notification["id"]
    except Exception as e:
        logger.error(f"❌ Failed to create notification: {e}")
        return None


# ==================== TEAM REGISTRATION ====================

@joinus_router.post("/team-registration")
async def submit_team_registration(data: TeamRegistrationRequest):
    """Submit a new team registration request"""
    try:
        # Check for duplicate pending submissions
        existing = await db.team_registrations.find_one({
            "primary_contact_email": data.primary_contact_email.lower(),
            "status": "pending"
        })
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="You already have a pending team registration. Please wait for admin review."
            )
        
        # Create registration record
        registration = {
            "id": str(uuid.uuid4()),
            "team_name": data.team_name,
            "primary_contact_name": data.primary_contact_name,
            "primary_contact_email": data.primary_contact_email.lower(),
            "primary_contact_phone": data.primary_contact_phone,
            "lacrosse_type": data.lacrosse_type,
            "preferred_division": data.preferred_division,
            "logo_url": data.logo_url,
            "home_field_location": data.home_field_location,
            "estimated_roster_size": data.estimated_roster_size,
            "comments": data.comments,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.team_registrations.insert_one(registration)
        logger.info(f"✅ New team registration: {data.team_name} from {data.primary_contact_name}")
        
        # Send confirmation email to applicant
        await send_team_registration_confirmation(data)
        
        # Notify league admins (email + in-app)
        admins = await get_league_admins()
        for admin in admins:
            # Email notification
            await send_admin_team_registration_notification(admin, data)
            
            # In-app notification
            await create_in_app_notification(
                user_id=admin.get("id"),
                notification_type="team_registration",
                title=f"New Team Registration: {data.team_name}",
                message=f"{data.primary_contact_name} wants to register a new team. Review their application.",
                link="/admin?tab=registrations",
                metadata={"registration_id": registration["id"], "team_name": data.team_name}
            )
        
        return {
            "status": "success",
            "message": "Team registration submitted successfully! You'll receive an email confirmation shortly.",
            "registration_id": registration["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error submitting team registration: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def send_team_registration_confirmation(data: TeamRegistrationRequest):
    """Send confirmation email to team registrant"""
    subject = f"Team Registration Received - {data.team_name}"
    
    text_content = f"""Hi {data.primary_contact_name}!

Thank you for registering your team, {data.team_name}!

We've received your registration and will review it shortly. You'll receive an email once your team has been approved and added to the league.

Registration Details:
- Team Name: {data.team_name}
- Type: {data.lacrosse_type.title()}
- Division Preference: {data.preferred_division or 'Not specified'}

If you have any questions, please reply to this email.

Best regards,
League Administration
"""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .details-box {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e2e8f0; }}
        .detail-row {{ display: flex; margin: 8px 0; }}
        .label {{ color: #64748b; width: 150px; font-size: 14px; }}
        .value {{ font-weight: 500; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 Team Registration Received!</h1>
        </div>
        <div class="content">
            <p>Hi {data.primary_contact_name}!</p>
            
            <p>Thank you for registering your team, <strong>{data.team_name}</strong>!</p>
            
            <p>We've received your registration and will review it shortly. You'll receive an email once your team has been approved and added to the league.</p>
            
            <div class="details-box">
                <h3 style="margin-top: 0;">Registration Details</h3>
                <div class="detail-row"><span class="label">Team Name:</span> <span class="value">{data.team_name}</span></div>
                <div class="detail-row"><span class="label">Type:</span> <span class="value">{data.lacrosse_type.title()}</span></div>
                <div class="detail-row"><span class="label">Division:</span> <span class="value">{data.preferred_division or 'Not specified'}</span></div>
                <div class="detail-row"><span class="label">Location:</span> <span class="value">{data.home_field_location or 'Not specified'}</span></div>
            </div>
            
            <p>If you have any questions, please don't hesitate to reach out!</p>
            
            <p>Best regards,<br><strong>League Administration</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message from your league management system.</p>
        </div>
    </div>
</body>
</html>
"""
    
    await send_email(data.primary_contact_email, subject, html_content, text_content)


async def send_admin_team_registration_notification(admin: dict, data: TeamRegistrationRequest):
    """Send notification to admin about new team registration"""
    subject = f"New Team Registration - {data.team_name}"
    
    text_content = f"""Hi {admin.get('name', 'Admin')}!

A new team wants to join the league!

Team Details:
- Team Name: {data.team_name}
- Contact: {data.primary_contact_name} ({data.primary_contact_email})
- Type: {data.lacrosse_type.title()}
- Division: {data.preferred_division or 'Not specified'}
- Location: {data.home_field_location or 'Not specified'}
- Roster Size: {data.estimated_roster_size or 'Not specified'}
- Comments: {data.comments or 'None'}

Log in to the admin portal to review and approve this registration.

Best regards,
League System
"""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .team-card {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e2e8f0; }}
        .detail {{ margin: 8px 0; }}
        .label {{ color: #64748b; font-size: 12px; text-transform: uppercase; }}
        .value {{ font-weight: 500; }}
        .comments-box {{ background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; }}
        .cta-btn {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🆕 New Team Registration</h1>
            <p>{data.team_name}</p>
        </div>
        <div class="content">
            <p>Hi {admin.get('name', 'Admin')}!</p>
            
            <p>A new team wants to join the league!</p>
            
            <div class="team-card">
                <div class="detail"><div class="label">Team Name</div><div class="value">{data.team_name}</div></div>
                <div class="detail"><div class="label">Contact</div><div class="value">{data.primary_contact_name} ({data.primary_contact_email})</div></div>
                <div class="detail"><div class="label">Phone</div><div class="value">{data.primary_contact_phone or 'Not provided'}</div></div>
                <div class="detail"><div class="label">Lacrosse Type</div><div class="value">{data.lacrosse_type.title()}</div></div>
                <div class="detail"><div class="label">Preferred Division</div><div class="value">{data.preferred_division or 'Not specified'}</div></div>
                <div class="detail"><div class="label">Home Field</div><div class="value">{data.home_field_location or 'Not specified'}</div></div>
                <div class="detail"><div class="label">Est. Roster Size</div><div class="value">{data.estimated_roster_size or 'Not specified'}</div></div>
                {f'<div class="comments-box">"{data.comments}"</div>' if data.comments else ''}
            </div>
            
            <p>Log in to the admin portal to review and approve this registration.</p>
            
            <p>Best regards,<br><strong>League System</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from your league management system.</p>
        </div>
    </div>
</body>
</html>
"""
    
    await send_email(admin.get("email"), subject, html_content, text_content)


# ==================== PLAYER APPLICATION ====================

@joinus_router.post("/player-application")
async def submit_player_application(data: PlayerApplicationRequest):
    """Submit a player application to a specific team"""
    try:
        # Verify team exists
        team = await db.teams.find_one({"id": data.team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check for duplicate pending applications
        existing = await db.player_applications.find_one({
            "email": data.email.lower(),
            "team_id": data.team_id,
            "status": "pending"
        })
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="You already have a pending application for this team."
            )
        
        # Create application record
        application = {
            "id": str(uuid.uuid4()),
            "name": data.name,
            "email": data.email.lower(),
            "phone": data.phone,
            "team_id": data.team_id,
            "team_name": team.get("name"),
            "position": data.position,
            "experience_level": data.experience_level,
            "age": data.age,
            "previous_teams": data.previous_teams,
            "comments": data.comments,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.player_applications.insert_one(application)
        logger.info(f"✅ New player application: {data.name} for {team.get('name')}")
        
        # Send confirmation email to applicant
        await send_player_application_confirmation(data, team)
        
        # Notify team coaches (email + in-app)
        coaches = await get_team_coaches(data.team_id)
        
        # If no coaches, notify league admins
        if not coaches:
            coaches = await get_league_admins()
        
        for coach in coaches:
            # Email notification
            await send_coach_player_application_notification(coach, data, team)
            
            # In-app notification
            await create_in_app_notification(
                user_id=coach.get("id"),
                notification_type="player_application",
                title=f"New Player Application: {data.name}",
                message=f"{data.name} wants to join {team.get('name')}. Review their application.",
                link=f"/team/{data.team_id}?tab=admin",
                metadata={"application_id": application["id"], "player_name": data.name, "team_id": data.team_id}
            )
        
        return {
            "status": "success",
            "message": f"Application submitted to {team.get('name')}! You'll receive a confirmation email shortly.",
            "application_id": application["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error submitting player application: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def send_player_application_confirmation(data: PlayerApplicationRequest, team: dict):
    """Send confirmation email to player applicant"""
    team_name = team.get("name", "the team")
    subject = f"Application Received - {team_name}"
    
    text_content = f"""Hi {data.name}!

Thank you for applying to join {team_name}!

We've received your application and the team coaches will review it shortly. You'll receive an email once your application is approved.

Application Details:
- Position: {data.position or 'Not specified'}
- Experience: {data.experience_level or 'Not specified'}

Good luck!

Best regards,
{team_name}
"""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, {team.get('color', '#3b82f6')}, {team.get('style', {}).get('accentColor', '#60a5fa')}); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .status-box {{ background: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📬 Application Received!</h1>
            <p>{team_name}</p>
        </div>
        <div class="content">
            <p>Hi {data.name}!</p>
            
            <p>Thank you for applying to join <strong>{team_name}</strong>!</p>
            
            <div class="status-box">
                <p style="margin: 0;"><strong>Status:</strong> ⏳ Pending Review</p>
            </div>
            
            <p>The team coaches will review your application shortly. You'll receive an email notification when your application is approved.</p>
            
            <p>Good luck!</p>
            
            <p>Best regards,<br><strong>{team_name}</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message from the league management system.</p>
        </div>
    </div>
</body>
</html>
"""
    
    await send_email(data.email, subject, html_content, text_content)


async def send_coach_player_application_notification(coach: dict, data: PlayerApplicationRequest, team: dict):
    """Send notification to coach about new player application"""
    team_name = team.get("name", "your team")
    subject = f"New Player Application - {data.name} for {team_name}"
    
    text_content = f"""Hi {coach.get('name', 'Coach')}!

You have a new player application for {team_name}!

Player Details:
- Name: {data.name}
- Email: {data.email}
- Phone: {data.phone or 'Not provided'}
- Position: {data.position or 'Not specified'}
- Experience: {data.experience_level or 'Not specified'}
- Age: {data.age or 'Not specified'}
- Previous Teams: {data.previous_teams or 'None listed'}
- Comments: {data.comments or 'None'}

Log in to your Team Admin to review this application.

Best regards,
League System
"""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .player-card {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e2e8f0; }}
        .detail {{ margin: 8px 0; }}
        .label {{ color: #64748b; font-size: 12px; text-transform: uppercase; }}
        .value {{ font-weight: 500; }}
        .comments-box {{ background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; font-style: italic; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏃 New Player Application</h1>
            <p>{team_name}</p>
        </div>
        <div class="content">
            <p>Hi {coach.get('name', 'Coach')}!</p>
            
            <p>You have a new player application!</p>
            
            <div class="player-card">
                <div class="detail"><div class="label">Name</div><div class="value">{data.name}</div></div>
                <div class="detail"><div class="label">Email</div><div class="value">{data.email}</div></div>
                <div class="detail"><div class="label">Phone</div><div class="value">{data.phone or 'Not provided'}</div></div>
                <div class="detail"><div class="label">Position</div><div class="value">{data.position or 'Not specified'}</div></div>
                <div class="detail"><div class="label">Experience</div><div class="value">{data.experience_level or 'Not specified'}</div></div>
                <div class="detail"><div class="label">Age</div><div class="value">{data.age or 'Not specified'}</div></div>
                <div class="detail"><div class="label">Previous Teams</div><div class="value">{data.previous_teams or 'None listed'}</div></div>
                {f'<div class="comments-box">"{data.comments}"</div>' if data.comments else ''}
            </div>
            
            <p>Log in to your <strong>Team Admin → Recruiting</strong> section to approve or decline this application.</p>
            
            <p>Best regards,<br><strong>League System</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from your league management system.</p>
        </div>
    </div>
</body>
</html>
"""
    
    await send_email(coach.get("email"), subject, html_content, text_content)


# ==================== VOLUNTEER SIGNUP ====================

@joinus_router.post("/volunteer-signup")
async def submit_volunteer_signup(data: VolunteerSignupRequest):
    """Submit a volunteer signup"""
    try:
        # Check for duplicate pending signups
        existing = await db.volunteer_signups.find_one({
            "email": data.email.lower(),
            "status": "pending"
        })
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="You already have a pending volunteer signup."
            )
        
        # Create signup record
        signup = {
            "id": str(uuid.uuid4()),
            "name": data.name,
            "email": data.email.lower(),
            "phone": data.phone,
            "interests": data.interests,
            "availability": data.availability,
            "experience": data.experience,
            "comments": data.comments,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.volunteer_signups.insert_one(signup)
        logger.info(f"✅ New volunteer signup: {data.name}")
        
        # Send confirmation email to volunteer
        await send_volunteer_signup_confirmation(data)
        
        # Notify league admins (email + in-app)
        admins = await get_league_admins()
        for admin in admins:
            # Email notification
            await send_admin_volunteer_notification(admin, data)
            
            # In-app notification
            await create_in_app_notification(
                user_id=admin.get("id"),
                notification_type="volunteer_signup",
                title=f"New Volunteer: {data.name}",
                message=f"{data.name} wants to volunteer! Interests: {', '.join(data.interests) if data.interests else 'Various'}",
                link="/admin?tab=volunteers",
                metadata={"signup_id": signup["id"], "volunteer_name": data.name}
            )
        
        return {
            "status": "success",
            "message": "Volunteer signup submitted successfully! You'll receive a confirmation email shortly.",
            "signup_id": signup["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error submitting volunteer signup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def send_volunteer_signup_confirmation(data: VolunteerSignupRequest):
    """Send confirmation email to volunteer"""
    interests_str = ", ".join(data.interests) if data.interests else "Various"
    subject = "Volunteer Signup Received - Thank You!"
    
    text_content = f"""Hi {data.name}!

Thank you for volunteering! We really appreciate your willingness to help.

We've received your signup and a league administrator will be in touch soon.

Your Interests:
{interests_str}

Availability: {data.availability or 'Not specified'}

Thanks again for supporting our league!

Best regards,
League Administration
"""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .details-box {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e2e8f0; }}
        .interests-list {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }}
        .interest-tag {{ background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 16px; font-size: 14px; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🙋 Thank You for Volunteering!</h1>
        </div>
        <div class="content">
            <p>Hi {data.name}!</p>
            
            <p>Thank you for volunteering! We really appreciate your willingness to help make our league great.</p>
            
            <div class="details-box">
                <h3 style="margin-top: 0;">Your Interests</h3>
                <div class="interests-list">
                    {''.join([f'<span class="interest-tag">{interest.replace("_", " ").title()}</span>' for interest in data.interests]) if data.interests else '<span class="interest-tag">Various</span>'}
                </div>
                <p style="margin-top: 15px;"><strong>Availability:</strong> {data.availability or 'Flexible'}</p>
            </div>
            
            <p>A league administrator will be in touch soon to discuss how you can help!</p>
            
            <p>Thanks again for supporting our league!</p>
            
            <p>Best regards,<br><strong>League Administration</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message from your league management system.</p>
        </div>
    </div>
</body>
</html>
"""
    
    await send_email(data.email, subject, html_content, text_content)


async def send_admin_volunteer_notification(admin: dict, data: VolunteerSignupRequest):
    """Send notification to admin about new volunteer"""
    interests_str = ", ".join([i.replace("_", " ").title() for i in data.interests]) if data.interests else "Various"
    subject = f"New Volunteer - {data.name}"
    
    text_content = f"""Hi {admin.get('name', 'Admin')}!

A new volunteer has signed up!

Volunteer Details:
- Name: {data.name}
- Email: {data.email}
- Phone: {data.phone or 'Not provided'}
- Interests: {interests_str}
- Availability: {data.availability or 'Flexible'}
- Experience: {data.experience or 'Not specified'}
- Comments: {data.comments or 'None'}

Log in to the admin portal to review and reach out to this volunteer.

Best regards,
League System
"""
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
        .volunteer-card {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e2e8f0; }}
        .detail {{ margin: 8px 0; }}
        .label {{ color: #64748b; font-size: 12px; text-transform: uppercase; }}
        .value {{ font-weight: 500; }}
        .interests-list {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }}
        .interest-tag {{ background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 16px; font-size: 14px; }}
        .comments-box {{ background: #f1f5f9; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }}
        .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🙋 New Volunteer Signup</h1>
        </div>
        <div class="content">
            <p>Hi {admin.get('name', 'Admin')}!</p>
            
            <p>A new volunteer has signed up!</p>
            
            <div class="volunteer-card">
                <div class="detail"><div class="label">Name</div><div class="value">{data.name}</div></div>
                <div class="detail"><div class="label">Email</div><div class="value">{data.email}</div></div>
                <div class="detail"><div class="label">Phone</div><div class="value">{data.phone or 'Not provided'}</div></div>
                <div class="detail"><div class="label">Availability</div><div class="value">{data.availability or 'Flexible'}</div></div>
                <div class="detail"><div class="label">Experience</div><div class="value">{data.experience or 'Not specified'}</div></div>
                <div class="detail">
                    <div class="label">Interests</div>
                    <div class="interests-list">
                        {''.join([f'<span class="interest-tag">{i.replace("_", " ").title()}</span>' for i in data.interests]) if data.interests else '<span class="interest-tag">Various</span>'}
                    </div>
                </div>
                {f'<div class="comments-box">"{data.comments}"</div>' if data.comments else ''}
            </div>
            
            <p>Log in to the admin portal to review and reach out to this volunteer.</p>
            
            <p>Best regards,<br><strong>League System</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from your league management system.</p>
        </div>
    </div>
</body>
</html>
"""
    
    await send_email(admin.get("email"), subject, html_content, text_content)


# ==================== NOTIFICATIONS API ====================

@joinus_router.get("/notifications/{user_id}")
async def get_user_notifications(user_id: str, unread_only: bool = False):
    """Get notifications for a specific user"""
    try:
        query = {"user_id": user_id}
        if unread_only:
            query["read"] = False
        
        notifications = await db.notifications.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {"notifications": notifications}
        
    except Exception as e:
        logger.error(f"❌ Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@joinus_router.get("/notifications/{user_id}/count")
async def get_unread_notification_count(user_id: str):
    """Get count of unread notifications for a user"""
    try:
        count = await db.notifications.count_documents({
            "user_id": user_id,
            "read": False
        })
        
        return {"unread_count": count}
        
    except Exception as e:
        logger.error(f"❌ Error getting notification count: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@joinus_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    try:
        result = await db.notifications.update_one(
            {"id": notification_id},
            {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error marking notification read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@joinus_router.put("/notifications/{user_id}/read-all")
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a user"""
    try:
        result = await db.notifications.update_many(
            {"user_id": user_id, "read": False},
            {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"status": "success", "marked_count": result.modified_count}
        
    except Exception as e:
        logger.error(f"❌ Error marking all notifications read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@joinus_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete a notification"""
    try:
        result = await db.notifications.delete_one({"id": notification_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ADMIN ENDPOINTS ====================

@joinus_router.get("/registrations")
async def get_all_team_registrations(status: str = None):
    """Get all team registrations (admin only)"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        registrations = await db.team_registrations.find(
            query, {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {"registrations": registrations}
        
    except Exception as e:
        logger.error(f"❌ Error fetching registrations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@joinus_router.put("/registrations/{registration_id}")
async def update_team_registration(registration_id: str, data: Dict[str, Any]):
    """Update a team registration status (admin only). Auto-creates team on approval."""
    try:
        new_status = data.get("status")
        
        # Fetch the registration first
        registration = await db.team_registrations.find_one({"id": registration_id}, {"_id": 0})
        if not registration:
            raise HTTPException(status_code=404, detail="Registration not found")
        
        update_fields = {k: v for k, v in data.items() if k not in ["id", "_id"]}
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # If approving, auto-create the team in the league
        if new_status == "approved" and registration.get("status") != "approved":
            team_name = registration.get("team_name", "New Team")
            team_id = team_name.lower().replace(" ", "_").replace("-", "_") + "_" + str(uuid.uuid4())[:6]
            
            # Determine division
            division_map = {
                "field": "Division 1",
                "box": "Premier Division",
                "both": "Division 1"
            }
            lacrosse_type = registration.get("lacrosse_type", "field")
            division = registration.get("preferred_division") or division_map.get(lacrosse_type, "Division 1")
            
            # Create team in league_data.teams
            new_team = {
                "id": team_id,
                "name": team_name,
                "division": division,
                "color": "#3b82f6",
                "logo": "",
                "active": True,
                "style": {
                    "primaryColor": "#3b82f6",
                    "accentColor": "#60a5fa",
                    "backgroundColor": "#ffffff",
                    "textColor": "#1e293b",
                    "headerTextColor": "#ffffff",
                    "secondaryColor": "#94a3b8",
                    "logoUrl": registration.get("logo_url", ""),
                },
                "wins": 0,
                "losses": 0,
                "ties": 0,
                "pf": 0,
                "pa": 0,
            }
            
            # Add to league_data
            await db.league_data.update_one(
                {"id": "main_league"},
                {"$push": {"teams": new_team}}
            )
            
            # Also add to teams collection
            team_doc = {
                "id": team_id,
                "name": team_name,
                "league_id": "main_league",
                "division": division,
                "color": "#3b82f6",
                "logo": registration.get("logo_url", ""),
                "active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.teams.insert_one(team_doc)
            
            # Create a user/coach account for the primary contact
            contact_email = registration.get("primary_contact_email", "")
            existing_user = await db.users.find_one({"email": contact_email})
            
            if existing_user:
                # Add team assignment to existing user, promote to coach
                new_assignment = {
                    "teamId": team_id,
                    "teamName": team_name,
                    "position": "Coach",
                    "isPrimary": True
                }
                roles = list(set(existing_user.get("roles", []) + ["coach"]))
                await db.users.update_one(
                    {"email": contact_email},
                    {
                        "$push": {"teamAssignments": new_assignment},
                        "$set": {"roles": roles, "teamId": team_id, "teamName": team_name}
                    }
                )
            else:
                # Create new user as coach
                new_user = {
                    "id": str(uuid.uuid4()),
                    "name": registration.get("primary_contact_name", "Team Admin"),
                    "email": contact_email,
                    "phone": registration.get("primary_contact_phone", ""),
                    "role": "coach",
                    "roles": ["coach"],
                    "teamId": team_id,
                    "teamName": team_name,
                    "status": "active",
                    "teamAssignments": [{
                        "teamId": team_id,
                        "teamName": team_name,
                        "position": "Coach",
                        "isPrimary": True
                    }],
                    "createdAt": datetime.now(timezone.utc).isoformat()
                }
                await db.users.insert_one(new_user)
            
            update_fields["created_team_id"] = team_id
            logger.info(f"✅ Auto-created team '{team_name}' (ID: {team_id}) from registration approval")
        
        await db.team_registrations.update_one(
            {"id": registration_id},
            {"$set": update_fields}
        )
        
        return {"status": "success", "created_team_id": update_fields.get("created_team_id")}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating registration: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@joinus_router.get("/applications")
async def get_all_player_applications(team_id: str = None, status: str = None):
    """Get all player applications (admin/coach only)"""
    try:
        query = {}
        if team_id:
            query["team_id"] = team_id
        if status:
            query["status"] = status
        
        applications = await db.player_applications.find(
            query, {"_id": 0}
        ).sort("created_at", -1).to_list(200)
        
        return {"applications": applications}
        
    except Exception as e:
        logger.error(f"❌ Error fetching applications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@joinus_router.put("/applications/{application_id}")
async def update_player_application(application_id: str, data: Dict[str, Any]):
    """Update a player application status (admin/coach only). Auto-adds player to team on approval."""
    try:
        new_status = data.get("status")
        
        # Fetch the application first
        application = await db.player_applications.find_one({"id": application_id}, {"_id": 0})
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        update_fields = {k: v for k, v in data.items() if k not in ["id", "_id"]}
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # If approving, auto-add the player to the team
        if new_status == "approved" and application.get("status") != "approved":
            team_id = application.get("team_id")
            team_name = application.get("team_name", "")
            player_email = application.get("email", "").lower()
            player_name = application.get("name", "New Player")
            position = application.get("position", "")
            
            # Get team name from DB if not in application
            if not team_name and team_id:
                team_doc = await db.teams.find_one({"id": team_id})
                if team_doc:
                    team_name = team_doc.get("name", "")
            
            existing_user = await db.users.find_one({"email": player_email})
            
            if existing_user:
                # Check if already assigned to this team
                assignments = existing_user.get("teamAssignments", [])
                already_on_team = any(a.get("teamId") == team_id for a in assignments)
                
                if not already_on_team:
                    new_assignment = {
                        "teamId": team_id,
                        "teamName": team_name,
                        "position": position,
                        "isPrimary": len(assignments) == 0
                    }
                    roles = list(set(existing_user.get("roles", []) + ["player"]))
                    update_data = {
                        "$push": {"teamAssignments": new_assignment},
                        "$set": {"roles": roles}
                    }
                    # Set primary team if user doesn't have one
                    if not existing_user.get("teamId"):
                        update_data["$set"]["teamId"] = team_id
                        update_data["$set"]["teamName"] = team_name
                    
                    await db.users.update_one({"email": player_email}, update_data)
                    logger.info(f"✅ Added existing user '{player_name}' to team '{team_name}'")
            else:
                # Create new user as player
                new_user = {
                    "id": str(uuid.uuid4()),
                    "name": player_name,
                    "email": player_email,
                    "phone": application.get("phone", ""),
                    "role": "player",
                    "roles": ["player"],
                    "teamId": team_id,
                    "teamName": team_name,
                    "status": "active",
                    "position": position,
                    "teamAssignments": [{
                        "teamId": team_id,
                        "teamName": team_name,
                        "position": position,
                        "isPrimary": True
                    }],
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "approvedAt": datetime.now(timezone.utc).isoformat()
                }
                await db.users.insert_one(new_user)
                logger.info(f"✅ Created new player '{player_name}' and added to team '{team_name}'")
            
            update_fields["added_to_team"] = True
        
        await db.player_applications.update_one(
            {"id": application_id},
            {"$set": update_fields}
        )
        
        return {"status": "success", "added_to_team": update_fields.get("added_to_team", False)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating application: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@joinus_router.get("/volunteers")
async def get_all_volunteer_signups(status: str = None):
    """Get all volunteer signups (admin only)"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        volunteers = await db.volunteer_signups.find(
            query, {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {"volunteers": volunteers}
        
    except Exception as e:
        logger.error(f"❌ Error fetching volunteers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@joinus_router.put("/volunteers/{signup_id}")
async def update_volunteer_signup(signup_id: str, data: Dict[str, Any]):
    """Update a volunteer signup status (admin only)"""
    try:
        update_fields = {k: v for k, v in data.items() if k not in ["id", "_id"]}
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.volunteer_signups.update_one(
            {"id": signup_id},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Signup not found")
        
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating volunteer signup: {e}")
        raise HTTPException(status_code=500, detail=str(e))
