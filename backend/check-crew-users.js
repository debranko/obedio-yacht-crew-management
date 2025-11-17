const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCrewUsers() {
  try {
    console.log('\n=== ALL CREW MEMBERS ===');
    const crew = await prisma.crewMember.findMany({
      select: {
        id: true,
        name: true,
        position: true,
        department: true,
        status: true,
        userId: true
      }
    });
    console.log(JSON.stringify(crew, null, 2));

    console.log('\n=== ALL USERS ===');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });
    console.log(JSON.stringify(users, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCrewUsers();
