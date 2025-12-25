# Google Calendar & Gmail API Setup - Step-by-Step Walkthrough

## Part 1: Enable the APIs (5 minutes)

### Step 1: Open Google Cloud Console
1. Go to: **https://console.cloud.google.com/**
2. Sign in with your Google Workspace account (`admin@mlbl.org`)

### Step 2: Select Your Project
1. At the top of the page, you'll see a project dropdown (says "Select a project" or shows current project name)
2. Click on it
3. Look for your existing project (might be named "My Project", "MLBL", or similar)
4. **Click on that project name** to select it

### Step 3: Enable Google Calendar API
1. In the left sidebar, click: **APIs & Services → Library**
   - (If you don't see the sidebar, click the ☰ hamburger menu in top-left)
2. You'll see a search box that says "Search for APIs & Services"
3. Type: **"Google Calendar API"**
4. Click on **"Google Calendar API"** in the results
5. Click the big blue **"ENABLE"** button
6. Wait for it to enable (takes a few seconds)
7. You'll see a confirmation page

### Step 4: Enable Gmail API
1. Click the **← back arrow** or go back to: **APIs & Services → Library**
2. In the search box, type: **"Gmail API"**
3. Click on **"Gmail API"** in the results
4. Click the big blue **"ENABLE"** button
5. Wait for it to enable
6. You'll see a confirmation page

### ✅ Checkpoint: Verify APIs are Enabled
1. Go to: **APIs & Services → Enabled APIs & services**
2. You should now see in the list:
   - ✅ Google Drive API (was already there)
   - ✅ Google Calendar API (just enabled)
   - ✅ Gmail API (just enabled)

---

## Part 2: Add Scopes to OAuth (3 minutes)

### Step 5: Go to OAuth Consent Screen
1. In left sidebar: **APIs & Services → OAuth consent screen**
2. You'll see your app's configuration (shows app name, user type, etc.)
3. Click the **"EDIT APP"** button (at the top)

### Step 6: Navigate to Scopes Section
1. You'll see several steps: "OAuth consent screen", "Scopes", "Test users", etc.
2. Click **"Scopes"** in the left sidebar (or click "SAVE AND CONTINUE" until you reach Scopes)

### Step 7: Add New Scopes
1. On the Scopes page, click the **"ADD OR REMOVE SCOPES"** button
2. A panel slides in from the right showing all available scopes
3. In the "Filter" search box at the top, type: **"calendar"**
4. Look for this scope and **check the box** next to it:
   ```
   https://www.googleapis.com/auth/calendar.events
   ```
   - Description: "See, edit, share, and permanently delete all the calendars you can access using Google Calendar"

5. Clear the search box and type: **"gmail"**
6. Look for this scope and **check the box** next to it:
   ```
   https://www.googleapis.com/auth/gmail.send
   ```
   - Description: "Send email on your behalf"

### Step 8: Save Scopes
1. Scroll down in the scopes panel
2. Click **"UPDATE"** button at the bottom
3. You'll see the scopes added to your app
4. You should now see THREE scopes total:
   - ✅ `../auth/drive.file` (existing)
   - ✅ `../auth/calendar.events` (new)
   - ✅ `../auth/gmail.send` (new)

### Step 9: Complete the OAuth Setup
1. Click **"SAVE AND CONTINUE"** button at the bottom
2. On "Test users" page (if shown), click **"SAVE AND CONTINUE"**
3. On "Summary" page, review and click **"BACK TO DASHBOARD"**

### ✅ Checkpoint: Verify Scopes Added
1. You should be back at the OAuth consent screen dashboard
2. Under "Scopes", it should show: **3 scopes** or list them
3. If you see the 3 scopes, you're good!

---

## Part 3: Re-authorize Your App (5 minutes)

Now you need to get a NEW refresh token that includes the new scopes.

### Step 10: Check Your Current Google Drive Config

Let me check if your app has a re-authorization flow built-in. I'll look for the admin interface where you connected Google Drive originally.

**First, let's see what's in your database:**

1. I need to create a simple admin tool to re-authorize

Let me create that for you...

---

## Quick Re-Authorization Tool

I'm going to create a simple page in your app that will:
1. Show you the current Google credentials status
2. Provide a "Re-authorize Google" button
3. Walk you through the OAuth flow
4. Automatically save the new refresh token

Should I create this tool now?

**Option A:** I create the tool (takes 10 minutes)
**Option B:** You manually update the refresh token via Google OAuth Playground (more complex)

I recommend **Option A** - it's cleaner and you can use it in the future if needed.

Let me know and I'll build it!
