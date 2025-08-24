/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import path from 'path';
import {
  connectDB,
  initializeDatabase,
  getDatabaseStatus,
} from './models/index';
import { config, getEnvironmentSummary } from './config/environment';
import logger from './utils/logger';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import marketRoutes from './routes/market';
import marketDataRoutes from './routes/marketData';
import depositAddressRoutes from './routes/depositAddresses';
import depositsRoutes from './routes/deposits';
import withdrawalRoutes from './routes/withdrawals';
import tradeRoutes from './routes/trades';
import { schedulerService } from './services/schedulerService';

const app: express.Application = express();

// CORS configuration
const corsOptions = {
  origin: config.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

logger.info('CORS configured', { origin: config.CLIENT_URL });

app.use(cors({}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Register API routes (available even if database connection fails)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/deposit-addresses', depositAddressRoutes);
app.use('/api/deposits', depositsRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/market', marketRoutes);
app.use('/api', marketDataRoutes);

// Serve QR code images statically (backward compatibility)
app.use(
  '/qr-codes',
  express.static(path.join(__dirname, 'uploads', 'qr-codes'))
);

// Serve all uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log('✅ API routes registered successfully');

// Initialize database connection with retry logic
logger.dbInfo('Initializing database connection', {
  uri: config.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
});
connectDB(config.MONGODB_URI)
  .then((connection) => {
    if (connection) {
      console.log('✅ Database connected successfully');
      initializeDatabase().catch((error) => {
        console.error('❌ Database initialization failed:', error);
      });

      // Initialize scheduler service after database connection
      try {
        schedulerService.startScheduler();
        console.log('✅ Stock data scheduler initialized');
      } catch (error) {
        console.error('❌ Failed to initialize scheduler:', error);
      }
    } else {
      console.warn('⚠️ Server starting without database connection');
    }
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    console.log('🔄 Server will continue and attempt to reconnect...');
  });

/**
 * Enhanced health check endpoint for Railway deployment monitoring
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dbStatus = getDatabaseStatus();
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Determine overall health status
      const isHealthy = dbStatus.isConnected && dbStatus.readyState === 1;
      const statusCode = isHealthy ? 200 : 503;

      const healthData = {
        success: true,
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(uptime),
          human: `${Math.floor(uptime / 3600)}h ${Math.floor(
            (uptime % 3600) / 60
          )}m ${Math.floor(uptime % 60)}s`,
        },
        database: {
          connected: dbStatus.isConnected,
          readyState: dbStatus.readyState,
          readyStateText: getReadyStateText(dbStatus.readyState),
          host: dbStatus.host || 'unknown',
          name: dbStatus.name || 'unknown',
          connectionAttempts: dbStatus.connectionAttempts,
        },
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          nodeEnv: config.NODE_ENV,
          ...getEnvironmentSummary(),
        },
        message: isHealthy
          ? 'All systems operational'
          : 'Service degraded - database connection issues',
      };

      res.status(statusCode).json(healthData);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Helper function to convert mongoose ready state to human readable text
function getReadyStateText(readyState: number): string {
  switch (readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
}

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  const userId = (req as any).user?.id;

  logger.error('Request error', error, {
    requestId,
    userId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    error: 'Server internal error',
    requestId,
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';

  logger.warn('Route not found', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: 'API not found',
    requestId,
  });
});

export default app;
