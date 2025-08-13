import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from './models/User.js';
import { cryptoService } from './services/cryptoService.js';
import { newsService } from './services/newsService.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

class WebSocketServer {
  private io: SocketIOServer;
  private marketDataInterval: NodeJS.Timeout | null = null;
  private connectedUsers = new Map<string, string>(); // socketId -> userId
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startMarketDataBroadcast();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: any, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          // Allow anonymous connections for public market data
          socket.isAuthenticated = false;
          return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.userId).select(
          '_id email role isActive'
        );

        if (!user || !user.isActive) {
          return next(new Error('Authentication failed'));
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.isAuthenticated = true;

        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      console.log(`Client connected: ${socket.id}`);

      // Track authenticated users
      if (socket.isAuthenticated && socket.userId) {
        this.connectedUsers.set(socket.id, socket.userId);

        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set());
        }
        this.userSockets.get(socket.userId)!.add(socket.id);

        // Join user-specific room
        socket.join(`user:${socket.userId}`);

        // Send welcome message with user info
        socket.emit('authenticated', {
          userId: socket.userId,
          role: socket.userRole,
          timestamp: new Date(),
        });
      }

      // Subscribe to market data
      socket.on('subscribe:market', (data: { pairs?: string[] }) => {
        const pairs = data.pairs || [
          'BTC/USD',
          'ETH/USD',
          'BTC/ETH',
          'TRC20/USD',
        ];
        pairs.forEach((pair) => {
          socket.join(`market:${pair}`);
        });

        // Send current market data immediately
        this.sendCurrentMarketData(socket, pairs);
      });

      // Unsubscribe from market data
      socket.on('unsubscribe:market', (data: { pairs?: string[] }) => {
        const pairs = data.pairs || [
          'BTC/USD',
          'ETH/USD',
          'BTC/ETH',
          'TRC20/USD',
        ];
        pairs.forEach((pair) => {
          socket.leave(`market:${pair}`);
        });
      });

      // Subscribe to portfolio updates (authenticated users only)
      socket.on('subscribe:portfolio', () => {
        if (socket.isAuthenticated && socket.userId) {
          socket.join(`portfolio:${socket.userId}`);
          this.sendPortfolioUpdate(socket.userId);
        } else {
          socket.emit('error', {
            message: 'Authentication required for portfolio updates',
          });
        }
      });

      // Subscribe to trade updates (authenticated users only)
      socket.on('subscribe:trades', () => {
        if (socket.isAuthenticated && socket.userId) {
          socket.join(`trades:${socket.userId}`);
        } else {
          socket.emit('error', {
            message: 'Authentication required for trade updates',
          });
        }
      });

      // Subscribe to notifications (authenticated users only)
      socket.on('subscribe:notifications', () => {
        if (socket.isAuthenticated && socket.userId) {
          socket.join(`notifications:${socket.userId}`);
        } else {
          socket.emit('error', {
            message: 'Authentication required for notifications',
          });
        }
      });

      // Admin-only: Subscribe to admin updates
      socket.on('subscribe:admin', () => {
        if (socket.isAuthenticated && socket.userRole === 'admin') {
          socket.join('admin:updates');
          socket.emit('admin:connected', { timestamp: new Date() });
        } else {
          socket.emit('error', { message: 'Admin access required' });
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);

        if (socket.userId) {
          this.connectedUsers.delete(socket.id);

          const userSocketSet = this.userSockets.get(socket.userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
      });

      // Error handling
      socket.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private async sendCurrentMarketData(socket: any, pairs: string[]) {
    try {
      const marketData = await this.fetchMarketData();
      socket.emit('market:data', {
        pairs: marketData,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error sending current market data:', error);
      socket.emit('error', { message: 'Failed to fetch market data' });
    }
  }

  private async sendPortfolioUpdate(userId: string) {
    try {
      const user = await User.findById(userId).select('balances');
      if (!user) return;

      const marketData = await this.fetchMarketData();
      const portfolio = this.calculatePortfolioValue(user.balances, marketData);

      this.io.to(`portfolio:${userId}`).emit('portfolio:update', {
        portfolio,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error sending portfolio update:', error);
    }
  }

  private startMarketDataBroadcast() {
    // Broadcast market data every 30 seconds
    this.marketDataInterval = setInterval(async () => {
      try {
        const marketData = await this.fetchMarketData();

        // Broadcast to all market data subscribers
        Object.keys(marketData).forEach((pair) => {
          this.io.to(`market:${pair}`).emit('market:update', {
            pair,
            data: marketData[pair],
            timestamp: new Date(),
          });
        });

        // Update portfolios for connected users
        for (const userId of this.userSockets.keys()) {
          this.sendPortfolioUpdate(userId);
        }
      } catch (error) {
        console.error('Error broadcasting market data:', error);
      }
    }, 30000); // 30 seconds
  }

  private async fetchMarketData(): Promise<any> {
    try {
      const prices = await cryptoService.getCryptoPrices();

      const btcPrice = prices.find((p) => p.symbol === 'BTC');
      const ethPrice = prices.find((p) => p.symbol === 'ETH');
      const trxPrice = prices.find((p) => p.symbol === 'TRX');

      return {
        'BTC/USD': {
          price: btcPrice?.price || 50000,
          change24h: btcPrice?.change24h || 0,
          volume24h: btcPrice?.volume || 0,
          marketCap: btcPrice?.marketCap || 0,
        },
        'ETH/USD': {
          price: ethPrice?.price || 3000,
          change24h: ethPrice?.change24h || 0,
          volume24h: ethPrice?.volume || 0,
          marketCap: ethPrice?.marketCap || 0,
        },
        'BTC/ETH': {
          price: (btcPrice?.price || 50000) / (ethPrice?.price || 3000),
          change24h: (btcPrice?.change24h || 0) - (ethPrice?.change24h || 0),
          volume24h: 0,
          marketCap: 0,
        },
        'TRC20/USD': {
          price: trxPrice?.price || 0.12,
          change24h: trxPrice?.change24h || 0,
          volume24h: trxPrice?.volume || 0,
          marketCap: trxPrice?.marketCap || 0,
        },
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Return fallback data
      return {
        'BTC/USD': { price: 50000, change24h: 0, volume24h: 0, marketCap: 0 },
        'ETH/USD': { price: 3000, change24h: 0, volume24h: 0, marketCap: 0 },
        'BTC/ETH': { price: 16.67, change24h: 0, volume24h: 0, marketCap: 0 },
        'TRC20/USD': { price: 0.12, change24h: 0, volume24h: 0, marketCap: 0 },
      };
    }
  }

  private calculatePortfolioValue(balances: any, marketData: any): any {
    const totalValue =
      balances.BTC * marketData['BTC/USD'].price +
      balances.ETH * marketData['ETH/USD'].price +
      balances.TRC20 * marketData['TRC20/USD'].price +
      balances.USD;

    return {
      BTC: {
        balance: balances.BTC,
        usdValue: balances.BTC * marketData['BTC/USD'].price,
        price: marketData['BTC/USD'].price,
        percentage:
          totalValue > 0
            ? ((balances.BTC * marketData['BTC/USD'].price) / totalValue) * 100
            : 0,
      },
      ETH: {
        balance: balances.ETH,
        usdValue: balances.ETH * marketData['ETH/USD'].price,
        price: marketData['ETH/USD'].price,
        percentage:
          totalValue > 0
            ? ((balances.ETH * marketData['ETH/USD'].price) / totalValue) * 100
            : 0,
      },
      TRC20: {
        balance: balances.TRC20,
        usdValue: balances.TRC20 * marketData['TRC20/USD'].price,
        price: marketData['TRC20/USD'].price,
        percentage:
          totalValue > 0
            ? ((balances.TRC20 * marketData['TRC20/USD'].price) / totalValue) *
              100
            : 0,
      },
      USD: {
        balance: balances.USD,
        usdValue: balances.USD,
        price: 1,
        percentage: totalValue > 0 ? (balances.USD / totalValue) * 100 : 0,
      },
      total: totalValue,
    };
  }

  // Public methods for sending notifications
  public sendNotification(userId: string, notification: any) {
    this.io.to(`notifications:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });
  }

  public async sendNewsUpdate() {
    try {
      const news = await newsService.getCryptoNews(5);
      this.io.emit('news:update', {
        news,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error sending news update:', error);
    }
  }

  public sendTradeUpdate(userId: string, tradeData: any) {
    this.io.to(`trades:${userId}`).emit('trade:update', {
      ...tradeData,
      timestamp: new Date(),
    });
  }

  public sendAdminAlert(alertData: any) {
    this.io.to('admin:updates').emit('admin:alert', {
      ...alertData,
      timestamp: new Date(),
    });
  }

  public broadcastSystemMessage(
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ) {
    this.io.emit('system:message', {
      message,
      type,
      timestamp: new Date(),
    });
  }

  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  public isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public disconnect() {
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
    }
    this.io.close();
  }

  public getIO() {
    return this.io;
  }
}

export default WebSocketServer;
