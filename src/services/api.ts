/**
 * API Service
 * Centralized API calls to backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('obedio-auth-token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }

    return result.data as T;
  } catch (error) {
    console.error(`[API] ${endpoint}:`, error);
    throw error;
  }
}

// =====================
// CREW MEMBERS API
// =====================

export interface CrewMemberDTO {
  id: string;
  name: string;
  position: string;
  department: string;
  status: 'active' | 'on-duty' | 'off-duty' | 'on-leave';
  contact?: string | null;
  email?: string | null;
  joinDate?: string | null;
  role?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const crewApi = {
  /**
   * Get all crew members
   */
  getAll: () => fetchApi<CrewMemberDTO[]>('/crew'),

  /**
   * Create new crew member
   */
  create: (data: Partial<CrewMemberDTO>) =>
    fetchApi<CrewMemberDTO>('/crew', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update crew member
   */
  update: (id: string, data: Partial<CrewMemberDTO>) =>
    fetchApi<CrewMemberDTO>(`/crew/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete crew member
   */
  delete: (id: string) =>
    fetchApi<void>(`/crew/${id}`, {
      method: 'DELETE',
    }),
};

// =====================
// GUESTS API
// =====================

export interface GuestDTO {
  id: string;
  
  // Basic Info
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  photo?: string | null;
  type: 'owner' | 'vip' | 'guest' | 'partner' | 'family';
  status: 'expected' | 'onboard' | 'ashore' | 'departed';
  nationality?: string | null;
  languages?: string[];
  passportNumber?: string | null;
  
  // Accommodation
  locationId?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  
  // Dietary & Medical
  allergies?: string[];
  dietaryRestrictions?: string[];
  medicalConditions?: string[];
  
  // Preferences & Notes
  preferences?: string | null;
  notes?: string | null;
  
  // Emergency Contact
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  
  serviceRequests?: any[];
  createdAt: string;
  updatedAt: string;
}

// NOTE: Guest API operations have been moved to GuestsService in '../services/guests'
// which provides pagination, stats, filters, data cleaning, and CSV export.
// Use import { GuestsService } from '../services/guests' for all guest operations.

// =====================
// SERVICE REQUESTS API
// =====================

export interface ServiceRequestDTO {
  id: string;
  guestId: string;
  locationId?: string | null;
  requestType: 'call' | 'service' | 'emergency';
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'urgent' | 'emergency';
  message?: string | null;
  voiceTranscript?: string | null;
  voiceAudioUrl?: string | null;
  assignedToId?: string | null; // Backend uses assignedToId, not assignedCrewId
  assignedTo?: string | null; // Crew member name
  acceptedAt?: string | null; // When request was accepted
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export const serviceRequestsApi = {
  /**
   * Get all service requests
   */
  getAll: () => fetchApi<ServiceRequestDTO[]>('/service-requests'),

  /**
   * Get service request by ID
   */
  getById: (id: string) => fetchApi<ServiceRequestDTO>(`/service-requests/${id}`),

  /**
   * Create new service request
   */
  create: (data: Partial<ServiceRequestDTO>) =>
    fetchApi<ServiceRequestDTO>('/service-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update service request
   */
  update: (id: string, data: Partial<ServiceRequestDTO>) =>
    fetchApi<ServiceRequestDTO>(`/service-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Accept service request (assign to crew member)
   * Must provide crewMemberId to assign the request
   */
  accept: (id: string, crewMemberId: string) =>
    fetchApi<ServiceRequestDTO>(`/service-requests/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ crewMemberId }),
    }),

  /**
   * Complete service request
   */
  complete: (id: string) =>
    fetchApi<ServiceRequestDTO>(`/service-requests/${id}/complete`, {
      method: 'POST',
    }),

  /**
   * Cancel service request
   */
  cancel: (id: string) =>
    fetchApi<ServiceRequestDTO>(`/service-requests/${id}/cancel`, {
      method: 'POST',
    }),
};

// =====================
// DEVICES API
// =====================

export const devicesApi = {
  /**
   * Get all devices
   */
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchApi<any[]>(`/devices${query}`);
  },

  /**
   * Get single device by ID
   */
  getById: (id: string) => fetchApi<any>(`/devices/${id}`),

  /**
   * Create new device
   */
  create: (data: any) =>
    fetchApi<any>('/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update device
   */
  update: (id: string, data: any) =>
    fetchApi<any>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete device
   */
  delete: (id: string) =>
    fetchApi<void>(`/devices/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Get device config
   */
  getConfig: (id: string) => fetchApi<any>(`/devices/${id}/config`),

  /**
   * Update device config
   */
  updateConfig: (id: string, config: any) =>
    fetchApi<any>(`/devices/${id}/config`, {
      method: 'PUT',
      body: JSON.stringify({ config }),
    }),

  /**
   * Test device (send test signal)
   */
  test: (id: string) =>
    fetchApi<any>(`/devices/${id}/test`, {
      method: 'POST',
    }),

  /**
   * Get device logs (for specific device)
   */
  getLogs: (id: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchApi<any[]>(`/devices/${id}/logs${query}`);
  },

  /**
   * Get all device logs (global)
   */
  getAllLogs: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchApi<any>(`/devices/logs${query}`);
  },

  /**
   * Get device statistics
   */
  getStats: () => fetchApi<any>('/devices/stats/summary'),
};

// =====================
// SHIFTS API (Duty Roster)
// =====================

export interface ShiftDTO {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  description?: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const shiftsApi = {
  /**
   * Get all shifts
   */
  getAll: () => fetchApi<ShiftDTO[]>('/shifts'),

  /**
   * Get active shifts only
   */
  getActive: () => fetchApi<ShiftDTO[]>('/shifts/active'),

  /**
   * Get shift by ID
   */
  getById: (id: string) => fetchApi<ShiftDTO>(`/shifts/${id}`),

  /**
   * Create new shift
   */
  create: (data: Omit<ShiftDTO, 'id' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<ShiftDTO>('/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update shift
   */
  update: (id: string, data: Partial<ShiftDTO>) =>
    fetchApi<ShiftDTO>(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete shift
   */
  delete: (id: string) =>
    fetchApi<void>(`/shifts/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Toggle shift active status
   */
  toggleActive: (id: string, isActive: boolean) =>
    fetchApi<ShiftDTO>(`/shifts/${id}/toggle-active`, {
      method: 'POST',
      body: JSON.stringify({ isActive }),
    }),

  /**
   * Reorder shifts
   */
  reorder: (shifts: { id: string; order: number }[]) =>
    fetchApi<void>('/shifts/reorder', {
      method: 'POST',
      body: JSON.stringify({ shifts }),
    }),
};

// =====================
// ASSIGNMENTS API (Duty Roster)
// =====================

export interface AssignmentDTO {
  id: string;
  date: string; // ISO date string "2025-10-23"
  shiftId: string;
  crewMemberId: string;
  type: 'primary' | 'backup';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  shift?: ShiftDTO; // Populated when included
}

// =====================
// LOCATIONS API
// =====================

export interface LocationDTO {
  id: string;
  name: string;
  type: string;
  floor?: string;
  description?: string;
  image?: string;
  smartButtonId?: string;
  doNotDisturb?: boolean;
  createdAt?: string;
  updatedAt?: string;
  guests?: any[];
  serviceRequests?: any[];
}

export const locationsApi = {
  /**
   * Get all locations
   */
  getAll: (includeRelations = false) =>
    fetchApi<LocationDTO[]>(`/locations?include=${includeRelations}`),

  /**
   * Get single location by ID
   */
  getById: (id: string) => fetchApi<LocationDTO>(`/locations/${id}`),

  /**
   * Create new location
   */
  create: (data: Partial<LocationDTO>) =>
    fetchApi<LocationDTO>('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update location
   */
  update: (id: string, data: Partial<LocationDTO>) =>
    fetchApi<LocationDTO>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete location
   */
  delete: (id: string) =>
    fetchApi<void>(`/locations/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Toggle Do Not Disturb status
   */
  toggleDnd: (id: string, enabled: boolean) =>
    fetchApi<{ location: LocationDTO }>(`/locations/${id}/toggle-dnd`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),

  /**
   * Get all locations with DND enabled
   */
  getDndActive: () => fetchApi<LocationDTO[]>('/locations/dnd/active'),
};

export const assignmentsApi = {
  /**
   * Get all assignments with optional filters
   */
  getAll: (params?: {
    date?: string;
    shiftId?: string;
    crewMemberId?: string;
    type?: 'primary' | 'backup';
    startDate?: string;
    endDate?: string;
  }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return fetchApi<AssignmentDTO[]>(`/assignments${query}`);
  },

  /**
   * Get assignments for a specific date
   */
  getByDate: (date: string) => fetchApi<AssignmentDTO[]>(`/assignments/by-date/${date}`),

  /**
   * Get assignments for a week starting from date
   */
  getByWeek: (startDate: string) => fetchApi<AssignmentDTO[]>(`/assignments/by-week/${startDate}`),

  /**
   * Get assignments for a specific crew member
   */
  getByCrew: (crewMemberId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return fetchApi<AssignmentDTO[]>(`/assignments/crew/${crewMemberId}${query}`);
  },

  /**
   * Get assignment by ID
   */
  getById: (id: string) => fetchApi<AssignmentDTO>(`/assignments/${id}`),

  /**
   * Create new assignment
   */
  create: (data: Omit<AssignmentDTO, 'id' | 'createdAt' | 'updatedAt' | 'shift'>) =>
    fetchApi<AssignmentDTO>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Create multiple assignments at once
   */
  createBulk: (assignments: Omit<AssignmentDTO, 'id' | 'createdAt' | 'updatedAt' | 'shift'>[]) =>
    fetchApi<AssignmentDTO[]>('/assignments/bulk', {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    }),

  /**
   * Update assignment
   */
  update: (id: string, data: Partial<AssignmentDTO>) =>
    fetchApi<AssignmentDTO>(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete assignment
   */
  delete: (id: string) =>
    fetchApi<void>(`/assignments/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Delete all assignments for a specific date
   */
  deleteByDate: (date: string) =>
    fetchApi<void>(`/assignments/by-date/${date}`, {
      method: 'DELETE',
    }),

  /**
   * Delete assignments for a crew member
   */
  deleteByCrew: (crewMemberId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return fetchApi<void>(`/assignments/crew/${crewMemberId}${query}`, {
      method: 'DELETE',
    });
  },
};

// =====================
// EXPORT ALL
// =====================

export const api = {
  crew: crewApi,
  // guests: Use GuestsService from '../services/guests' instead
  serviceRequests: serviceRequestsApi,
  devices: devicesApi,
  shifts: shiftsApi,
  assignments: assignmentsApi,
  locations: locationsApi,

  // Direct methods for convenience
  get: (endpoint: string) => fetchApi<any>(endpoint),
  post: (endpoint: string, data?: any) =>
    fetchApi<any>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: (endpoint: string, data?: any) =>
    fetchApi<any>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: (endpoint: string) =>
    fetchApi<void>(endpoint, {
      method: 'DELETE',
    }),
};
