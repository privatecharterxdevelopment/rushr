#!/bin/bash

# =============================================================================
# SET VERCEL ENVIRONMENT VARIABLES
# Run this script to set all required environment variables in Vercel
# Prerequisites: Install Vercel CLI with `npm i -g vercel`
# =============================================================================

set -e

echo "🚀 Setting Vercel Environment Variables for Rushr"
echo "=================================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with:"
    echo "   npm install -g vercel"
    exit 1
fi

# Load environment variables from .env.local
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found"
    echo "   Copy .env.example to .env.local and fill in your values"
    exit 1
fi

echo "📝 Loading variables from .env.local..."
source .env.local

# Function to set environment variable in Vercel
set_env() {
    local key=$1
    local value=$2

    if [ -z "$value" ]; then
        echo "⚠️  Skipping $key (not set in .env.local)"
        return
    fi

    echo "✅ Setting $key"
    vercel env add "$key" production <<< "$value" 2>/dev/null || echo "   (already exists or failed)"
    vercel env add "$key" preview <<< "$value" 2>/dev/null || echo "   (already exists or failed)"
    vercel env add "$key" development <<< "$value" 2>/dev/null || echo "   (already exists or failed)"
}

echo ""
echo "🌐 Setting URL variables..."
set_env "NEXT_PUBLIC_SITE_URL" "$NEXT_PUBLIC_SITE_URL"
set_env "NEXT_PUBLIC_BASE_URL" "$NEXT_PUBLIC_BASE_URL"
set_env "NEXT_PUBLIC_MAIN_URL" "${NEXT_PUBLIC_MAIN_URL:-$NEXT_PUBLIC_SITE_URL}"
set_env "NEXT_PUBLIC_PRO_URL" "${NEXT_PUBLIC_PRO_URL:-$NEXT_PUBLIC_SITE_URL}"

echo ""
echo "🗄️  Setting Supabase variables..."
set_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
set_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
set_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "💳 Setting Stripe variables..."
set_env "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
set_env "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
set_env "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"

echo ""
echo "🗺️  Setting Mapbox variables..."
set_env "NEXT_PUBLIC_MAPBOX_TOKEN" "$NEXT_PUBLIC_MAPBOX_TOKEN"

echo ""
echo "📧 Setting Email variables..."
set_env "RESEND_API_KEY" "$RESEND_API_KEY"

echo ""
echo "📱 Setting Twilio variables (optional)..."
set_env "TWILIO_ACCOUNT_SID" "$TWILIO_ACCOUNT_SID"
set_env "TWILIO_AUTH_TOKEN" "$TWILIO_AUTH_TOKEN"
set_env "TWILIO_PHONE_NUMBER" "$TWILIO_PHONE_NUMBER"

echo ""
echo "✅ Environment variables set!"
echo ""
echo "📝 Next steps:"
echo "   1. Verify variables in Vercel dashboard"
echo "   2. Redeploy your project: vercel --prod"
echo "   3. Test the production site"
echo ""
