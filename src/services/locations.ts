/**
 * Locations Service - Backend API Integration
 * Uses React Query for caching and real-time updates
 * Integrated with backend PostgreSQL database
 */

import { Location, LocationType, CreateLocationInput, UpdateLocationInput } from '../domain/locations';

// Define LocationStatus type based on domain
type LocationStatus = "active" | "maintenance" | "restricted";

// Additional types for API integration
export interface LocationsListResponse {
  success: boolean;
  data: Location[];
  count: number;
}

export interface LocationResponse {
  success: boolean;
  data: Location;
}

export interface LocationFilters {
  search?: string;
  type?: LocationType | 'All';
  status?: LocationStatus | 'All';
  floor?: string | 'All';
}

class LocationsService {
  private baseUrl = 'http://localhost:8080/api/locations';

  /**
   * Make authenticated API request
   * Auth handled via HTTP-only cookies (server runs 24/7)
   */
  private async apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Send HTTP-only cookie automatically
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }


  /**
   * Get all locations from database
   */
  async getAll(): Promise<Location[]> {
    const response: LocationsListResponse = await this.apiRequest('');
    return response.data;
  }

  /**
   * Get location by ID from database
   */
  async getById(id: string): Promise<Location | null> {
    try {
      const response: LocationResponse = await this.apiRequest(`/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get location by name from database
   */
  async getLocationByName(name: string): Promise<Location | undefined> {
    const locations = await this.getAll();
    return locations.find(location => 
      location.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Create new location in database
   */
  async create(input: CreateLocationInput): Promise<Location> {
    const response: LocationResponse = await this.apiRequest('', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.data;
  }

  /**
   * Update existing location in database
   */
  async update(input: UpdateLocationInput): Promise<Location | null> {
    try {
      const response: LocationResponse = await this.apiRequest(`/${input.id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete location from database
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.apiRequest(`/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update device count
   */
  async updateDeviceCount(locationId: string, count: number): Promise<void> {
    await this.update({ id: locationId, deviceCount: count });
  }

  /**
   * Update location image
   */
  async updateLocationImage(id: string, imageUrl: string): Promise<Location | null> {
    return this.update({ id, image: imageUrl });
  }

  /**
   * Get locations with DND active from database
   */
  async getDNDLocations(): Promise<Location[]> {
    const response: LocationsListResponse = await this.apiRequest('/dnd/active');
    return response.data;
  }

  /**
   * Toggle DND status (atomic operation via backend)
   */
  async toggleDND(locationId: string, enabled: boolean, guestId?: string): Promise<{ location: Location; guest?: any }> {
    const response = await this.apiRequest(`/${locationId}/toggle-dnd`, {
      method: 'POST',
      body: JSON.stringify({ enabled, guestId }),
    });
    return response.data;
  }

}

export const locationsService = new LocationsService();
