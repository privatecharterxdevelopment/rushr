# Admin Dashboard - Setup Checklist

## Pre-Deployment Checklist

Follow these steps to get your admin dashboard live:

### Step 1: Database Updates (REQUIRED) ⚠️

- [ ] **Update `handle_new_user()` trigger**
  - Open Supabase Dashboard → SQL Editor
  - Run the SQL from [DATABASE-UPDATE-INSTRUCTIONS.md](DATABASE-UPDATE-INSTRUCTIONS.md) Step 1
  - Verify: "Success. No rows returned"

- [ ] **Clean up existing contractor data**
  - Run the SQL from [DATABASE-UPDATE-INSTRUCTIONS.md](DATABASE-UPDATE-INSTRUCTIONS.md) Step 2
  - Note how many rows deleted
  - Should remove user_profiles entries for contractors

- [ ] **Verify cleanup**
  - Run verification SQL from [DATABASE-UPDATE-INSTRUCTIONS.md](DATABASE-UPDATE-INSTRUCTIONS.md) Step 3
  - Confirm: "Contractors accidentally in user_profiles" = 0

### Step 2: Create Support Messages Table (if needed)

Check if `support_messages` table exists:

```sql
SELECT * FROM support_messages LIMIT 1;
```

If error "relation does not exist":
- [ ] Run the SQL from [ADMIN-DASHBOARD-SUMMARY.md](ADMIN-DASHBOARD-SUMMARY.md) "Create Support Table" section
- [ ] Verify table created
- [ ] Test inserting a message

### Step 3: Verify Admin Access

- [ ] Login as admin user
- [ ] Go to `/dashboard/admin`
- [ ] Should see dashboard (not "Access Denied")
- [ ] Check all navigation links work

**If you get "Access Denied":**

```sql
-- Add admin role to your user
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### Step 4: Test Contractor Approval Flow

- [ ] **As Contractor:**
  - [ ] Fill out wizard completely
  - [ ] Submit application
  - [ ] Redirected to Stripe onboarding
  - [ ] Complete Stripe setup
  - [ ] Land on contractor dashboard
  - [ ] See "Pending Approval" banner

- [ ] **As Admin:**
  - [ ] Go to Contractor Approvals page
  - [ ] See the pending contractor
  - [ ] Click "View Details"
  - [ ] Review profile information
  - [ ] Click "Approve"
  - [ ] Success message appears

- [ ] **As Contractor Again:**
  - [ ] Refresh dashboard
  - [ ] See "Approved!" banner
  - [ ] Can toggle status to "Online"
  - [ ] Profile shows in Find Pro map

### Step 5: Test Support Tickets

- [ ] **As Homeowner:**
  - [ ] Send a support message
  - [ ] Message saved to database

- [ ] **As Admin:**
  - [ ] Go to Support Tickets page
  - [ ] See the new message
  - [ ] Filter shows correct count
  - [ ] Click "Reply"
  - [ ] Type response and send
  - [ ] Status changes to "Responded"

### Step 6: Test Real-time Updates

- [ ] **Open admin dashboard in two browser windows**
  - Window 1: Admin dashboard overview
  - Window 2: Contractor wizard

- [ ] **Submit contractor in Window 2**
- [ ] **Check Window 1:**
  - [ ] "Pending Contractors" count updates automatically
  - [ ] No page refresh needed
  - [ ] See live update indicator

### Step 7: Test All Pages

- [ ] **Overview** (`/dashboard/admin`)
  - [ ] Stats display correctly
  - [ ] Alert banner shows if pending contractors
  - [ ] Can click stat cards to navigate

- [ ] **Contractor Approvals** (`/dashboard/admin/contractors`)
  - [ ] Pending contractors list
  - [ ] Can approve/reject
  - [ ] Detail modal works
  - [ ] Filter works (Pending vs All)

- [ ] **All Contractors** (`/dashboard/admin/contractors/all`)
  - [ ] Table displays
  - [ ] Search works
  - [ ] Stats accurate
  - [ ] Status colors correct

- [ ] **Homeowners** (`/dashboard/admin/homeowners`)
  - [ ] List displays
  - [ ] Search works
  - [ ] Subscription breakdown accurate

- [ ] **Support Tickets** (`/dashboard/admin/support`)
  - [ ] Tickets display
  - [ ] Can reply
  - [ ] Can mark read/closed
  - [ ] Filters work

- [ ] **Settings** (`/dashboard/admin/settings`)
  - [ ] Page loads
  - [ ] Placeholder content shows

### Step 8: Test Mobile Responsiveness

- [ ] Open dashboard on mobile device or resize browser
- [ ] Sidebar collapses to drawer
- [ ] Hamburger menu works
- [ ] All pages readable on mobile
- [ ] Tables scroll horizontally
- [ ] Buttons are touch-friendly

### Step 9: Test Dark Mode

- [ ] Toggle dark mode in app
- [ ] All admin pages render correctly
- [ ] Text is readable
- [ ] Colors look good
- [ ] No white flashes

### Step 10: Security Checks

- [ ] **Test non-admin access:**
  - [ ] Logout
  - [ ] Login as regular homeowner
  - [ ] Try to visit `/dashboard/admin`
  - [ ] Should see "Access Denied"
  - [ ] Cannot access any admin routes

- [ ] **Test Row Level Security:**
  - [ ] Verify admins can read all tables
  - [ ] Verify admins can update contractor status
  - [ ] Verify non-admins cannot

## Post-Deployment Monitoring

### Week 1: Watch for Issues

- [ ] Monitor for 500 errors in logs
- [ ] Check Supabase usage metrics
- [ ] Verify real-time updates working
- [ ] Ensure contractors being approved
- [ ] Check support tickets being answered

### Performance Checks

- [ ] Dashboard loads in < 2 seconds
- [ ] No console errors
- [ ] Real-time updates fire within 1 second
- [ ] Search responds instantly
- [ ] Mobile performance acceptable

## Rollback Plan (If Issues Occur)

If critical issues found:

1. **Restore old admin page:**
   ```bash
   mv app/dashboard/admin/page-old-backup.tsx app/dashboard/admin/page.tsx
   ```

2. **Manually approve contractors via SQL:**
   ```sql
   UPDATE pro_contractors
   SET status = 'approved', kyc_status = 'completed'
   WHERE id = 'contractor-id';
   ```

3. **Fix issues and redeploy**

## Success Criteria

✅ All checklist items completed
✅ No console errors
✅ Admin can approve contractors
✅ Real-time updates work
✅ Mobile responsive
✅ Dark mode works
✅ Non-admins blocked

## Ready to Launch?

If all items checked:

🚀 **DEPLOY TO PRODUCTION**

## Need Help?

- Review: [ADMIN-DASHBOARD-GUIDE.md](ADMIN-DASHBOARD-GUIDE.md)
- Reference: [ADMIN-DASHBOARD-SUMMARY.md](ADMIN-DASHBOARD-SUMMARY.md)
- Database: [DATABASE-UPDATE-INSTRUCTIONS.md](DATABASE-UPDATE-INSTRUCTIONS.md)

---

**Last Updated:** [Current Date]
**Version:** 1.0.0
**Status:** Production Ready ✅
