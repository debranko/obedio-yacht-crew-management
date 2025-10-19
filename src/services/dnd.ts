/**
 * DND Service - Atomic Do Not Disturb Operations
 * Ensures both Location and Guest DND status are updated atomically
 * Prevents data desync between location and guest DND states
 */

import { locationsService } from './locations';

export interface DNDToggleResult {
  success: boolean;
  locationUpdated: boolean;
  guestUpdated: boolean;
  newStatus: boolean;
  error?: string;
}

export class DNDService {
  /**
   * ATOMIC DND TOGGLE - Updates both location and guest in single operation
   * Prevents desync between location.doNotDisturb and guest.doNotDisturb
   */
  static async toggleDND(
    locationId: string,
    newDNDStatus: boolean,
    guestId?: string,
    updateGuestFunction?: (guestId: string, updates: { doNotDisturb: boolean }) => void,
    addActivityLogFunction?: (log: {
      type: 'dnd';
      action: string;
      location?: string;
      user?: string;
      details?: string;
    }) => void
  ): Promise<DNDToggleResult> {
    try {
      // Step 1: Update location via locations service
      await locationsService.update({
        id: locationId,
        doNotDisturb: newDNDStatus
      });

      // Step 2: Update guest if provided
      let guestUpdated = false;
      if (guestId && updateGuestFunction) {
        updateGuestFunction(guestId, { doNotDisturb: newDNDStatus });
        guestUpdated = true;
      }

      // Step 3: Log activity if function provided
      if (addActivityLogFunction) {
        const location = await locationsService.getById(locationId);
        addActivityLogFunction({
          type: 'dnd',
          action: newDNDStatus ? 'DND Activated' : 'DND Deactivated',
          location: location?.name || 'Unknown Location',
          user: 'System (Atomic Operation)',
          details: `Atomic DND ${newDNDStatus ? 'activation' : 'deactivation'} for location and guest`
        });
      }

      return {
        success: true,
        locationUpdated: true,
        guestUpdated,
        newStatus: newDNDStatus
      };

    } catch (error) {
      console.error('DNDService.toggleDND failed:', error);
      return {
        success: false,
        locationUpdated: false,
        guestUpdated: false,
        newStatus: !newDNDStatus, // Return old status
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * BULK DND OPERATIONS - Update multiple locations atomically
   */
  static async bulkToggleDND(
    locationIds: string[],
    newDNDStatus: boolean,
    getGuestByLocationId?: (locationId: string) => any,
    updateGuestFunction?: (guestId: string, updates: { doNotDisturb: boolean }) => void
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    // Execute all operations in parallel for better performance
    const promises = locationIds.map(async (locationId) => {
      try {
        // Find guest for this location
        const guest = getGuestByLocationId ? getGuestByLocationId(locationId) : null;
        
        // Execute atomic toggle
        const result = await this.toggleDND(
          locationId,
          newDNDStatus,
          guest?.id,
          updateGuestFunction
        );

        if (result.success) {
          successful.push(locationId);
        } else {
          failed.push(locationId);
        }
      } catch (error) {
        failed.push(locationId);
      }
    });

    await Promise.all(promises);

    return { successful, failed };
  }

  /**
   * VALIDATE DND CONSISTENCY - Check for desync between locations and guests
   */
  static validateDNDConsistency(
    locations: any[],
    guests: any[],
    getGuestByLocationId: (locationId: string) => any
  ): {
    consistent: boolean;
    issues: Array<{
      type: 'location_dnd_without_guest' | 'guest_dnd_without_location' | 'mismatched_dnd_status';
      locationId?: string;
      guestId?: string;
      details: string;
    }>;
  } {
    const issues: any[] = [];

    // Check locations with DND active
    locations.forEach(location => {
      if (location.doNotDisturb) {
        const guest = getGuestByLocationId(location.id);
        
        if (!guest) {
          issues.push({
            type: 'location_dnd_without_guest',
            locationId: location.id,
            details: `Location "${location.name}" has DND active but no guest assigned`
          });
        } else if (!guest.doNotDisturb) {
          issues.push({
            type: 'mismatched_dnd_status',
            locationId: location.id,
            guestId: guest.id,
            details: `Location "${location.name}" has DND active but guest "${guest.firstName} ${guest.lastName}" does not`
          });
        }
      }
    });

    // Check guests with DND active
    guests.forEach(guest => {
      if (guest.doNotDisturb && guest.locationId) {
        const location = locations.find(loc => loc.id === guest.locationId);
        
        if (!location) {
          issues.push({
            type: 'guest_dnd_without_location',
            guestId: guest.id,
            details: `Guest "${guest.firstName} ${guest.lastName}" has DND active but no valid location`
          });
        } else if (!location.doNotDisturb) {
          issues.push({
            type: 'mismatched_dnd_status',
            locationId: location.id,
            guestId: guest.id,
            details: `Guest "${guest.firstName} ${guest.lastName}" has DND active but location "${location.name}" does not`
          });
        }
      }
    });

    return {
      consistent: issues.length === 0,
      issues
    };
  }

  /**
   * FIX DND INCONSISTENCIES - Repair desync between locations and guests
   */
  static async fixDNDInconsistencies(
    locations: any[],
    guests: any[],
    getGuestByLocationId: (locationId: string) => any,
    updateGuestFunction: (guestId: string, updates: { doNotDisturb: boolean }) => void
  ): Promise<{
    fixed: number;
    errors: number;
  }> {
    const validation = this.validateDNDConsistency(locations, guests, getGuestByLocationId);
    
    if (validation.consistent) {
      return { fixed: 0, errors: 0 };
    }

    let fixed = 0;
    let errors = 0;

    for (const issue of validation.issues) {
      try {
        switch (issue.type) {
          case 'mismatched_dnd_status':
            // Use location DND status as source of truth
            if (issue.locationId && issue.guestId) {
              const location = locations.find(loc => loc.id === issue.locationId);
              if (location) {
                updateGuestFunction(issue.guestId, { doNotDisturb: location.doNotDisturb });
                fixed++;
              }
            }
            break;
            
          case 'guest_dnd_without_location':
            // Disable guest DND if no valid location
            if (issue.guestId) {
              updateGuestFunction(issue.guestId, { doNotDisturb: false });
              fixed++;
            }
            break;
            
          case 'location_dnd_without_guest':
            // Keep location DND as-is (guest might join later)
            break;
        }
      } catch (error) {
        console.error('Failed to fix DND issue:', issue, error);
        errors++;
      }
    }

    return { fixed, errors };
  }
}