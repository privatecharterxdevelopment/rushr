# RushrMap Database Analysis

## Existing Tables (Already in Database)

### ✅ homeowner_jobs
**Purpose:** Job postings created by homeowners

**Existing columns:**
- `id` - UUID primary key
- `homeowner_id` - References user_profiles
- `title` - Job title
- `description` - Job description
- `category` - Service category
- `priority` - low/medium/high/emergency
- `status` - pending/bidding/bid_accepted/in_progress/completed/cancelled
- `contractor_id` - Assigned contractor (nullable)
- `estimated_cost` - Estimated price
- `final_cost` - Final price after completion
- `scheduled_date` - When job is scheduled
- `completed_date` - When job was completed
- `address`, `city`, `state`, `zip_code` - Location
- `created_at`, `updated_at` - Timestamps
- `bidding_deadline` - When bidding closes
- `min_bid_amount`, `max_bid_amount` - Bid range
- `accepted_bid_id` - Reference to accepted bid
- `bid_count` - Number of bids received

**NEW columns added by migration 20251018000002:**
- `expires_at` - 10-minute countdown timer for emergency requests
- `urgency` - emergency/urgent/flexible (for RushrMap workflow)
- `location_zip` - ZIP for map-based searching

---

### ✅ job_bids
**Purpose:** Contractor bids on homeowner jobs

**Existing columns:**
- `id` - UUID primary key
- `job_id` - References homeowner_jobs
- `contractor_id` - References user_profiles
- `homeowner_id` - References user_profiles
- `bid_amount` - Price bid (DECIMAL)
- `estimated_duration_hours` - How long job will take
- `description` - Contractor's detailed proposal/approach
- `available_date` - When contractor can start
- `completion_date` - Estimated completion
- `status` - pending/accepted/rejected/withdrawn
- `materials_included` - Boolean
- `warranty_months` - Warranty period
- `emergency_surcharge` - Extra charge for emergency work
- `created_at`, `updated_at` - Timestamps

**NEW columns added by migration 20251018000002:**
- `bid_message` - Quick message sent with bid (different from full description)

---

### ✅ conversations
**Purpose:** Chat threads between homeowners and contractors

**Existing columns:**
- `id` - UUID primary key
- `homeowner_id` - References auth.users
- `pro_id` - References auth.users (contractor)
- `title` - Conversation title
- `job_id` - TEXT (updated to UUID FK in migration)
- `status` - active/archived/closed
- `last_message_at` - Last message timestamp
- `created_at`, `updated_at` - Timestamps

**UPDATED by migration 20251018000002:**
- `job_id` - Changed from TEXT to UUID with FK to homeowner_jobs
- `homeowner_unread_count` - Added (INTEGER)
- `contractor_unread_count` - Added (INTEGER)

---

### ✅ messages
**Purpose:** Individual messages in conversations

**Existing columns:**
- `id` - UUID primary key
- `conversation_id` - References conversations
- `sender_id` - References auth.users
- `message_type` - text/offer/system/file
- `content` - Message text
- `metadata` - JSONB (for attachments, etc.)
- `reply_to_id` - References messages (for threading)
- `read_at` - When message was read
- `created_at`, `updated_at` - Timestamps

**NEW columns added by migration 20251018000002:**
- `sender_type` - homeowner/contractor (for easier querying)

---

### ✅ trusted_contractors
**Purpose:** Homeowner's list of trusted contractors

**Existing columns:**
- `id` - UUID primary key
- `homeowner_id` - References user_profiles
- `contractor_id` - References contractor_profiles
- `trust_level` - 1=Saved, 2=Preferred, 3=Trusted
- `notes` - Homeowner notes
- `jobs_completed` - How many jobs done together
- `total_spent` - Total money spent
- `average_rating` - Average rating given
- `last_job_date` - Most recent job
- `preferred_contact_method` - message/phone/email
- `preferred_time_slots` - Array of time slots
- `created_at`, `updated_at` - Timestamps

**No changes needed** - This table is fine as-is for RushrMap

---

## New Tables Created

### 🆕 notifications
**Purpose:** System notifications for users

**Columns:**
- `id` - UUID primary key
- `user_id` - References auth.users
- `type` - job_request_received/bid_received/bid_accepted/bid_rejected/job_filled/job_expired/new_message
- `title` - Notification title
- `message` - Notification message
- `job_id` - References homeowner_jobs (nullable)
- `bid_id` - References job_bids (nullable)
- `conversation_id` - References conversations (nullable)
- `is_read` - Boolean
- `read_at` - Timestamp when read
- `created_at` - Timestamp

---

## Database Functions Created

### expire_old_jobs()
**Purpose:** Auto-expire jobs after `expires_at` timestamp
**When to call:** Run periodically (e.g., every minute via cron job or pg_cron)
```sql
SELECT expire_old_jobs();
```

### notify_homeowner_of_new_bid() [TRIGGER]
**Purpose:** Automatically create notification when contractor submits bid
**Triggers on:** INSERT on job_bids
**Actions:**
1. Creates notification for homeowner
2. Updates job status to 'bid_received'

### notify_contractor_bid_accepted() [TRIGGER]
**Purpose:** Notify contractor when homeowner accepts bid
**Triggers on:** UPDATE on job_bids (when status changes to 'accepted')
**Actions:**
1. Creates notification for contractor
2. Creates conversation between homeowner and contractor
3. Links conversation to the job

### update_conversation_unread_counts() [TRIGGER]
**Purpose:** Update unread message counts when new message sent
**Triggers on:** INSERT on messages
**Actions:**
1. Increments unread count for recipient
2. Sets sender_type on message
3. Updates last_message_at timestamp

---

## Views Created

### contractor_job_requests
**Purpose:** Contractors can see all job requests available to them

**Columns returned:**
- Job details (id, title, description, category, urgency, priority, status)
- Homeowner info (name, phone)
- Location (address, city, state, zip)
- Expiration (expires_at, seconds_remaining)
- Bid status (has_bid, bid_id, my_bid_amount, my_bid_status)

**Usage:**
```sql
SELECT * FROM contractor_job_requests
WHERE category = 'Electrical'
AND location_zip = '10001'
ORDER BY urgency, created_at DESC;
```

---

## Comparison: Old vs New System

| Feature | Old Duplicate System | New Updated System |
|---------|---------------------|-------------------|
| Job requests | `job_requests` table (NEW) | ✅ Uses existing `homeowner_jobs` |
| Contractor bids | `contractor_bids` table (NEW) | ✅ Uses existing `job_bids` |
| Chat | `conversations` + `messages` (NEW) | ✅ Uses existing `conversations` + `messages` |
| Notifications | `notifications` (NEW) | ✅ Created `notifications` (didn't exist) |
| 10-min countdown | `expires_at` on job_requests | ✅ `expires_at` added to `homeowner_jobs` |
| Bid messages | `bid_message` on contractor_bids | ✅ `bid_message` added to `job_bids` |

---

## Migration Files to Run

### 1. Add Contractor Geocoding (REQUIRED)
**File:** `supabase/migrations/20251018000001_add_contractor_geocoding.sql`
**Purpose:** Add exact lat/lng coordinates to contractor_profiles
**Actions:**
- Adds `address`, `latitude`, `longitude` columns
- Creates geospatial index

### 2. RushrMap Updates (REQUIRED)
**File:** `supabase/migrations/20251018000002_rushrmap_updates.sql`
**Purpose:** Update existing tables for RushrMap workflow
**Actions:**
- Adds `expires_at`, `urgency`, `location_zip` to homeowner_jobs
- Adds `bid_message` to job_bids
- Creates `notifications` table
- Updates `conversations.job_id` to UUID FK
- Adds unread counts to conversations
- Adds `sender_type` to messages
- Creates triggers for notifications
- Creates contractor_job_requests view

### 3. ❌ OLD DUPLICATE FILE (DELETED)
**File:** `supabase/migrations/20251018000000_job_requests_and_chat.sql`
**Status:** DELETED - created duplicate tables

---

## API Endpoints to Build

### Job Management
- `POST /api/jobs` - Create job (homeowner)
- `GET /api/jobs` - List jobs (filter by category, ZIP, urgency)
- `PATCH /api/jobs/[id]` - Update job status

### Bidding
- `POST /api/bids` - Submit bid (contractor)
- `GET /api/bids?job_id=xxx` - Get bids for job (homeowner)
- `PATCH /api/bids/[id]` - Accept/reject bid (homeowner)

### Conversations & Messages
- `POST /api/conversations` - Create conversation (auto-created on bid accept)
- `GET /api/conversations` - List user's conversations
- `POST /api/messages` - Send message
- `GET /api/messages?conversation_id=xxx` - Get conversation messages
- `PATCH /api/messages/[id]/read` - Mark message as read

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/[id]` - Mark as read
- `DELETE /api/notifications/[id]` - Delete notification

---

## RushrMap Workflow

### 1. Homeowner Posts Job on Map
```
User selects category → Searches ZIP → Views contractors on map
OR
User clicks contractor card → "Request" button
```

**Database actions:**
1. Insert into `homeowner_jobs`:
   - Set `status = 'pending'`
   - Set `urgency = 'emergency'` (for 10-min countdown)
   - Set `expires_at = NOW() + INTERVAL '10 minutes'`
   - Set `location_zip` from search

### 2. Contractor Receives Notification
**Automatic via trigger:**
1. Notification created in `notifications` table
2. Contractor sees in UI: "New job request in your area"

### 3. Contractor Submits Bid
```sql
INSERT INTO job_bids (
  job_id, contractor_id, homeowner_id,
  bid_amount, bid_message, description
) VALUES (...);
```

**Automatic via trigger (notify_homeowner_of_new_bid):**
1. Creates notification for homeowner
2. Updates job status to 'bid_received'

### 4. Homeowner Receives Bid Notification
**Homeowner sees:**
- "New bid from [Contractor]: $150"
- Can compare multiple bids
- Accept or Decline buttons

### 5. Homeowner Accepts Bid
```sql
UPDATE job_bids SET status = 'accepted' WHERE id = bid_id;
```

**Automatic via trigger (notify_contractor_bid_accepted):**
1. Notifies contractor: "Bid accepted!"
2. Creates conversation between homeowner and contractor
3. Rejects all other bids for this job
4. Updates job with accepted_bid_id

### 6. Chat Opens
- "Open Chat" button appears
- Navigate to `/chat/[conversation_id]`
- Real-time messaging via Supabase Realtime

---

## Next Steps

1. ✅ Run migration `20251018000001_add_contractor_geocoding.sql`
2. ✅ Run migration `20251018000002_rushrmap_updates.sql`
3. ✅ Insert test contractors with addresses
4. 🔲 Build API endpoints
5. 🔲 Update ProMapExplorer to show "Request" button on contractor cards
6. 🔲 Add countdown timer component (10 minutes)
7. 🔲 Build bid display UI (amount, message, accept/decline)
8. 🔲 Add notification system to UI
9. 🔲 Build chat page at /chat/[id]

---

**Status:** Database schema analysis complete. Ready to build UI components and API endpoints using existing tables.
