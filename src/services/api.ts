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
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  photo?: string | null;
  type: 'owner' | 'vip' | 'guest';
  status: 'expected' | 'onboard' | 'ashore' | 'departed';
  nationality?: string | null;
  languages?: string[];
  passportNumber?: string | null;
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
// EXPORT ALL
// =====================

export const api = {
  crew: crewApi,
  guests: guestsApi,
  serviceRequests: serviceRequestsApi,
};
