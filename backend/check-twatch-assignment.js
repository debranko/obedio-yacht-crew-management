const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssignment() {
  const device = await prisma.device.findUnique({
    where: { deviceId: 'TWATCH-64E8337A0BAC' },
    include: { crewMember: true }
  });

  console.log('T-Watch Assignment Status:');
  console.log('crewMemberId:', device.crewMemberId);
  console.log('Assigned to:', device.crewMember ? device.crewMember.name : 'NOBODY');

  await prisma.$disconnect();
}

checkAssignment();
