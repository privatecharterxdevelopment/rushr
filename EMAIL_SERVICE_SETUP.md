# Email Service Setup Guide

## Quick Start

The email service is ready to deploy. Follow these steps to get it running.

### 1. Deploy the Edge Function

```bash
# Make the script executable
chmod +x scripts/deploy-email-service.sh

# Run the deployment script
./scripts/deploy-email-service.sh
```

Or manually:

```bash
# Login to Supabase
supabase login

# Deploy the function
supabase functions deploy send-email --project-ref jtrxdcccswdwlritgstp
```

### 2. Configure SMTP Credentials

Choose one of these options:

#### Option A: Gmail (For Testing)

**Setup Gmail App Password:**
1. Enable 2FA on your Gmail account
2. Go to: Google Account → Security → 2-Step Verification → App Passwords
3. Generate a new app password for "Mail"
4. Use the 16-character password below

**Configure Secrets:**
```bash
supabase secrets set SMTP_HOST=smtp.gmail.com --project-ref jtrxdcccswdwlritgstp
supabase secrets set SMTP_PORT=587 --project-ref jtrxdcccswdwlritgstp
supabase secrets set SMTP_USER=your-email@gmail.com --project-ref jtrxdcccswdwlritgstp
supabase secrets set SMTP_PASS=your-16-char-app-password --project-ref jtrxdcccswdwlritgstp
supabase secrets set FROM_EMAIL=your-email@gmail.com --project-ref jtrxdcccswdwlritgstp
supabase secrets set FROM_NAME=Rushr --project-ref jtrxdcccswdwlritgstp
```

**Limits:** 500 emails/day

#### Option B: SendGrid (Recommended for Production)

**Setup SendGrid:**
1. Sign up at https://sendgrid.com
2. Create an API key at Settings → API Keys
3. Verify your sender domain

**Configure Secrets:**
```bash
supabase secrets set SMTP_HOST=smtp.sendgrid.net --project-ref jtrxdcccswdwlritgstp
supabase secrets set SMTP_PORT=587 --project-ref jtrxdcccswdwlritgstp
supabase secrets set SMTP_USER=apikey --project-ref jtrxdcccswdwlritgstp
supabase secrets set SMTP_PASS=SG.your-api-key-here --project-ref jtrxdcccswdwlritgstp
supabase secrets set FROM_EMAIL=noreply@rushr.com --project-ref jtrxdcccswdwlritgstp
supabase secrets set FROM_NAME=Rushr --project-ref jtrxdcccswdwlritgstp
```

**Limits:** 100 emails/day (free), then paid tiers

### 3. Test the Email Service

```bash
# View function logs
supabase functions logs send-email --project-ref jtrxdcccswdwlritgstp

# Test with curl
curl -X POST https://jtrxdcccswdwlritgstp.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email from Rushr",
    "html": "<h1>Success!</h1><p>Email service is working.</p>",
    "text": "Success! Email service is working."
  }'
```

Replace `YOUR_ANON_KEY` with your `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`

## Available Email Functions

All functions are in `lib/emailService.ts`:

### Job & Bid Notifications
```typescript
import { notifyBidReceived, notifyNewJob, notifyBidAccepted } from '@/lib/emailService'

// When contractor submits a bid
await notifyBidReceived({
  homeownerEmail: 'homeowner@example.com',
  homeownerName: 'John Doe',
  contractorName: 'Pro Plumbing',
  jobTitle: 'Fix leaking pipe',
  bidAmount: 250,
  estimatedArrival: '2 hours'
})

// When new job is posted
await notifyNewJob({
  contractorEmail: 'contractor@example.com',
  contractorName: 'Mike Smith',
  jobTitle: 'Emergency plumbing needed',
  jobCategory: 'Plumbing',
  jobAddress: '123 Main St, Portland OR',
  homeownerPhone: '+1-555-0100'
})

// When homeowner accepts bid
await notifyBidAccepted({
  contractorEmail: 'contractor@example.com',
  contractorName: 'Mike Smith',
  jobTitle: 'Fix leaking pipe',
  homeownerName: 'John Doe',
  homeownerPhone: '+1-555-0100',
  jobAddress: '123 Main St'
})
```

### Payment & Work Status
```typescript
import { notifyPaymentCompleted, notifyWorkStarted, notifyWorkCompleted } from '@/lib/emailService'

// When payment is completed
await notifyPaymentCompleted({
  homeownerEmail: 'homeowner@example.com',
  homeownerName: 'John Doe',
  contractorEmail: 'contractor@example.com',
  contractorName: 'Mike Smith',
  jobTitle: 'Fix leaking pipe',
  amount: 250
})

// When work starts
await notifyWorkStarted({
  homeownerEmail: 'homeowner@example.com',
  homeownerName: 'John Doe',
  contractorEmail: 'contractor@example.com',
  contractorName: 'Mike Smith',
  jobTitle: 'Fix leaking pipe',
  estimatedCompletion: '2 hours'
})

// When work is completed
await notifyWorkCompleted({
  homeownerEmail: 'homeowner@example.com',
  homeownerName: 'John Doe',
  contractorEmail: 'contractor@example.com',
  contractorName: 'Mike Smith',
  jobTitle: 'Fix leaking pipe'
})
```

### Account & Support (Uses HTML Templates)
```typescript
import {
  notifyKYCRefused,
  notifyOnboardingConfirmation,
  notifyPasswordReset,
  notifySupportTicketReceived
} from '@/lib/emailService'

// When KYC verification fails
await notifyKYCRefused({
  contractorEmail: 'contractor@example.com',
  contractorName: 'Mike Smith',
  caseId: 'KYC-12345',
  decisionDate: 'January 15, 2025',
  reasonPrimary: 'Document Quality Issues',
  reasonDetails: 'The provided ID document was not clear enough for verification.',
  requestedDocuments: 'Clear photo of government-issued ID, Business license'
})

// When new user signs up
await notifyOnboardingConfirmation({
  userEmail: 'newuser@example.com',
  userName: 'Jane Doe',
  onboardingUrl: 'https://rushr.com/onboarding?token=abc123'
})

// When user requests password reset
await notifyPasswordReset({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  resetUrl: 'https://rushr.com/reset-password?token=xyz789',
  ipAddress: '192.168.1.1',
  city: 'Portland, OR',
  device: 'Chrome on Mac',
  requestTime: 'January 15, 2025 at 3:45 PM PST'
})

// When support ticket is created
await notifySupportTicketReceived({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  ticketId: 'TICKET-456',
  ticketSubject: 'Payment not received',
  ticketPriority: 'High',
  ticketStatus: 'Open'
})
```

## Email Templates

Beautiful HTML templates are in `/supabase/`:

- **kyc-refused.html** - KYC verification refusal with case details
- **onboarding-confirmation.html** - Welcome email with setup checklist
- **password-reset.html** - Secure password reset with request details
- **support-ticket.html** - Support ticket confirmation

All templates feature:
- Responsive design (mobile-friendly)
- Dark mode support
- Rushr green branding (#47b46b)
- Bulletproof buttons (works in Outlook)

## Integration Points

Add email notifications to these workflows:

### 1. Bid Creation (`app/api/bids/route.ts`)
```typescript
// After bid is created
await notifyBidReceived({
  homeownerEmail: job.homeowner.email,
  homeownerName: job.homeowner.name,
  contractorName: contractor.name,
  jobTitle: job.title,
  bidAmount: bid.amount,
  estimatedArrival: bid.estimated_arrival
})
```

### 2. Job Posting (`app/api/jobs/route.ts`)
```typescript
// After job is posted, notify nearby contractors
const contractors = await findNearbyContractors(job.location, job.category)
for (const contractor of contractors) {
  await notifyNewJob({
    contractorEmail: contractor.email,
    contractorName: contractor.name,
    jobTitle: job.title,
    jobCategory: job.category,
    jobAddress: job.address,
    homeownerPhone: job.homeowner.phone
  })
}
```

### 3. Bid Acceptance (`app/api/bids/accept/route.ts`)
```typescript
// After bid is accepted
await notifyBidAccepted({
  contractorEmail: bid.contractor.email,
  contractorName: bid.contractor.name,
  jobTitle: job.title,
  homeownerName: job.homeowner.name,
  homeownerPhone: job.homeowner.phone,
  jobAddress: job.address
})
```

### 4. Payment Processing (`app/api/payments/route.ts`)
```typescript
// After payment is completed
await notifyPaymentCompleted({
  homeownerEmail: job.homeowner.email,
  homeownerName: job.homeowner.name,
  contractorEmail: job.contractor.email,
  contractorName: job.contractor.name,
  jobTitle: job.title,
  amount: payment.amount
})
```

### 5. KYC Verification (`app/api/kyc/verify/route.ts`)
```typescript
// If KYC is refused
await notifyKYCRefused({
  contractorEmail: contractor.email,
  contractorName: contractor.name,
  caseId: kycCase.id,
  decisionDate: new Date().toLocaleDateString(),
  reasonPrimary: kycCase.refusal_reason,
  reasonDetails: kycCase.refusal_details,
  requestedDocuments: kycCase.required_documents
})
```

### 6. User Registration (`app/api/auth/signup/route.ts`)
```typescript
// After user signs up
await notifyOnboardingConfirmation({
  userEmail: user.email,
  userName: user.name,
  onboardingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?token=${token}`
})
```

### 7. Password Reset (`app/api/auth/reset-password/route.ts`)
```typescript
// When user requests password reset
await notifyPasswordReset({
  userEmail: user.email,
  userName: user.name,
  resetUrl: resetLink,
  ipAddress: request.ip,
  city: geoData.city,
  device: userAgent,
  requestTime: new Date().toLocaleString()
})
```

### 8. Support Tickets (`app/api/support/route.ts`)
```typescript
// After support ticket is created
await notifySupportTicketReceived({
  userEmail: user.email,
  userName: user.name,
  ticketId: ticket.id,
  ticketSubject: ticket.subject,
  ticketPriority: ticket.priority,
  ticketStatus: ticket.status
})
```

## Monitoring

### View Logs
```bash
# Real-time logs
supabase functions logs send-email --project-ref jtrxdcccswdwlritgstp --follow

# Recent logs
supabase functions logs send-email --project-ref jtrxdcccswdwlritgstp
```

### Check Secrets
```bash
supabase secrets list --project-ref jtrxdcccswdwlritgstp
```

### Function URL
```
https://jtrxdcccswdwlritgstp.supabase.co/functions/v1/send-email
```

## Troubleshooting

### "Email service not configured" error
- Verify SMTP secrets are set: `supabase secrets list --project-ref jtrxdcccswdwlritgstp`
- Ensure `SMTP_USER` and `SMTP_PASS` are configured

### "535 Authentication failed"
- **Gmail:** Use App Password (not regular password)
- **SendGrid:** Ensure `SMTP_USER` is exactly "apikey"
- Verify credentials are correct

### Emails going to spam
- Configure SPF, DKIM, and DMARC DNS records
- Use verified domain with SendGrid/SES
- Avoid spam trigger words

### Function not found
- Redeploy: `supabase functions deploy send-email --project-ref jtrxdcccswdwlritgstp`
- Check deployment: `supabase functions list --project-ref jtrxdcccswdwlritgstp`

## Production Checklist

- [ ] Deploy Edge Function
- [ ] Configure SMTP secrets (use SendGrid, not Gmail)
- [ ] Test email delivery
- [ ] Configure domain DNS (SPF, DKIM, DMARC)
- [ ] Integrate email calls into application workflows
- [ ] Set up monitoring/alerts for email failures
- [ ] Update logo URL in HTML templates (replace CDN placeholder)
- [ ] Test all email types (bid received, payment, KYC, etc.)
- [ ] Verify mobile responsiveness
- [ ] Test dark mode rendering

## Support

If you need help:
- Check function logs: `supabase functions logs send-email`
- Review Supabase docs: https://supabase.com/docs/guides/functions
- SMTP provider support: SendGrid, Gmail, etc.

---

**Email service is ready to deploy!** 🚀
