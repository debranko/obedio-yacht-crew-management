const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('🔍 Checking all watches in database...\n');

  const watches = await prisma.device.findMany({
    where: { type: 'watch' },
    include: {
      crewMember: {
        select: {
          id: true,
          name: true,
          status: true,
          department: true
        }
      }
    }
  });

  console.log(`📱 Total watches found: ${watches.length}\n`);

  watches.forEach((watch, index) => {
    console.log(`Watch ${index + 1}:`);
    console.log(`  Device ID: ${watch.deviceId}`);
    console.log(`  MAC Address: ${watch.macAddress || 'N/A'}`);
    console.log(`  Status: ${watch.status}`);

    if (watch.crewMember) {
      console.log(`  Assigned to: ${watch.crewMember.name}`);
      console.log(`  Crew status: ${watch.crewMember.status}`);
      console.log(`  Department: ${watch.crewMember.department}`);
    } else {
      console.log(`  ⚠️ NOT assigned to any crew member`);
    }

    console.log(`  MQTT Topic: obedio/watch/${watch.deviceId}/notification`);
    console.log('');
  });

  // Also check on-duty crew members
  console.log('\n👷 On-duty crew members:\n');

  const onDutyCrew = await prisma.crewMember.findMany({
    where: { status: 'on-duty' },
    include: {
      devices: {
        where: { type: 'watch' }
      }
    }
  });

  onDutyCrew.forEach((crew) => {
    console.log(`${crew.name} (${crew.department})`);
    if (crew.devices.length > 0) {
      crew.devices.forEach(device => {
        console.log(`  ✅ Has watch: ${device.deviceId}`);
      });
    } else {
      console.log(`  ⚠️ No watch assigned`);
    }
  });

  await prisma.$disconnect();
})();
