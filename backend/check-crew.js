const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCrew() {
  const crew = await prisma.crewMember.findMany({
    select: {
      id: true,
      name: true,
      position: true,
      department: true,
      status: true,
    }
  });

  console.log('Crew members in database:', crew.length);
  console.log(JSON.stringify(crew, null, 2));

  await prisma.$disconnect();
}

checkCrew().catch(console.error);
