/**
 * WebSocket Hook (Refactored)
 *
 * This hook now uses the singleton WebSocketService to prevent multiple connections.
 * All components using this hook will share the same WebSocket connection.
 *
 * REFACTORED: 2025-11-03
 * - Removed duplicate socket creation logic
 * - Now wraps singleton WebSocketService from src/services/websocket.ts
 * - Prevents disconnect/reconnect loops
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { websocketService, type AllEvents } from '../services/websocket';

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

  // Message Events
  'new_message': (data: any) => void;
  'broadcast_message': (data: any) => void;

  // Activity Log Events
  'activity-log:created': (data: any) => void;

  // Emergency Events
  'emergency:alert': (data: any) => void;

  // Settings Events
  'settings:updated': (data: any) => void;
}

/**
 * React hook wrapper for singleton WebSocket service
 * Provides React Query integration and connection state management
 */
export function useWebSocket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize singleton connection when user is authenticated
  useEffect(() => {
    if (!user) {
      // Don't connect if not authenticated
      return;
    }

    console.log('🔌 Initializing WebSocket via singleton service...');

    // Connect singleton (will do nothing if already connected)
    websocketService.connect(user.id);

    // Subscribe to connection events to track state
    const unsubscribeConnection = websocketService.subscribe('connection', (event: AllEvents) => {
      if (event.type === 'connected') {
        console.log('✅ WebSocket connected (hook):', event.data.socketId);
        setIsConnected(true);
        setConnectionError(null);
      } else if (event.type === 'disconnected') {
        console.log('❌ WebSocket disconnected (hook):', event.data.reason);
        setIsConnected(false);
      }
    });

    // Check initial connection state
    setIsConnected(websocketService.isSocketConnected());

    // NOTE: Service request invalidation moved to useServiceRequestsApi hook
    // to prevent duplicate invalidations when multiple components use this hook

    // Subscribe to device events
    const unsubscribeDevices = websocketService.subscribe('service-request', (event) => {
      // Device events come through service-request channel in current implementation
      if (event.data?.deviceId) {
        console.log('📱 Device event:', event.type);
        queryClient.invalidateQueries({ queryKey: ['devices'] });
        queryClient.invalidateQueries({ queryKey: ['device-logs'] });
      }
    });

    // Subscribe to guest events
    const unsubscribeGuests = websocketService.subscribe('guest', (event) => {
      console.log('👥 Guest event:', event.type);
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    });

    // Subscribe to crew events
    const unsubscribeCrew = websocketService.subscribe('crew', (event) => {
      console.log('👤 Crew event:', event.type);
      queryClient.invalidateQueries({ queryKey: ['crew'] });

      // Show notification for important status changes
      if (event.data?.status && ['on-duty', 'off-duty'].includes(event.data.status)) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Crew Status Update', {
            body: `Crew member is now ${event.data.status}`,
            icon: '/obedio-icon.png',
          });
        }
      }
    });

    // Subscribe to emergency events
    const unsubscribeEmergency = websocketService.subscribe('emergency', (event) => {
      console.log('🚨 Emergency event:', event.type);

      if (event.type === 'emergency-alert') {
        // Show browser notification for emergencies
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('⚠️ EMERGENCY ALERT', {
              body: event.data?.message || 'Emergency situation detected',
              icon: '/obedio-icon.png',
              requireInteraction: true,
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                new Notification('⚠️ EMERGENCY ALERT', {
                  body: event.data?.message || 'Emergency situation detected',
                  icon: '/obedio-icon.png',
                  requireInteraction: true,
                });
              }
            });
          }
        }

        // Play alert sound
        try {
          const audio = new Audio('/sounds/emergency-alert.mp3');
          audio.play().catch((e) => console.log('Could not play alert sound:', e));
        } catch (e) {
          console.log('Alert sound not available');
        }
      }
    });

    // Cleanup: unsubscribe but DON'T disconnect (other components may still need it)
    return () => {
      console.log('🔌 Component unmounting - unsubscribing from WebSocket events');
      unsubscribeConnection();
      unsubscribeDevices();
      unsubscribeGuests();
      unsubscribeCrew();
      unsubscribeEmergency();
      // NOTE: We do NOT disconnect the singleton service here
      // It will remain connected for other components
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only re-run when user ID changes (queryClient is stable singleton)

  // Subscribe to a specific event
  const on = useCallback(<K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K]
  ) => {
    // Map socket.io event names to our internal event types
    const eventTypeMap: Record<string, string> = {
      'service-request:created': 'service-request',
      'service-request:updated': 'service-request',
      'service-request:completed': 'service-request',
      'device:created': 'service-request',
      'device:updated': 'service-request',
      'device:deleted': 'service-request',
      'device:status-changed': 'service-request',
      'location:dnd-toggled': 'service-request',
      'location:created': 'service-request',
      'location:updated': 'service-request',
      'location:deleted': 'service-request',
      'crew:status-changed': 'crew',
      'guest:created': 'guest',
      'guest:updated': 'guest',
      'guest:deleted': 'guest',
      'assignment:created': 'service-request',
      'assignment:updated': 'service-request',
      'assignment:deleted': 'service-request',
      'new_message': 'service-request',
      'broadcast_message': 'service-request',
      'activity-log:created': 'service-request',
      'emergency:alert': 'emergency',
      'settings:updated': 'service-request',
    };

    const eventType = eventTypeMap[event as string] || 'service-request';

    // Create wrapper that filters events by specific type
    const wrappedHandler = (allEvent: AllEvents) => {
      // Check if this event matches the specific type requested
      const expectedEventType = `${event}`.replace(':', '-');
      if (allEvent.type === expectedEventType || allEvent.type.startsWith(event as string)) {
        handler(allEvent.data);
      }
    };

    const unsubscribe = websocketService.subscribe(eventType, wrappedHandler);
    return unsubscribe;
  }, []);

  // Unsubscribe from an event (handled by the unsubscribe function returned by `on`)
  const off = useCallback(<K extends keyof WebSocketEvents>(
    event: K,
    handler?: WebSocketEvents[K]
  ) => {
    // No-op: unsubscribe is handled by the function returned from `on`
    console.log('WebSocket off() called - use the unsubscribe function returned by on() instead');
  }, []);

  // Emit an event
  const emit = useCallback((event: string, data?: any) => {
    websocketService.emit(event, data);
  }, []);

  return useMemo(() => ({
    isConnected,
    connectionError,
    on,
    off,
    emit,
    socket: null, // Don't expose raw socket - use singleton service methods instead
  }), [isConnected, connectionError, on, off, emit]);
}
