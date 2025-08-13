/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { connectDB, initializeDatabase } from './models/index';
import authRoutes from './routes/auth';
import assetsRoutes from './routes/assets';
import depositRoutes from './routes/deposit';
import withdrawRoutes from './routes/withdraw';
import poolsRoutes from './routes/pools';
import tradeRoutes from './routes/trade';
import adminRoutes from './routes/admin';
import marketRoutes from './routes/market';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();

// Initialize database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-trading-platform';
connectDB(MONGODB_URI).then(() => {
  console.log('Database connected successfully');
  initializeDatabase().catch(console.error);
}).catch(console.error);

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/pools', poolsRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/market', marketRoutes);

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;