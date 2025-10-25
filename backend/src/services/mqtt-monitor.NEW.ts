/**
 * MQTT Monitor Dashboard - COMPLETELY REBUILT
 * Direct MQTT connection - No dependency on backend mqtt.service
 * Runs on port 8888 for debugging and monitoring purposes
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mqtt, { MqttClient } from 'mqtt';

class MQTTMonitor {
  private app: express.Application;
  private httpServer: any;
  private io: SocketIOServer;
  private port: number;
  private messages: any[] = [];
  private devices: Map<string, any> = new Map();

  // OWN MQTT CLIENT - Direct connection to Mosquitto
  private mqttClient: MqttClient | null = null;
  private mqttConnected: boolean = false;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: { origin: '*' }
    });
    this.port = parseInt(process.env.MQTT_MONITOR_PORT || '8888');

    this.setupRoutes();
    this.setupSocketIO();
    this.connectToMQTT(); // Connect directly to Mosquitto
  }

  /**
   * Connect directly to Mosquitto broker
   */
  private connectToMQTT() {
    const broker = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
    const clientId = `mqtt-monitor-${Date.now()}`;

    console.log(`🔌 MQTT Monitor: Connecting to ${broker}...`);

    this.mqttClient = mqtt.connect(broker, {
      clientId,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 5000,
    });

    this.mqttClient.on('connect', () => {
      console.log('✅ MQTT Monitor: Connected to broker successfully');
      this.mqttConnected = true;

      // Subscribe to ALL topics
      this.mqttClient!.subscribe('#', (err) => {
        if (err) {
          console.error('❌ MQTT Monitor: Subscription failed:', err);
        } else {
          console.log('✅ MQTT Monitor: Subscribed to # (all topics)');
        }
      });
    });

    this.mqttClient.on('message', (topic, payload) => {
      try {
        const message = JSON.parse(payload.toString());
        this.handleMessage(topic, message);
      } catch (error) {
        // Not JSON, store as string
        this.handleMessage(topic, payload.toString());
      }
    });

    this.mqttClient.on('error', (error) => {
      console.error('❌ MQTT Monitor: Connection error:', error);
      this.mqttConnected = false;
    });

    this.mqttClient.on('close', () => {
      console.log('🔌 MQTT Monitor: Disconnected from broker');
      this.mqttConnected = false;
    });
  }

  /**
   * Handle incoming MQTT message
   */
  private handleMessage(topic: string, payload: any) {
    console.log(`📥 MQTT Monitor: ${topic}`, payload);

    const message = {
      timestamp: new Date().toISOString(),
      topic,
      payload
    };

    this.messages.unshift(message);
    if (this.messages.length > 1000) {
      this.messages.pop();
    }

    // Broadcast to all connected clients
    this.io.emit('mqtt:message', message);

    // Extract device info if it's a button press
    if (topic.includes('/button/') && typeof payload === 'object' && payload.deviceId) {
      this.updateDevice(payload.deviceId, {
        type: 'Button',
        status: 'online',
        battery: payload.battery,
        rssi: payload.rssi,
        firmwareVersion: payload.firmwareVersion,
        lastSeen: new Date().toISOString()
      });
    }
  }

  /**
   * Update device info
   */
  private updateDevice(deviceId: string, data: any) {
    const device = {
      deviceId,
      ...data,
      lastSeen: new Date().toISOString()
    };

    this.devices.set(deviceId, device);
    this.io.emit('mqtt:device', device);
  }

  private setupRoutes() {
    // Serve the monitor dashboard HTML
    this.app.get('/', (req, res) => {
      res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>OBEDIO MQTT Monitor - Direct Connection</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: #1a1a1a;
      padding: 1rem;
      border-bottom: 2px solid #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header h1 {
      font-size: 1.5rem;
      color: #00ff41;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .badge {
      background: #00ff41;
      color: #000;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: bold;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .status-indicator.connected { background: #00ff41; }
    .status-indicator.disconnected { background: #ff0041; }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    .container {
      display: grid;
      grid-template-columns: 300px 1fr;
      height: calc(100vh - 140px);
      gap: 1px;
      background: #2a2a2a;
    }
    .sidebar {
      background: #1a1a1a;
      padding: 1rem;
      overflow-y: auto;
    }
    .main {
      background: #0a0a0a;
      padding: 1rem;
      overflow-y: auto;
    }
    .device {
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .device:hover {
      background: #3a3a3a;
      border-color: #00ff41;
    }
    .device.offline {
      opacity: 0.5;
    }
    .device-id {
      font-weight: bold;
      color: #00ff41;
      font-size: 0.9rem;
    }
    .device-info {
      font-size: 0.8rem;
      color: #888;
      margin-top: 0.25rem;
    }
    .messages {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.85rem;
    }
    .message {
      border-bottom: 1px solid #2a2a2a;
      padding: 0.75rem;
      display: grid;
      grid-template-columns: 140px 250px 1fr;
      gap: 1rem;
      align-items: start;
    }
    .message:hover {
      background: #1a1a1a;
    }
    .timestamp {
      color: #666;
      font-size: 0.8rem;
    }
    .topic {
      color: #00ff41;
      word-break: break-all;
      font-size: 0.85rem;
    }
    .payload {
      color: #e0e0e0;
      white-space: pre-wrap;
      font-size: 0.75rem;
      max-height: 200px;
      overflow-y: auto;
    }
    .controls {
      padding: 1rem;
      background: #1a1a1a;
      border-bottom: 1px solid #2a2a2a;
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    button {
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      color: #e0e0e0;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover {
      background: #3a3a3a;
      border-color: #00ff41;
    }
    .filter {
      flex: 1;
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    input {
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      color: #e0e0e0;
      padding: 0.5rem;
      border-radius: 4px;
      flex: 1;
    }
    .stats {
      display: flex;
      gap: 2rem;
      font-size: 0.9rem;
    }
    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .stat-value {
      color: #00ff41;
      font-weight: bold;
      font-size: 1.2rem;
    }
    h2 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: #00ff41;
    }
    .empty {
      text-align: center;
      color: #666;
      padding: 2rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>
      <span>🚢</span>
      OBEDIO MQTT Monitor
      <span class="badge">DIRECT</span>
    </h1>
    <div class="status">
      <div class="stats">
        <div class="stat">
          <span>Messages:</span>
          <span class="stat-value" id="messageCount">0</span>
        </div>
        <div class="stat">
          <span>Devices:</span>
          <span class="stat-value" id="deviceCount">0</span>
        </div>
      </div>
      <div class="status-indicator connected" id="status"></div>
      <span id="statusText">Connected</span>
    </div>
  </div>

  <div class="controls">
    <button onclick="clearMessages()">Clear Messages</button>
    <div class="filter">
      <label>Filter:</label>
      <input type="text" id="filter" placeholder="Filter by topic or payload..." onkeyup="filterMessages()">
    </div>
    <button onclick="exportLogs()">Export JSON</button>
  </div>

  <div class="container">
    <div class="sidebar">
      <h2>Connected Devices</h2>
      <div id="devices">
        <div class="empty">No devices detected</div>
      </div>
    </div>

    <div class="main">
      <h2>MQTT Messages (Real-Time)</h2>
      <div id="messages" class="messages">
        <div class="empty">Waiting for MQTT messages...</div>
      </div>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    let messages = [];
    let devices = new Map();
    let filterText = '';

    socket.on('connect', () => {
      document.getElementById('status').className = 'status-indicator connected';
      document.getElementById('statusText').textContent = 'Connected';
    });

    socket.on('disconnect', () => {
      document.getElementById('status').className = 'status-indicator disconnected';
      document.getElementById('statusText').textContent = 'Disconnected';
    });

    socket.on('mqtt:message', (data) => {
      console.log('📥 Message received:', data);
      messages.unshift(data);
      if (messages.length > 1000) messages.pop();
      updateMessages();
      updateStats();
    });

    socket.on('mqtt:device', (data) => {
      console.log('📱 Device updated:', data);
      devices.set(data.deviceId, data);
      updateDevices();
      updateStats();
    });

    function updateMessages() {
      const container = document.getElementById('messages');
      const filtered = filterText
        ? messages.filter(m =>
            m.topic.toLowerCase().includes(filterText.toLowerCase()) ||
            JSON.stringify(m.payload).toLowerCase().includes(filterText.toLowerCase())
          )
        : messages;

      if (filtered.length === 0) {
        container.innerHTML = '<div class="empty">' + (filterText ? 'No messages match filter' : 'Waiting for MQTT messages...') + '</div>';
        return;
      }

      container.innerHTML = filtered.slice(0, 100).map(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const payload = typeof msg.payload === 'object'
          ? JSON.stringify(msg.payload, null, 2)
          : msg.payload;

        return \`
          <div class="message">
            <div class="timestamp">\${time}</div>
            <div class="topic">\${msg.topic}</div>
            <div class="payload">\${payload}</div>
          </div>
        \`;
      }).join('');
    }

    function updateDevices() {
      const container = document.getElementById('devices');
      if (devices.size === 0) {
        container.innerHTML = '<div class="empty">No devices detected</div>';
        return;
      }

      container.innerHTML = Array.from(devices.values()).map(device => {
        const isOnline = device.status === 'online';
        return \`
          <div class="device \${isOnline ? '' : 'offline'}">
            <div class="device-id">\${device.deviceId}</div>
            <div class="device-info">
              \${device.type || 'Unknown'} •
              \${isOnline ? '🟢 Online' : '🔴 Offline'}
              \${device.battery ? \` • 🔋 \${device.battery}%\` : ''}
              \${device.rssi ? \` • 📶 \${device.rssi}dBm\` : ''}
            </div>
          </div>
        \`;
      }).join('');
    }

    function updateStats() {
      document.getElementById('messageCount').textContent = messages.length;
      document.getElementById('deviceCount').textContent = devices.size;
    }

    function clearMessages() {
      if (confirm('Clear all messages?')) {
        messages = [];
        updateMessages();
        updateStats();
      }
    }

    function filterMessages() {
      filterText = document.getElementById('filter').value;
      updateMessages();
    }

    function exportLogs() {
      const data = JSON.stringify(messages, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mqtt-logs-' + new Date().toISOString() + '.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>
      `);
    });
  }

  private setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('📟 MQTT Monitor: Client connected to dashboard');

      // Send current state
      socket.emit('mqtt:status', {
        connected: this.mqttConnected,
        devices: Array.from(this.devices.values()),
        messageCount: this.messages.length
      });

      // Send recent messages
      this.messages.slice(0, 100).forEach(msg => {
        socket.emit('mqtt:message', msg);
      });

      // Send device list
      this.devices.forEach(device => {
        socket.emit('mqtt:device', device);
      });
    });
  }

  public start() {
    this.httpServer.listen(this.port, () => {
      console.log(`
🖥️  MQTT Monitor Dashboard Started! (DIRECT CONNECTION)

📍 Access URL: http://localhost:${this.port}

✅ Features:
   • Direct MQTT connection to Mosquitto
   • Subscribes to ALL topics (#)
   • Real-time message display
   • Device detection and tracking
   • Message filtering and export

🔍 This monitor works independently of the backend!
      `);
    });
  }
}

export const mqttMonitor = new MQTTMonitor();
