# League Management Portal - Product Requirements Document

## Original Problem Statement
Comprehensive league management portal for multiple sports with team management, event scheduling, live scoring, admin tools, player dashboards, payment processing, and finance tracking.

## What's Been Implemented

### Core Features (Complete)
- [x] Team management, event scheduling, live game scoring, tournaments
- [x] Finance, player profiles, PWA, GroupMe, "Join Us" workflow
- [x] Analog scoreboard, lacrosse stats (FO, GB, players on field)
- [x] Recruiting module (auto-creates teams/players on approval)
- [x] Email module (compose, recipients, history, team-level SMTP)

### Documents / File Manager (Feb 13, 2025)
- [x] Dual provider: Google Drive + OneDrive/Office 365
- [x] File browser: folders, upload, download, create, delete
- [x] "Use League Connection" option for teams
- [x] Team-level storage config with provider selection
- [x] Media uploads accept team_id to use team storage
- [x] Admin Portal → Content → Documents
- [x] Team Admin → Documents section

### Design & Theming System
- [x] CSS variables for dynamic theming (--primary-color, --accent-color, --secondary-text-color, etc.)
- [x] Design template system with cycling (random, daily)
- [x] "Update Active Template" functionality
- [x] Input text color, secondary text color, accent color pickers
- [x] Dynamic favicon using league logo

### Tournament Scoring UI Redesign (Feb 13, 2025)
- [x] Horizontal bracket layout with CSS connector lines between rounds
- [x] Redesigned compact match cards with team logos, seed numbers, scores
- [x] Champion trophy badge at end of bracket
- [x] Floating action toolbar on hover (Edit Score, Live Score, Watch)
- [x] Modernized Games List view
- [x] Dark tournament-themed background (#0b0f19)
- [x] Proper round naming (Semifinals, Quarterfinals, Final, etc.)
- [x] Spectator bracket view (TournamentPage) wired to App.js routes
- [x] Auto-advance winners toggle
- [x] Tab switching between Bracket and Games List views

### User Account & Onboarding
- [x] User account settings page (profile edit, photo upload)
- [x] Set password flow for newly recruited users
- [x] NotificationBell component for new message alerts

### Recruitment System
- [x] Automated recruitment: approve → auto-create team/player
- [x] Proactive "Recruit & Invite" form in league admin
- [x] Consolidated recruiting UI

### Other Features
- [x] Merged "Roster Hub" and "Players" tabs into single "Roster" module
- [x] Photorealistic lacrosse icon pack (replaced emojis)
- [x] GroupMe integration bug fixes

### DB Collections
- `team_storage_configs` - Per-team: use_league flag, provider choice, credentials
- `cloud_storage` - League-level Google Drive config
- `email_history`, `team_smtp_configs` - Email module
- `design_templates` - Template cycling with inRotation/visibleToUsers flags
- `league_data.websiteStyle` - inputTextColor, secondaryTextColor, accentColor

## Pending
- Google Drive needs OAuth refresh token to fully work
- OneDrive requires Azure AD credentials
- Email sending requires valid SMTP credentials

## Upcoming Tasks
- P1: Office 365 integration for File Manager
- P2: SMTP credential configuration for email module
- P2: Continue server.py refactoring
- P2: Break down EnhancedLiveStatsEntry.js (3000+ lines)

## Architecture

### Code Structure
```
/app
├── backend/
│   ├── routes/
│   │   ├── communication.py  # Email composing + SMTP
│   │   ├── files.py          # File management + cloud storage
│   │   ├── groupme.py        # GroupMe integration
│   │   └── joinus.py         # Recruitment + auto-creation
│   └── server.py             # Main server + routing
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── unified-events/
│   │   │   │   ├── TournamentBracketBuilder.js  # REDESIGNED - bracket visualization
│   │   │   │   └── EventManager.js
│   │   │   ├── managers/
│   │   │   │   ├── RecruitingManager.js
│   │   │   │   └── WebsiteDesignManager.js
│   │   │   ├── AnalogScoreboard.js
│   │   │   ├── EmailComposer.js
│   │   │   ├── FileManager.js
│   │   │   └── NotificationBell.js
│   │   ├── pages/
│   │   │   ├── TournamentPage.js  # REDESIGNED - spectator bracket view
│   │   │   ├── UserAccountSettings.js
│   │   │   └── SetPasswordPage.js
│   │   ├── App.js
│   │   └── Layout.js
└── memory/
    └── PRD.md
```

### Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, lucide-react
- Backend: Python, FastAPI, Pydantic
- Database: MongoDB
- Auth: Emergent-managed Google Auth
