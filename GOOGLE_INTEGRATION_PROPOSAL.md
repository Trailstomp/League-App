# 🎯 Google-Powered Event Communication & RSVP System

## Executive Summary

**GREAT NEWS!** Since you already have Google OAuth integration (for Drive), we can leverage Google's entire ecosystem for FREE, professional event management with RSVP. This is significantly better than GroupMe or paid SMS services.

## ✅ Why Google Integration is PERFECT for You

### **What You Already Have:**
- ✅ Google OAuth 2.0 setup (clientId, clientSecret, refreshToken)
- ✅ Token refresh system in `server.py`
- ✅ `google-api-python-client` library installed
- ✅ Existing event and RSVP infrastructure

### **What We Can Add (Minimal Work):**
1. **Google Calendar API** - Send calendar invites with built-in RSVP
2. **Gmail API** - Send rich HTML email notifications
3. **Google Meet** - Auto-create video links for virtual events
4. **Google Contacts** - Sync user emails/data

### **Cost: $0** ✨
No Twilio, no SendGrid, no monthly fees!

---

## 🎯 Proposed Solution: Google-Native Event System

### **Architecture Overview**

```
Event Created/Updated
    ↓
Backend FastAPI Service
    ↓
┌──────────────────────────────────────┐
│  Google Calendar API                 │
│  - Creates calendar event            │
│  - Adds attendees (with emails)      │
│  - Sends invites automatically       │
│  - RSVP responses tracked            │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  Gmail API                           │
│  - Sends rich HTML email summary     │
│  - Includes event details            │
│  - Links to web RSVP                 │
│  - Links to calendar event           │
└──────────────────────────────────────┘
    ↓
User receives:
  1. Calendar invite (with RSVP buttons)
  2. Email notification (with links)
  3. Calendar reminder (24h, 1h before)
```

---

## 📋 Feature Breakdown

### **1. Google Calendar Integration** 🗓️

**What Users Get:**
- Calendar invite sent to their email
- Event automatically added to their Google Calendar
- RSVP buttons: "Yes", "No", "Maybe"
- Automatic reminders (24h, 1h before)
- Event updates pushed automatically
- Location with Google Maps integration
- Video call link (Google Meet) for virtual events

**Technical Implementation:**
```python
# Create event with RSVP
event = {
    'summary': 'Lions vs Eagles - Game Night',
    'location': 'Central Stadium',
    'description': 'Division championship game',
    'start': {
        'dateTime': '2025-01-15T19:00:00-05:00',
        'timeZone': 'America/New_York',
    },
    'end': {
        'dateTime': '2025-01-15T21:00:00-05:00',
        'timeZone': 'America/New_York',
    },
    'attendees': [
        {'email': 'player1@example.com'},
        {'email': 'coach@example.com'},
        {'email': 'parent@example.com'}
    ],
    'reminders': {
        'useDefault': False,
        'overrides': [
            {'method': 'email', 'minutes': 24 * 60},
            {'method': 'popup', 'minutes': 60}
        ],
    },
    'sendUpdates': 'all',  # Auto-send invites
    'conferenceData': {  # Auto-create Google Meet link
        'createRequest': {
            'requestId': 'random-string',
            'conferenceSolutionKey': {'type': 'hangoutsMeet'}
        }
    }
}

# Send via Calendar API
service.events().insert(
    calendarId='primary',
    body=event,
    sendUpdates='all',
    conferenceDataVersion=1
).execute()
```

**User Experience:**
1. User receives calendar invite email
2. Clicks "Yes", "No", or "Maybe"
3. Response syncs to Google Calendar
4. Your app can query responses via API
5. Event appears in their calendar app (phone, desktop, web)

---

### **2. Gmail API Integration** 📧

**What Users Get:**
- Professional HTML email from your league
- Event details with team logos
- One-click "Add to Calendar" button
- RSVP link to web form
- Rich formatting and images
- Thread conversation for updates

**Email Template Features:**
```html
Subject: [Your League] Game Reminder: Lions vs Eagles

<beautiful HTML email>
  - Event banner with team logos
  - Date, time, location
  - Weather forecast (optional)
  - Directions link (Google Maps)
  - RSVP buttons (Yes/No/Maybe)
  - Add to Calendar button
  - View roster/details link
</beautiful email>
```

**Technical Implementation:**
```python
from email.message import EmailMessage
import base64

def send_event_email(to_email, event_details):
    message = EmailMessage()
    message['To'] = to_email
    message['From'] = 'notifications@yourleague.com'
    message['Subject'] = f'[League] {event_details["title"]}'
    
    # Rich HTML body
    html_content = render_event_email_template(event_details)
    message.add_alternative(html_content, subtype='html')
    
    # Send via Gmail API
    encoded = base64.urlsafe_b64encode(message.as_bytes()).decode()
    gmail_service.users().messages().send(
        userId='me',
        body={'raw': encoded}
    ).execute()
```

---

### **3. RSVP Tracking & Sync** ✅

**How it Works:**
1. **Google Calendar RSVP** (Primary Method)
   - User RSVPs via calendar invite
   - Your app polls Calendar API for responses
   - Updates local database

2. **Web RSVP** (Fallback)
   - User clicks link in email
   - Opens existing EventRSVP component
   - Syncs back to Google Calendar

3. **Unified Dashboard**
   - See all RSVPs in one place
   - Track "Going", "Maybe", "Not Going"
   - Send reminders to non-responders

**API Polling:**
```python
# Get RSVP responses from Google Calendar
event = calendar_service.events().get(
    calendarId='primary',
    eventId=event_id
).execute()

for attendee in event['attendees']:
    status = attendee['responseStatus']
    # 'accepted', 'declined', 'tentative', 'needsAction'
    
    # Update local database
    await update_rsvp(attendee['email'], status)
```

---

### **4. Google Meet Integration** 📹

**For Virtual/Hybrid Events:**
- Auto-create Google Meet link
- Include in calendar invite
- Participants join with one click
- No Zoom subscription needed!

---

## 🎯 Implementation Plan

### **Phase 1: Google Calendar Integration** (Day 1)
**Tasks:**
1. Extend OAuth scope to include Calendar API
2. Create `GoogleCalendarService` class
3. Add endpoint: `POST /api/events/{event_id}/send-calendar-invite`
4. Test calendar creation + RSVP
5. Add RSVP sync job (polls Calendar API every 30 minutes)

**Files to Modify:**
- `/app/backend/server.py` - Add Calendar service
- New: `/app/backend/services/google_calendar.py`
- New: `/app/backend/services/google_auth.py` (refactor existing)

**Time: 4-6 hours**

---

### **Phase 2: Gmail Notifications** (Day 1-2)
**Tasks:**
1. Extend OAuth scope for Gmail API
2. Create email templates (HTML)
3. Add endpoint: `POST /api/events/{event_id}/send-email-notification`
4. Create rich HTML email builder
5. Test email delivery

**Files to Create:**
- `/app/backend/services/gmail_service.py`
- `/app/backend/templates/event_notification.html`
- `/app/backend/templates/event_reminder.html`

**Time: 4-6 hours**

---

### **Phase 3: User Preferences & UI** (Day 2)
**Tasks:**
1. Create user preferences page
2. Toggle email/calendar notifications
3. Email address field (if not exists)
4. Notification frequency settings
5. Test user preference respect

**Files to Create:**
- `/app/frontend/src/components/UserNotificationPreferences.js`
- `/app/frontend/src/pages/UserSettingsPage.js`

**Time: 3-4 hours**

---

### **Phase 4: RSVP Sync & Dashboard** (Day 2-3)
**Tasks:**
1. Background job to sync RSVPs from Google Calendar
2. Admin dashboard showing RSVP status
3. Reminder automation for non-responders
4. RSVP analytics

**Files to Modify:**
- `/app/backend/server.py` - Add sync job
- `/app/frontend/src/components/EventRSVPViewer.js` - Enhance

**Time: 3-4 hours**

---

### **Phase 5: Google Meet Integration** (Optional, Day 3)
**Tasks:**
1. Auto-create Meet links for virtual events
2. Add toggle in event creation
3. Include in calendar invites

**Time: 2 hours**

---

## 🔧 Technical Requirements

### **Google API Scopes Needed:**
```python
SCOPES = [
    'https://www.googleapis.com/auth/drive.file',  # Already have
    'https://www.googleapis.com/auth/calendar.events',  # NEW
    'https://www.googleapis.com/auth/gmail.send',  # NEW
]
```

### **Dependencies (Already Installed):**
- ✅ `google-api-python-client`
- ✅ `google-auth-httplib2`
- ✅ `google-auth-oauthlib`

### **New Backend Routes:**
```
POST   /api/events/{event_id}/send-calendar-invite
POST   /api/events/{event_id}/send-email-notification
GET    /api/events/{event_id}/rsvp-status
POST   /api/events/{event_id}/sync-rsvps
GET    /api/users/{user_id}/notification-preferences
POST   /api/users/{user_id}/notification-preferences
```

### **Database Collections:**
```javascript
// user_preferences (already exists, extend)
{
  user_id: "uuid",
  email: "user@example.com",
  notifications: {
    calendar_invites: true,
    email_notifications: true,
    reminder_24h: true,
    reminder_1h: true
  }
}

// google_calendar_events (new)
{
  event_id: "league_event_id",
  google_event_id: "google_calendar_event_id",
  attendees: [
    {email: "user@example.com", responseStatus: "accepted"},
    {email: "user2@example.com", responseStatus: "needsAction"}
  ],
  last_synced: "2025-01-15T10:00:00Z"
}
```

---

## 📊 Comparison: Google vs Alternatives

| Feature | Google Suite | Twilio SMS | SendGrid Email | GroupMe |
|---------|-------------|------------|----------------|---------|
| **Cost** | FREE | ~$0.0079/msg | $20/mo | FREE |
| **Calendar Invites** | ✅ Native | ❌ | ✅ Attachment | ❌ |
| **RSVP Built-in** | ✅ Yes | ❌ | ❌ | ❌ |
| **Rich Emails** | ✅ HTML | ❌ | ✅ HTML | ❌ |
| **Mobile Integration** | ✅ Perfect | ✅ SMS | ⚠️ App needed | ⚠️ App needed |
| **Professional Look** | ✅✅✅ | ⚠️ Text only | ✅✅ | ⚠️ Casual |
| **Auto-Reminders** | ✅ Built-in | ❌ Custom | ❌ Custom | ❌ |
| **Video Calls** | ✅ Meet | ❌ | ❌ | ❌ |
| **Setup Complexity** | ⚠️ OAuth | ⚠️ API Keys | ⚠️ API Keys | ⚠️ API Keys |
| **Existing Integration** | ✅ Already have | ❌ | ❌ | ✅ Have |

**Winner:** Google Suite (by far!)

---

## 🚀 Next Steps

### **What You Need to Do:**

1. **Authorize Additional Scopes**
   - Go to Google Cloud Console
   - Add Calendar and Gmail API scopes to your OAuth consent screen
   - Re-authorize the app to get new tokens

2. **User Email Collection** (If not already collected)
   - Add email field to user profiles
   - Prompt users to add email during registration/first login
   - Allow editing in profile settings

3. **Decision: Email Sending Address**
   - Option A: Use your personal Gmail (simpler)
   - Option B: Use Google Workspace email (more professional)
   - Example: `notifications@yourleaguedomain.com`

4. **Test Users**
   - Provide 2-3 test email addresses
   - We'll send test invites to verify

### **Questions for You:**

1. **Email Sending:**
   - Do you have a Google Workspace account? (e.g., admin@yourleague.com)
   - Or should we use a personal Gmail account?
   - Preferred sending name? (e.g., "Midwest Lacrosse League")

2. **Calendar:**
   - Should events be created on YOUR calendar (and shared)?
   - Or should we create a shared league calendar?
   - Time zone preference?

3. **User Data:**
   - Do users already have email addresses in their profiles?
   - Should we make email required for RSVP?
   - Privacy: Opt-in or opt-out for notifications?

4. **Event Types:**
   - Should ALL events send calendar invites?
   - Or only certain types (games, tournaments)?
   - Different templates for different event types?

5. **Immediate Start?**
   - Can you authorize Calendar + Gmail scopes today?
   - Want me to implement Phase 1 immediately?

---

## 📈 Expected Benefits

### **For Users:**
- ✅ Professional calendar invites
- ✅ Automatic reminders
- ✅ One-click RSVP
- ✅ Events in their personal calendar
- ✅ No extra apps needed
- ✅ Google Meet for virtual events

### **For You (Admin):**
- ✅ Real-time RSVP tracking
- ✅ Automated notifications
- ✅ Professional appearance
- ✅ Zero monthly costs
- ✅ Leverage existing Google integration
- ✅ Better attendance rates

### **vs GroupMe:**
- ✅ Professional (not casual chat)
- ✅ Built-in RSVP (not manual tracking)
- ✅ Calendar integration (not just messages)
- ✅ Structured (not cluttered chat)

---

## 💡 My Recommendation

**Build the Google-native system!**

**Why:**
1. You already have 80% of the infrastructure
2. FREE forever (no ongoing costs)
3. More professional than GroupMe
4. Better RSVP tracking than any alternative
5. Users already use Google Calendar/Gmail
6. Can add SMS/other channels later if needed

**Timeline:**
- Phase 1-2: 2 days (Calendar + Email)
- Phase 3-4: 1 day (Preferences + RSVP sync)
- Total: 3 days to fully replace GroupMe

**Let me know if you want to proceed, and I'll start with Phase 1 immediately!** 🚀
