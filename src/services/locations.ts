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
  private baseUrl = 'http://localhost:3001/api/locations';
  private locations: Location[] = []; // Cache for backward compatibility
  private isInitialized = false;

  /**
   * Initialize with data (for backward compatibility)
   */
  initialize(data: Location[]) {
    this.locations = data;
    this.isInitialized = true;
    this.syncToLocalStorage();
  }

  /**
   * Get JWT token for API authentication
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('obedio-auth-token');
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken();
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  /**
   * Check if backend is available
   */
  private async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get all locations
   */
  async getAll(): Promise<Location[]> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        const response: LocationsListResponse = await this.apiRequest('');
        
        // Update local cache
        this.locations = response.data;
        this.syncToLocalStorage();
        
        return response.data;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    if (!this.isInitialized) {
      this.loadFromLocalStorage();
    }

    return [...this.locations];
  }

  /**
   * Get location by ID
   */
  async getById(id: string): Promise<Location | null> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        const response: LocationResponse = await this.apiRequest(`/${id}`);
        return response.data;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    if (!this.isInitialized) {
      this.loadFromLocalStorage();
    }

    return this.locations.find(location => location.id === id) || null;
  }

  /**
   * Get location by name
   */
  getLocationByName(name: string): Location | undefined {
    if (!this.isInitialized) {
      this.loadFromLocalStorage();
    }
    
    return this.locations.find(location => 
      location.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Create new location
   */
  async create(input: CreateLocationInput): Promise<Location> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        const response: LocationResponse = await this.apiRequest('', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        
        // Update local cache
        this.locations.push(response.data);
        this.syncToLocalStorage();
        
        return response.data;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    const newLocation: Location = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...input,
      deviceCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.locations.push(newLocation);
    this.syncToLocalStorage();

    return newLocation;
  }

  /**
   * Update existing location
   */
  async update(input: UpdateLocationInput): Promise<Location | null> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        const response: LocationResponse = await this.apiRequest(`/${input.id}`, {
          method: 'PUT',
          body: JSON.stringify(input),
        });
        
        // Update local cache
        const index = this.locations.findIndex(loc => loc.id === input.id);
        if (index !== -1) {
          this.locations[index] = response.data;
          this.syncToLocalStorage();
        }
        
        return response.data;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    if (!this.isInitialized) {
      this.loadFromLocalStorage();
    }

    const index = this.locations.findIndex(loc => loc.id === input.id);
    if (index === -1) return null;

    const updated: Location = {
      ...this.locations[index],
      ...input,
      updatedAt: new Date()
    };

    this.locations[index] = updated;
    this.syncToLocalStorage();
    return updated;
  }

  /**
   * Delete location
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        await this.apiRequest(`/${id}`, {
          method: 'DELETE',
        });
        
        // Update local cache
        this.locations = this.locations.filter(location => location.id !== id);
        this.syncToLocalStorage();
        return true;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    if (!this.isInitialized) {
      this.loadFromLocalStorage();
    }

    const initialLength = this.locations.length;
    this.locations = this.locations.filter(loc => loc.id !== id);
    if (this.locations.length < initialLength) {
      this.syncToLocalStorage();
      return true;
    }
    return false;
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
   * Get locations with DND active
   */
  async getDNDLocations(): Promise<Location[]> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        const response: LocationsListResponse = await this.apiRequest('/dnd/active');
        return response.data;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    if (!this.isInitialized) {
      this.loadFromLocalStorage();
    }

    return this.locations.filter(location => location.doNotDisturb);
  }

  /**
   * Toggle DND status (atomic operation via backend)
   */
  async toggleDND(locationId: string, enabled: boolean, guestId?: string): Promise<{ location: Location; guest?: any }> {
    try {
      // Try backend API first (atomic operation)
      if (await this.isBackendAvailable()) {
        const response = await this.apiRequest(`/${locationId}/toggle-dnd`, {
          method: 'POST',
          body: JSON.stringify({ enabled, guestId }),
        });
        
        // Update local cache
        const index = this.locations.findIndex(loc => loc.id === locationId);
        if (index !== -1) {
          this.locations[index] = response.data.location;
          this.syncToLocalStorage();
        }
        
        return response.data;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage (non-atomic)
    const location = await this.update({ id: locationId, doNotDisturb: enabled });
    return { location: location! };
  }

  /**
   * Sync to localStorage (backward compatibility)
   */
  private syncToLocalStorage() {
    try {
      localStorage.setItem('obedio-locations', JSON.stringify(this.locations));
    } catch (error) {
      console.error('Failed to sync locations to localStorage:', error);
    }
  }

  /**
   * Load from localStorage (backward compatibility)
   */
  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('obedio-locations');
      if (stored) {
        const parsed = JSON.parse(stored, (key, value) => 
          key === 'createdAt' || key === 'updatedAt' ? new Date(value) : value
        );
        this.locations = Array.isArray(parsed) ? parsed : [];
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to load locations from localStorage:', error);
      this.locations = [];
      this.isInitialized = true;
    }
  }
}

export const locationsService = new LocationsService();
