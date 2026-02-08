#!/usr/bin/env pwsh
# Quizorax Render Deployment Setup Script for Windows

Write-Host "🚀 Quizorax Render Deployment Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Render deployment configuration ready" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Deployment Instructions:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Push Code to GitHub" -ForegroundColor Yellow
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Ready for Render deployment'" -ForegroundColor White
Write-Host "  git push origin main" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Create Render Service" -ForegroundColor Yellow
Write-Host "  1. Go to: https://dashboard.render.com" -ForegroundColor White
Write-Host "  2. Click 'New +' → 'Web Service'" -ForegroundColor White
Write-Host "  3. Connect your GitHub repository" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Configure Service" -ForegroundColor Yellow
Write-Host "  - Name: quizorax" -ForegroundColor White
Write-Host "  - Environment: Node" -ForegroundColor White
Write-Host "  - Build Command: bun install && bun run build" -ForegroundColor White
Write-Host "  - Start Command: bun run preview" -ForegroundColor White
Write-Host "  - Publish Directory: dist" -ForegroundColor White
Write-Host "  - Node Version: 20.10.0" -ForegroundColor White
Write-Host ""

Write-Host "Step 4: Add Environment Variables" -ForegroundColor Yellow
Write-Host "  Add in Render Dashboard → Environment:" -ForegroundColor White
Write-Host "  - VITE_SUPABASE_URL: <your-supabase-url>" -ForegroundColor White
Write-Host "  - VITE_SUPABASE_ANON_KEY: <your-anon-key>" -ForegroundColor White
Write-Host "  - VITE_API_URL: <your-api-url> (optional)" -ForegroundColor White
Write-Host ""

Write-Host "Step 5: Deploy" -ForegroundColor Yellow
Write-Host "  Click 'Deploy Web Service' and wait for deployment to complete" -ForegroundColor White
Write-Host ""

Write-Host "📋 Post-Deployment Configuration:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Configure Custom Domain" -ForegroundColor Yellow
Write-Host "  1. Go to your Render service dashboard" -ForegroundColor White
Write-Host "  2. Navigate to Settings → Custom Domain" -ForegroundColor White
Write-Host "  3. Add: quizorax.codedevio.in" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Configure DNS Records" -ForegroundColor Yellow
Write-Host "  Add CNAME record at your domain registrar:" -ForegroundColor White
Write-Host "  Name: quizorax.codedevio.in" -ForegroundColor White
Write-Host "  Type: CNAME" -ForegroundColor White
Write-Host "  Value: <render-service-url>.onrender.com" -ForegroundColor White
Write-Host "  (Replace <render-service-url> with actual service URL)" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Configure Supabase CORS" -ForegroundColor Yellow
Write-Host "  1. Go to Supabase Dashboard → Your Project" -ForegroundColor White
Write-Host "  2. Settings → API → CORS Settings" -ForegroundColor White
Write-Host "  3. Add origin: https://quizorax.codedevio.in" -ForegroundColor White
Write-Host ""

Write-Host "Step 4: Test Deployment" -ForegroundColor Yellow
Write-Host "  1. Navigate to: https://quizorax.codedevio.in" -ForegroundColor White
Write-Host "  2. Test login at: https://quizorax.codedevio.in/auth" -ForegroundColor White
Write-Host "  3. Check browser console for errors" -ForegroundColor White
Write-Host ""

Write-Host "📚 Deployment Files:" -ForegroundColor Cyan
Write-Host "  - render.yaml: Service configuration" -ForegroundColor White
Write-Host "  - DEPLOYMENT_DOMAIN_SETUP.md: Detailed setup guide" -ForegroundColor White
Write-Host ""

Write-Host "✅ Setup instructions complete!" -ForegroundColor Green
Write-Host ""
Write-Host "For detailed information, see: DEPLOYMENT_DOMAIN_SETUP.md" -ForegroundColor Yellow
