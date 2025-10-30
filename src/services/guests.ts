/**
 * Guests Service - Backend API Integration
 * Handles all guest operations with PostgreSQL database
 * Database-only for multi-platform support (Web/iOS/Android)
 */

import type { Guest } from '../contexts/AppDataContext';

export interface GuestListParams {
  q?: string;
  status?: string;
  type?: string;
  diet?: string;
  allergy?: string;
  cabin?: string;
  vip?: string;
  page: number;
  limit: number;
  sort?: string;
}

export interface GuestListResponse {
  items: Guest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GuestStatsResponse {
  onboard: number;
  expected: number;
  vip: number;
  dietaryAlerts: number;
}

export interface GuestMetaResponse {
  statuses: string[];
  types: string[];
  diets: string[];
  allergies: string[];
  cabins: string[];
}

export class GuestsService {
  private static baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/guests`;

  /**
   * Get JWT token for API authentication
   */
  private static getAuthToken(): string | null {
    return localStorage.getItem('obedio-auth-token');
  }

  /**
   * Clean guest data for backend API (remove frontend-only fields)
   */
  private static cleanGuestData(guestData: any): any {
    const {
      // Remove frontend-only fields
      cabin,
      checkInTime,
      checkOutTime,
      foodDislikes,
      favoriteFoods,
      favoriteDrinks,
      specialOccasion,
      specialOccasionDate,
      specialRequests,
      vipNotes,
      crewNotes,
      contactPerson,
      createdBy,
      // Keep the rest
      ...cleanedData
    } = guestData;

    // Convert empty photo to null only if photo field is being explicitly updated
    // Don't modify photo if it's not included in the update (undefined means "don't change")
    if ('photo' in guestData) {
      if (cleanedData.photo === undefined || cleanedData.photo === '') {
        cleanedData.photo = null;
      }
    }

    // Convert empty preferredName to null only if preferredName field is being explicitly updated
    if ('preferredName' in guestData) {
      if (cleanedData.preferredName === undefined || cleanedData.preferredName === '') {
        cleanedData.preferredName = null;
      }
    }

    // Convert dates to ISO datetime strings (backend expects full datetime, not just date)
    // Only process dates if they're being explicitly updated
    if ('checkInDate' in guestData && guestData.checkInDate) {
      const time = guestData.checkInTime || '00:00';
      cleanedData.checkInDate = new Date(`${guestData.checkInDate}T${time}:00`).toISOString();
    }

    if ('checkOutDate' in guestData && guestData.checkOutDate) {
      const time = guestData.checkOutTime || '23:59';
      cleanedData.checkOutDate = new Date(`${guestData.checkOutDate}T${time}:00`).toISOString();
    }

    return cleanedData;
  }

  /**
   * Make authenticated API request
   */
  private static async apiRequest(endpoint: string, options: RequestInit = {}) {
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
   * GET /guests - List guests with filtering, sorting, and pagination
   */
  static async list(params: GuestListParams): Promise<GuestListResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `?${queryString}` : '';
    
    const response = await this.apiRequest(endpoint);
    return {
      items: response.data,
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages
    };
  }

  /**
   * GET /guests/stats - Get KPI statistics from database
   */
  static async stats(): Promise<GuestStatsResponse> {
    const response = await this.apiRequest('/stats');
    return response.data;
  }

  /**
   * GET /meta/guests - Get metadata for filters from database
   */
  static async meta(): Promise<GuestMetaResponse> {
    const response = await this.apiRequest('/meta');
    return response.data;
  }

  /**
   * POST /guests - Create new guest in database
   */
  static async create(guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest> {
    const cleanedData = this.cleanGuestData(guestData);
    const response = await this.apiRequest('', {
      method: 'POST',
      body: JSON.stringify(cleanedData),
    });
    return response.data;
  }

  /**
   * PUT /guests/:id - Update guest in database
   */
  static async update(id: string, data: Partial<Guest>): Promise<Guest> {
    const cleanedData = this.cleanGuestData(data);
    const response = await this.apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanedData),
    });
    return response.data;
  }

  /**
   * DELETE /guests/:id - Delete guest from database
   */
  static async delete(id: string): Promise<void> {
    await this.apiRequest(`/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * GET /guests/:id - Get single guest from database
   */
  static async get(id: string): Promise<Guest | undefined> {
    try {
      const response = await this.apiRequest(`/${id}`);
      return response.data;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Export guests to CSV format
   */
  static exportToCsv(guests: Guest[]): string {
    const headers = [
      'Name',
      'Type',
      'Status',
      'Cabin',
      'Check-in',
      'Check-out',
      'Allergies',
      'Dietary Restrictions',
      'VIP Notes',
    ];

    const rows = guests.map(g => [
      `${g.firstName} ${g.lastName}`,
      g.type,
      g.status,
      g.cabin || '',
      g.checkInDate,
      g.checkOutDate,
      g.allergies.join('; '),
      g.dietaryRestrictions.join('; '),
      g.vipNotes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }
}
