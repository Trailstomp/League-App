# 👑 Admin User Guide

## Your Role
As an **Admin**, you have complete control over the league management system. You can manage all users, teams, events, and system settings.

---

## Quick Start Checklist
- [ ] Configure league branding (logo, colors, design template)
- [ ] Set up teams and divisions
- [ ] Import or create player accounts
- [ ] Configure email/SMS settings
- [ ] Set up payment processing (if needed)
- [ ] Create initial events
- [ ] Configure recruiting portal (Join Us page)
- [ ] Set up file storage (Google Drive or OneDrive)

---

## Daily Tasks

### Monitor Dashboard
The Admin Dashboard overview cards are **clickable** - click any stat to jump directly to that management section:

- **Total Teams** - Click to go to Team Manager
- **Total Players** - Click to go to User Manager
- **Active Users** - Click to go to User Manager
- **Pending Users** - Click to go to User Manager

**Quick Actions** on the dashboard:
- **Add New Team** - Jump to Team Manager
- **Add New Player** - Jump to Player Importer
- **Export Data** - Jump to Database Admin

Also check:
- New user registrations and pending approvals
- Review pending RSVPs
- Monitor upcoming events
- Check payment status
- Review notification bell for new alerts

### User Management
**Access:** Admin Portal → Users

| Action | How To |
|--------|--------|
| Approve new user | Click user → Set status to "Active" |
| Change role | Click user → Select new role from dropdown |
| Reset password | Click user → "Send Password Reset Link" |
| Deactivate user | Click user → Set status to "Inactive" |

### Event Management
**Access:** Admin Portal → Events

- Create games by selecting two teams
- Set RSVP requirements
- Enable live scoring for games
- Monitor attendance via RSVP responses

---

## Weekly Tasks

### Roster Review
- Check team rosters for accuracy
- Update player positions/numbers
- Remove inactive players

### Content Updates
- Post news/announcements (square image format supported)
- Update photo galleries
- Review event calendar
- Manage documents in File Manager

### Communication
- Send league-wide announcements via Email Composer
- Follow up on unpaid fees
- Respond to user inquiries
- Check GroupMe channel status

---

## Key Features You Control

### Website Styling & Theming
**Access:** Admin Portal → Settings → Website Design

```
Header/Navigation Colors
Ticker Speed and Filters  
Logo and Branding (dynamic favicon with auto-refresh)
Page Backgrounds
Font Settings
Input Text Color, Secondary Text Color, Accent Color
Design Template Cycling (random, daily)
PWA Manifest (auto-generated from league logo)
```

### Ticker Configuration
**Access:** Admin Portal → Settings → Website Design → Ticker Settings

- **Look-back days**: How many past days to show events (e.g., 7 days shows last week's results)
- **Look-forward days**: Future events to display (e.g., 30 days)
- **Show cancelled**: Toggle visibility of cancelled events
- **Event type filters**: Choose which types appear (games, practices, etc.)
- **Mobile Ticker**: Compact ESPN-style strip automatically shown on mobile devices

### News Management
**Access:** Admin Portal → Content → News

- **Add News Item**: Click "Add News Item" button
- **Image Format**: Square (1:1) crop for news images
- **Delete Items**: Click the trash icon on any news item to remove it
- **Live Preview**: See how your news appears in the scrolling ticker
- **Expiration Dates**: Set auto-expiry for time-sensitive announcements

### File Manager / Documents
**Access:** Admin Portal → Content → Documents

- **Dual Provider Support**: Google Drive and OneDrive/Office 365
- **File Browser**: Navigate folders, upload, download, create, and delete files
- **Team Documents**: Teams can use the league connection or their own storage
- **Setup**: Configure cloud storage credentials in Settings → Cloud Storage

### Email Composer
**Access:** Admin Portal → Communications → Email

- **Rich Editor**: Compose formatted emails with the built-in editor
- **Recipients**: Select individual users, teams, or league-wide
- **Team SMTP**: Each team can configure their own SMTP settings
- **History**: View sent email history

### Recruiting & Join Us Portal
**Access:** Admin Portal → Recruiting

- **Applications**: Review team registration, player, and volunteer applications
- **Auto-Approve**: Approving an application automatically creates the team/player account
- **Team Invitations**: Proactively invite teams via email or SMS
- **Public Portal**: The "Join Us" page is visible to all visitors on the homepage

### Bulk Operations

#### Player Import
1. Go to Admin Portal → Player Importer
2. Format your data:
   ```
   Name, Email, Team, Position, Jersey#
   John Smith, john@email.com, Lions, Attack, 22
   Jane Doe, jane@email.com, Eagles, Defense, 15
   ```
3. Paste or upload
4. Map columns
5. Import with password reset links

#### Bulk Email
1. Select users from Users list
2. Click "Send Email"
3. Compose message
4. Send

---

## System Maintenance

### Database Health
**Access:** Admin Portal → Settings → Database

- View collection statistics
- Monitor data health with the Database Health widget
- Clear cache if issues arise
- Export data for backup
- Run data cleanup utilities

### User Audit
- Periodically review user list
- Remove duplicate accounts
- Verify role assignments
- Use Data Cleanup Manager to find orphaned records

### Account Settings
- Users can manage their own accounts via Account Settings
- Set password flow for users who signed up via Google OAuth
- Notification preferences

### Payment Reconciliation
- Match Stripe/PayPal records
- Follow up on failed payments
- Issue refunds if needed

---

## Troubleshooting

### "User can't log in"
1. Check account status (must be "Active")
2. Verify email address is correct
3. Send password reset link
4. Check for duplicate accounts

### "Events not showing in ticker"
1. Check ticker date range settings
2. Verify event has a valid date
3. Check event type filters
4. Ensure event isn't set to "Cancelled"

### "Emails not sending"
1. Verify SMTP settings
2. For Gmail: ensure using App Password
3. Check email template formatting
4. Review server logs for errors

### "Images not loading"
1. Check URL is accessible
2. For Google Drive: ensure sharing is "Anyone with link"
3. Try converting to direct URL
4. Check file format (JPG, PNG, WebP supported)

### "News item can't be deleted"
1. Go to Admin Portal → Content → News
2. Click the trash icon next to the item
3. Confirm deletion in the popup
4. The item is removed from the database immediately

### "Favicon not updating"
- The system uses cache-busting (appends a timestamp to the logo URL)
- Try a hard refresh (Ctrl+Shift+R) if the old favicon persists
- The favicon automatically updates when you change the league logo

---

## Pro Tips

💡 **Set up a test team** - Create a "Test Team" to try new features before rolling out

💡 **Use divisions** - Organize teams by skill level, age group, or geographic area

💡 **Schedule in advance** - Enter the entire season schedule upfront

💡 **Delegate to coaches** - Give coaches Team Admin access to manage their rosters

💡 **Regular backups** - Export user and team data periodically

💡 **Watch the ticker** - It's the first thing visitors see, keep it current!

---

## Emergency Procedures

### Lock out a user immediately
1. Admin Portal → Users → Find user
2. Set Status to "Inactive"
3. They cannot log in until reactivated

### Reset all user sessions
1. Admin Portal → Database
2. Clear session cache
3. All users must log in again

### Restore deleted data
- Contact system administrator
- Data may be recoverable from backups

---

*You're the backbone of this league. Thank you for your work!*
