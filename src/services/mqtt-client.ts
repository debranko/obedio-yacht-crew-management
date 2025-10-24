/**
 * MQTT Client Service - Frontend MQTT Connection
 * Connects to MQTT broker to simulate real button devices
 * This allows testing the full MQTT flow without physical hardware
 */

import mqtt, { MqttClient } from 'mqtt';

class MQTTClientService {
  private client: MqttClient | null = null;
  private isConnected: boolean = false;
  private subscribers: Map<string, ((topic: string, message: any) => void)[]> = new Map();

  // MQTT Configuration - WebSocket connection to Mosquitto
  private readonly MQTT_BROKER = import.meta.env.VITE_MQTT_BROKER || 'ws://localhost:9001';
  private readonly CLIENT_ID = `obedio-simulator-${Date.now()}`;

  /**
   * Connect to MQTT broker via WebSocket
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('🔌 MQTT already connected');
      return;
    }

    console.log('🔌 Connecting to MQTT broker:', this.MQTT_BROKER);

    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.MQTT_BROKER, {
        clientId: this.CLIENT_ID,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 5000,
      });

      this.client.on('connect', () => {
        console.log('✅ MQTT connected successfully from frontend');
        this.isConnected = true;
        resolve();
      });

      this.client.on('message', (topic, payload) => {
        try {
          const message = JSON.parse(payload.toString());
          console.log('📥 MQTT message received:', topic, message);

          // Notify subscribers
          const topicSubscribers = this.subscribers.get(topic) || [];
          const wildcardSubscribers = this.subscribers.get('#') || [];
          [...topicSubscribers, ...wildcardSubscribers].forEach(callback => {
            callback(topic, message);
          });
        } catch (error) {
          console.error('❌ MQTT message parse error:', error);
        }
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
        reject(error);
      });

      this.client.on('close', () => {
        console.log('🔌 MQTT disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnect', () => {
        console.log('🔄 MQTT reconnecting...');
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('MQTT connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Publish button press event - EXACT ESP32 SPECIFICATION
   *
   * From ESP32-FIRMWARE-DETAILED-SPECIFICATION.md lines 70-88:
   * Topic: obedio/button/{deviceId}/press
   *
   * Required Payload Fields (ALL auto-generated):
   * - deviceId: Button MAC or ID
   * - locationId: UUID from database
   * - guestId: UUID from database or null
   * - pressType: single|double|long|shake
   * - button: main|aux1|aux2|aux3|aux4
   * - timestamp: ISO8601 (auto-generated)
   * - battery: 0-100 (simulator: always 100)
   * - rssi: dBm (simulator: -40)
   * - firmwareVersion: Semantic version (simulator: "2.1.0-sim")
   * - sequenceNumber: Incrementing counter (auto-generated)
   */
  publishButtonPress(deviceId: string, data: {
    locationId: string;
    guestId: string | null;
    pressType: 'single' | 'double' | 'long' | 'shake';
    button: 'main' | 'aux1' | 'aux2' | 'aux3' | 'aux4';
  }): void {
    if (!this.isConnected || !this.client) {
      console.warn('⚠️ MQTT not connected, cannot publish button press');
      return;
    }

    const topic = `obedio/button/${deviceId}/press`;

    // EXACT ESP32 SPECIFICATION FORMAT - DO NOT MODIFY
    // See ESP32-FIRMWARE-DETAILED-SPECIFICATION.md lines 70-88
    const message = {
      deviceId,                              // BTN-{MAC or ID}
      locationId: data.locationId,           // UUID from database
      guestId: data.guestId,                 // UUID or null
      pressType: data.pressType,             // single|double|long|shake
      button: data.button,                   // main|aux1|aux2|aux3|aux4
      timestamp: new Date().toISOString(),   // ISO8601
      battery: 100,                          // Simulator: always full (0-100)
      rssi: -40,                             // Simulator: always good signal (dBm)
      firmwareVersion: '2.1.0-sim',          // Simulator firmware version
      sequenceNumber: Date.now()             // Use timestamp as sequence for simulator
    };

    this.publish(topic, message);
  }

  /**
   * Publish device status update
   */
  publishDeviceStatus(deviceId: string, data: {
    online?: boolean;
    battery?: number;
    rssi?: number;
  }): void {
    if (!this.isConnected || !this.client) {
      console.warn('⚠️ MQTT not connected, cannot publish status');
      return;
    }

    const topic = `obedio/button/${deviceId}/status`;
    const message = {
      deviceId,
      ...data,
      timestamp: new Date().toISOString()
    };

    this.publish(topic, message);
  }

  /**
   * Publish telemetry data
   */
  publishTelemetry(deviceId: string, data: {
    battery?: number;
    rssi?: number;
    temperature?: number;
    [key: string]: any;
  }): void {
    if (!this.isConnected || !this.client) {
      console.warn('⚠️ MQTT not connected, cannot publish telemetry');
      return;
    }

    const topic = `obedio/device/${deviceId}/telemetry`;
    const message = {
      deviceId,
      ...data,
      timestamp: new Date().toISOString()
    };

    this.publish(topic, message);
  }

  /**
   * Subscribe to service request updates (for watches)
   */
  subscribeToServiceRequests(callback: (topic: string, message: any) => void): void {
    if (!this.isConnected || !this.client) {
      console.warn('⚠️ MQTT not connected, cannot subscribe');
      return;
    }

    const topic = 'obedio/service/request';

    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`✅ Subscribed to ${topic}`);

        // Add to subscribers map
        if (!this.subscribers.has(topic)) {
          this.subscribers.set(topic, []);
        }
        this.subscribers.get(topic)!.push(callback);
      }
    });
  }

  /**
   * Subscribe to device commands (from server)
   */
  subscribeToDeviceCommands(deviceId: string, callback: (topic: string, message: any) => void): void {
    if (!this.isConnected || !this.client) {
      console.warn('⚠️ MQTT not connected, cannot subscribe');
      return;
    }

    const topic = `obedio/device/${deviceId}/command`;

    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`✅ Subscribed to ${topic}`);

        // Add to subscribers map
        if (!this.subscribers.has(topic)) {
          this.subscribers.set(topic, []);
        }
        this.subscribers.get(topic)!.push(callback);
      }
    });
  }

  /**
   * Generic publish method
   */
  private publish(topic: string, message: any): void {
    if (!this.client || !this.isConnected) {
      console.warn('⚠️ MQTT not connected, cannot publish');
      return;
    }

    const payload = JSON.stringify(message);
    this.client.publish(topic, payload, { qos: 1 }, (error) => {
      if (error) {
        console.error(`❌ MQTT publish error on ${topic}:`, error);
      } else {
        console.log(`📤 MQTT published to ${topic}:`, message);
      }
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
      this.subscribers.clear();
      console.log('🔌 MQTT disconnected');
    }
  }

  /**
   * Check connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const mqttClient = new MQTTClientService();
