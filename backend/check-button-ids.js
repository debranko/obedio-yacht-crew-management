const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkButtonIds() {
  const locations = await prisma.location.findMany({
    select: { name: true, smartButtonId: true },
    orderBy: { name: 'asc' }
  });

  console.log('\n📍 LOKACIJE I NJIHOVI BUTTON ID-OVI:\n');
  locations.forEach(loc => {
    const btnId = loc.smartButtonId || 'NEMA';
    console.log(`  ${loc.name.padEnd(30)} → ${btnId}`);
  });
  console.log('');

  await prisma.$disconnect();
}

checkButtonIds();
