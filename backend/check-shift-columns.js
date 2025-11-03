const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumns() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'Shift'
    `;
    console.log('Shift table columns:', JSON.stringify(result, null, 2));
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
