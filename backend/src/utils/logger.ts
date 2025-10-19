/**
 * Logger Utility - Winston-based logging for production
 * Supports file and console logging with different levels
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// Create Winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    
    // File output for production
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: parseInt(process.env.LOG_MAX_SIZE || '10485760'), // 10MB
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '5')
    }),
    
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: parseInt(process.env.LOG_MAX_SIZE || '10485760'), // 10MB
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '5')
    })
  ],
});

export class Logger {
  /**
   * Log debug message
   */
  debug(message: string, meta?: any) {
    winstonLogger.debug(message, meta);
  }

  /**
   * Log info message
   */
  info(message: string, meta?: any) {
    winstonLogger.info(message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: any) {
    winstonLogger.warn(message, meta);
  }

  /**
   * Log error message
   */
  error(message: string, error?: any, meta?: any) {
    if (error instanceof Error) {
      winstonLogger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      winstonLogger.error(message, { error, ...meta });
    }
  }

  /**
   * Log HTTP request
   */
  httpRequest(method: string, url: string, statusCode: number, responseTime: number, userAgent?: string) {
    this.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      userAgent
    });
  }

  /**
   * Log authentication event
   */
  authEvent(event: string, userId?: string, username?: string, ip?: string) {
    this.info('Auth Event', {
      event,
      userId,
      username,
      ip,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log database operation
   */
  dbOperation(operation: string, table: string, duration?: number, error?: any) {
    if (error) {
      this.error(`DB Operation Failed: ${operation} on ${table}`, error, { duration: duration ? `${duration}ms` : undefined });
    } else {
      this.debug(`DB Operation: ${operation} on ${table}`, { duration: duration ? `${duration}ms` : undefined });
    }
  }

  /**
   * Log real-time event
   */
  realtimeEvent(event: string, socketId?: string, userId?: string, data?: any) {
    this.debug('Real-time Event', {
      event,
      socketId,
      userId,
      data: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Log ESP32 smart button event
   */
  smartButtonEvent(deviceId: string, event: string, location?: string, data?: any) {
    this.info('Smart Button Event', {
      deviceId,
      event,
      location,
      data
    });
  }

  /**
   * Log system event
   */
  systemEvent(event: string, details?: any) {
    this.info('System Event', {
      event,
      details,
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Log server startup
logger.systemEvent('Logger initialized', {
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development'
});