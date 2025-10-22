
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Assignment, CrewMember, ShiftConfig } from '../components/duty-roster/types';
// Removed defaultShiftConfig import - will use API data
import { useCrewMembers as useCrewMembersApi } from '../hooks/useCrewMembers';
import { useGuestsApi } from '../hooks/useGuestsApi';
import { useServiceRequestsApi } from '../hooks/useServiceRequestsApi';
import { useShifts as useShiftsApi } from '../hooks/useShifts';
import { useLocations } from '../hooks/useLocations';
import { api, GuestDTO } from '../services/api';
import { Location, LocationType } from '../domain/locations';
import { locationsService } from '../services/locations';

// Import organized types
import {
  CrewMemberExtended,
  Role,
  CrewDeviceAssignment,
  CrewChange,
  CrewChangeLog
} from '../types/crew';
import { Guest } from '../types/guests';
import {
  ServiceRequest,
  ServiceRequestHistory,
  InteriorTeam,
  NotificationSettings,
  UserPreferences,
  Message
} from '../types/service-requests';
import {
  DeviceLog,
  CallLog,
  ActivityLog,
  RecentActivity
} from '../types/activity-logs';
import { YachtLocation } from '../types/yacht-locations';

// Mock data imports removed - using real API data only

// Re-export types for backward compatibility
export type {
  CrewMemberExtended,
  Role,
  CrewDeviceAssignment,
  CrewChange,
  CrewChangeLog
} from '../types/crew';
export type { Guest } from '../types/guests';
export type {
  ServiceRequest,
  ServiceRequestHistory,
  InteriorTeam,
  NotificationSettings,
  UserPreferences,
  Message
} from '../types/service-requests';
export type {
  DeviceLog,
  CallLog,
  ActivityLog,
  RecentActivity
} from '../types/activity-logs';
export type { YachtLocation, LocationCategory, DeckType } from '../types/yacht-locations';

interface AppDataContextType {
  // Crew data
  crewMembers: CrewMemberExtended[];
  crew: CrewMemberExtended[]; // Alias for compatibility
  setCrewMembers: (members: CrewMemberExtended[]) => void;
  
  // Duty roster data
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  shifts: ShiftConfig[];
  setShifts: (shifts: ShiftConfig[]) => void;
  
  // Save functionality
  saveAssignments: () => Promise<void>;
  lastSaved: Date | null;
  isSaving: boolean;
  
  // Get current duty status
  getCurrentDutyStatus: () => {
    onDuty: CrewMemberExtended[];
    nextShift: CrewMemberExtended[];
    backup: CrewMemberExtended[];
    nextBackup: CrewMemberExtended[];
  };
  
  // Activity Logs
  deviceLogs: DeviceLog[];
  callLogs: CallLog[];
  crewChangeLogs: CrewChangeLog[];
  activityLogs: ActivityLog[];
  addDeviceLog: (log: Omit<DeviceLog, 'id' | 'timestamp'>) => void;
  addCallLog: (log: Omit<CallLog, 'id' | 'timestamp'>) => void;
  addCrewChangeLog: (log: Omit<CrewChangeLog, 'id' | 'timestamp'>) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  
  // Change tracking for notifications
  detectRosterChanges: () => CrewChange[];
  markChangesAsNotified: (changes: CrewChange[]) => void;
  
  // Device Assignments
  deviceAssignments: CrewDeviceAssignment[];
  assignDeviceToCrew: (assignment: Omit<CrewDeviceAssignment, 'id' | 'assignedAt' | 'lastSync'>) => void;
  removeDeviceFromCrew: (crewMemberId: string) => void;
  getCrewDevice: (crewMemberId: string) => CrewDeviceAssignment | undefined;
  getDeviceAssignment: (deviceId: string) => CrewDeviceAssignment | undefined;
  
  // Messages
  messages: Message[];
  sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'deliveryStatus'>) => void;
  
  // Recent Activity (Dashboard)
  recentActivity: RecentActivity[];
  
  // Role Permissions
  rolePermissions: Record<Role, string[]>;
  updateRolePermissions: (role: Role, permissions: string[]) => void;
  
  // Notification Settings
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  
  // User Preferences
  userPreferences: UserPreferences;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Guest Management
  guests: Guest[];
  addGuest: (guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGuest: (id: string, guest: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  getGuest: (id: string) => Guest | undefined;
  
  // Guest-Location Relationship Helpers (proper foreign key relationships)
  getGuestByLocationId: (locationId: string) => Guest | undefined;
  getLocationByGuestId: (guestId: string) => Location | undefined;
  
  // Yacht Location Management (deprecated - use useLocations hook instead)
  yachtLocations: YachtLocation[];
  addLocation: (location: Omit<YachtLocation, 'id' | 'createdAt' | 'createdBy' | 'isCustom'>) => void;
  updateLocation: (id: string, updates: Partial<YachtLocation>) => void;
  deleteLocation: (id: string) => void;
  updateLocationDeviceStatus: (id: string, deviceStatus: 'online' | 'offline' | 'alert', activeRequests?: number) => void;
  
  // Locations Management (from locations service)
  locations: Location[];
  
  // Service Request Management (Guest Call Button System)
  serviceRequests: ServiceRequest[];
  addServiceRequest: (request: Omit<ServiceRequest, 'id' | 'timestamp'>) => ServiceRequest;
  acceptServiceRequest: (requestId: string, crewMemberName: string) => void;
  delegateServiceRequest: (requestId: string, toCrewMember: string) => void;
  forwardServiceRequest: (requestId: string, toTeam: InteriorTeam) => void;
  completeServiceRequest: (requestId: string, crewMemberName?: string) => void;
  // simulateNewRequest removed - use API directly
  getPendingRequestsForService: (serviceName: string) => ServiceRequest[];
  serviceRequestHistory: ServiceRequestHistory[];
  clearServiceRequestHistory: () => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Role permissions are defined in backend auth middleware
// TODO: Create API endpoint to fetch role permissions dynamically

// Generate default assignments for the next 7 days
function generateDefaultAssignments(crewMembers: CrewMemberExtended[], shifts: ShiftConfig[]): Assignment[] {
  const assignments: Assignment[] = [];
  const now = new Date();
  
  // Get shifts from passed shifts array (match by ID, not name)
  const morningShift = shifts.find((s: ShiftConfig) => s.id === 'morning');
  const afternoonShift = shifts.find((s: ShiftConfig) => s.id === 'afternoon');
  const nightShift = shifts.find((s: ShiftConfig) => s.id === 'night');
  
  if (!morningShift || !afternoonShift || !nightShift) {
    return [];
  }
  
  // Interior crew members (from actual crew state) - EXCLUDE on-leave crew
  const interiorCrew = crewMembers.filter(
    c => c.department === 'Interior' && c.status !== 'on-leave'
  );
  
  if (interiorCrew.length === 0) {
    return []; // No available crew to assign
  }
  
  // Rotate crew through shifts over 7 days
  for (let day = 0; day < 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];
    
    // Morning shift crew rotation (3 crew members)
    const morningCrewIndex = day % interiorCrew.length;
    assignments.push({
      id: `default-morning-${day}-0`,
      date: dateStr,
      shiftId: morningShift.id,
      crewId: interiorCrew[morningCrewIndex]?.id || 'crew-1',
      type: 'primary',
    });
    assignments.push({
      id: `default-morning-${day}-1`,
      date: dateStr,
      shiftId: morningShift.id,
      crewId: interiorCrew[(morningCrewIndex + 1) % interiorCrew.length]?.id || 'crew-2',
      type: 'primary',
    });
    assignments.push({
      id: `default-morning-${day}-2`,
      date: dateStr,
      shiftId: morningShift.id,
      crewId: interiorCrew[(morningCrewIndex + 2) % interiorCrew.length]?.id || 'crew-3',
      type: 'primary',
    });
    
    // Afternoon shift crew rotation (3 crew members)
    const afternoonCrewIndex = (day + 3) % interiorCrew.length;
    assignments.push({
      id: `default-afternoon-${day}-0`,
      date: dateStr,
      shiftId: afternoonShift.id,
      crewId: interiorCrew[afternoonCrewIndex]?.id || 'crew-4',
      type: 'primary',
    });
    assignments.push({
      id: `default-afternoon-${day}-1`,
      date: dateStr,
      shiftId: afternoonShift.id,
      crewId: interiorCrew[(afternoonCrewIndex + 1) % interiorCrew.length]?.id || 'crew-5',
      type: 'primary',
    });
    assignments.push({
      id: `default-afternoon-${day}-2`,
      date: dateStr,
      shiftId: afternoonShift.id,
      crewId: interiorCrew[(afternoonCrewIndex + 2) % interiorCrew.length]?.id || 'crew-6',
      type: 'primary',
    });
    
    // Night shift crew rotation (2 crew members)
    const nightCrewIndex = (day + 6) % interiorCrew.length;
    assignments.push({
      id: `default-night-${day}-0`,
      date: dateStr,
      shiftId: nightShift.id,
      crewId: interiorCrew[nightCrewIndex]?.id || 'crew-7',
      type: 'primary',
    });
    assignments.push({
      id: `default-night-${day}-1`,
      date: dateStr,
      shiftId: nightShift.id,
      crewId: interiorCrew[(nightCrewIndex + 1) % interiorCrew.length]?.id || 'crew-8',
      type: 'primary',
    });
    
    // Add backup crew (1 per shift)
    assignments.push({
      id: `default-morning-backup-${day}`,
      date: dateStr,
      shiftId: morningShift.id,
      crewId: interiorCrew[(morningCrewIndex + 5) % interiorCrew.length]?.id || 'crew-9',
      type: 'backup',
    });
    assignments.push({
      id: `default-afternoon-backup-${day}`,
      date: dateStr,
      shiftId: afternoonShift.id,
      crewId: interiorCrew[(afternoonCrewIndex + 5) % interiorCrew.length]?.id || 'crew-9',
      type: 'backup',
    });
    assignments.push({
      id: `default-night-backup-${day}`,
      date: dateStr,
      shiftId: nightShift.id,
      crewId: interiorCrew[(nightCrewIndex + 2) % interiorCrew.length]?.id || 'crew-9',
      type: 'backup',
    });
  }
  
  return assignments;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  // Fetch crew members from API
  const { crewMembers: apiCrewMembers, isLoading: isLoadingCrew } = useCrewMembersApi();
  
  // Fetch guests from API
  const { guests: apiGuests, isLoading: isLoadingGuests } = useGuestsApi();
  
  // Fetch service requests from API
  const { serviceRequests: apiServiceRequests, isLoading: isLoadingServiceRequests } = useServiceRequestsApi();
  
  // Fetch shifts from API
  const { data: apiShifts = [], isLoading: isLoadingShifts } = useShiftsApi();
  
  // Fetch locations from API
  const { locations: apiLocations, isLoading: isLoadingLocations } = useLocations();
  
  // Initialize crew members with empty array - will be populated from API
  const [crewMembers, setCrewMembers] = useState<CrewMemberExtended[]>([]);
  
  // Update crew members when API data arrives - no localStorage
  useEffect(() => {
    if (apiCrewMembers.length > 0) {
      const extendedCrew = apiCrewMembers.map(member => ({
        id: member.id,
        name: member.name,
        position: member.position,
        department: member.department,
        role: member.role || member.position,
        status: (member.status as any) || 'off-duty',
        shift: '08:00 - 20:00',
        contact: member.contact || '+1 555 0100',
        email: member.email || `${member.name.toLowerCase().replace(' ', '.')}@yacht.com`,
        joinDate: member.joinDate || '2023-01-15',
        nickname: member.name.split(' ')[0], // Generate from name
        // Extended fields not in API - use defaults
        avatar: undefined,
        color: '#A8A8A8', // Default gray color
        languages: ['English'], // Default language
        skills: [], // Empty skills array
        onBoardContact: undefined,
        phone: member.contact || undefined, // Use contact as phone fallback
      }));
      setCrewMembers(extendedCrew);
    }
  }, [apiCrewMembers]);

  // Initialize assignments with empty array - will be populated from API
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Initialize shifts with empty array - will be populated from API
  const [shifts, setShifts] = useState<ShiftConfig[]>([]);
  
  // Update shifts when API data arrives
  useEffect(() => {
    if (apiShifts && apiShifts.length > 0) {
      setShifts(apiShifts);
    }
  }, [apiShifts]);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [previousAssignments, setPreviousAssignments] = useState<Assignment[]>([]);
  
  // Use locations from API instead of mock data
  const locations = apiLocations;

  // Device logs are now fetched from backend via useDeviceLogs hook
  // Keeping empty array for backward compatibility - will be removed
  const [deviceLogs, setDeviceLogs] = useState<DeviceLog[]>([]);

  // Call logs will be fetched from backend via useCallLogs hook
  // Keeping empty array for backward compatibility - will be removed
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

  // Crew change logs will be fetched from backend via useCrewChangeLogs hook
  // TODO: Create backend API endpoint and hook to fetch crew change logs
  const [crewChangeLogs, setCrewChangeLogs] = useState<CrewChangeLog[]>([]);

  // Device assignments will be fetched from backend via useDeviceAssignments hook
  // Keeping empty array for backward compatibility - will be removed
  const [deviceAssignments, setDeviceAssignments] = useState<CrewDeviceAssignment[]>([]);

  // Messages will be fetched from backend via useMessages hook and WebSocket
  // Keeping empty array for backward compatibility - will be removed
  const [messages, setMessages] = useState<Message[]>([]);

  // Recent activity will be fetched from backend via unified activity feed
  // Keeping empty array for backward compatibility - will be removed
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Yacht Locations - deprecated, use locations from useLocations hook instead
  // TODO: Remove this completely once all components are migrated
  const [yachtLocations, setYachtLocations] = useState<YachtLocation[]>([]);

  // User Preferences - will be fetched from backend via useUserPreferences hook
  // TODO: Create backend API endpoint and hook to fetch user preferences
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    serviceRequestDisplayMode: 'guest-name',
    servingNowTimeout: 5,
    requestDialogRepeatInterval: 60,
  });

  // Service Request History - will be fetched from backend via useServiceRequestHistory hook
  // Keeping empty array for backward compatibility - will be removed
  const [serviceRequestHistory, setServiceRequestHistory] = useState<ServiceRequestHistory[]>([]);

  // Role Permissions - will be fetched from backend via useRolePermissions hook
  // TODO: Create backend API endpoint and hook to fetch role permissions
  const [rolePermissions, setRolePermissions] = useState<Record<Role, string[]>>({
    "admin": [],
    "eto": [],
    "chief-stewardess": [],
    "stewardess": [],
    "crew": [],
  });

  // Notification Settings - will be fetched from backend via useNotificationSettings hook
  // TODO: Create backend API endpoint and hook to fetch notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: true,
    shiftStartAdvanceTime: '1hour',
    shiftEndAdvanceTime: '30min',
    shiftStartEnabled: true,
    shiftEndEnabled: true,
  });

  // Guest Management - empty array, will be filled by API
  const [guests, setGuests] = useState<Guest[]>([]);
  
  // Sync guests from API when data arrives
  useEffect(() => {
    if (apiGuests.length > 0) {
      // Map API DTO to app Guest type with all required fields
      const mappedGuests: Guest[] = apiGuests.map(apiGuest => ({
        id: apiGuest.id,
        
        // Basic Info
        firstName: apiGuest.firstName,
        lastName: apiGuest.lastName,
        photo: apiGuest.photo || undefined,
        preferredName: apiGuest.preferredName || undefined,
        type: apiGuest.type as any,
        status: apiGuest.status as any,
        nationality: apiGuest.nationality || undefined,
        languages: apiGuest.languages || [],
        passportNumber: apiGuest.passportNumber || undefined,
        
        // Accommodation
        locationId: apiGuest.locationId || undefined,
        checkInDate: apiGuest.checkInDate || new Date().toISOString().split('T')[0],
        checkOutDate: apiGuest.checkOutDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        
        // Dietary & Medical - from database
        allergies: apiGuest.allergies || [],
        dietaryRestrictions: apiGuest.dietaryRestrictions || [],
        medicalConditions: apiGuest.medicalConditions || [],
        
        // Preferences & Notes - from database
        preferences: apiGuest.preferences || undefined,
        notes: apiGuest.notes || undefined,
        
        // Emergency Contact - from database
        emergencyContactName: apiGuest.emergencyContactName || undefined,
        emergencyContactPhone: apiGuest.emergencyContactPhone || undefined,
        emergencyContactRelation: apiGuest.emergencyContactRelation || undefined,
        
        // Legacy fields (keep for backward compatibility, can be removed later)
        doNotDisturb: false,
        foodDislikes: [],
        favoriteFoods: [],
        favoriteDrinks: [],
        
        createdAt: apiGuest.createdAt,
        updatedAt: apiGuest.updatedAt,
        createdBy: 'system',
      }));
      
      setGuests(mappedGuests);
    }
  }, [apiGuests]);

  // Service Requests - empty array, will be filled by API
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  
  // Sync service requests from API when data arrives
  useEffect(() => {
    if (apiServiceRequests.length > 0) {
      // Map API DTO to app ServiceRequest type with all required fields
      const mappedRequests: ServiceRequest[] = apiServiceRequests.map(apiReq => {
        // Find guest to get name
        const guest = guests.find(g => g.id === apiReq.guestId);
        const guestName = guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown Guest';
        
        // Find location/cabin
        const location = locations.find(l => l.id === apiReq.locationId);
        const cabinName = location?.name || 'Unknown Location';
        
        // Find assigned crew member
        const assignedCrew = crewMembers.find(c => c.id === apiReq.assignedCrewId);
        
        return {
          id: apiReq.id,
          guestName,
          guestCabin: cabinName,
          cabinId: apiReq.locationId || '',
          requestType: apiReq.priority === 'emergency' ? 'emergency' : 'call',
          priority: apiReq.priority === 'low' ? 'normal' : apiReq.priority,
          timestamp: new Date(apiReq.createdAt),
          voiceTranscript: apiReq.voiceTranscript || undefined,
          voiceAudioUrl: apiReq.voiceAudioUrl || undefined,
          cabinImage: location?.image || undefined,
          status: apiReq.status as any,
          assignedTo: assignedCrew?.name || undefined,
          acceptedAt: apiReq.assignedCrewId ? new Date(apiReq.updatedAt) : undefined,
          completedAt: apiReq.completedAt ? new Date(apiReq.completedAt) : undefined,
          notes: apiReq.message || undefined,
        };
      });
      
      setServiceRequests(mappedRequests);
    }
  }, [apiServiceRequests, guests, locations, crewMembers]);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Removed localStorage persistence for crew members - using API as single source of truth

  // Auto-reset crew statuses when assignments change (no localStorage)
  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const todayAssignments = assignments.filter(a => a.date === today);
    const assignedCrewIds = new Set(todayAssignments.map(a => a.crewId));
    
    setCrewMembers(prevCrew => {
      let hasChanges = false;
      
      const updated = prevCrew.map(member => {
        if (
          member.department === 'Interior' &&
          member.status === 'on-duty' &&
          !assignedCrewIds.has(member.id)
        ) {
          hasChanges = true;
          return { ...member, status: 'off-duty' as const };
        }
        return member;
      });
      
      return hasChanges ? updated : prevCrew;
    });
  }, [assignments, setCrewMembers]);

  // Removed localStorage persistence for shifts - will use API
  // Persist other data (device logs and call logs removed - now from API)
  // Crew change logs removed - will use API
  // Device assignments removed - will use API
  // Messages removed - will use API and WebSocket
  // Recent activity now from API - no localStorage persistence
  // Role permissions removed - will use API
  // Notification settings removed - will use API
  // User preferences removed - will use API
  // Service request history removed - will use API
  // Guests removed - now using API
  // Yacht locations removed - use locations from useLocations hook
  // Service requests removed - will use API

  // Initialize locations service - Let it load from backend API first
  // Only use localStorage as emergency fallback if backend is unavailable
  useEffect(() => {
    const initializeLocations = async () => {
      // DO NOT clear localStorage - it may be the only source of data if backend is down!
      // locationsService will fetch from backend API first
      // and only fall back to localStorage if backend is unavailable
      console.log('🏠 Locations service ready - will load from backend API');
    };
    
    initializeLocations();
  }, []);

  // Add log functions
  const addDeviceLog = (log: Omit<DeviceLog, 'id' | 'timestamp'>) => {
    const newLog: DeviceLog = {
      ...log,
      id: `device-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setDeviceLogs(prev => [newLog, ...prev]);
  };

  const addCallLog = (log: Omit<CallLog, 'id' | 'timestamp'>) => {
    const newLog: CallLog = {
      ...log,
      id: `call-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setCallLogs(prev => [newLog, ...prev]);
  };

  const addActivityLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: `activity-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const addCrewChangeLog = (log: Omit<CrewChangeLog, 'id' | 'timestamp'>) => {
    const newLog: CrewChangeLog = {
      ...log,
      id: `crew-change-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setCrewChangeLogs(prev => [newLog, ...prev]);
  };

  // Detect changes in roster assignments
  const detectRosterChanges = () => {
    const changes: CrewChange[] = [];

    // Compare current assignments with previous
    assignments.forEach(current => {
      const previous = previousAssignments.find(
        p => p.date === current.date && 
            p.shiftId === current.shiftId && 
            p.crewId === current.crewId
      );

      const crew = crewMembers.find(c => c.id === current.crewId);
      const shift = shifts.find(s => s.id === current.shiftId);
      
      if (!crew || !shift) return;

      if (!previous) {
        // New assignment
        changes.push({
          crewMember: crew.name,
          changeType: current.type === 'primary' ? 'added' : 'moved_to_backup',
          date: current.date,
          shift: shift.name,
          details: `Assigned to ${shift.name} (${shift.startTime} - ${shift.endTime})`,
        });
      } else if (previous.type !== current.type) {
        // Type changed (primary <-> backup)
        changes.push({
          crewMember: crew.name,
          changeType: current.type === 'primary' ? 'moved_to_primary' : 'moved_to_backup',
          date: current.date,
          shift: shift.name,
          details: `Changed from ${previous.type} to ${current.type}`,
        });
      }
    });

    // Check for removed assignments
    previousAssignments.forEach(previous => {
      const current = assignments.find(
        a => a.date === previous.date && 
            a.shiftId === previous.shiftId && 
            a.crewId === previous.crewId
      );

      if (!current) {
        const crew = crewMembers.find(c => c.id === previous.crewId);
        const shift = shifts.find(s => s.id === previous.shiftId);
        
        if (crew && shift) {
          changes.push({
            crewMember: crew.name,
            changeType: 'removed',
            date: previous.date,
            shift: shift.name,
            details: `Removed from ${shift.name}`,
          });
        }
      }
    });

    return changes;
  };

  // Mark changes as notified
  const markChangesAsNotified = (changes: CrewChange[]) => {
    changes.forEach(change => {
      addCrewChangeLog({
        crewMember: change.crewMember,
        changeType: change.changeType,
        date: change.date,
        shift: change.shift,
        performedBy: 'Chief Steward', // In production, get from auth context
        notified: true,
        details: change.details,
      });
    });
  };

  // Save function - TODO: Replace with API call to save assignments
  const saveAssignments = async () => {
    setIsSaving(true);
    setPreviousAssignments([...assignments]);
    
    // TODO: Replace with actual API call
    // await api.dutyRoster.saveAssignments(assignments);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const now = new Date();
    setLastSaved(now);
    setIsSaving(false);
  };

  // Get current duty status based on assignments AND manual crew status
  const getCurrentDutyStatus = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinutes;

    // Find current shift
    const currentShift = shifts.find(shift => {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      let endTime = endHour * 60 + endMin;
      
      // Handle overnight shifts
      if (endTime < startTime) {
        endTime += 24 * 60;
      }
      
      let adjustedCurrentTime = currentTime;
      if (currentTime < startTime && endTime > 24 * 60) {
        adjustedCurrentTime += 24 * 60;
      }
      
      return adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime;
    });

    const todayAssignments = assignments.filter(a => a.date === today);
    
    let onDuty: CrewMemberExtended[] = [];
    let nextShift: CrewMemberExtended[] = [];
    let backup: CrewMemberExtended[] = [];

    // Add primary crew assigned in Duty Roster for current shift
    if (currentShift) {
      const currentShiftAssignments = todayAssignments.filter(
        a => a.shiftId === currentShift.id && a.type === 'primary'
      );
      
      currentShiftAssignments.forEach(assignment => {
        const member = crewMembers.find(c => c.id === assignment.crewId);
        if (member && member.department === 'Interior' && member.status !== 'on-leave') {
          onDuty.push({
            ...member,
            status: 'on-duty',
            shift: `${currentShift.startTime} - ${currentShift.endTime}`,
          });
        }
      });
    }
    
    // Add manual "on-duty" crew (Emergency overrides or Called Backup)
    crewMembers.forEach(member => {
      if (
        member.department === 'Interior' && 
        member.status === 'on-duty' &&
        !onDuty.find(d => d.id === member.id)
      ) {
        onDuty.push({
          ...member,
          status: 'on-duty',
          shift: 'Emergency',
        });
      }
    });
    
    // Add backup crew from Duty Roster
    if (currentShift) {
      const backupAssignments = todayAssignments.filter(
        a => a.shiftId === currentShift.id && a.type === 'backup'
      );
      
      backupAssignments.forEach(assignment => {
        const member = crewMembers.find(c => c.id === assignment.crewId);
        if (
          member && 
          member.department === 'Interior' && 
          member.status !== 'on-leave' &&
          !onDuty.find(d => d.id === member.id)
        ) {
          backup.push({
            ...member,
            status: 'off-duty',
            shift: `${currentShift.startTime} - ${currentShift.endTime}`,
          });
        }
      });
    }

    // Find next shift
    const nextShiftConfig = shifts.find(shift => {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      return startTime > currentTime;
    }) || shifts[0];

    let nextBackup: CrewMemberExtended[] = [];

    if (nextShiftConfig) {
      // Get next shift assignments
      let nextShiftAssignments = todayAssignments.filter(
        a => a.shiftId === nextShiftConfig.id && a.type === 'primary'
      );
      
      let nextBackupAssignments = todayAssignments.filter(
        a => a.shiftId === nextShiftConfig.id && a.type === 'backup'
      );
      
      // If no assignments for next shift today, check tomorrow
      if (nextShiftAssignments.length === 0) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const tomorrowAssignments = assignments.filter(a => a.date === tomorrowStr);
        nextShiftAssignments = tomorrowAssignments.filter(
          a => a.shiftId === nextShiftConfig.id && a.type === 'primary'
        );
        nextBackupAssignments = tomorrowAssignments.filter(
          a => a.shiftId === nextShiftConfig.id && a.type === 'backup'
        );
      }
      
      // Populate next shift primary crew
      nextShiftAssignments.forEach(assignment => {
        const member = crewMembers.find(c => c.id === assignment.crewId);
        
        if (member && member.department === 'Interior' && member.status !== 'on-leave' && !onDuty.find(m => m.id === member.id)) {
          nextShift.push({
            ...member,
            status: 'off-duty',
            shift: `${nextShiftConfig.startTime} - ${nextShiftConfig.endTime}`,
          });
        }
      });
      
      // Populate next shift backup crew
      nextBackupAssignments.forEach(assignment => {
        const member = crewMembers.find(c => c.id === assignment.crewId);
        
        if (member && member.department === 'Interior' && member.status !== 'on-leave') {
          nextBackup.push({
            ...member,
            status: 'off-duty',
            shift: `${nextShiftConfig.startTime} - ${nextShiftConfig.endTime}`,
          });
        }
      });
    }

    return { onDuty, nextShift, backup, nextBackup };
  }, [assignments, shifts, crewMembers]);

  // Device Assignment Functions - TODO: Replace with API calls
  const assignDeviceToCrew = (assignment: Omit<CrewDeviceAssignment, 'id' | 'assignedAt' | 'lastSync'>) => {
    const now = new Date();
    const newAssignment: CrewDeviceAssignment = {
      ...assignment,
      id: `device-assignment-${Date.now()}`,
      assignedAt: now,
      lastSync: now,
      status: assignment.status || 'connected',
    };
    
    setDeviceAssignments(prev => {
      const filtered = prev.filter(
        a => a.crewMemberId !== assignment.crewMemberId && a.deviceId !== assignment.deviceId
      );
      return [...filtered, newAssignment];
    });
  };

  const removeDeviceFromCrew = (crewMemberId: string) => {
    setDeviceAssignments(prev => prev.filter(a => a.crewMemberId !== crewMemberId));
  };

  const getCrewDevice = (crewMemberId: string): CrewDeviceAssignment | undefined => {
    return deviceAssignments.find(a => a.crewMemberId === crewMemberId);
  };

  const getDeviceAssignment = (deviceId: string): CrewDeviceAssignment | undefined => {
    return deviceAssignments.find(a => a.deviceId === deviceId);
  };

  // Message Functions
  const sendMessage = (message: Omit<Message, 'id' | 'timestamp' | 'deliveryStatus'>) => {
    const newMessage: Message = {
      ...message,
      id: `message-${Date.now()}`,
      timestamp: new Date(),
      deliveryStatus: 'sent',
    };
    
    setMessages(prev => [newMessage, ...prev]);
    
    // Simulate delivery after 1 second
    setTimeout(() => {
      setMessages(prev => 
        prev.map(m => m.id === newMessage.id ? { ...m, deliveryStatus: 'delivered' } : m)
      );
    }, 1000);
  };

  // Update role permissions
  const updateRolePermissions = (role: Role, permissions: string[]) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: permissions
    }));
  };

  // Update notification settings
  const updateNotificationSettings = (settings: NotificationSettings) => {
    setNotificationSettings(settings);
  };

  // Update user preferences
  const updateUserPreferences = (preferences: Partial<UserPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...preferences }));
  };

  // Guest Management Functions
  const addGuest = (guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newGuest: Guest = {
      ...guest,
      id: `guest-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    
    setGuests(prev => [newGuest, ...prev]);
  };

  const updateGuest = (id: string, updates: Partial<Guest>) => {
    setGuests(prev =>
      prev.map(guest =>
        guest.id === id
          ? { ...guest, ...updates, updatedAt: new Date().toISOString() }
          : guest
      )
    );
  };

  const deleteGuest = (id: string) => {
    setGuests(prev => prev.filter(guest => guest.id !== id));
  };

  // Yacht Location Management Functions
  const addLocation = (location: Omit<YachtLocation, 'id' | 'createdAt' | 'createdBy' | 'isCustom'>) => {
    const now = new Date().toISOString();
    const newLocation: YachtLocation = {
      ...location,
      id: `LOC-${Date.now()}`,
      isCustom: true,
      createdBy: 'ETO',
      createdAt: now,
    };
    
    setYachtLocations(prev => [...prev, newLocation]);
  };

  const updateLocation = (id: string, updates: Partial<YachtLocation>) => {
    setYachtLocations(prev =>
      prev.map(location =>
        location.id === id
          ? { ...location, ...updates }
          : location
      )
    );
    
    // SYNC with locationsService for DND status
    if (updates.doNotDisturb !== undefined) {
      locationsService.update({ 
        id, 
        doNotDisturb: updates.doNotDisturb 
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['locations'] });
      }).catch(err => console.error('Failed to sync DND status:', err));
    }
  };

  const deleteLocation = (id: string) => {
    setYachtLocations(prev => prev.filter(location => location.id !== id));
  };

  const updateLocationDeviceStatus = (id: string, deviceStatus: 'online' | 'offline' | 'alert', activeRequests?: number) => {
    setYachtLocations(prev =>
      prev.map(location =>
        location.id === id
          ? { 
              ...location, 
              deviceStatus, 
              activeRequests: activeRequests !== undefined ? activeRequests : location.activeRequests,
              lastActivity: 'Just now'
            }
          : location
      )
    );
  };

  const getGuest = (id: string): Guest | undefined => {
    return guests.find(guest => guest.id === id);
  };

  // PROPER GUEST-LOCATION RELATIONSHIP HELPERS
  const getGuestByLocationId = (locationId: string): Guest | undefined => {
    return guests.find(guest => guest.locationId === locationId);
  };

  const getLocationByGuestId = (guestId: string): Location | undefined => {
    const guest = getGuest(guestId);
    if (!guest?.locationId) return undefined;
    return locations.find(location => location.id === guest.locationId);
  };

  // Service Request Functions (Guest Call Button System)
  const addServiceRequest = (request: Omit<ServiceRequest, 'id' | 'timestamp'>): ServiceRequest => {
    const newRequest: ServiceRequest = {
      ...request,
      id: `req-${Date.now()}`,
      timestamp: new Date(),
    };
    
    setServiceRequests(prev => [newRequest, ...prev]);
    return newRequest;
  };

  const acceptServiceRequest = (requestId: string, crewMemberName: string) => {
    setServiceRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'accepted' as const, assignedTo: crewMemberName, acceptedAt: new Date() }
          : req
      )
    );
  };

  const delegateServiceRequest = (requestId: string, toCrewMember: string) => {
    setServiceRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'delegated' as const, assignedTo: toCrewMember, acceptedAt: new Date() }
          : req
      )
    );
  };

  const forwardServiceRequest = (requestId: string, toTeam: InteriorTeam) => {
    setServiceRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'forwarded' as const, forwardedToTeam: toTeam, forwardedAt: new Date() }
          : req
      )
    );
  };

  const completeServiceRequest = (requestId: string, crewMemberName?: string) => {
    const now = new Date();
    
    setServiceRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          const completedReq = { ...req, status: 'completed' as const, completedAt: now };
          
          // Add to history
          if (req.acceptedAt) {
            const duration = Math.floor((now.getTime() - req.acceptedAt.getTime()) / 1000);
            const historyEntry: ServiceRequestHistory = {
              id: `history-${Date.now()}`,
              originalRequest: completedReq,
              completedBy: crewMemberName || req.assignedTo || 'Unknown',
              completedAt: now,
              duration,
            };
            
            setServiceRequestHistory(prev => [historyEntry, ...prev]);
          }
          
          return completedReq;
        }
        return req;
      })
    );
  };
  
  // Auto-remove completed service requests after timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeoutMs = (userPreferences.servingNowTimeout || 5) * 1000;
      const staleThresholdMs = 60 * 60 * 1000;
      
      setServiceRequests(prev => {
        const filtered = prev.filter(req => {
          if (req.status === 'completed') {
            if (req.completedAt) {
              const timeSinceCompleted = now.getTime() - req.completedAt.getTime();
              return timeSinceCompleted < timeoutMs;
            }
            return false;
          }
          
          if (req.status === 'accepted' || req.status === 'delegated') {
            const acceptedTime = req.acceptedAt instanceof Date ? req.acceptedAt : (req.acceptedAt ? new Date(req.acceptedAt) : null);
            
            if (acceptedTime && acceptedTime instanceof Date && !isNaN(acceptedTime.getTime())) {
              const timeSinceAccepted = now.getTime() - acceptedTime.getTime();
              if (timeSinceAccepted > staleThresholdMs) return false;
            }
          }
          
          return true;
        });
        
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [userPreferences.servingNowTimeout]);

  const getPendingRequestsForService = (serviceName: string): ServiceRequest[] => {
    return serviceRequests.filter(req =>
      req.status === 'forwarded' && req.forwardedToTeam === serviceName
    );
  };

  const clearServiceRequestHistory = () => {
    setServiceRequestHistory([]);
  };

  // REMOVED: simulateNewRequest - replaced with real API calls in components
  // Components should use useServiceRequestsApi().createMutation directly

  return (
    <AppDataContext.Provider
      value={{
        crewMembers,
        crew: crewMembers, // Alias for compatibility
        setCrewMembers,
        assignments,
        setAssignments,
        shifts,
        setShifts,
        saveAssignments,
        lastSaved,
        isSaving,
        getCurrentDutyStatus,
        deviceLogs,
        callLogs,
        crewChangeLogs,
        activityLogs,
        addDeviceLog,
        addCallLog,
        addCrewChangeLog,
        addActivityLog,
        detectRosterChanges,
        markChangesAsNotified,
        deviceAssignments,
        assignDeviceToCrew,
        removeDeviceFromCrew,
        getCrewDevice,
        getDeviceAssignment,
        messages,
        sendMessage,
        recentActivity,
        rolePermissions,
        updateRolePermissions,
        notificationSettings,
        updateNotificationSettings,
        userPreferences,
        updateUserPreferences,
        guests,
        addGuest,
        updateGuest,
        deleteGuest,
        getGuest,
        getGuestByLocationId,
        getLocationByGuestId,
        yachtLocations,
        addLocation,
        updateLocation,
        deleteLocation,
        updateLocationDeviceStatus,
        locations, // Locations from API
        serviceRequests,
        addServiceRequest,
        acceptServiceRequest,
        delegateServiceRequest,
        forwardServiceRequest,
        completeServiceRequest,
        // simulateNewRequest removed - use API directly
        getPendingRequestsForService,
        serviceRequestHistory,
        clearServiceRequestHistory,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
}