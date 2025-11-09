# Admin Dashboard - Complete Guide

## Overview

A comprehensive admin dashboard for managing Rushr's contractors, homeowners, and support tickets with real-time updates.

## Features

### ✅ Contractor Management
- **Pending Approvals** - Review and approve/reject contractor applications
- **All Contractors** - View complete list of all registered contractors
- **Real-time Updates** - Live updates when new contractors register
- **Detailed Information** - View full contractor profiles including:
  - Business details
  - License & insurance information
  - Service areas & specialties
  - Hourly rates
  - Stripe payment setup status

### ✅ Homeowner Management
- View all registered homeowners
- Filter by subscription type (Free, Pro, Signals)
- Search by name, email, or location
- Real-time updates

### ✅ Support Ticket System
- Manage customer support requests
- Filter by status (New, Read, Responded, Closed)
- Reply directly to tickets
- Mark tickets as read or closed
- Real-time notifications for new tickets

### ✅ Dashboard Analytics
- Pending contractor count with alerts
- Total contractors by status
- Homeowner statistics
- Active jobs tracking
- Support ticket metrics

## File Structure

```
app/dashboard/admin/
├── layout.tsx                          # Admin layout with sidebar navigation
├── page.tsx                            # Overview dashboard with stats
├── contractors/
│   ├── page.tsx                        # Pending approvals page
│   └── all/
│       └── page.tsx                    # All contractors list
├── homeowners/
│   └── page.tsx                        # Homeowners management
├── support/
│   └── page.tsx                        # Support tickets
└── settings/
    └── page.tsx                        # Admin settings
```

## Access Control

### Who Can Access

Only users with admin role can access the admin dashboard:
- Email: `admin@userushr.com`
- Or any user with `role: 'admin'` in their profile

### Access Denied Handling

Non-admin users see:
- Clear "Access Denied" message
- Link to return to their dashboard
- Security shield icon

## Key Components

### 1. Admin Layout ([layout.tsx](app/dashboard/admin/layout.tsx))

**Features:**
- Collapsible sidebar navigation
- Mobile-responsive design
- Dark mode support
- Current route highlighting
- Badge indicators for pending items

**Navigation Items:**
- Overview
- Contractor Approvals (with pending badge)
- All Contractors
- Homeowners
- Support Tickets (with new badge)
- Settings

### 2. Overview Dashboard ([page.tsx](app/dashboard/admin/page.tsx))

**Stats Displayed:**
- Pending Contractors (amber - action required)
- Approved Contractors (emerald)
- Total Contractors (blue)
- Rejected Contractors (rose)
- Total Homeowners (purple)
- Support Tickets (amber if new)
- Active Jobs (emerald)

**Real-time Features:**
- Auto-refreshes when data changes
- Supabase Realtime subscriptions
- Live update indicator

**Quick Actions:**
- Alert banner when contractors pending
- Direct links to action pages

### 3. Contractor Approvals ([contractors/page.tsx](app/dashboard/admin/contractors/page.tsx))

**Features:**
- List of pending contractors
- Filter: Pending vs All
- Quick approve/reject buttons
- Detailed contractor modal
- Real-time updates

**Approval Process:**
1. Click "View Details" to see full profile
2. Review credentials, license, insurance
3. Check Stripe payment setup status
4. Click "Approve" or "Reject"
5. Contractor status updates to `approved`
6. Contractor can now go online

**What Happens on Approval:**
```sql
UPDATE pro_contractors SET
  status = 'approved',
  kyc_status = 'completed',
  profile_approved_at = NOW()
WHERE id = contractor_id
```

**What Happens on Rejection:**
```sql
UPDATE pro_contractors SET
  status = 'rejected',
  rejection_reason = 'reason text',
  rejected_at = NOW()
WHERE id = contractor_id
```

### 4. All Contractors ([contractors/all/page.tsx](app/dashboard/admin/contractors/all/page.tsx))

**Features:**
- Complete contractor table
- Search functionality
- Status breakdown stats
- Sortable columns
- Real-time updates

**Status Types:**
- `pending_approval` - Waiting for admin review
- `approved` - Approved but not online
- `online` - Actively accepting jobs
- `rejected` - Application declined
- `suspended` - Temporarily disabled

### 5. Homeowners Page ([homeowners/page.tsx](app/dashboard/admin/homeowners/page.tsx))

**Features:**
- All registered homeowners
- Search by name, email, city
- Subscription type breakdown
- Avatar display
- Location information

**Subscription Types:**
- Free - Basic tier
- Pro - Premium features
- Signals - Advanced notifications

### 6. Support Tickets ([support/page.tsx](app/dashboard/admin/support/page.tsx))

**Features:**
- Filter by status (All, New, Read, Responded)
- Reply to tickets directly
- Mark as read/closed
- Priority indicators
- Real-time updates

**Ticket Statuses:**
- `new` - Unread ticket
- `read` - Admin has viewed
- `responded` - Admin replied
- `closed` - Resolved

**Reply Process:**
1. Click "Reply" on ticket
2. Modal opens with original message
3. Type admin response
4. Click "Send Reply"
5. Status changes to `responded`
6. User receives notification

## Real-time Updates

### Implementation

All pages use Supabase Realtime subscriptions:

```typescript
const subscription = supabase
  .channel('channel-name')
  .on('postgres_changes', {
    event: '*',  // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'table_name'
  }, () => {
    fetchData()  // Refresh data
  })
  .subscribe()
```

### What Updates in Real-time

- ✅ New contractor registrations
- ✅ Contractor status changes
- ✅ New support tickets
- ✅ Ticket replies
- ✅ Homeowner registrations
- ✅ Profile updates

## Database Tables Used

### `pro_contractors`
- All contractor data
- Status field for approval workflow
- KYC status tracking
- Stripe account information

### `user_profiles`
- Homeowner accounts
- Subscription types
- Profile information

### `support_messages`
- Support tickets
- Admin replies
- Status tracking

### `emergency_requests`
- Job statistics
- Active/completed counts

## Design System

### Colors
- **Blue**: Primary actions, informational
- **Emerald**: Success, approved
- **Amber**: Warnings, pending actions
- **Rose**: Errors, rejected
- **Purple**: Special features, premium

### Components
- Rounded corners (rounded-2xl)
- Consistent padding (p-4, p-6)
- Shadow on hover
- Dark mode support throughout

### Typography
- Headings: font-bold
- Body: font-medium or normal
- Labels: text-xs uppercase tracking-wide

## Common Tasks

### How to Approve a Contractor

1. Go to "Contractor Approvals"
2. See list of pending contractors
3. Click "View Details" for full profile
4. Review:
   - Business information
   - License & insurance
   - Service categories
   - Stripe setup status
5. Click "Approve Contractor"
6. Contractor receives notification
7. Can now set status to "online"

### How to Reply to Support Ticket

1. Go to "Support Tickets"
2. Filter to "New" or "All"
3. Click "Reply" on ticket
4. Read original message in modal
5. Type your response
6. Click "Send Reply"
7. Ticket marked as "responded"

### How to Search Contractors

1. Go to "All Contractors"
2. Use search box at top
3. Search by:
   - Name
   - Email
   - Business name
4. Results filter automatically

### How to View Statistics

1. Go to "Overview"
2. See stats cards:
   - Contractor counts by status
   - Homeowner totals
   - Support ticket counts
   - Job statistics
3. Click stat cards to navigate

## Troubleshooting

### Admin Access Issues

**Problem:** "Access Denied" message
**Solution:**
1. Check user email is `admin@userushr.com`
2. Or check `user_profiles.role = 'admin'`
3. Contact developer to grant admin access

### Real-time Not Working

**Problem:** Data doesn't update automatically
**Solution:**
1. Check browser console for errors
2. Verify Supabase Realtime is enabled
3. Check Row Level Security policies allow reads

### Contractor Won't Approve

**Problem:** Approve button doesn't work
**Solution:**
1. Check browser console for errors
2. Verify database permissions
3. Ensure contractor exists in `pro_contractors`
4. Check network tab for failed requests

## Security Considerations

### Row Level Security

Ensure admin users have access to:
- `pro_contractors` - All records
- `user_profiles` - All records
- `support_messages` - All records
- `emergency_requests` - All records

### API Access

Admin routes should verify user role before executing:
```typescript
const isAdmin = userProfile?.role === 'admin'
if (!isAdmin) {
  return { error: 'Unauthorized' }
}
```

## Future Enhancements

Potential additions:
- [ ] Bulk contractor approval
- [ ] Email templates for responses
- [ ] Analytics dashboard
- [ ] Contractor performance metrics
- [ ] Payment transaction history
- [ ] Export data to CSV
- [ ] Advanced filtering options
- [ ] Audit logs
- [ ] User ban/suspend functionality
- [ ] Automated approval rules

## Testing Checklist

Before going live, test:

- [ ] Admin access control works
- [ ] Can approve contractor
- [ ] Can reject contractor
- [ ] Can reply to support ticket
- [ ] Real-time updates work
- [ ] Search functionality works
- [ ] Mobile responsiveness
- [ ] Dark mode displays correctly
- [ ] All navigation links work
- [ ] Stats display correctly
- [ ] No console errors

## Support

For technical issues:
- Check browser console for errors
- Review Supabase logs
- Verify database permissions
- Contact development team

---

## Quick Reference

### Admin Email
`admin@userushr.com`

### Dashboard URL
`/dashboard/admin`

### Key Tables
- `pro_contractors`
- `user_profiles`
- `support_messages`
- `emergency_requests`

### Contractor Approval Statuses
- `pending_approval` → `approved` OR `rejected`
- After approval: `approved` → `online` (contractor sets this)

### Support Ticket Flow
`new` → `read` → `responded` → `closed`
