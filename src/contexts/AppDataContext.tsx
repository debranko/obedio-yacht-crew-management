
import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Assignment, CrewMember, ShiftConfig } from '../components/duty-roster/types';
// Removed defaultShiftConfig import - will use API data
import { useCrewMembers as useCrewMembersApi } from '../hooks/useCrewMembers';
import { useGuestsApi } from '../hooks/useGuestsApi';
import { useServiceRequestsApi } from '../hooks/useServiceRequestsApi';
import { useShifts as useShiftsApi } from '../hooks/useShifts';
import { useAssignments as useAssignmentsApi, useCreateBulkAssignments, useDeleteAssignmentsByDate } from '../hooks/useAssignments';
import { useLocations } from '../hooks/useLocations';
import { useWebSocket } from '../hooks/useWebSocket';
import { api, GuestDTO } from '../services/api';
import { Location, LocationType } from '../domain/locations';
import { locationsService } from '../services/locations';

// Import organized types
import {
  CrewMemberExtended,
  Role,
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
  saveAssignments: (assignmentsToSave?: Assignment[]) => Promise<void>;
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
  markChangesAsNotified: (changes: CrewChange[]) => Promise<void>;

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
  completeServiceRequest: (requestId: string, crewMemberName?: string) => void;
  // simulateNewRequest removed - use API directly
  // forwardServiceRequest removed - use service categories instead
  // getPendingRequestsForService removed - use API filters instead
  serviceRequestHistory: ServiceRequestHistory[];
  clearServiceRequestHistory: () => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// REMOVED: generateDefaultAssignments function - was completely hardcoded
// All assignments should come from the database via API

export function AppDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Initialize WebSocket for real-time updates
  const { isConnected: wsConnected } = useWebSocket();

  // Fetch crew members from API
  const { crewMembers: apiCrewMembers, isLoading: isLoadingCrew } = useCrewMembersApi();
  
  // Fetch guests from API with mutations
  const {
    guests: apiGuests,
    isLoading: isLoadingGuests,
    createGuest: apiCreateGuest,
    updateGuest: apiUpdateGuest,
    deleteGuest: apiDeleteGuest,
  } = useGuestsApi();
  
  // Fetch service requests from API
  const { serviceRequests: apiServiceRequests, isLoading: isLoadingServiceRequests } = useServiceRequestsApi();
  
  // Fetch shifts from API
  const { data: apiShifts = [], isLoading: isLoadingShifts } = useShiftsApi();

  // Fetch assignments from API (get current week)
  const today = new Date().toISOString().split('T')[0];
  const { data: apiAssignments = [], isLoading: isLoadingAssignments } = useAssignmentsApi({
    startDate: today,
  });

  // Mutation for bulk creating assignments
  const createBulkAssignments = useCreateBulkAssignments();
  const deleteAssignmentsByDate = useDeleteAssignmentsByDate();

  // Fetch locations from API
  const { locations: apiLocations, isLoading: isLoadingLocations } = useLocations();
  
  // Map API crew members to extended format directly (no duplicate state)
  const crewMembers: CrewMemberExtended[] = useMemo(() => {
    return apiCrewMembers.map(member => ({
      id: member.id,
      name: member.name,
      position: member.position,
      department: member.department,
      role: member.role ?? undefined,
      status: (member.status as any),
      contact: member.contact ?? undefined,
      email: member.email ?? undefined,
      joinDate: member.joinDate ?? undefined,
      leaveStart: member.leaveStart ?? undefined,
      leaveEnd: member.leaveEnd ?? undefined,
      languages: member.languages,
      skills: member.skills,
      avatar: member.avatar,
      nickname: member.nickname,
      color: member.color,
      onBoardContact: member.onBoardContact,
      phone: member.phone ?? member.contact,
      notes: member.notes,
      shift: member.shift ?? undefined,
      userId: member.userId ?? undefined,  // Map userId from backend
    }));
  }, [apiCrewMembers]);

  // Use API assignments directly (no duplicate state)
  const assignments: Assignment[] = apiAssignments;

  // Use API shifts directly (no duplicate state)
  const shifts: ShiftConfig[] = apiShifts;

  // Setter functions that invalidate React Query cache instead of setting local state
  const setCrewMembers = useCallback((members: CrewMemberExtended[]) => {
    // Invalidate crew members cache to trigger re-fetch
    queryClient.invalidateQueries({ queryKey: ['crewMembers'] });
  }, [queryClient]);

  const setAssignments = useCallback((assignments: Assignment[]) => {
    // Invalidate assignments cache to trigger re-fetch
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
  }, [queryClient]);

  const setShifts = useCallback((shifts: ShiftConfig[]) => {
    // Invalidate shifts cache to trigger re-fetch
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
  }, [queryClient]);

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
  // Using empty object as initial state - will be populated from API
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({} as UserPreferences);

  // Service Request History - will be fetched from backend via useServiceRequestHistory hook
  // Keeping empty array for backward compatibility - will be removed
  const [serviceRequestHistory, setServiceRequestHistory] = useState<ServiceRequestHistory[]>([]);

  // Role Permissions - will be fetched from backend via useRolePermissions hook
  // Using empty object as initial state - will be populated from API
  const [rolePermissions, setRolePermissions] = useState<Record<Role, string[]>>({} as Record<Role, string[]>);

  // Notification Settings - will be fetched from backend via useNotificationSettings hook
  // Using empty object as initial state - will be populated from API
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({} as NotificationSettings);

  // Guest Management - empty array, will be filled by API
  const [guests, setGuests] = useState<Guest[]>([]);
  
  // Sync guests from API when data arrives
  useEffect(() => {
    if (apiGuests.length > 0) {
      // Map API DTO to app Guest type with all required fields
      const mappedGuests: Guest[] = apiGuests.map(apiGuest => ({
        id: apiGuest.id,
        firstName: apiGuest.firstName,
        lastName: apiGuest.lastName,
        photo: apiGuest.photo ?? undefined,
        preferredName: apiGuest.preferredName ?? undefined,
        type: apiGuest.type as any,
        status: apiGuest.status as any,
        nationality: apiGuest.nationality ?? undefined,
        languages: apiGuest.languages ?? [],
        passportNumber: apiGuest.passportNumber ?? undefined,
        locationId: apiGuest.locationId ?? undefined,
        checkInDate: apiGuest.checkInDate ?? undefined,
        checkOutDate: apiGuest.checkOutDate ?? undefined,
        allergies: apiGuest.allergies ?? [],
        dietaryRestrictions: apiGuest.dietaryRestrictions ?? [],
        medicalConditions: apiGuest.medicalConditions ?? [],
        preferences: apiGuest.preferences ?? undefined,
        notes: apiGuest.notes ?? undefined,
        emergencyContactName: apiGuest.emergencyContactName ?? undefined,
        emergencyContactPhone: apiGuest.emergencyContactPhone ?? undefined,
        emergencyContactRelation: apiGuest.emergencyContactRelation ?? undefined,
        doNotDisturb: (apiGuest as any).doNotDisturb ?? false,
        foodDislikes: (apiGuest as any).foodDislikes ?? [],
        favoriteFoods: (apiGuest as any).favoriteFoods ?? [],
        favoriteDrinks: (apiGuest as any).favoriteDrinks ?? [],
        createdAt: apiGuest.createdAt,
        updatedAt: apiGuest.updatedAt,
        createdBy: (apiGuest as any).createdBy ?? undefined,
      } as Guest));
      
      setGuests(mappedGuests);
    }
  }, [apiGuests]);

  // Service Requests - empty array, will be filled by API
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  
  // Sync service requests from API when data arrives
  // IMPORTANT: Always sync, even when array is empty (for "Clear All" to work)
  useEffect(() => {
    // Map API DTO to app ServiceRequest type with all required fields
    const mappedRequests: ServiceRequest[] = apiServiceRequests.map(apiReq => {
      // Find guest to get name
      const guest = guests.find(g => g.id === apiReq.guestId);
      const guestName = guest ? `${guest.firstName} ${guest.lastName}` : apiReq.guestName;

      // Find location/cabin
      const location = locations.find(l => l.id === apiReq.locationId);
      const cabinName = location?.name ?? apiReq.guestCabin;

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
        assignedTo: apiReq.assignedTo || undefined, // Use backend's assignedTo field directly
        acceptedAt: apiReq.acceptedAt ? new Date(apiReq.acceptedAt) : undefined,
        completedAt: apiReq.completedAt ? new Date(apiReq.completedAt) : undefined,
        notes: apiReq.message || undefined,
      };
    });

    setServiceRequests(mappedRequests);
  }, [apiServiceRequests, guests, locations, crewMembers]);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Removed localStorage persistence for crew members - using API as single source of truth

  // REMOVED: Auto-reset crew statuses when assignments change
  // This was automatically resetting manual "on-duty" (Emergency) status back to "off-duty"
  // Manual status changes should persist in the database until manually changed
  // The crew status should come from the backend API, not be auto-calculated here

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

  // Mark changes as notified - sends to backend API
  const markChangesAsNotified = async (changes: CrewChange[]) => {
    if (changes.length === 0) return;

    try {
      // Call backend API to create crew change logs
      await api.post('/crew-change-logs/bulk', { changes });

      // Invalidate crew change logs cache to trigger re-fetch
      queryClient.invalidateQueries({ queryKey: ['crew-change-logs'] });

      console.log(`✅ Created ${changes.length} crew change logs`);
    } catch (error) {
      console.error('❌ Failed to create crew change logs:', error);
      throw error;
    }
  };

  // Save assignments to database
  // Accepts optional assignmentsToSave parameter to avoid race conditions
  const saveAssignments = async (assignmentsToSave?: Assignment[]) => {
    setIsSaving(true);

    // Use provided assignments or fallback to context assignments
    const assignmentsData = assignmentsToSave || assignments;
    setPreviousAssignments([...assignmentsData]);

    try {
      // Get all unique dates from assignments
      const uniqueDates = Array.from(new Set(assignmentsData.map(a => a.date)));

      // Delete all existing assignments for these dates first
      // This ensures removed assignments are actually deleted from the database
      for (const date of uniqueDates) {
        await deleteAssignmentsByDate.mutateAsync(date);
      }

      // Now create all the new assignments
      if (assignmentsData.length > 0) {
        await createBulkAssignments.mutateAsync(assignmentsData);
      }

      const now = new Date();
      setLastSaved(now);

      // Invalidate assignments cache to trigger re-fetch
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    } catch (error) {
      console.error('[AppData] Failed to save assignments:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
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

    // Find next shift (must be AFTER current shift, not same as current)
    // First, try to find next shift today that starts after current time
    let nextShiftConfig = shifts.find(shift => {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      return startTime > currentTime;
    });

    // If no shift found today OR if next shift is same as current shift, use tomorrow's first shift
    let nextShiftDate = today;
    if (!nextShiftConfig || (currentShift && nextShiftConfig.id === currentShift.id)) {
      // No more shifts today or next = current, so next shift is tomorrow's first shift
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      nextShiftDate = tomorrow.toISOString().split('T')[0];
      nextShiftConfig = shifts[0]; // First shift of the day
    }

    let nextBackup: CrewMemberExtended[] = [];

    if (nextShiftConfig) {
      // Get next shift assignments from the appropriate date
      const relevantAssignments = nextShiftDate === today
        ? todayAssignments
        : assignments.filter(a => a.date === nextShiftDate);

      let nextShiftAssignments = relevantAssignments.filter(
        a => a.shiftId === nextShiftConfig.id && a.type === 'primary'
      );

      let nextBackupAssignments = relevantAssignments.filter(
        a => a.shiftId === nextShiftConfig.id && a.type === 'backup'
      );

      // Populate next shift primary crew (don't filter out onDuty if it's a different shift)
      nextShiftAssignments.forEach(assignment => {
        const member = crewMembers.find(c => c.id === assignment.crewId);

        if (member && member.department === 'Interior' && member.status !== 'on-leave') {
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

  // Message Functions
  const sendMessage = (message: Omit<Message, 'id' | 'timestamp' | 'deliveryStatus'>) => {
    const newMessage: Message = {
      ...message,
      id: `message-${Date.now()}`,
      timestamp: new Date(),
      deliveryStatus: 'sent' as const,
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

  // Guest Management Functions - Connected to Backend API
  const addGuest = (guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Call backend API mutation
    apiCreateGuest(guest as any);
  };

  const updateGuest = (id: string, updates: Partial<Guest>) => {
    // Call backend API mutation
    apiUpdateGuest(id, updates as any);
  };

  const deleteGuest = (id: string) => {
    // Call backend API mutation
    apiDeleteGuest(id);
  };

  // Yacht Location Management Functions
  const addLocation = (location: Omit<YachtLocation, 'id' | 'createdAt' | 'createdBy' | 'isCustom'> & { createdBy?: string }) => {
    const now = new Date().toISOString();
    const newLocation: YachtLocation = {
      ...location,
      id: `LOC-${Date.now()}`,
      isCustom: true,
      createdBy: location.createdBy ?? 'system',
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

  const updateLocationDeviceStatus = (id: string, deviceStatus: 'online' | 'offline' | 'alert', activeRequests?: number, lastActivity?: string) => {
    setYachtLocations(prev =>
      prev.map(location =>
        location.id === id
          ? {
              ...location,
              deviceStatus,
              activeRequests: activeRequests !== undefined ? activeRequests : location.activeRequests,
              lastActivity: lastActivity ?? location.lastActivity
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

  // forwardServiceRequest removed - components should update service request with categoryId via API

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
              completedBy: crewMemberName ?? req.assignedTo ?? '',
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

  // getPendingRequestsForService removed - use API filters instead

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
        completeServiceRequest,
        // simulateNewRequest removed - use API directly
        // forwardServiceRequest removed - use service categories instead
        // getPendingRequestsForService removed - use API filters instead
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