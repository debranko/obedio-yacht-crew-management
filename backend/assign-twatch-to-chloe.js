const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignWatch() {
  console.log('Assigning T-Watch to Chloe Anderson...');

  // Find Chloe
  const chloe = await prisma.crewMember.findFirst({
    where: { name: { contains: 'Chloe' } }
  });

  if (!chloe) {
    console.log('❌ Chloe not found!');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ Found Chloe:', chloe.name, chloe.id);

  // Assign T-Watch to Chloe
  const updated = await prisma.device.update({
    where: { deviceId: 'TWATCH-64E8337A0BAC' },
    data: { crewMemberId: chloe.id }
  });

  console.log('✅ T-Watch assigned to', chloe.name);
  console.log('Device crewMemberId:', updated.crewMemberId);

  await prisma.$disconnect();
}

assignWatch();
