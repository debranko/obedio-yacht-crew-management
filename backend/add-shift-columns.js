const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumns() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "primaryCount" INTEGER DEFAULT 2');
    await prisma.$executeRawUnsafe('ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "backupCount" INTEGER DEFAULT 1');
    console.log('✅ Columns added successfully');
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

addColumns();
