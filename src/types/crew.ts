// Crew Management Types
export interface CrewMemberExtended {
  id: string;
  name: string;
  nickname?: string;
  position: string;
  department: string;
  status?: 'active' | 'on-duty' | 'off-duty' | 'on-leave';
  shift?: string;
  contact?: string;
  email?: string;
  phone?: string;
  onBoardContact?: string; // On-board contact (radio, intercom, etc.)
  joinDate?: string;
  role?: string;

  // Visual identification
  avatar?: string;  // Avatar image URL
  color?: string;   // Color for visual identification in UI (default: #C8A96B)

  // Leave tracking
  leaveStart?: string; // YYYY-MM-DD format
  leaveEnd?: string;   // YYYY-MM-DD format

  // Additional info
  languages?: string[];
  skills?: string[];
  notes?: string;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

// Role & Permission Types
export type Role = "admin" | "chief-stewardess" | "stewardess" | "crew" | "eto";

export interface RolePermissions {
  role: Role;
  permissions: string[];
}

// Device Assignment Types
export interface CrewDeviceAssignment {
  id: string;
  crewMemberId: string;
  crewMemberName: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'watch' | 'tablet' | 'phone' | 'other';
  assignedAt: Date;
  status: 'connected' | 'disconnected' | 'low-battery';
  lastSync: Date;
}

// Crew Change Types
export interface CrewChange {
  crewMember: string;
  changeType: 'added' | 'removed' | 'moved_to_backup' | 'moved_to_primary';
  date: string;
  shift: string;
  details?: string;
}

export interface CrewChangeLog {
  id: string;
  timestamp: Date;
  crewMember: string;
  changeType: 'added' | 'removed' | 'moved_to_backup' | 'moved_to_primary';
  date: string;
  shift: string;
  performedBy: string;
  notified: boolean;
  details?: string;
}