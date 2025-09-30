# Bidding System Test Guide

## Complete Job Posting to Bid Acceptance Workflow

This guide walks through testing the complete bidding system from job posting to contractor selection.

### Prerequisites

1. **Database Setup**: Ensure you've run the migration SQL files:
   - `complete-update-migration.sql`
   - `job-bidding-system.sql`

2. **Test Accounts**: You'll need at least:
   - 1 Homeowner account
   - 1-2 Contractor accounts

### Testing Workflow

#### Phase 1: Homeowner Posts a Job

1. **Login as Homeowner**
   - Navigate to the homeowner dashboard
   - Statistics should show 0 values for new accounts

2. **Post a Job**
   - Click "Emergency Help" or go to `/post-job`
   - Fill out the job form:
     - Title: "Leaky kitchen faucet repair"
     - Category: "Plumbing"
     - Priority: "High"
     - Description: "Kitchen faucet has been dripping for 2 days, getting worse"
     - Address: "123 Main St"
     - City: "New York"
     - State: "NY"
     - Estimated budget: "$200"
   - Submit the job

3. **Verify Job Creation**
   - Job should appear in homeowner dashboard
   - Active Services count should increment to 1
   - Job status should be "pending"

#### Phase 2: Contractors Browse and Bid

1. **Login as Contractor**
   - Navigate to contractor dashboard
   - Click "Browse Jobs" to go to `/jobs`

2. **Browse Available Jobs**
   - The job posted by homeowner should appear
   - Filter and sort functionality should work
   - Job should show:
     - Priority badge
     - Job details
     - 0 bids initially
     - "Submit Bid" button

3. **Submit a Bid**
   - Click on the job to go to job detail page
   - Fill out bid form:
     - Bid Amount: "$150"
     - Estimated Duration: "2 hours"
     - Available Date: Select a future date
     - Materials Included: Check the box
     - Warranty: "6 months"
     - Description: "I have 5 years experience with faucet repairs..."
   - Submit the bid

4. **Verify Bid Submission**
   - Should redirect back to jobs list
   - Job should now show "1 bid" and "View My Bid" button
   - Clicking on job should show submitted bid details

5. **Test with Second Contractor** (Optional)
   - Login as second contractor
   - Submit another bid with different amount ($180)
   - Job should now show "2 bids"

#### Phase 3: Real-time Notifications

1. **Homeowner Notifications**
   - As homeowner, you should see notification bell in header
   - Notification should show new bid received
   - Click notification to see details

2. **Dashboard Updates**
   - Homeowner dashboard should update in real-time
   - Job should change status from "pending" to "bidding"
   - Bid count should be reflected

#### Phase 4: Homeowner Reviews and Accepts Bid

1. **Access Bid Management**
   - As homeowner, click "Manage Bids" button in dashboard
   - Should see all jobs with their bids

2. **Review Bids**
   - See all bids sorted by amount (lowest first)
   - Each bid shows:
     - Contractor name and rating (mock data)
     - Bid amount prominently displayed
     - Estimated duration, availability, materials, warranty
     - Proposal description
     - "Accept Bid" button

3. **Accept a Bid**
   - Click "Accept Bid" on preferred contractor
   - Should see confirmation message
   - Other bids should be automatically rejected
   - Job status should change to "bid_accepted"

#### Phase 5: Post-Acceptance Workflow

1. **Contractor Notification**
   - Contractor should receive real-time notification
   - Notification should indicate bid was accepted
   - Job should appear in contractor's active work

2. **Homeowner Dashboard Updates**
   - Active Services should still show 1
   - Job status should be "bid_accepted"
   - Selected contractor should be assigned to job

3. **Start Work** (Optional Test)
   - Contractor can mark job as "in_progress"
   - Job status updates to "in_progress"
   - Homeowner sees updated status

### Expected Real-time Behaviors

#### Homeowner Experience:
- ✅ Immediate notification when bid received
- ✅ Dashboard stats update in real-time
- ✅ Job status changes reflect instantly
- ✅ Bid count updates without page refresh

#### Contractor Experience:
- ✅ New jobs appear in browse list instantly
- ✅ Bid submission updates job state immediately
- ✅ Notification when bid accepted/rejected
- ✅ Job moves to active work section when accepted

### Database Verification

You can verify the system is working by checking these database tables:

1. **homeowner_jobs**: Job records with correct status transitions
2. **job_bids**: Bid records with proper relationships
3. **homeowner_dashboard_stats**: Real-time statistics view
4. **user_profiles**: Updated homeowner stats

### Testing the Views

```sql
-- Check available jobs for contractors
SELECT * FROM contractor_available_jobs;

-- Check homeowner dashboard stats
SELECT * FROM homeowner_dashboard_stats WHERE homeowner_id = 'your-homeowner-id';

-- Check bids for a job
SELECT * FROM homeowner_job_bids WHERE job_id = 'your-job-id';
```

### Common Issues to Watch For

1. **Authentication**: Make sure users have correct roles (homeowner/contractor)
2. **Real-time Updates**: Check browser console for WebSocket connection errors
3. **Form Validation**: Test with invalid data (negative amounts, etc.)
4. **Permission Errors**: Ensure RLS policies are working correctly
5. **Missing Functions**: Verify all stored procedures exist in database

### Success Criteria

The system passes testing when:
- ✅ Jobs can be posted by homeowners
- ✅ Contractors can browse and bid on jobs
- ✅ Real-time notifications work for both roles
- ✅ Bid acceptance workflow completes end-to-end
- ✅ Dashboard statistics update correctly
- ✅ Database maintains data integrity throughout

---

## Technical Architecture

### Key Components Created

1. **Frontend Components**:
   - `/app/jobs/page.client.tsx` - Contractor job browsing
   - `/app/jobs/[id]/page.tsx` - Bid submission form
   - `/app/dashboard/homeowner/bids/page.tsx` - Homeowner bid management
   - `/components/BidNotification.tsx` - Real-time notification system

2. **Database Schema**:
   - `homeowner_jobs` - Job postings
   - `job_bids` - Contractor bids
   - `homeowner_dashboard_stats` - Real-time statistics view
   - `contractor_available_jobs` - Available jobs view
   - `homeowner_job_bids` - Bid management view

3. **Database Functions**:
   - `submit_job_bid()` - Handle bid submission
   - `accept_job_bid()` - Handle bid acceptance
   - `start_job_work()` - Transition to work phase

4. **Real-time Features**:
   - Supabase real-time subscriptions
   - Live notification system
   - Dashboard auto-updates

This creates a complete marketplace where homeowners can post jobs, contractors can compete through bidding, and both parties have real-time visibility into the process.