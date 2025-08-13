# Ethar Alpha - Cryptocurrency Trading Platform

A full-stack cryptocurrency trading platform with real-time market data, portfolio management, and news aggregation.

## Project Structure

This project has been restructured for independent deployment:

```
ethar-alpha/
├── frontend/           # React + Vite frontend application
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   ├── package.json   # Frontend dependencies
│   ├── vercel.json    # Vercel deployment config
│   └── README.md      # Frontend documentation
├── backend/           # Node.js + Express backend API
│   ├── api/           # API routes and services
│   ├── package.json   # Backend dependencies
│   ├── railway.toml   # Railway deployment config
│   └── README.md      # Backend documentation
└── README.md          # This file
```

## Features

### Frontend
- 🎯 Real-time trading interface
- 📊 Portfolio management and tracking
- 📈 Live market data and charts
- 📰 Cryptocurrency news aggregation
- 🔐 User authentication
- 📱 Responsive design
- ⚡ Real-time WebSocket connections

### Backend
- 🚀 RESTful API with Express.js
- 🔌 WebSocket server for real-time data
- 🔒 JWT-based authentication
- 💾 MongoDB database integration
- 📡 External API integrations (CoinGecko, CoinStats)
- 🛡️ Security middleware and CORS

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Zustand (state management)
- Socket.IO client
- Recharts (charts)
- Axios (HTTP client)

### Backend
- Node.js + TypeScript
- Express.js
- Socket.IO server
- MongoDB + Mongoose
- JWT authentication
- External APIs integration

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- API keys for CoinGecko and CoinStats (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ethar-alpha
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run dev
   ```

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Deployment

### Frontend Deployment (Vercel)

1. **Prepare for deployment**
   - Update `VITE_API_URL` in `frontend/vercel.json` with your Railway backend URL
   - Ensure all environment variables are configured

2. **Deploy to Vercel**
   ```bash
   cd frontend
   npm i -g vercel
   vercel login
   vercel
   ```

3. **Configure Vercel**
   - Set environment variables in Vercel dashboard
   - Update `vercel.json` with your backend URL

### Backend Deployment (Railway)

1. **Prepare for deployment**
   - Ensure `railway.toml` is configured
   - Set up environment variables

2. **Deploy to Railway**
   - Connect your GitHub repository to Railway
   - Configure environment variables in Railway dashboard
   - Railway will automatically deploy using the configuration

3. **Environment Variables for Railway**
   ```env
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=https://your-frontend-url.vercel.app
   COINGECKO_API_KEY=your_api_key
   COINSTATS_API_KEY=your_api_key
   ```

## Environment Configuration

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/ethar-alpha
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
COINGECKO_API_KEY=your-api-key
COINSTATS_API_KEY=your-api-key
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Trading Endpoints
- `GET /api/trades` - Get user trades
- `POST /api/trades` - Create new trade

### Market Data Endpoints
- `GET /api/market/prices` - Get cryptocurrency prices
- `GET /api/market/news` - Get crypto news

### WebSocket Events
- `market:data` - Real-time market updates
- `portfolio:update` - Portfolio changes
- `news:update` - Latest news

## Development Workflow

1. **Make changes** to frontend or backend
2. **Test locally** with both servers running
3. **Build and test** production builds
4. **Deploy** to respective platforms
5. **Update environment variables** as needed

## Monitoring and Maintenance

- **Frontend**: Monitor via Vercel dashboard
- **Backend**: Monitor via Railway dashboard
- **Database**: Monitor MongoDB Atlas (if using cloud)
- **APIs**: Monitor external API usage and limits

## Security Considerations

- All API keys stored as environment variables
- JWT tokens for authentication
- CORS properly configured
- Input validation on all endpoints
- Rate limiting implemented
- Secure headers configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue in the repository.

---

**Note**: This project structure allows for independent deployment of frontend and backend, making it suitable for modern cloud deployment strategies.
