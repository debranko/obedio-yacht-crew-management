const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingFields() {
  try {
    console.log('Adding missing fields to CrewMember table...');

    // Add phone column
    await prisma.$executeRaw`
      ALTER TABLE "CrewMember"
      ADD COLUMN IF NOT EXISTS "phone" TEXT
    `;
    console.log('✅ phone column added');

    // Add onBoardContact column
    await prisma.$executeRaw`
      ALTER TABLE "CrewMember"
      ADD COLUMN IF NOT EXISTS "onBoardContact" TEXT
    `;
    console.log('✅ onBoardContact column added');

    // Add color column
    await prisma.$executeRaw`
      ALTER TABLE "CrewMember"
      ADD COLUMN IF NOT EXISTS "color" TEXT
    `;
    console.log('✅ color column added');

    // Add notes column
    await prisma.$executeRaw`
      ALTER TABLE "CrewMember"
      ADD COLUMN IF NOT EXISTS "notes" TEXT
    `;
    console.log('✅ notes column added');

    console.log('\n✅ All missing fields added successfully!');
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingFields();
