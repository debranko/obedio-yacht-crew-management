/**
 * WebSocket Hook
 * Real-time communication with backend using Socket.IO
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

export interface WebSocketEvents {
  // Service Request Events
  'service-request:created': (data: any) => void;
  'service-request:updated': (data: any) => void;
  'service-request:completed': (data: any) => void;

  // Device Events
  'device:created': (data: any) => void;
  'device:updated': (data: any) => void;
  'device:deleted': (data: any) => void;
  'device:status-changed': (data: any) => void;

  // Location Events
  'location:dnd-toggled': (data: any) => void;
  'location:created': (data: any) => void;
  'location:updated': (data: any) => void;
  'location:deleted': (data: any) => void;

  // Crew Events
  'crew:status-changed': (data: any) => void;

  // Guest Events
  'guest:created': (data: any) => void;
  'guest:updated': (data: any) => void;
  'guest:deleted': (data: any) => void;

  // Assignment Events (Duty Roster)
  'assignment:created': (data: any) => void;
  'assignment:updated': (data: any) => void;
  'assignment:deleted': (data: any) => void;

  // Emergency Events
  'emergency:alert': (data: any) => void;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) {
      // Don't connect if not authenticated
      return;
    }

    console.log('🔌 Initializing WebSocket connection...');

    const socket = io(WS_URL, {
      auth: {
        userId: user.id,
        username: user.username,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🔥 WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Service Request Events - Invalidate queries to refetch data
    socket.on('service-request:created', (data) => {
      console.log('📞 New service request:', data);
      // Invalidate BOTH query keys (old and API)
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });

      // Optional: Show notification to user
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Service Request', {
          body: `Service request from ${data.guestName || 'Guest'}`,
          icon: '/obedio-icon.png',
        });
      }
    });

    socket.on('service-request:updated', (data) => {
      console.log('📞 Service request updated:', data);
      // Invalidate BOTH query keys (old and API)
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });
    });

    socket.on('service-request:completed', (data) => {
      console.log('✅ Service request completed:', data);
      // Invalidate BOTH query keys (old and API)
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });
    });

    // Device Events
    socket.on('device:created', (data) => {
      console.log('📱 Device created:', data);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    });

    socket.on('device:updated', (data) => {
      console.log('📱 Device updated:', data);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    });

    socket.on('device:deleted', (data) => {
      console.log('📱 Device deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    });

    socket.on('device:status-changed', (data) => {
      console.log('📱 Device status changed:', data);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      // Also invalidate device logs if status changed
      queryClient.invalidateQueries({ queryKey: ['device-logs'] });
    });

    // Location Events
    socket.on('location:dnd-toggled', (data) => {
      console.log('🚪 Location DND toggled:', data);
      queryClient.invalidateQueries({ queryKey: ['locations'] });

      // Optional: Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Do Not Disturb Updated', {
          body: `${data.name}: DND ${data.doNotDisturb ? 'enabled' : 'disabled'}`,
          icon: '/obedio-icon.png',
        });
      }
    });

    socket.on('location:created', (data) => {
      console.log('🏠 Location created:', data);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    });

    socket.on('location:updated', (data) => {
      console.log('🏠 Location updated:', data);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    });

    socket.on('location:deleted', (data) => {
      console.log('🏠 Location deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    });

    // Crew Events
    socket.on('crew:status-changed', (data) => {
      console.log('👤 Crew status changed:', data);
      queryClient.invalidateQueries({ queryKey: ['crew'] });

      // Optional: Show notification for important status changes
      if (data.status === 'on-duty' || data.status === 'off-duty') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Crew Status Update', {
            body: `${data.name} is now ${data.status}`,
            icon: '/obedio-icon.png',
          });
        }
      }
    });

    // Guest Events
    socket.on('guest:created', (data) => {
      console.log('👥 Guest created:', data);
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    });

    socket.on('guest:updated', (data) => {
      console.log('👥 Guest updated:', data);
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    });

    socket.on('guest:deleted', (data) => {
      console.log('👥 Guest deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    });

    // Assignment Events (Duty Roster)
    socket.on('assignment:created', (data) => {
      console.log('📅 Assignment created:', data);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    });

    socket.on('assignment:updated', (data) => {
      console.log('📅 Assignment updated:', data);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    });

    socket.on('assignment:deleted', (data) => {
      console.log('📅 Assignment deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    });

    // Emergency Events
    socket.on('emergency:alert', (data) => {
      console.log('🚨 EMERGENCY ALERT:', data);

      // Show browser notification for emergencies
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('⚠️ EMERGENCY ALERT', {
            body: data.message || 'Emergency situation detected',
            icon: '/obedio-icon.png',
            requireInteraction: true, // Keep notification until user interacts
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification('⚠️ EMERGENCY ALERT', {
                body: data.message || 'Emergency situation detected',
                icon: '/obedio-icon.png',
                requireInteraction: true,
              });
            }
          });
        }
      }

      // Play alert sound (if available)
      try {
        const audio = new Audio('/sounds/emergency-alert.mp3');
        audio.play().catch((e) => console.log('Could not play alert sound:', e));
      } catch (e) {
        console.log('Alert sound not available');
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting WebSocket...');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, queryClient]);

  // Subscribe to a specific event
  const on = useCallback(<K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);

      // Return unsubscribe function
      return () => {
        socketRef.current?.off(event, handler);
      };
    }
  }, []);

  // Unsubscribe from an event
  const off = useCallback(<K extends keyof WebSocketEvents>(
    event: K,
    handler?: WebSocketEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, []);

  // Emit an event (for future use if needed)
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit:', event);
    }
  }, [isConnected]);

  return {
    isConnected,
    connectionError,
    on,
    off,
    emit,
    socket: socketRef.current,
  };
}
