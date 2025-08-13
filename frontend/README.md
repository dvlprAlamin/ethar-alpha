# Ethar Alpha - Crypto Trading Platform Frontend

A modern, responsive cryptocurrency trading platform frontend built with React, TypeScript, and Vite. This application provides real-time market data, portfolio management, and trading functionality with a sleek, professional interface.

## Features

- **Real-time Market Data**: Live cryptocurrency prices and charts
- **Portfolio Management**: Track your crypto holdings and performance
- **Trading Interface**: Buy and sell cryptocurrencies with ease
- **News Feed**: Latest cryptocurrency news and market updates
- **User Authentication**: Secure login and registration system
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light Theme**: Modern UI with theme switching
- **Real-time Notifications**: WebSocket-powered live updates

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: Zustand for lightweight state management
- **Routing**: React Router DOM for navigation
- **HTTP Client**: Axios for API communication
- **Real-time**: Socket.IO client for WebSocket connections
- **Icons**: Lucide React for beautiful icons
- **Notifications**: Sonner for toast notifications
- **Utilities**: clsx and tailwind-merge for conditional styling

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ethar-alpha/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_WS_URL=http://localhost:3000
   VITE_APP_NAME=Ethar Alpha
   VITE_APP_VERSION=1.0.0
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |
| `VITE_WS_URL` | WebSocket server URL | `http://localhost:3000` |
| `VITE_APP_NAME` | Application name | `Ethar Alpha` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint for code quality
- `npm run preview` - Preview production build locally

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── Layout.tsx      # Main layout component
│   └── ErrorBoundary.tsx
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Login.tsx       # Authentication pages
│   ├── Register.tsx
│   └── News.tsx        # News feed
├── store/              # Zustand stores
│   ├── authStore.ts    # Authentication state
│   └── websocketStore.ts # WebSocket connections
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

## Deployment to Vercel

1. **Connect Repository**:
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect it's a Vite project

2. **Environment Variables**:
   Set the following in your Vercel project settings:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   VITE_WS_URL=https://your-backend-url.railway.app
   VITE_APP_NAME=Ethar Alpha
   VITE_APP_VERSION=1.0.0
   ```

3. **Build Settings**:
   Vercel automatically configures:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**:
   Push to your main branch and Vercel will automatically deploy

## API Integration

The frontend integrates with the Ethar Alpha backend API for:

- **Authentication**: Login, register, and user management
- **Market Data**: Real-time cryptocurrency prices and charts
- **Portfolio**: User portfolio and balance management
- **Trading**: Execute buy/sell orders
- **News**: Cryptocurrency news and updates
- **WebSocket**: Real-time updates for prices, portfolio, and notifications

### API Endpoints Used

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/market/prices` - Get cryptocurrency prices
- `GET /api/market/news` - Get crypto news
- `GET /api/portfolio` - Get user portfolio
- `GET /api/trades` - Get user trades
- `POST /api/trades` - Create new trade

## WebSocket Events

The application subscribes to real-time events:

- `market:data` - Live price updates
- `portfolio:update` - Portfolio value changes
- `trade:update` - Trade status updates
- `news:update` - Latest news updates

## Development Guidelines

- Use TypeScript for all new code
- Follow the existing component structure
- Use Tailwind CSS for styling
- Implement responsive design patterns
- Add proper error handling and loading states
- Use Zustand for state management
- Follow React best practices and hooks patterns

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Please follow the established coding standards and submit pull requests for any improvements.

## Support

For issues and questions, please check the main project repository or contact the development team.
