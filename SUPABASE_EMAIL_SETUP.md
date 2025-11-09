# Supabase Email Setup Guide

This guide will help you configure Microsoft Exchange SMTP for Rushr's email notifications via Supabase Edge Functions.

## Step 1: Install Supabase CLI

If you haven't already, install the Supabase CLI:

```bash
npm install -g supabase
```

## Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

## Step 3: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project ref in the Supabase dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

## Step 4: Set SMTP Secrets

Run these commands to set your Microsoft Exchange SMTP credentials as Supabase secrets:

```bash
# Set SMTP host
supabase secrets set SMTP_HOST=smtp.office365.com

# Set SMTP port
supabase secrets set SMTP_PORT=587

# Set SMTP username (your email)
supabase secrets set SMTP_USER=noreply@userushr.com

# Set SMTP password
supabase secrets set SMTP_PASS=LorenzoRushr123!

# Set from email
supabase secrets set FROM_EMAIL=noreply@userushr.com

# Set from name
supabase secrets set FROM_NAME=Rushr
```

## Step 5: Deploy the Edge Function

```bash
supabase functions deploy send-email
```

## Step 6: Verify Secrets

Check that your secrets are set correctly:

```bash
supabase secrets list
```

You should see:
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- FROM_EMAIL
- FROM_NAME

## Step 7: Test the Email Function

After deployment, test the email function using the test script:

```bash
node test-supabase-email.js
```

## Important Notes

### Microsoft Exchange SMTP Authentication

⚠️ **IMPORTANT**: The Microsoft 365 tenant must have SMTP AUTH enabled for the account `noreply@userushr.com`.

If you're getting authentication errors:

1. Go to Microsoft 365 Admin Center
2. Navigate to: **Settings > Org Settings > Modern authentication**
3. Ensure "Authenticated SMTP" is enabled
4. Or enable SMTP AUTH for the specific mailbox:
   - Go to **Exchange Admin Center**
   - Select **Recipients > Mailboxes**
   - Click on `noreply@userushr.com`
   - Under **Email apps**, ensure "Authenticated SMTP" is checked

### Alternative: App Password

If SMTP AUTH is disabled at the tenant level, you can use an App Password:

1. Enable MFA for the `noreply@userushr.com` account
2. Generate an App Password at: https://account.microsoft.com/security
3. Use the App Password instead of the regular password when setting `SMTP_PASS`

## Troubleshooting

### Error: "SmtpClientAuthentication is disabled for the Tenant"

This means SMTP AUTH is disabled at the organization level. Solutions:
1. Enable SMTP AUTH in Microsoft 365 Admin Center (recommended)
2. Use an App Password (requires MFA)
3. Contact your Microsoft 365 admin to enable SMTP AUTH

### Error: "535 5.7.139 Authentication unsuccessful"

This usually means:
1. Wrong username/password
2. SMTP AUTH is disabled
3. Account doesn't have permission to send via SMTP

### Error: "Connection timeout"

Check that:
1. Port 587 is not blocked by firewall
2. `smtp.office365.com` is reachable
3. STARTTLS is supported by the server

## Email Flow

1. Application calls email function in `lib/emailService.ts`
2. Request sent to Supabase Edge Function at `/functions/v1/send-email`
3. Edge Function connects to Microsoft Exchange via SMTP (port 587, STARTTLS)
4. Email is sent through Microsoft Exchange
5. Success/failure response returned to application

## Next Steps

After successful deployment and testing:
1. Remove the old SendGrid package: `npm uninstall @sendgrid/mail`
2. Remove SendGrid environment variables from `.env.local`
3. Monitor email delivery in your application logs
