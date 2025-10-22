# OBEDIO Settings Page - Complete Design & Implementation Plan

## Overview
The Settings page should be the central configuration hub for the entire yacht crew management system. Here's my comprehensive design with suggested default values.

## 1. Yacht Information Settings

### Basic Information
```javascript
{
  yachtName: "M/Y Serenity",
  imoNumber: "1234567",
  flagState: "Malta",
  homePort: "Monaco",
  yearBuilt: 2020,
  builder: "Lürssen",
  classification: "Lloyd's Register",
  
  // Specifications
  specifications: {
    length: "85m",
    beam: "14m", 
    draft: "4.2m",
    grossTonnage: "2,850 GT",
    cruisingSpeed: "14 knots",
    maxSpeed: "17 knots",
    range: "5,000 nm",
    fuelCapacity: "240,000 L",
    waterCapacity: "50,000 L"
  },
  
  // Capacities
  capacities: {
    owners: 2,
    guests: 12,
    crew: 24,
    cabins: {
      owner: 1,
      vip: 2,
      guest: 4,
      crew: 12
    }
  }
}
```

## 2. Service Categories Configuration

### Default Service Types
```javascript
{
  serviceCategories: [
    {
      id: "housekeeping",
      name: "Housekeeping",
      icon: "🧹",
      color: "#4CAF50",
      defaultPriority: "normal",
      slaMinutes: 30,
      subCategories: [
        "Cabin Cleaning",
        "Laundry Service",
        "Turn Down Service",
        "Deep Cleaning",
        "Supply Request"
      ]
    },
    {
      id: "fb",
      name: "Food & Beverage",
      icon: "🍽️",
      color: "#FF9800",
      defaultPriority: "high",
      slaMinutes: 15,
      subCategories: [
        "Breakfast",
        "Lunch", 
        "Dinner",
        "Snacks",
        "Beverages",
        "Special Dietary",
        "Bar Service"
      ]
    },
    {
      id: "engineering",
      name: "Engineering",
      icon: "🔧",
      color: "#2196F3",
      defaultPriority: "normal",
      slaMinutes: 45,
      subCategories: [
        "AC/Heating",
        "Plumbing",
        "Electrical",
        "AV/Entertainment",
        "Internet/WiFi",
        "General Maintenance"
      ]
    },
    {
      id: "deck",
      name: "Deck Services",
      icon: "⚓",
      color: "#009688",
      defaultPriority: "normal",
      slaMinutes: 30,
      subCategories: [
        "Tender Service",
        "Water Sports",
        "Beach Setup",
        "Toy Deployment",
        "Deck Cleaning"
      ]
    },
    {
      id: "concierge",
      name: "Concierge",
      icon: "🎩",
      color: "#9C27B0",
      defaultPriority: "high",
      slaMinutes: 20,
      subCategories: [
        "Shore Excursions",
        "Restaurant Reservations",
        "Transportation",
        "Event Planning",
        "Shopping Assistance"
      ]
    },
    {
      id: "medical",
      name: "Medical",
      icon: "🏥",
      color: "#F44336",
      defaultPriority: "urgent",
      slaMinutes: 5,
      subCategories: [
        "Medical Emergency",
        "First Aid",
        "Medication Request",
        "Doctor Appointment",
        "Wellness Check"
      ]
    }
  ],
  
  priorityLevels: [
    { id: "low", name: "Low", slaMultiplier: 2, color: "#9E9E9E" },
    { id: "normal", name: "Normal", slaMultiplier: 1, color: "#2196F3" },
    { id: "high", name: "High", slaMultiplier: 0.5, color: "#FF9800" },
    { id: "urgent", name: "Urgent", slaMultiplier: 0.25, color: "#F44336" }
  ]
}
```

## 3. Notification Settings

### Alert Configuration
```javascript
{
  notifications: {
    // Channel Settings
    channels: {
      inApp: {
        enabled: true,
        sound: true,
        vibration: true,
        soundFile: "notification.mp3"
      },
      email: {
        enabled: true,
        address: "crew@yacht-serenity.com",
        urgentOnly: false
      },
      sms: {
        enabled: true,
        number: "+1234567890",
        urgentOnly: true,
        provider: "Twilio"
      },
      push: {
        enabled: true,
        providers: ["FCM", "APNS"],
        urgentOnly: false
      }
    },
    
    // Alert Types
    alertTypes: {
      serviceRequest: {
        new: { inApp: true, email: true, sms: false, push: true },
        assigned: { inApp: true, email: false, sms: false, push: true },
        completed: { inApp: true, email: false, sms: false, push: false },
        overdue: { inApp: true, email: true, sms: true, push: true }
      },
      emergency: {
        allChannels: true,
        overrideDND: true,
        repeatInterval: 5 // minutes
      },
      maintenance: {
        scheduled: { inApp: true, email: true, sms: false, push: false },
        due: { inApp: true, email: true, sms: false, push: true },
        overdue: { inApp: true, email: true, sms: true, push: true }
      },
      devices: {
        lowBattery: { inApp: true, email: false, sms: false, push: true },
        offline: { inApp: true, email: true, sms: false, push: true },
        malfunction: { inApp: true, email: true, sms: true, push: true }
      }
    },
    
    // Do Not Disturb
    doNotDisturb: {
      enabled: true,
      schedule: [
        { day: "everyday", start: "22:00", end: "07:00" },
        { day: "sunday", start: "14:00", end: "16:00" } // Crew rest
      ],
      exceptions: ["emergency", "urgent", "captain"]
    }
  }
}
```

## 4. Device Manager Settings

### ESP32 Device Configuration
```javascript
{
  deviceSettings: {
    // Discovery Settings
    discovery: {
      enabled: true,
      bluetooth: true,
      wifi: true,
      timeout: 30, // seconds
      autoRegister: false
    },
    
    // Default Device Settings
    defaults: {
      updateInterval: 60, // seconds
      batteryWarning: 20, // percent
      batteryCritical: 10, // percent
      signalWarning: -80, // dBm
      signalCritical: -90, // dBm
      heartbeatInterval: 300, // seconds
      firmwareChannel: "stable" // stable/beta
    },
    
    // Device Types
    deviceTypes: [
      {
        id: "heltec-lora-v3",
        name: "Guest Button (Heltec)",
        icon: "📱",
        capabilities: ["button", "lora", "battery", "location"],
        defaultSettings: {
          buttonMode: "single", // single/double/long
          loraFrequency: "868MHz",
          txPower: 14, // dBm
          spreadingFactor: 7
        }
      },
      {
        id: "lilygo-twatch",
        name: "Crew Smartwatch",
        icon: "⌚",
        capabilities: ["display", "vibration", "button", "wifi", "battery"],
        defaultSettings: {
          displayTimeout: 10, // seconds
          vibrationStrength: 75, // percent
          notificationTypes: ["urgent", "assigned", "emergency"]
        }
      },
      {
        id: "custom-pcb",
        name: "Custom Button",
        icon: "🔘",
        capabilities: ["button", "led", "battery", "mesh"],
        defaultSettings: {
          ledBrightness: 50, // percent
          meshRole: "node", // node/repeater
          sleepMode: "light" // light/deep
        }
      }
    ]
  }
}
```

## 5. User Management Settings

### Account & Security Policies
```javascript
{
  userManagement: {
    // Password Policy
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expiryDays: 90,
      historyCount: 5, // can't reuse last 5 passwords
      lockoutAttempts: 5,
      lockoutDuration: 30 // minutes
    },
    
    // Session Management
    sessionSettings: {
      timeout: 30, // minutes of inactivity
      maxSessions: 3, // per user
      rememberMe: true,
      rememberMeDuration: 30 // days
    },
    
    // Role Definitions
    roles: [
      {
        id: "captain",
        name: "Captain",
        level: 100,
        permissions: ["all"],
        color: "#FFD700"
      },
      {
        id: "chief_stewardess", 
        name: "Chief Stewardess",
        level: 90,
        permissions: ["crew.manage", "guests.manage", "service.manage", "reports.view"],
        color: "#C0C0C0"
      },
      {
        id: "chief_engineer",
        name: "Chief Engineer",
        level: 90,
        permissions: ["engineering.manage", "maintenance.manage", "devices.manage"],
        color: "#CD7F32"
      },
      {
        id: "officer",
        name: "Officer",
        level: 80,
        permissions: ["service.manage", "guests.view", "reports.view"],
        color: "#4169E1"
      },
      {
        id: "senior_crew",
        name: "Senior Crew",
        level: 60,
        permissions: ["service.handle", "guests.view"],
        color: "#32CD32"
      },
      {
        id: "crew",
        name: "Crew",
        level: 40,
        permissions: ["service.handle.assigned"],
        color: "#808080"
      }
    ]
  }
}
```

## 6. System Preferences

### General System Settings
```javascript
{
  systemPreferences: {
    // Localization
    localization: {
      language: "en",
      secondaryLanguage: "es",
      timezone: "Europe/Monaco",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      firstDayOfWeek: "monday",
      currency: "EUR",
      currencyPosition: "before", // before/after
      decimalSeparator: ",",
      thousandsSeparator: "."
    },
    
    // Units
    units: {
      distance: "nautical", // nautical/metric/imperial
      speed: "knots", // knots/kmh/mph
      temperature: "celsius", // celsius/fahrenheit
      volume: "liters", // liters/gallons
      weight: "kg", // kg/lbs
      pressure: "bar" // bar/psi
    },
    
    // UI Preferences  
    interface: {
      theme: "auto", // light/dark/auto
      colorScheme: "ocean", // ocean/classic/modern
      density: "comfortable", // compact/comfortable/spacious
      animations: true,
      soundEffects: true,
      fontSize: "medium", // small/medium/large
      highContrast: false
    },
    
    // Data Management
    dataManagement: {
      autoSave: true,
      autoSaveInterval: 30, // seconds
      undoLevels: 50,
      trashRetention: 30, // days
      exportFormat: "xlsx" // xlsx/csv/pdf
    }
  }
}
```

## 7. Integration Settings

### External Systems Configuration
```javascript
{
  integrations: {
    // MQTT Settings
    mqtt: {
      enabled: true,
      broker: "mqtt://yacht-broker.local:1883",
      username: "obedio",
      password: "encrypted_password",
      clientId: "obedio-server",
      topics: {
        telemetry: "yacht/+/telemetry",
        commands: "yacht/+/command",
        status: "yacht/+/status",
        alerts: "yacht/alerts"
      },
      qos: 1,
      keepAlive: 60,
      clean: false,
      ssl: true
    },
    
    // Crestron Integration
    crestron: {
      enabled: true,
      host: "192.168.1.100",
      port: 41794,
      username: "admin",
      password: "encrypted_password",
      rooms: [
        { id: "master", name: "Master Suite", processor: "RMC3-1" },
        { id: "vip1", name: "VIP Suite 1", processor: "RMC3-2" },
        { id: "salon", name: "Main Salon", processor: "RMC3-3" }
      ]
    },
    
    // Weather Service
    weather: {
      enabled: true,
      provider: "openweathermap",
      apiKey: "encrypted_api_key",
      updateInterval: 3600, // seconds
      units: "metric"
    },
    
    // Marine Traffic
    marineTraffic: {
      enabled: true,
      apiKey: "encrypted_api_key",
      vesselId: "1234567",
      updateInterval: 300 // seconds
    }
  }
}
```

## 8. Backup & Maintenance

### System Maintenance Settings
```javascript
{
  maintenance: {
    // Backup Settings
    backup: {
      enabled: true,
      schedule: "0 3 * * *", // 3 AM daily
      retention: {
        daily: 7,
        weekly: 4,
        monthly: 12
      },
      destinations: [
        {
          type: "local",
          path: "/backups",
          encrypted: true
        },
        {
          type: "s3",
          bucket: "yacht-backups",
          region: "eu-west-1",
          encrypted: true
        }
      ]
    },
    
    // System Maintenance
    systemMaintenance: {
      autoUpdate: {
        enabled: false,
        channel: "stable",
        schedule: "0 4 * * SUN" // 4 AM Sunday
      },
      logRotation: {
        maxSize: "100MB",
        maxFiles: 10,
        compress: true
      },
      databaseMaintenance: {
        vacuum: "0 5 * * SUN", // 5 AM Sunday
        analyze: "0 5 * * *", // 5 AM daily
        reindex: "0 5 1 * *" // 5 AM first of month
      }
    },
    
    // Monitoring
    monitoring: {
      metrics: {
        enabled: true,
        endpoint: "http://prometheus:9090",
        interval: 60 // seconds
      },
      healthCheck: {
        enabled: true,
        port: 8081,
        path: "/health",
        interval: 30 // seconds
      },
      alerting: {
        enabled: true,
        endpoints: [
          "email:ops@yacht-management.com",
          "sms:+1234567890"
        ]
      }
    }
  }
}
```

## Implementation Strategy

### Phase 1: Core Settings
1. Yacht Information (static data)
2. Service Categories (critical for operations)
3. System Preferences (UX critical)

### Phase 2: Operational Settings  
4. Notification Settings
5. User Management
6. Device Manager basics

### Phase 3: Advanced Features
7. Integration Settings
8. Backup & Maintenance
9. Advanced Device features

### Storage Approach
- Use PostgreSQL for structured settings
- Redis for frequently accessed configs
- Local storage for UI preferences
- Encrypted storage for sensitive data

### API Design
```
GET    /api/settings/:section
PUT    /api/settings/:section
POST   /api/settings/validate
POST   /api/settings/export
POST   /api/settings/import
GET    /api/settings/defaults/:section
POST   /api/settings/reset/:section
```

This comprehensive settings design covers all aspects of yacht operations while maintaining flexibility for customization.