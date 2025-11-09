# Database Update Instructions

## Critical: Apply These Changes to Fix Contractor Onboarding & Logout

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

#### Step 1: Update the trigger function
Copy and paste the following SQL:

```sql
-- Function to automatically create user profile when user signs up
-- IMPORTANT: Only creates user_profiles for homeowners, NOT contractors
-- Contractors use pro_contractors table exclusively
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
    -- Skip contractors - they use pro_contractors table only
    IF COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner') = 'contractor' THEN
        RETURN NEW;
    END IF;

    -- Only create user_profiles for homeowners
    INSERT INTO public.user_profiles (id, email, name, role, subscription_type)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        'homeowner',  -- Always homeowner if we got here
        'free'  -- Default to free tier
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, user_profiles.name),
        role = COALESCE(EXCLUDED.role, user_profiles.role),
        subscription_type = COALESCE(EXCLUDED.subscription_type, user_profiles.subscription_type),
        updated_at = NOW();
    RETURN NEW;
END;
$$;
```

Click "Run" and verify it says "Success. No rows returned"

#### Step 2: Clean up existing contractor data
Create a new query and run:

```sql
-- Delete user_profiles entries for users who are contractors
-- Contractors should ONLY exist in pro_contractors table, not user_profiles
DELETE FROM user_profiles
WHERE id IN (
  SELECT id FROM pro_contractors
);
```

Click "Run" and note how many rows were deleted.

#### Step 3: Verify the cleanup
Create a new query and run:

```sql
-- Verify the cleanup
SELECT
  'Contractors in pro_contractors' as description,
  COUNT(*) as count
FROM pro_contractors

UNION ALL

SELECT
  'Contractors accidentally in user_profiles (should be 0)' as description,
  COUNT(*) as count
FROM user_profiles
WHERE id IN (SELECT id FROM pro_contractors)

UNION ALL

SELECT
  'Homeowners in user_profiles' as description,
  COUNT(*) as count
FROM user_profiles
WHERE id NOT IN (SELECT id FROM pro_contractors);
```

Expected results:
- Contractors in pro_contractors: [some number]
- Contractors accidentally in user_profiles: **0** ← Must be zero!
- Homeowners in user_profiles: [some number]

### Option 2: Via Supabase CLI

If you prefer using the CLI and have your connection configured:

```bash
# Update the trigger
npx supabase db execute --file pro-contractor-clean.sql --include-schema public

# Clean up data
npx supabase db execute --file fix-contractor-data.sql
```

## After Database Update

1. **Test contractor onboarding:**
   - Fill out the wizard form completely
   - Submit
   - Should redirect to Stripe for IBAN/bank setup
   - Complete Stripe onboarding
   - Should redirect back to contractor dashboard

2. **Test homeowner logout:**
   - Login as homeowner
   - Click user dropdown
   - Click "Sign Out"
   - Should successfully log out and redirect to home

3. **Verify no duplicate profiles:**
   - Check that contractors don't have entries in `user_profiles`
   - Check that homeowners don't have entries in `pro_contractors`

## Rollback (If Something Goes Wrong)

If you need to rollback the trigger (NOT recommended, but just in case):

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role, subscription_type)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner'),
        CASE
            WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner') = 'contractor' THEN 'pro'
            ELSE 'free'
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, user_profiles.name),
        role = COALESCE(EXCLUDED.role, user_profiles.role),
        subscription_type = CASE
            WHEN EXCLUDED.role = 'contractor' THEN 'pro'
            ELSE COALESCE(EXCLUDED.subscription_type, user_profiles.subscription_type)
        END,
        updated_at = NOW();
    RETURN NEW;
END;
$$;
```

## Questions?

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Check browser console for errors
3. Verify the SQL queries ran successfully
4. Check that the row counts match expectations
