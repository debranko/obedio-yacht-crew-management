/**
 * HARDCODED YACHT SETTINGS & SYSTEM CONFIGURATION
 * 
 * VIZIJA SISTEMA:
 * - Primarni server: Node.js/PostgreSQL na yacht PC-u
 * - Failover: ESP32 repeaters mogu preuzeti osnovne funkcije
 * - Redundancija: Multi-layer sa automatskim prebacivanjem
 * 
 * FAILOVER ARHITEKTURA:
 * 1. PRIMARY: Main server (full funkcionalnost)
 * 2. SECONDARY: ESP32 mesh network (osnovni pozivi)
 * 3. TERTIARY: Lokalni storage na svakom uređaju
 */

export const YACHT_SETTINGS = {
  // Basic Yacht Info
  yacht: {
    name: 'M/Y Serenity',
    type: 'motor',  // motor, sailing, catamaran
    callSign: 'OBEDIO-1',
    flag: 'Malta',
    homePort: 'Monaco',
    length: 50, // meters
    beam: 9.5,  // meters
    draft: 2.8, // meters
    grossTonnage: 499,
    yearBuilt: 2023,
  },

  // Deck Configuration (customizable per yacht)
  decks: [
    { id: 'lower-deck', name: 'Lower Deck', order: 1 },
    { id: 'main-deck', name: 'Main Deck', order: 2 },
    { id: 'upper-deck', name: 'Upper Deck', order: 3 },
    { id: 'sun-deck', name: 'Sun Deck', order: 4 },
  ],

  // Location/Time Settings
  location: {
    timezone: 'Europe/Monaco',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    weatherUnits: 'metric',    // metric, imperial
    windSpeedUnits: 'knots',   // knots, km/h, mph
    depthUnits: 'meters',      // meters, feet
    distanceUnits: 'nm',       // nm (nautical miles), km, miles
  },

  // System Settings
  system: {
    language: 'en',
    currency: 'EUR',
    fuelCapacity: 15000,  // liters
    waterCapacity: 5000,  // liters
    grayWaterCapacity: 2000,
    blackWaterCapacity: 1500,
  },
};

export const NETWORK_CONFIG = {
  // Primary Server Config
  primary: {
    host: process.env.BACKEND_HOST || 'backend',
    port: parseInt(process.env.PORT || '3001'),
    protocol: 'http',
    websocket: process.env.WS_URL || 'ws://backend:3001',
    healthCheckInterval: 5000, // ms
  },

  // ESP32 Mesh Network Config
  mesh: {
    enabled: true,
    protocol: 'ESP-NOW',  // ESP-NOW for local, LoRa for long range
    frequency: 2.4,       // GHz
    channel: 6,
    encryption: true,
    meshId: 'OBEDIO-MESH-001',
    
    // Failover settings
    failover: {
      enabled: true,
      timeout: 10000,     // ms - ako server ne odgovara 10s
      retryAttempts: 3,
      mode: 'automatic',  // automatic, manual
      
      // Funkcije dostupne u failover modu
      capabilities: [
        'basic_call',     // Osnovni pozivi (butler, housekeeping)
        'emergency',      // Emergency shake & SOS
        'status_update',  // DND status toggle
        'local_storage',  // Čuva requests lokalno za sync kasnije
      ],
      
      // Funkcije koje NISU dostupne u failover
      unavailable: [
        'guest_management',
        'crew_assignments', 
        'detailed_requests',
        'reporting',
        'settings_changes',
      ],
    },
  },

  // LoRa Config (za veće jahte ili marinas)
  lora: {
    enabled: false,
    frequency: 868,     // MHz (868 EU, 915 US, 433 Asia)
    spreadingFactor: 7,
    bandwidth: 125,     // kHz
    codingRate: '4/5',
    txPower: 20,        // dBm
    range: 5000,        // meters (theoretical)
  },

  // MQTT Broker Config
  mqtt: {
    enabled: process.env.MQTT_ENABLED === 'true',
    broker: process.env.MQTT_BROKER_URL || 'mqtt://mosquitto:1883',
    topics: {
      request: 'yacht/+/request',      // yacht/{location}/request
      status: 'yacht/+/status',        // yacht/{location}/status
      emergency: 'yacht/emergency',     // Broadcast topic
      telemetry: 'yacht/+/telemetry',  // Device battery, signal, etc
      command: 'yacht/+/command',      // Remote commands to devices
    },
    qos: 1,  // 0: At most once, 1: At least once, 2: Exactly once
    retain: true,
  },
};

export const DEVICE_CONFIG = {
  // Smart Button Config
  smartButton: {
    // LED indikatori
    led: {
      idle: { color: 'green', pattern: 'solid' },
      pressed: { color: 'blue', pattern: 'pulse' },
      accepted: { color: 'cyan', pattern: 'double_flash' },
      inProgress: { color: 'yellow', pattern: 'slow_pulse' },
      completed: { color: 'green', pattern: 'triple_flash' },
      error: { color: 'red', pattern: 'fast_blink' },
      dnd: { color: 'red', pattern: 'solid' },
      lowBattery: { color: 'orange', pattern: 'slow_blink' },
    },
    
    // Zvučni signali
    audio: {
      buttonPress: { frequency: 2000, duration: 50 },
      requestAccepted: { frequency: 3000, duration: 100, count: 2 },
      requestCompleted: { frequency: 4000, duration: 150, count: 3 },
      error: { frequency: 1000, duration: 500 },
      emergency: { frequency: [1000, 2000], duration: 1000, pattern: 'alternating' },
    },
    
    // Button actions
    actions: {
      singlePress: 'service_request',
      doublePress: 'cancel_request',
      longPress: 'dnd_toggle',
      triplePress: 'emergency',
      holdRelease: 'custom_action',
    },
    
    // Battery thresholds
    battery: {
      low: 20,      // %
      critical: 10, // %
      shutdown: 5,  // %
    },
  },

  // Repeater Config
  repeater: {
    mode: 'hybrid',  // wifi, lora, hybrid
    meshRole: 'router',  // coordinator, router, end-device
    maxClients: 10,
    
    // Failover server capabilities
    serverMode: {
      enabled: true,
      maxRequests: 100,    // Max queued requests
      syncInterval: 30000, // ms - sync with main server
      storage: 'spiffs',   // spiffs, sd-card
      maxStorage: '4MB',
    },
  },

  // Mobile App Config
  mobileApp: {
    platforms: ['ios', 'android'],
    pushNotifications: true,
    backgroundSync: true,
    offlineMode: true,
    biometricAuth: true,
  },

  // Wearable Config
  wearable: {
    appleWatch: {
      complications: true,
      hapticFeedback: true,
      quickActions: ['accept', 'complete', 'emergency'],
    },
    androidWear: {
      tiles: true,
      complications: true,
      alwaysOnDisplay: true,
    },
  },
};

export const FAILOVER_SCENARIOS = {
  // Scenario 1: Server pada
  serverDown: {
    detection: 'heartbeat_timeout',
    action: 'switch_to_mesh',
    notification: 'broadcast_to_all_devices',
    capabilities: ['basic_calls', 'emergency', 'local_queue'],
  },

  // Scenario 2: Wifi pada
  wifiDown: {
    detection: 'connection_lost',
    action: 'switch_to_lora',
    notification: 'local_only',
    capabilities: ['emergency_only'],
  },

  // Scenario 3: Partial network
  partialNetwork: {
    detection: 'some_devices_unreachable',
    action: 'mesh_reroute',
    notification: 'affected_zones_only',
    capabilities: ['all_via_mesh'],
  },

  // Scenario 4: Power outage
  powerOutage: {
    detection: 'ups_activated',
    action: 'low_power_mode',
    notification: 'critical_only',
    capabilities: ['emergency', 'minimal_lighting'],
  },
};

export const REDUNDANCY_LEVELS = {
  level1: {
    name: 'Primary Server',
    availability: '99.9%',
    features: 'all',
    storage: 'postgresql',
    processing: 'full',
  },
  
  level2: {
    name: 'ESP32 Mesh Network',
    availability: '99.5%',
    features: 'basic + emergency',
    storage: 'local_queue',
    processing: 'distributed',
  },
  
  level3: {
    name: 'Individual Device Storage',
    availability: '99%',
    features: 'emergency_only',
    storage: 'device_memory',
    processing: 'none',
  },
  
  level4: {
    name: 'Manual Fallback',
    availability: '100%',
    features: 'physical_buttons',
    storage: 'paper_log',
    processing: 'human',
  },
};

// Emergency protokol
export const EMERGENCY_PROTOCOL = {
  shake: {
    threshold: 3.5,  // G-force
    duration: 2000,  // ms
    pattern: 'sustained_shake',
    action: 'broadcast_sos',
    priority: 'highest',
  },
  
  manOverboard: {
    trigger: 'mob_button',
    action: [
      'sound_alarm',
      'mark_gps_position',
      'notify_bridge',
      'activate_searchlight',
      'log_event',
    ],
    escalation: 30, // seconds before coast guard notification
  },
  
  fire: {
    trigger: 'fire_alarm',
    action: [
      'sound_alarm',
      'close_fire_doors',
      'stop_ventilation',
      'notify_all_crew',
      'prepare_muster',
    ],
  },
};

// Data sync strategy
export const SYNC_STRATEGY = {
  // Kada server ponovo postane dostupan
  resync: {
    priority: [
      'emergency_events',
      'pending_requests',
      'status_updates',
      'telemetry_data',
    ],
    
    conflictResolution: 'server_wins', // server_wins, client_wins, newest_wins
    
    validation: true,
    compression: true,
    encryption: true,
  },
  
  // Continuous sync
  realtime: {
    websocket: true,
    mqtt: true,
    polling: false,
    interval: 5000, // ms
  },
};

// Export all configs
export default {
  YACHT_SETTINGS,
  NETWORK_CONFIG,
  DEVICE_CONFIG,
  FAILOVER_SCENARIOS,
  REDUNDANCY_LEVELS,
  EMERGENCY_PROTOCOL,
  SYNC_STRATEGY,
};