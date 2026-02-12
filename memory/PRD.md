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

---

## Original Problem Statement
Create a comprehensive league management portal for **multiple sports** (Lacrosse, Hockey, Soccer, Volleyball) with features for team management, event scheduling, live game scoring, admin tools, player dashboards, payment processing, and finance tracking.

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

### Recent Completions (Feb 11-12, 2025)
- [x] **P0: Analog Scoreboard** - LED-style scoreboard in LiveSpectatorView and EnhancedLiveStatsEntry
- [x] **P1: GroupMe Channel Creation Fix** - Fixed broken imports, existing bot ID bypass, auto-load groups
- [x] **Lacrosse Stats Enhancement** - Added face-off wins (FO), ground balls (GB), and "Players On Field" tracking at goal time

### Lacrosse Live Scoring Stats (NEW - Feb 12, 2025)
- [x] **Face-off Wins (FO)** - Per-player +/- tracking in live scoring table
- [x] **Ground Balls (GB)** - Per-player +/- tracking in live scoring table
- [x] **Players On Field at Goal** - Optional picker after each goal to record which players were on field for scoring team and defending team (for line analysis)
- [x] **Stats carry over** - FO, GB, assists all aggregate to:
  - Team player stats (`/api/teams/{id}/player-stats`)
  - Player stats by year (`/api/players/{id}/stats-by-year`)
  - Individual player profiles (`_update_player_stats_from_game`)
  - Player cards display (PlayerCard.js)
- [x] **Spectator View** - Shows FO and GB in quick stats grid and top performers
- [x] **Game Event Narration** - FO wins and GB pickups logged in event feed

## Architecture
```
/app
  backend/
    routes/
      groupme.py       # GroupMe integration
      joinus.py        # Join Us form submissions
    services/
      api_integrations_service.py
      groupme_service.py
    server.py          # Main server (includes stat aggregation endpoints)
  frontend/
    src/
      config/sportsConfig.js   # Sport-specific stats config (lacrosse: FO, GB added)
      components/
        AnalogScoreboard.js    # LED-style scoreboard
        PlayerCard.js          # Player display (shows FO, GB, saves)
        unified-events/
          EnhancedLiveStatsEntry.js  # Live scoring (FO/GB columns, on-field picker)
          EventManager.js
      pages/
        LiveSpectatorView.js   # Spectator view (FO/GB in quick stats)
```

## Pending Issues
- GroupMe dashboard/stats endpoint returns 520 timeout intermittently (minor)
- Email notifications require SMTP credentials (MOCKED)

## Upcoming Tasks
- **P2**: Configure SMTP credentials for email notifications
- **P2**: Continue refactoring monolithic server.py into modular routes
- **P3**: Tournament scoring UI improvements
- **Future**: Hockey-specific stats (user mentioned wanting to add hockey stats)

## 3rd Party Integrations
- Google Auth (Emergent-managed)
- Google Maps (embedded iframes)
- MongoDB (primary database)
- GroupMe (access controls, bot management)
