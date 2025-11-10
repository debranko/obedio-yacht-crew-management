const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCrewStatusFormat() {
  console.log('\n🔧 Fixing crew member status format...\n');

  // Find all crew with underscore format
  const allCrew = await prisma.crewMember.findMany();

  let fixed = 0;

  for (const crew of allCrew) {
    let newStatus = null;

    // Convert underscore to dash format
    if (crew.status === 'on_duty') {
      newStatus = 'on-duty';
    } else if (crew.status === 'off_duty') {
      newStatus = 'off-duty';
    } else if (crew.status === 'on_leave') {
      newStatus = 'on-leave';
    }

    if (newStatus) {
      await prisma.crewMember.update({
        where: { id: crew.id },
        data: { status: newStatus }
      });
      console.log(`  ✅ ${crew.name}: ${crew.status} → ${newStatus}`);
      fixed++;
    }
  }

  console.log(`\n✨ Fixed ${fixed} crew member status formats\n`);

  await prisma.$disconnect();
}

fixCrewStatusFormat();
