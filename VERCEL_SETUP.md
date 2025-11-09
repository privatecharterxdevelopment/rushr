# Vercel Deployment Setup Guide

## 🚨 Critical Environment Variables for Production

The following environment variables **MUST** be set in Vercel to avoid localhost fallbacks:

### 1. Go to Vercel Dashboard
1. Open your project: https://vercel.com/your-team/rushr-main
2. Go to **Settings** → **Environment Variables**

### 2. Add Required Variables

```bash
# SITE URLs (CRITICAL - prevents localhost fallbacks)
NEXT_PUBLIC_SITE_URL=https://rushr-main.vercel.app
NEXT_PUBLIC_BASE_URL=https://rushr-main.vercel.app
NEXT_PUBLIC_MAIN_URL=https://rushr-main.vercel.app
NEXT_PUBLIC_PRO_URL=https://rushr-main.vercel.app

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://jtrxdcccswdwlritgstp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# STRIPE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-publishable-key>
STRIPE_SECRET_KEY=<your-secret-key>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>

# MAPBOX
NEXT_PUBLIC_MAPBOX_TOKEN=<your-mapbox-token>

# EMAIL (RESEND)
RESEND_API_KEY=<your-resend-api-key>

# SMS (TWILIO) - Optional
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>
```

### 3. Set Environment for All Variables
- Make sure to select **Production**, **Preview**, and **Development** for each variable
- This ensures consistency across all environments

---

## 🔐 Supabase Configuration

### 1. Update Redirect URLs in Supabase Dashboard

Go to: https://app.supabase.com/project/jtrxdcccswdwlritgstp/auth/url-configuration

Add these URLs to **Redirect URLs**:
```
https://rushr-main.vercel.app/auth/callback
https://rushr-main.vercel.app/pro/auth/callback
https://rushr-main.vercel.app/api/auth/callback
https://*.vercel.app/auth/callback
```

Add to **Site URL**:
```
https://rushr-main.vercel.app
```

### 2. Enable PKCE Flow
In Supabase Auth settings:
- ✅ Enable PKCE flow
- ✅ Enable session persistence
- ✅ Set secure cookie settings for HTTPS

### 3. Supabase Edge Function Secrets

These are set separately via Supabase CLI (already configured):
```bash
npx supabase secrets set FROM_EMAIL=noreply@userushr.com
npx supabase secrets set FROM_NAME=Rushr
npx supabase secrets set RESEND_API_KEY=<your-resend-key>
```

---

## 🌐 Domain Configuration

### Current Setup
- **Production**: https://rushr-main.vercel.app
- **Future Custom Domain**: https://userushr.com (when ready)

### When Adding Custom Domain:
1. Update all `NEXT_PUBLIC_*_URL` variables in Vercel
2. Add new redirect URLs in Supabase
3. Update Stripe webhook endpoints
4. Verify Resend domain (noreply@userushr.com)

---

## ✅ Verification Checklist

After setting environment variables:

- [ ] Redeploy the project in Vercel
- [ ] Test sign-in flow (should redirect to Vercel URL, not localhost)
- [ ] Test sign-up and verify welcome email sent
- [ ] Test contractor bid flow
- [ ] Test Stripe payment flow
- [ ] Check browser console for any localhost URLs
- [ ] Verify all navigation links work (Header/Footer)

---

## 🐛 Common Issues

### Issue: Auth redirects to localhost
**Fix**: Ensure `NEXT_PUBLIC_SITE_URL` is set in Vercel and redeploy

### Issue: Email links go to localhost
**Fix**: Ensure `NEXT_PUBLIC_SITE_URL` is set and Supabase Edge Function is deployed

### Issue: Stripe webhooks fail
**Fix**: Update webhook endpoint in Stripe dashboard to Vercel URL

### Issue: "Missing Supabase URL" error
**Fix**: Ensure all `NEXT_PUBLIC_SUPABASE_*` variables are set in Vercel

---

## 📝 Quick Deploy Command

After setting environment variables, trigger a new deployment:

```bash
# Push to main branch
git push origin main

# Or trigger manual deploy in Vercel dashboard
```

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com
- **Supabase Dashboard**: https://app.supabase.com/project/jtrxdcccswdwlritgstp
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Resend Dashboard**: https://resend.com/emails
- **Mapbox Dashboard**: https://account.mapbox.com
