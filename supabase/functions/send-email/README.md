# Rushr Email Service Setup

This Supabase Edge Function sends automated email notifications for all platform interactions.

## Deployment

1. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy send-email
   ```

2. **Set Environment Variables in Supabase Dashboard:**

   Go to Project Settings > Edge Functions > Environment Variables and add:

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=noreply@rushr.com
   FROM_NAME=Rushr
   ```

## Gmail Setup (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password:**
   - Go to Google Account Settings
   - Security > 2-Step Verification > App Passwords
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASS`

## Production SMTP Providers

For production, use a dedicated email service:

### Option 1: SendGrid
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Rushr
```

### Option 2: AWS SES
```
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Rushr
```

### Option 3: Mailgun
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=your-mailgun-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Rushr
```

## Email Notifications

The email service automatically sends notifications for:

1. **Bid Received** - Homeowner gets notified when contractor submits bid
2. **New Job Posted** - Contractor gets notified of new jobs in their area
3. **Bid Accepted** - Contractor gets notified their bid was accepted
4. **Payment Completed** - Both parties notified when payment is processed
5. **Work Started** - Both parties notified when work begins
6. **Work Completed** - Both parties notified when work is done

## Usage in Code

```typescript
import { notifyBidReceived, notifyPaymentCompleted } from '@/lib/emailService'

// When contractor submits a bid
await notifyBidReceived({
  homeownerEmail: 'user@example.com',
  homeownerName: 'John Doe',
  contractorName: 'ABC Plumbing',
  jobTitle: 'Emergency pipe repair',
  bidAmount: 250,
  estimatedArrival: '30 minutes'
})

// When payment is completed
await notifyPaymentCompleted({
  homeownerEmail: 'user@example.com',
  homeownerName: 'John Doe',
  contractorEmail: 'contractor@example.com',
  contractorName: 'ABC Plumbing',
  jobTitle: 'Emergency pipe repair',
  amount: 250
})
```

## Testing

Test the edge function locally:

```bash
supabase functions serve send-email --env-file ./supabase/.env.local
```

Then call it:

```bash
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello from Rushr!</h1>",
    "text": "Hello from Rushr!"
  }'
```

## Troubleshooting

- **535 Authentication failed**: Check SMTP credentials
- **Connection timeout**: Check SMTP host and port
- **Emails going to spam**: Configure SPF, DKIM, and DMARC records for your domain
- **Rate limits**: Use a production email provider (SendGrid, SES, etc.)
