import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const locations = await prisma.location.findMany({ take: 5 });
  const guests = await prisma.guest.findMany({ take: 5 });

  console.log('\n📍 LOCATIONS:');
  locations.forEach(l => {
    console.log(`  ${l.name}: ${l.id}`);
  });

  console.log('\n👤 GUESTS:');
  guests.forEach(g => {
    console.log(`  ${g.firstName} ${g.lastName}: ${g.id}`);
  });

  await prisma.$disconnect();
}

main();
