/**
 * AppDataContext - Main Application Data Context
 *
 * This is now a lightweight wrapper that combines all specialized contexts:
 * - GuestsContext: Guest management
 * - ServiceRequestsContext: Service request management
 * - DutyRosterContext: Duty roster (assignments & shifts)
 * - LocationsContext: Location management
 *
 * REFACTORED from 1025 lines to ~300 lines by splitting into specialized contexts
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useCrewMembers as useCrewMembersApi } from '../hooks/useCrewMembers';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMemo } from 'react';

// Import child context providers and hooks
import { GuestsProvider, useGuests as useGuestsContext } from './GuestsContext';
import { ServiceRequestsProvider, useServiceRequests as useServiceRequestsContext } from './ServiceRequestsContext';
import { DutyRosterProvider, useDutyRoster as useDutyRosterContext } from './DutyRosterContext';
import { LocationsProvider, useLocationsContext } from './LocationsContext';

// Import types
import {
  CrewMemberExtended,
  Role,
  CrewChange,
  CrewChangeLog,
} from '../types/crew';
import { Guest } from '../types/guests';
import {
  ServiceRequest,
  ServiceRequestHistory,
  InteriorTeam,
  NotificationSettings,
  UserPreferences,
  Message,
} from '../types/service-requests';
import {
  DeviceLog,
  CallLog,
  ActivityLog,
  RecentActivity,
} from '../types/activity-logs';
import { YachtLocation } from '../types/yacht-locations';
import { Assignment, ShiftConfig } from '../components/duty-roster/types';
import { Location } from '../domain/locations';

// Re-export types for backward compatibility
export type {
  CrewMemberExtended,
  Role,
  CrewChange,
  CrewChangeLog,
} from '../types/crew';
export type { Guest } from '../types/guests';
export type {
  ServiceRequest,
  ServiceRequestHistory,
  InteriorTeam,
  NotificationSettings,
  UserPreferences,
  Message,
} from '../types/service-requests';
export type {
  DeviceLog,
  CallLog,
  ActivityLog,
  RecentActivity,
} from '../types/activity-logs';
export type { YachtLocation, LocationCategory, DeckType } from '../types/yacht-locations';

interface AppDataContextType {
  // Crew data
  crewMembers: CrewMemberExtended[];
  crew: CrewMemberExtended[]; // Alias for compatibility
  setCrewMembers: (members: CrewMemberExtended[]) => void;

  // Duty roster data (from DutyRosterContext)
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  shifts: ShiftConfig[];
  setShifts: (shifts: ShiftConfig[]) => void;
  saveAssignments: (assignmentsToSave?: Assignment[]) => Promise<void>;
  lastSaved: Date | null;
  isSaving: boolean;
  getCurrentDutyStatus: () => {
    onDuty: CrewMemberExtended[];
    nextShift: CrewMemberExtended[];
    backup: CrewMemberExtended[];
    nextBackup: CrewMemberExtended[];
  };
  detectRosterChanges: () => CrewChange[];
  markChangesAsNotified: (changes: CrewChange[]) => void;

  // Activity Logs (deprecated - use useActivityLogs hook instead)
  deviceLogs: DeviceLog[];
  callLogs: CallLog[];
  crewChangeLogs: CrewChangeLog[];
  activityLogs: ActivityLog[];
  addDeviceLog: (log: Omit<DeviceLog, 'id' | 'timestamp'>) => void;
  addCallLog: (log: Omit<CallLog, 'id' | 'timestamp'>) => void;
  addCrewChangeLog: (log: Omit<CrewChangeLog, 'id' | 'timestamp'>) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;

  // Messages (deprecated - use useMessages hook instead)
  messages: Message[];
  sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'deliveryStatus'>) => void;

  // Recent Activity (deprecated - use useActivityLogs hook instead)
  recentActivity: RecentActivity[];

  // Role Permissions (deprecated - will use backend API)
  rolePermissions: Record<Role, string[]>;
  updateRolePermissions: (role: Role, permissions: string[]) => void;

  // Notification Settings (deprecated - will use backend API)
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: NotificationSettings) => void;

  // User Preferences (deprecated - use useUserPreferences hook instead)
  userPreferences: UserPreferences;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;

  // Guest Management (from GuestsContext)
  guests: Guest[];
  addGuest: (guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGuest: (id: string, guest: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  getGuest: (id: string) => Guest | undefined;
  getGuestByLocationId: (locationId: string) => Guest | undefined;
  getLocationByGuestId: (guestId: string) => Location | undefined;

  // Yacht Location Management (deprecated - use LocationsContext instead)
  yachtLocations: YachtLocation[];
  addLocation: (location: Omit<YachtLocation, 'id' | 'createdAt' | 'createdBy' | 'isCustom'>) => void;
  updateLocation: (id: string, updates: Partial<YachtLocation>) => void;
  deleteLocation: (id: string) => void;
  updateLocationDeviceStatus: (
    id: string,
    deviceStatus: 'online' | 'offline' | 'alert',
    activeRequests?: number
  ) => void;

  // Locations Management (from LocationsContext)
  locations: Location[];

  // Service Request Management (from ServiceRequestsContext)
  serviceRequests: ServiceRequest[];
  addServiceRequest: (request: Omit<ServiceRequest, 'id' | 'timestamp'>) => ServiceRequest;
  acceptServiceRequest: (requestId: string, crewMemberId: string) => void;
  delegateServiceRequest: (requestId: string, crewMemberId: string) => void;
  completeServiceRequest: (requestId: string, crewMemberName?: string) => void;
  serviceRequestHistory: ServiceRequestHistory[];
  clearServiceRequestHistory: () => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

/**
 * Internal provider that consumes child contexts and combines them
 */
function AppDataProviderInternal({ children }: { children: ReactNode }) {
  // Get data from child contexts
  const guestsContext = useGuestsContext();
  const serviceRequestsContext = useServiceRequestsContext();
  const dutyRosterContext = useDutyRosterContext();
  const locationsContext = useLocationsContext();

  // Fetch crew members from API
  const { crewMembers: apiCrewMembers } = useCrewMembersApi();

  // Initialize WebSocket for real-time updates
  const { isConnected: wsConnected } = useWebSocket();

  // Map crew members to extended format
  const crewMembers: CrewMemberExtended[] = useMemo(() => {
    return apiCrewMembers.map((member) => ({
      id: member.id,
      name: member.name,
      position: member.position,
      department: member.department,
      role: member.role ?? undefined,
      status: member.status as any,
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
    }));
  }, [apiCrewMembers]);

  const setCrewMembers = useCallback((members: CrewMemberExtended[]) => {
    console.warn('setCrewMembers is deprecated. Crew members are managed via API.');
  }, []);

  // Deprecated activity logs - empty arrays
  const [deviceLogs] = useState<DeviceLog[]>([]);
  const [callLogs] = useState<CallLog[]>([]);
  const [crewChangeLogs] = useState<CrewChangeLog[]>([]);
  const [activityLogs] = useState<ActivityLog[]>([]);

  const addDeviceLog = useCallback(() => {
    console.warn('addDeviceLog is deprecated. Use backend API instead.');
  }, []);

  const addCallLog = useCallback(() => {
    console.warn('addCallLog is deprecated. Use backend API instead.');
  }, []);

  const addCrewChangeLog = useCallback(() => {
    console.warn('addCrewChangeLog is deprecated. Use backend API instead.');
  }, []);

  const addActivityLog = useCallback(() => {
    console.warn('addActivityLog is deprecated. Use backend API instead.');
  }, []);

  // Deprecated messages - empty array
  const [messages] = useState<Message[]>([]);
  const sendMessage = useCallback(() => {
    console.warn('sendMessage is deprecated. Use useMessages hook instead.');
  }, []);

  // Deprecated recent activity - empty array
  const [recentActivity] = useState<RecentActivity[]>([]);

  // Deprecated role permissions - empty object
  const [rolePermissions] = useState<Record<Role, string[]>>({} as Record<Role, string[]>);
  const updateRolePermissions = useCallback(() => {
    console.warn('updateRolePermissions is deprecated. Use backend API instead.');
  }, []);

  // Deprecated notification settings - empty object
  const [notificationSettings] = useState<NotificationSettings>({} as NotificationSettings);
  const updateNotificationSettings = useCallback(() => {
    console.warn('updateNotificationSettings is deprecated. Use backend API instead.');
  }, []);

  // Deprecated user preferences - empty object
  const [userPreferences] = useState<UserPreferences>({} as UserPreferences);
  const updateUserPreferences = useCallback(() => {
    console.warn('updateUserPreferences is deprecated. Use useUserPreferences hook instead.');
  }, []);

  // Combine all context values
  const value: AppDataContextType = {
    // Crew
    crewMembers,
    crew: crewMembers, // Alias
    setCrewMembers,

    // Duty Roster (from DutyRosterContext)
    assignments: dutyRosterContext.assignments,
    setAssignments: dutyRosterContext.setAssignments,
    shifts: dutyRosterContext.shifts,
    setShifts: dutyRosterContext.setShifts,
    saveAssignments: dutyRosterContext.saveAssignments,
    lastSaved: dutyRosterContext.lastSaved,
    isSaving: dutyRosterContext.isSaving,
    getCurrentDutyStatus: dutyRosterContext.getCurrentDutyStatus,
    detectRosterChanges: dutyRosterContext.detectRosterChanges,
    markChangesAsNotified: dutyRosterContext.markChangesAsNotified,

    // Activity Logs (deprecated)
    deviceLogs,
    callLogs,
    crewChangeLogs,
    activityLogs,
    addDeviceLog,
    addCallLog,
    addCrewChangeLog,
    addActivityLog,

    // Messages (deprecated)
    messages,
    sendMessage,

    // Recent Activity (deprecated)
    recentActivity,

    // Role Permissions (deprecated)
    rolePermissions,
    updateRolePermissions,

    // Notification Settings (deprecated)
    notificationSettings,
    updateNotificationSettings,

    // User Preferences (deprecated)
    userPreferences,
    updateUserPreferences,

    // Guests (from GuestsContext)
    guests: guestsContext.guests,
    addGuest: guestsContext.addGuest,
    updateGuest: guestsContext.updateGuest,
    deleteGuest: guestsContext.deleteGuest,
    getGuest: guestsContext.getGuest,
    getGuestByLocationId: guestsContext.getGuestByLocationId,
    getLocationByGuestId: guestsContext.getLocationByGuestId,

    // Locations (from LocationsContext)
    locations: locationsContext.locations,
    yachtLocations: locationsContext.yachtLocations,
    addLocation: locationsContext.addLocation,
    updateLocation: locationsContext.updateLocation,
    deleteLocation: locationsContext.deleteLocation,
    updateLocationDeviceStatus: locationsContext.updateLocationDeviceStatus,

    // Service Requests (from ServiceRequestsContext)
    serviceRequests: serviceRequestsContext.serviceRequests,
    addServiceRequest: serviceRequestsContext.addServiceRequest,
    acceptServiceRequest: serviceRequestsContext.acceptServiceRequest,
    delegateServiceRequest: serviceRequestsContext.delegateServiceRequest,
    completeServiceRequest: serviceRequestsContext.completeServiceRequest,
    serviceRequestHistory: serviceRequestsContext.serviceRequestHistory,
    clearServiceRequestHistory: serviceRequestsContext.clearServiceRequestHistory,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/**
 * Main AppDataProvider that wraps all child providers
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  return (
    <GuestsProvider>
      <ServiceRequestsProvider>
        <DutyRosterProvider>
          <LocationsProvider>
            <AppDataProviderInternal>{children}</AppDataProviderInternal>
          </LocationsProvider>
        </DutyRosterProvider>
      </ServiceRequestsProvider>
    </GuestsProvider>
  );
}

/**
 * Hook to use AppData context
 */
export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
