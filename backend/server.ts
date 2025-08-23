/**
 * Server entry file for local development and Railway deployment
 */
import { createServer } from 'http';
import app from './app.js';
import { config } from './config/environment.js';
import logger from './utils/logger.js';

/**
 * Start server with proper error handling for Railway deployment
 */
const PORT = config.PORT;

// Create HTTP server with error handling
const server = createServer(app);

// Server error handling
let hasTriedFallback = false;
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE' && !hasTriedFallback) {
    hasTriedFallback = true;
    logger.error(`Port ${PORT} is already in use`, error, { port: PORT });
    logger.info('Trying to find an available port...');

    // Try to start on a different port
    const fallbackPort = PORT + 1;
    const fallbackServer = createServer(app);

    fallbackServer.on('error', (fallbackError: NodeJS.ErrnoException) => {
      if (fallbackError.code === 'EADDRINUSE') {
        logger.railwayError(
          `Fallback port ${fallbackPort} is also in use`,
          fallbackError,
          {
            originalPort: PORT,
            fallbackPort,
          }
        );
        process.exit(1);
      } else {
        logger.railwayError('Fallback server error', fallbackError, {
          fallbackPort,
        });
        process.exit(1);
      }
    });

    fallbackServer.listen(fallbackPort, () => {
      logger.railwayInfo(`Server started on fallback port ${fallbackPort}`, {
      originalPort: PORT,
      fallbackPort,
      environment: config.NODE_ENV,
      healthCheck: `http://localhost:${fallbackPort}/api/health`,
    });
    });
  } else if (error.code === 'EADDRINUSE' && hasTriedFallback) {
    logger.railwayError('Both primary and fallback ports are in use', error, {
      primaryPort: PORT,
      fallbackPort: PORT + 1,
    });
    process.exit(1);
  } else {
    logger.railwayError('Server startup error', error, { port: PORT });
    process.exit(1);
  }
});

// Start the server
server.listen(PORT, () => {
  logger.railwayInfo('Server started successfully', {
    port: PORT,
    environment: config.NODE_ENV,
    serverUrl: config.SERVER_URL,
    clientUrl: config.CLIENT_URL,
    healthCheck: `http://localhost:${PORT}/api/health`,
  });

  if (config.NODE_ENV === 'production') {
    logger.railwayInfo('Production mode - Railway deployment detected');

    // Log system health in production
    logger.logSystemHealth();
  }
});

/**
 * Graceful shutdown handling for Railway deployment
 */
const gracefulShutdown = (signal: string) => {
  logger.railwayInfo(`${signal} signal received - starting graceful shutdown`, {
    signal,
  });

  // Set a timeout for forced shutdown
  const shutdownTimeout = setTimeout(() => {
    logger.railwayError('Forced shutdown due to timeout', undefined, {
      signal,
      timeoutMs: 10000,
    });
    process.exit(1);
  }, 10000); // 10 seconds timeout

  // Close HTTP server
  server.close((error) => {
    clearTimeout(shutdownTimeout);

    if (error) {
      logger.railwayError('Error during server shutdown', error, { signal });
      process.exit(1);
    } else {
      logger.railwayInfo('Server closed gracefully', { signal });
      process.exit(0);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.railwayError('Uncaught Exception detected', error, {
    type: 'uncaughtException',
    stack: error.stack,
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.railwayError(
    'Unhandled Promise Rejection detected',
    reason instanceof Error ? reason : new Error(String(reason)),
    {
      type: 'unhandledRejection',
      promise: promise.toString(),
      reason: String(reason),
    }
  );
  gracefulShutdown('UNHANDLED_REJECTION');
});



export default app; // Restart trigger
