// Types for Duty Roster system

export interface CrewMember {
  id: string;
  name: string;
  nickname?: string;
  position: string;
  department: string;
  avatar?: string;
  color: string; // Unique color for visual identification
  
  // Contact Information
  email?: string;
  phone?: string;
  onBoardContact?: string; // Phone number on board
  
  // Status & Availability
  status?: 'on-duty' | 'on-leave' | 'off-duty';
  leaveStart?: string; // YYYY-MM-DD format
  leaveEnd?: string; // YYYY-MM-DD format
  
  // Skills & Languages
  languages?: string[];
  skills?: string[];
  
  // Notes
  notes?: string;
}

export interface ShiftConfig {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;
  primaryCount: number;
  backupCount: number;
  color?: string;
}

export interface Assignment {
  id?: string; // Optional for backward compatibility
  crewId: string;
  date: string; // YYYY-MM-DD format
  shiftId: string;
  type: 'primary' | 'backup';
}

export type ViewMode = 'month' | 'week' | 'day';

export interface RosterSettings {
  shifts: ShiftConfig[];
}
