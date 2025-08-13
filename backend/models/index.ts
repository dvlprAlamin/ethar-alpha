// Export all models
export { default as User } from './User';
export { default as Transaction } from './Transaction';
export { default as Pool } from './Pool';
export { default as PoolInvestment } from './PoolInvestment';
export { default as TradeOrder } from './TradeOrder';
export { default as AdminConfig } from './AdminConfig';

// Export all interfaces
export type { IUser } from './User';
export type { ITransaction } from './Transaction';
export type { IPool } from './Pool';
export type { IPoolInvestment } from './PoolInvestment';
export type { ITradeOrder } from './TradeOrder';
export type { IAdminConfig } from './AdminConfig';

// Re-export mongoose for convenience
export { default as mongoose } from 'mongoose';

// Database connection utility
import mongoose from 'mongoose';

export const connectDB = async (mongoUri: string) => {
  try {
    const conn = await mongoose.connect(mongoUri, {
      // Modern connection options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Database initialization with default data
export const initializeDatabase = async () => {
  try {
    const AdminConfig = (await import('./AdminConfig')).default;
    const User = (await import('./User')).default;
    
    // Initialize admin config if it doesn't exist
    await AdminConfig.getConfig();
    console.log('Admin configuration initialized');
    
    // Check if admin user exists, create if not
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const adminUser = new User({
        email: 'admin@crypto-platform.com',
        passwordHash: 'admin123', // This will be hashed by the pre-save hook
        name: 'Platform Administrator',
        role: 'admin',
        twoFactorSecret: {
          isEnabled: false
        },
        balances: {
          BTC: 0,
          ETH: 0,
          TRC20: 0,
          USD: 0
        }
      });
      
      await adminUser.save();
      console.log('Default admin user created: admin@crypto-platform.com / admin123');
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Types are already exported above with their respective models