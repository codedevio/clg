#!/usr/bin/env pwsh
# Quizorax Vercel Deployment Script for Windows
# This script prepares and deploys the app to Vercel with custom domain configuration

param(
    [switch]$SkipBuild,
    [switch]$DryRun
)

Write-Host "🚀 Quizorax Vercel Deployment Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking for Vercel CLI..." -ForegroundColor Yellow
$vercelExists = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelExists) {
    Write-Host "❌ Vercel CLI is not installed. Installing..." -ForegroundColor Red
    Write-Host "Installing Vercel CLI globally..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✓ Vercel CLI installed" -ForegroundColor Green
} else {
    Write-Host "✓ Vercel CLI found" -ForegroundColor Green
}

Write-Host ""

# Check if bun is installed
Write-Host "Checking for Bun package manager..." -ForegroundColor Yellow
$bunExists = Get-Command bun -ErrorAction SilentlyContinue

if (-not $bunExists) {
    Write-Host "❌ Bun is not installed. Please install Bun first." -ForegroundColor Red
    Write-Host "Visit: https://bun.sh" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✓ Bun found" -ForegroundColor Green
}

Write-Host ""

# Check environment variables
Write-Host "Checking environment variables..." -ForegroundColor Yellow
$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseKey = $env:VITE_SUPABASE_ANON_KEY

if ([string]::IsNullOrEmpty($supabaseUrl) -or [string]::IsNullOrEmpty($supabaseKey)) {
    Write-Host "⚠️  Environment variables not set locally (this is OK - they should be set in Vercel dashboard)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required environment variables to set in Vercel Dashboard:" -ForegroundColor Cyan
    Write-Host "  - VITE_SUPABASE_URL" -ForegroundColor White
    Write-Host "  - VITE_SUPABASE_ANON_KEY" -ForegroundColor White
    Write-Host "  - VITE_API_URL (optional)" -ForegroundColor White
} else {
    Write-Host "✓ Supabase environment variables are set" -ForegroundColor Green
}

Write-Host ""

# Build the project
if (-not $SkipBuild) {
    Write-Host "🔨 Building project..." -ForegroundColor Yellow
    bun run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Build complete" -ForegroundColor Green
} else {
    Write-Host "⊘ Skipping build (--SkipBuild)" -ForegroundColor Cyan
}

Write-Host ""

if ($DryRun) {
    Write-Host "🧪 DRY RUN MODE - No actual deployment" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To deploy, run:" -ForegroundColor Cyan
    Write-Host "  vercel deploy --prod" -ForegroundColor White
} else {
    Write-Host "📤 Deploying to Vercel..." -ForegroundColor Yellow
    vercel deploy --prod
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Deployment Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project: quizorax" -ForegroundColor White
Write-Host "3. Go to Settings → Domains" -ForegroundColor White
Write-Host "4. Add custom domain: quizorax.codedevio.in" -ForegroundColor White
Write-Host "5. Configure DNS records with your registrar" -ForegroundColor White
Write-Host "6. Configure CORS in Supabase:" -ForegroundColor White
Write-Host "   - Go to Settings → API" -ForegroundColor White
Write-Host "   - Add: https://quizorax.codedevio.in" -ForegroundColor White
Write-Host "7. Test authentication at the domain" -ForegroundColor White
Write-Host ""
Write-Host "For more details, see: DEPLOYMENT_DOMAIN_SETUP.md" -ForegroundColor Yellow
