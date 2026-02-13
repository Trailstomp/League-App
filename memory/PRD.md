# League Management Portal - Product Requirements Document

## Original Problem Statement
Comprehensive league management portal for multiple sports with team management, event scheduling, live scoring, admin tools, player dashboards, payment processing, and finance tracking.

## What's Been Implemented

### Core Features (Complete)
- [x] Team management, event scheduling, live game scoring, tournaments
- [x] Finance, player profiles, PWA, GroupMe, "Join Us" workflow
- [x] Analog scoreboard, lacrosse stats (FO, GB, players on field)
- [x] Recruiting module (auto-creates teams/players on approval)

### Email Module (NEW - Feb 13, 2025)
- [x] **Email Composer** - Full compose UI with subject, body, rich HTML email delivery
- [x] **Recipient Picker** - Select by team group, individual members, or add custom emails
- [x] **Quick Templates** - Announcement, Practice Update, Game Reminder, Welcome
- [x] **Email History** - Log of all sent emails with delivery status
- [x] **Team-Level SMTP** - Each team can configure their own email (team@team.com)
- [x] **League-Level SMTP** - Falls back to league email if team doesn't have own
- [x] **Admin Access** - Admin Portal → Communications → Email
- [x] **Team Coach Access** - Team Admin → Email section
- [x] **Works with existing** event notification system (unchanged)

## Architecture
```
/app
  backend/
    routes/
      communication.py  # SMTP config, email compose, recipients, history, team SMTP
      joinus.py         # Recruiting endpoints
      groupme.py        # GroupMe integration
    services/
      smtp_email_service.py  # SMTP sending engine
    server.py
  frontend/
    src/
      components/
        managers/
          EmailComposer.js       # NEW: Full email module (compose, history, settings)
          RecruitingManager.js   # Admin recruiting dashboard
          CommunicationHub.js    # Email config hub (SMTP/Google)
        team/
          TeamAdminTab.js        # Team admin (includes Email section)
          TeamRecruitingTab.js   # Team-level recruiting
      pages/
        AdminPage.js            # Admin portal (Email under Communications)
```

## DB Collections
- `email_history` - Sent email log (subject, recipients, status, timestamps)
- `team_smtp_configs` - Per-team SMTP credentials (team_id, email, password, host, port)
- `team_registrations`, `player_applications`, `volunteer_signups` - Recruiting

## Pending Issues
- Email sending requires valid SMTP credentials (preview env has placeholder)
- GroupMe dashboard/stats endpoint 520 timeout (minor)

## Upcoming Tasks
- P2: Continue refactoring monolithic server.py
- P3: Tournament scoring UI improvements
- Future: Hockey-specific stats

## 3rd Party Integrations
- Google Auth, Google Maps, MongoDB, GroupMe, SMTP Email
