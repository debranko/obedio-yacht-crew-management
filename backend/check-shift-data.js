const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const result = await prisma.$queryRaw`
      SELECT id, name, "primaryCount", "backupCount"
      FROM "Shift"
      LIMIT 5
    `;
    console.log('Shift data:', JSON.stringify(result, null, 2));
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
