# Deployment Guide - Quizorax

This guide will help you deploy Quizorax to Vercel or Render.

## Prerequisites

- Supabase account (with project URL and anon key)
- Git repository pushed to GitHub
- Vercel or Render account

## Environment Variables

Both Vercel and Render need the following environment variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To get these values:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the URL and the `anon` public key

## Deployment on Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select your `quizorax` repository
5. Vercel will auto-detect Vite configuration
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click "Deploy"

### Option 2: Via Vercel CLI

```bash
npm install -g vercel
# or
bun install -g vercel

vercel
```

Then follow the prompts to:
- Link to your Vercel account
- Confirm project settings
- Set environment variables
- Deploy

### Vercel Configuration

The `vercel.json` file is already configured with:
- Build command: `bun install && bun run build`
- Output directory: `dist`
- Framework: Vite
- Auto-detected environment variables

## Deployment on Render

### Via Render Dashboard

1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: quizorax (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `bun install && bun run build`
   - **Start Command**: `bun run preview`
   - **Publish directory**: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click "Deploy Web Service"

### Using render.yaml

If `render.yaml` is pushed to your repository, Render will auto-detect the configuration. You'll only need to:
1. Connect your GitHub repo
2. Add the environment variables
3. Deploy

## Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] Supabase CORS settings include your deployment domain
- [ ] Test login/authentication
- [ ] Test API calls to Supabase
- [ ] Verify routes work correctly
- [ ] Check browser console for errors
- [ ] Test all major features

## Supabase CORS Configuration

To allow your deployment domain to access Supabase:

1. Go to Supabase Dashboard > Settings > API
2. Under "CORS" settings, add your deployment URL:
   - For Vercel: `https://your-project.vercel.app`
   - For Render: `https://your-project.onrender.com`

## Environment Variables Setup

### For Vercel:
1. Go to Project Settings > Environment Variables
2. Add each variable with the appropriate scope (Production, Preview, Development)

### For Render:
1. Go to your Web Service > Environment
2. Add each environment variable
3. Click "Save Changes"

## Troubleshooting

### Build fails with "bun not found"
- Vercel and Render have native bun support
- Ensure Node version is 18+ (set in `.nvmrc` file)

### CORS errors when making API calls
- Check that your deployment domain is added to Supabase CORS settings
- Verify environment variables are correctly set

### Authentication not working
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check that Supabase project is active
- Ensure localStorage is available in the browser

### Blank page on load
- Check browser console for errors
- Verify all environment variables are present
- Check Supabase client configuration

## Maintenance

### Updating after deployment
1. Push changes to GitHub
2. Vercel/Render will automatically rebuild
3. Verify deployment in logs

### Rolling back
- Both Vercel and Render store deployment history
- Click on a previous deployment to restore

## Support

For issues:
- Check Vercel/Render deployment logs
- Check browser console (F12)
- Verify Supabase connection
- Review `.env.example` for required variables

## Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)
