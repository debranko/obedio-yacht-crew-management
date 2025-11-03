// Interior Department Teams
export type InteriorTeam =
  | 'Galley'
  | 'Pantry'
  | 'Housekeeping'
  | 'Laundry'
  | 'Bar Service'
  | 'Deck Service';

// Service Category Type
export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  order: number;
  isActive: boolean;
}

// Service Request Types (Guest Call Button System)
export interface ServiceRequest {
  id: string;
  guestName: string;
  guestCabin: string;
  cabinId: string;
  requestType: 'call' | 'service' | 'emergency';
  priority: 'normal' | 'urgent' | 'emergency';
  timestamp: Date;
  voiceTranscript?: string; // Voice-to-text transcript
  voiceAudioUrl?: string; // Original audio message URL
  cabinImage?: string; // Cabin rendering/photo URL
  status: 'pending' | 'accepted' | 'completed' | 'delegated' | 'forwarded';
  assignedTo?: string; // Crew member name
  categoryId?: string; // Service category ID (e.g., housekeeping, room-service)
  category?: ServiceCategory; // Populated category details
  forwardedToTeam?: InteriorTeam; // Team this was forwarded to
  acceptedAt?: Date;
  completedAt?: Date;
  forwardedAt?: Date;
  notes?: string; // Crew notes
}

// Service Request History
export interface ServiceRequestHistory {
  id: string;
  originalRequest: ServiceRequest;
  completedBy: string;
  completedAt: Date;
  duration: number; // seconds from accepted to completed
}

// Notification Settings Types
export interface NotificationSettings {
  enabled: boolean;
  shiftStartAdvanceTime: string; // e.g., "never", "15min", "30min", "1hour", "2hours", "1day"
  shiftEndAdvanceTime: string;
  shiftStartEnabled: boolean;
  shiftEndEnabled: boolean;
}

// User Preferences Types
export interface UserPreferences {
  serviceRequestDisplayMode: 'guest-name' | 'location';
  servingNowTimeout: number; // seconds before completed request disappears (default: 5)
  requestDialogRepeatInterval: number; // seconds between showing dialog for unaccepted requests (0 = never repeat)
}

// Message Types
export interface Message {
  id: string;
  from: string; // Sender name (e.g., "Chief Stewardess")
  to: string[]; // Recipient crew member names
  message: string;
  location?: string;
  priority: 'normal' | 'urgent' | 'emergency';
  timestamp: Date;
  deliveryStatus: 'sent' | 'delivered' | 'read';
}