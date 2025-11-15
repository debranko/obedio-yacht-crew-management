const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumns() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'CrewMember'
      ORDER BY ordinal_position
    `;
    console.log('CrewMember table columns:');
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
