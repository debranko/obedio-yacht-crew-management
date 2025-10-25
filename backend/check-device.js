/**
 * Check if TWATCH device exists in database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDevice() {
  console.log('========================================');
  console.log('Checking TWATCH-64E8337A0BAC in database');
  console.log('========================================\n');

  try {
    // Find the specific device
    const device = await prisma.device.findUnique({
      where: { deviceId: 'TWATCH-64E8337A0BAC' }
    });

    if (device) {
      console.log('✅ Device FOUND in database!\n');
      console.log('Device details:');
      console.log(JSON.stringify(device, null, 2));
    } else {
      console.log('❌ Device NOT FOUND in database!\n');
      console.log('This means registration never succeeded.');
      console.log('Device needs to send registration message again.');
    }

    console.log('\n========================================');
    console.log('All devices in database:');
    console.log('========================================\n');

    const allDevices = await prisma.device.findMany({
      select: {
        deviceId: true,
        name: true,
        type: true,
        status: true,
        lastSeen: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (allDevices.length === 0) {
      console.log('No devices found in database.');
    } else {
      allDevices.forEach((d, i) => {
        console.log(`${i + 1}. ${d.deviceId}`);
        console.log(`   Name: ${d.name}`);
        console.log(`   Type: ${d.type}`);
        console.log(`   Status: ${d.status}`);
        console.log(`   Last seen: ${d.lastSeen}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDevice();
