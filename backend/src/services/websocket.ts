/**
 * WebSocket Service - Backend
 * Handles real-time communication using Socket.IO
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Logger } from '../utils/logger';

const logger = new Logger();

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    logger.info('✅ WebSocket server initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const userId = socket.handshake.auth.userId || socket.id;
      
      logger.info(`Client connected: ${userId} (${socket.id})`);
      this.connectedClients.set(socket.id, { userId, socket });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${userId} (${reason})`);
        this.connectedClients.delete(socket.id);
      });

      // Handle client errors
      socket.on('error', (error) => {
        logger.error('Socket error:', error);
      });

      // Join user-specific room for targeted messages
      socket.join(`user:${userId}`);

      logger.info(`User ${userId} joined room: user:${userId}`);
    });
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(eventName: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot broadcast');
      return;
    }

    this.io.emit(eventName, data);
    logger.info(`Broadcasted event: ${eventName}`);
  }

  /**
   * Send event to specific user
   */
  sendToUser(userId: string, eventName: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot send to user');
      return;
    }

    this.io.to(`user:${userId}`).emit(eventName, data);
    logger.info(`Sent ${eventName} to user ${userId}`);
  }

  /**
   * Send event to multiple users
   */
  sendToUsers(userIds: string[], eventName: string, data: any): void {
    userIds.forEach(userId => this.sendToUser(userId, eventName, data));
  }

  /**
   * Emit service request created event
   */
  emitServiceRequestCreated(request: any): void {
    this.broadcast('service-request:created', request);
  }

  /**
   * Emit service request updated event
   */
  emitServiceRequestUpdated(request: any): void {
    this.broadcast('service-request:updated', request);
  }

  /**
   * Emit service request completed event
   */
  emitServiceRequestCompleted(request: any): void {
    this.broadcast('service-request:completed', request);
  }

  /**
   * Emit service request assigned event (when crew member accepts)
   */
  emitServiceRequestAssigned(request: any): void {
    this.broadcast('service-request:assigned', request);
    console.log(`📋 Service request assigned: ${request.id} → ${request.assignedTo}`);
  }

  /**
   * Emit service request status changed event
   */
  emitServiceRequestStatusChanged(request: any): void {
    this.broadcast('service-request:status-changed', request);
    console.log(`🔄 Service request status changed: ${request.id} → ${request.status}`);
  }

  /**
   * Emit emergency alert
   */
  emitEmergencyAlert(emergency: any): void {
    this.broadcast('emergency:alert', emergency);
  }

  /**
   * Emit crew status changed
   */
  emitCrewStatusChanged(crew: any): void {
    this.broadcast('crew:status-changed', crew);
  }

  /**
   * Emit guest event
   */
  emitGuestEvent(event: 'created' | 'updated' | 'deleted', guest: any): void {
    this.broadcast(`guest:${event}`, guest);
  }

  /**
   * Emit device status changed
   */
  emitDeviceStatusChanged(device: any): void {
    this.broadcast('device:status-changed', device);
  }

  /**
   * Emit device event (created, updated, deleted)
   */
  emitDeviceEvent(event: 'created' | 'updated' | 'deleted', device: any): void {
    this.broadcast(`device:${event}`, device);
  }

  /**
   * Emit location DND toggle
   */
  emitLocationDndToggled(location: any): void {
    this.broadcast('location:dnd-toggled', location);
  }

  /**
   * Emit location event (created, updated, deleted)
   */
  emitLocationEvent(event: 'created' | 'updated' | 'deleted', location: any): void {
    this.broadcast(`location:${event}`, location);
  }

  /**
   * Emit duty roster assignment changed
   */
  emitAssignmentChanged(event: 'created' | 'updated' | 'deleted', assignment: any): void {
    this.broadcast(`assignment:${event}`, assignment);
  }

  /**
   * Emit assignment created event
   */
  emitAssignmentCreated(assignment: any): void {
    this.emitAssignmentChanged('created', assignment);
  }

  /**
   * Emit assignment updated event
   */
  emitAssignmentUpdated(assignment: any): void {
    this.emitAssignmentChanged('updated', assignment);
  }

  /**
   * Emit assignment deleted event
   */
  emitAssignmentDeleted(assignment: any): void {
    this.emitAssignmentChanged('deleted', assignment);
  }

  /**
   * Emit shift created event
   */
  emitShiftCreated(shift: any): void {
    this.broadcast('shift:created', shift);
  }

  /**
   * Emit shift updated event
   */
  emitShiftUpdated(shift: any): void {
    this.broadcast('shift:updated', shift);
  }

  /**
   * Emit shift deleted event
   */
  emitShiftDeleted(shift: any): void {
    this.broadcast('shift:deleted', shift);
  }

  /**
   * Get number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get connected client info
   */
  getConnectedClients(): any[] {
    return Array.from(this.connectedClients.values()).map(({ userId }) => ({ userId }));
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const websocketService = WebSocketService.getInstance();
