/**
 * Realtime Service - WebSocket communication with Socket.io
 * Handles real-time events between frontend and backend
 */

import { Server, Socket } from 'socket.io';
import { Logger } from '../utils/logger';

const logger = new Logger();

export class RealtimeService {
  private io: Server;
  public isActive: boolean = false;
  private connectedClients: Map<string, { userId?: string; role?: string; socketId: string }> = new Map();
  private totalEvents: number = 0;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Initialize real-time service
   */
  initialize() {
    this.isActive = true;
    logger.info('Real-time service initialized');
  }

  /**
   * Get connected clients count
   */
  getConnectedCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get total events processed
   */
  getTotalEvents(): number {
    return this.totalEvents;
  }

  /**
   * Register client connection
   */
  registerClient(socketId: string, userId?: string, role?: string) {
    this.connectedClients.set(socketId, { userId, role, socketId });
    logger.realtimeEvent('client_registered', socketId, userId);
  }

  /**
   * Unregister client connection
   */
  unregisterClient(socketId: string) {
    this.connectedClients.delete(socketId);
    logger.realtimeEvent('client_unregistered', socketId);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
    this.totalEvents++;
    logger.realtimeEvent('broadcast_all', undefined, undefined, { event, data });
  }

  /**
   * Broadcast to specific role
   */
  broadcastToRole(role: string, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
    this.totalEvents++;
    logger.realtimeEvent('broadcast_role', undefined, undefined, { role, event, data });
  }

  /**
   * Send to specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
    this.totalEvents++;
    logger.realtimeEvent('send_user', undefined, userId, { event, data });
  }

  /**
   * Broadcast service request events
   */
  broadcastServiceRequest(type: 'new' | 'updated' | 'completed', data: any) {
    const event = `service-request:${type}`;
    
    // Send to all interior department crew
    this.broadcastToRole('STEWARDESS', event, data);
    this.broadcastToRole('CHIEF_STEWARDESS', event, data);
    
    // Send to admins
    this.broadcastToRole('ADMIN', event, data);
    
    logger.realtimeEvent('service_request_broadcast', undefined, undefined, { type, requestId: data.id });
  }

  /**
   * Broadcast DND status changes
   */
  broadcastDNDUpdate(locationId: string, enabled: boolean, data: any) {
    this.broadcastToAll('dnd:updated', {
      locationId,
      enabled,
      ...data
    });
    
    logger.realtimeEvent('dnd_broadcast', undefined, undefined, { locationId, enabled });
  }

  /**
   * Broadcast crew status changes
   */
  broadcastCrewStatusUpdate(crewMemberId: string, status: string, data: any) {
    this.broadcastToAll('crew:status-changed', {
      crewMemberId,
      status,
      ...data
    });
    
    logger.realtimeEvent('crew_status_broadcast', undefined, undefined, { crewMemberId, status });
  }

  /**
   * Broadcast emergency alerts
   */
  broadcastEmergencyAlert(data: any) {
    // Emergency alerts go to everyone
    this.broadcastToAll('emergency:alert', data);
    
    // Also send push notifications if configured
    this.sendEmergencyNotifications(data);
    
    logger.realtimeEvent('emergency_broadcast', undefined, undefined, data);
  }

  /**
   * Broadcast device status updates
   */
  broadcastDeviceUpdate(deviceId: string, status: string, data: any) {
    // Send to ETO and admins
    this.broadcastToRole('ETO', 'device:updated', { deviceId, status, ...data });
    this.broadcastToRole('ADMIN', 'device:updated', { deviceId, status, ...data });
    
    logger.realtimeEvent('device_broadcast', undefined, undefined, { deviceId, status });
  }

  /**
   * Broadcast smart button events
   */
  broadcastSmartButtonEvent(deviceId: string, event: string, data: any) {
    this.broadcastToAll('smart-button:event', {
      deviceId,
      event,
      timestamp: new Date().toISOString(),
      ...data
    });
    
    logger.smartButtonEvent(deviceId, event, data.location, data);
  }

  /**
   * Send emergency notifications (placeholder for future SMS/email integration)
   */
  private async sendEmergencyNotifications(data: any) {
    // TODO: Implement SMS/email notifications for emergency situations
    // This would integrate with Twilio, SendGrid, or similar services
    logger.info('Emergency notification triggered', data);
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const roleStats: Record<string, number> = {};
    
    this.connectedClients.forEach(client => {
      if (client.role) {
        roleStats[client.role] = (roleStats[client.role] || 0) + 1;
      }
    });

    return {
      totalConnections: this.connectedClients.size,
      roleDistribution: roleStats,
      totalEvents: this.totalEvents,
      isActive: this.isActive
    };
  }

  /**
   * Clean up disconnected clients
   */
  cleanup() {
    // This would be called periodically to clean up stale connections
    const activeSocketIds = new Set(Array.from(this.io.sockets.sockets.keys()));
    
    for (const [socketId] of this.connectedClients) {
      if (!activeSocketIds.has(socketId)) {
        this.unregisterClient(socketId);
      }
    }
  }
}