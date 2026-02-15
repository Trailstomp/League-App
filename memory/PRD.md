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
- [x] Final fix: separated VISUAL_RESET from identity props
- [x] Replaced setState-hack for reading state with ref-based approach (editingStyleRef)

### Critical Bug Fix: Template Data Loss (Feb 2026)
- [x] Root cause: PUT /api/design-templates/{template_id} defaulted `style` to `{}` when not in request
- [x] Fix: Only update fields explicitly present in request payload
- [x] Verified: 11/11 backend tests passed

### Template Preview Feature (Feb 2026)
- [x] Added `TemplatePreview` component with mini website layout mockup
- [x] Small previews in Saved Templates list, larger in Load Template modal

### Bug Fix: Image Upload Not Saving (Feb 2026)
- [x] `handleSave()` now accepts optional `overrideFields` param

### PWA "Add to Home Screen" Feature (Feb 2026)
- [x] Dynamic manifest.json served from `/api/pwa/manifest.json`
- [x] Service worker for offline caching and push notifications
- [x] "Install App" button in navigation sidebar
- [x] iOS/Android install instructions modals
- [x] InstallPWA banner component with customizable colors

### Hide External Teams from Public Views (Feb 2026)
- [x] External teams hidden from sidebar, Home Teams page, Standings
- [x] Filter checks both `isExternal` flag AND `division === 'External'`

### Media Manager — Self-Service Upload (Feb 2026)
- [x] New `MediaManager` component with photo upload and video link management
- [x] Backend: `/api/media-items` CRUD + upload

### Background Textures Feature (Feb 2026)
- [x] 14 tileable textures for Nav, Banner, Main Content backgrounds
- [x] TexturePicker grid component

### ColorPickerWithTexture Integration (Feb 2026)
- [x] Unified `ColorPickerWithTexture` component for all 19+ color inputs
- [x] Toggle between color picker and texture grid

### Coach Role & UI Fixes (Feb 15, 2026)
- [x] Added "Coach" role option to Join Team page (/join/{team_id})
- [x] Player/Coach radio buttons with conditional form fields
- [x] Coach-specific: Coaching Experience dropdown (5 levels)
- [x] Player-specific: Position, Jersey Number, Playing Experience
- [x] Backend saves `requestedRole` and `coachingExperience` fields in join_requests
- [x] Admin join request view shows "Coach" badge for coach requests
- [x] Logo container in Navigation.js uses `background: transparent` to preserve PNG transparency
- [x] Teams sorted alphabetically by name within each division group using localeCompare
- [x] Testing: 100% pass rate - all backend API tests and frontend verification passed

### Documentation (Feb 14, 2026)
- [x] Updated all 9 help docs from v1.0 to v2.0

### Recruitment System
- [x] Automated recruitment: approve → auto-create team/player
- [x] Proactive "Recruit & Invite" form

## Pending
- Google Drive needs OAuth refresh token
- OneDrive requires Azure AD credentials
- Email sending requires valid SMTP credentials
- Media gallery visibility — user verification pending

## Upcoming Tasks
- P1: Data Recovery Plan for wiped template styles
- P1: Office 365 integration for File Manager
- P2: SMTP credential configuration for email module
- P2: Continue server.py refactoring
- P2: Break down EnhancedLiveStatsEntry.js (3000+ lines)

## Architecture

### Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, lucide-react
- Backend: Python, FastAPI, Pydantic
- Database: MongoDB
- Auth: Emergent-managed Google Auth

### 3rd Party Integrations
- Google Auth, Google Maps, MongoDB, GroupMe, Google Drive API

### Key API Endpoints
- POST /api/teams/{team_id}/join-requests - Submit join request (now saves requestedRole)
- GET /api/teams/{team_id}/public - Public team info for join page
- PUT /api/design-templates/{template_id} - Safe partial update
- All league-data endpoints (teams, players, seasons, schedule, news, etc.)
