# Vercel Deployment Guide

## Quick Start

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:

   ```bash
   vercel
   ```

3. **Configure Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Add all required environment variables

## Required Environment Variables

Add these in Vercel Dashboard (Settings → Environment Variables):

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_ACCESS_SECRET=your_strong_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_strong_secret_key_min_32_chars
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

## MongoDB Atlas Network Access

**IMPORTANT**: You must whitelist Vercel's IP addresses in MongoDB Atlas:

1. Go to MongoDB Atlas Dashboard
2. Navigate to Network Access
3. Click "Add IP Address"
4. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - OR add specific Vercel IPs if you prefer more security
5. Click "Confirm"

## Vercel Configuration Files

The following files are configured for Vercel deployment:

### `vercel.json`

- Configures the serverless function
- Sets up routing
- Defines max duration (10 seconds for hobby tier)

### `index.js`

- Entry point for Vercel serverless function
- Handles database connection with pooling
- Exports the Express app

### `.vercelignore`

- Lists files to exclude from deployment
- Reduces deployment size

## Deployment Steps

### First Time Deployment

```bash
# 1. Commit your changes
git add .
git commit -m "Configure for Vercel deployment"
git push origin main

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel
```

Follow the prompts:

- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N** (for first time)
- What's your project's name? **bkbs-backend** (or any name)
- In which directory is your code located? **./** (press Enter)

### Environment Variables Setup

After deployment, add environment variables:

**Option 1: Via Dashboard**

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable

**Option 2: Via CLI**

```bash
vercel env add MONGODB_URI
# Paste your MongoDB URI when prompted

vercel env add JWT_ACCESS_SECRET
# Paste your secret when prompted

# Repeat for all variables
```

### Redeploy After Adding Variables

```bash
vercel --prod
```

## Troubleshooting

### Error: FUNCTION_INVOCATION_FAILED

**Cause**: Database connection timeout or environment variables not set

**Solutions**:

1. Verify MongoDB Atlas network access allows 0.0.0.0/0
2. Check all environment variables are set in Vercel dashboard
3. Verify MONGODB_URI format is correct
4. Check MongoDB cluster is not paused

### Error: 500 Internal Server Error

**Cause**: Application crash or unhandled error

**Solutions**:

1. Check Vercel function logs: `vercel logs`
2. Verify database connection string
3. Check all dependencies are in `dependencies` (not `devDependencies`)
4. Ensure MongoDB URI uses `mongodb+srv://` protocol

### Error: Connection Timeout

**Cause**: Serverless function timeout (10 seconds on hobby tier)

**Solutions**:

1. Optimize database queries
2. Add indexes to MongoDB collections
3. Use connection pooling (already configured)
4. Upgrade to Pro plan for 60-second timeout

### Error: Module Not Found

**Cause**: Missing dependencies or incorrect import paths

**Solutions**:

1. Run `npm install` locally to verify all dependencies
2. Check all import paths use `.js` extension
3. Verify `package.json` has `"type": "module"`
4. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### CORS Issues

**Cause**: CORS_ORIGIN not matching frontend domain

**Solutions**:

1. Set CORS_ORIGIN to your exact frontend URL
2. Include protocol: `https://your-app.vercel.app`
3. No trailing slash
4. For multiple origins, update `src/app.js` to use an array

## Testing Deployment

### Test Health Endpoint

```bash
curl https://your-app.vercel.app/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-02-28T..."
}
```

### Test Authentication

```bash
# Register
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","role":"user","password":"test123","email":"test@example.com"}'
```

## Performance Optimization

### Database Connection

- ✅ Connection pooling enabled
- ✅ Timeout configured (5 seconds)
- ✅ Reuses existing connections

### Serverless Best Practices

- ✅ Environment variables cached
- ✅ Dependencies optimized
- ✅ Cold start minimized

## Monitoring

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Recent logs
vercel logs
```

### View Deployments

```bash
vercel ls
```

### View Project Info

```bash
vercel inspect
```

## Production Deployment

After testing, promote to production:

```bash
vercel --prod
```

Or set up automatic deployments:

1. Connect GitHub repository in Vercel dashboard
2. Enable automatic deployments from main branch
3. Every push to main will auto-deploy

## Rollback

If something goes wrong:

```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote [deployment-url]
```

## Cost Considerations

**Hobby (Free) Plan**:

- 100 GB bandwidth
- 10-second function timeout
- Serverless function executions

**Pro Plan** ($20/month):

- 1 TB bandwidth
- 60-second function timeout
- Better performance

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Add environment variables
3. ✅ Configure MongoDB network access
4. ✅ Test all API endpoints
5. ✅ Connect frontend application
6. ✅ Set up custom domain (optional)
7. ✅ Enable analytics (optional)
8. ✅ Set up monitoring

## Support

- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Issues: Check function logs with `vercel logs`
