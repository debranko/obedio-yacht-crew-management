const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWatchDetails() {
  const watch = await prisma.device.findFirst({
    where: { type: 'watch' },
    include: {
      crewMember: {
        include: {
          user: true
        }
      },
      location: true
    }
  });

  console.log('\n⌚ WATCH DETAILS:\n');
  console.log(JSON.stringify(watch, null, 2));

  await prisma.$disconnect();
}

checkWatchDetails();
