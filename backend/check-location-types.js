const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLocationTypes() {
  try {
    console.log('Checking Location types in database...\n');

    // Use raw SQL to see what types exist
    const locations = await prisma.$queryRaw`
      SELECT id, name, type FROM "Location"
    `;

    console.log('Found locations:');
    console.table(locations);

    // Group by type
    const typeGroups = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count
      FROM "Location"
      GROUP BY type
    `;

    console.log('\nTypes summary:');
    console.table(typeGroups);

  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocationTypes();
