# How to Run SQL Migrations - 3 Methods

## Error: "Failed to fetch (api.supabase.com)"

This error means Supabase SQL Editor can't connect. Here are 3 solutions:

---

## ✅ Method 1: Supabase Web Dashboard (Simplest)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar

### Step 2: Run Each Migration File

**Copy and paste each file in order:**

#### Migration 1: Contractor Geocoding
1. Click **"New Query"**
2. Open file: `supabase/migrations/20251018000001_add_contractor_geocoding.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **"Run"** (or press Cmd+Enter)
6. Wait for success message ✅

#### Migration 2: RushrMap Updates
1. Click **"New Query"**
2. Open file: `supabase/migrations/20251018000002_rushrmap_updates.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for success message ✅

#### Migration 3: Stripe Escrow System
1. Click **"New Query"**
2. Open file: `supabase/migrations/20251018000003_stripe_escrow_system.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for success message ✅

#### Test Data (Optional)
1. Click **"New Query"**
2. Open file: `test-contractors-with-addresses.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for success message ✅

### If you get "Failed to fetch" error:
- **Refresh the page** (Cmd+Shift+R)
- **Check internet connection**
- **Try again in a few minutes** (Supabase API might be temporarily down)
- Or use Method 2 or 3 below

---

## ✅ Method 2: Supabase CLI (Recommended for Reliability)

### Step 1: Install Supabase CLI
```bash
# Install via Homebrew
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
cd /Users/x/Downloads/rushr-main
supabase link --project-ref YOUR_PROJECT_REF
```

**Get YOUR_PROJECT_REF:**
- Go to Supabase Dashboard → Settings → General
- Copy "Reference ID" (looks like: `abcdefghijklmnop`)

### Step 4: Run Migrations
```bash
# Apply all migrations in /supabase/migrations folder
supabase db push

# Or run individually
supabase db execute -f supabase/migrations/20251018000001_add_contractor_geocoding.sql
supabase db execute -f supabase/migrations/20251018000002_rushrmap_updates.sql
supabase db execute -f supabase/migrations/20251018000003_stripe_escrow_system.sql
```

### Step 5: Insert Test Data
```bash
supabase db execute -f test-contractors-with-addresses.sql
```

---

## ✅ Method 3: Direct PostgreSQL Connection

If Supabase web and CLI both fail, connect directly to PostgreSQL.

### Step 1: Get Database Connection String
1. Go to Supabase Dashboard → Settings → Database
2. Copy "Connection string" (URI format)
3. Replace `[YOUR-PASSWORD]` with your database password

### Step 2: Install PostgreSQL Client
```bash
brew install postgresql
```

### Step 3: Connect and Run Migrations
```bash
# Connect to database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Inside psql, run each file
\i /Users/x/Downloads/rushr-main/supabase/migrations/20251018000001_add_contractor_geocoding.sql
\i /Users/x/Downloads/rushr-main/supabase/migrations/20251018000002_rushrmap_updates.sql
\i /Users/x/Downloads/rushr-main/supabase/migrations/20251018000003_stripe_escrow_system.sql
\i /Users/x/Downloads/rushr-main/test-contractors-with-addresses.sql

# Exit
\q
```

---

## 🔍 How to Verify Migrations Ran Successfully

### Check in Supabase Dashboard

**Method 1: Table Editor**
1. Go to Supabase Dashboard → Table Editor
2. You should see these NEW tables:
   - ✅ `payment_holds`
   - ✅ `transactions`
   - ✅ `notifications`
   - ✅ `stripe_customers`
   - ✅ `stripe_connect_accounts`

**Method 2: SQL Query**
Run this in SQL Editor:
```sql
-- Check if new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'payment_holds',
    'transactions',
    'notifications',
    'stripe_customers',
    'stripe_connect_accounts'
  )
ORDER BY table_name;
```

**Expected Output:**
```
notifications
payment_holds
stripe_connect_accounts
stripe_customers
transactions
```

**Method 3: Check New Columns**
```sql
-- Check homeowner_jobs has new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'homeowner_jobs'
  AND column_name IN ('expires_at', 'urgency', 'location_zip', 'payment_status', 'payment_hold_id');

-- Check contractor_profiles has geocoding columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'contractor_profiles'
  AND column_name IN ('address', 'latitude', 'longitude');
```

---

## 📋 Migration Checklist

- [ ] Migration 1: `20251018000001_add_contractor_geocoding.sql` ✅
- [ ] Migration 2: `20251018000002_rushrmap_updates.sql` ✅
- [ ] Migration 3: `20251018000003_stripe_escrow_system.sql` ✅
- [ ] Test Data: `test-contractors-with-addresses.sql` ✅ (optional)

**Verification:**
- [ ] New tables created: `payment_holds`, `transactions`, `notifications`, `stripe_customers`, `stripe_connect_accounts`
- [ ] `homeowner_jobs` has new columns: `expires_at`, `urgency`, `payment_status`
- [ ] `contractor_profiles` has: `latitude`, `longitude`, `address`
- [ ] Test contractors inserted (7 NYC contractors with GPS coordinates)

---

## ❌ Troubleshooting Common Errors

### Error: "relation does not exist"
**Cause:** Previous migration didn't run successfully
**Fix:** Run migrations in order (1, 2, 3)

### Error: "column already exists"
**Cause:** Migration already ran
**Fix:** Skip this migration, it's already applied

### Error: "could not connect to server"
**Cause:** Database connection issue
**Fix:**
1. Check Supabase project is running (not paused)
2. Check internet connection
3. Try again in a few minutes

### Error: "permission denied"
**Cause:** Using wrong database credentials
**Fix:** Use Service Role key or database password, not Anon key

### Error: "conversations.job_id cannot be cast to UUID"
**Cause:** Existing conversations have invalid job_id values
**Fix:** Migration already handles this - it sets invalid ones to NULL first

---

## 🎯 Quick Start (TL;DR)

**Fastest method:**
1. Open Supabase Dashboard → SQL Editor
2. Copy/paste `20251018000001_add_contractor_geocoding.sql` → Run ✅
3. Copy/paste `20251018000002_rushrmap_updates.sql` → Run ✅
4. Copy/paste `20251018000003_stripe_escrow_system.sql` → Run ✅
5. Copy/paste `test-contractors-with-addresses.sql` → Run ✅

**Verify:**
- Check Table Editor → See new tables: `payment_holds`, `transactions`, etc.

**Done!** 🎉
