# 🛠️ League Management Portal - Setup Guide

## Initial Setup Checklist

### Step 1: Admin Account Creation
1. Access the portal at your league URL
2. Click "Register" to create the first admin account
3. Contact the system administrator to elevate your account to "admin" role
4. Once admin, you can manage all other user roles

### Step 2: League Configuration

#### Website Style Settings (Admin Portal → Website Design)
- **Header Color** - Top navigation bar color
- **Ticker Settings** - Configure event ticker speed, colors, filters
- **Logo** - Upload your league logo (supports Google Drive links)
- **Primary Colors** - Set league-wide color scheme

#### League Information
- Navigate to Admin Portal → Settings
- Set league name, description
- Configure contact information
- Set default timezone

### Step 3: Team Setup

#### Creating Teams
1. Go to Admin Portal → Teams
2. Click "Add Team"
3. Enter team details:
   - Team Name
   - Division
   - Primary/Accent Colors
   - Team Logo URL

#### Team Settings (per team)
- **YouTube Channel** - Link team's YouTube for video display
- **Social Media** - Instagram, Twitter, Facebook, TikTok handles
- **Appearance** - Custom colors, logo opacity, banner image

### Step 4: User & Player Management

#### Importing Players (Recommended for Large Rosters)
1. Go to Admin Portal → Player Importer
2. Prepare CSV/Excel with columns:
   - Name, Email, Phone
   - Team, Position, Jersey Number
3. Upload file or paste data
4. Review and confirm import
5. Players receive password reset emails automatically

#### Manual Player Addition
1. Navigate to a team's Roster tab
2. Click "Add Player" button
3. Search for existing users or create new
4. Assign position and jersey number

#### Role Assignment
| Role | Capabilities |
|------|-------------|
| Admin | Full system access, user management |
| League Admin | All teams, events, cannot modify system settings |
| Coach | Own team management, roster, events |
| Player | View own stats, RSVP to events |
| Guest | Public viewing only |

### Step 5: Event Configuration

#### Creating Events
1. Go to Admin Portal → Events (or team Schedule tab)
2. Click "Add Event"
3. Select event type:
   - **Game** - Scheduled match with two teams
   - **Tournament** - Multi-game event
   - **Practice** - Team training session
   - **Meeting** - Team/league meeting
   - **Social** - Non-sport gathering
4. Set date, time, location
5. Assign teams (for games)
6. Enable RSVP if needed

#### Ticker Configuration
- Admin Portal → Website Design → Ticker Settings
- Set look-back days (show past events)
- Set look-forward days (show upcoming)
- Toggle "Show Cancelled Events"
- Filter by event type

### Step 6: Payment Setup (Optional)

#### Stripe Integration
1. Create Stripe account at stripe.com
2. Get API keys from Stripe Dashboard
3. Enter keys in Admin Portal → Payments
4. Configure products/prices for:
   - Season registration
   - Event fees
   - Merchandise

#### PayPal Integration
1. Create PayPal Business account
2. Get Client ID and Secret
3. Configure in Admin Portal → Payments

### Step 7: Communication Setup

#### Email (SMTP)
- Gmail: Use App Password (not regular password)
  1. Enable 2-Factor Authentication on Google account
  2. Generate App Password in Google Security settings
  3. Enter in Admin Portal → Email Settings
- Other providers: Enter SMTP server, port, credentials

#### SMS (Twilio)
1. Create Twilio account
2. Get Account SID, Auth Token, Phone Number
3. Enter in Admin Portal → SMS Settings

#### GroupMe
1. Get GroupMe API token
2. Configure in Admin Portal → GroupMe Settings
3. Link team chat groups

### Step 8: Google Drive Integration (Optional)

#### For Photo/Video Galleries
1. Go to Admin Portal → Google Drive
2. Authenticate with Google account
3. Select or create folder for league media
4. Enable auto-sync for galleries

---

## Quick Reference: Admin Portal Sections

| Section | Purpose |
|---------|---------|
| Dashboard | Overview, quick stats |
| Users | Manage all user accounts |
| Teams | Create/edit teams |
| Events | Schedule management |
| Player Importer | Bulk player upload |
| Website Design | Styling, ticker, branding |
| Payments | Stripe/PayPal config |
| Email/SMS | Communication settings |
| Database | Advanced data management |

---

## Troubleshooting Common Setup Issues

### Users not receiving emails
- Check SMTP credentials
- Gmail requires "App Password" not regular password
- Check spam/junk folders

### Images not displaying
- Use direct image URLs
- For Google Drive: Share link must be "Anyone with link"
- Use the system's URL converter for Drive links

### Players can't log in
- Check email address spelling
- Use "Send Password Reset" from admin
- Verify account status is "active"

### Ticker not showing events
- Check date range settings (look-back/look-forward)
- Verify event types are enabled in filters
- Events must be within date range

---

## Recommended First-Time Workflow

```
1. Admin account setup ✓
2. Configure league branding ✓
3. Create divisions ✓
4. Add teams (2-4 to start) ✓
5. Import/add players ✓
6. Create first event ✓
7. Test RSVP flow ✓
8. Test live scoring ✓
9. Invite coaches ✓
10. Launch to players ✓
```

---

*Setup complete! Your league is ready to go.*
