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

### Documents / File Manager
- [x] Dual provider: Google Drive + OneDrive/Office 365
- [x] File browser: folders, upload, download, create, delete
- [x] "Use League Connection" option for teams

### Design & Theming System
- [x] CSS variables for dynamic theming
- [x] Design template cycling (random, daily)
- [x] Input text color, secondary text color, accent color pickers
- [x] Dynamic favicon with cache-busting (?v=timestamp)
- [x] Dynamic PWA manifest generated from league logo (blob URL)

### Tournament Scoring UI (Feb 13, 2026)
- [x] Horizontal bracket layout with CSS connector lines between rounds
- [x] Redesigned compact match cards with team logos, seed numbers, scores
- [x] Champion trophy badge, floating action toolbar, Games List view
- [x] Dark tournament-themed background, proper round naming

### Mobile Experience (Feb 13, 2026)
- [x] Compact mobile ticker strip (48px) below mobile header
- [x] Single-line scrolling game scores (ESPN-style)
- [x] Proper content padding (56px header + 48px ticker = 104px)

### Bug Fixes (Feb 13, 2026)
- [x] Fixed news creation/deletion bug: `league_data` → `league_doc` typo in POST /api/league-data/newsItems
- [x] Changed news image format from banner (16:9) to square (1:1) crop + display
- [x] Added `square` aspect ratio option to SimpleCropTool
- [x] Favicon cache busting to force latest logo

### Bug Fixes & UI (Feb 14, 2026)
- [x] Fixed recurring `league_data` → `league_doc` NameError across 5 endpoints: teams, players, seasons, leagueSchedule, liveViewSettings
- [x] Made admin dashboard overview cards clickable (navigate to Teams, Users tabs)
- [x] Made Quick Action buttons functional (Add Team → Teams, Add Player → Import Players, Export → Database Admin)

### Navigation & UX (Feb 14, 2026)
- [x] Added "My Team" button in navbar - navigates to user's assigned team
- [x] Combined "My Dashboard" and "Account Settings" into one page (Account Settings is now a tab)
- [x] Added `nav.league_chat` permission - League Chat only visible to admin/league_admin
- [x] Role alias mapping: 'admin' → 'super_admin', 'coach' → 'team_coach' for permissions

### Bug Fix: Design Template Stuck (Feb 14, 2026)
- [x] Root cause: loadTemplate merged new template INTO existing editingStyle, so Neon's bg images persisted
- [x] First fix regression: using full DEFAULT_STYLE wiped identity data (league name, logo, titles)
- [x] Final fix: separated VISUAL_RESET (colors/images) from identity props. Template load uses `{ ...websiteStyle, ...VISUAL_RESET, ...template.style }`
- [x] Replaced setState-hack for reading state with ref-based approach (editingStyleRef)
- [x] Fixed stale closure in `updateStyle` useCallback (empty deps → added `handleSave`)
- [x] Moved cycling template logic from Layout.js to App.js (can now update websiteStyle state)
- [x] Wrapped `handleWebsiteStyleChange` in useCallback to prevent stale closures
- [x] Verified: template switching preserves identity while clearing previous visual properties

### Critical Bug Fix: Template Data Loss (Feb 2026)
- [x] Root cause: PUT /api/design-templates/{template_id} endpoint defaulted `style` to `{}` when not in request, wiping all style data on partial updates (e.g., toggling visibility)
- [x] Fix: Changed endpoint to only update fields explicitly present in request payload using `if field in template_data` check
- [x] Now returns updated template document in response for frontend verification
- [x] Verified: 11/11 backend tests passed - partial updates preserve style data, explicit style updates work correctly
- [x] Existing templates verified intact: Clean Blue (15 props), Neon Test (15 props), Dark Theme (3 props)

### Documentation (Feb 14, 2026)
- [x] Updated all 9 help docs from v1.0 (Jan 2025) to v2.0
- [x] Added: Tournament brackets, PWA, File Manager, Email Composer, Recruiting, Dynamic Theming, Google OAuth, clickable admin dashboard, mobile ticker, news square images
- [x] User account settings page, set password flow
- [x] NotificationBell for new message alerts

### Recruitment System
- [x] Automated recruitment: approve → auto-create team/player
- [x] Proactive "Recruit & Invite" form

## Pending
- Google Drive needs OAuth refresh token
- OneDrive requires Azure AD credentials
- Email sending requires valid SMTP credentials

## Upcoming Tasks
- P1: PWA manifest.json for "Add to Home Screen"
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
│   │   │   ├── EventsTicker.js         # MODIFIED: Added compact prop for mobile
│   │   │   ├── Layout.js               # MODIFIED: Mobile ticker, favicon cache bust, dynamic manifest
│   │   │   ├── SimpleCropTool.js       # MODIFIED: Added square aspect ratio
│   │   │   ├── NewsDisplay.js          # MODIFIED: Square image display
│   │   │   ├── managers/NewsManager.js # MODIFIED: Square crop for news images
│   │   │   ├── unified-events/
│   │   │   │   └── TournamentBracketBuilder.js  # REDESIGNED
│   │   │   └── ...
│   │   ├── pages/
│   │   │   └── TournamentPage.js  # REDESIGNED
│   │   └── App.js
└── memory/
    └── PRD.md
```

### Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, lucide-react
- Backend: Python, FastAPI, Pydantic
- Database: MongoDB
- Auth: Emergent-managed Google Auth

### Key API Endpoints
- POST /api/league-data/newsItems - Create/update news items (BUG FIXED)
- POST /api/league-data/teams - Save teams (BUG FIXED Feb 14)
- POST /api/league-data/players - Save players (BUG FIXED Feb 14)
- POST /api/league-data/seasons - Save seasons (BUG FIXED Feb 14)
- POST /api/league-data/leagueSchedule - Save schedule (BUG FIXED Feb 14)
- POST /api/league-data/liveViewSettings - Save live view settings (BUG FIXED Feb 14)
- GET /api/league-data/newsItems - Get news items
- PUT /api/design-templates/{template_id} - Safe partial update (BUG FIXED Feb 2026 - was wiping style data)
