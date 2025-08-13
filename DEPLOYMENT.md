# Deployment Guide

This guide covers deploying the Ethar Alpha crypto trading platform with the frontend on Vercel and backend on Railway.

## Prerequisites

- Node.js 18+ installed
- Git repository with your code
- Vercel account (free tier available)
- Railway account (free tier available)
- MongoDB Atlas account (for production database)

## Environment Variables

### Backend (Railway)

Create these environment variables in your Railway project:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ethar-alpha

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# API Keys (Optional)
COINGECKO_API_KEY=your-coingecko-api-key
NEWS_API_KEY=your-news-api-key
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-api-key

# Server
PORT=3001
NODE_ENV=production

# CORS
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Frontend (Vercel)

Create these environment variables in your Vercel project:

```env
VITE_API_URL=https://your-railway-app.railway.app/api
```

## Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Configure Build Settings**
   - Railway will auto-detect Node.js
   - Ensure `railway.json` is in your root directory
   - Build command: `npm run server:build`
   - Start command: `npm run start:prod`

4. **Set Environment Variables**
   - Go to your project dashboard
   - Click "Variables" tab
   - Add all backend environment variables listed above
   - **Important**: Set `MONGODB_URI` to your MongoDB Atlas connection string

5. **Deploy**
   - Railway will automatically deploy on push to main branch
   - Note your Railway app URL (e.g., `https://your-app.railway.app`)

## Step 2: Setup MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create free cluster

2. **Configure Database**
   - Create database user
   - Whitelist Railway IP addresses (or use 0.0.0.0/0 for simplicity)
   - Get connection string

3. **Update Railway Environment**
   - Set `MONGODB_URI` to your Atlas connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/ethar-alpha`

## Step 3: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite framework

3. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Set Environment Variables**
   - In project settings, go to "Environment Variables"
   - Add: `VITE_API_URL` = `https://your-railway-app.railway.app/api`

5. **Deploy**
   - Click "Deploy"
   - Note your Vercel app URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update CORS Configuration

1. **Update Railway Environment**
   - Go to Railway project variables
   - Set `FRONTEND_URL` to your Vercel app URL
   - Example: `https://your-app.vercel.app`

2. **Redeploy Backend**
   - Railway will automatically redeploy with new environment variables

## Step 5: Test Deployment

1. **Test Backend**
   - Visit: `https://your-railway-app.railway.app/api/health`
   - Should return: `{"success": true, "message": "ok"}`

2. **Test Frontend**
   - Visit your Vercel app URL
   - Try logging in with default admin credentials:
     - Email: `admin@ethar.com`
     - Password: `admin123`

3. **Test Integration**
   - Ensure frontend can communicate with backend
   - Check browser console for CORS errors
   - Test real-time features (WebSocket connection)

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` is set correctly in Railway
   - Check that URLs don't have trailing slashes

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

3. **Build Failures**
   - Check build logs in Railway/Vercel dashboards
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

4. **Environment Variables**
   - Double-check all required variables are set
   - Ensure no typos in variable names
   - Restart deployments after adding variables

### Logs and Monitoring

- **Railway**: Check logs in project dashboard
- **Vercel**: Check function logs and build logs
- **MongoDB Atlas**: Monitor database connections and queries

## Production Considerations

1. **Security**
   - Use strong, unique JWT secrets
   - Enable MongoDB Atlas IP whitelisting
   - Consider adding rate limiting
   - Use HTTPS for all communications

2. **Performance**
   - Enable MongoDB Atlas connection pooling
   - Consider CDN for static assets
   - Monitor API response times

3. **Monitoring**
   - Set up error tracking (Sentry, LogRocket)
   - Monitor uptime (UptimeRobot, Pingdom)
   - Track user analytics

4. **Backup**
   - Enable MongoDB Atlas automated backups
   - Consider database replication
   - Regular data exports

## API Keys Setup (Optional)

For enhanced functionality, obtain these API keys:

1. **CoinGecko API** (for crypto prices)
   - Go to [coingecko.com/api](https://coingecko.com/api)
   - Free tier: 50 calls/minute

2. **NewsAPI** (for crypto news)
   - Go to [newsapi.org](https://newsapi.org)
   - Free tier: 1000 requests/day

3. **Alpha Vantage** (for stock data)
   - Go to [alphavantage.co](https://alphavantage.co)
   - Free tier: 5 calls/minute

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review deployment logs
3. Verify all environment variables
4. Test locally first

---

**Note**: This deployment uses free tiers of all services. For production use, consider upgrading to paid plans for better performance and reliability.