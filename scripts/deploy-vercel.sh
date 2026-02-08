#!/bin/bash

# Quizorax Vercel Deployment Script
# This script prepares and deploys the app to Vercel with custom domain configuration

set -e

echo "🚀 Quizorax Vercel Deployment Script"
echo "======================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

echo "✓ Vercel CLI found"

# Check if required environment variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Setting environment variables..."
    echo "Please ensure the following environment variables are set in Vercel dashboard:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_ANON_KEY"
    echo "  - VITE_API_URL (optional)"
fi

# Build the project
echo "🔨 Building project..."
bun run build

# Deploy to Vercel
echo "📤 Deploying to Vercel..."
vercel deploy --prod

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📋 Post-Deployment Steps:"
echo "1. Add domain 'quizorax.codedevio.in' in Vercel project settings"
echo "2. Configure DNS records with your domain provider (point to Vercel's nameservers)"
echo "3. Configure CORS in Supabase for domain: https://quizorax.codedevio.in"
echo "4. Test authentication at https://quizorax.codedevio.in/auth"
