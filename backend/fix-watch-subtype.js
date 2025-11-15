const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWatchSubType() {
  console.log('\n🔧 Fixing watch subType...\n');

  const watch = await prisma.device.update({
    where: { deviceId: 'WEAR-OS-001' },
    data: {
      subType: 'wear_os'
    }
  });

  console.log('✅ Watch updated:');
  console.log(`   Device ID: ${watch.deviceId}`);
  console.log(`   Type: ${watch.type}`);
  console.log(`   SubType: ${watch.subType}`);
  console.log('');

  await prisma.$disconnect();
}

fixWatchSubType();
