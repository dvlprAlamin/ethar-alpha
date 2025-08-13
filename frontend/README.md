# Ethar Alpha Frontend

This is the frontend application for the Ethar Alpha cryptocurrency trading platform built with React, TypeScript, and Vite.

## Features

- Real-time cryptocurrency trading interface
- Portfolio management and tracking
- Live market data and charts
- News aggregation
- User authentication
- Responsive design with Tailwind CSS
- Real-time WebSocket connections

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- Socket.IO client for real-time communication
- Recharts for data visualization
- Lucide React for icons
- Axios for HTTP requests

## Environment Variables

Create a `.env` file with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001

# For production (Vercel deployment)
# VITE_API_URL=https://your-backend-url.railway.app
# VITE_WS_URL=https://your-backend-url.railway.app
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

5. Preview production build:
   ```bash
   npm run preview
   ```

6. Run type checking:
   ```bash
   npm run check
   ```

## Deployment to Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Vercel will automatically deploy on every push

### Vercel Environment Variables

Set these in your Vercel project settings:

- `VITE_API_URL` - Your Railway backend URL
- `VITE_WS_URL` - Your Railway backend URL (same as API URL)

### Vercel Configuration

The project includes a `vercel.json` file with:
- Build and output directory configuration
- API proxy rules for backend communication
- Security headers
- Environment variable setup

**Important**: Update the backend URL in `vercel.json` after deploying your backend to Railway.

## Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── store/              # Zustand state management
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

## Key Components

- **Dashboard**: Main trading interface with portfolio overview
- **Trading**: Buy/sell cryptocurrency interface
- **Portfolio**: Detailed portfolio management
- **News**: Cryptocurrency news aggregation
- **Profile**: User account management

## State Management

The application uses Zustand for state management with the following stores:

- `authStore`: User authentication state
- `portfolioStore`: Portfolio data and operations
- `marketStore`: Market data and prices
- `websocketStore`: WebSocket connection management

## Real-time Features

The application connects to the backend via WebSocket for:

- Live market data updates
- Portfolio value changes
- Trade notifications
- News updates

## Styling

The project uses Tailwind CSS for styling with:

- Responsive design patterns
- Dark/light theme support
- Custom color palette for crypto branding
- Component-based styling approach

## Performance Optimizations

- Code splitting with React.lazy
- Memoized components and hooks
- Optimized bundle size with Vite
- Efficient state updates with Zustand

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

When contributing to the frontend:

1. Follow the existing code style
2. Use TypeScript for type safety
3. Write responsive components
4. Test on multiple browsers
5. Update documentation as needed

## Support

For issues and questions, please check the main project repository.