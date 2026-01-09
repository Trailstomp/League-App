# League Management Portal - Product Requirements Document

## Original Problem Statement
Create a comprehensive league management portal for lacrosse leagues with features for:
- Team management with rosters and player assignments
- Event scheduling and RSVP management  
- Live game scoring with real-time player stats
- Admin tools for league administration
- Player dashboard for individual stats and team info
- Payment processing for fees

## User Personas
- **League Admin**: Full control over all teams, events, and settings
- **Team Admin/Coach**: Manage their team's roster, events, and settings
- **Player**: View their stats, team info, and respond to events
- **Guest**: Browse public team and event information

## Core Requirements

### Team Management
- [x] Team creation and editing
- [x] Division-based organization
- [x] Team styling (colors, logos)
- [x] Multi-team player support (players can be on multiple teams)
- [x] **Roster Management** - Add/edit/remove players from team roster (visible to team/league admins)

### Player Management  
- [x] Player profiles with photos, positions, jersey numbers
- [x] Player import tool with password reset links
- [x] Role-based access (admin, league_admin, coach, player, guest)
- [x] Default landing page preferences per user

### Live Scoring
- [x] Real-time game scoring with shot tracking
- [x] Three-button shot system (Goal, Save, Miss)
- [x] Player roster display with clickable photo popups
- [x] Shot clock with disable option
- [x] YouTube feed integration

### Authentication
- [x] Email/password login
- [x] Password reset via token
- [x] localStorage session persistence
- [x] Cross-tab sync via storage events
- [ ] OAuth/Social login

## Architecture

### Frontend (React)
- `/app/frontend/src/App.js` - Main app with routing and auth state
- `/app/frontend/src/pages/TeamDetailPage.js` - Team detail with tabs (Roster, Stats, Settings, etc.)
- `/app/frontend/src/scheduling/components/EnhancedScoring.js` - Live scoring interface
- `/app/frontend/src/components/AuthSystem.js` - Login/registration forms

### Backend (FastAPI)
- `/app/backend/server.py` - Monolithic API server (needs refactoring)

### Database (MongoDB)
- `users` collection - User profiles with teamAssignments, roles
- `teams` collection - Team data with style, division info
- `league_schedule` collection - Events and games

## Key API Endpoints

### Team Player Management (NEW)
- `POST /api/team/{team_id}/add-player` - Add existing user to team
- `POST /api/team/{team_id}/remove-player` - Remove player from team
- `POST /api/team/{team_id}/update-player` - Update player position/number
- `GET /api/team/{team_id}/players` - Get team roster

### Authentication
- `POST /api/users/login` - User login
- `POST /api/reset-password-with-token` - Password reset

### User Management
- `POST /api/users/set-default-page` - Set user's default landing page
- `POST /api/admin/create-user` - Create user with optional reset link

## What's Been Implemented

### January 9, 2025
- **Roster Management Feature (P0)**: Added inline player management on Team Roster tab
  - Add Player modal with searchable user list
  - Edit Player modal for position/jersey number
  - Remove Player confirmation
  - Visible only to team/league admins
  - Backend APIs: add-player, remove-player, update-player
  - Testing: Backend 96% pass rate, Frontend verified

- **Auth State Improvements**: 
  - Added cross-tab sync via storage events
  - Enhanced logging for debugging session issues

### Previous Sessions
- Live Scoring overhaul with real player data
- Multi-team roster fix (players on multiple teams show correctly)
- Default landing page feature
- Player importer with password reset links
- Dashboard relocation to team page tabs
- SMTP invite error handling

## Prioritized Backlog

### P0 (Critical)
- [x] Roster Management on Team Page - DONE

### P1 (High Priority)
- [ ] Refactor `server.py` into feature-based routers (users.py, teams.py, events.py)
- [ ] Handle inconsistent data in older teams gracefully

### P2 (Medium Priority)
- [ ] Refactor `TeamDetailPage.js` - extract tab content into separate components
- [ ] Refactor `EnhancedScoring.js` - extract sub-sections
- [ ] Complete YouTube backend integration for team channels

### P3 (Future)
- [ ] OAuth/Social login integration
- [ ] Mobile-responsive improvements
- [ ] Offline support / PWA features

## Known Issues
- Older teams may have inconsistent data due to schema changes
- Gmail SMTP requires "App Password" for email functionality

## Technical Debt
- `server.py` is monolithic (~10K+ lines) - needs breaking into routers
- `TeamDetailPage.js` is growing large - needs component extraction
- Some legacy fields (`teamId`, `role`) alongside new fields (`teamAssignments`, `roles`)

## 3rd Party Integrations
- Twilio (SMS notifications)
- SMTP/Gmail (Email notifications)
- Stripe/PayPal (Payments)
- YouTube (Video feeds)
- Google Drive (File storage)
- GroupMe (Chat)
