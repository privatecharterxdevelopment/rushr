# Critical Fixes Applied - Contractor Onboarding & Logout

## Issues Fixed

### 1. Contractor Onboarding Not Redirecting to Stripe
**Problem:** Contractors completed wizard but never got sent to Stripe for IBAN/bank account setup
**Root Cause:** Wizard created Stripe account but didn't redirect to Stripe hosted onboarding
**Fix:** [app/pro/wizard/page.tsx](app/pro/wizard/page.tsx#L358-L413)
- After Stripe account creation, now calls `/api/stripe/connect/onboarding-link`
- Redirects contractor to Stripe hosted onboarding URL
- Fallback to dashboard if Stripe fails

### 2. Homeowner Logout Broken
**Problem:** Homeowners couldn't logout properly
**Root Cause:** Database trigger created `user_profiles` entries for contractors, causing role detection confusion
**Fix:** [pro-contractor-clean.sql](pro-contractor-clean.sql#L403-L434)
- Modified `handle_new_user()` trigger to skip contractors entirely
- Contractors now ONLY exist in `pro_contractors` table
- Homeowners ONLY exist in `user_profiles` table

### 3. Contractor Redirected to Wrong Dashboard
**Problem:** After wizard, contractors sometimes saw homeowner dashboard
**Root Cause:** Dashboard only checked `user_profiles` table (homeowner context)
**Fix:** [app/dashboard/page.tsx](app/dashboard/page.tsx#L1-L40)
- Added `useProAuth()` context to check `pro_contractors` table
- Now checks contractor profile FIRST, then homeowner profile
- Proper routing based on which table has the user's profile

## Database Schema Clarity

### Correct Table Usage
- **Homeowners:** ONLY in `user_profiles` table
- **Contractors:** ONLY in `pro_contractors` table
- **Never both** - each user should exist in ONE profile table only

### Role Detection
The ONLY reliable way to detect user role:
```typescript
// Check pro_contractors table existence
const { data: contractor } = await supabase
  .from('pro_contractors')
  .select('id')
  .eq('id', userId)
  .maybeSingle()

if (contractor) {
  // User is CONTRACTOR
} else {
  // User is HOMEOWNER
}
```

## Files Modified

1. **[pro-contractor-clean.sql](pro-contractor-clean.sql)** - Fixed database trigger
2. **[app/pro/wizard/page.tsx](app/pro/wizard/page.tsx)** - Added Stripe onboarding redirect
3. **[app/dashboard/page.tsx](app/dashboard/page.tsx)** - Fixed dashboard routing
4. **[fix-contractor-data.sql](fix-contractor-data.sql)** - Cleanup script for existing bad data

## Database Updates Required

### Step 1: Update the trigger function
Run the updated `handle_new_user()` function from [pro-contractor-clean.sql](pro-contractor-clean.sql#L403-L434) in your Supabase SQL editor.

### Step 2: Clean up existing data
Run [fix-contractor-data.sql](fix-contractor-data.sql) to remove `user_profiles` entries for existing contractors.

## Expected Flow After Fixes

### Contractor Onboarding
1. Fill out wizard → Submit
2. Creates `pro_contractors` entry (NOT `user_profiles`)
3. Creates Stripe Connect account
4. **Redirects to Stripe for IBAN/KYC setup** ← NEW
5. After Stripe completion → Redirects to contractor dashboard
6. Dashboard shows "pending approval" status

### Homeowner Logout
1. Click logout in dropdown
2. UserDropdown checks `contractorProfile` existence
3. Since homeowner has no `contractorProfile`, uses `homeownerSignOut`
4. Clears session and redirects to `/`

### Dashboard Routing
1. User lands on `/dashboard`
2. Checks `pro_contractors` table first
3. If found → `/dashboard/contractor`
4. Else checks `user_profiles` table
5. If found → `/dashboard/homeowner`
6. Else → Shows manual chooser

## Testing Checklist

- [ ] New contractor signup → redirects to Stripe
- [ ] Stripe completion → redirects to contractor dashboard
- [ ] Homeowner logout works
- [ ] Contractor logout works
- [ ] Dashboard routing correct for contractors
- [ ] Dashboard routing correct for homeowners
- [ ] No `user_profiles` entries for contractors
- [ ] All homeowners still in `user_profiles`
