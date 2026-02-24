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
- [x] Color pickers (Enhanced + Advanced) responsive on mobile
- [x] Crop tool now works on mobile with touch events
- [x] Admin Content Text Color and Card Heading Color settings affect page text

### Design & Theming System
- [x] CSS variables, template cycling, 14 background textures, ColorPickerWithTexture

### User Guide Updates (Feb 15, 2026)
- [x] All 9 help docs updated with latest features

### Live Scoring Clock Toggles & Stats Only Mode (Feb 17, 2026)
- [x] Independent toggle switches for Game Clock and Shot Clock
- [x] Stats Only Mode: One-tap button to disable both clocks

### Standings Page Bug Fix (Feb 17, 2026)
- [x] Fixed critical `TypeError: a.filter is not a function` crash

### Mobile Navigation Overhaul (Feb 18, 2026)
- [x] Removed hamburger menu, enhanced bottom nav bar
- [x] Fixed banner title text truncation

### Email Client Feature (Feb 19, 2026)
- [x] Full email client with inbox, compose, reply, forward, trash, search, attachments
- [x] Supports Gmail, Office 365, and Custom SMTP/IMAP providers
- [x] Testing: 100% pass rate (10/10 backend, all frontend flows verified)

### Visit Tracker Feature (Feb 20, 2026)
- [x] Backend analytics API: track visits, summary aggregation, daily trends
- [x] Admin dashboard tab with Visit Tracker
- [x] Testing: 100% pass rate (18/18 backend tests)

### Live Spectator View UI/UX Overhaul (Feb 20, 2026)
- [x] Replaced tabbed layout with simultaneous stream + events/stats view
- [x] Side-by-side layout on desktop (stream left, events/stats right), stacked on mobile
- [x] Custom compact scoreboard with large team logos (64px mobile, 80px desktop)
- [x] Combined Events and Stats into single panel with toggle tabs
- [x] High-contrast tab buttons (white text, blue accent on dark background)
- [x] Compact mobile layout with reduced padding and margins
- [x] Replaced full AnalogScoreboard with inline compact scoreboard
- [x] Stats panel includes comparison bars (Goals, Shots, Assists, Faceoffs, Ground Balls)
- [x] Testing: 100% pass rate (10/10 frontend tests, iteration_46)

### Live Scoring Admin Header Compaction (Feb 21, 2026)
- [x] Replaced full AnalogScoreboard + 4 stacked rows with compact 2-row header
- [x] Row 1: Dark bar with inline title + score + clock + team logos + Stats Only/Clock/Shot toggles
- [x] Row 2: White bar with Home SHOT/Pen/TO + game controls (Start/Next/Shot Clock/Save) + Away SHOT/Pen/TO
- [x] Reduced paddingTop from 260px to 90px — player roster now visible immediately
- [x] Removed AnalogScoreboard import from EnhancedLiveStatsEntry.js
- [x] All 14 data-testids present and functional
- [x] Testing: 100% pass rate (18/18 features verified, iteration_47)

### Ticker "Show Practice" Fix + Config Separation (Feb 21, 2026)
- [x] Root cause: websiteStyle sanitizer stripped all object values (tickerFilters was an object)
- [x] Created separate `/api/league-data/tickerConfig` backend endpoint (GET/POST)
- [x] Moved ticker functional settings (filters, lookback, lookforward) out of template system
- [x] TickerManager now auto-saves filters to independent endpoint
- [x] EventsTicker reads from `tickerConfig` prop instead of `websiteStyle`
- [x] Admin UI shows "Admin Setting" badge on functional settings vs visual template settings
- [x] Testing: 100% pass rate (7/7 backend + all frontend flows, iteration_48)

## Pending Issues
- P1: Gallery data loss fix — user confirmed FIXED
- Google Drive needs OAuth refresh token
- Email sending requires valid SMTP credentials

## Upcoming Tasks
- P1: Data Recovery Plan for wiped template styles
- P1: Office 365 integration for File Manager
- P2: SMTP credential configuration
- P2: Refactor server.py into route files
- P2: Refactor EnhancedLiveStatsEntry.js (3800+ lines)

### Mobile UI & Live View Styling (Feb 24, 2026)
- [x] Bottom navbar text truncation fix: replaced `truncate` with `break-words` in BottomNavbar.js
- [x] Site Style preferences panel narrowed on mobile: centered at 240px width instead of full-width
- [x] Live Spectator View color controls: 4 new color pickers (Background, Text, Panel, Accent) in WebsiteDesignManager
- [x] LiveSpectatorView fetches and applies custom colors from websiteStyle API instead of hardcoded dark theme
- [x] VISUAL_RESET defaults include: liveViewBgColor, liveViewTextColor, liveViewPanelBgColor, liveViewAccentColor

### Roster & News Fixes (Feb 24, 2026)
- [x] TeamRosterTab Add Player modal: added "Create New Player" tab alongside "Search Existing" (matching TeamAdminTab)
- [x] Manual player creation form with name, email, phone, jersey number, position fields
- [x] NewsDisplay: fixed oversized image (removed aspect-square, using max-h-48 object-contain)
- [x] NewsDisplay: added scrollable container (max-h-[500px] overflow-y-auto)
- [x] Removed duplicate "League News & Announcements" heading from HomePage

### Email Client IMAP Fixes (Feb 24, 2026)
- [x] Added _resolve_folder() to try alternative IMAP folder names (Gmail, Office365, etc.)
- [x] get_email_messages returns empty list for missing folders instead of 400/500 error
- [x] _connect_imap returns distinct errors: decryption failure (re-enter password), auth failure, connection failure
- [x] Frontend serializes IMAP requests (loadFolders then loadMessages) to avoid concurrent connections
- [x] Frontend gracefully handles folder/message load failures with fallbacks

## Key Files
- `frontend/src/pages/LiveSpectatorView.js` - Overhauled live spectator view (compact scoreboard, dual-panel layout)
- `frontend/src/components/unified-events/EnhancedLiveStatsEntry.js` - Main live scoring component
- `frontend/src/components/AnalogScoreboard.js` - Scoreboard display (still used in admin scoring)
- `frontend/src/components/UserPreferences.js` - Site Style panel
- `frontend/src/components/Navigation.js` - Sidebar navigation
- `frontend/src/components/EventCardPopup.js` - Event detail popup modal
- `frontend/src/App.js` - State management, routing, theme persistence
- `backend/routes/email.py` - Email client backend
- `backend/routes/analytics.py` - Visit tracker backend
