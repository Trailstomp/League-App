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

### Visit Tracker Feature (Feb 20, 2026)
- [x] Backend analytics API: track visits, summary aggregation, daily trends
- [x] Admin dashboard tab with Visit Tracker

### Live Spectator View UI/UX Overhaul (Feb 20, 2026)
- [x] Replaced tabbed layout with simultaneous stream + events/stats view
- [x] Side-by-side layout on desktop, stacked on mobile

### Live Scoring Admin Header Compaction (Feb 21, 2026)
- [x] Compact 2-row header replacing full scoreboard + stacked rows

### Ticker "Show Practice" Fix + Config Separation (Feb 21, 2026)
- [x] Separate tickerConfig endpoint, moved out of template system

### Mobile UI & Live View Styling (Feb 24, 2026)
- [x] Bottom navbar text truncation fix
- [x] Site Style preferences panel narrowed on mobile
- [x] Live Spectator View color controls

### Roster & News Fixes (Feb 24, 2026)
- [x] TeamRosterTab Add Player modal with "Create New Player" tab
- [x] NewsDisplay: fixed oversized image and scrolling

### Email Client IMAP Fixes (Feb 24, 2026)
- [x] Robust IMAP folder resolution, graceful error handling

### Player Photo Upload Fix (Feb 24, 2026)
- [x] Relaxed content-type validation, local storage fallback

### Player Import & Notifications Fix (Feb 24, 2026)
- [x] Progress bar, results panel, drag-and-drop, fixed 520 error

### Calendar Hold Feature (Feb 24, 2026)
- [x] New "hold" event type for reserving dates

### Date/Timezone Fix (Feb 24, 2026)
- [x] Appended 'T00:00:00' to date strings to fix off-by-one-day errors

### Event Notifications Fix (Feb 24, 2026)
- [x] Fixed events with no teams emailing the entire league

### Admin Events Page UI/UX Redesign (Feb 24, 2026)
- [x] Replaced table-only layout with responsive card-based (mobile) + table (desktop) design
- [x] Mobile: Color-coded event cards with left border, type/status badges, compact info layout
- [x] Desktop: Clean table with colored type dots, status badges, location info
- [x] Collapsible filter panel (search, status, type, team, sort)
- [x] Three-dot action dropdown menus (Edit, Duplicate, Status change, Delete)
- [x] Bulk actions (Complete, Cancel, Delete) with select-all
- [x] Replaced all emoji icons with lucide-react icons
- [x] Testing: 100% pass rate (10/10 features verified, iteration_52)

### Events Page Mobile UI Cleanup (Feb 24, 2026)
- [x] EventManager.js header: compact title (text-base on mobile, text-2xl on desktop), subtitle hidden on mobile
- [x] EventManager.js buttons: "+ New" on mobile, "+ Create Event" on desktop; Refresh button compact with outline style
- [x] EventsList.js tabs: reduced padding (py-2 px-3 on mobile), removed emoji icons, smaller text
- [x] EventsList.js view toggle: "List/Detail/Cal" with text-[10px] on mobile instead of emoji + full word
- [x] EventsList.js filters: compact dropdowns without labels, all controls fit in one row on mobile
- [x] Testing: 100% pass rate (10/10 responsive features verified, iteration_53)

### Live Events Visibility & Game Stats (Feb 25, 2026)
- [x] "Watch Live" button visible to ALL users (including non-logged-in) on live event rows
- [x] "LIVE NOW" red gradient banner at top of Events page with team names and Watch button
- [x] "LIVE NOW" red gradient banner on Home page with team logos, score, and Watch button
- [x] Ticker: "WATCH" badge on live event cards in footer
- [x] "Stats" button on past completed games for all users
- [x] GameStatsView component: box score with Points column (2*goals + assists), game log tab
- [x] EventCardPopup: shows GameStatsView for completed/live games
- [x] Full column headers in live scoring: Shots, Goals, Assists, Pts, Faceoffs, Ground Balls, Pen Min
- [x] Points column in live scoring: calculated as 2*goals + 1*assists (indigo color)
- [x] Team Stats page: new "Game Log" tab with W/L indicator, expandable game stats
- [x] Backend: GET /api/teams/{team_id}/game-log endpoint
- [x] Testing: 100% backend (13/13), 90% frontend (iteration_54)

### Go Live Toggle on Live Scoring (Feb 25, 2026)
- [x] "GO LIVE" toggle button in live scoring header — toggles event status between `scheduled` and `in_progress`
- [x] Red pulsing "● LIVE" state when active, gray "GO LIVE" when inactive
- [x] Separated by vertical divider from other toggles (Stats Only, Clk, Sht)
- [x] PATCH /api/unified-events/{id} updates status — triggers live banners on Home, Events, Ticker

## Pending Issues
- P1: Gallery data loss fix — user confirmed FIXED
- Google Drive needs OAuth refresh token
- Email sending requires valid SMTP credentials

## Upcoming Tasks
- P1: Office 365 integration for File Manager
- P2: SMTP credential configuration
- P2: Refactor server.py into route files
- P2: Refactor EnhancedLiveStatsEntry.js (3800+ lines)
- P2: Cleanup dead code in TeamRosterTab.js

## Key Files
- `frontend/src/components/admin/AdminEventsView.js` - Redesigned events management UI
- `frontend/src/pages/LiveSpectatorView.js` - Live spectator view
- `frontend/src/components/unified-events/EnhancedLiveStatsEntry.js` - Live scoring
- `frontend/src/components/UserPreferences.js` - Site Style panel
- `frontend/src/components/Navigation.js` - Sidebar navigation
- `frontend/src/App.js` - State management, routing, theme persistence
- `backend/routes/email.py` - Email client backend
- `backend/routes/analytics.py` - Visit tracker backend
