import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/index';
import speakeasy from 'speakeasy';
import logger from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// JWT Secret (should be in environment variables)
const JWT_SECRET =
  process.env.JWT_SECRET ||
  'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
export const generateToken = (
  userId: string,
  email: string,
  role: string
): string => {
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign({ userId, email, role }, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('[AUTH] Token expired', { error: error.message });
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('[AUTH] Invalid token format', { error: error.message });
      throw new Error('Invalid token');
    } else {
      logger.error(
        '[AUTH] Token verification failed',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('Token verification failed');
    }
  }
};

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(
        '[AUTH] Authentication failed: No authorization header or invalid format',
        {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        }
      );
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token || token.trim() === '') {
      logger.warn('[AUTH] Authentication failed: Empty token', {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      logger.warn('[AUTH] Authentication failed: User not found', {
        userId: decoded.userId,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      logger.warn('[AUTH] Authentication failed: User inactive', {
        userId: decoded.userId,
        email: user.email,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Return specific error message based on the error type
    if (errorMessage === 'Token expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    } else if (errorMessage === 'Invalid token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  }
};

// Admin authorization middleware
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
};

// 2FA utilities
export const generate2FASecret = (email: string) => {
  return speakeasy.generateSecret({
    name: `Crypto Platform (${email})`,
    issuer: 'Crypto Trading Platform',
    length: 32,
  });
};

export const verify2FAToken = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Allow 2 time steps (60 seconds) of variance
  });
};

// Generate QR code URL for 2FA setup
export const generate2FAQRCode = (secret: string, email: string): string => {
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret,
    label: email,
    issuer: 'Crypto Trading Platform',
    encoding: 'base32',
  });

  return otpauthUrl;
};

// Middleware to check 2FA if enabled
export const check2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // If 2FA is not enabled, proceed
    if (!req.user.twoFactorSecret?.isEnabled) {
      return next();
    }

    // Check for 2FA token in headers
    const twoFactorToken = req.headers['x-2fa-token'] as string;

    if (!twoFactorToken) {
      return res.status(401).json({
        success: false,
        message: '2FA token required',
        requires2FA: true,
      });
    }

    // Verify 2FA token
    const isValid = verify2FAToken(
      twoFactorToken,
      req.user.twoFactorSecret.secret
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA token',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying 2FA token',
    });
  }
};

// Rate limiting for authentication attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_AUTH_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const rateLimitAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  const attempts = authAttempts.get(clientIP);

  if (attempts) {
    // Reset if lockout period has passed
    if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
      authAttempts.delete(clientIP);
    } else if (attempts.count >= MAX_AUTH_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil(
          (LOCKOUT_DURATION - (now - attempts.lastAttempt)) / 1000
        ),
      });
    }
  }

  next();
};

export const recordAuthAttempt = (clientIP: string, success: boolean) => {
  if (success) {
    // Clear attempts on successful auth
    authAttempts.delete(clientIP);
  } else {
    // Increment failed attempts
    const attempts = authAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    authAttempts.set(clientIP, attempts);
  }
};

// Utility to extract user ID from token without full authentication
export const extractUserIdFromToken = (req: Request): string | null => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

// Middleware for optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);

    if (!token || token.trim() === '') {
      return next(); // Continue without user
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (user && user.isActive) {
      req.user = user;
    } else if (user && !user.isActive) {
      logger.info('[AUTH] Optional auth: User inactive', {
        userId: decoded.userId,
        email: user.email,
      });
    } else {
      logger.info('[AUTH] Optional auth: User not found', {
        userId: decoded.userId,
      });
    }

    next();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.debug('[AUTH] Optional auth error (continuing without user)', {
      error: errorMessage,
    });
    // Continue without user if token is invalid
    next();
  }
};
