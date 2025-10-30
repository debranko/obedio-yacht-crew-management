const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWearOSType() {
  try {
    console.log('\n🔧 Fixing Wear OS device type...\n');

    const device = await prisma.device.update({
      where: { deviceId: 'WEAR-ANDROID-001' },
      data: { type: 'watch' }
    });

    console.log('✅ Device type updated successfully!');
    console.log(`   ${device.deviceId}: ${device.name}`);
    console.log(`   Type: wearable → watch\n`);
    console.log('🎯 Now the watch will appear in Device Manager → Watches tab!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixWearOSType();
