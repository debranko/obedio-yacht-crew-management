const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllUsers() {
  const users = await prisma.user.findMany({
    include: {
      crewMember: true
    }
  });

  console.log('\n👥 ALL USERS IN DATABASE:\n');
  if (users.length === 0) {
    console.log('  ❌ NO USERS FOUND');
  } else {
    users.forEach(u => {
      console.log(`  Username: ${u.username}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  Crew: ${u.crewMember?.name || 'N/A'}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkAllUsers();
