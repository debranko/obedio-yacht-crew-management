/**
 * WebSocket Service - Real-time Communication
 * Handles all real-time events between frontend and backend
 */

/// <reference types="vite/client" />

import { io, Socket } from 'socket.io-client';

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
}

export interface ServiceRequestEvent {
  type: 'service-request-created' | 'service-request-updated' | 'service-request-completed';
  data: {
    id: string;
    guestId: string;
    crewId?: string;
    status: string;
    priority: string;
    message: string;
  };
  timestamp: string;
}

export interface EmergencyEvent {
  type: 'emergency-alert' | 'emergency-resolved';
  data: {
    id: string;
    locationId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    triggeredBy: string;
  };
  timestamp: string;
}

export interface CrewStatusEvent {
  type: 'crew-status-changed' | 'crew-location-changed';
  data: {
    crewId: string;
    status?: string;
    locationId?: string;
    timestamp: string;
  };
  timestamp: string;
}

export interface GuestEvent {
  type: 'guest-created' | 'guest-updated' | 'guest-deleted';
  data: {
    id: string;
    action: string;
    guest?: any;
  };
  timestamp: string;
}

export interface ConnectionEvent {
  type: 'connected' | 'disconnected';
  data: {
    socketId?: string;
    reason?: string;
  };
  timestamp: string;
}

export type AllEvents = ServiceRequestEvent | EmergencyEvent | CrewStatusEvent | GuestEvent | ConnectionEvent;

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private listeners: Map<string, ((event: AllEvents) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private isConnected = false;
  private isConnecting = false; // Track if connection is in progress to prevent multiple simultaneous connections
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalDisconnect = false;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId?: string): void {
    // Prevent multiple connection attempts - check both connected and connecting states
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection already in progress, skipping duplicate attempt');
      return;
    }

    try {
      // Mark as connecting to prevent race conditions from multiple components
      this.isConnecting = true;
      console.log('WebSocket connection initiated');

      // Connect to Socket.IO server
      const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

      this.socket = io(serverUrl, {
        auth: { userId },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.isConnecting = false; // Reset flag on error
      this.handleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionalDisconnect = true;
    this.isConnecting = false; // Reset flag on manual disconnect
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.isConnected = true;
      this.isConnecting = false; // Connection established, reset flag
      this.reconnectAttempts = 0;
      this.notifyListeners('connection', { type: 'connected', data: { socketId: this.socket?.id }, timestamp: new Date().toISOString() } as ConnectionEvent);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false; // Disconnected, reset flag
      this.notifyListeners('connection', { type: 'disconnected', data: { reason }, timestamp: new Date().toISOString() } as ConnectionEvent);

      // Auto-reconnect unless it was intentional
      if (!this.isIntentionalDisconnect && reason !== 'io client disconnect') {
        this.handleReconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.isConnecting = false; // Reconnected successfully, reset flag
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('WebSocket reconnection attempt', attemptNumber);
    });

    this.socket.on('reconnect_error', (error: any) => {
      console.log('WebSocket reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.log('WebSocket reconnection failed - will keep trying');
      // Socket.io will continue trying with its built-in logic
    });

    this.socket.on('connect_error', (error: any) => {
      console.log('WebSocket connection error - server may not be ready yet');
      this.isConnected = false;
      this.isConnecting = false; // Connection failed, reset flag to allow retry
      this.handleReconnect();
    });

    // Service Request Events
    this.socket.on('service-request:created', (data: any) => {
      this.notifyListeners('service-request', {
        type: 'service-request-created',
        data,
        timestamp: new Date().toISOString()
      } as ServiceRequestEvent);
    });

    this.socket.on('service-request:updated', (data: any) => {
      this.notifyListeners('service-request', {
        type: 'service-request-updated',
        data,
        timestamp: new Date().toISOString()
      } as ServiceRequestEvent);
    });

    this.socket.on('service-request:completed', (data: any) => {
      this.notifyListeners('service-request', {
        type: 'service-request-completed',
        data,
        timestamp: new Date().toISOString()
      } as ServiceRequestEvent);
    });

    // Emergency Events
    this.socket.on('emergency:alert', (data: any) => {
      this.notifyListeners('emergency', {
        type: 'emergency-alert',
        data,
        timestamp: new Date().toISOString()
      } as EmergencyEvent);
    });

    this.socket.on('emergency:resolved', (data: any) => {
      this.notifyListeners('emergency', {
        type: 'emergency-resolved',
        data,
        timestamp: new Date().toISOString()
      } as EmergencyEvent);
    });

    // Crew Events
    this.socket.on('crew:status-changed', (data: any) => {
      this.notifyListeners('crew', {
        type: 'crew-status-changed',
        data,
        timestamp: new Date().toISOString()
      } as CrewStatusEvent);
    });

    this.socket.on('crew:location-changed', (data: any) => {
      this.notifyListeners('crew', {
        type: 'crew-location-changed',
        data,
        timestamp: new Date().toISOString()
      } as CrewStatusEvent);
    });

    // Guest Events
    this.socket.on('guest:created', (data: any) => {
      this.notifyListeners('guest', {
        type: 'guest-created',
        data,
        timestamp: new Date().toISOString()
      } as GuestEvent);
    });

    this.socket.on('guest:updated', (data: any) => {
      this.notifyListeners('guest', {
        type: 'guest-updated',
        data,
        timestamp: new Date().toISOString()
      } as GuestEvent);
    });

    this.socket.on('guest:deleted', (data: any) => {
      this.notifyListeners('guest', {
        type: 'guest-deleted',
        data,
        timestamp: new Date().toISOString()
      } as GuestEvent);
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.isIntentionalDisconnect) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000); // Max 30s

    console.log(`WebSocket reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected && !this.isIntentionalDisconnect) {
        console.log('Attempting WebSocket reconnection...');
        if (this.socket) {
          this.socket.connect();
        } else {
          this.connect();
        }
      }
    }, delay);
  }

  /**
   * Subscribe to events of specific type
   */
  subscribe(eventType: string, callback: (event: AllEvents) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify all listeners of an event type
   */
  private notifyListeners(eventType: string, event: AllEvents): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }

  /**
   * Emit event to server
   */
  emit(eventName: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('WebSocket not connected, cannot emit event:', eventName);
    }
  }

  /**
   * Create service request
   */
  createServiceRequest(request: {
    guestId: string;
    type: string;
    priority: string;
    message: string;
    locationId?: string;
  }): void {
    this.emit('service-request:create', request);
  }

  /**
   * Update service request
   */
  updateServiceRequest(requestId: string, updates: {
    status?: string;
    crewId?: string;
    notes?: string;
  }): void {
    this.emit('service-request:update', { id: requestId, ...updates });
  }

  /**
   * Trigger emergency alert
   */
  triggerEmergency(alert: {
    locationId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    triggeredBy: string;
  }): void {
    this.emit('emergency:trigger', alert);
  }

  /**
   * Update crew status
   */
  updateCrewStatus(crewId: string, status: string): void {
    this.emit('crew:update-status', { crewId, status });
  }

  /**
   * Update crew location
   */
  updateCrewLocation(crewId: string, locationId: string): void {
    this.emit('crew:update-location', { crewId, locationId });
  }

  /**
   * Join a room (for targeted notifications)
   */
  joinRoom(roomName: string): void {
    this.emit('join-room', { room: roomName });
  }

  /**
   * Leave a room
   */
  leaveRoom(roomName: string): void {
    this.emit('leave-room', { room: roomName });
  }
}

// Export singleton instance
export const websocketService = WebSocketService.getInstance();

// Export hook for React components
export function useWebSocket() {
  return websocketService;
}