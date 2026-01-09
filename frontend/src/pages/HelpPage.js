import React, { useState } from 'react';

const HelpPage = () => {
    const [activeDoc, setActiveDoc] = useState('index');
    const [searchTerm, setSearchTerm] = useState('');

    const docs = {
        index: {
            title: '📚 Documentation Index',
            icon: '📚',
            content: `
# League Management Portal Documentation

Welcome to the Help Center! Select a guide from the sidebar to get started.

## Quick Links

### By Role
- **Admins** → Admin Guide or League Admin Guide
- **Coaches** → Coach / Team Admin Guide  
- **Players** → Player Guide
- **Visitors** → Guest Guide

### By Task
- **Setting up the league** → Setup Guide
- **Managing rosters** → Coach Guide
- **Viewing stats** → Player Guide
- **Understanding features** → Feature Brochure

## Need Help?
Contact your league administrator for assistance.
            `
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
| RSVP to events | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage team roster | ✅ | ✅ | ✅* | ❌ | ❌ |
| Create events | ✅ | ✅ | ✅* | ❌ | ❌ |
| Live scoring | ✅ | ✅ | ✅* | ❌ | ❌ |
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
                            <div 
                                id="doc-content"
                                className="prose prose-slate max-w-none"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(docs[activeDoc].content) }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
