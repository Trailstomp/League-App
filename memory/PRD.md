# League Management Portal - Product Requirements Document

## Deployment Configuration

### Required Environment Variables (Backend)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `mlbl_database` |
| `FRONTEND_URL` | **Production URL for RSVP links** | `https://yourdomain.com` |
| `BACKEND_URL` | Backend API URL | `https://yourdomain.com` |
| `STRIPE_API_KEY` | Stripe API key | `sk_live_xxx` |

### Important: FRONTEND_URL for Production
When deploying to production, **you must set `FRONTEND_URL`** in `/app/backend/.env` to your production domain.

---

## Original Problem Statement
Create a comprehensive league management portal for **multiple sports** (Lacrosse, Hockey, Soccer, Volleyball) with features for:
- Team management with rosters and player assignments
- Event scheduling and RSVP management  
- Live game scoring with real-time player stats (sport-specific)
- Admin tools for league administration
- Player dashboard for individual stats and team info
- Payment processing for fees
- Finance tracking for income and expenses
- **Multi-sport support** with configurable positions and scoring

## User Personas
- **League Admin**: Full control over all teams, events, finances, and settings
- **Team Admin/Coach**: Manage their team's roster, events, finances, and settings
- **Player**: View their stats, team info, and respond to events
- **Guest**: Browse public team and event information

## What's Been Implemented

### Core Features (Complete)
- [x] Team creation, editing, division-based organization
- [x] Team styling (colors, logos, banners), image upload with crop
- [x] Roster Management, multi-team player support
- [x] Finance tab (income/expenses, CSV export, league-wide view)
- [x] Player profiles, import tool, role-based access
- [x] PWA conversion
- [x] Event scheduling, RSVP management
- [x] Live game scoring with real-time stats
- [x] Tournament support
- [x] GroupMe integration with access controls
- [x] "Join Us" workflow (Team Registration, Player Application, Volunteer Signup)
- [x] Recruiting Manager admin panel
- [x] File upload for team logos
- [x] Friends & Sponsors feature
- [x] Team locations with maps

### Recent Completions (Feb 11, 2025)
- [x] **P0: Analog Scoreboard** - Replaced old scoreboard in LiveSpectatorView and EnhancedLiveStatsEntry with LED-style AnalogScoreboard component (dark metallic design, blinking colon clock, team colors, shot clock, period display)
- [x] **P1: GroupMe Channel Creation Fix** - Fixed broken service import path (api_integrations -> api_integrations_service), made channel creation with existing bot ID work without requiring GroupMe API credentials, auto-load available groups on create view, fixed team sorting null-safety bug
- [x] **TeamScheduleTab refactor** - Uses unified EventManager component

## Pending Issues
- GroupMe dashboard/stats endpoint returns 520 timeout intermittently (minor)
- Email notifications require SMTP credentials (MOCKED)

## Architecture
```
/app
  backend/
    routes/
      groupme.py       # GroupMe integration (fixed imports, service injection)
      joinus.py        # Join Us form submissions
      communication.py # Communication routes
    services/
      api_integrations_service.py  # API integrations
      groupme_service.py           # GroupMe service (has sqlalchemy dep issue)
    server.py          # Main server, SimpleGroupMeService class
  frontend/
    src/
      components/
        AnalogScoreboard.js        # LED-style scoreboard (NEW)
        GroupMeManager.js          # GroupMe admin (FIXED)
        joinus/                    # Join Us forms
        managers/RecruitingManager.js
        unified-events/
          EnhancedLiveStatsEntry.js # Scorer view (uses compact AnalogScoreboard)
          EventManager.js
      pages/
        LiveSpectatorView.js       # Spectator view (uses AnalogScoreboard)
        AdminPage.js
        HomePage.js
```

## Upcoming Tasks
- **P2**: Configure SMTP credentials for email notifications
- **P2**: Continue refactoring monolithic server.py into modular routes
- **P3**: Tournament scoring UI improvements

## 3rd Party Integrations
- Google Auth (Emergent-managed)
- Google Maps (embedded iframes)
- MongoDB (primary database)
- GroupMe (access controls, bot management)
