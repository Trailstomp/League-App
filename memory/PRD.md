# League Management Portal - Product Requirements Document

## Deployment Configuration

### Required Environment Variables (Backend)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `mlbl_database` |
| `FRONTEND_URL` | **Production URL for RSVP links** | `https://yourdomain.com` |
| `BACKEND_URL` | Backend API URL | `https://yourdomain.com` |
| `STRIPE_API_KEY` | Stripe API key | `sk_live_xxx` |

### Important: FRONTEND_URL for Production
When deploying to production, **you must set `FRONTEND_URL`** in `/app/backend/.env` to your production domain.

This URL is used for:
- Quick RSVP links sent via GroupMe/Email notifications
- Team invite links
- Password reset links

**Example:**
```
FRONTEND_URL="https://mlbl.yourdomain.com"
```

Without this, notification links will point to localhost and won't work!

---

## Original Problem Statement
Create a comprehensive league management portal for **multiple sports** (Lacrosse, Hockey, Soccer, Volleyball) with features for:
- Team management with rosters and player assignments
- Event scheduling and RSVP management  
- Live game scoring with real-time player stats (sport-specific)
- Admin tools for league administration
- Player dashboard for individual stats and team info
- Payment processing for fees
- Finance tracking for income and expenses
- **Multi-sport support** with configurable positions and scoring

## User Personas
- **League Admin**: Full control over all teams, events, finances, and settings
- **Team Admin/Coach**: Manage their team's roster, events, finances, and settings
- **Player**: View their stats, team info, and respond to events
- **Guest**: Browse public team and event information

## Core Requirements

### Team Management
- [x] Team creation and editing
- [x] Division-based organization
- [x] Team styling (colors, logos, banners)
- [x] Multi-team player support (players can be on multiple teams)
- [x] **Roster Management** - Add/edit/remove players from team roster (visible to team/league admins)
- [x] **Image Upload with Crop** - Upload logos and banners with cropping functionality
- [x] **Use Logo Colors** - Extract colors from team logo for theme

### Finance Management
- [x] **Team Finance Tab** - Track income and expenses at team level
- [x] **Predefined Categories** - Income: Registration Fees, Sponsorship, Donations, etc. Expense: Equipment, Uniforms, Travel, etc.
- [x] **Transaction CRUD** - Add, edit, delete transactions with date, amount, category, description
- [x] **Summary Dashboard** - Total income, expenses, balance, transaction count
- [x] **League Finance View** - Admin Portal view for league-wide financial overview
- [x] **Team Summaries** - Per-team income/expense/balance visible to league admin
- [x] **Transaction Filters** - Filter by All, Income, or Expense
- [x] **CSV Export** - Export financial data to CSV format

### Player Management  
- [x] Player profiles with photos, positions, jersey numbers
- [x] Player import tool with password reset links
- [x] Role-based access (admin, league_admin, coach, player, guest)
- [x] Default landing page preferences per user
- [x] **Player Card Image Fix** - Fixed cropping to show full head/face
- [x] **Multi-select Positions** - Users can have multiple positions (Attack, Midfield, Defense, etc.)
- [x] **CSV Import Single Name** - Changed from firstName/lastName to single "name" field

### Progressive Web App (PWA)
- [x] **PWA Conversion** - App can be installed on devices
- [x] **PWA Customization** - Admin can customize app name, icon, description, theme colors
- [x] **Install Banner Customization** - Customize install prompt appearance
- [x] **Dynamic Manifest** - `/api/pwa/manifest.json` serves customized manifest

### Data Management
- [x] **Data Cleanup Utility** - Find and remove orphaned data (deleted users in rosters)
- [x] **Database Statistics** - View user counts, team counts, legacy data
- [x] **Preview Before Delete** - Preview orphaned data before cleaning
- [x] **Team Player Sources Diagnostic** - Shows ALL 5 locations where player data can be stored:
  - Source 1: Users with teamId field
  - Source 2: Users with teamAssignments array
  - Source 3: Legacy league_data.players array
  - Source 4: Team roster array
  - Source 5: Team players array
- [x] **Clear All Players** - Nuclear option to clear all player references from a specific team

### Live Scoring
- [x] Real-time game scoring with shot tracking
- [x] **Single SHOT button** - Consolidated Goal/Save/Miss into one button that opens a modal
- [x] **Assist Tracking** - When recording a goal, option to select assisting player
- [x] Player roster display with clickable photo popups
- [x] Shot clock with disable option
- [x] YouTube feed integration

### Authentication
- [x] **Email/Password Authentication** - Traditional login with email and password
- [x] **Google OAuth** - "Sign in with Google" via Emergent Auth
- [x] **Password Reset** - Email-based password reset flow
- [x] **Role-based Access** - admin, league_admin, coach, player, guest roles
- [ ] **OAuth/Social Login** - Additional providers (Facebook, Apple)

### Multi-Sport Configuration
- [x] **Sport Type Selection** - Admin can select league sport (Lacrosse, Hockey, Soccer, Volleyball)
- [x] **Sport-Specific Positions** - Each sport has unique positions (e.g., Attack/Midfield for Lacrosse, Center/Wing for Hockey)
- [x] **Sport-Specific Scoring** - Goals/Saves for hockey/soccer/lacrosse, Kills/Aces for volleyball
- [x] **Sport Icons** - Custom SVG icons for each sport
- [x] **Terminology** - Sport-appropriate terms (Period vs Half vs Set, Goal vs Point)
- [x] **Configuration Preview** - Shows positions and scoring actions when selecting sport
- [x] **Live Scoring Integration** - Sport config flows to live stats entry with:
  - Sport icon and name in title bar
  - Sport-specific period names (Quarter/Period/Half/Set)
  - Sport-specific number of periods (4/3/2/5)
  - Dynamic stat types based on sport
- [x] **Player Stats Integration** - Player cards and rosters show sport-specific stats:
  - Lacrosse/Hockey/Soccer: Goals, Assists, Points
  - Volleyball: Kills, Aces, Blocks
- [x] **Standings Integration** - League standings use sport-specific terminology:
  - Goal-based sports: GF (Goals For), GA (Goals Against), GD (Goal Diff)
  - Volleyball: SW (Sets Won), SL (Sets Lost), SD (Set Diff)
  - Sport icon displayed in division headers

### First-Time Setup Wizard
- [x] **Setup Detection** - Automatically detects fresh install vs existing database
- [x] **4-Step Wizard:**
  1. Sport Selection - Choose league sport (Lacrosse, Hockey, Soccer, Volleyball)
  2. League Info - Name, tagline, primary/accent colors with preview
  3. Admin Account - Create first admin with full privileges
  4. First Team (Optional) - Quick team creation to get started
- [x] **Backend Endpoints:**
  - GET /api/setup/status - Check if setup is needed
  - POST /api/setup/admin - Create first admin account
  - POST /api/setup/league - Save league settings
  - POST /api/setup/complete - Mark setup as done
- [x] **Legacy Database Support** - Existing databases skip wizard automatically

## Architecture

### Frontend (React)
- `/app/frontend/src/App.js` - Main app with routing and auth state
- `/app/frontend/src/pages/TeamDetailPage.js` - Team detail with tabs (Roster, Finance, Stats, Settings, etc.)
- `/app/frontend/src/pages/AdminPage.js` - Admin Portal with League Finance
- `/app/frontend/src/components/ImageUploadCrop.js` - Reusable image upload with crop
- `/app/frontend/src/components/managers/LeagueFinanceManager.js` - League-wide finance view
- `/app/frontend/src/components/managers/DataCleanupManager.js` - Data cleanup utility
- `/app/frontend/src/utils/colorExtractor.js` - Color extraction from images

### Backend (FastAPI)
- `/app/backend/server.py` - Main API server with routers
- `/app/backend/routes/cleanup.py` - Data cleanup endpoints
- `/app/backend/routes/users.py` - User/auth endpoints
- `/app/backend/routes/teams.py` - Team roster management
- `/app/backend/routes/finance.py` - Finance CRUD operations

### Database (MongoDB)
- `users` collection - User profiles with teamAssignments, roles
- `teams` collection - Team data with style, division info
- `league_schedule` collection - Events and games
- `finance_transactions` collection - Income/expense records

## Key API Endpoints

### Data Cleanup (Updated - Jan 13, 2025)
- `GET /api/cleanup/database-stats` - Get database statistics
- `GET /api/cleanup/team/{team_id}/player-sources` - Get ALL 5 sources where players are stored for a team
- `POST /api/cleanup/team/{team_id}/clear-all-players` - Clear all player references for a team (confirm=true to execute)
- `GET /api/cleanup/orphaned-players/preview` - Preview orphaned data without deleting
- `POST /api/cleanup/orphaned-players/clean` - Remove orphaned data
- `DELETE /api/cleanup/inactive-users` - Remove inactive users (with confirm param)
- `GET /api/cleanup/health-alerts/settings` - Get health alert email settings
- `POST /api/cleanup/health-alerts/settings` - Update health alert settings

### Finance Management
- `GET /api/finance/categories` - Get predefined income/expense categories
- `GET /api/finance/transactions` - Get transactions with filters (scope, scope_id, type)
- `POST /api/finance/transactions` - Create new transaction
- `PUT /api/finance/transactions/{id}` - Update transaction
- `DELETE /api/finance/transactions/{id}` - Delete transaction
- `GET /api/finance/team/{team_id}/summary` - Get team finance summary
- `GET /api/finance/league/summary` - Get league-wide finance summary

### Team Player Management
- `POST /api/team/{team_id}/player` - Add existing user to team
- `DELETE /api/team/{team_id}/player/{player_id}` - Remove player from team
- `PUT /api/team/{team_id}/player/{player_id}` - Update player info (position, number, availability)
- `PUT /api/team/{team_id}/player/{player_id}/payment` - Update player payment status (paymentStatus, amountPaid, amountOwed, notes, lastPaymentDate)
- `GET /api/team/{team_id}/players` - Get team roster with payment and availability fields

### Image Upload
- `POST /api/upload/image` - Upload and crop images (logos, banners)

### Division Management
- `GET /api/divisions` - Get all divisions
- `POST /api/divisions` - Create new division
- `PUT /api/divisions/{division_id}` - Update division
- `DELETE /api/divisions/{division_id}` - Delete division (validates no teams assigned)

### League Settings
- `GET /api/league-settings/welcome-message` - Get welcome message
- `PUT /api/league-settings/welcome-message` - Update welcome message (admin only)

## What's Been Implemented

### February 7, 2025 (Current Session)
- **Feature: Redesigned HomePage with Welcome Tab:**
  - Added new "Welcome" tab as default landing page (left of Teams tab)
  - Welcome Message section with editable title and content by admins
  - "Want to Join Us?" section with 3 cards: Join as Player, Register a Team, Volunteer/Sponsor
  - Moved League News to Welcome tab
  - Teams tab now shows division-based filters and helpful banner about contacting teams
  - Files: `HomePage.js` (complete rewrite)

- **Feature: Welcome Message Manager (Admin):**
  - New WelcomeMessageManager component for admins to customize welcome message
  - Added to Admin Page under "Content > Welcome Message" tab
  - Real-time preview of changes
  - Backend endpoints for GET/PUT welcome message
  - Files: `WelcomeMessageManager.js`, `AdminPage.js`, `server.py`

- **Enhancement: Team Contact Page:**
  - Added "Interested in Joining [Team]?" banner
  - Shows coaching staff with clickable email links (mailto:)
  - Improved layout with loading states
  - Files: `TeamContactTab.js`

- **Feature: Events View Toggle (Compact/Detailed/Calendar):**
  - Added view mode toggle to Events page: Compact, Detailed, Calendar
  - **Compact view (default):** Clean row-based list with date, time, title, status - easier to scan
  - **Detailed view:** Original card layout with full event details
  - **Calendar view:** Monthly calendar visualization
  - Compact row includes quick action buttons for Live View, Enter Scores, Manage Bracket
  - Files: `EventsList.js`, `CompactEventCards.js`

- **Bug Fix: TeamManager divisions prop:**
  - Fixed `divisions is not defined` error by passing prop to BasicInfoTab component

### February 6, 2025 (Previous Session)
- **Feature: Division Manager (P1):**
  - Created DivisionManager component for league admins to manage divisions
  - Added to Admin Page under "League Management > Divisions" tab
  - Full CRUD operations: Create, Read, Update, Delete divisions
  - Division fields: name, level (sort order), color, description
  - Delete validation prevents removing divisions with assigned teams
  - TeamManager now loads divisions from API dynamically instead of hardcoded values
  - Files: `DivisionManager.js`, `AdminPage.js`, `TeamManager.js`, `server.py`

### February 5, 2025
- **Bug Fix: External Teams Hidden from UI (P0):**
  - Filtered external teams (`isExternal=true`) from HomePage team cards and Navigation sidebar
  - Teams with `isExternal` flag now only appear in scheduling dropdowns, not public display
  - Files modified: `HomePage.js`, `Navigation.js`

- **Bug Fix: Team Settings Save (P0):**
  - Added `handleTeamUpdate` function in App.js to refresh team data after settings save
  - Created `GET /api/league-data/teams/{team_id}` endpoint to fetch single team data
  - Fixed prop chain: App.js → TeamDetailPage → TeamSettingsTab now correctly refreshes team data
  - Success message "✅ Appearance settings saved!" now displays reliably

- **Bug Fix: GroupMeChat Component (P0):**
  - Fixed duplicate code at end of GroupMeChat.js file
  - Input box positioned at top of chat (lines 294-328)
  - Messages sorted newest first using `sort((a,b) => timeB - timeA)`

- **Feature: Event Creation from Team Schedule Tab (P1):**
  - Added "Create Event" button visible to coaches/admins on team schedule page
  - New form allows creating: Practice, Game, Tournament, Meeting, Other events
  - Game events support opponent team selection
  - Created `POST /api/events` endpoint for simple event creation
  - Events automatically added to league schedule and appear in ticker
  - Added `handleEventsUpdate` function in App.js to refresh events after creation

### January 26, 2025
- **Team Admin Tab - Recruiting Integration (P1):**
  - Moved Recruiting section into Team Admin tab (3 sections now: Players, Availability, Recruiting)
  - Removed standalone Recruiting tab from team page
  - Recruiting features: Invite link, direct email invites, pending requests management, sent invites list

- **Recurring Events Feature (P2):**
  - Added recurring event options to EventCreator for practices, meetings, and social events
  - Frequency options: Daily, Weekly (with day selection), Biweekly, Monthly
  - End options: After X occurrences, On specific date, or Never

- **Bug Fix: Practices Showing on Ticker (P1):**
  - **Root Cause**: Filter logic had fallback `|| eventFilters['other']` that let practices through even when practices filter was false
  - **Fix**: Removed fallback - now events only show if their specific filter type is enabled

- **Bug Fix: Ticker Card Borders Not Visible (P1):**
  - **Root Cause**: Card styles were hardcoded (`bg-slate-800/50`) instead of using websiteStyle colors
  - **Fix**: Applied `tickerItemColor` and `tickerBorderColor` from websiteStyle with `border-2` class

- **Team Admin Tab Reorganization (P1):**
  - Full player management with ALL fields (jersey size, lacrosse history, social media, fun facts, emergency contact)
  - TeamFinanceTab: 4 sub-tabs (Transactions, Fees, Player Payments, Payment Links)
  - TeamSettingsTab: Simplified to Social Media (with YouTube) and Appearance

### January 25, 2025 (Previous Session)
- **Team Admin Tab Reorganization (P1):**
  - Created new `TeamAdminTab.js` component with cleaner, table-based UI for player management
  - **3 Admin Sections:**
    1. **Manage Players**: Table view of all players with add/edit/delete actions, showing name, position, email, status badges
    2. **Payment Tracking**: Per-player payment management with summary stats, filtering, and payment update modal
    3. **Availability**: Player status management (Active/Injured/On Leave/Inactive) with inline dropdown updates
  - Reorganized team tabs: Admin → Finance → Recruiting (consolidated admin features)
  - Quick stats bar showing paid/unpaid/active counts at a glance
  - CSV export and email copy tools for team communication
  - Backend: New `PUT /api/team/{team_id}/player/{player_id}/payment` endpoint for payment updates
  - Backend: Enhanced `GET /api/team/{team_id}/players` to return payment and availability fields
  - Backend: Updated `PUT /api/team/{team_id}/player/{player_id}` to support availability updates
  - All backend tests passing (100% success rate)

- **Player Pictures Fix (P2):**
  - Verified fix for player images not appearing on roster cards
  - Backend static file mount point corrected to `/api/uploads`
  - Frontend `getFullImageUrl` utility correctly prepends backend URL to relative paths

### January 24, 2025 (Previous Session)
- **Critical Stats Aggregation Bug Fix (P0):**
  - Fixed team stats not propagating to standings after games marked final
  - Updated `_update_team_season_stats` function to include `goals_for`, `goals_against`, `goal_diff`, `pf`, `pa`, `games_played` fields
  - Updated `/api/dashboard-data` endpoint to include all stat fields in team response
  - Added player stats (goals, assists, gamesPlayed, etc.) to dashboard player data
  - Created `/api/admin/recalculate-stats` endpoint to recalculate all team stats from final games
  - Created `/api/admin/teams/{team_id}` endpoint for updating team data directly
  - Fixed Eagles and Hawks teams to have correct `division_id` for standings display
  - Added `division_id` and `league_id` to dashboard team response for consistency

- **Live Scoring UI Fixes (P1):**
  - Fixed tab navigation z-index/positioning issue in EnhancedLiveStatsEntry.js
  - Tab navigation now properly positioned below fixed header (top: 320px, zIndex: 40)
  - **Fixed Goal/Save/Miss buttons to open player selection modal** instead of direct recording
  - Buttons now pre-select shot type (Goal/Save/Miss) and allow player selection from roster
  - "Unknown Player" option available for quick recording when player is unknown
  - Events properly logged to Game Events tab with player names
  - Shot clock resets after each shot submission

- **End-to-End Stats Flow Verified:**
  - Scored game via Live Stats Entry → End Game (Final) → Stats propagated to standings
  - Eagles: 2W-0L, GF:7 GA:2 | Hawks: 0W-2L, GF:2 GA:7
  - Player stats (Nick: 2 goals) recorded and displayed correctly

- **All 17 Backend Tests Passed (100% success rate)**

### January 22, 2025 (Previous Session)
- **Google OAuth Integration (P1):**
  - Added "Sign in with Google" button to login modal
  - Created AuthCallback.js component for Emergent Auth callback handling
  - Backend endpoint POST /api/users/google-login creates/updates users
  - New Google users created with status='pending', authProvider='google'
  - Existing users get googleId linked on Google login

- **One-Click RSVP Magic Links (P2):**
  - Enhanced QuickRSVPForm.js with auto-submit functionality
  - URL parameters: `?response=yes&name=John&email=john@email.com`
  - Auto-submits RSVP when all required parameters present
  - Shows "RSVP Confirmed!" page with option to change response
  - Prevents double-submission in React StrictMode

### January 29, 2025 (Current Session)
- **Live Scoring UI Improvements (P0):**
  - **Single SHOT Button**: Consolidated 3 separate buttons (Goal/Save/Miss) into one "SHOT" button per team
  - **Compact Modal**: Horizontal 3-column grid layout for Miss/Save/Goal buttons
  - **Editable Time**: Added input field to edit timestamp in shot modal
  - **Assist Tracking**: When "Goal" is selected, an "Assist" dropdown appears to select assisting player
  - **Team Branding**: Scoreboard and player stats tables now show team logos and use team colors
  - **Shot Clock Fix**: Missed shots no longer reset the shot clock (only saves and goals do)

- **Payment Tracking Enhancements (P1):**
  - **Payment Method Selection**: Grid of payment method buttons (Cash, Check, Venmo, PayPal, Zelle, Cash App, Stripe, Other)
  - **Check Number Field**: Appears only when Check payment method is selected
  - **Payment Links**: Shows clickable payment link button for digital methods (Venmo, PayPal, etc)
  - **Backend Support**: Updated endpoint to store paymentMethod and checkNumber fields
  - All 9 backend tests passing (100% success rate)

- **Live Spectator View Redesign (P1):**
  - **Livestreaming Support**: Added YouTube embed area at top of Stream tab for live game broadcasts
  - **Tabbed Interface**: Stream, Events, Stats tabs for organized viewing experience
  - **Events Most Recent First**: Event tracker now shows most recent events at the top
  - **Collapsible Chat**: Chat moved to collapsible side panel (click "Chat" button to toggle)
  - **Team Branding Throughout**: Team logos, colors, and banners displayed prominently in header and stats
  - **Player Photos**: Circular player photos shown next to player names in events and stats tabs
  - **PlayerAvatar Component**: Reusable component shows player photo or jersey number fallback

- **PWA App Icon & Reinstall Feature (P1):**
  - **App Icon Upload**: Added file upload button in Admin → Mobile App Settings to upload custom app icon
  - **App Name/Short Name**: Editable fields for app name shown in install prompts and home screen
  - **Theme Colors**: Customizable theme and background colors for the PWA
  - **Install Banner**: Customizable install banner that prompts users to add app to home screen
  - **Reinstall Instructions**: Added comprehensive instructions for iOS, Android, and Desktop on how to update/reinstall the app after changing settings

### January 27, 2025 (Previous Session)
- **P0: Join Team Public Page** (NEW):
  - Created `/join/{team_id}` public page for recruits to request joining a team
  - New frontend component: `/app/frontend/src/pages/JoinTeamPage.js`
  - Displays team info (name, division, logo, colors) from GET `/api/teams/{team_id}/public`
  - Form collects: name, email, phone, position, experience level, message
  - Submits to POST `/api/teams/{team_id}/join-requests`
  - Prevents duplicate pending requests from same email
  - Success page confirms submission and instructs user to check email
  - Error handling for invalid/non-existent teams
  - Integrates with existing Team Admin recruiting section to show pending requests

- **P2: Recurring Events Backend Logic** (NEW):
  - Enhanced `/api/unified-events` POST endpoint to handle recurring events
  - When `is_recurring=true` with recurrence config, generates multiple event instances
  - Supported frequencies: daily, weekly, biweekly, monthly
  - End conditions: count (N occurrences), date (until specific date), never (1 year)
  - Weekly events can target specific days via `daysOfWeek` array
  - All instances linked via `parent_event_id` and `recurrence_index`
  - Recurring events synced to both `unified_events` collection and `leagueSchedule` for ticker
  - Updated `UnifiedEvent` model with `is_recurring` and `recurrence` fields

- **New Backend Endpoints:**
  - `GET /api/teams/{team_id}/public` - Public team info (no auth required)
  - `POST /api/teams/{team_id}/join-requests` - Submit join request (no auth required)
  - `GET /api/team/{team_id}/requests` - Get pending join requests (for team admins)
  - `PUT /api/team/{team_id}/requests/{request_id}` - Approve/reject join request
  - `GET /api/team/{team_id}/invites` - Get sent team invites
  - `POST /api/team/{team_id}/invite` - Send team invite

- **All tests passed (100% success rate)** - 13/13 backend tests

- **Multi-Sport Support (P2):**
  - Created sportsConfig.js with configurations for Lacrosse, Hockey, Soccer, Volleyball
  - Created SportIcons.js with SVG icons for each sport
  - Added "Sport Type" section to Admin Portal > Settings > Website Design
  - Each sport has: positions, scoring actions, game structure, terminology
  - sportType persists in websiteStyle configuration
  - Sport selection affects icons, positions, and scoring throughout app

- **Live Scoring Sport Integration (P2):**
  - Updated LiveStatsEntry.js and EnhancedLiveStatsEntry.js to use sportConfig
  - Sport-specific period names: Quarter (lacrosse), Period (hockey), Half (soccer), Set (volleyball)
  - Sport-specific period counts: 4/3/2/5 respectively
  - Sport icon and name displayed in live scoring header
  - Dynamic stat types based on sport (Goals/Kills, Assists, Shots/Aces, Saves/Blocks)
  - All "Period" text throughout live scoring now uses sport-specific terminology

- **All tests passed (100% success rate)**

### January 13, 2025 (Previous Session)
- **Enhanced Team Player Sources Diagnostic Tool** (P0 Fix):
  - Fixed JSX syntax error in DataCleanupManager.js that was breaking frontend build
  - New "Team Players" tab shows ALL 5 data locations where players can be stored
  - Helps diagnose "ghost players" appearing on team rosters after deletion
  - Sources tracked: users.teamId, users.teamAssignments, league_data.players, team.roster, team.players
  - "Clear All Players from This Team" button for nuclear cleanup option
  - Backend: GET /api/cleanup/team/{team_id}/player-sources, POST /api/cleanup/team/{team_id}/clear-all-players
  - All 13 backend tests passing (100%)

### January 10, 2025 (Latest Session)
- **Health Alert Email Notifications** (NEW):
  - Email alerts when database health thresholds are exceeded
  - Configurable thresholds for orphaned records, pending users, legacy players
  - Multiple recipient email support
  - Test alert functionality
  - Settings UI in Data Cleanup → Health Alerts tab
  - Backend: `/api/cleanup/health-alerts/*` endpoints

- **Data Health Dashboard Widget**:
  - New DataHealthWidget component on Admin Dashboard
  - Shows: Active Users, Pending Approval, Orphaned Records, Teams count
  - Color-coded health status (Healthy/Minor Issues/Needs Attention)
  - Issues breakdown with link to Data Cleanup page
  - Refresh button for real-time updates

- **Data Cleanup Utility**:
  - New tab in Admin Portal -> Settings -> Data Cleanup
  - Preview orphaned data before deleting
  - Clean legacy players, orphaned roster entries, invalid team assignments
  - Database statistics view
  - Backend: `/app/backend/routes/cleanup.py` router

- **PWA Color Picker Fix**:
  - Fixed missing border styling on color inputs in Mobile App Settings
  - Theme Color, Background Color, Banner colors now properly styled

### January 10, 2025 (Earlier Session)
- **Code Refactoring (Major)**:
  - Frontend: TeamDetailPage.js reduced from ~1,150 to 305 lines (~73% reduction)
  - Extracted 8 additional components to `/app/frontend/src/components/team/`
  - Backend: Created `users.py` and `rsvp.py` routers (total 5 routers, 1,885 lines)
  
- **Finance CSV Export Feature**:
  - Export CSV button added to Team Finance tab
  - Export CSV button added to League Finance (Admin Portal)
  - Exports include all transactions + summary data

### January 10, 2025 (First Session)
- **Finance Register Feature (P1)**: Complete income/expense tracking system
  - Team Finance tab visible to team admins/coaches
  - Predefined categories for income (8) and expense (13)
  - Add/Edit/Delete transactions with validation
  - Summary cards: Total Income, Expenses, Balance, Transaction count
  - Filter by All, Income, or Expense
  - League Finance in Admin Portal showing all team summaries
  - Backend: 15/15 API tests passed

- **Image Upload with Crop**: Replaced URL-only inputs with file upload
  - ImageUploadCrop component using react-image-crop library
  - Square crop for logos, 16:9 crop for banners
  - URL input fallback still available
  - Integrates with existing Google Drive upload

- **Use Logo Colors Feature**: Extract colors from team logo
  - Uses colorthief library for color extraction
  - Extracts primary, accent, background, and text colors
  - "Use Logo Colors" button appears when logo is set
  - Applies extracted colors to team theme

- **Player Card Image Fix**: Fixed heads being cropped
  - Changed from object-cover to object-contain
  - Added items-start for top alignment
  - Photos now show full head/face

### January 9, 2025
- Roster Management Feature
- Player Card PDF Download Fix
- Stats by Year Feature
- Ticker Tape Improvements
- Auth State Improvements

## Prioritized Backlog

### P0 (Critical)
- [x] Finance Register - DONE
- [x] Image Upload with Crop - DONE
- [x] Join Team Public Page - DONE (Jan 27, 2025)

### P1 (High Priority)
- [x] Refactor `server.py` into feature-based routers - IN PROGRESS
- [x] Refactor `TeamDetailPage.js` - extract components - DONE (~92% reduction)
- [x] Extract PlayerCardPopup into separate component - DONE

### P2 (Medium Priority)
- [x] Session persistence across navigation and refresh - VERIFIED WORKING
- [x] Recurring Events Backend Logic - DONE (Jan 27, 2025)
- [ ] Player card popup improvements
- [ ] Advanced notification system
- [ ] Complete YouTube backend integration
- [ ] Mobile-responsive improvements
- [ ] Google Drive Integration - Built but awaiting user credentials
- [ ] Finance Register PDF Export

### P3 (Future)
- [ ] OAuth/Social login integration
- [ ] Offline support / PWA features
- [x] Financial reports/exports - CSV export added to Team and League Finance
- [ ] Refactor to `react-router-dom` for better maintainability
- [ ] Improve Tournament Scoring UI

## Technical Debt - RESOLVED
### Frontend Refactoring (TeamDetailPage.js)
- **Before**: 3,942 lines → **After**: 305 lines (~92% reduction!)
- Extracted components to `/app/frontend/src/components/team/`:
  - `TeamFinanceTab.js` (449 lines) - Finance register
  - `TeamSettingsTab.js` (499 lines) - Team settings (YouTube, Social, Appearance)
  - `PlayerCardPopup.js` (328 lines) - Player card modal
  - `TeamRosterTab.js` (690 lines) - Roster display with player management
  - `MyDashboardTab.js` (137 lines) - Player/Coach personal dashboard
  - `TeamRecruitingTab.js` (381 lines) - Recruiting and invites
  - `TeamHomeTab.js` (202 lines) - Team home with news and locations
  - `TeamScheduleTab.js` (54 lines) - Event schedule
  - `TeamStatsTab.js` (8 lines) - Stats wrapper
  - `TeamMediaTab.js` (29 lines) - Photos & Videos wrapper
  - `TeamContactTab.js` (169 lines) - Contact information
  - `TeamChatTab.js` (41 lines) - GroupMe chat wrapper
  - `TeamRosterManageTab.js` (115 lines) - Roster management for coaches
  - `TeamFeesTab.js` (222 lines) - Team fee management

### Backend Refactoring (server.py)
- **Before**: 12,843 lines → **After**: 12,206 lines
- Created `/app/backend/routes/` with feature-based routers:
  - `finance.py` (314 lines) - Finance CRUD operations
  - `locations.py` (131 lines) - Location management
  - `teams.py` (237 lines) - Team roster management
  - `users.py` (361 lines) - User authentication and management

### Remaining Technical Debt
- `server.py` still large (~13K lines) - duplicate endpoints remain, need removal
- Could extract additional routers: events, media, groupme, payments

## Recently Completed (Feb 2026)
- **P0 Fix**: TeamManager.js `divisions is not defined` bug - verified FIXED
- **Design Templates System**: Full backend CRUD + frontend UI (save/load/delete templates)
- **Join Request Flow**: Verified end-to-end working (submit → admin notify → approve/reject → player notify)
- **Help Docs Updated**: Added Player Recruitment guide, updated Admin/Coach/Brochure/Reference docs
- **Email Notifications for Join Requests**: Fixed admin notification query (checks both `role` and `roles` fields, deduplicates by email)
- **Help Index Clickable Links**: Quick links navigate to doc sections; admin email mailto link added
- **Mobile Stats Layout**: Homepage stats (Teams/Events/Players) always display in single row
- **Next Steps Guide**: Post-setup wizard completion screen guides new admins through 6 key actions (divisions, teams, recruiting, events, design, email)
- **Consolidated Team Admin Tab**: Moved all team-level admin tools (Settings, Finance, Roster Hub) into the Team Admin tab. Coaches/admins now manage everything team-specific from one place. Removed separate Finance and Settings top-level tabs.. Emails attempted to all team coaches + league admins on new request, and to player on approve/reject

## Backlog / Upcoming
- P1: Get valid SMTP credentials configured for email notifications to actually deliver
- P2: Backend refactoring - consolidate legacy endpoints in server.py
- P2: Google Drive integration (user credentials needed)
- P2: Finance Register PDF Export
- P3: Refactor routing to react-router-dom
- P3: Improve tournament scoring UI

## Known Issues
- Production deployment broken (DNS/infrastructure - user must fix)
- Email notifications failing (SMTP auth - user must provide valid credentials)
- Google Drive integration pending user API credentials

## 3rd Party Integrations
- Twilio (SMS notifications)
- SMTP/Gmail (Email notifications)
- Stripe/PayPal (Payments)
- YouTube (Video feeds)
- Google Drive (File storage)
- GroupMe (Chat)
- react-image-crop (Image cropping)
- colorthief (Color extraction)
