/**
 * WebSocket Service - Real-time Communication
 * Handles all real-time events between frontend and backend
 */

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
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;

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
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.socket = io('http://localhost:3001', {
        transports: ['websocket'],
        timeout: 5000,
        auth: {
          userId: userId || 'guest',
          token: localStorage.getItem('obedio-auth-token'),
        },
      });

      this.setupEventHandlers();
      
      console.log('WebSocket connection initiated');
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.handleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
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
      this.reconnectAttempts = 0;
      this.notifyListeners('connection', { type: 'connected', data: { socketId: this.socket?.id }, timestamp: new Date().toISOString() } as ConnectionEvent);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.notifyListeners('connection', { type: 'disconnected', data: { reason }, timestamp: new Date().toISOString() } as ConnectionEvent);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
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
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
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