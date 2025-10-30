/**
 * Input Length Validation Middleware
 * Protects against DOS attacks via excessively large inputs
 */

import { Request, Response, NextFunction } from 'express';

// Define maximum lengths for common field types
export const MAX_LENGTHS = {
  // Text fields
  name: 100,
  shortText: 255,
  mediumText: 1000,
  longText: 5000,
  description: 2000,

  // Specific fields
  email: 255,
  phone: 50,
  username: 50,
  password: 128,
  url: 2048,
  notes: 5000,
  message: 5000,

  // Identifiers
  id: 128,
  deviceId: 100,

  // Arrays
  maxArrayLength: 1000,
  maxStringArrayItemLength: 500,
};

interface ValidationRule {
  field: string;
  maxLength: number;
  required?: boolean;
  type?: 'string' | 'array' | 'number';
}

/**
 * Validate a single field value
 */
function validateField(
  value: any,
  rule: ValidationRule,
  fieldPath: string
): string | null {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return `${fieldPath} is required`;
  }

  // Skip validation if value is null/undefined and not required
  if (value === undefined || value === null) {
    return null;
  }

  // Validate by type
  if (rule.type === 'string' || typeof value === 'string') {
    if (value.length > rule.maxLength) {
      return `${fieldPath} exceeds maximum length of ${rule.maxLength} characters (got ${value.length})`;
    }
  }

  if (rule.type === 'array' || Array.isArray(value)) {
    if (value.length > MAX_LENGTHS.maxArrayLength) {
      return `${fieldPath} array exceeds maximum length of ${MAX_LENGTHS.maxArrayLength} items`;
    }

    // Validate array items if they're strings
    for (let i = 0; i < value.length; i++) {
      if (typeof value[i] === 'string' && value[i].length > MAX_LENGTHS.maxStringArrayItemLength) {
        return `${fieldPath}[${i}] exceeds maximum length of ${MAX_LENGTHS.maxStringArrayItemLength} characters`;
      }
    }
  }

  return null;
}

/**
 * Create a middleware that validates input lengths according to rules
 */
export function validateInputLengths(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];
      const error = validateField(value, rule, rule.field);

      if (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
}

/**
 * General middleware to protect against excessively large request bodies
 */
export function validateRequestSize(req: Request, res: Response, next: NextFunction): void {
  // Check if request body is too large (this is a safeguard on top of body-parser limits)
  const bodyStr = JSON.stringify(req.body);
  const bodySizeKB = Buffer.byteLength(bodyStr, 'utf8') / 1024;

  if (bodySizeKB > 500) { // 500 KB limit
    return res.status(413).json({
      success: false,
      error: 'Request body too large',
      message: `Request body size (${bodySizeKB.toFixed(2)} KB) exceeds maximum of 500 KB`
    });
  }

  next();
}

/**
 * Validate common guest fields
 */
export const guestInputValidation = validateInputLengths([
  { field: 'firstName', maxLength: MAX_LENGTHS.name, required: true, type: 'string' },
  { field: 'lastName', maxLength: MAX_LENGTHS.name, required: true, type: 'string' },
  { field: 'preferredName', maxLength: MAX_LENGTHS.name, type: 'string' },
  { field: 'nationality', maxLength: MAX_LENGTHS.shortText, type: 'string' },
  { field: 'passportNumber', maxLength: MAX_LENGTHS.shortText, type: 'string' },
  { field: 'specialRequests', maxLength: MAX_LENGTHS.longText, type: 'string' },
  { field: 'vipNotes', maxLength: MAX_LENGTHS.longText, type: 'string' },
  { field: 'crewNotes', maxLength: MAX_LENGTHS.longText, type: 'string' },
  { field: 'allergies', maxLength: MAX_LENGTHS.maxArrayLength, type: 'array' },
  { field: 'dietaryRestrictions', maxLength: MAX_LENGTHS.maxArrayLength, type: 'array' },
]);

/**
 * Validate crew member fields
 */
export const crewInputValidation = validateInputLengths([
  { field: 'name', maxLength: MAX_LENGTHS.name, required: true, type: 'string' },
  { field: 'position', maxLength: MAX_LENGTHS.shortText, required: true, type: 'string' },
  { field: 'department', maxLength: MAX_LENGTHS.shortText, required: true, type: 'string' },
  { field: 'email', maxLength: MAX_LENGTHS.email, type: 'string' },
  { field: 'contact', maxLength: MAX_LENGTHS.phone, type: 'string' },
  { field: 'role', maxLength: MAX_LENGTHS.shortText, type: 'string' },
]);

/**
 * Validate service request fields
 */
export const serviceRequestInputValidation = validateInputLengths([
  { field: 'requestType', maxLength: MAX_LENGTHS.shortText, required: true, type: 'string' },
  { field: 'notes', maxLength: MAX_LENGTHS.notes, type: 'string' },
  { field: 'voiceTranscript', maxLength: MAX_LENGTHS.longText, type: 'string' },
]);

/**
 * Validate message fields
 */
export const messageInputValidation = validateInputLengths([
  { field: 'content', maxLength: MAX_LENGTHS.message, required: true, type: 'string' },
]);

/**
 * Example usage:
 *
 * router.post('/guests', guestInputValidation, asyncHandler(async (req, res) => {
 *   // Create guest
 * }));
 *
 * router.post('/messages', messageInputValidation, asyncHandler(async (req, res) => {
 *   // Send message
 * }));
 */
