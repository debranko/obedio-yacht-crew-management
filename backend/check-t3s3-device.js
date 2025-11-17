const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDevice() {
  console.log('Checking T3S3 device in database...\n');

  const device = await prisma.device.findUnique({
    where: { deviceId: 'T3S3-000000000000' },
    include: { location: true }
  });

  if (device) {
    console.log('✅ Device FOUND:');
    console.log('   Device ID:', device.deviceId);
    console.log('   Name:', device.name);
    console.log('   Type:', device.type);
    console.log('   Location ID:', device.locationId || 'NULL');
    console.log('   Location:', device.location ? device.location.name : 'NULL (location not loaded)');
  } else {
    console.log('❌ Device NOT FOUND: T3S3-000000000000');
  }

  await prisma.$disconnect();
}

checkDevice();
