/**
 * Error Handler Middleware
 * Centralized error handling for Express application
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger();

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
  }

  if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication required';
  }

  if (error.name === 'ForbiddenError') {
    statusCode = 403;
    code = 'FORBIDDEN';
    message = 'Insufficient permissions';
  }

  // Prisma specific errors
  if (error.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    code = 'DATABASE_ERROR';
    
    // Handle specific Prisma error codes
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
        message = 'Unique constraint violation';
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint violation';
        break;
      default:
        message = 'Database operation failed';
    }
  }

  // Log error
  const errorInfo = {
    method: req.method,
    url: req.url,
    statusCode,
    code,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    username: req.user?.username
  };

  if (statusCode >= 500) {
    logger.error('Server Error', error, errorInfo);
  } else {
    logger.warn('Client Error', errorInfo);
  }

  // Send error response
  const errorResponse: any = {
    error: message,
    code,
    timestamp: new Date().toISOString()
  };

  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = error.details;
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response) {
  const message = `Route ${req.method} ${req.path} not found`;
  
  logger.warn('Route Not Found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    error: message,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom API error
 */
export function createApiError(message: string, statusCode: number = 500, code?: string, details?: any): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Validation error helper
 */
export function createValidationError(message: string, details?: any): ApiError {
  return createApiError(message, 400, 'VALIDATION_ERROR', details);
}

/**
 * Not found error helper
 */
export function createNotFoundError(resource: string = 'Resource'): ApiError {
  return createApiError(`${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Unauthorized error helper
 */
export function createUnauthorizedError(message: string = 'Authentication required'): ApiError {
  return createApiError(message, 401, 'UNAUTHORIZED');
}

/**
 * Forbidden error helper
 */
export function createForbiddenError(message: string = 'Insufficient permissions'): ApiError {
  return createApiError(message, 403, 'FORBIDDEN');
}