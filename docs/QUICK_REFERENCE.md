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
| RSVP to events | ✅ | ✅ | ✅ | ✅ | ❌ |
| View own stats | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage team roster | ✅ | ✅ | ✅* | ❌ | ❌ |
| Create team events | ✅ | ✅ | ✅* | ❌ | ❌ |
| Live scoring | ✅ | ✅ | ✅* | ❌ | ❌ |
| Team settings | ✅ | ✅ | ✅* | ❌ | ❌ |
| Create league events | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage all teams | ✅ | ✅ | ❌ | ❌ | ❌ |
| User management | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Website styling | ✅ | ❌ | ❌ | ❌ | ❌ |

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
| Admin | `/admin` |
| Live Score | `/live/{game-id}` |
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
| Gallery Photo | 1920x1080 px | PNG, JPG |

---

## API Endpoints Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Login | POST | `/api/users/login` |
| Get Teams | GET | `/api/teams` |
| Get Events | GET | `/api/league-schedule` |
| Team Players | GET | `/api/team/{id}/players` |
| Update Team | PUT | `/api/league-data/teams/{id}` |
| Add Player | POST | `/api/team/{id}/add-player` |
| RSVP | POST | `/api/rsvp/{event-id}` |

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

*Keep this card handy!*
