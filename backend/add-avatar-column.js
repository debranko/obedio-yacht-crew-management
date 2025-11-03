const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addAvatarColumn() {
  try {
    console.log('Adding avatar column to CrewMember table...');

    // Add avatar column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE "CrewMember"
      ADD COLUMN IF NOT EXISTS "avatar" TEXT
    `;

    console.log('✅ Avatar column added successfully');
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

addAvatarColumn();
