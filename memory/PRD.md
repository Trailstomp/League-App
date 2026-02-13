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

### Documents / File Manager (Feb 13, 2025)
- [x] Dual provider: Google Drive + OneDrive/Office 365
- [x] File browser: folders, upload, download, create, delete
- [x] **"Use League Connection" option** — teams choose to share league's Google Drive/OneDrive or connect their own
- [x] Team-level storage config with provider selection
- [x] Media uploads (`/upload/image`) accept `team_id` to use team storage
- [x] Admin Portal → Content → Documents
- [x] Team Admin → Documents section

### DB Collections
- `team_storage_configs` - Per-team: `use_league` flag, provider choice, credentials
- `cloud_storage` - League-level Google Drive config
- `email_history`, `team_smtp_configs` - Email module

## Pending
- Google Drive needs OAuth refresh token to fully work
- OneDrive requires Azure AD credentials
- Email sending requires valid SMTP credentials

## Upcoming Tasks
- P2: Continue server.py refactoring
- P3: Tournament scoring UI improvements
- Future: Hockey-specific stats
