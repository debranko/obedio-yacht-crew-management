/**
 * API Response Utilities
 * Standardized response formats for all API endpoints
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a standardized success response
 * @param data - The data to return
 * @param pagination - Optional pagination info
 * @returns Standardized success response
 */
export function apiSuccess<T>(
  data: T,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
}

/**
 * Create a standardized error response
 * @param error - Error message
 * @param code - Optional error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
 * @param details - Optional additional error details
 * @returns Standardized error response
 */
export function apiError(
  error: string,
  code?: string,
  details?: any
): ApiErrorResponse {
  const response: ApiErrorResponse = {
    success: false,
    error,
  };

  if (code) {
    response.code = code;
  }

  if (details) {
    response.details = details;
  }

  return response;
}

/**
 * Common error messages
 */
export const ErrorMessages = {
  // Authentication
  UNAUTHORIZED: 'Unauthorized. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INVALID_TOKEN: 'Invalid or expired token.',

  // Validation
  VALIDATION_FAILED: 'Validation failed. Please check your input.',
  REQUIRED_FIELD: (field: string) => `${field} is required.`,
  INVALID_FORMAT: (field: string) => `${field} has an invalid format.`,

  // Resources
  NOT_FOUND: (resource: string) => `${resource} not found.`,
  ALREADY_EXISTS: (resource: string) => `${resource} already exists.`,
  CANNOT_DELETE: (resource: string, reason: string) =>
    `Cannot delete ${resource}: ${reason}`,

  // Operations
  CREATE_FAILED: (resource: string) => `Failed to create ${resource}.`,
  UPDATE_FAILED: (resource: string) => `Failed to update ${resource}.`,
  DELETE_FAILED: (resource: string) => `Failed to delete ${resource}.`,
  FETCH_FAILED: (resource: string) => `Failed to fetch ${resource}.`,

  // General
  INTERNAL_ERROR: 'An internal server error occurred. Please try again later.',
  BAD_REQUEST: 'Invalid request. Please check your parameters.',
};

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Operations
  CREATE_FAILED: 'CREATE_FAILED',
  UPDATE_FAILED: 'UPDATE_FAILED',
  DELETE_FAILED: 'DELETE_FAILED',

  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
};
