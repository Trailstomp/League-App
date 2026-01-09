# 👑 Admin User Guide

## Your Role
As an **Admin**, you have complete control over the league management system. You can manage all users, teams, events, and system settings.

---

## Quick Start Checklist
- [ ] Configure league branding (logo, colors)
- [ ] Set up teams and divisions
- [ ] Import or create player accounts
- [ ] Configure email/SMS settings
- [ ] Set up payment processing (if needed)
- [ ] Create initial events

---

## Daily Tasks

### Monitor Dashboard
- Check new user registrations
- Review pending RSVPs
- Monitor upcoming events
- Check payment status

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
- Post news/announcements
- Update photo galleries
- Review event calendar

### Communication
- Send league-wide announcements
- Follow up on unpaid fees
- Respond to user inquiries

---

## Key Features You Control

### Website Styling
**Access:** Admin Portal → Website Design

```
Header/Navigation Colors
Ticker Speed and Filters  
Logo and Branding
Page Backgrounds
Font Settings
```

### Ticker Configuration
**Access:** Admin Portal → Website Design → Ticker Settings

- **Look-back days**: How many past days to show events (e.g., 7 days shows last week's results)
- **Look-forward days**: Future events to display (e.g., 30 days)
- **Show cancelled**: Toggle visibility of cancelled events
- **Event type filters**: Choose which types appear (games, practices, etc.)

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
**Access:** Admin Portal → Database

- View collection statistics
- Clear cache if issues arise
- Export data for backup

### User Audit
- Periodically review user list
- Remove duplicate accounts
- Verify role assignments

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
