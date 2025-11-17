const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGuestDates() {
  try {
    const guests = await prisma.guest.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        type: true,
        checkInDate: true,
        checkOutDate: true
      }
    });

    console.log('=== GUEST DATES IN DATABASE ===');
    console.log(`Total guests: ${guests.length}\n`);

    guests.forEach(guest => {
      console.log(`${guest.firstName} ${guest.lastName} (${guest.type})`);
      console.log(`  checkInDate: ${JSON.stringify(guest.checkInDate)} (type: ${typeof guest.checkInDate}, empty? ${guest.checkInDate === ''})`);
      console.log(`  checkOutDate: ${JSON.stringify(guest.checkOutDate)} (type: ${typeof guest.checkOutDate}, empty? ${guest.checkOutDate === ''})`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGuestDates();
