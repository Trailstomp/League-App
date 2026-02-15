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

### Template Preview Feature (Feb 2026)
- [x] Added `TemplatePreview` component that renders a mini website layout mockup using template's actual colors
- [x] Preview shows realistic nav bar, banner, sidebar, and content card areas
- [x] Small previews (140x80px) in the Saved Templates list, larger previews (200x120px) in the Load Template modal
- [x] Load modal also shows color swatches below the preview for quick reference
- [x] Supports background images in banner and main areas

### Bug Fix: Image Upload Not Saving (Feb 2026)
- [x] Root cause: `handleSave()` reads from `editingStyleRef.current` but is called synchronously after `setEditingStyle()`, before React re-renders to update the ref — so image data is excluded from save
- [x] Fix: `handleSave()` now accepts optional `overrideFields` param, merged on top of ref state
- [x] `handleCropComplete` and direct image upload now pass `{ [fieldName]: imageData }` to `handleSave()` so image data is always included
- [x] Affects: nav background image, banner background image, main background image, logo uploads, all crop completions

### Hide External Teams from Public Views (Feb 2026)
- [x] Fixed: External teams now hidden from sidebar (Navigation.js) and Home Teams page (HomePage.js)
- [x] Fixed: External teams filtered from Standings page (StandingsTable.js) - both by division and by team flag
- [x] Filter checks both `isExternal` flag AND `division === 'External'` (case-insensitive)
- [x] External teams remain in admin/scheduling contexts where they're needed

### Media Manager — Self-Service Upload (Feb 2026)
- [x] New `MediaManager` component with photo upload and video link management
- [x] Added to league home "Media & Videos" tab — league admins can upload photos and add YouTube links
- [x] Added to team "Photos & Vids" tab — team coaches/admins can manage their own media
- [x] Backend: `/api/media-items` CRUD + `/api/media-items/upload` (photo upload with local storage fallback)
- [x] Features: multi-file upload, YouTube embed preview, image lightbox, delete with confirmation
- [x] Permission-based: Upload/Add buttons only visible to authorized users (admin, coach)

### Background Textures Feature (Feb 2026)
- [x] 14 tileable textures: Leather, Wood, Wood Vertical, Metal, Carbon Fiber, Concrete, Diamond Plate, Turf, Brick, Stone, Rock, Tree Bark, Dirt, Leaves
- [x] Texture option added to Nav, Banner, and Main Content background selectors (Color | Image | Texture)
- [x] TexturePicker grid component with visual preview thumbnails and active state highlighting
- [x] Textures render as repeating tiled backgrounds at 256px tiles
- [x] Supported in Layout.js (main bg, banner), Navigation.js (sidebar), and WebsiteDesignManager.js (admin UI)

### ColorPickerWithTexture Integration (Feb 2026)
- [x] Created unified `ColorPickerWithTexture` component - drop-in replacement for all color inputs
- [x] Toggle between color picker and texture grid with one-click button
- [x] Shows texture name when texture is selected, color hex when using color
- [x] "Clear texture" (X) button to revert to color mode
- [x] Integrated into 19+ color pickers across WebsiteDesignManager.js sections:
  - Navigation: background color, text color
  - Sidebar/Menu: background color, text color
  - Banner: background color, text color
  - Main Content: background color, text color
  - Content Area: background color
  - Cards: background color, text color, heading color
  - Forms: input text, secondary text, accent text
  - Nav buttons: border color
  - PWA: theme color, background color, install banner colors
- [x] All textures available in every color picker (backgrounds + text colors where applicable)

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
