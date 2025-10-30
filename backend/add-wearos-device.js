const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addWearOSDevice() {
  try {
    console.log('\n📱 Adding Wear OS Watch to database...\n');

    // Check if device already exists
    const existing = await prisma.device.findFirst({
      where: {
        OR: [
          { deviceId: 'WEAR-ANDROID-001' },
          { name: { contains: 'Wear OS', mode: 'insensitive' } }
        ]
      }
    });

    if (existing) {
      console.log('⚠️  Wear OS device already exists:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Device ID: ${existing.deviceId}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Type: ${existing.type}`);
      console.log(`   Status: ${existing.status}`);
      console.log(`   Assigned to: ${existing.crewMemberId || 'UNASSIGNED'}`);
      return;
    }

    // Create new Wear OS device
    const device = await prisma.device.create({
      data: {
        deviceId: 'WEAR-ANDROID-001',
        name: 'Wear OS Watch (TicWatch Pro 5)',
        type: 'wearable',
        subType: 'android',
        status: 'online',
        connectionType: 'wifi',
        batteryLevel: 85,
        signalStrength: 95,
        lastSeen: new Date(),
        config: {
          model: 'TicWatch Pro 5',
          manufacturer: 'Mobvoi',
          osVersion: 'Wear OS 3.5',
          appVersion: '1.0.0'
        }
      }
    });

    console.log('✅ Wear OS Watch successfully added to database!\n');
    console.log('📋 Device Details:');
    console.log(`   ID: ${device.id}`);
    console.log(`   Device ID: ${device.deviceId}`);
    console.log(`   Name: ${device.name}`);
    console.log(`   Type: ${device.type}`);
    console.log(`   Sub-Type: ${device.subType}`);
    console.log(`   Status: ${device.status}`);
    console.log(`   Battery: ${device.batteryLevel}%`);
    console.log(`   Signal: ${device.signalStrength}%`);
    console.log(`   Assigned to: UNASSIGNED (ready to assign to crew)\n`);

    // Create device log entry
    await prisma.deviceLog.create({
      data: {
        deviceId: device.id,
        eventType: 'device_added',
        eventData: {
          deviceId: device.deviceId,
          name: device.name,
          source: 'manual_registration'
        },
        severity: 'info'
      }
    });

    console.log('✅ Device log created\n');
    console.log('🎯 Next Steps:');
    console.log('   1. Open OBEDIO web app');
    console.log('   2. Go to Device Manager → Watches');
    console.log('   3. You should see "Wear OS Watch (TicWatch Pro 5)"');
    console.log('   4. Assign it to a crew member');
    console.log('   5. Test notifications on the watch!\n');

  } catch (error) {
    console.error('❌ Error adding Wear OS device:', error.message);
    if (error.code) console.error('   Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

addWearOSDevice();
