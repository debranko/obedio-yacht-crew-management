/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF protection
 *
 * This middleware protects against CSRF attacks by validating that
 * state-changing requests include a CSRF token that matches a cookie.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'obedio-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a random CSRF token
 */
function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware to generate and set CSRF token
 * Should be applied to routes that render forms or return the CSRF token
 */
export function setCSRFToken(req: Request, res: Response, next: NextFunction): void {
  // Check if token already exists in cookie
  let token = req.cookies[CSRF_COOKIE_NAME];

  if (!token) {
    // Generate new token
    token = generateCSRFToken();

    // Set CSRF token in HTTP-only cookie
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  // Make token available to response (for API to return to client)
  res.locals.csrfToken = token;

  next();
}

/**
 * Middleware to verify CSRF token on state-changing requests
 * Should be applied to POST, PUT, PATCH, DELETE routes
 */
export function verifyCSRFToken(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get token from cookie
  const cookieToken = req.cookies[CSRF_COOKIE_NAME];

  // Get token from header
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  // Verify both tokens exist
  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      message: 'CSRF protection requires a valid token'
    });
  }

  // Verify tokens match
  if (cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token mismatch',
      message: 'Invalid CSRF token'
    });
  }

  next();
}

/**
 * Combined middleware that sets and verifies CSRF token
 * Use this on API routes that need both generation and verification
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  setCSRFToken(req, res, () => {
    verifyCSRFToken(req, res, next);
  });
}

/**
 * Route handler to get CSRF token
 * Frontend can call this endpoint to get a CSRF token before making state-changing requests
 */
export function getCSRFToken(req: Request, res: Response): void {
  const token = res.locals.csrfToken || req.cookies[CSRF_COOKIE_NAME];

  if (!token) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token'
    });
  }

  res.json({
    success: true,
    csrfToken: token
  });
}

/**
 * Example usage in routes:
 *
 * // Get CSRF token endpoint
 * router.get('/csrf-token', setCSRFToken, getCSRFToken);
 *
 * // Protected POST route
 * router.post('/guests', verifyCSRFToken, asyncHandler(async (req, res) => {
 *   // Route logic here
 * }));
 *
 * // Or apply to all routes in a router
 * router.use(csrfProtection);
 */
