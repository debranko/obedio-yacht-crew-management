/**
 * Fix T-Watch device type from "wearable" to "watch"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDeviceType() {
  console.log('========================================');
  console.log('Fixing T-Watch device type');
  console.log('========================================\n');

  try {
    // Update device type from "wearable" to "watch"
    const updated = await prisma.device.update({
      where: { deviceId: 'TWATCH-64E8337A0BAC' },
      data: { type: 'watch' }
    });

    console.log('✅ Device type updated!');
    console.log('\nOld type: wearable');
    console.log('New type:', updated.type);
    console.log('\nDevice should now appear in Device Manager "Watches" tab!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDeviceType();
