# 🛠️ League Management Portal - Setup Guide

## Initial Setup Checklist

### Step 1: Admin Account Creation
1. Access the portal at your league URL
2. Click "Login" and then "Register" or use **"Sign in with Google"**
3. Contact the system administrator to elevate your account to "admin" role
4. Once admin, you can manage all other user roles

### Step 2: League Configuration

#### First-Time Setup Wizard
New leagues are guided through a 4-step setup wizard:
1. **League Info** - Name, sport type, description
2. **Branding** - Logo, colors, design template
3. **First Team** - Create your initial team
4. **Review** - Confirm and launch

#### Website Style Settings (Admin Portal → Settings → Website Design)
- **Header Color** - Top navigation bar color
- **Ticker Settings** - Configure event ticker speed, colors, filters
- **Logo** - Upload your league logo (auto-updates favicon and PWA icon)
- **Primary Colors** - Set league-wide color scheme
- **Design Templates** - Choose from preset themes with daily/random cycling
- **Text Colors** - Input text, secondary text, and accent color pickers

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

#### Email Composer & SMTP
- Admin Portal → Communications → Email to compose and send
- Admin Portal → Communications → Email Config for SMTP setup
- Gmail: Use App Password (not regular password)
  1. Enable 2-Factor Authentication on Google account
  2. Generate App Password in Google Security settings
  3. Enter in Email Config
- Other providers: Enter SMTP server, port, credentials
- Teams can configure their own SMTP for team-level emails

#### SMS (Twilio)
1. Create Twilio account
2. Get Account SID, Auth Token, Phone Number
3. Enter in Admin Portal → Communications → SMS Settings

#### GroupMe
1. Get GroupMe API token
2. Configure in Admin Portal → Communications → GroupMe Settings
3. Link team chat groups

### Step 8: File Manager / Cloud Storage

#### Google Drive
1. Go to Admin Portal → Settings → Cloud Storage
2. Authenticate with Google account
3. Select or create folder for league documents
4. Teams can use the league connection for their own documents

#### OneDrive / Office 365
1. Go to Admin Portal → Settings → Cloud Storage
2. Configure Azure AD credentials
3. Authenticate with Microsoft account
4. Browse and manage files

### Step 9: Recruiting & Join Us Portal

#### Enable Public Recruiting
1. The Join Us page is available on the homepage automatically
2. Visitors can submit: Team Registration, Player Application, or Volunteer signup
3. Go to Admin Portal → Recruiting to review applications
4. Approve applications to auto-create team/player accounts
5. Use Team Invitations to proactively invite teams via email or SMS

---

## Quick Reference: Admin Portal Sections

| Tab Group | Section | Purpose |
|-----------|---------|---------|
| Overview | Dashboard | Clickable stats, quick actions, data health |
| League Mgmt | Events | Schedule management |
| League Mgmt | Seasons | Season configuration |
| League Mgmt | Divisions | Division setup |
| League Mgmt | Teams | Create/edit teams |
| League Mgmt | Team Invites | Invite teams to join |
| League Mgmt | Locations | Venue management |
| Recruiting | Recruiting | Review/approve applications |
| People | Users | Manage all user accounts |
| People | Import Players | Bulk player upload |
| People | Roles | Role management |
| People | Fees & Payments | Stripe/PayPal config |
| Finance | League Finance | Financial overview |
| Communications | Email | Email composer |
| Communications | Team Coaches | Coach notifications |
| Communications | Email Config | SMTP setup |
| Communications | SMS | Twilio SMS settings |
| Communications | GroupMe | GroupMe integration |
| Content | Documents | File manager (Drive/OneDrive) |
| Content | Welcome Message | First-login welcome |
| Content | News | News & announcements |
| Content | Gallery | Photo galleries |
| Content | YouTube | Video settings |
| Settings | Website Design | Styling, ticker, branding, themes |
| Settings | API Keys | Third-party API configuration |
| Settings | Cloud Storage | Google Drive / OneDrive setup |
| Settings | Database | Advanced data management |
| Settings | Data Cleanup | Find and fix data issues |

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
2. Run First-Time Setup Wizard ✓
3. Configure league branding & design template ✓
4. Create divisions ✓
5. Add teams (2-4 to start) ✓
6. Import/add players ✓
7. Create first event ✓
8. Test RSVP flow ✓
9. Test live scoring ✓
10. Configure email/SMTP ✓
11. Set up cloud storage ✓
12. Enable recruiting portal ✓
13. Invite coaches ✓
14. Launch to players ✓
```

---

*Setup complete! Your league is ready to go. (v2.0)*
