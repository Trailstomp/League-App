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

### Event Card Popup (Feb 15, 2026)
- [x] Clicking any event (ticker or Events page) opens a polished popup modal
- [x] Shows: event type badge, title, date, scores (for games), time, location, status, description
- [x] Embedded Google Maps iframe for the event location
- [x] "Open in Google Maps" direct link
- [x] Add to Calendar: Google Calendar button + iCal/Outlook (.ics download)
- [x] Print button opens print-friendly version in new window
- [x] Download button saves event card as HTML file
- [x] Close via X button or clicking backdrop
- [x] Non-admin users see popup; admins see edit view
- [x] All 8 backend + frontend tests passed

### Floating User Preferences Bubble (Feb 15, 2026)
- [x] FAB button, theme selector, auto-rotate toggle, default landing page
- [x] Persists in localStorage across sessions

### Coach Role & UI Fixes (Feb 15, 2026)
- [x] Coach role on Join Team page, backend saves requestedRole
- [x] Logo transparent background, team sorting

### CSS Text Color Fix (Feb 15, 2026)
- [x] Admin Content Text Color and Card Heading Color settings now affect page text

### User Guide Updates (Feb 15, 2026)
- [x] All 9 help docs updated with latest features

### Design & Theming System
- [x] CSS variables, template cycling, 14 background textures
- [x] ColorPickerWithTexture, template preview, dynamic favicon/manifest

### Media Gallery
- [x] Gallery API endpoints verified: GET /api/galleries-new, GET /api/galleries-new/active
- [x] GalleryAdminManager and TeamGalleryDisplay use correct API URLs
- [x] Note: galleries_new collection is currently empty (no user gallery data exists)

## Pending
- Media gallery data is empty - user may need to re-create galleries
- Google Drive needs OAuth refresh token
- Email sending requires valid SMTP credentials

## Upcoming Tasks
- P1: Data Recovery Plan for wiped template styles
- P1: Office 365 integration for File Manager
- P2: SMTP credential configuration
- P2: Refactor server.py into route files

## Architecture
- Frontend: React, Tailwind CSS, Shadcn UI, lucide-react
- Backend: Python, FastAPI, Pydantic
- Database: MongoDB
- Auth: Emergent-managed Google Auth
- 3rd Party: Google Auth, Google Maps, MongoDB, GroupMe, Google Drive API

## Key Files
- `frontend/src/components/EventCardPopup.js` - Event detail popup modal
- `frontend/src/components/UserPreferences.js` - Floating preferences bubble
- `frontend/src/components/Layout.js` - Main layout
- `frontend/src/App.js` - State management, event click handling
- `frontend/src/index.css` - CSS text color variable overrides
- `backend/server.py` - API endpoints
- `backend/routes/media.py` - Gallery and media API routes
