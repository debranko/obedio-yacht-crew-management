const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCrewStatus() {
  const crew = await prisma.crewMember.findMany({
    where: { department: 'INTERIOR' }
  });

  console.log('\n👥 Interior Crew Members:\n');
  crew.forEach(c => {
    console.log(`  ${c.name.padEnd(20)} - Status: ${c.status}`);
  });
  console.log('');

  await prisma.$disconnect();
}

checkCrewStatus();
