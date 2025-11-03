#!/bin/bash

# Rushr Email Service Deployment Script
# This script deploys the email service Edge Function to Supabase

set -e

echo "🚀 Rushr Email Service Deployment"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    echo "Or: brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "Please run: supabase login"
    exit 1
fi

echo "✅ Authenticated with Supabase"

# Project reference
PROJECT_REF="jtrxdcccswdwlritgstp"

echo ""
echo "📦 Deploying send-email Edge Function..."
echo ""

# Deploy the Edge Function
supabase functions deploy send-email --project-ref $PROJECT_REF

echo ""
echo "✅ Edge Function deployed successfully!"
echo ""
echo "⚙️  Next Steps:"
echo "=================================="
echo ""
echo "1. Configure SMTP secrets (choose one option):"
echo ""
echo "   Option A - Gmail (Testing):"
echo "   ---------------------------"
echo "   supabase secrets set SMTP_HOST=smtp.gmail.com --project-ref $PROJECT_REF"
echo "   supabase secrets set SMTP_PORT=587 --project-ref $PROJECT_REF"
echo "   supabase secrets set SMTP_USER=your-email@gmail.com --project-ref $PROJECT_REF"
echo "   supabase secrets set SMTP_PASS=your-app-password --project-ref $PROJECT_REF"
echo "   supabase secrets set FROM_EMAIL=your-email@gmail.com --project-ref $PROJECT_REF"
echo "   supabase secrets set FROM_NAME=Rushr --project-ref $PROJECT_REF"
echo ""
echo "   Option B - SendGrid (Production):"
echo "   ---------------------------------"
echo "   supabase secrets set SMTP_HOST=smtp.sendgrid.net --project-ref $PROJECT_REF"
echo "   supabase secrets set SMTP_PORT=587 --project-ref $PROJECT_REF"
echo "   supabase secrets set SMTP_USER=apikey --project-ref $PROJECT_REF"
echo "   supabase secrets set SMTP_PASS=your-sendgrid-api-key --project-ref $PROJECT_REF"
echo "   supabase secrets set FROM_EMAIL=noreply@rushr.com --project-ref $PROJECT_REF"
echo "   supabase secrets set FROM_NAME=Rushr --project-ref $PROJECT_REF"
echo ""
echo "2. Test the function:"
echo "   supabase functions logs send-email --project-ref $PROJECT_REF"
echo ""
echo "3. View function URL:"
echo "   https://$PROJECT_REF.supabase.co/functions/v1/send-email"
echo ""
echo "🎉 Deployment complete! Configure secrets to start sending emails."
