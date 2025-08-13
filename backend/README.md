# Ethar Alpha Backend

This is the backend API for the Ethar Alpha cryptocurrency trading platform.

## Features

- Real-time WebSocket connections for market data
- User authentication and authorization
- Portfolio management
- News aggregation
- Cryptocurrency price tracking
- Trading functionality

## Tech Stack

- Node.js with TypeScript
- Express.js
- Socket.IO for real-time communication
- MongoDB with Mongoose
- JWT authentication
- External APIs (CoinGecko, CoinStats)

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.vercel.app

# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# External APIs
COINGECKO_API_KEY=your_coingecko_api_key
COINSTATS_API_KEY=your_coinstats_api_key

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with required environment variables

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Start production server:
   ```bash
   npm start
   ```

## Deployment to Railway

1. Connect your GitHub repository to Railway
2. Set up environment variables in Railway dashboard
3. Railway will automatically deploy using the `railway.toml` configuration
4. The app will be available at your Railway-provided URL

### Railway Environment Variables

Make sure to set these in your Railway project settings:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL` (your Vercel frontend URL)
- `COINGECKO_API_KEY` (optional)
- `COINSTATS_API_KEY` (optional)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Trading
- `GET /api/trades` - Get user trades
- `POST /api/trades` - Create new trade
- `GET /api/trades/:id` - Get specific trade

### Portfolio
- `GET /api/portfolio` - Get user portfolio
- `PUT /api/portfolio/balance` - Update balance

### Market Data
- `GET /api/market/prices` - Get cryptocurrency prices
- `GET /api/market/news` - Get crypto news

### WebSocket Events

#### Client to Server
- `subscribe:market` - Subscribe to market data updates
- `subscribe:portfolio` - Subscribe to portfolio updates
- `subscribe:trades` - Subscribe to trade updates
- `subscribe:notifications` - Subscribe to notifications

#### Server to Client
- `market:data` - Real-time market data
- `portfolio:update` - Portfolio value updates
- `trade:update` - Trade status updates
- `news:update` - Latest news updates

## Health Check

The server provides a health check endpoint at `/health` for monitoring.

## Security Features

- JWT-based authentication
- CORS configuration
- Rate limiting
- Input validation
- Secure headers

## Support

For issues and questions, please check the main project repository.