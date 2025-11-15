const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGuests() {
  try {
    console.log('🔍 Checking guests in database...\n');

    const guests = await prisma.guest.findMany();

    console.log(`Found ${guests.length} guests:`);
    guests.forEach(guest => {
      console.log(`- ${guest.firstName} ${guest.lastName} (${guest.type})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkGuests();
