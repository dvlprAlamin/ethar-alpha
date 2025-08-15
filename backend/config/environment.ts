/**
 * Environment configuration validation and defaults for Railway deployment
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Required environment variables
const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET'
] as const;

// Optional environment variables with defaults
interface EnvironmentConfig {
  // Database
  MONGODB_URI: string;
  
  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // Server
  PORT: number;
  NODE_ENV: string;
  
  // Client
  CLIENT_URL: string;
  SERVER_URL: string;
  
  // WebSocket
  WS_PORT: number;
  
  // Admin
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  
  // External APIs
  OPENSEA_API_KEY: string;
  STOCK_API_KEY: string;
  STOCK_API_BASE_URL: string;
  COINGECKO_API_BASE_URL: string;
}

/**
 * Validate and get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required environment variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }
  
  // Get configuration with defaults
  const config: EnvironmentConfig = {
    // Database - Required
    MONGODB_URI: process.env.MONGODB_URI || '',
    
    // Authentication - Required
    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    
    // Server configuration
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Client URLs - Railway auto-provides these
    CLIENT_URL: process.env.CLIENT_URL || 
                process.env.RAILWAY_STATIC_URL || 
                'http://localhost:5173',
    SERVER_URL: process.env.SERVER_URL || 
                process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` :
                `http://localhost:${process.env.PORT || 3001}`,
    
    // WebSocket
    WS_PORT: parseInt(process.env.WS_PORT || '3002', 10),
    
    // Admin defaults
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@crypto-platform.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
    
    // External API configuration
    OPENSEA_API_KEY: process.env.OPENSEA_API_KEY || '',
    STOCK_API_KEY: process.env.STOCK_API_KEY || '',
    STOCK_API_BASE_URL: process.env.STOCK_API_BASE_URL || 'https://www.alphavantage.co/query',
    COINGECKO_API_BASE_URL: process.env.COINGECKO_API_BASE_URL || 'https://api.coingecko.com/api/v3'
  };
  
  // Validate port numbers
  if (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    errors.push('PORT must be a valid number between 1 and 65535');
  }
  
  if (isNaN(config.WS_PORT) || config.WS_PORT < 1 || config.WS_PORT > 65535) {
    errors.push('WS_PORT must be a valid number between 1 and 65535');
  }
  
  // Check for Railway-specific environment
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
  
  if (isRailway) {
    console.log('🚂 Railway deployment detected');
    
    // Railway-specific validations
    if (!process.env.MONGODB_URI) {
      errors.push('MONGODB_URI is required for Railway deployment. Please add a MongoDB service or set the environment variable.');
    }
    
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required for Railway deployment. Please set this environment variable.');
    }
    
    // Log Railway-specific info
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      console.log(`🌐 Railway public domain: ${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    }
    
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log(`🏷️ Railway environment: ${process.env.RAILWAY_ENVIRONMENT}`);
    }
  }
  
  // Check for development environment warnings
  if (config.NODE_ENV === 'development') {
    if (config.JWT_SECRET === 'your-secret-key' || config.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be a strong secret in production');
    }
    
    if (config.ADMIN_PASSWORD === 'admin123') {
      warnings.push('Default admin password detected. Change ADMIN_PASSWORD for production.');
    }
  }
  
  // Log configuration status
  console.log('🔧 Environment Configuration:');
  console.log(`   NODE_ENV: ${config.NODE_ENV}`);
  console.log(`   PORT: ${config.PORT}`);
  console.log(`   WS_PORT: ${config.WS_PORT}`);
  console.log(`   CLIENT_URL: ${config.CLIENT_URL}`);
  console.log(`   SERVER_URL: ${config.SERVER_URL}`);
  console.log(`   MONGODB_URI: ${config.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
  console.log(`   JWT_SECRET: ${config.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`   OPENSEA_API_KEY: ${config.OPENSEA_API_KEY ? '✅ Set' : '⚠️ Missing (NFT data will use mock data)'}`);
  console.log(`   STOCK_API_KEY: ${config.STOCK_API_KEY ? '✅ Set' : '⚠️ Missing (Stock data will use mock data)'}`);
  
  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️ Configuration Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  // Handle errors
  if (errors.length > 0) {
    console.error('❌ Configuration Errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    
    if (isRailway || config.NODE_ENV === 'production') {
      throw new Error(`Environment configuration failed: ${errors.join(', ')}`);
    } else {
      console.warn('⚠️ Continuing with invalid configuration in development mode');
    }
  }
  
  return config;
}

/**
 * Get a summary of the current environment for health checks
 */
export function getEnvironmentSummary() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isRailway: !!process.env.RAILWAY_ENVIRONMENT,
    railwayEnvironment: process.env.RAILWAY_ENVIRONMENT,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    port: process.env.PORT || '3001',
    publicDomain: process.env.RAILWAY_PUBLIC_DOMAIN
  };
}

// Export the validated configuration
export const config = getEnvironmentConfig();

// Export individual values for convenience
export const {
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  PORT,
  NODE_ENV,
  CLIENT_URL,
  SERVER_URL,
  WS_PORT,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  OPENSEA_API_KEY,
  STOCK_API_KEY,
  STOCK_API_BASE_URL,
  COINGECKO_API_BASE_URL
} = config;