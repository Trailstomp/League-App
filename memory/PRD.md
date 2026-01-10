# League Management Portal - Product Requirements Document

## Original Problem Statement
Create a comprehensive league management portal for lacrosse leagues with features for:
- Team management with rosters and player assignments
- Event scheduling and RSVP management  
- Live game scoring with real-time player stats
- Admin tools for league administration
- Player dashboard for individual stats and team info
- Payment processing for fees
- Finance tracking for income and expenses

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

### Finance Management (NEW)
- [x] **Team Finance Tab** - Track income and expenses at team level
- [x] **Predefined Categories** - Income: Registration Fees, Sponsorship, Donations, etc. Expense: Equipment, Uniforms, Travel, etc.
- [x] **Transaction CRUD** - Add, edit, delete transactions with date, amount, category, description
- [x] **Summary Dashboard** - Total income, expenses, balance, transaction count
- [x] **League Finance View** - Admin Portal view for league-wide financial overview
- [x] **Team Summaries** - Per-team income/expense/balance visible to league admin
- [x] **Transaction Filters** - Filter by All, Income, or Expense

### Player Management  
- [x] Player profiles with photos, positions, jersey numbers
- [x] Player import tool with password reset links
- [x] Role-based access (admin, league_admin, coach, player, guest)
- [x] Default landing page preferences per user
- [x] **Player Card Image Fix** - Fixed cropping to show full head/face
- [x] **Multi-select Positions** - Users can have multiple positions (Attack, Midfield, Defense, etc.)
- [x] **CSV Import Single Name** - Changed from firstName/lastName to single "name" field

### Live Scoring
- [x] Real-time game scoring with shot tracking
- [x] Three-button shot system (Goal, Save, Miss)
- [x] Player roster display with clickable photo popups
- [x] Shot clock with disable option
- [x] YouTube feed integration

### Authentication
- [x] Email/password login
- [x] Password reset via token
- [x] localStorage session persistence
- [x] Cross-tab sync via storage events
- [ ] OAuth/Social login

## Architecture

### Frontend (React)
- `/app/frontend/src/App.js` - Main app with routing and auth state
- `/app/frontend/src/pages/TeamDetailPage.js` - Team detail with tabs (Roster, Finance, Stats, Settings, etc.)
- `/app/frontend/src/pages/AdminPage.js` - Admin Portal with League Finance
- `/app/frontend/src/components/ImageUploadCrop.js` - Reusable image upload with crop
- `/app/frontend/src/components/managers/LeagueFinanceManager.js` - League-wide finance view
- `/app/frontend/src/utils/colorExtractor.js` - Color extraction from images

### Backend (FastAPI)
- `/app/backend/server.py` - Monolithic API server (needs refactoring)

### Database (MongoDB)
- `users` collection - User profiles with teamAssignments, roles
- `teams` collection - Team data with style, division info
- `league_schedule` collection - Events and games
- `finance_transactions` collection (NEW) - Income/expense records

## Key API Endpoints

### Finance Management (NEW)
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

### January 10, 2025 (Current Session)
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
- [ ] Refactor `server.py` into feature-based routers
- [ ] Refactor `TeamDetailPage.js` - extract components
- [ ] Extract PlayerCardPopup into separate component

### P2 (Medium Priority)
- [ ] Complete YouTube backend integration
- [ ] Mobile-responsive improvements

### P3 (Future)
- [ ] OAuth/Social login integration
- [ ] Offline support / PWA features
- [ ] Financial reports/exports

## Technical Debt - RESOLVED
- ✅ `server.py` refactored: Finance and Locations routers extracted (~400 lines moved to `/app/backend/routes/`)
- ✅ `TeamDetailPage.js` refactored: 
  - TeamFinanceTab (~450 lines) → `/app/frontend/src/components/team/TeamFinanceTab.js`
  - TeamSettingsTab (~500 lines) → `/app/frontend/src/components/team/TeamSettingsTab.js`
  - PlayerCardPopup (~330 lines) → `/app/frontend/src/components/team/PlayerCardPopup.js`
  - **Total reduction**: 3,942 lines → 2,536 lines (~36% reduction)

### Remaining Technical Debt
- `server.py` is still large (~12.4K lines) - could extract more routers (users, teams, media)
- TeamRosterTab could be extracted from TeamDetailPage.js

## 3rd Party Integrations
- Twilio (SMS notifications)
- SMTP/Gmail (Email notifications)
- Stripe/PayPal (Payments)
- YouTube (Video feeds)
- Google Drive (File storage)
- GroupMe (Chat)
- react-image-crop (Image cropping)
- colorthief (Color extraction)
