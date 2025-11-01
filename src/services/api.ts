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
  nickname?: string | null;
  position: string;
  department: string;
  status: string;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  onBoardContact?: string | null;
  joinDate?: string | null;
  leaveStart?: string | null;
  leaveEnd?: string | null;
  languages?: string[];
  skills?: string[];
  role?: string | null;
  avatar?: string | null;
  color?: string;
  notes?: string | null;
  shift?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  // Only present in POST /crew response (when creating new crew)
  credentials?: {
    username: string;
    password: string;
    message: string;
  };
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
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'serving' | 'accepted' | 'delegated';
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
// MESSAGES API
// =====================

export interface MessageDTO {
  id: string;
  senderId: string;
  receiverId?: string | null; // null for broadcast messages
  content: string;
  type: 'text' | 'system' | 'alert' | 'notification';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated sender/receiver info
  sender?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    role?: string | null;
  };
  receiver?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    role?: string | null;
  };
}

export interface MessagesResponse {
  messages: MessageDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export const messagesApi = {
  /**
   * Get all messages for authenticated user
   */
  getAll: (params?: {
    type?: string;
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return fetchApi<MessagesResponse>(`/messages${query}`);
  },

  /**
   * Get conversation with specific user
   */
  getConversation: (otherUserId: string, params?: { limit?: number; offset?: number }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return fetchApi<MessageDTO[]>(`/messages/conversation/${otherUserId}${query}`);
  },

  /**
   * Send a message
   */
  send: (data: {
    receiverId?: string | null;
    content: string;
    type?: 'text' | 'system' | 'alert' | 'notification';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }) =>
    fetchApi<MessageDTO>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Mark message as read
   */
  markAsRead: (messageId: string) =>
    fetchApi<MessageDTO>(`/messages/${messageId}/read`, {
      method: 'PUT',
    }),

  /**
   * Mark all messages as read
   */
  markAllAsRead: () =>
    fetchApi<{ success: boolean; count: number }>('/messages/mark-all-read', {
      method: 'PUT',
    }),

  /**
   * Delete message
   */
  delete: (messageId: string) =>
    fetchApi<{ success: boolean }>(`/messages/${messageId}`, {
      method: 'DELETE',
    }),

  /**
   * Get unread message count
   */
  getUnreadCount: () => fetchApi<{ count: number }>('/messages/unread-count'),
};

// =====================
// EXPORT ALL
// =====================

export const api = {
  crew: crewApi,
  guests: guestsApi,
  serviceRequests: serviceRequestsApi,
  devices: devicesApi,
  shifts: shiftsApi,
  assignments: assignmentsApi,
  messages: messagesApi,

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
