/**
 * Device Manager Seed Data
 * Creates sample devices: Smart Buttons, Watches, Repeaters, Mobile Apps
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDevices() {
  console.log('🔧 Seeding devices...');

  // Get some locations and crew for assignment
  const locations = await prisma.location.findMany();
  const crew = await prisma.crewMember.findMany();

  const masterBedroom = locations.find(l => l.name === 'Master Bedroom');
  const vipCabin = locations.find(l => l.name === 'VIP Cabin');
  const mainSalon = locations.find(l => l.name === 'Main Saloon');
  const sunDeck = locations.find(l => l.name === 'Sun Deck Lounge');
  const gym = locations.find(l => l.name === 'Gym');
  const diningRoom = locations.find(l => l.name === 'Dining Room');
  const cabin1 = locations.find(l => l.name === 'Cabin 1');
  const cabin2 = locations.find(l => l.name === 'Cabin 2');

  const maria = crew.find(c => c.name === 'Maria Lopez');
  const sarah = crew.find(c => c.name === 'Sarah Johnson');
  const sophie = crew.find(c => c.name === 'Sophie Martin');
  const emma = crew.find(c => c.name === 'Emma Wilson');

  // ========================================
  // 1. SMART BUTTONS (ESP32)
  // ========================================
  
  const smartButtons = [
    {
      deviceId: 'BTN-001',
      name: 'Master Bedroom - Bedside',
      type: 'smart_button',
      subType: 'esp32',
      status: 'online',
      locationId: masterBedroom?.id,
      batteryLevel: 85,
      signalStrength: -42,
      connectionType: 'lora_868',
      lastSeen: new Date(),
      firmwareVersion: 'v1.2.3',
      hardwareVersion: 'ESP32-S3',
      macAddress: '24:6F:28:AB:CD:01',
      config: {
        buttonActions: {
          singlePress: {
            enabled: true,
            action: 'service_call',
            requestType: 'normal',
            message: 'Guest needs assistance'
          },
          doublePress: {
            enabled: true,
            action: 'service_call',
            requestType: 'urgent',
            message: 'Urgent request'
          },
          touch: {
            enabled: false,
            action: 'custom'
          },
          doubleTouch: {
            enabled: false,
            action: 'custom'
          },
          pressHold: {
            enabled: true,
            action: 'voice_recording',
            minDuration: 2000
          },
          shake: {
            enabled: true,
            action: 'emergency_call',
            requestType: 'emergency',
            sensitivity: 'medium'
          }
        },
        audio: {
          microphoneEnabled: true,
          microphoneGain: 80,
          speakerVolume: 60,
          voiceFeedback: true
        },
        led: {
          enabled: true,
          brightness: 80,
          pattern: 'pulse',
          colors: {
            idle: '#3B82F6',
            active: '#10B981',
            confirmed: '#F59E0B',
            lowBattery: '#EF4444'
          }
        }
      }
    },
    {
      deviceId: 'BTN-002',
      name: 'VIP Cabin - Bathroom',
      type: 'smart_button',
      subType: 'esp32',
      status: 'online',
      locationId: vipCabin?.id,
      batteryLevel: 72,
      signalStrength: -48,
      connectionType: 'lora_868',
      lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      firmwareVersion: 'v1.2.3',
      hardwareVersion: 'ESP32-S3',
      macAddress: '24:6F:28:AB:CD:02',
      config: {
        buttonActions: {
          singlePress: { enabled: true, action: 'service_call', requestType: 'normal' },
          doublePress: { enabled: true, action: 'service_call', requestType: 'urgent' },
          touch: { enabled: false },
          doubleTouch: { enabled: false },
          pressHold: { enabled: true, action: 'voice_recording', minDuration: 2000 },
          shake: { enabled: true, action: 'emergency_call', sensitivity: 'high' }
        },
        audio: { microphoneEnabled: true, microphoneGain: 75, speakerVolume: 65 },
        led: { enabled: true, brightness: 70, pattern: 'blink' }
      }
    },
    {
      deviceId: 'BTN-003',
      name: 'Sun Deck - Bar Area',
      type: 'smart_button',
      subType: 'esp32',
      status: 'low_battery',
      locationId: sunDeck?.id,
      batteryLevel: 15,
      signalStrength: -55,
      connectionType: 'wifi',
      lastSeen: new Date(Date.now() - 1 * 60 * 1000), // 1 min ago
      firmwareVersion: 'v1.2.2',
      hardwareVersion: 'ESP32-S2',
      macAddress: '24:6F:28:AB:CD:03',
      config: {
        buttonActions: {
          singlePress: { enabled: true, action: 'service_call', requestType: 'normal' },
          doublePress: { enabled: true, action: 'service_call', requestType: 'urgent' }
        },
        audio: { microphoneEnabled: true, microphoneGain: 70, speakerVolume: 70 },
        led: { enabled: true, brightness: 50, pattern: 'solid' }
      }
    },
    {
      deviceId: 'BTN-004',
      name: 'Main Salon - Entry',
      type: 'smart_button',
      subType: 'esp32',
      status: 'online',
      locationId: mainSalon?.id,
      batteryLevel: 91,
      signalStrength: -40,
      connectionType: 'lora_868',
      lastSeen: new Date(Date.now() - 3 * 60 * 1000),
      firmwareVersion: 'v1.2.3',
      hardwareVersion: 'ESP32-S3',
      macAddress: '24:6F:28:AB:CD:04',
      config: {
        buttonActions: {
          singlePress: { enabled: true, action: 'service_call', requestType: 'normal' }
        },
        audio: { microphoneEnabled: false },
        led: { enabled: true, brightness: 90 }
      }
    },
    {
      deviceId: 'BTN-005',
      name: 'Dining Room - Table',
      type: 'smart_button',
      subType: 'esp32',
      status: 'online',
      locationId: diningRoom?.id,
      batteryLevel: 68,
      signalStrength: -45,
      connectionType: 'lora_868',
      lastSeen: new Date(),
      firmwareVersion: 'v1.2.3',
      macAddress: '24:6F:28:AB:CD:05'
    },
    {
      deviceId: 'BTN-006',
      name: 'Gym - Equipment Area',
      type: 'smart_button',
      subType: 'esp32',
      status: 'online',
      locationId: gym?.id,
      batteryLevel: 55,
      signalStrength: -50,
      connectionType: 'wifi',
      lastSeen: new Date(Date.now() - 2 * 60 * 1000),
      firmwareVersion: 'v1.2.1',
      macAddress: '24:6F:28:AB:CD:06'
    }
  ];

  // ========================================
  // 2. SMART WATCHES
  // ========================================

  const smartWatches = [
    {
      deviceId: 'WCH-001',
      name: 'Maria Lopez - Apple Watch',
      type: 'watch',
      subType: 'ios',
      status: 'online',
      crewMemberId: maria?.id,
      batteryLevel: 68,
      signalStrength: -35,
      connectionType: 'wifi',
      lastSeen: new Date(Date.now() - 1 * 60 * 1000),
      firmwareVersion: 'watchOS 10.2',
      hardwareVersion: 'Apple Watch Series 9',
      macAddress: '88:66:5A:12:34:01',
      config: {
        notifications: {
          serviceRequests: true,
          emergencyCalls: true,
          systemAlerts: true,
          vibration: true,
          sound: false
        },
        permissions: {
          acceptRequests: true,
          viewAllRequests: true,
          viewGuestInfo: true,
          viewLocationDetails: true
        },
        gps: {
          enabled: true,
          reportInterval: 300
        }
      }
    },
    {
      deviceId: 'WCH-002',
      name: 'Sarah Johnson - Apple Watch',
      type: 'watch',
      subType: 'ios',
      status: 'online',
      crewMemberId: sarah?.id,
      batteryLevel: 45,
      signalStrength: -38,
      connectionType: 'wifi',
      lastSeen: new Date(Date.now() - 2 * 60 * 1000),
      firmwareVersion: 'watchOS 10.1',
      hardwareVersion: 'Apple Watch Series 8',
      macAddress: '88:66:5A:12:34:02',
      config: {
        notifications: { serviceRequests: true, emergencyCalls: true },
        permissions: { acceptRequests: true, viewGuestInfo: true }
      }
    },
    {
      deviceId: 'WCH-003',
      name: 'Sophie Martin - Android Watch',
      type: 'watch',
      subType: 'android',
      status: 'online',
      crewMemberId: sophie?.id,
      batteryLevel: 82,
      signalStrength: -32,
      connectionType: 'wifi',
      lastSeen: new Date(),
      firmwareVersion: 'Wear OS 4.0',
      hardwareVersion: 'Samsung Galaxy Watch 6',
      macAddress: '88:66:5A:12:34:03',
      config: {
        notifications: { serviceRequests: true },
        permissions: { acceptRequests: true }
      }
    },
    {
      deviceId: 'WCH-004',
      name: 'Emma Wilson - ESP32 Watch',
      type: 'watch',
      subType: 'esp32',
      status: 'low_battery',
      crewMemberId: emma?.id,
      batteryLevel: 12,
      signalStrength: -45,
      connectionType: 'lora_868',
      lastSeen: new Date(Date.now() - 4 * 60 * 1000),
      firmwareVersion: 'v1.0.5',
      hardwareVersion: 'ESP32-C3',
      macAddress: '88:66:5A:12:34:04'
    }
  ];

  // ========================================
  // 3. REPEATERS
  // ========================================

  const repeaters = [
    {
      deviceId: 'RPT-001',
      name: 'Main Deck Repeater',
      type: 'repeater',
      subType: 'lora_wifi',
      status: 'online',
      locationId: locations.find(l => l.floor === 'Main Deck')?.id,
      signalStrength: -25,
      connectionType: 'lora_868',
      lastSeen: new Date(Date.now() - 30 * 1000), // 30s ago
      firmwareVersion: 'v2.1.0',
      hardwareVersion: 'RPT-Pro-868',
      macAddress: 'A4:CF:12:34:56:01',
      ipAddress: '192.168.1.201',
      config: {
        frequency: '868',
        transmissionPower: 25,
        spreadingFactor: 'SF9',
        bandwidth: '125kHz',
        powerSource: 'UPS',
        powerStatus: {
          voltage: 12.5,
          current: 0.8,
          batteryBackup: true,
          batteryLevel: 95,
          estimatedRuntime: 240
        },
        connectedDevices: 24,
        coverage: {
          radius: 150, // meters
          floors: ['Main Deck', 'Owner\'s Deck']
        }
      }
    },
    {
      deviceId: 'RPT-002',
      name: 'Bridge Deck Repeater',
      type: 'repeater',
      subType: 'lora_wifi',
      status: 'online',
      locationId: locations.find(l => l.floor === 'Bridge Deck')?.id,
      signalStrength: -28,
      connectionType: 'lora_868',
      lastSeen: new Date(Date.now() - 45 * 1000),
      firmwareVersion: 'v2.1.0',
      macAddress: 'A4:CF:12:34:56:02',
      ipAddress: '192.168.1.202',
      config: {
        frequency: '868',
        transmissionPower: 20,
        powerSource: 'PoE',
        connectedDevices: 18,
        coverage: { radius: 120 }
      }
    },
    {
      deviceId: 'RPT-003',
      name: 'Lower Deck Repeater',
      type: 'repeater',
      subType: 'lora_wifi',
      status: 'online',
      locationId: locations.find(l => l.floor === 'Lower Deck')?.id,
      signalStrength: -30,
      connectionType: 'lora_868',
      lastSeen: new Date(Date.now() - 60 * 1000),
      firmwareVersion: 'v2.0.8',
      macAddress: 'A4:CF:12:34:56:03',
      ipAddress: '192.168.1.203',
      config: {
        frequency: '868',
        transmissionPower: 22,
        powerSource: 'AC',
        connectedDevices: 15
      }
    }
  ];

  // ========================================
  // 4. MOBILE APPS
  // ========================================

  const mobileApps = [
    {
      deviceId: 'APP-IOS-001',
      name: 'Maria Lopez - iPhone 14 Pro',
      type: 'mobile_app',
      subType: 'ios',
      status: 'online',
      crewMemberId: maria?.id,
      batteryLevel: 75,
      signalStrength: -40,
      connectionType: 'wifi',
      lastSeen: new Date(Date.now() - 30 * 1000),
      firmwareVersion: 'iOS 17.2',
      hardwareVersion: 'iPhone 14 Pro',
      macAddress: 'D4:61:9D:12:34:01',
      config: {
        appVersion: '1.2.3',
        pushToken: 'fake-ios-push-token-001',
        permissions: {
          viewServiceRequests: true,
          acceptRequests: true,
          completeRequests: true,
          viewGuests: true,
          editGuests: false,
          viewLocations: true
        },
        notifications: {
          enabled: true,
          serviceRequests: true,
          emergencyCalls: true,
          badge: true,
          sound: true
        }
      }
    },
    {
      deviceId: 'APP-AND-001',
      name: 'Sarah Johnson - Samsung S23',
      type: 'mobile_app',
      subType: 'android',
      status: 'online',
      crewMemberId: sarah?.id,
      batteryLevel: 62,
      signalStrength: -45,
      connectionType: 'wifi',
      lastSeen: new Date(Date.now() - 5 * 60 * 1000),
      firmwareVersion: 'Android 14',
      hardwareVersion: 'Samsung Galaxy S23',
      macAddress: 'D4:61:9D:12:34:02',
      config: {
        appVersion: '1.2.2',
        pushToken: 'fake-android-push-token-001',
        permissions: { viewServiceRequests: true, acceptRequests: true },
        notifications: { enabled: true }
      }
    }
  ];

  // Create all devices
  const allDevices = [...smartButtons, ...smartWatches, ...repeaters, ...mobileApps];

  for (const device of allDevices) {
    await prisma.device.upsert({
      where: { deviceId: device.deviceId },
      update: device,
      create: device
    });
  }

  console.log(`✅ Created ${allDevices.length} devices:`);
  console.log(`   • Smart Buttons: ${smartButtons.length}`);
  console.log(`   • Watches: ${smartWatches.length}`);
  console.log(`   • Repeaters: ${repeaters.length}`);
  console.log(`   • Mobile Apps: ${mobileApps.length}`);

  // Create some device logs
  console.log('📋 Creating device logs...');

  const deviceLogs = [
    {
      deviceId: (await prisma.device.findUnique({ where: { deviceId: 'BTN-001' } }))!.id,
      eventType: 'button_press',
      eventData: { action: 'singlePress', requestType: 'normal' },
      severity: 'info',
      createdAt: new Date(Date.now() - 10 * 60 * 1000)
    },
    {
      deviceId: (await prisma.device.findUnique({ where: { deviceId: 'BTN-003' } }))!.id,
      eventType: 'battery_low',
      eventData: { batteryLevel: 15, threshold: 20 },
      severity: 'warning',
      createdAt: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      deviceId: (await prisma.device.findUnique({ where: { deviceId: 'WCH-004' } }))!.id,
      eventType: 'battery_low',
      eventData: { batteryLevel: 12 },
      severity: 'warning',
      createdAt: new Date()
    }
  ];

  for (const log of deviceLogs) {
    await prisma.deviceLog.create({ data: log });
  }

  console.log(`✅ Created ${deviceLogs.length} device logs`);
}

async function main() {
  try {
    await seedDevices();
    console.log('🎉 Device seeding completed!');
  } catch (error) {
    console.error('❌ Device seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
