# League Management Portal - Changelog

## January 24, 2025

### Critical Bug Fixes
- **Stats Aggregation Fix (P0):** Game scores now correctly propagate to team standings
  - Fixed `_update_team_season_stats` to include `goals_for`, `goals_against`, `goal_diff`, `pf`, `pa`, `games_played`
  - Fixed `/api/dashboard-data` to return all team stat fields
  - Added player stats (goals, assists, gamesPlayed) to dashboard player response
  - Fixed Eagles/Hawks `division_id` for correct standings display

### New Admin Endpoints
- `POST /api/admin/recalculate-stats` - Recalculate all team stats from final games
- `PUT /api/admin/teams/{team_id}` - Update team data directly in teams collection

### UI Fixes
- Fixed live scoring tab navigation z-index overlap with fixed header (EnhancedLiveStatsEntry.js)

### Testing
- 17/17 backend API tests passed
- Test file: `/app/backend/tests/test_stats_standings.py`

---

## January 22, 2025

### Features
- **Google OAuth Integration:** "Sign in with Google" via Emergent Auth
- **One-Click RSVP Magic Links:** Auto-submit RSVP via URL parameters
- **Multi-Sport Support:** Lacrosse, Hockey, Soccer, Volleyball
- **First-Time Setup Wizard:** 4-step wizard for new league setup
- **Sport-Specific Live Scoring:** Dynamic periods, terminology, stat types

### Files Modified
- Backend: `server.py`, `routes/setup.py`, `routes/users.py`
- Frontend: `AuthSystem.js`, `AuthCallback.js`, `SetupWizard.js`, `sportsConfig.js`

---

## January 13, 2025

### Bug Fixes
- Fixed JSX syntax error in DataCleanupManager.js
- Enhanced Team Player Sources Diagnostic Tool

---

## January 10, 2025

### Features
- Health Alert Email Notifications
- Data Health Dashboard Widget
- Data Cleanup Utility
- PWA Color Picker Fix
- Code Refactoring (major)
- Finance CSV Export

---

## January 9, 2025
- Roster Management Feature
- Player Card PDF Download Fix
- Stats by Year Feature
- Ticker Tape Improvements
