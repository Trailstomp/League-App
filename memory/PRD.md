# League Management Portal - Product Requirements Document

## Original Problem Statement
Comprehensive league management portal for multiple sports with team management, event scheduling, live scoring, admin tools, player dashboards, payment processing, and finance tracking.

## What's Been Implemented

### Core Features (Complete)
- [x] Team management, event scheduling, live game scoring, tournaments
- [x] Finance, player profiles, PWA, GroupMe, "Join Us" workflow
- [x] Recruiting module, email module, analog scoreboard, lacrosse stats

### Event Card Popup (Feb 15, 2026)
- [x] Clicking any event opens popup with title, date, scores, time, location, status, description
- [x] Embedded Google Maps, Add to Calendar (Google/iCal), Print, Download

### Site Style (User Preferences) (Feb 15-16, 2026)
- [x] Gear icon "Site Style" button in navigation sidebar (replaced floating FAB)
- [x] Opens panel with Themes tab (auto-rotate, cycle, template grid) and Default Page tab
- [x] Persists in localStorage, applies on page load via App.js integration

### Coach Role & UI Fixes (Feb 15, 2026)
- [x] Coach role on Join Team page, logo transparency, team sorting

### CSS Text Color Fix (Feb 15, 2026)
- [x] Admin Content Text Color and Card Heading Color settings affect page text

### Design & Theming System
- [x] CSS variables, template cycling, 14 background textures, ColorPickerWithTexture

### User Guide Updates (Feb 15, 2026)
- [x] All 9 help docs updated with latest features

## Pending
- Media gallery data is empty - user may need to re-create galleries
- Google Drive needs OAuth refresh token
- Email sending requires valid SMTP credentials

## Upcoming Tasks
- P1: Data Recovery Plan for wiped template styles
- P1: Office 365 integration for File Manager
- P2: SMTP credential configuration
- P2: Refactor server.py into route files

## Key Files
- `frontend/src/components/UserPreferences.js` - Site Style panel (no FAB, triggered from nav)
- `frontend/src/components/Navigation.js` - Added "Site Style" gear button
- `frontend/src/components/EventCardPopup.js` - Event detail popup modal
- `frontend/src/App.js` - State management, event click handling, theme persistence
