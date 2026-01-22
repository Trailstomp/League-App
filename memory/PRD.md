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
- [x] Three-button shot system (Goal, Save, Miss)
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
- `POST /api/team/{team_id}/add-player` - Add existing user to team
- `POST /api/team/{team_id}/remove-player` - Remove player from team
- `POST /api/team/{team_id}/update-player` - Update player position/number
- `GET /api/team/{team_id}/players` - Get team roster

### Image Upload
- `POST /api/upload/image` - Upload and crop images (logos, banners)

## What's Been Implemented

### January 22, 2025 (Current Session)
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

- **Multi-Sport Support (P2):**
  - Created sportsConfig.js with configurations for Lacrosse, Hockey, Soccer, Volleyball
  - Created SportIcons.js with SVG icons for each sport
  - Added "Sport Type" section to Admin Portal > Settings > Website Design
  - Each sport has: positions, scoring actions, game structure, terminology
  - sportType persists in websiteStyle configuration
  - Sport selection affects icons, positions, and scoring throughout app

- **All 14 tests passed (100% success rate)**

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

### P1 (High Priority)
- [x] Refactor `server.py` into feature-based routers - IN PROGRESS
- [x] Refactor `TeamDetailPage.js` - extract components - DONE (~92% reduction)
- [x] Extract PlayerCardPopup into separate component - DONE

### P2 (Medium Priority)
- [x] Session persistence across navigation and refresh - VERIFIED WORKING
- [ ] Player card popup improvements
- [ ] Advanced notification system
- [ ] Complete YouTube backend integration
- [ ] Mobile-responsive improvements

### P3 (Future)
- [ ] OAuth/Social login integration
- [ ] Offline support / PWA features
- [x] Financial reports/exports - CSV export added to Team and League Finance

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
- `server.py` still large (~12.2K lines) - duplicate endpoints remain, need removal
- Could extract additional routers: events, media, groupme, payments

## 3rd Party Integrations
- Twilio (SMS notifications)
- SMTP/Gmail (Email notifications)
- Stripe/PayPal (Payments)
- YouTube (Video feeds)
- Google Drive (File storage)
- GroupMe (Chat)
- react-image-crop (Image cropping)
- colorthief (Color extraction)
