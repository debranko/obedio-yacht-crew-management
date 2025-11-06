// Crew Management Types
export interface CrewMemberExtended {
  id: string;
  name: string;
  position: string;
  department: string;
  status?: 'on-duty' | 'off-duty' | 'on-leave';
  shift?: string;
  contact?: string;
  email?: string;
  joinDate?: string;
  role?: string;
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
  crewMemberId: string;
  crewMemberName: string;
  action: 'added' | 'removed' | 'moved_to_backup' | 'moved_to_primary' | 'status_changed' | 'duty_started' | 'duty_ended';
  date: string;
  shift: string;
  details: string;
  performedBy: string;
  timestamp: Date;
  notified: boolean;
}