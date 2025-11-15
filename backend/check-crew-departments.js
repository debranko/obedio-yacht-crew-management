const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCrewDepartments() {
  const crew = await prisma.crewMember.findMany();

  console.log('\n👥 All Crew Members:\n');
  if (crew.length === 0) {
    console.log('  ❌ NO CREW MEMBERS FOUND');
  } else {
    crew.forEach(c => {
      console.log(`  ${c.name.padEnd(25)} Department: ${c.department.padEnd(15)} Status: ${c.status}`);
    });
  }
  console.log(`\nTotal: ${crew.length} crew members\n`);

  await prisma.$disconnect();
}

checkCrewDepartments();
