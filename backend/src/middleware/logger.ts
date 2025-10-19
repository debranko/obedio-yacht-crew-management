/**
 * Request Logger Middleware
 * Logs HTTP requests for monitoring and debugging
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger();

/**
 * HTTP request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Skip logging for health checks and static assets in production
  const skipLogging = process.env.NODE_ENV === 'production' && (
    req.path === '/api/health' ||
    req.path.startsWith('/static/') ||
    req.path.startsWith('/assets/') ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.css') ||
    req.path.endsWith('.png') ||
    req.path.endsWith('.jpg') ||
    req.path.endsWith('.ico')
  );

  if (skipLogging) {
    return next();
  }

  // Capture response completion
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log the request
    logger.httpRequest(
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      duration,
      req.get('User-Agent')
    );

    // Log request details in development
    if (process.env.ENABLE_DEBUG_LOGS === 'true') {
      const logData: any = {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentLength: res.get('Content-Length')
      };

      // Add user info if authenticated
      if (req.user) {
        logData.user = {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        };
      }

      // Add request body for POST/PUT/PATCH (excluding sensitive data)
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const sanitizedBody = sanitizeRequestBody(req.body);
        if (Object.keys(sanitizedBody).length > 0) {
          logData.requestBody = sanitizedBody;
        }
      }

      logger.debug('HTTP Request Details', logData);
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'authorization',
    'credit',
    'ssn',
    'passport'
  ];

  const sanitized = { ...body };

  // Remove sensitive fields
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeRequestBody(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * API response time middleware
 */
export function responseTimeMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    
    // Add response time header
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    
    // Log slow requests (over 1 second)
    if (duration > 1000) {
      logger.warn('Slow Request Detected', {
        method: req.method,
        url: req.originalUrl || req.url,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.user?.id,
        ip: req.ip
      });
    }
  });

  next();
}