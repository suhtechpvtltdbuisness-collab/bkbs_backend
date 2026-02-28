# Vercel Deployment Checklist

## Pre-Deployment

- [ ] MongoDB Atlas Network Access configured (0.0.0.0/0 added)
- [ ] MongoDB connection string ready
- [ ] All environment variables prepared
- [ ] Code tested locally (`npm run dev`)
- [ ] Latest changes committed to Git

## Environment Variables to Add in Vercel

Copy these values from your `.env` file:

```bash
# Required
NODE_ENV=production
MONGODB_URI=mongodb+srv://suhtechpvtltdbuisness_bkbs:aDKM2rvGDSqIJJho@bkbs.xzaapc7.mongodb.net/bkbs
JWT_ACCESS_SECRET=access_token_key01
JWT_REFRESH_SECRET=secret_refresh_token_key01

# Optional (with defaults)
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

## Deployment Commands

```bash
# 1. Commit changes
git add .
git commit -m "Configure for Vercel"
git push origin main

# 2. Deploy to Vercel
vercel

# 3. After adding env variables, deploy to production
vercel --prod
```

## Post-Deployment Tests

```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Test auth registration
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","role":"user","password":"test123","email":"test@test.com"}'
```

## If You Get Errors

### FUNCTION_INVOCATION_FAILED

1. Check `vercel logs` for detailed error
2. Verify MongoDB network access (0.0.0.0/0)
3. Confirm all environment variables are added
4. Check MONGODB_URI format

### Quick Fix Commands

```bash
# View logs
vercel logs --follow

# List deployments
vercel ls

# Check environment variables
vercel env ls
```

## Files Changed for Vercel

- ✅ `index.js` - Entry point for serverless
- ✅ `vercel.json` - Vercel configuration
- ✅ `src/config/database.js` - Connection pooling
- ✅ `.vercelignore` - Files to exclude
- ✅ `.gitignore` - Added .vercel folder

## MongoDB Atlas Quick Setup

1. Go to Network Access in MongoDB Atlas
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere"
4. Add "0.0.0.0/0"
5. Click "Confirm"

## Ready to Deploy?

Run these commands in order:

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
vercel
```

When prompted, add environment variables in Vercel dashboard, then:

```bash
vercel --prod
```

Your API will be live at: `https://your-project.vercel.app`
