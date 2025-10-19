/**
 * Guests Service - Backend API Integration
 * Handles all guest operations with PostgreSQL database
 * Falls back to localStorage if backend unavailable
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
  private static baseUrl = 'http://localhost:3001/api/guests';
  private static allGuests: Guest[] = [];

  /**
   * Get JWT token for API authentication
   */
  private static getAuthToken(): string | null {
    return localStorage.getItem('obedio-auth-token');
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
   * Check if backend is available
   */
  private static async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Initialize service with data from AppDataContext (backward compatibility)
   */
  static setGuestsData(guests: Guest[]) {
    this.allGuests = guests;
  }

  /**
   * Filter and sort guests based on query parameters (localStorage fallback)
   */
  private static filterGuests(params: GuestListParams): Guest[] {
    // Get data from localStorage for fallback
    if (this.allGuests.length === 0) {
      const stored = localStorage.getItem('obedio-guests');
      if (stored) {
        try {
          this.allGuests = JSON.parse(stored);
        } catch (e) {
          this.allGuests = [];
        }
      }
    }

    let filtered = [...this.allGuests];

    // Search filter
    if (params.q) {
      const query = params.q.toLowerCase();
      filtered = filtered.filter(g =>
        g.firstName.toLowerCase().includes(query) ||
        g.lastName.toLowerCase().includes(query) ||
        g.preferredName?.toLowerCase().includes(query) ||
        g.cabin?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (params.status && params.status !== 'All') {
      filtered = filtered.filter(g => g.status === params.status);
    }

    // Type filter
    if (params.type && params.type !== 'All') {
      filtered = filtered.filter(g => g.type === params.type);
    }

    // VIP filter
    if (params.vip && params.vip !== 'All') {
      if (params.vip === 'vip') {
        filtered = filtered.filter(g => g.type === 'vip' || g.type === 'owner');
      }
    }

    // Dietary restrictions filter
    if (params.diet && params.diet !== 'All') {
      if (params.diet === 'has-dietary') {
        filtered = filtered.filter(g => g.dietaryRestrictions.length > 0);
      } else if (params.diet === 'no-dietary') {
        filtered = filtered.filter(g => g.dietaryRestrictions.length === 0);
      } else {
        filtered = filtered.filter(g => g.dietaryRestrictions.includes(params.diet!));
      }
    }

    // Allergy filter
    if (params.allergy && params.allergy !== 'All') {
      if (params.allergy === 'has-allergies') {
        filtered = filtered.filter(g => g.allergies.length > 0);
      } else if (params.allergy === 'no-allergies') {
        filtered = filtered.filter(g => g.allergies.length === 0);
      } else {
        filtered = filtered.filter(g => g.allergies.includes(params.allergy!));
      }
    }

    // Cabin filter
    if (params.cabin && params.cabin !== 'All') {
      filtered = filtered.filter(g => g.cabin === params.cabin);
    }

    // Sorting
    if (params.sort) {
      const [field, direction] = params.sort.split(':');
      filtered.sort((a, b) => {
        let aVal: any = a[field as keyof Guest];
        let bVal: any = b[field as keyof Guest];

        // Handle date fields
        if (field === 'checkinAt') {
          aVal = new Date(a.checkInDate).getTime();
          bVal = new Date(b.checkInDate).getTime();
        } else if (field === 'checkoutAt') {
          aVal = new Date(a.checkOutDate).getTime();
          bVal = new Date(b.checkOutDate).getTime();
        } else if (field === 'name') {
          aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
          bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
        }

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }

  /**
   * GET /guests - List guests with filtering, sorting, and pagination
   */
  static async list(params: GuestListParams): Promise<GuestListResponse> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
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
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    await new Promise(resolve => setTimeout(resolve, 100));

    const filtered = this.filterGuests(params);
    const total = filtered.length;
    const totalPages = Math.ceil(total / params.limit);
    
    // Pagination
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;
    const items = filtered.slice(start, end);

    return {
      items,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
    };
  }

  /**
   * GET /guests/stats - Get KPI statistics
   */
  static async stats(): Promise<GuestStatsResponse> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        const response = await this.apiRequest('/stats');
        return response.data;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    await new Promise(resolve => setTimeout(resolve, 50));

    // Get data from localStorage if allGuests is empty
    if (this.allGuests.length === 0) {
      const stored = localStorage.getItem('obedio-guests');
      if (stored) {
        try {
          this.allGuests = JSON.parse(stored);
        } catch (e) {
          this.allGuests = [];
        }
      }
    }

    const onboard = this.allGuests.filter(g => g.status === 'onboard').length;
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const expected = this.allGuests.filter(g => {
      if (g.status !== 'expected') return false;
      const checkInDate = new Date(g.checkInDate);
      return checkInDate >= today && checkInDate <= nextWeek;
    }).length;

    const vip = this.allGuests.filter(g => 
      g.status === 'onboard' && (g.type === 'vip' || g.type === 'owner')
    ).length;

    const guestsWithAllergies = this.allGuests.filter(g => 
      g.status === 'onboard' && g.allergies.length > 0
    );
    const dietaryAlerts = guestsWithAllergies.reduce((sum, guest) => 
      sum + guest.allergies.length, 0
    );

    return {
      onboard,
      expected,
      vip,
      dietaryAlerts,
    };
  }

  /**
   * GET /meta/guests - Get metadata for filters
   */
  static async meta(): Promise<GuestMetaResponse> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        const response = await this.apiRequest('/meta');
        return response.data;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    await new Promise(resolve => setTimeout(resolve, 50));

    // Get data from localStorage if allGuests is empty
    if (this.allGuests.length === 0) {
      const stored = localStorage.getItem('obedio-guests');
      if (stored) {
        try {
          this.allGuests = JSON.parse(stored);
        } catch (e) {
          this.allGuests = [];
        }
      }
    }

    // Extract unique values from all guests
    const statuses = Array.from(new Set(this.allGuests.map(g => g.status)));
    const types = Array.from(new Set(this.allGuests.map(g => g.type)));
    const dietsSet = new Set<string>();
    const allergiesSet = new Set<string>();
    const cabinsSet = new Set<string>();

    this.allGuests.forEach(g => {
      g.dietaryRestrictions.forEach(d => dietsSet.add(d));
      g.allergies.forEach(a => allergiesSet.add(a));
      if (g.cabin) cabinsSet.add(g.cabin);
    });

    return {
      statuses,
      types,
      diets: Array.from(dietsSet).sort(),
      allergies: Array.from(allergiesSet).sort(),
      cabins: Array.from(cabinsSet).sort(),
    };
  }

  /**
   * POST /guests - Create new guest
   */
  static async create(guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        const response = await this.apiRequest('', {
          method: 'POST',
          body: JSON.stringify(guestData),
        });
        return response.data;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    const newGuest: Guest = {
      ...guestData,
      id: `guest-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const stored = localStorage.getItem('obedio-guests');
    let guests: Guest[] = [];
    
    if (stored) {
      try {
        guests = JSON.parse(stored);
      } catch (e) {
        guests = [];
      }
    }

    guests.unshift(newGuest);
    localStorage.setItem('obedio-guests', JSON.stringify(guests));
    this.allGuests = guests;

    return newGuest;
  }

  /**
   * PUT /guests/:id - Update guest
   */
  static async update(id: string, data: Partial<Guest>): Promise<Guest> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        const response = await this.apiRequest(`/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        return response.data;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    const stored = localStorage.getItem('obedio-guests');
    let guests: Guest[] = [];
    
    if (stored) {
      try {
        guests = JSON.parse(stored);
      } catch (e) {
        guests = [];
      }
    }

    const index = guests.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Guest not found');
    }

    guests[index] = {
      ...guests[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('obedio-guests', JSON.stringify(guests));
    this.allGuests = guests;
    return guests[index];
  }

  /**
   * DELETE /guests/:id - Delete guest
   */
  static async delete(id: string): Promise<void> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        await this.apiRequest(`/${id}`, {
          method: 'DELETE',
        });
        return;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    const stored = localStorage.getItem('obedio-guests');
    let guests: Guest[] = [];
    
    if (stored) {
      try {
        guests = JSON.parse(stored);
      } catch (e) {
        guests = [];
      }
    }

    guests = guests.filter(g => g.id !== id);
    localStorage.setItem('obedio-guests', JSON.stringify(guests));
    this.allGuests = guests;
  }

  /**
   * GET /guests/:id - Get single guest
   */
  static async get(id: string): Promise<Guest | undefined> {
    try {
      // Try backend API first
      if (await this.isBackendAvailable()) {
        const response = await this.apiRequest(`/${id}`);
        return response.data;
      }
    } catch (error) {
      console.warn('Backend API unavailable, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (this.allGuests.length === 0) {
      const stored = localStorage.getItem('obedio-guests');
      if (stored) {
        try {
          this.allGuests = JSON.parse(stored);
        } catch (e) {
          this.allGuests = [];
        }
      }
    }
    
    return this.allGuests.find(g => g.id === id);
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
