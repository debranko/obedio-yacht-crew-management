const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGuestTypes() {
  try {
    console.log('Checking Guest types in database...\n');

    // Use raw SQL to see what types exist
    const guests = await prisma.$queryRaw`
      SELECT id, "firstName", "lastName", type FROM "Guest"
    `;

    console.log('Found guests:');
    console.table(guests);

    // Group by type
    const typeGroups = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count
      FROM "Guest"
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

checkGuestTypes();
