/**
 * MQTT Service for ESP32 Device Communication
 * Simple implementation for real-time button press events
 */

import mqtt, { MqttClient } from 'mqtt';
import { prisma } from './db';
import { Server as SocketIOServer } from 'socket.io';
import { mqttMonitor } from './mqtt-monitor';

class MQTTService {
  private client: MqttClient | null = null;
  private io: SocketIOServer | null = null;
  private isConnected: boolean = false;

  // MQTT Configuration
  private readonly MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
  private readonly CLIENT_ID = `obedio-backend-${Date.now()}`;
  
  // Topic structure
  private readonly TOPICS = {
    // Button events
    BUTTON_PRESS: 'obedio/button/+/press',        // obedio/button/{deviceId}/press
    BUTTON_STATUS: 'obedio/button/+/status',      // obedio/button/{deviceId}/status

    // Service requests
    SERVICE_REQUEST: 'obedio/service/request',     // Publish new requests here
    SERVICE_UPDATE: 'obedio/service/update',       // Status updates

    // Device management
    DEVICE_REGISTER: 'obedio/device/register',     // Device registration
    DEVICE_HEARTBEAT: 'obedio/device/heartbeat',   // Device heartbeat/keepalive
    DEVICE_TELEMETRY: 'obedio/device/+/telemetry', // Battery, RSSI, etc.

    // Commands to devices
    DEVICE_COMMAND: 'obedio/device/+/command',     // Send commands to devices

    // Watch notifications and acknowledgements
    WATCH_ACKNOWLEDGE: 'obedio/watch/+/acknowledge', // T-Watch acknowledgement
  };

  /**
   * Initialize MQTT connection
   */
  async connect(socketIO?: SocketIOServer): Promise<void> {
    if (this.isConnected) {
      console.log('🔌 MQTT already connected');
      return;
    }

    if (socketIO) {
      this.io = socketIO;
    }

    console.log('🔌 Connecting to MQTT broker:', this.MQTT_BROKER);
    
    this.client = mqtt.connect(this.MQTT_BROKER, {
      clientId: this.CLIENT_ID,
      clean: true,
      connectTimeout: 30000,
      reconnectPeriod: 5000,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup MQTT event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    // Connected
    this.client.on('connect', () => {
      console.log('✅ MQTT connected successfully');
      this.isConnected = true;
      this.subscribeToTopics();
    });

    // Message received
    this.client.on('message', async (topic, payload) => {
      try {
        const message = JSON.parse(payload.toString());
        console.log('📥 MQTT message:', topic, message);

        // Log to monitor (disabled - causing crash)
        // mqttMonitor.logMessage(topic, message);

        await this.handleMessage(topic, message);
      } catch (error) {
        console.error('❌ MQTT message parse error:', error);
      }
    });

    // Error
    this.client.on('error', (error) => {
      console.error('❌ MQTT error:', error);
    });

    // Disconnected
    this.client.on('close', () => {
      console.log('🔌 MQTT disconnected');
      this.isConnected = false;
    });
  }

  /**
   * Subscribe to relevant topics
   */
  private subscribeToTopics(): void {
    if (!this.client) return;

    const topics = [
      this.TOPICS.BUTTON_PRESS,
      this.TOPICS.BUTTON_STATUS,
      this.TOPICS.DEVICE_REGISTER,
      this.TOPICS.DEVICE_HEARTBEAT,
      this.TOPICS.DEVICE_TELEMETRY,
      this.TOPICS.WATCH_ACKNOWLEDGE,
    ];

    topics.forEach(topic => {
      this.client!.subscribe(topic, (err) => {
        if (err) {
          console.error(`❌ Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`✅ Subscribed to ${topic}`);
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  private async handleMessage(topic: string, message: any): Promise<void> {
    // Handle device registration
    if (topic === 'obedio/device/register') {
      await this.handleDeviceRegistration(message);
      return;
    }

    // Handle device heartbeat
    if (topic === 'obedio/device/heartbeat') {
      await this.handleDeviceHeartbeat(message);
      return;
    }

    // Extract device ID from topic for other messages
    const topicParts = topic.split('/');
    const deviceId = topicParts[2];

    // Handle button press
    if (topic.includes('/button/') && topic.endsWith('/press')) {
      await this.handleButtonPress(deviceId, message);
    }

    // Handle device status
    else if (topic.includes('/button/') && topic.endsWith('/status')) {
      await this.handleDeviceStatus(deviceId, message);
    }

    // Handle telemetry
    else if (topic.includes('/device/') && topic.endsWith('/telemetry')) {
      await this.handleDeviceTelemetry(deviceId, message);
    }

    // Handle watch acknowledge
    else if (topic.includes('/watch/') && topic.endsWith('/acknowledge')) {
      await this.handleWatchAcknowledge(deviceId, message);
    }
  }

  /**
   * Handle button press event from ESP32
   *
   * ESP32 Specification (ESP32-FIRMWARE-DETAILED-SPECIFICATION.md lines 70-88):
   * Message contains: deviceId, locationId, guestId, pressType, button, timestamp,
   *                   battery, rssi, firmwareVersion, sequenceNumber
   *
   * Backend must DERIVE priority and requestType from button + pressType
   */
  private async handleButtonPress(deviceId: string, message: any): Promise<void> {
    console.log(`🔘 Button press from ${deviceId}:`, message);

    try {
      // Get device from database - auto-create if it's a virtual device
      let device = await prisma.device.findUnique({
        where: { deviceId },
        include: { location: true }
      });

      // If device exists but has no locationId, update it from message
      if (device && !device.locationId && message.locationId) {
        console.log(`📍 Updating device location: ${message.locationId}`);
        device = await prisma.device.update({
          where: { deviceId },
          data: { locationId: message.locationId },
          include: { location: true }
        });
      }

      if (!device) {
        console.log(`📱 Auto-creating virtual device: ${deviceId}`);
        
        // Auto-create virtual device for button simulator
        device = await prisma.device.create({
          data: {
            deviceId,
            name: `Virtual Button ${deviceId.slice(-4)}`,
            type: 'smart_button',
            status: 'online',
            locationId: message.locationId || null,
            batteryLevel: message.battery || 100,
            signalStrength: message.rssi || -50,
            config: {
              ledEnabled: true,
              soundEnabled: true,
              vibrationEnabled: true,
              shakeThreshold: 3,
              isVirtual: message.firmwareVersion?.includes('-sim')
            },
            firmwareVersion: message.firmwareVersion || 'v1.0.0-virtual',
            hardwareVersion: 'ESP32-WROOM-32',
            lastSeen: new Date()
          },
          include: { location: true }
        });

        console.log(`✅ Virtual device created: ${device.name}`);
        
        // Update MQTT monitor
        mqttMonitor.updateDevice(deviceId, {
          status: 'online',
          battery: 100,
          rssi: -50,
          type: 'smart_button (virtual)'
        });

        // Log device creation
        await prisma.deviceLog.create({
          data: {
            deviceId: device.id,
            eventType: 'device_added',
            eventData: {
              deviceId: device.deviceId,
              name: device.name,
              virtual: true
            },
            severity: 'info'
          }
        });
      }

      // Get guest for the location (if locationId exists)
      let guest = null;
      if (device.locationId) {
        guest = await prisma.guest.findFirst({
          where: { locationId: device.locationId },
          orderBy: { createdAt: 'desc' }
        });
      }

      // Use guest from message if provided
      if (message.guestId && !guest) {
        guest = await prisma.guest.findUnique({
          where: { id: message.guestId }
        });
      }

      if (!guest && device.locationId) {
        console.warn(`⚠️ No guest found for location: ${device.location?.name} - creating anonymous request`);
      }

      // ============================================
      // DERIVE PRIORITY AND TYPE FROM ESP32 SPEC
      // ============================================
      // ESP32 sends: button (main/aux1-4) + pressType (single/double/long/shake)
      // Backend derives: priority + requestType

      let priority: 'normal' | 'urgent' | 'emergency' = 'normal';
      let requestType = 'call';

      // Shake detection = Emergency (from ESP32 spec line 186-191)
      if (message.pressType === 'shake') {
        priority = 'emergency';
        requestType = 'emergency';
      }
      // Long press = Voice recording (from ESP32 spec line 174)
      else if (message.pressType === 'long') {
        requestType = 'voice';
        priority = 'normal';
      }
      // Button-specific functions (from ESP32 spec lines 177-184)
      else if (message.button === 'aux1') {
        requestType = 'dnd';
        priority = 'normal';
      }
      else if (message.button === 'aux2') {
        requestType = 'lights';
        priority = 'normal';
      }
      else if (message.button === 'aux3') {
        requestType = 'prepare_food';
        priority = 'normal';
      }
      else if (message.button === 'aux4') {
        requestType = 'bring_drinks';
        priority = 'normal';
      }
      // Main button or double tap = Regular service call
      else {
        requestType = 'call';
        priority = message.pressType === 'double' ? 'urgent' : 'normal';
      }

      // Build service notes with ESP32 details
      let notes = `Service requested from ${device.location?.name || deviceId}`;
      notes += `\n\nDevice Details:`;
      notes += `\n- Button: ${message.button || 'main'}`;
      notes += `\n- Press Type: ${message.pressType || 'single'}`;
      notes += `\n- Battery: ${message.battery || 'unknown'}%`;
      notes += `\n- Signal: ${message.rssi || 'unknown'} dBm`;
      notes += `\n- Firmware: ${message.firmwareVersion || 'unknown'}`;

      // Create service request using DERIVED values (with or without guest)
      const serviceRequest = await prisma.serviceRequest.create({
        data: {
          guestId: guest?.id || null,
          locationId: device.locationId || message.locationId || null,
          status: 'pending',
          priority,
          requestType,
          notes,
          guestName: guest ? `${guest.firstName} ${guest.lastName}` : 'Guest',
          guestCabin: device.location?.name || 'Unknown',
        },
        include: {
          guest: true,
          location: true,
        }
      });

      // Log button press to device logs with full ESP32 telemetry
      await prisma.deviceLog.create({
        data: {
          deviceId: device.id,
          eventType: 'button_press',
          eventData: {
            // ESP32 fields
            button: message.button || 'main',
            pressType: message.pressType || 'single',
            battery: message.battery,
            rssi: message.rssi,
            firmwareVersion: message.firmwareVersion,
            sequenceNumber: message.sequenceNumber,
            timestamp: message.timestamp,
            // Derived fields
            priority,
            requestType,
            // Context
            locationId: device.locationId,
            guestId: guest?.id,
            serviceRequestId: serviceRequest.id
          },
          severity: priority === 'emergency' ? 'warning' : 'info'
        }
      });

      console.log('✅ Service request created:', serviceRequest.id);

      // Log activity: Button press and service request created
      await prisma.activityLog.create({
        data: {
          type: 'device',
          action: 'Button Press',
          details: `${guest ? guest.firstName + ' ' + guest.lastName : 'Guest'} requested service from ${device.location?.name || 'Unknown'}`,
          locationId: device.locationId,
          guestId: guest?.id,
          deviceId: device.id,
          metadata: JSON.stringify({
            button: message.button,
            pressType: message.pressType,
            priority,
            requestId: serviceRequest.id,
            firmwareVersion: message.firmwareVersion
          })
        }
      });

      // Emit to WebSocket clients
      if (this.io) {
        console.log('📡 Emitting WebSocket event: service-request:created to', this.io.engine.clientsCount, 'clients');
        this.io.emit('service-request:created', serviceRequest);
      } else {
        console.error('❌ WebSocket (io) not available!');
      }

      // Publish to MQTT for other devices (watches)
      this.publish(this.TOPICS.SERVICE_REQUEST, {
        id: serviceRequest.id,
        location: device.location?.name || 'Unknown',
        guest: guest ? `${guest.firstName} ${guest.lastName}` : 'Guest',
        priority: serviceRequest.priority,
        timestamp: new Date().toISOString(),
      });

      // Send notification to assigned crew member's watch
      await this.notifyAssignedCrewWatch(serviceRequest, device.location?.name || 'Unknown', guest);

      // Send acknowledgment to button
      this.sendDeviceCommand(deviceId, {
        command: 'ack',
        requestId: serviceRequest.id,
        status: 'received'
      });

    } catch (error) {
      console.error('❌ Error handling button press:', error);
    }
  }

  /**
   * Handle device registration from ESP32
   * Heltec/T-Watch sends: deviceId, type, name, firmwareVersion, hardwareVersion, macAddress, ipAddress, rssi
   */
  private async handleDeviceRegistration(message: any): Promise<void> {
    console.log(`📱 Device registration:`, message);

    try {
      const { deviceId, type, name, firmwareVersion, hardwareVersion, macAddress, ipAddress, rssi } = message;

      if (!deviceId || !type) {
        console.error('❌ Invalid registration message: missing deviceId or type');
        return;
      }

      // Check if device already exists
      let device = await prisma.device.findUnique({
        where: { deviceId }
      });

      if (device) {
        // Update existing device
        console.log(`🔄 Updating existing device: ${deviceId}`);
        device = await prisma.device.update({
          where: { deviceId },
          data: {
            status: 'online',
            firmwareVersion: firmwareVersion || device.firmwareVersion,
            hardwareVersion: hardwareVersion || device.hardwareVersion,
            macAddress: macAddress || device.macAddress,
            ipAddress: ipAddress || device.ipAddress,
            signalStrength: rssi || device.signalStrength,
            lastSeen: new Date(),
          }
        });

        console.log(`✅ Device updated: ${device.name}`);
      } else {
        // Create new device
        console.log(`➕ Creating new device: ${deviceId}`);
        device = await prisma.device.create({
          data: {
            deviceId,
            name: name || `Device ${deviceId.slice(-4)}`,
            type,
            subType: hardwareVersion?.includes('Heltec') ? 'esp32' :
                     hardwareVersion?.includes('T-Watch') ? 'esp32' : undefined,
            status: 'online',
            firmwareVersion,
            hardwareVersion,
            macAddress,
            ipAddress,
            signalStrength: rssi,
            batteryLevel: 100, // Will be updated by heartbeat
            lastSeen: new Date(),
            config: {
              autoRegistered: true,
              registrationTime: new Date().toISOString()
            }
          }
        });

        console.log(`✅ Device created: ${device.name}`);

        // Log device creation
        await prisma.deviceLog.create({
          data: {
            deviceId: device.id,
            eventType: 'device_added',
            eventData: {
              deviceId: device.deviceId,
              name: device.name,
              type: device.type,
              autoRegistered: true,
              hardwareVersion,
              firmwareVersion
            },
            severity: 'info'
          }
        });
      }

      // Update MQTT monitor
      mqttMonitor.updateDevice(deviceId, {
        status: 'online',
        battery: device.batteryLevel || 100,
        rssi: rssi || -50,
        type: type
      });

      // Emit to WebSocket clients
      if (this.io) {
        this.io.emit('device:registered', device);
      }

      // Send confirmation back to device
      this.publish(`obedio/device/${deviceId}/registered`, {
        success: true,
        deviceId: device.id,
        message: 'Device registered successfully'
      });

    } catch (error) {
      console.error('❌ Error handling device registration:', error);
    }
  }

  /**
   * Handle device heartbeat/keepalive
   */
  private async handleDeviceHeartbeat(message: any): Promise<void> {
    const { deviceId, type, status, rssi, uptime, freeHeap } = message;

    if (!deviceId) {
      console.error('❌ Invalid heartbeat message: missing deviceId');
      return;
    }

    try {
      // Update device status
      const device = await prisma.device.findUnique({
        where: { deviceId }
      });

      if (!device) {
        console.warn(`⚠️ Heartbeat from unknown device: ${deviceId} - auto-registering`);
        // Trigger auto-registration
        await this.handleDeviceRegistration({
          deviceId,
          type: type || 'smart_button',
          name: `Device ${deviceId.slice(-4)}`,
          rssi
        });
        return;
      }

      // Update device
      await prisma.device.update({
        where: { deviceId },
        data: {
          status: status || 'online',
          signalStrength: rssi,
          lastSeen: new Date(),
        }
      });

      // Update MQTT monitor
      mqttMonitor.updateDevice(deviceId, {
        status: status || 'online',
        battery: device.batteryLevel || 100,
        rssi: rssi || device.signalStrength || -50,
        type: device.type
      });

      // Log heartbeat (optional - can be noisy)
      // console.log(`💓 Heartbeat from ${deviceId} - uptime: ${uptime}s, heap: ${freeHeap} bytes`);

    } catch (error) {
      console.error('❌ Error handling device heartbeat:', error);
    }
  }

  /**
   * Handle device status update
   */
  private async handleDeviceStatus(deviceId: string, message: any): Promise<void> {
    console.log(`📊 Device status from ${deviceId}:`, message);

    try {
      // Check if device exists
      const exists = await prisma.device.findUnique({
        where: { deviceId },
        select: { id: true }
      });

      if (!exists) {
        // Auto-create if it's sending status but doesn't exist
        console.log(`📱 Auto-creating device from status: ${deviceId}`);
        await prisma.device.create({
          data: {
            deviceId,
            name: `Device ${deviceId.slice(-4)}`,
            type: message.type || 'smart_button',
            status: message.online ? 'online' : 'offline',
            batteryLevel: message.battery,
            signalStrength: message.rssi,
            config: {
              isVirtual: deviceId.startsWith('BTN-') && deviceId.length === 12
            },
            firmwareVersion: message.firmware || 'unknown',
            hardwareVersion: message.hardware || 'unknown',
            lastSeen: new Date()
          }
        });
      } else {
        // Update existing device
        await prisma.device.update({
          where: { deviceId },
          data: {
            status: message.online ? 'online' : 'offline',
            batteryLevel: message.battery,
            signalStrength: message.rssi,
            lastSeen: new Date(),
          }
        });
      }

      // Update monitor
      mqttMonitor.updateDevice(deviceId, {
        status: message.online ? 'online' : 'offline',
        battery: message.battery,
        rssi: message.rssi,
        type: 'smart_button'
      });

      // Emit to WebSocket clients
      if (this.io) {
        this.io.emit('device:status', {
          deviceId,
          ...message
        });
      }
    } catch (error) {
      console.error('❌ Error updating device status:', error);
    }
  }

  /**
   * Handle device telemetry data
   */
  private async handleDeviceTelemetry(deviceId: string, message: any): Promise<void> {
    console.log(`📈 Telemetry from ${deviceId}:`, message);

    try {
      // Create device log entry
      await prisma.deviceLog.create({
        data: {
          device: { connect: { deviceId } },
          eventType: 'telemetry',
          eventData: message,
        }
      });

      // Update device metrics
      if (message.battery !== undefined || message.rssi !== undefined) {
        await prisma.device.update({
          where: { deviceId },
          data: {
            ...(message.battery && { batteryLevel: message.battery }),
            ...(message.rssi && { signalStrength: message.rssi }),
            lastSeen: new Date(),
          }
        });
      }
    } catch (error) {
      console.error('❌ Error handling telemetry:', error);
    }
  }

  /**
   * Publish message to MQTT topic
   */
  publish(topic: string, message: any): void {
    if (!this.client || !this.isConnected) {
      console.warn('⚠️ MQTT not connected, cannot publish');
      return;
    }

    const payload = JSON.stringify(message);
    this.client.publish(topic, payload, (error) => {
      if (error) {
        console.error(`❌ MQTT publish error on ${topic}:`, error);
      } else {
        console.log(`📤 MQTT published to ${topic}:`, message);
        // Log outgoing messages to monitor (disabled - causing crash)
        // mqttMonitor.logMessage(topic, message);
      }
    });
  }

  /**
   * Send command to specific device
   */
  sendDeviceCommand(deviceId: string, command: any): void {
    const topic = `obedio/device/${deviceId}/command`;
    this.publish(topic, command);
  }

  /**
   * Send notification to assigned crew member's watch
   */
  async notifyAssignedCrewWatch(serviceRequest: any, locationName: string, guest: any): Promise<void> {
    try {
      console.log('📱 Looking for assigned crew watches...');

      // Find all watches (type = 'watch') that are assigned to crew members
      const watches = await prisma.device.findMany({
        where: {
          type: 'watch',
          crewMemberId: { not: null } // Only watches assigned to crew
        },
        include: {
          crewMember: true
        }
      });

      if (watches.length === 0) {
        console.log('⚠️ No watches assigned to crew members');
        return;
      }

      console.log(`✅ Found ${watches.length} assigned watch(es)`);

      // Send notification to each assigned watch
      for (const watch of watches) {
        const notificationTopic = `obedio/watch/${watch.deviceId}/notification`;

        const notification = {
          requestId: serviceRequest.id,
          type: 'service_request',
          title: 'Service Request',
          message: `Guest needs assistance at ${locationName}`,
          location: locationName,
          guest: guest ? `${guest.firstName} ${guest.lastName}` : 'Guest',
          priority: serviceRequest.priority,
          timestamp: new Date().toISOString()
        };

        this.publish(notificationTopic, notification);
        console.log(`📳 Notification sent to ${watch.crewMember?.name || 'crew'}'s watch (${watch.deviceId})`);
      }

    } catch (error) {
      console.error('❌ Error notifying crew watch:', error);
    }
  }

  /**
   * Handle watch acknowledge from T-Watch
   * When crew member presses button to accept service request
   */
  private async handleWatchAcknowledge(deviceId: string, message: any): Promise<void> {
    console.log(`⌚ Watch acknowledge from ${deviceId}:`, message);

    try {
      const { requestId, action, status } = message;

      if (!requestId) {
        console.error('❌ Invalid acknowledge message: missing requestId');
        return;
      }

      // Find the service request
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: {
          guest: true,
          location: true
        }
      });

      if (!serviceRequest) {
        console.error(`❌ Service request not found: ${requestId}`);
        return;
      }

      // Find the watch device and crew member
      const watch = await prisma.device.findUnique({
        where: { deviceId },
        include: { crewMember: true }
      });

      if (!watch || !watch.crewMember) {
        console.error(`❌ Watch or crew member not found for device: ${deviceId}`);
        return;
      }

      console.log(`✅ ${watch.crewMember.name} acknowledged request ${requestId}`);

      // Update service request status to "serving" (crew is now serving the guest)
      const updatedRequest = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
          status: 'serving',
          assignedToId: watch.crewMember.id, // Assign to the crew member who acknowledged
          assignedTo: watch.crewMember.name, // Also set the name
          acceptedAt: new Date(), // Mark when it was accepted
        },
        include: {
          guest: true,
          location: true,
        }
      });

      console.log(`✅ Service request updated to "serving" - assigned to ${watch.crewMember.name}`);

      // Log the acknowledge action
      await prisma.deviceLog.create({
        data: {
          deviceId: watch.id,
          eventType: 'acknowledge',
          eventData: {
            requestId,
            action,
            crewMemberId: watch.crewMember.id,
            crewMemberName: watch.crewMember.name,
            timestamp: message.timestamp
          },
          severity: 'info'
        }
      });

      // Log to activity log
      const responseTime = Date.now() - serviceRequest.createdAt.getTime();
      await prisma.activityLog.create({
        data: {
          type: 'service_request',
          action: 'Request Accepted',
          details: `${watch.crewMember.name} accepted service request from ${serviceRequest.guest ? serviceRequest.guest.firstName + ' ' + serviceRequest.guest.lastName : serviceRequest.guestName || 'Guest'} at ${serviceRequest.location?.name || serviceRequest.guestCabin || 'Unknown'}`,
          userId: watch.crewMember.userId,
          locationId: serviceRequest.locationId,
          guestId: serviceRequest.guestId,
          deviceId: watch.id,
          metadata: JSON.stringify({
            requestId: serviceRequest.id,
            responseTimeMs: responseTime,
            responseTimeSec: Math.floor(responseTime / 1000),
            priority: serviceRequest.priority
          })
        }
      });

      // Emit to WebSocket clients for real-time update
      if (this.io) {
        this.io.emit('service-request:updated', updatedRequest);
      }

      // Publish service update to MQTT
      this.publish(this.TOPICS.SERVICE_UPDATE, {
        requestId,
        status: 'serving',
        assignedTo: watch.crewMember.name,
        acknowledgedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error handling watch acknowledge:', error);
    }
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
      console.log('🔌 MQTT disconnected');
    }
  }

  /**
   * Check if MQTT is connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const mqttService = new MQTTService();