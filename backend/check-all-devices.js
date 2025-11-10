const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllDevices() {
  const devices = await prisma.device.findMany({
    include: {
      crewMember: true
    }
  });

  console.log('\n📱 All Devices in Database:\n');
  if (devices.length === 0) {
    console.log('  ❌ NO DEVICES FOUND');
  } else {
    devices.forEach(d => {
      console.log(`  Device ID: ${d.deviceId.padEnd(20)} Type: ${d.type.padEnd(15)} Name: ${d.name.padEnd(30)}`);
      console.log(`    Status: ${d.status.padEnd(10)} Battery: ${d.batteryLevel}%  Signal: ${d.signalStrength}dBm`);
      console.log(`    MAC: ${d.macAddress || 'N/A'}`);
      console.log(`    Assigned to: ${d.crewMember?.name || 'Not assigned'}`);
      console.log('');
    });
  }
  console.log(`Total: ${devices.length} devices\n`);

  await prisma.$disconnect();
}

checkAllDevices();
