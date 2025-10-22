/**
 * API Service
 * Centralized API calls to backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  
  console.log('🔐 API Call:', endpoint, { hasToken: !!token, token: token?.substring(0, 20) + '...' });
  
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
    console.error(`API Error [${endpoint}]:`, error);
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
  status: string;
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

export const guestsApi = {
  /**
   * Get all guests
   */
  getAll: () => fetchApi<GuestDTO[]>('/guests'),

  /**
   * Get single guest by ID
   */
  getById: (id: string) => fetchApi<GuestDTO>(`/guests/${id}`),

  /**
   * Create new guest
   */
  create: (data: Partial<GuestDTO>) =>
    fetchApi<GuestDTO>('/guests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update guest
   */
  update: (id: string, data: Partial<GuestDTO>) =>
    fetchApi<GuestDTO>(`/guests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete guest
   */
  delete: (id: string) =>
    fetchApi<void>(`/guests/${id}`, {
      method: 'DELETE',
    }),
};

// =====================
// SERVICE REQUESTS API
// =====================

export interface ServiceRequestDTO {
  id: string;
  guestId: string;
  locationId?: string | null;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'urgent' | 'emergency';
  message?: string | null;
  voiceTranscript?: string | null;
  voiceAudioUrl?: string | null;
  assignedCrewId?: string | null;
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
   */
  accept: (id: string, crewId: string) =>
    fetchApi<ServiceRequestDTO>(`/service-requests/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ crewId }),
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
   * Get device logs
   */
  getLogs: (id: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchApi<any[]>(`/devices/${id}/logs${query}`);
  },

  /**
   * Get device statistics
   */
  getStats: () => fetchApi<any>('/devices/stats/summary'),
};

// =====================
// EXPORT ALL
// =====================

export const api = {
  crew: crewApi,
  guests: guestsApi,
  serviceRequests: serviceRequestsApi,
  devices: devicesApi,
  
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
