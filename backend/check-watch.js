const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWatch() {
  const watches = await prisma.device.findMany({
    where: { type: 'watch' }
  });

  console.log('\n⌚ WATCHES IN DATABASE:\n');
  if (watches.length === 0) {
    console.log('  ❌ NO WATCHES FOUND IN DATABASE');
  } else {
    watches.forEach(w => {
      console.log(`  Device ID: ${w.deviceId}`);
      console.log(`  Name: ${w.name}`);
      console.log(`  Status: ${w.status}`);
      console.log(`  Battery: ${w.batteryLevel}%`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkWatch();
