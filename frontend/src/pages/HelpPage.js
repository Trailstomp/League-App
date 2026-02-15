import React, { useState, useEffect } from 'react';

const HelpPage = () => {
    const [activeDoc, setActiveDoc] = useState('index');
    const [searchTerm, setSearchTerm] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        const fetchAdminEmail = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/league-data`);
                if (res.ok) {
                    const data = await res.json();
                    setAdminEmail(data.smtpConfig?.email || '');
                }
            } catch (e) { /* silent */ }
        };
        fetchAdminEmail();
    }, [backendUrl]);

    const docs = {
        index: {
            title: '📚 Documentation Index',
            icon: '📚',
            content: '__INDEX__'
        },
        brochure: {
            title: '🥍 Feature Brochure',
            icon: '🥍',
            content: `
# League Management Portal
## Complete Lacrosse League Management Solution

---

## ✨ Key Features

### 🏆 Team Management
- **Multi-Team Support** - Players can be assigned to multiple teams
- **Team Rosters** - Visual player cards with photos, positions, and stats
- **Team Styling** - Custom colors, logos, and branding per team
- **Social Media Integration** - Link team Instagram, Twitter, Facebook, TikTok, YouTube

### 📅 Event & Schedule Management
- **Live Event Ticker** - Scrolling display of upcoming games and events
- **Event Types** - Games, Tournaments, Practices, Meetings, Social Events
- **RSVP System** - Players can respond to events via email/SMS links
- **Location Management** - Venue details with maps integration

### 🎯 Live Game Scoring
- **Real-Time Scoring** - Track goals, saves, and shots as they happen
- **Shot Clock** - Built-in shot clock with disable option
- **Player Stats** - Individual player statistics per game
- **Three-Button System** - Goal, Save, Miss tracking for accurate stats

### 👤 Player Profiles
- **Digital Player Cards** - Professional trading card-style profiles
- **Career Stats** - Statistics tracked by year/season
- **Lacrosse History** - High school, college, and post-grad teams
- **PDF Export** - Download and print player cards

### 📺 Media & Content
- **YouTube Integration** - Embed team channels and live streams
- **Photo Galleries** - Team and event photo collections
- **Google Drive Sync** - Automatic media synchronization

### 💰 Payments & Fees
- **Stripe Integration** - Secure online payments
- **PayPal Support** - Alternative payment option
- **Fee Management** - Track dues, registration, and event fees

### 📱 Communication
- **GroupMe Integration** - Team chat connectivity
- **SMS Notifications** - Twilio-powered text alerts
- **Email System** - Automated invites and reminders

### 🔐 Role-Based Access
- **Admin** - Full system control
- **League Admin** - League-wide management
- **Coach/Team Admin** - Team-specific controls
- **Player** - Personal dashboard and stats
- **Guest** - Public viewing access

### 🤝 Player Recruitment
- **Public Join Pages** - Shareable links for prospective players and coaches
- **Join Request Forms** - Collect player info, position, experience
- **Coach Applications** - Coaches can apply through the same join form with coaching-specific fields
- **Admin Approval Flow** - Review, approve, or decline requests (Coach badge shown for coach requests)
- **Email Notifications** - Automatic alerts to coaches and admins on new requests
- **Player Invites** - Proactively invite players via email

### 🎨 Design & Theming
- **Background Textures** - 14 tileable textures (wood, metal, leather, turf, brick, stone, and more)
- **Texture Picker** - Apply textures to any background or color setting throughout the site
- **Design Templates** - Save, load, and cycle between multiple visual themes
- **Template Preview** - Mini visual previews of each saved template
- **Content Text Colors** - Admin-controlled text colors that affect all page content

### ⚙️ User Preferences
- **Floating Preferences Bubble** - Accessible to all visitors via a button in the bottom-right corner
- **Theme Selector** - Browse and apply saved design templates instantly
- **Auto-Rotate Themes** - Toggle between a fixed theme or rotating themes on each visit
- **Default Landing Page** - Choose which page loads first (Home, Events, Standings, Help)
- **Persistent Choices** - Preferences saved in browser and restored on return visits

### 📱 Add to Home Screen (PWA)
- **Install as App** - Add the site to your phone's home screen for a native app experience
- **Install Button** - One-click install from the sidebar navigation
- **iOS & Android Support** - Step-by-step instructions for Safari and Chrome
- **Offline Access** - Basic pages cached for offline viewing
            `
        },
        setup: {
            title: '🛠️ Setup Guide',
            icon: '🛠️',
            content: `
# Setup Guide

## Initial Setup Checklist

### Step 1: Admin Account Creation
1. Access the portal at your league URL
2. Click "Register" to create the first admin account
3. Contact the system administrator to elevate your account to "admin" role

### Step 2: League Configuration

#### Website Style Settings
- **Header Color** - Top navigation bar color
- **Ticker Settings** - Configure event ticker speed, colors, filters
- **Logo** - Upload your league logo
- **Primary Colors** - Set league-wide color scheme
- **Background Textures** - Choose from 14 textures (wood, metal, leather, turf, brick, stone, etc.) for any background area
- **Content Text Colors** - Set heading, body, and secondary text colors that apply across all pages
- **Design Templates** - Save your style as a template, create multiple themes for users to choose from

### Step 3: Team Setup

#### Creating Teams
1. Go to Admin Portal → Teams
2. Click "Add Team"
3. Enter team details:
   - Team Name
   - Division
   - Primary/Accent Colors
   - Team Logo URL

### Step 4: User & Player Management

#### Importing Players
1. Go to Admin Portal → Player Importer
2. Prepare CSV with: Name, Email, Phone, Team, Position, Jersey Number
3. Upload and confirm import
4. Players receive password reset emails automatically

#### Role Assignment
| Role | Capabilities |
|------|-------------|
| Admin | Full system access |
| League Admin | All teams, events |
| Coach | Own team management |
| Player | View own stats, RSVP |
| Guest | Public viewing only |

### Step 5: Event Configuration

#### Creating Events
1. Go to Admin Portal → Events
2. Click "Add Event"
3. Select event type: Game, Tournament, Practice, Meeting, Social
4. Set date, time, location
5. Enable RSVP if needed

### Step 6: Communication Setup

#### Email (SMTP)
- Gmail: Use App Password (not regular password)
- Generate App Password in Google Security settings

#### SMS (Twilio)
1. Create Twilio account
2. Get Account SID, Auth Token, Phone Number
3. Enter in Admin Portal → SMS Settings

### Step 7: Design Templates & Themes

#### Creating Design Templates
1. Customize your site appearance in **Admin Portal → Website Design**
2. Click **"Save as Template"** to save the current look
3. Name your template (e.g., "Game Day Theme", "Off-Season Look")
4. Toggle **"Visible to Users"** so visitors can select it from the theme picker

#### Background Textures
1. In any background color setting, click the texture icon
2. Choose from 14 textures: Leather, Wood, Metal, Carbon Fiber, Concrete, Turf, Brick, Stone, and more
3. Textures tile seamlessly across the background area

#### Content Text Colors
1. In Website Design → Typography section
2. Set **Content Text Color** for body text across all pages
3. Set **Card Heading Color** for headings
4. Changes apply immediately to all page content

### Step 8: PWA Setup (Add to Home Screen)

#### How It Works
The site automatically serves as a Progressive Web App (PWA). Users can install it on their phone for a native app experience.

#### For Users
1. Look for the **"Install App"** button in the sidebar navigation
2. On iOS Safari: tap Share → "Add to Home Screen"
3. On Android Chrome: tap the install prompt or use the menu
            `
        },
        admin: {
            title: '👑 Admin Guide',
            icon: '👑',
            content: `
# Admin User Guide

## Your Role
As an **Admin**, you have complete control over the league management system.

---

## Quick Start Checklist
- [ ] Configure league branding (logo, colors)
- [ ] Set up teams and divisions
- [ ] Import or create player accounts
- [ ] Configure email/SMS settings
- [ ] Create initial events

---

## Daily Tasks

### Monitor Dashboard
- Check new user registrations
- Review pending RSVPs
- Monitor upcoming events

### User Management
| Action | How To |
|--------|--------|
| Approve new user | Click user → Set status to "Active" |
| Change role | Click user → Select new role |
| Reset password | Click user → "Send Password Reset Link" |
| Deactivate user | Click user → Set status to "Inactive" |

---

## Player Recruitment

### Reviewing Join Requests
When a prospective player or coach submits a join request, you'll receive an email notification.

1. Navigate to the team's page → **Admin** tab → **Recruiting** section
2. Review the pending request (name, email, position, experience)
3. **Coach requests** are marked with a purple "Coach" badge
4. Click **Approve** to add them to the roster, or **Decline**
5. The player/coach gets an email with the result

### Team Join Links
Each team has a public join page at \`/join/{team-id}\`. Share this link to collect player and coach applications.

See the **Player Recruitment** guide for the full workflow.

---

## Design & Theming

### Background Textures
1. In **Admin Portal → Website Design**, find any background color setting
2. Click the texture icon next to the color picker
3. Choose from 14 tileable textures (wood, metal, leather, turf, brick, stone, etc.)
4. Textures can be applied to navigation, banner, main content, cards, and more

### Content Text Colors
The **Content Text Color** and **Card Heading Color** settings in Website Design now control text colors across all pages. When you change these, headings, body text, and labels throughout the site will update.

### Design Templates
1. Customize the site's look in Website Design
2. Click **"Save as Template"** to save your design
3. Toggle **"Visible to Users"** so visitors can select the theme
4. Create multiple templates (e.g., "Game Day", "Off-Season", "Dark Mode")
5. Users see these in the **floating preferences bubble** at the bottom-right corner

### User Preferences Bubble
A floating button appears at the bottom-right corner for all visitors. It lets users:
- **Choose a theme** from your saved templates
- **Toggle auto-rotate** to get a different look on each visit
- **Set a default landing page** (Home, Events, Standings, Help)
- Preferences persist in the browser across sessions

---

## Ticker Configuration
- **Look-back days**: Past events to show
- **Look-forward days**: Future events to display
- **Show cancelled**: Toggle visibility of cancelled events
- **Event type filters**: Choose which types appear

---

## Troubleshooting

### "User can't log in"
1. Check account status (must be "Active")
2. Verify email address is correct
3. Send password reset link

### "Events not showing in ticker"
1. Check ticker date range settings
2. Verify event has a valid date
3. Check event type filters

### "Emails not sending"
1. Verify SMTP settings
2. For Gmail: ensure using App Password
            `
        },
        leagueAdmin: {
            title: '🏅 League Admin Guide',
            icon: '🏅',
            content: `
# League Admin User Guide

## Your Role
As a **League Admin**, you can manage all teams, events, and players across the league.

---

## What You Can Do
✅ Manage all teams and rosters
✅ Create and edit events for any team
✅ View and manage all players
✅ Access live scoring for any game
✅ Create news and announcements

## What Requires Full Admin
❌ User role changes
❌ System-wide settings (SMTP, Stripe)
❌ Website branding/styling

---

## Managing Events

### Creating a Game
1. Navigate to Admin Portal → Events
2. Click "Add Event"
3. Select Type: Game
4. Choose Home Team and Away Team
5. Set Date, Time, and Location
6. Save

### Cancelling Events
1. Open the event
2. Change Status to "Cancelled"
3. Send notification if needed

---

## Live Scoring

### Starting Live Scoring
1. Find the game event
2. Click "Live Score"
3. Verify rosters loaded
4. Begin tracking

### During the Game
| Action | Button |
|--------|--------|
| Goal scored | Click "Goal" |
| Shot saved | Click "Save" |
| Shot missed | Click "Miss" |
            `
        },
        coach: {
            title: '🏃 Coach Guide',
            icon: '🏃',
            content: `
# Coach / Team Admin Guide

## Your Role
As a **Coach**, you manage your team's roster, events, and settings.

---

## What You Can Do
✅ Manage your team's roster
✅ Edit player positions and numbers
✅ Create team events (practices, meetings)
✅ Score your team's games
✅ Manage team settings
✅ Recruit new players via join requests
✅ Send player invites via email
✅ Upload photos and manage team media
✅ Review coach and player join requests

---

## Managing Your Roster

### Adding a New Player
1. Go to your team's **Roster** tab
2. Click **"+ Add Player"** button
3. Search for the player
4. Select and add to roster

### Editing Player Details
1. Hover over a player card
2. Click the **pencil icon**
3. Update Jersey Number or Position
4. Click **Save Changes**

### Removing a Player
1. Hover over the player card
2. Click the **trash icon**
3. Confirm removal

---

## Team Settings

### Social Media Links
1. Go to **Settings** tab
2. Click **"Social Media"**
3. Enter your handles (Instagram, Twitter, etc.)
4. Click **Save**

### Team Appearance
1. Settings → **Appearance**
2. Customize colors, logo, banner
3. Preview and save

---

## Live Game Scoring

### Scoring a Goal
1. Click **"Goal"** button
2. Select player who scored (optional)
3. Score updates immediately

### Ending the Game
1. Verify final score
2. Click **"Mark as Final"**

---

## Recruiting New Players

### Sharing Your Join Link
Your team's public join page is at \`/join/{your-team-id}\`. Share this link on social media, in emails, or on flyers.

### Reviewing Join Requests
1. Go to your team page → **Admin** tab
2. Open the **Recruiting** section
3. Pending requests show with a badge count
4. **Coach requests** display a purple "Coach" badge so you can distinguish them from player requests
5. Review each request and click **Approve** or **Decline**
6. Approved players/coaches are auto-added to your roster

### Sending Invites
1. In the Recruiting section, enter a player's email
2. Add an optional personal message
3. Click **Send Invite**

You'll also receive **email notifications** whenever a new join request comes in.

See the **Player Recruitment** guide for the complete workflow.
            `
        },
        player: {
            title: '🥍 Player Guide',
            icon: '🎮',
            content: `
# Player User Guide

## Your Role
As a **Player**, you can view your stats, see your team's schedule, and respond to events.

---

## What You Can Do
✅ View your player profile and stats
✅ See your team roster
✅ View upcoming events
✅ RSVP to events
✅ Download your player card

---

## Your Player Card

### Finding Your Card
1. Click your team in the sidebar
2. Go to the **Roster** tab
3. Click your player card

### Your Card Shows
**Front:** Photo, jersey number, position, team logo
**Back:** Stats, career history, fun facts

### Downloading Your Card
1. Click your player card
2. Click **"📥 Save PDF"**
3. Two-page PDF downloads

---

## RSVPing to Events

### From Event Card
1. Find the event
2. Click to open details
3. Select: ✅ Going or ❌ Not Going

### Why RSVP Matters
- Coaches use RSVPs to plan
- Ensures enough players for games
- Shows commitment to team

---

## Viewing Your Stats

### Current Season
On your player card back:
- Goals, Assists, Points

### Career Stats by Year
Scroll down on card to see year-by-year breakdown

---

## Site Preferences

### Changing the Theme
1. Click the **floating settings button** in the bottom-right corner of any page
2. Browse available themes in the **Themes** tab
3. Click a theme to apply it instantly
4. Toggle **"Auto-Rotate Themes"** to get a fresh look on each visit

### Setting Your Default Page
1. Open the preferences bubble (bottom-right button)
2. Go to the **Default Page** tab
3. Choose which page loads first when you visit the site (Home, Events, Standings, or Help)

Your preferences are saved automatically and persist across visits.

---

## Add to Home Screen

### Install as App
You can install this site as an app on your phone for quick access:

1. Look for the **"Install App"** button in the navigation sidebar
2. **iPhone (Safari):** Tap the Share button → "Add to Home Screen"
3. **Android (Chrome):** Tap the install banner or use Menu → "Add to Home Screen"

The app icon will appear on your home screen for easy one-tap access.
            `
        },
        guest: {
            title: '👀 Guest Guide',
            icon: '👀',
            content: `
# Guest / Visitor Guide

## Welcome!
As a **Guest**, you can browse public information without logging in.

---

## What You Can See
✅ League homepage
✅ Team listings
✅ Public event schedule
✅ Live ticker with scores
✅ Team rosters
✅ Photo galleries
✅ Change site theme via preferences bubble
✅ Install as app on your phone

## What Requires an Account
❌ RSVP to events
❌ View detailed stats
❌ Download player cards

---

## The Ticker
The scrolling ticker shows:
- Recent game scores (e.g., "Eagles 3 - Hawks 1")
- Upcoming events
- Tournaments

**Tip:** Hover to pause!

---

## Viewing Teams

### Finding a Team
1. Look in the sidebar under "TEAMS"
2. Click division to expand
3. Click team name to view

### Team Pages Show
- Team logo and colors
- Current record
- Roster
- Schedule
- Gallery

---

## Want to Join?

### Creating an Account
1. Click "Register" or "Sign Up"
2. Fill in your information
3. Wait for admin approval

---

## Personalizing Your Experience

### Preferences Bubble
Look for the **settings button** in the bottom-right corner of any page. No login required!

- **Themes tab** - Browse and apply different visual themes for the site
- **Auto-Rotate** - Turn on to see a new theme each time you visit
- **Default Page tab** - Choose which page loads first (Home, Events, Standings, or Help)

Your preferences are saved in your browser automatically.

### Add to Home Screen
Install the site as an app on your phone:

1. **iPhone (Safari):** Tap Share → "Add to Home Screen"
2. **Android (Chrome):** Tap the install banner or Menu → "Add to Home Screen"
3. Or use the **"Install App"** button in the sidebar

The site appears as an app icon on your home screen for quick access.
            `
        },
        recruitment: {
            title: '🤝 Player Recruitment',
            icon: '🤝',
            content: `
# Player Recruitment & Join Requests

This guide covers the complete workflow for recruiting new players to your team — from sharing a join link to approving requests.

---

## Overview

The recruitment flow has three steps:

1. **Share** a public join link for your team
2. **Prospective player or coach** fills out the join request form
3. **Coach/Admin** reviews and approves or declines the request

When a request is submitted, team admins and coaches receive an **email notification** automatically. When a decision is made, the player/coach receives an email with the result.

---

## For Coaches / Team Admins

### Finding Your Team's Join Link

Your team has a public join page at:

\`your-league-url/join/your-team-id\`

For example: \`https://yourleague.com/join/eagles_01\`

You can share this link on social media, flyers, or via email.

### Viewing Join Requests

1. Navigate to your **Team Page**
2. Go to the **Admin** tab
3. Find the **Recruiting** section
4. Pending requests appear with a badge count

### Approving a Request

1. In the Recruiting section, find the player's or coach's request
2. Coach requests are marked with a purple **"Coach"** badge
3. Review their details (name, email, position/experience, message)
4. Click **Approve**
5. The person is automatically:
   - Added to your team roster
   - Given the appropriate role ("player" or "coach")
   - Sent an approval email notification

### Declining a Request

1. Click **Decline** on the request
2. Optionally provide a reason
3. The player receives a polite declination email

### Sending Invites

You can also proactively invite players:

1. Go to the **Recruiting** section of the Admin tab
2. Enter the player's **email address**
3. Add a personal message (optional)
4. Click **Send Invite**
5. The player receives an email with instructions to join

---

## For League Admins

### Managing Requests Across Teams

League admins can view and process join requests for any team by navigating to that team's Admin tab.

### Inviting Entire Teams

League admins can invite teams to join the league:

1. Go to **Admin Portal → Team Invites**
2. Enter the team name and contact details
3. Send the invitation

---

## For Players (Prospective)

### Requesting to Join a Team

1. Open the join link shared by your coach or team
2. Fill out the form:
   - **Name** (required)
   - **Email** (required)
   - **Phone**
   - **Role** - Choose "Player" or "Coach"
3. **If joining as a Player:**
   - **Preferred Position** (Attack, Midfield, Defense, Goalie, etc.)
   - **Desired Jersey Number**
   - **Playing Experience Level**
4. **If joining as a Coach:**
   - **Coaching Experience** (New to Coaching, Assistant Coach, Head Coach, etc.)
5. Add a **Personal Message** (optional)
6. Click **Submit Request**
7. You'll receive a confirmation email
8. Wait for the team admin to review your request

### After Approval

Once approved, you'll:
- Receive an email notification
- Be added to the team roster automatically
- Be able to log in and see your team page, schedule, and RSVP to events

---

## Email Notifications

| Event | Who Gets Notified |
|-------|-------------------|
| New join request submitted | Team coaches, team admins, league admins |
| Request approved | The requesting player |
| Request declined | The requesting player |
| Invite sent | The invited player |

**Note:** Email notifications require SMTP settings to be configured in Admin Portal → Communications → Email Hub.
            `
        },
        reference: {
            title: '📋 Quick Reference',
            icon: '📋',
            content: `
# Quick Reference Card

## Role Permissions

| Feature | Admin | League Admin | Coach | Player | Guest |
|---------|:-----:|:------------:|:-----:|:------:|:-----:|
| View public content | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change site theme (prefs) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Install as app (PWA) | ✅ | ✅ | ✅ | ✅ | ✅ |
| RSVP to events | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage team roster | ✅ | ✅ | ✅* | ❌ | ❌ |
| Create events | ✅ | ✅ | ✅* | ❌ | ❌ |
| Live scoring | ✅ | ✅ | ✅* | ❌ | ❌ |
| Approve join requests | ✅ | ✅ | ✅* | ❌ | ❌ |
| Send player invites | ✅ | ✅ | ✅* | ❌ | ❌ |
| Upload team media | ✅ | ✅ | ✅* | ❌ | ❌ |
| Design templates/textures | ✅ | ❌ | ❌ | ❌ | ❌ |
| User management | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ | ❌ |

*Own team only

---

## Event Status Codes

| Status | Color | Meaning |
|--------|-------|---------|
| UPCOMING | 🔵 | Scheduled |
| LIVE | 🔴 | In progress |
| FINAL | ⚫ | Completed |
| POSTPONED | 🟠 | Delayed |
| CANCELLED | 🔴 | Not happening |

---

## Event Types

| Type | Use For |
|------|---------|
| Game | Regular matches |
| Tournament | Competitions |
| Practice | Training |
| Meeting | Meetings |
| Social | Team events |

---

## Player Positions

| Position | Abbrev |
|----------|--------|
| Attack | A |
| Midfield | M |
| Defense | D |
| Goalie | G |
| FOGO | F |
| LSM | L |

---

## Ticker Settings

| Setting | Default | Effect |
|---------|---------|--------|
| Look Back Days | 365 | Past events shown |
| Look Forward Days | 365 | Future events shown |
| Show Cancelled | Off | Include cancelled |

---

## User Preferences (Floating Bubble)

| Feature | Description |
|---------|-------------|
| Theme Selector | Browse and apply saved design templates |
| Auto-Rotate | New theme on each visit |
| Default Page | Choose Home, Events, Standings, or Help as landing page |
| Persistence | Saved in browser, restored on return |

---

## Background Textures

| Texture | Description |
|---------|-------------|
| Leather | Classic leather texture |
| Wood Horizontal | Light wood grain |
| Metal | Brushed metal surface |
| Carbon Fiber | Woven carbon pattern |
| Concrete | Industrial concrete |
| Turf | Green field turf |
| Brick | Red brick wall |
| Vertical Wood | Dark wood planks |
| Stone | Natural stone surface |
| Bark | Tree bark texture |
| Sand | Beach sand surface |
| Marble | Polished marble |
| Fabric | Woven fabric |
| Paper | Textured paper |
            `
        }
    };

    const docList = [
        { id: 'index', label: 'Documentation Index', icon: '📚' },
        { id: 'brochure', label: 'Feature Brochure', icon: '🥍' },
        { id: 'setup', label: 'Setup Guide', icon: '🛠️' },
        { id: 'admin', label: 'Admin Guide', icon: '👑' },
        { id: 'leagueAdmin', label: 'League Admin Guide', icon: '🏅' },
        { id: 'coach', label: 'Coach Guide', icon: '🏃' },
        { id: 'recruitment', label: 'Player Recruitment', icon: '🤝' },
        { id: 'player', label: 'Player Guide', icon: '🎮' },
        { id: 'guest', label: 'Guest Guide', icon: '👀' },
        { id: 'reference', label: 'Quick Reference', icon: '📋' }
    ];

    const handlePrint = () => {
        const printContent = document.getElementById('doc-content');
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${docs[activeDoc].title}</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 40px;
                        line-height: 1.6;
                    }
                    h1 { color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
                    h2 { color: #1e3a8a; margin-top: 30px; }
                    h3 { color: #1e40af; }
                    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background: #f1f5f9; }
                    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
                    pre { background: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto; }
                    ul, ol { margin: 15px 0; }
                    li { margin: 8px 0; }
                    hr { border: none; border-top: 1px solid #e2e8f0; margin: 30px 0; }
                    @media print {
                        body { padding: 20px; }
                        h1 { page-break-after: avoid; }
                        h2, h3 { page-break-after: avoid; }
                        table { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleDownload = () => {
        const content = docs[activeDoc].content;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeDoc}_guide.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderMarkdown = (text) => {
        // Simple markdown rendering
        let html = text
            // Headers
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-slate-800 mt-6 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-blue-800 mt-8 mb-3 pb-2 border-b">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-blue-900 mb-4">$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-100 p-4 rounded-lg my-4 overflow-x-auto text-sm">$1</pre>')
            // Inline code
            .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm">$1</code>')
            // Checkboxes
            .replace(/- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="rounded"> <span>$1</span></div>')
            .replace(/- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="rounded"> <span>$1</span></div>')
            // Tables
            .replace(/\|(.+)\|/g, (match) => {
                const cells = match.split('|').filter(c => c.trim());
                if (cells.every(c => c.trim().match(/^[-:]+$/))) {
                    return ''; // Skip separator row
                }
                const isHeader = match.includes('---');
                const cellTag = 'td';
                return `<tr>${cells.map(c => `<${cellTag} class="border border-slate-300 px-3 py-2">${c.trim()}</${cellTag}>`).join('')}</tr>`;
            })
            // Horizontal rules
            .replace(/^---$/gim, '<hr class="my-6 border-slate-300">')
            // Lists
            .replace(/^\- (.*$)/gim, '<li class="ml-4 my-1">• $1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 my-1 list-decimal">$1</li>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
            // Paragraphs
            .replace(/\n\n/g, '</p><p class="my-3">')
            // Line breaks
            .replace(/\n/g, '<br>');
        
        // Wrap tables
        html = html.replace(/(<tr>[\s\S]*?<\/tr>)+/g, '<table class="w-full border-collapse my-4">$&</table>');
        
        return `<div class="prose max-w-none"><p class="my-3">${html}</p></div>`;
    };

    const filteredDocs = searchTerm 
        ? docList.filter(d => 
            d.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            docs[d.id].content.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : docList;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">📚 Help & Documentation</h1>
                            <p className="text-slate-600 mt-1">Guides, tips, and reference materials</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                🖨️ Print
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                📥 Download
                            </button>
                        </div>
                    </div>
                    
                    {/* Search */}
                    <div className="mt-4">
                        <input
                            type="text"
                            placeholder="Search documentation..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-80 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-4">
                            <h2 className="font-semibold text-slate-800 mb-3">Documentation</h2>
                            <nav className="space-y-1">
                                {filteredDocs.map(doc => (
                                    <button
                                        key={doc.id}
                                        onClick={() => setActiveDoc(doc.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                            activeDoc === doc.id
                                                ? 'bg-blue-100 text-blue-800 font-medium'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span>{doc.icon}</span>
                                        <span className="text-sm">{doc.label}</span>
                                    </button>
                                ))}
                            </nav>
                            
                            {searchTerm && filteredDocs.length === 0 && (
                                <p className="text-sm text-slate-500 mt-4 text-center">
                                    No results for "{searchTerm}"
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8">
                            {activeDoc === 'index' ? (
                                <div id="doc-content" className="prose prose-slate max-w-none" data-testid="help-index">
                                    <h1 style={{ color: '#1e3a8a' }}>League Management Portal Documentation</h1>
                                    <p>Welcome to the Help Center! Click any guide below to get started.</p>

                                    <h2 style={{ color: '#1e3a8a', marginTop: 30 }}>Quick Links</h2>

                                    <h3 style={{ color: '#1e40af' }}>By Role</h3>
                                    <ul>
                                        <li><button className="text-blue-600 hover:text-blue-800 underline font-semibold bg-transparent border-0 cursor-pointer p-0" onClick={() => setActiveDoc('admin')}>Admins</button> — Admin Guide or <button className="text-blue-600 hover:text-blue-800 underline font-semibold bg-transparent border-0 cursor-pointer p-0" onClick={() => setActiveDoc('leagueAdmin')}>League Admin Guide</button></li>
                                        <li><button className="text-blue-600 hover:text-blue-800 underline font-semibold bg-transparent border-0 cursor-pointer p-0" onClick={() => setActiveDoc('coach')}>Coaches</button> — Coach / Team Admin Guide</li>
                                        <li><button className="text-blue-600 hover:text-blue-800 underline font-semibold bg-transparent border-0 cursor-pointer p-0" onClick={() => setActiveDoc('player')}>Players</button> — Player Guide</li>
                                        <li><button className="text-blue-600 hover:text-blue-800 underline font-semibold bg-transparent border-0 cursor-pointer p-0" onClick={() => setActiveDoc('guest')}>Visitors</button> — Guest Guide</li>
                                    </ul>

                                    <h3 style={{ color: '#1e40af' }}>By Task</h3>
                                    <ul>
                                        <li><button className="text-blue-600 hover:text-blue-800 underline font-semibold bg-transparent border-0 cursor-pointer p-0" onClick={() => setActiveDoc('setup')}>Setting up the league</button> — Setup Guide</li>
                                        <li><button className="text-blue-600 hover:text-blue-800 underline font-semibold bg-transparent border-0 cursor-pointer p-0" onClick={() => setActiveDoc('coach')}>Managing rosters</button> — Coach Guide</li>
                                        <li><button className="text-blue-600 hover:text-blue-800 underline font-semibold bg-transparent border-0 cursor-pointer p-0" onClick={() => setActiveDoc('recruitment')}>Recruiting new players</button> — Player Recruitment Guide</li>
                                        <li><button className="text-blue-600 hover:text-blue-800 underline font-semibold bg-transparent border-0 cursor-pointer p-0" onClick={() => setActiveDoc('player')}>Viewing stats</button> — Player Guide</li>
                                        <li><button className="text-blue-600 hover:text-blue-800 underline font-semibold bg-transparent border-0 cursor-pointer p-0" onClick={() => setActiveDoc('brochure')}>Understanding features</button> — Feature Brochure</li>
                                    </ul>

                                    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '30px 0' }} />

                                    <h2 style={{ color: '#1e3a8a', marginTop: 30 }}>Need Help?</h2>
                                    {adminEmail ? (
                                        <p>Contact your league administrator at{' '}
                                            <a href={`mailto:${adminEmail}`} className="text-blue-600 hover:text-blue-800 underline font-semibold" data-testid="admin-email-link">{adminEmail}</a>
                                        </p>
                                    ) : (
                                        <p>Contact your league administrator for assistance.</p>
                                    )}
                                </div>
                            ) : (
                                <div 
                                    id="doc-content"
                                    className="prose prose-slate max-w-none"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(docs[activeDoc].content) }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
