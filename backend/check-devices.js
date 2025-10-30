const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDevices() {
  try {
    const count = await prisma.device.count();
    console.log('✅ Total devices in database:', count);
    
    if (count > 0) {
      const devices = await prisma.device.findMany({
        take: 3,
        select: {
          id: true,
          deviceId: true,
          name: true,
          type: true,
          status: true
        }
      });
      console.log('\n📋 First 3 devices:');
      devices.forEach(d => {
        console.log(`  - ${d.deviceId}: ${d.name} (${d.type}) - ${d.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDevices();
