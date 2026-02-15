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

### Mobile Experience (Feb 13, 2026)
- [x] Compact mobile ticker strip (48px) below mobile header
- [x] Single-line scrolling game scores (ESPN-style)

### Bug Fixes (Feb 13-14, 2026)
- [x] Fixed news creation/deletion bug, square image crop
- [x] Fixed recurring NameError across 5 endpoints
- [x] Made admin dashboard cards/buttons clickable
- [x] Navigation UX: "My Team" button, combined dashboard/settings
- [x] Design template switching, data loss, image upload fixes

### Template Preview Feature (Feb 2026)
- [x] Mini website layout mockup using template's actual colors

### PWA "Add to Home Screen" Feature (Feb 2026)
- [x] Dynamic manifest, service worker, install button, iOS/Android modals

### Hide External Teams from Public Views (Feb 2026)
- [x] External teams hidden from sidebar, Home, Standings

### Media Manager — Self-Service Upload (Feb 2026)
- [x] Photo upload and video link management for league and team pages

### Background Textures Feature (Feb 2026)
- [x] 14 tileable textures + ColorPickerWithTexture for all 19+ color inputs

### Coach Role & UI Fixes (Feb 15, 2026)
- [x] Added "Coach" role option to Join Team page (/join/{team_id})
- [x] Player/Coach radio buttons with conditional form fields
- [x] Backend saves `requestedRole` and `coachingExperience` in join_requests
- [x] Admin join request view shows "Coach" badge
- [x] Logo container transparent background in Navigation.js
- [x] Teams sorted alphabetically by name within division groups

### Floating User Preferences Bubble (Feb 15, 2026)
- [x] Floating action button (FAB) at bottom-right corner with gradient styling
- [x] Opens preferences panel with two tabs: "Themes" and "Default Page"
- [x] **Themes tab**: Auto-Rotate toggle, Next Theme cycle button, template grid with mini previews
- [x] **Default Page tab**: Choose landing page (Home, Events, Standings, Help & Docs)
- [x] Theme selection applies immediately and persists in localStorage
- [x] On page reload, pinned theme fetched from API and applied before render
- [x] Default page preference redirects on initial visit
- [x] Available to all visitors (no login required)
- [x] Backend: `GET /api/design-templates/public` endpoint for visible templates
- [x] App.js integration: checks `mlbl_user_prefs` localStorage during initial load

### CSS Text Color Fix (Feb 15, 2026)
- [x] Added CSS rules in index.css that make `.main-content-area` text respect CSS variables
- [x] Headings (h1-h6) use `var(--card-heading-color)` 
- [x] Body text, spans, labels use `var(--content-text-color)`
- [x] Secondary text (.text-slate-500/600) uses blended version of content color
- [x] Admin's Content Text Color and Card Heading Color settings now actually affect page text
- [x] Preserves white text, button text, colored badges via CSS exclusions

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

### Key Files
- `frontend/src/components/UserPreferences.js` - Floating preferences bubble
- `frontend/src/components/Layout.js` - Main layout with UserPreferences integration
- `frontend/src/App.js` - Initial style/page loading with localStorage preferences
- `frontend/src/index.css` - CSS text color variable overrides
- `backend/server.py` - All API endpoints including `/api/design-templates/public`
