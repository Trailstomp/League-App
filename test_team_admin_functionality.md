# Team Admin Website Settings - Manual Test Case

## ✅ **BUG FIXED: Team Admin Access to Website Settings Restored**

### **Issue Reported**
User reported: "lost the teams admin of editing the website settings again too. i feel like we lost a version somewhere"

### **Root Cause Identified** 
Team management tabs (Team Style, Manage Players, Manage Calendar) were missing from the TeamDetailPage component. These tabs were previously available to team coaches/admins but got removed during development.

### **Fix Implemented**
1. ✅ Added missing management tabs to TeamDetailPage
2. ✅ Restored 'Team Style', 'Manage Players', and 'Manage Calendar' tabs 
3. ✅ Implemented proper `isAuthorizedToManage` permission checks
4. ✅ TeamStyleManager component integrated with team-specific access control
5. ✅ Management tabs only visible to authorized users

---

## **Manual Testing Instructions**

### **To Test Team Style Management Access:**

1. **Login as Team Coach/Admin**
   - Click "Player & Staff Login"
   - Login as "Coach Chandler (OH10)" or any team coach
   - OR login as "Admin Ali" (super admin)

2. **Navigate to Team Page**
   - Go to "Field Lacrosse" or "Box Lacrosse" 
   - Click on any team (e.g., "OH10 Lacrosse")

3. **Verify Management Tabs Visible**
   - Look for these tabs in the team page:
     - ✅ **"Team Style"** - For customizing team colors, banners, tab visibility
     - ✅ **"Manage Players"** - For player management 
     - ✅ **"Manage Calendar"** - For team calendar view

4. **Test Team Style Functionality**
   - Click on "Team Style" tab
   - Should see TeamStyleManager component with:
     - Team selection dropdown (for admins)
     - Primary color picker
     - Background color settings
     - Banner upload options
     - Tab visibility controls (Roster, Schedule, Media, Social, Contact)
     - Save button

5. **Verify Permissions**
   - Management tabs should ONLY be visible to:
     - Super admins (`admin` role)
     - Team coaches (`coach` role) for their assigned team
     - Player/coaches (`player/coach` role) for their assigned team
   - Guest users should NOT see management tabs

---

## **Expected Results**
✅ Team coaches can access and edit their team's style settings  
✅ Team administrators can customize team colors, banners, and page layout  
✅ Tab visibility controls allow teams to show/hide sections  
✅ All customizations persist correctly (websiteStyle bug was also fixed)  
✅ Management functionality is properly secured with role-based access  

## **Status: ✅ RESOLVED**
Team admin access to website settings has been fully restored. Team coaches and admins can now manage their team's visual appearance and settings through the Team Style tab.