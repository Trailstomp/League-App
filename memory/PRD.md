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

### Navigation & Logo Controls, Mobile Fixes (Feb 17, 2026)
- [x] Nav bar background (image/texture/color) now only applies to the logo header section, not the entire sidebar
- [x] Logo display controls: Contain / Cover / Stretch fit modes
- [x] Logo transparent background toggle + background color picker when transparent is off
- [x] Color pickers (Enhanced + Advanced) responsive on mobile — no longer overflow screen
- [x] Crop tool now works on mobile with touch events (drag, resize handles)
- [x] Crop tool canvas responsive sizing for mobile screens
- [x] Admin Content Text Color and Card Heading Color settings affect page text

### Design & Theming System
- [x] CSS variables, template cycling, 14 background textures, ColorPickerWithTexture

### User Guide Updates (Feb 15, 2026)
- [x] All 9 help docs updated with latest features

### Live Scoring Clock Toggles & Stats Only Mode (Feb 17, 2026)
- [x] Independent toggle switches for Game Clock and Shot Clock in the sticky header
- [x] Game Clock OFF: scoreboard shows '--:--', Start/Pause/Next Period/Edit Time buttons hidden
- [x] Shot Clock OFF: center panel hidden, replaced with VS divider
- [x] Both toggles work independently
- [x] **Stats Only Mode**: One-tap button in header to disable both clocks and jump to player stats
- [x] Stats Only option added to ScoringSelector (3-column mode picker: Live Stats, Stats Only, Quick Score)
- [x] Stats Only button toggles amber/gray and acts as a reversible preset
- [x] Layout rearranged for compactness: smaller buttons, tighter spacing, reduced header height (320px -> 260px)
- [x] Tabs use compact text, horizontally scrollable on mobile

### Standings Page Bug Fix (Feb 17, 2026)
- [x] Fixed critical `TypeError: a.filter is not a function` crash on `/standings` page
- [x] Root cause: `getDisplayData()` in `StandingsTable.js` called `.filter()` on division data objects instead of their `.teams` array
- [x] Fix: Properly destructure division data objects and filter the `.teams` array within

### Mobile Navigation Overhaul (Feb 18, 2026)
- [x] Removed hamburger menu from mobile header - all navigation now in bottom bar
- [x] Fixed banner title text truncation - now wraps up to 2 lines instead of cutting off
- [x] Enhanced bottom nav bar: Home, Events, Standings, My Team, Dashboard, Site Style, Admin (context-aware)
- [x] Mobile ticker now uses full card-style events (same as desktop) with borders, status badges, team names, dates
- [x] Removed mobile slide-out navigation overlay (no longer needed)

### Email Client Feature (Feb 19, 2026)
- [x] Full email client with inbox, compose, reply, forward, trash, search, attachments
- [x] Supports Gmail, Office 365, and Custom SMTP/IMAP providers
- [x] User-managed email account credentials with encrypted password storage
- [x] Permission-controlled access via `nav.email` (league_admin, team_coach by default)
- [x] Provider setup instructions with direct links to App Password pages
- [x] Email client documentation added to Help & Docs page
- [x] Backend routes: /api/email-client/* (accounts CRUD, folders, messages, send, trash, attachments)
- [x] Frontend: EmailClient, EmailSettings, ComposeEmail components
- [x] Testing: 100% pass rate (10/10 backend, all frontend flows verified)

### Visit Tracker Feature (Feb 20, 2026)
- [x] Backend analytics API: track visits, summary aggregation, daily trends
- [x] Automatic page visit tracking on frontend navigation (fire-and-forget)
- [x] Tracks: Home, Events, Live View, Standings, Team pages, Email, Chat, Help, Dashboard
- [x] Separate rows for each team page with team name
- [x] Guest vs Logged-in breakdown + role columns (Admin, Coach, Player, etc.)
- [x] Time-based trend chart with stacked bars (guest vs logged-in)
- [x] Period selector: 7/14/30/90 days
- [x] Admin dashboard tab: Overview > Visit Tracker
- [x] Testing: 100% pass rate (18/18 backend tests)

## Pending Issues
- P1: News & Gallery data loss fix — verification pending (backend $set updates + local upload fallback implemented)
- P2: Ticker "Show Practice" setting persistence — verification pending (auto-save implemented)
- Google Drive needs OAuth refresh token
- Email sending requires valid SMTP credentials

## Upcoming Tasks
- P1: Data Recovery Plan for wiped template styles
- P1: Office 365 integration for File Manager
- P2: SMTP credential configuration
- P2: Refactor server.py into route files
- P2: Refactor WebsiteDesignManager.js (large component)

## Key Files
- `frontend/src/components/unified-events/EnhancedLiveStatsEntry.js` - Main live scoring component (clock toggles, compact layout)
- `frontend/src/components/AnalogScoreboard.js` - Scoreboard display (supports shotClock prop)
- `frontend/src/components/UserPreferences.js` - Site Style panel
- `frontend/src/components/Navigation.js` - Added "Site Style" gear button
- `frontend/src/components/EventCardPopup.js` - Event detail popup modal
- `frontend/src/App.js` - State management, event click handling, theme persistence
