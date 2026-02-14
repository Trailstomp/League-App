# 📋 Quick Reference Card

## Keyboard Shortcuts (if enabled)
| Key | Action |
|-----|--------|
| `H` | Go to Home |
| `E` | Go to Events |
| `T` | Toggle Ticker |
| `Esc` | Close Modal |

---

## Role Permissions Matrix

| Feature | Admin | League Admin | Coach | Player | Guest |
|---------|:-----:|:------------:|:-----:|:------:|:-----:|
| View public content | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all rosters | ✅ | ✅ | ✅ | ✅ | ✅ |
| Join Us portal | ✅ | ✅ | ✅ | ✅ | ✅ |
| RSVP to events | ✅ | ✅ | ✅ | ✅ | ❌ |
| View own stats | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ❌ |
| Account settings | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage team roster | ✅ | ✅ | ✅* | ❌ | ❌ |
| Create team events | ✅ | ✅ | ✅* | ❌ | ❌ |
| Live scoring | ✅ | ✅ | ✅* | ❌ | ❌ |
| Team settings | ✅ | ✅ | ✅* | ❌ | ❌ |
| Team documents | ✅ | ✅ | ✅* | ❌ | ❌ |
| Create league events | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage all teams | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tournament brackets | ✅ | ✅ | ❌ | ❌ | ❌ |
| News management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Email composer | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| Recruiting mgmt | ✅ | ✅ | ❌ | ❌ | ❌ |
| User management | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Website styling | ✅ | ❌ | ❌ | ❌ | ❌ |
| File manager admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| Finance dashboard | ✅ | ❌ | ❌ | ❌ | ❌ |

*✅* = Own team only | ⚠️ = Limited

---

## Event Status Codes

| Status | Color | Meaning |
|--------|-------|---------|
| UPCOMING | 🔵 Blue | Scheduled, hasn't started |
| LIVE | 🔴 Red | Currently in progress |
| FINAL | ⚫ Gray | Completed, score final |
| POSTPONED | 🟠 Orange | Delayed, new date TBD |
| CANCELLED | 🔴 Dark Red | Not happening |

---

## Event Types

| Type | Icon | Use For |
|------|------|---------|
| Game | 🟢 | Regular season matches |
| Tournament | 🟣 | Multi-game competitions |
| Practice | 🔵 | Team training sessions |
| Meeting | 🟡 | Team/league meetings |
| Social | 🩷 | Team bonding events |
| External | 🟠 | Outside events |

---

## Player Positions

| Position | Abbrev | Description |
|----------|--------|-------------|
| Attack | A | Offensive specialist |
| Midfield | M | Two-way player |
| Defense | D | Defensive specialist |
| Goalie | G | Goalkeeper |
| FOGO | F | Face-off specialist |
| LSM | L | Long-stick midfield |

---

## URL Patterns

| Page | URL Pattern |
|------|-------------|
| Home | `/` |
| Team | `/team/{team-id}` |
| Event | `/event/{event-id}` |
| Tournament Bracket | `/tournament/{tournament-id}` |
| Admin | `/admin` |
| Live Score | `/live/{game-id}` |
| Standings | `/standings` |
| Account Settings | `/account` |
| Password Reset | `/reset-password?token=xxx` |

---

## Ticker Settings Reference

| Setting | Default | Range | Effect |
|---------|---------|-------|--------|
| Look Back Days | 365 | 1-365 | Past events shown |
| Look Forward Days | 365 | 1-365 | Future events shown |
| Speed | 1 | 0.5-3 | Scroll speed |
| Show Cancelled | Off | On/Off | Include cancelled |

---

## Image Requirements

| Type | Recommended Size | Format |
|------|-----------------|--------|
| Team Logo | 200x200 px | PNG, JPG |
| Player Photo | 400x500 px | PNG, JPG |
| Banner Image | 1200x300 px | PNG, JPG |
| News Image | 800x800 px (square) | PNG, JPG |
| Gallery Photo | 1920x1080 px | PNG, JPG |

---

## Admin Portal Navigation

| Tab Group | Sections |
|-----------|----------|
| Overview | Dashboard (clickable cards) |
| League Management | Events, Seasons, Divisions, Teams, Team Invites, Locations |
| Recruiting | Recruiting applications |
| People | Users, Import Players, Roles, Fees & Payments |
| Finance | League Finance |
| Communications | Email, Team Coaches, Email Config, SMS (Twilio), GroupMe |
| Content | Documents, Welcome Message, News, Gallery, YouTube |
| Settings | Website Design, API Keys, Cloud Storage, Database, Data Cleanup |

---

## API Endpoints Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Login | POST | `/api/users/login` |
| Google Auth | GET | `/api/auth/google` |
| Get Dashboard Data | GET | `/api/dashboard-data` |
| Get Teams | GET | `/api/teams` |
| Save Teams | POST | `/api/league-data/teams` |
| Get Events | GET | `/api/unified-events` |
| Get News | GET | `/api/league-data/newsItems` |
| Save News | POST | `/api/league-data/newsItems` |
| Delete News Item | DELETE | `/api/league-data/newsItems/{id}` |
| Get Seasons | GET | `/api/league-data/seasons` |
| Save Seasons | POST | `/api/league-data/seasons` |
| Get Schedule | GET | `/api/league-schedule` |
| Save Schedule | POST | `/api/league-data/leagueSchedule` |
| Team Players | GET | `/api/team/{id}/players` |
| Team News | GET | `/api/team/{id}/news` |
| RSVP | POST | `/api/rsvp/{event-id}` |
| Magic Link RSVP | GET | `/api/rsvp/{event-id}?response=yes&user={id}` |
| Recruiting | GET/POST | `/api/recruiting/applications` |
| File Manager | GET | `/api/files/{provider}` |

---

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Not authenticated | Log in again |
| 403 | Not authorized | Check permissions |
| 404 | Not found | Check URL/ID |
| 500 | Server error | Try again, contact admin |

---

## Support Contacts

| Issue | Contact |
|-------|---------|
| Login problems | League Admin |
| Score corrections | League Admin |
| Roster changes | Team Coach |
| Payment issues | League Admin |
| System errors | System Administrator |

---

## Emergency Procedures

**Lock compromised account:**
1. Admin → Users → Find user
2. Set status to "Inactive"

**Reset user password:**
1. Admin → Users → Find user
2. Click "Send Password Reset"

**Cancel event urgently:**
1. Open event
2. Change status to "Cancelled"
3. Send notification

---

*Keep this card handy! (v2.0)*
