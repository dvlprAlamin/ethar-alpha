# Ethar Alpha Backend

A robust, scalable backend API for the Ethar Alpha cryptocurrency trading platform. Built with Node.js, TypeScript, and Express.js, providing real-time market data, secure authentication, portfolio management, and trading functionality with WebSocket support for live updates.

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

## Complete API Documentation

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account
- **Body**: `{ email: string, password: string, firstName: string, lastName: string }`
- **Response**: `{ success: boolean, message: string, user?: User, token?: string }`
- **Status Codes**: 201 (Created), 400 (Bad Request), 409 (Conflict)

#### `POST /api/auth/login`
Authenticate user and return JWT token
- **Body**: `{ email: string, password: string }`
- **Response**: `{ success: boolean, message: string, user?: User, token?: string }`
- **Status Codes**: 200 (OK), 400 (Bad Request), 401 (Unauthorized)

#### `POST /api/auth/logout`
Logout user (invalidate token)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean, message: string }`
- **Status Codes**: 200 (OK), 401 (Unauthorized)

#### `GET /api/auth/me`
Get current authenticated user information
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean, user: User }`
- **Status Codes**: 200 (OK), 401 (Unauthorized)

### Trading Endpoints

#### `GET /api/trades`
Get user's trading history with pagination
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `{ page?: number, limit?: number, status?: string }`
- **Response**: `{ success: boolean, trades: Trade[], pagination: PaginationInfo }`
- **Status Codes**: 200 (OK), 401 (Unauthorized)

#### `POST /api/trades`
Create a new trade order
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ symbol: string, type: 'buy'|'sell', amount: number, price?: number }`
- **Response**: `{ success: boolean, trade: Trade, message: string }`
- **Status Codes**: 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Insufficient Funds)

#### `GET /api/trades/:id`
Get specific trade details
- **Headers**: `Authorization: Bearer <token>`
- **Params**: `{ id: string }`
- **Response**: `{ success: boolean, trade: Trade }`
- **Status Codes**: 200 (OK), 401 (Unauthorized), 404 (Not Found)

#### `PUT /api/trades/:id/cancel`
Cancel a pending trade order
- **Headers**: `Authorization: Bearer <token>`
- **Params**: `{ id: string }`
- **Response**: `{ success: boolean, trade: Trade, message: string }`
- **Status Codes**: 200 (OK), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found)

### Portfolio Endpoints

#### `GET /api/portfolio`
Get user's complete portfolio information
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean, portfolio: Portfolio, totalValue: number, holdings: Holding[] }`
- **Status Codes**: 200 (OK), 401 (Unauthorized)

#### `PUT /api/portfolio/balance`
Update user's account balance (admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ amount: number, operation: 'add'|'subtract'|'set' }`
- **Response**: `{ success: boolean, newBalance: number, message: string }`
- **Status Codes**: 200 (OK), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden)

#### `GET /api/portfolio/history`
Get portfolio value history for charts
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `{ period?: '1d'|'7d'|'30d'|'1y' }`
- **Response**: `{ success: boolean, history: PortfolioHistory[] }`
- **Status Codes**: 200 (OK), 401 (Unauthorized)

### Market Data Endpoints

#### `GET /api/market/prices`
Get current cryptocurrency prices
- **Query**: `{ symbols?: string[], limit?: number }`
- **Response**: `{ success: boolean, prices: CryptoPrice[], lastUpdated: string }`
- **Status Codes**: 200 (OK), 500 (External API Error)

#### `GET /api/market/prices/:symbol`
Get detailed price information for specific cryptocurrency
- **Params**: `{ symbol: string }`
- **Query**: `{ period?: '1h'|'24h'|'7d'|'30d' }`
- **Response**: `{ success: boolean, price: DetailedPrice, history: PriceHistory[] }`
- **Status Codes**: 200 (OK), 404 (Not Found), 500 (External API Error)

#### `GET /api/market/news`
Get latest cryptocurrency news with pagination
- **Query**: `{ page?: number, limit?: number, category?: string }`
- **Response**: `{ success: boolean, news: NewsArticle[], pagination: PaginationInfo }`
- **Status Codes**: 200 (OK), 500 (External API Error)

#### `GET /api/market/trending`
Get trending cryptocurrencies
- **Response**: `{ success: boolean, trending: TrendingCrypto[] }`
- **Status Codes**: 200 (OK), 500 (External API Error)

### Admin Endpoints

#### `GET /api/admin/users`
Get all users (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Query**: `{ page?: number, limit?: number, search?: string }`
- **Response**: `{ success: boolean, users: User[], pagination: PaginationInfo }`
- **Status Codes**: 200 (OK), 401 (Unauthorized), 403 (Forbidden)

#### `PUT /api/admin/users/:id/status`
Update user status (admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Params**: `{ id: string }`
- **Body**: `{ status: 'active'|'suspended'|'banned' }`
- **Response**: `{ success: boolean, user: User, message: string }`
- **Status Codes**: 200 (OK), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

## WebSocket Events Documentation

### Client to Server Events

#### `subscribe:market`
Subscribe to real-time market data updates
- **Payload**: `{ symbols?: string[] }` (optional, subscribes to all if not provided)
- **Response**: `market:subscribed` event with confirmation

#### `unsubscribe:market`
Unsubscribe from market data updates
- **Payload**: `{ symbols?: string[] }` (optional, unsubscribes from all if not provided)
- **Response**: `market:unsubscribed` event with confirmation

#### `subscribe:portfolio`
Subscribe to portfolio value updates (requires authentication)
- **Payload**: `{ token: string }`
- **Response**: `portfolio:subscribed` event with current portfolio data

#### `subscribe:trades`
Subscribe to trade status updates (requires authentication)
- **Payload**: `{ token: string }`
- **Response**: `trades:subscribed` event with confirmation

#### `subscribe:notifications`
Subscribe to general notifications (requires authentication)
- **Payload**: `{ token: string }`
- **Response**: `notifications:subscribed` event with confirmation

### Server to Client Events

#### `market:data`
Real-time cryptocurrency price updates
- **Payload**: `{ symbol: string, price: number, change24h: number, volume: number, timestamp: string }`
- **Frequency**: Every 5-10 seconds for subscribed symbols

#### `portfolio:update`
Portfolio value and holdings updates
- **Payload**: `{ totalValue: number, holdings: Holding[], change24h: number, timestamp: string }`
- **Frequency**: When portfolio value changes significantly or trades are executed

#### `trade:update`
Trade execution and status updates
- **Payload**: `{ tradeId: string, status: TradeStatus, executedPrice?: number, timestamp: string }`
- **Frequency**: When trade status changes (pending → executed → completed)

#### `news:update`
Latest cryptocurrency news updates
- **Payload**: `{ article: NewsArticle, category: string, timestamp: string }`
- **Frequency**: When new important news is published

#### `notification`
General user notifications
- **Payload**: `{ type: NotificationType, title: string, message: string, data?: any, timestamp: string }`
- **Types**: `trade_executed`, `price_alert`, `portfolio_milestone`, `system_maintenance`

#### `error`
WebSocket error messages
- **Payload**: `{ code: string, message: string, details?: any }`
- **Common Codes**: `AUTH_REQUIRED`, `INVALID_TOKEN`, `SUBSCRIPTION_FAILED`, `RATE_LIMIT_EXCEEDED`

### WebSocket Connection Flow

1. **Connect**: Client establishes WebSocket connection
2. **Authenticate**: Send token for user-specific subscriptions
3. **Subscribe**: Subscribe to desired event channels
4. **Receive**: Handle incoming real-time data
5. **Unsubscribe**: Clean up subscriptions before disconnect
6. **Disconnect**: Close connection gracefully

### Rate Limiting

- **Connection**: Max 5 connections per IP
- **Subscriptions**: Max 10 subscriptions per connection
- **Messages**: Max 100 messages per minute per connection

## Database Schema

### User Model
```typescript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed),
  firstName: string,
  lastName: string,
  role: 'user' | 'admin',
  status: 'active' | 'suspended' | 'banned',
  balance: number,
  createdAt: Date,
  updatedAt: Date,
  lastLogin?: Date
}
```

### Trade Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  symbol: string,
  type: 'buy' | 'sell',
  amount: number,
  price: number,
  executedPrice?: number,
  status: 'pending' | 'executed' | 'cancelled' | 'failed',
  txHash?: string,
  createdAt: Date,
  executedAt?: Date
}
```

### Portfolio Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  holdings: [{
    symbol: string,
    amount: number,
    averagePrice: number,
    lastUpdated: Date
  }],
  totalValue: number,
  lastUpdated: Date
}
```

## Health Check & Monitoring

The server provides comprehensive health check endpoints:

- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed system status including database connectivity
- `GET /metrics` - Application metrics for monitoring tools

## Security Features

- **JWT Authentication**: Secure token-based authentication with configurable expiration
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Rate Limiting**: Express rate limiter to prevent abuse
- **Input Validation**: Comprehensive request validation using Joi/Zod
- **Secure Headers**: Helmet.js for security headers
- **Environment Variables**: Sensitive data stored in environment variables
- **SQL Injection Prevention**: Mongoose ODM with parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **HTTPS Enforcement**: Redirect HTTP to HTTPS in production
- **API Key Management**: Secure external API key handling

## Error Handling

The API uses consistent error response format:

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  },
  timestamp: string
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - Missing or invalid token
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `INSUFFICIENT_FUNDS` - Not enough balance for trade
- `EXTERNAL_API_ERROR` - Third-party service error
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - Internal server error

## Performance Optimization

- **Database Indexing**: Optimized indexes for frequent queries
- **Connection Pooling**: MongoDB connection pooling
- **Caching**: Redis caching for frequently accessed data
- **Compression**: Gzip compression for API responses
- **Pagination**: Efficient pagination for large datasets
- **WebSocket Optimization**: Efficient real-time data broadcasting
- **Memory Management**: Proper cleanup and garbage collection

## Support

For issues and questions, please check the main project repository.