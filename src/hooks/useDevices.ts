/**
 * React Query hooks for Device Manager
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Device {
  id: string;
  deviceId: string;
  name: string;
  type: 'smart_button' | 'watch' | 'repeater' | 'mobile_app';
  subType?: 'ios' | 'android' | 'esp32' | 'lora_wifi';
  status: 'online' | 'offline' | 'low_battery' | 'error';
  locationId?: string;
  location?: {
    id: string;
    name: string;
    type: string;
    floor?: string;
  };
  crewMemberId?: string;
  crewMember?: {
    id: string;
    name: string;
    position: string;
  };
  batteryLevel?: number;
  signalStrength?: number;
  connectionType?: 'lora_868' | 'lora_915' | 'lora_433' | 'wifi' | 'bluetooth';
  lastSeen?: string;
  config?: any;
  firmwareVersion?: string;
  hardwareVersion?: string;
  macAddress?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceLog {
  id: string;
  deviceId: string;
  eventType: string;
  eventData?: any;
  severity: 'info' | 'warning' | 'error';
  createdAt: string;
}

export interface DeviceFilters {
  type?: string;
  status?: string;
  locationId?: string;
  crewMemberId?: string;
}

/**
 * Fetch all devices with optional filters
 */
export function useDevices(filters?: DeviceFilters) {
  return useQuery({
    queryKey: ['devices', filters],
    queryFn: async () => {
      console.log('🔍 useDevices: Fetching devices...', filters);
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.locationId) params.append('locationId', filters.locationId);
      if (filters?.crewMemberId) params.append('crewMemberId', filters.crewMemberId);

      const url = `/devices?${params.toString()}`;
      console.log('🔍 useDevices: API URL:', url);
      
      const response = await api.get(url);
      console.log('✅ useDevices: Got response:', response);
      return response as Device[];
    }
  });
}

/**
 * Fetch single device with details
 */
export function useDevice(id: string) {
  return useQuery({
    queryKey: ['devices', id],
    queryFn: async () => {
      const response = await api.get(`/devices/${id}`);
      return response as Device;
    },
    enabled: !!id
  });
}

/**
 * Fetch device configuration
 */
export function useDeviceConfig(id: string) {
  return useQuery({
    queryKey: ['devices', id, 'config'],
    queryFn: async () => {
      const response = await api.get(`/devices/${id}/config`);
      return response;
    },
    enabled: !!id
  });
}

/**
 * Fetch device logs
 */
export function useDeviceLogs(id: string, options?: { limit?: number; eventType?: string }) {
  return useQuery({
    queryKey: ['devices', id, 'logs', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.eventType) params.append('eventType', options.eventType);

      const response = await api.get(`/devices/${id}/logs?${params.toString()}`);
      return response as DeviceLog[];
    },
    enabled: !!id
  });
}

/**
 * Fetch device statistics
 */
export function useDeviceStats() {
  return useQuery({
    queryKey: ['devices', 'stats'],
    queryFn: async () => {
      const response = await api.get('/devices/stats/summary');
      return response as {
        total: number;
        online: number;
        offline: number;
        lowBattery: number;
        byType: Record<string, number>;
      };
    }
  });
}

/**
 * Device mutations
 */
export function useDeviceMutations() {
  const queryClient = useQueryClient();

  const createDevice = useMutation({
    mutationFn: async (data: Partial<Device>) => {
      const response = await api.post('/devices', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    }
  });

  const updateDevice = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Device> }) => {
      const response = await api.put(`/devices/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['devices', variables.id] });
    }
  });

  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    }
  });

  const updateDeviceConfig = useMutation({
    mutationFn: async ({ id, config }: { id: string; config: any }) => {
      const response = await api.put(`/devices/${id}/config`, { config });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['devices', variables.id, 'config'] });
    }
  });

  const testDevice = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/devices/${id}/test`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['devices', id, 'logs'] });
    }
  });

  return {
    createDevice: createDevice.mutateAsync,
    updateDevice: updateDevice.mutateAsync,
    deleteDevice: deleteDevice.mutateAsync,
    updateDeviceConfig: updateDeviceConfig.mutateAsync,
    testDevice: testDevice.mutateAsync,
    isCreating: createDevice.isPending,
    isUpdating: updateDevice.isPending,
    isDeleting: deleteDevice.isPending,
    isTesting: testDevice.isPending
  };
}
