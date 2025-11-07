const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setCrewOnDuty() {
  try {
    console.log('\n=== Setting crew members to on-duty ===');

    // Update first 3 crew members to on-duty
    const updated = await prisma.crewMember.updateMany({
      where: {
        department: 'Interior',
      },
      data: {
        status: 'on-duty'
      }
    });

    console.log(`✅ Updated ${updated.count} crew members to on-duty status`);

    // Show updated crew
    const crew = await prisma.crewMember.findMany({
      where: { department: 'Interior' },
      select: {
        id: true,
        name: true,
        position: true,
        department: true,
        status: true
      }
    });

    console.log('\n=== Interior Crew Status ===');
    console.log(JSON.stringify(crew, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setCrewOnDuty();
