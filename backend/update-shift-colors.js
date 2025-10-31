const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateColors() {
  try {
    // Update Shift 1 - Morning yellow/gold
    await prisma.$executeRaw`
      UPDATE "Shift"
      SET color = '#F59E0B'
      WHERE name = 'Shift 1'
    `;

    // Update Shift 2 - Afternoon orange/coral
    await prisma.$executeRaw`
      UPDATE "Shift"
      SET color = '#F97316'
      WHERE name = 'Shift 2'
    `;

    // Update Shift 3 - Evening purple
    await prisma.$executeRaw`
      UPDATE "Shift"
      SET color = '#8B5CF6'
      WHERE name = 'Shift 3'
    `;

    // Update Night - Dark indigo/blue
    await prisma.$executeRaw`
      UPDATE "Shift"
      SET color = '#4F46E5'
      WHERE name = 'Night'
    `;

    console.log('✅ Shift colors updated:');
    console.log('  - Shift 1: #F59E0B (Amber/Gold)');
    console.log('  - Shift 2: #F97316 (Orange)');
    console.log('  - Shift 3: #8B5CF6 (Purple)');
    console.log('  - Night: #4F46E5 (Indigo)');
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateColors();
