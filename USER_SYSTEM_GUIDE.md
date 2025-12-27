# User System Architecture Guide

## Overview

The MLBL app uses a **unified user record system** where all users (guests, players, coaches, admins) are stored in one `users` collection.

## User Lifecycle

### Registration Flow:
```
1. User visits /register
2. Fills out form (name, email, password, role, team)
3. Submits:
   - If role = "guest" → Auto-approved, instant access
   - If role = "player" or "coach" → Status = "pending", needs approval
4. Admin reviews in Admin Portal → Users & Security
5. Admin approves → User status = "active", assigned to team
```

### User Status States:
- **guest** - Auto-approved, limited access
- **pending** - Awaiting admin approval
- **active** - Approved and active
- **inactive** - Deactivated by admin

### User Roles:
- **guest** - Can view events, limited RSVP
- **player** - Full player access, team roster
- **coach** - Team management, roster edits
- **admin** - Full system access

## Data Model

```javascript
{
  "id": "user_uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "role": "player",
  "teamId": "lions_01",
  "teamName": "Lions",
  "status": "active",
  "requestedRole": "player",  // What they asked for
  "requestedTeam": "lions_01",  // Team they requested
  "phone": "+1234567890",
  "notificationPreferences": {
    "email": true,
    "sms": false,
    "groupme": true
  },
  "createdAt": "2025-12-26T...",
  "approvedAt": "2025-12-26T...",
  "approvedBy": "admin_user_id"
}
```

## Email Notifications

### How Recipients are Determined:

**For Team Events:**
```python
# Get all active users from event teams
users = db.users.find({
  "teamId": {"$in": event.teams},
  "status": {"$in": ["active", "guest"]},
  "notificationPreferences.email": true
})
```

**For League-Wide Events:**
```python
# Get all active users
users = db.users.find({
  "status": {"$in": ["active", "guest"]},
  "notificationPreferences.email": true
})
```

## Admin Management

### Creating Users (Admin Portal → Users & Security):
1. **Pending Tab** - Review and approve new registrations
2. **Active Tab** - Manage existing users
3. **Create User** - Manually add users (bypass approval)
4. **Edit User** - Change role, team, email
5. **Delete User** - Remove from system

## User Self-Service

### Profile Settings (Future):
- Edit email, phone
- Change notification preferences
- Update password
- View team assignments

## Integration with Other Features

### Events:
- Events filter recipients by team
- Only active/guest users receive notifications
- Users can RSVP via web or email

### Live Scoring:
- Players appear in roster for scoring
- Stats tied to user accounts

### Team Rosters:
- Team pages show user lists
- Filtered by role (players vs coaches)

## Migration Path

### For Existing Installations:
1. Users created from existing team rosters
2. Email addresses migrated
3. All assigned to appropriate teams
4. Status set to "active"

## Security

- Passwords hashed (SHA-256 minimum, bcrypt recommended)
- Email validation on registration
- Admin approval for elevated roles
- Session management for authentication

## API Endpoints

- `POST /api/users/register` - Public registration
- `GET /api/users?status=pending` - Get pending users
- `POST /api/users/{id}/approve` - Approve user
- `POST /api/users/{id}/reject` - Reject user
- `POST /api/users/create` - Admin create user
- `PATCH /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
