// Activity Log Types
export interface DeviceLog {
  id: string;
  timestamp: Date;
  device: string;
  location: string;
  status: 'online' | 'offline' | 'alert' | 'maintenance';
  message: string;
  user?: string;
}

export interface CallLog {
  id: string;
  timestamp: Date;
  caller: string;
  recipient: string;
  location: string;
  duration: number; // in seconds
  type: 'internal' | 'external' | 'emergency';
  status: 'completed' | 'missed' | 'ongoing';
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'dnd' | 'service' | 'device' | 'crew' | 'guest' | 'system';
  action: string;
  location?: string;
  user?: string;
  details?: string;
}

export interface RecentActivity {
  id: number;
  guest: string;
  request: string;
  crew: string;
  time: string;
  status: 'completed' | 'in-progress';
  timestamp: Date;
}