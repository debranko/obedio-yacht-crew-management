/**
 * Fix requestType column
 * The default 'call' needs to be changed to 'service'
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing requestType column...\n');

  try {
    // Step 1: Update all 'call' values to 'service'
    console.log('[1/4] Updating "call" values to "service"...');
    await prisma.$executeRaw`
      UPDATE "ServiceRequest"
      SET "requestType" = 'service'
      WHERE "requestType" = 'call'
    `;
    console.log('   ✅ Updated existing data');

    // Step 2: Drop the default
    console.log('[2/4] Dropping default value...');
    await prisma.$executeRaw`
      ALTER TABLE "ServiceRequest"
      ALTER COLUMN "requestType" DROP DEFAULT
    `;
    console.log('   ✅ Default dropped');

    // Step 3: Convert column to enum
    console.log('[3/4] Converting column to enum...');
    await prisma.$executeRaw`
      ALTER TABLE "ServiceRequest"
      ALTER COLUMN "requestType" TYPE "ServiceRequestType"
      USING "requestType"::text::"ServiceRequestType"
    `;
    console.log('   ✅ Column converted to enum');

    // Step 4: Set new default
    console.log('[4/4] Setting new default...');
    await prisma.$executeRaw`
      ALTER TABLE "ServiceRequest"
      ALTER COLUMN "requestType" SET DEFAULT 'service'::"ServiceRequestType"
    `;
    console.log('   ✅ Default set to "service"');

    // Verify
    console.log('\nVerifying...');
    const check = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'ServiceRequest'
        AND column_name = 'requestType'
    `;
    console.log('   Result:', check);

    console.log('\n✅ RequestType column fixed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
