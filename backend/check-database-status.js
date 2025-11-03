const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  try {
    console.log('=== CHECKING DATABASE STATUS ===\n');

    // Check ServiceRequest status column
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'ServiceRequest' AND column_name = 'status'
    `;
    console.log('ServiceRequest.status column:', JSON.stringify(result, null, 2));

    // Check if enum exists
    const enums = await prisma.$queryRaw`
      SELECT typname FROM pg_type WHERE typtype = 'e' AND typname LIKE '%ServiceRequest%'
    `;
    console.log('\nServiceRequest related enums:', JSON.stringify(enums, null, 2));

    // Check all data in ServiceRequest
    const count = await prisma.serviceRequest.count();
    console.log('\nServiceRequest records count:', count);

    if (count > 0) {
      const sample = await prisma.serviceRequest.findFirst({
        select: { id: true, status: true, requestType: true, priority: true }
      });
      console.log('Sample ServiceRequest:', JSON.stringify(sample, null, 2));
    }

    console.log('\n✅ Database connection OK');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();
