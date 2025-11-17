const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDevices() {
  try {
    console.log('🔍 Checking watch devices assignments...\n');

    // Use raw SQL to avoid Prisma type confusion
    const watches = await prisma.$queryRaw`
      SELECT
        id,
        "deviceId",
        name,
        type,
        status,
        "crewMemberId"
      FROM "Device"
      WHERE type = 'watch'
      ORDER BY name
    `;

    console.log(`📱 Total watches: ${watches.length}\n`);

    const assigned = watches.filter(w => w.crewMemberId);
    const unassigned = watches.filter(w => !w.crewMemberId);

    console.log(`✅ Assigned watches: ${assigned.length}`);
    if (assigned.length > 0) {
      console.table(assigned.map(w => ({
        name: w.name,
        deviceId: w.deviceId,
        crewMemberId: w.crewMemberId || 'none',
        status: w.status
      })));
    }

    console.log(`\n🆓 Unassigned watches: ${unassigned.length}`);
    if (unassigned.length > 0) {
      console.table(unassigned.map(w => ({
        name: w.name,
        deviceId: w.deviceId,
        status: w.status
      })));
    } else {
      console.log('⚠️  No unassigned watches available!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkDevices();
