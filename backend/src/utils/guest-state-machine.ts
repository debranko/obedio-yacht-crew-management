/**
 * Guest State Machine
 * Validates Guest status transitions according to business rules
 *
 * Valid transitions:
 * - expected → onboard (check-in)
 * - onboard → ashore (going ashore)
 * - ashore → onboard (returning from shore)
 * - onboard → departed (check-out)
 * - expected → departed (cancellation)
 */

export type GuestStatus = 'expected' | 'onboard' | 'ashore' | 'departed';

export interface GuestStatusTransition {
  from: GuestStatus;
  to: GuestStatus;
  action: string;
  requiresValidation?: boolean;
}

// Define all valid state transitions
const VALID_TRANSITIONS: GuestStatusTransition[] = [
  { from: 'expected', to: 'onboard', action: 'check-in', requiresValidation: true },
  { from: 'expected', to: 'departed', action: 'cancel', requiresValidation: false },
  { from: 'onboard', to: 'ashore', action: 'go-ashore', requiresValidation: false },
  { from: 'ashore', to: 'onboard', action: 'return-onboard', requiresValidation: false },
  { from: 'onboard', to: 'departed', action: 'check-out', requiresValidation: true },
];

/**
 * Check if a status transition is valid
 */
export function isValidTransition(fromStatus: GuestStatus, toStatus: GuestStatus): boolean {
  // Same status is always valid (no-op)
  if (fromStatus === toStatus) {
    return true;
  }

  return VALID_TRANSITIONS.some(
    (transition) => transition.from === fromStatus && transition.to === toStatus
  );
}

/**
 * Get allowed transitions from a given status
 */
export function getAllowedTransitions(currentStatus: GuestStatus): GuestStatusTransition[] {
  return VALID_TRANSITIONS.filter((transition) => transition.from === currentStatus);
}

/**
 * Get the action name for a transition
 */
export function getTransitionAction(fromStatus: GuestStatus, toStatus: GuestStatus): string | null {
  const transition = VALID_TRANSITIONS.find(
    (t) => t.from === fromStatus && t.to === toStatus
  );
  return transition ? transition.action : null;
}

/**
 * Validate a guest status update
 * Throws an error if the transition is invalid
 */
export function validateGuestStatusTransition(
  currentStatus: GuestStatus,
  newStatus: GuestStatus,
  guestName: string
): void {
  if (currentStatus === newStatus) {
    return; // No transition needed
  }

  if (!isValidTransition(currentStatus, newStatus)) {
    const allowedTransitions = getAllowedTransitions(currentStatus);
    const allowedStatusList = allowedTransitions.map((t) => `${t.to} (${t.action})`).join(', ');

    throw new Error(
      `Invalid status transition for guest "${guestName}": Cannot change from "${currentStatus}" to "${newStatus}". ` +
      `Allowed transitions: ${allowedStatusList || 'none'}`
    );
  }
}

/**
 * Additional validation for specific transitions
 */
export function validateCheckIn(checkInDate: Date, checkOutDate: Date): void {
  const now = new Date();

  if (checkInDate > checkOutDate) {
    throw new Error('Check-in date must be before check-out date');
  }

  if (checkOutDate < now) {
    throw new Error('Cannot check in a guest with a past check-out date');
  }
}

export function validateCheckOut(
  checkInDate: Date,
  checkOutDate: Date,
  actualCheckOutDate: Date = new Date()
): void {
  if (actualCheckOutDate < checkInDate) {
    throw new Error('Check-out date cannot be before check-in date');
  }
}

/**
 * Get user-friendly status description
 */
export function getStatusDescription(status: GuestStatus): string {
  const descriptions: Record<GuestStatus, string> = {
    expected: 'Expected to arrive',
    onboard: 'Currently onboard',
    ashore: 'Currently ashore',
    departed: 'Departed',
  };
  return descriptions[status];
}
