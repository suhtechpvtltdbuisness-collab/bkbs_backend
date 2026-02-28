# Deployment Guide

## Prerequisites

- Node.js 18.x or higher
- MongoDB database (MongoDB Atlas recommended for production)
- Environment variables configured

## Platform-Specific Deployment

### 1. Render.com

1. Connect your GitHub repository
2. Select "Web Service"
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add environment variables from `.env.example`
5. Deploy

### 2. Railway.app

1. Connect your GitHub repository
2. Railway will auto-detect the Node.js app
3. Add environment variables in the Railway dashboard
4. Deploy automatically

### 3. Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Add environment variables in Vercel dashboard
5. Note: `vercel.json` is already configured

### 4. Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_ACCESS_SECRET=your_secret
   heroku config:set JWT_REFRESH_SECRET=your_secret
   heroku config:set CORS_ORIGIN=your_frontend_url
   ```
5. Deploy: `git push heroku main`

### 5. AWS/DigitalOcean/VPS

1. SSH into your server
2. Install Node.js and npm
3. Clone repository: `git clone your-repo-url`
4. Install dependencies: `npm install --production`
5. Create `.env` file with production values
6. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name bkbs-api
   pm2 save
   pm2 startup
   ```
7. Configure Nginx as reverse proxy (optional)

### 6. Docker

1. Build image: `docker build -t bkbs-backend .`
2. Run container:
   ```bash
   docker run -p 3000:3000 \
     -e MONGODB_URI=your_mongodb_uri \
     -e JWT_ACCESS_SECRET=your_secret \
     -e JWT_REFRESH_SECRET=your_secret \
     -e CORS_ORIGIN=your_frontend_url \
     bkbs-backend
   ```

## Required Environment Variables

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_strong_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_strong_secret_key_min_32_chars
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://your-frontend-domain.com
```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test database connection
- [ ] Run migrations: `npm run migrate`
- [ ] Test API health endpoint: `/api/health`
- [ ] Test authentication endpoints
- [ ] Verify CORS settings
- [ ] Check logs for errors
- [ ] Test rate limiting
- [ ] Monitor performance

## Database Setup (MongoDB Atlas)

1. Create account at mongodb.com/cloud/atlas
2. Create a new cluster
3. Add database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get connection string
6. Replace `<password>` with your password
7. Add `/bkbs` at the end for database name
8. Set as MONGODB_URI environment variable

## Troubleshooting

### Error: Cannot connect to database

- Verify MONGODB_URI is correct
- Check network access in MongoDB Atlas
- Ensure database user has correct permissions

### Error: JWT authentication failing

- Verify JWT secrets are set and match between deployments
- Check token expiration settings

### Error: CORS issues

- Verify CORS_ORIGIN matches your frontend URL
- Include protocol (https://) in CORS_ORIGIN
- Check for trailing slashes

### Port already in use

- Most platforms set PORT automatically
- Ensure your app uses `process.env.PORT`

## Monitoring

- Set up logging service (e.g., Papertrail, Loggly)
- Monitor API performance (e.g., New Relic, DataDog)
- Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- Enable error tracking (e.g., Sentry)

## Security Best Practices

- Never commit `.env` file
- Use strong, unique JWT secrets (minimum 32 characters)
- Enable HTTPS only
- Keep dependencies updated: `npm audit`
- Use rate limiting (already configured)
- Implement API versioning
- Add request logging
- Use helmet (already configured)
