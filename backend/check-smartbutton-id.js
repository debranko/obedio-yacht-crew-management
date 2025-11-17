const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('Checking smartButtonId format...\n');

  const loc = await prisma.location.findFirst({
    where: { name: 'Cabin 1' }
  });

  console.log('Location (Cabin 1):');
  console.log('  smartButtonId:', loc?.smartButtonId || 'NULL');

  const devices = await prisma.device.findMany({
    where: { type: 'smart_button' },
    take: 3
  });

  console.log('\nSmart Button Devices:');
  devices.forEach(d => {
    console.log(`  - deviceId: ${d.deviceId}`);
    console.log(`    UUID: ${d.id}`);
    console.log(`    name: ${d.name}`);
    console.log(`    locationId: ${d.locationId || 'NULL'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

check();
