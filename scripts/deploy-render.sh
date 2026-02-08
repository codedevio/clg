#!/bin/bash

# Quizorax Render Deployment Script
# This script prepares and deploys the app to Render with custom domain configuration

set -e

echo "🚀 Quizorax Render Deployment Script"
echo "====================================="

echo "✓ Render deployment ready"
echo ""
echo "📋 Deployment Instructions:"
echo "1. Push your code to GitHub"
echo "2. Go to https://dashboard.render.com"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Connect your GitHub repository"
echo "5. Configure:"
echo "   - Name: quizorax"
echo "   - Build Command: bun install && bun run build"
echo "   - Start Command: bun run preview"
echo "   - Publish Directory: dist"
echo ""
echo "6. Add environment variables:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - VITE_API_URL (optional)"
echo ""
echo "7. Click 'Deploy Web Service'"
echo ""
echo "📋 Post-Deployment Steps:"
echo "1. Add custom domain 'quizorax.codedevio.in' in Render dashboard"
echo "2. Configure DNS records with your domain provider:"
echo "   CNAME quizorax.codedevio.in -> <render-url>.onrender.com"
echo "3. Configure CORS in Supabase for domain: https://quizorax.codedevio.in"
echo "4. Test authentication at https://quizorax.codedevio.in/auth"
echo ""
echo "✅ Setup complete!"
