const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDevices() {
  try {
    const devices = await prisma.device.findMany({
      include: {
        crewMember: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('✅ Total devices in database:', devices.length);
    console.log('\n📋 All devices:\n');

    devices.forEach(d => {
      const assignedTo = d.crewMember ? `Assigned to: ${d.crewMember.name}` : '✅ UNASSIGNED';
      console.log(`  ${d.deviceId}: ${d.name}`);
      console.log(`    Type: ${d.type}`);
      console.log(`    ${assignedTo}`);
      console.log(`    Status: ${d.status}\n`);
    });

    const watches = devices.filter(d => d.type === 'watch' || d.type === 'wearable');
    const unassignedWatches = watches.filter(d => !d.crewMemberId);

    console.log('\n📊 SUMMARY:');
    console.log(`  Total Devices: ${devices.length}`);
    console.log(`  Watches/Wearables: ${watches.length}`);
    console.log(`  Unassigned Watches: ${unassignedWatches.length}`);

    if (unassignedWatches.length > 0) {
      console.log('\n✅ Available watches for assignment:');
      unassignedWatches.forEach(w => console.log(`  - ${w.deviceId}: ${w.name}`));
    } else {
      console.log('\n⚠️  No unassigned watches available!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDevices();
