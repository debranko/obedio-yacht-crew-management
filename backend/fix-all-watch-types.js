const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllWatchTypes() {
  try {
    console.log('\n🔧 Fixing all watch device types...\n');

    // Update all devices with type 'wearable' to 'watch'
    const result = await prisma.device.updateMany({
      where: { type: 'wearable' },
      data: { type: 'watch' }
    });

    console.log(`✅ Updated ${result.count} devices from 'wearable' to 'watch'\n`);

    // Show all watches now
    const watches = await prisma.device.findMany({
      where: { type: 'watch' },
      select: {
        deviceId: true,
        name: true,
        type: true,
        status: true,
        crewMember: {
          select: { name: true }
        }
      },
      orderBy: { deviceId: 'asc' }
    });

    console.log(`📋 All watches in database (${watches.length}):\n`);
    watches.forEach(w => {
      const assignedTo = w.crewMember ? `→ ${w.crewMember.name}` : '(Unassigned)';
      console.log(`   ${w.deviceId}: ${w.name} ${assignedTo}`);
    });

    console.log('\n✅ All watch types are now consistent!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllWatchTypes();
