// Export all models
export { default as User } from './User';
export { default as AdminConfig } from './AdminConfig';
export { default as Stock } from './Stock';
export { default as DepositAddress } from './DepositAddress';
export { Withdrawal } from './Withdrawal';

// Export all interfaces
export type { IUser } from './User';
export type { IAdminConfig } from './AdminConfig';
export type { IStock } from './Stock';
export type { IDepositAddress } from './DepositAddress';
export type { IWithdrawal } from './Withdrawal';

// Re-export mongoose for convenience
export { default as mongoose } from 'mongoose';

// Database connection utility
import mongoose from 'mongoose';
import logger from '../utils/logger';

// Database connection state
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

export const connectDB = async (
  mongoUri: string,
  retryAttempt = 0
): Promise<typeof mongoose | null> => {
  try {
    // If already connected, return existing connection
    if (isConnected && mongoose.connection.readyState === 1) {
      console.log('Using existing MongoDB connection');
      return mongoose;
    }

    logger.dbInfo('Attempting to connect to MongoDB', {
      attempt: retryAttempt + 1,
      maxRetries: MAX_RETRY_ATTEMPTS,
    });

    const conn = await mongoose.connect(mongoUri, {
      // Modern connection options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });

    isConnected = true;
    connectionAttempts = 0;
    logger.dbInfo('MongoDB connected successfully', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState,
    });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.dbError('MongoDB connection error', err, {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
      });
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.dbInfo('MongoDB disconnected', {
        readyState: mongoose.connection.readyState,
        wasConnected: isConnected,
      });
      isConnected = false;
      // Attempt to reconnect after disconnection
      setTimeout(() => {
        if (!isConnected) {
          logger.dbInfo('Attempting to reconnect to MongoDB', {
            reconnectDelayMs: 5000,
          });
          connectDB(mongoUri, 0).catch((err) => {
            logger.dbError('Failed to reconnect to MongoDB', err as Error);
          });
        }
      }, 5000);
    });

    mongoose.connection.on('reconnected', () => {
      logger.dbInfo('MongoDB reconnected', {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
      });
      isConnected = true;
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        isConnected = false;
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
      }
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    return conn;
  } catch (error) {
    isConnected = false;
    connectionAttempts++;
    logger.dbError('MongoDB connection failed', error as Error, {
      attempt: retryAttempt + 1,
      maxRetries: MAX_RETRY_ATTEMPTS,
    });

    // Retry logic with exponential backoff
    if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, retryAttempt);
      logger.dbInfo(`Retrying MongoDB connection`, {
        attempt: retryAttempt + 1,
        maxRetries: MAX_RETRY_ATTEMPTS,
        delayMs: delay,
        nextAttemptIn: `${delay}ms`,
      });

      return new Promise((resolve) => {
        setTimeout(async () => {
          const result = await connectDB(mongoUri, retryAttempt + 1);
          resolve(result);
        }, delay);
      });
    } else {
      logger.dbError(
        'All MongoDB connection attempts failed',
        new Error('Max retries exceeded'),
        {
          totalAttempts: MAX_RETRY_ATTEMPTS,
          finalError: 'Max retries exceeded',
          serverStatus: 'continuing without database',
        }
      );
      return null;
    }
  }
};

// Get current database connection status
export const getDatabaseStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    connectionAttempts,
  };
};

// Database initialization with default data
export const initializeDatabase = async () => {
  try {
    const AdminConfig = (await import('./AdminConfig')).default;
    const User = (await import('./User')).default;

    // Initialize admin config if it doesn't exist
    await AdminConfig.getConfig();
    logger.dbInfo('Admin configuration initialized');

    // Check if admin user exists, create if not
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const adminUser = new User({
        email: 'admin@crypto-platform.com',
        passwordHash: 'admin123', // This will be hashed by the pre-save hook
        name: 'Platform Administrator',
        role: 'admin',
        twoFactorSecret: {
          isEnabled: false,
        },
        balances: {
          BTC: 0,
          ETH: 0,
          TRC20: 0,
          USD: 0,
        },
      });

      await adminUser.save();
      logger.dbInfo('Default admin user created successfully', {
        email: 'admin@crypto-platform.com',
        userId: adminUser._id,
      });
    } else {
      logger.dbInfo('Default admin user already exists', {
        email: 'admin@crypto-platform.com',
      });
    }

    logger.dbInfo('Database initialization completed');
  } catch (error) {
    logger.dbError('Error during database initialization', error as Error);
  }
};

// Types are already exported above with their respective models
