/**
 * Comprehensive logging utility for Railway deployment debugging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogContext {
  timestamp: string;
  level: string;
  service: string;
  environment: string;
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

class Logger {
  private logLevel: LogLevel;
  private service: string;
  private environment: string;

  constructor() {
    this.service = 'ethar-backend';
    this.environment = process.env.NODE_ENV || 'development';
    
    // Set log level based on environment
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLogLevel) {
      case 'ERROR':
        this.logLevel = LogLevel.ERROR;
        break;
      case 'WARN':
        this.logLevel = LogLevel.WARN;
        break;
      case 'INFO':
        this.logLevel = LogLevel.INFO;
        break;
      case 'DEBUG':
        this.logLevel = LogLevel.DEBUG;
        break;
      default:
        this.logLevel = this.environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private createLogContext(level: string, extra: Record<string, any> = {}): LogContext {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      environment: this.environment,
      pid: process.pid,
      memory: this.getMemoryUsage(),
      uptime: process.uptime(),
      ...extra
    };
  }

  private getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024) // MB
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(message: string, context: LogContext): string {
    if (this.environment === 'production') {
      // Structured JSON logging for production (Railway)
      return JSON.stringify({ message, ...context });
    } else {
      // Human-readable logging for development
      const emoji = this.getLevelEmoji(context.level);
      const timestamp = new Date(context.timestamp).toLocaleTimeString();
      return `${emoji} [${timestamp}] ${context.level.toUpperCase()}: ${message}`;
    }
  }

  private getLevelEmoji(level: string): string {
    switch (level.toLowerCase()) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🐛';
      default: return '📝';
    }
  }

  error(message: string, error?: Error, extra: Record<string, any> = {}) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const context = this.createLogContext('error', {
      ...extra,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
    
    console.error(this.formatMessage(message, context));
  }

  warn(message: string, extra: Record<string, any> = {}) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const context = this.createLogContext('warn', extra);
    console.warn(this.formatMessage(message, context));
  }

  info(message: string, extra: Record<string, any> = {}) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const context = this.createLogContext('info', extra);
    console.log(this.formatMessage(message, context));
  }

  debug(message: string, extra: Record<string, any> = {}) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const context = this.createLogContext('debug', extra);
    console.log(this.formatMessage(message, context));
  }

  // Railway-specific logging methods
  railwayInfo(message: string, extra: Record<string, any> = {}) {
    this.info(`[RAILWAY] ${message}`, {
      ...extra,
      railway: {
        deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,
        serviceId: process.env.RAILWAY_SERVICE_ID,
        projectId: process.env.RAILWAY_PROJECT_ID,
        environment: process.env.RAILWAY_ENVIRONMENT
      }
    });
  }

  railwayError(message: string, error?: Error, extra: Record<string, any> = {}) {
    this.error(`[RAILWAY] ${message}`, error, {
      ...extra,
      railway: {
        deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,
        serviceId: process.env.RAILWAY_SERVICE_ID,
        projectId: process.env.RAILWAY_PROJECT_ID,
        environment: process.env.RAILWAY_ENVIRONMENT
      }
    });
  }

  // Database-specific logging
  dbInfo(message: string, extra: Record<string, any> = {}) {
    this.info(`[DATABASE] ${message}`, extra);
  }

  dbError(message: string, error?: Error, extra: Record<string, any> = {}) {
    this.error(`[DATABASE] ${message}`, error, extra);
  }

  // WebSocket-specific logging
  wsInfo(message: string, extra: Record<string, any> = {}) {
    this.info(`[WEBSOCKET] ${message}`, extra);
  }

  wsError(message: string, error?: Error, extra: Record<string, any> = {}) {
    this.error(`[WEBSOCKET] ${message}`, error, extra);
  }

  // Request logging middleware helper
  createRequestLogger(requestId: string, userId?: string) {
    return {
      info: (message: string, extra: Record<string, any> = {}) => 
        this.info(message, { ...extra, requestId, userId }),
      error: (message: string, error?: Error, extra: Record<string, any> = {}) => 
        this.error(message, error, { ...extra, requestId, userId }),
      warn: (message: string, extra: Record<string, any> = {}) => 
        this.warn(message, { ...extra, requestId, userId }),
      debug: (message: string, extra: Record<string, any> = {}) => 
        this.debug(message, { ...extra, requestId, userId })
    };
  }

  // System health logging
  logSystemHealth() {
    const health = {
      memory: this.getMemoryUsage(),
      uptime: process.uptime(),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : 'N/A (Windows)',
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    };
    
    this.info('System health check', { health });
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
export { Logger };