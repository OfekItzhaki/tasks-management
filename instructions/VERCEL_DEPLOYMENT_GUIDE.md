# Vercel Deployment Guide for Horizon Flux

## Current Issue

You're seeing this error in production:
```
Production environment detected but API_URL not configured. 
Please set VITE_API_URL environment variable.
```

**This is EXPECTED behavior** - the error handling we added is working correctly! The app is detecting it's in production and refusing to run without proper configuration.

## Quick Fix

### Step 1: Add Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (horizon-flux)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

#### Required Variables

**VITE_API_URL**
- Value: `https://api.horizon-flux.ofeklabs.dev`
- Environment: Production, Preview, Development (select all)

**VITE_TURNSTILE_SITE_KEY**
- Value: `1x00000000000000000000AA` (test key) OR your production Cloudflare site key
- Environment: Production, Preview, Development (select all)

### Step 2: Get Production Cloudflare Keys (Optional but Recommended)

If you want real CAPTCHA protection (not test keys):

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com/?to=/:account/turnstile
2. Click **"Add widget"** (not "new site")
3. Configure:
   - **Domain**: `horizon-flux.ofeklabs.dev`
   - **Mode**: Managed (recommended)
4. Copy the **Site Key** (this is public, safe to expose)
5. Update `VITE_TURNSTILE_SITE_KEY` in Vercel with the real site key

### Step 3: Redeploy

After adding environment variables:
1. Go to **Deployments** tab in Vercel
2. Click the **three dots** (•••) on the latest deployment
3. Click **"Redeploy"**
4. Select **"Use existing Build Cache"** (faster)
5. Click **"Redeploy"**

## Backend Configuration (Render)

Don't forget to configure your backend on Render.com:

1. Go to your Render dashboard
2. Select your backend service (todo-backend)
3. Go to **Environment** tab
4. Add/update these variables:

**TURNSTILE_SECRET_KEY**
- Value: `1x0000000000000000000000000000000AA` (test key) OR your production Cloudflare secret key
- Note: This is the SECRET key (different from site key), keep it private!

**ALLOWED_ORIGINS**
- Value: `https://horizon-flux.ofeklabs.dev`
- Note: This enables CORS for your frontend domain

**NODE_ENV**
- Value: `production`

After updating, Render will automatically redeploy your backend.

## Verification

After redeploying both frontend and backend:

1. Visit: https://horizon-flux.ofeklabs.dev
2. You should see the login page (no errors)
3. The CAPTCHA widget should appear
4. Try logging in - it should work!

## Test Keys vs Production Keys

### Test Keys (Current Setup)
- **Site Key**: `1x00000000000000000000AA`
- **Secret Key**: `1x0000000000000000000000000000000AA`
- **Behavior**: Always passes validation, CAPTCHA widget still appears
- **Use for**: Development, testing, staging environments
- **Security**: No real bot protection, but good for testing the flow

### Production Keys (Recommended for Production)
- **Get from**: Cloudflare Dashboard
- **Behavior**: Real CAPTCHA validation, actual bot protection
- **Use for**: Production environment only
- **Security**: Real protection against bots and abuse

## Troubleshooting

### Error: "Network error: Could not connect to the server"
- Check that `VITE_API_URL` is set correctly in Vercel
- Verify your backend is running on Render
- Check CORS configuration on backend (`ALLOWED_ORIGINS`)

### Error: "CAPTCHA verification failed"
- If using production keys: Verify domain matches in Cloudflare dashboard
- If using test keys: Should always pass - check backend `TURNSTILE_SECRET_KEY`
- Check backend logs on Render for more details

### Manifest.json 401 Error
- This is a Vercel authentication issue, not related to your app
- Safe to ignore - doesn't affect functionality
- Related to Vercel's internal manifest handling

## Environment Variables Summary

### Frontend (Vercel)
```bash
VITE_API_URL=https://api.horizon-flux.ofeklabs.dev
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA  # or production key
```

### Backend (Render)
```bash
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA  # or production key
ALLOWED_ORIGINS=https://horizon-flux.ofeklabs.dev
NODE_ENV=production
DATABASE_URL=<your-postgres-url>
# ... other backend variables
```

## Next Steps

1. ✅ Add environment variables to Vercel
2. ✅ Redeploy frontend on Vercel
3. ✅ Add environment variables to Render backend
4. ✅ Test the deployment
5. ⏭️ (Optional) Get production Cloudflare keys
6. ⏭️ (Optional) Set up staging environment

## Related Documentation

- [Environment Setup Guide](./ENVIRONMENT_SETUP_GUIDE.md)
- [Production Setup Guide](./PRODUCTION_SETUP_GUIDE.md)
- [No Hardcoded URLs Policy](./NO_HARDCODED_URLS.md)
- [DNS Setup Guide](./DNS_SETUP_GUIDE.md)
