# Google OAuth Credentials Setup Guide

## 🎯 Quick Start

### Step 1: Get Your Credentials (5 minutes)

1. Go to: **https://console.cloud.google.com/**
2. Sign in with your Google account (`admin@mlbl.org`)
3. Select project: **"mlbl photo storage"**
4. Click: **APIs & Services → Credentials**
5. Find your **OAuth 2.0 Client ID** in the list
6. Click on the client name
7. Copy:
   - **Client ID** (ends with `.apps.googleusercontent.com`)
   - **Client Secret** (starts with `GOCSPX-`)

### Step 2: Enter in Your App (2 minutes)

1. Go to: **Admin Portal → Google Setup**
2. Paste **Client ID**
3. Paste **Client Secret**
4. (Optional) Add **Folder ID** for photo storage
5. Click **"Save Credentials"**
6. See confirmation: ✅ "Credentials saved!"

### Step 3: Re-Authorize (2 minutes)

1. Go to: **Admin Portal → Google Re-Authorization**
2. Click **"Re-Authorize Google"**
3. Sign in to Google
4. Click **"Allow"** to grant permissions
5. Window closes automatically
6. See: ✅ "Authorization Complete!"

### Step 4: Enable Services (1 minute)

1. Go to: **Admin Portal → Google Integration**
2. Toggle ON:
   - ✅ Google Calendar
   - ✅ Gmail Notifications
   - ✅ GroupMe (optional)
3. Set sender email: `admin@mlbl.org`
4. Click **"Save Settings"**
5. Done!

---

## 📋 What You Need

### From Google Cloud Console:
- ✅ Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)
- ✅ Client Secret (looks like: `GOCSPX-abcd1234efgh5678`)
- ✅ (Optional) Drive Folder ID for photos

### APIs to Enable:
- ✅ Google Drive API
- ✅ Google Calendar API
- ✅ Gmail API

---

## 🔒 Security Notes

- **Client Secret is private** - don't share publicly
- Stored securely in your database
- Only accessible by admins
- Used to generate access tokens
- Can be rotated anytime in Google Cloud Console

---

## 🎓 For League Admins

This setup allows **each league admin** to configure their own Google integration:

1. Each league has their own Google Cloud project
2. Each admin enters their own Client ID/Secret
3. Each admin authorizes with their own Google account
4. Multiple leagues = multiple configurations
5. Complete isolation between leagues

---

## ❓ Troubleshooting

### "Invalid Client ID"
- Make sure you copied the entire ID
- Check for extra spaces
- Verify it ends with `.apps.googleusercontent.com`

### "Invalid Client Secret"
- Make sure you copied the entire secret
- Check for extra spaces
- Verify it starts with `GOCSPX-`

### "Redirect URI Mismatch" (during authorization)
- Go to Google Cloud Console → Credentials
- Click your OAuth client
- Add this to "Authorized redirect URIs":
  - `http://your-backend-url/api/google-reauth/callback`
- Save and try again

### "APIs Not Enabled"
- Go to Google Cloud Console → APIs & Services → Library
- Search and enable:
  - Google Drive API
  - Google Calendar API
  - Gmail API

---

## 🚀 You're All Set!

Once setup is complete:
- Calendar invites sent automatically
- Gmail notifications with rich HTML
- RSVP tracking from Google Calendar
- All for $0/month!
