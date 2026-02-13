# League Management Portal - Product Requirements Document

## Original Problem Statement
Comprehensive league management portal for multiple sports with team management, event scheduling, live scoring, admin tools, player dashboards, payment processing, and finance tracking.

## What's Been Implemented

### Core Features (Complete)
- [x] Team management (create, edit, divisions, styling, logos, rosters)
- [x] Finance tab (income/expenses, CSV export, league-wide view)
- [x] Player profiles, import tool, role-based access, PWA
- [x] Event scheduling, RSVP management, live game scoring
- [x] Tournament support, GroupMe integration
- [x] "Join Us" workflow, Friends & Sponsors, team locations

### Recent Completions (Feb 12, 2025)
- [x] **Analog Scoreboard** - LED-style scoreboard in LiveSpectatorView and EnhancedLiveStatsEntry
- [x] **GroupMe Channel Creation Fix** - Fixed imports, existing bot ID bypass
- [x] **Lacrosse Stats** - Face-off wins, ground balls, players-on-field tracking at goals
- [x] **Transparent popup fix** - Fixed broken goal assist picker flow
- [x] **Recruiting Module Overhaul**:
  - Team registration approval auto-creates team in league + coach user account
  - Player application approval auto-creates player user + adds to team roster
  - Unified recruiting in admin (renamed from "Join Requests")
  - Team-level recruiting tab shows player applications with approve/decline
  - Success messages confirm team/player creation on approval

## Architecture
```
/app
  backend/
    routes/
      joinus.py        # Recruiting endpoints (auto-create team/player on approval)
      groupme.py       # GroupMe integration
    server.py          # Main server
  frontend/
    src/
      components/
        managers/RecruitingManager.js  # Admin recruiting dashboard
        team/TeamRecruitingTab.js      # Team-level player apps + invites
        unified-events/EnhancedLiveStatsEntry.js  # Live scoring
      pages/
        AdminPage.js   # Admin portal (recruiting tab)
```

## Pending Issues
- Email notifications require SMTP credentials (MOCKED)
- GroupMe dashboard/stats endpoint 520 timeout (minor)

## Upcoming Tasks
- **P2**: Configure SMTP credentials for email notifications
- **P2**: Continue refactoring monolithic server.py
- **P3**: Tournament scoring UI improvements
- **Future**: Hockey-specific stats

## 3rd Party Integrations
- Google Auth (Emergent-managed), Google Maps, MongoDB, GroupMe
