const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addNicknameColumn() {
  try {
    console.log('Adding nickname column to CrewMember table...');

    // Add nickname column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE "CrewMember"
      ADD COLUMN IF NOT EXISTS "nickname" TEXT
    `;

    console.log('✅ Nickname column added successfully');
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

addNicknameColumn();
