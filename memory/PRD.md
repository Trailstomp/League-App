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

### Documents / File Manager
- [x] Dual provider: Google Drive + OneDrive/Office 365
- [x] File browser: folders, upload, download, create, delete

### Design & Theming System
- [x] CSS variables for dynamic theming
- [x] Design template cycling (random, daily)
- [x] Background Textures (14 textures) + ColorPickerWithTexture
- [x] Dynamic favicon, PWA manifest
- [x] Content Text Color CSS fix (admin settings affect all page text)

### Floating User Preferences Bubble (Feb 15, 2026)
- [x] FAB button, theme selector, auto-rotate toggle, default landing page
- [x] Persists in localStorage across sessions

### Coach Role & UI Fixes (Feb 15, 2026)
- [x] Coach role on Join Team page, backend saves requestedRole
- [x] Logo transparent background, team sorting

### User Guide Updates (Feb 15, 2026)
- [x] Feature Brochure: Added Design & Theming, User Preferences, PWA, Coach Applications sections
- [x] Setup Guide: Added Design Templates, Background Textures, Content Text Colors, PWA Setup steps
- [x] Admin Guide: Added Design & Theming section (textures, text colors, templates, user preferences bubble)
- [x] Coach Guide: Updated What You Can Do list, updated join request review (Coach badge)
- [x] Player Guide: Added Site Preferences and Add to Home Screen sections
- [x] Guest Guide: Updated What You Can See list, added Personalizing Your Experience section
- [x] Recruitment Guide: Updated to include Coach role throughout (form, approval, flow overview)
- [x] Quick Reference: Added 4 new rows to permissions table (theme, PWA, media, design templates)
- [x] Quick Reference: Added User Preferences and Background Textures reference tables
- [x] Documentation Index: Updated "By Task" quick links

## Pending
- Media gallery visibility — user verification pending
- Google Drive needs OAuth refresh token
- Email sending requires valid SMTP credentials

## Upcoming Tasks
- P1: Data Recovery Plan for wiped template styles
- P1: Office 365 integration for File Manager
- P2: SMTP credential configuration
- P2: Refactor server.py into route files
- P2: Break down EnhancedLiveStatsEntry.js

## Architecture
- Frontend: React, Tailwind CSS, Shadcn UI, lucide-react
- Backend: Python, FastAPI, Pydantic
- Database: MongoDB
- Auth: Emergent-managed Google Auth
- 3rd Party: Google Auth, Google Maps, MongoDB, GroupMe, Google Drive API
