const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLocation() {
  console.log('Checking location ID from T3S3 firmware...\n');

  const locationId = 'cmh4h002y000dj7191pezz192';

  const location = await prisma.location.findUnique({
    where: { id: locationId }
  });

  if (location) {
    console.log('✅ Location FOUND:');
    console.log('   ID:', location.id);
    console.log('   Name:', location.name);
    console.log('   Type:', location.type);
  } else {
    console.log('❌ Location NOT FOUND with ID:', locationId);
    console.log('\nFetching all locations to find correct ID:');

    const allLocations = await prisma.location.findMany({
      where: { name: { contains: 'Cabin 1' } }
    });

    if (allLocations.length > 0) {
      console.log('\nFound Cabin 1 locations:');
      allLocations.forEach(loc => {
        console.log(`  - ${loc.name} (${loc.type}): ${loc.id}`);
      });
    }
  }

  await prisma.$disconnect();
}

checkLocation();
