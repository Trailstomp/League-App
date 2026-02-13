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

### Documents / File Manager (NEW - Feb 13, 2025)
- [x] **Dual Provider Support** - Google Drive and OneDrive/Office 365
- [x] **League-Level Storage** - Uses existing Cloud Storage config (Google Drive)
- [x] **Team-Level Storage** - Each team can configure their own provider (Google Drive or OneDrive)
- [x] **File Browser** - Browse folders/files with breadcrumb navigation, search
- [x] **CRUD Operations** - Upload files (50MB max), create folders, delete files/folders
- [x] **Open in Provider** - Click to open files in Google Drive/OneDrive web UI
- [x] **Storage Settings** - Per-team provider selection with credential fields
- [x] **Admin Access** - Admin Portal → Content → Documents
- [x] **Team Coach Access** - Team Admin → Documents section
- [x] **Graceful Fallback** - Team storage falls back to league storage if not configured

### DB Collections
- `team_storage_configs` - Per-team storage provider config (google_drive or onedrive credentials)
- `email_history` - Sent email log
- `team_smtp_configs` - Per-team SMTP credentials

## Architecture
```
/app
  backend/
    routes/
      documents.py     # NEW: File manager API (config, list, upload, create folder, delete)
      communication.py # Email compose, SMTP config, team SMTP
      joinus.py        # Recruiting
      groupme.py       # GroupMe
    server.py
  frontend/
    src/
      components/
        managers/
          FileManager.js      # NEW: File browser + storage settings
          EmailComposer.js    # Email compose/history/settings
        team/
          TeamAdminTab.js     # Team admin (Players, Recruiting, Email, Documents, Locations, etc.)
      pages/
        AdminPage.js          # Admin portal (Documents under Content)
```

## Pending
- Google Drive needs OAuth refresh token to fully work (user must complete auth flow)
- OneDrive requires Azure AD app registration credentials
- Email sending requires valid SMTP credentials

## Upcoming Tasks
- P2: Continue server.py refactoring
- P3: Tournament scoring UI improvements
- Future: Hockey-specific stats
