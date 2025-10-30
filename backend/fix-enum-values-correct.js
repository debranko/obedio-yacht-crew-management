/**
 * Fix Enum Values to Match Prisma Schema EXACTLY
 *
 * Prisma Schema Enums:
 * - ServiceRequestPriority: low, normal, urgent, emergency
 * - ServiceRequestType: call, service, emergency
 * - ServiceRequestStatus: pending, accepted, completed, cancelled
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('FIX ENUM VALUES TO MATCH SCHEMA');
  console.log('========================================\n');

  try {
    // Step 1: Drop existing wrong enums
    console.log('[1/4] Dropping incorrect enum types...');

    await prisma.$executeRaw`DROP TYPE IF EXISTS "ServiceRequestPriority" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "ServiceRequestType" CASCADE`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "ServiceRequestStatus" CASCADE`;

    console.log('   ✅ Old enums dropped');

    // Step 2: Create CORRECT enums matching Prisma schema
    console.log('\n[2/4] Creating correct enum types...');

    await prisma.$executeRaw`
      CREATE TYPE "ServiceRequestPriority" AS ENUM ('low', 'normal', 'urgent', 'emergency')
    `;
    console.log('   ✅ ServiceRequestPriority: low, normal, urgent, emergency');

    await prisma.$executeRaw`
      CREATE TYPE "ServiceRequestType" AS ENUM ('call', 'service', 'emergency')
    `;
    console.log('   ✅ ServiceRequestType: call, service, emergency');

    await prisma.$executeRaw`
      CREATE TYPE "ServiceRequestStatus" AS ENUM ('pending', 'accepted', 'completed', 'cancelled')
    `;
    console.log('   ✅ ServiceRequestStatus: pending, accepted, completed, cancelled');

    // Step 3: Update existing data to match new enum values
    console.log('\n[3/4] Updating existing data...');

    // Map old priority values to new ones
    await prisma.$executeRaw`
      UPDATE "ServiceRequest"
      SET priority = CASE
        WHEN priority::text = 'medium' THEN 'normal'
        WHEN priority::text = 'high' THEN 'urgent'
        ELSE priority::text
      END::text
      WHERE priority IS NOT NULL
    `;
    console.log('   ✅ Priority: medium→normal, high→urgent');

    // Map old requestType values to new ones
    await prisma.$executeRaw`
      UPDATE "ServiceRequest"
      SET "requestType" = CASE
        WHEN "requestType"::text IN ('housekeeping', 'food_beverage', 'maintenance', 'other') THEN 'service'
        ELSE "requestType"::text
      END::text
      WHERE "requestType" IS NOT NULL
    `;
    console.log('   ✅ RequestType: housekeeping/food_beverage/maintenance/other→service');

    // Map old status values to new ones
    await prisma.$executeRaw`
      UPDATE "ServiceRequest"
      SET status = CASE
        WHEN status::text = 'in_progress' THEN 'accepted'
        WHEN status::text = 'open' THEN 'pending'
        WHEN status::text LIKE '%COMPLETE%' THEN 'completed'
        WHEN status::text LIKE '%PEND%' THEN 'pending'
        WHEN status::text LIKE '%ACCEPT%' THEN 'accepted'
        WHEN status::text LIKE '%CANCEL%' THEN 'cancelled'
        ELSE status::text
      END::text
      WHERE status IS NOT NULL
    `;
    console.log('   ✅ Status: in_progress→accepted, open→pending, COMPLETED→completed');

    // Step 4: Convert columns to new enum types
    console.log('\n[4/4] Converting columns to enum types...');

    await prisma.$executeRaw`
      ALTER TABLE "ServiceRequest"
      ALTER COLUMN "priority" TYPE "ServiceRequestPriority"
      USING priority::text::"ServiceRequestPriority"
    `;
    await prisma.$executeRaw`
      ALTER TABLE "ServiceRequest"
      ALTER COLUMN "priority" SET DEFAULT 'normal'::"ServiceRequestPriority"
    `;
    console.log('   ✅ Priority column → ServiceRequestPriority enum');

    await prisma.$executeRaw`
      ALTER TABLE "ServiceRequest"
      ALTER COLUMN "requestType" TYPE "ServiceRequestType"
      USING "requestType"::text::"ServiceRequestType"
    `;
    await prisma.$executeRaw`
      ALTER TABLE "ServiceRequest"
      ALTER COLUMN "requestType" SET DEFAULT 'call'::"ServiceRequestType"
    `;
    console.log('   ✅ RequestType column → ServiceRequestType enum');

    await prisma.$executeRaw`
      ALTER TABLE "ServiceRequest"
      ALTER COLUMN "status" TYPE "ServiceRequestStatus"
      USING status::text::"ServiceRequestStatus"
    `;
    await prisma.$executeRaw`
      ALTER TABLE "ServiceRequest"
      ALTER COLUMN "status" SET DEFAULT 'pending'::"ServiceRequestStatus"
    `;
    console.log('   ✅ Status column → ServiceRequestStatus enum');

    // Also fix ServiceRequestHistory table
    console.log('\nFixing ServiceRequestHistory table...');
    await prisma.$executeRaw`
      ALTER TABLE "ServiceRequestHistory"
      ALTER COLUMN "previousStatus" TYPE "ServiceRequestStatus"
      USING (
        CASE
          WHEN "previousStatus" IS NULL THEN NULL
          ELSE "previousStatus"::text::"ServiceRequestStatus"
        END
      )
    `;
    await prisma.$executeRaw`
      ALTER TABLE "ServiceRequestHistory"
      ALTER COLUMN "newStatus" TYPE "ServiceRequestStatus"
      USING "newStatus"::text::"ServiceRequestStatus"
    `;
    console.log('   ✅ ServiceRequestHistory fixed');

    console.log('\n========================================');
    console.log('✅ DATABASE FIXED! Enums now match schema!');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('1. npx prisma generate');
    console.log('2. Restart backend');

  } catch (error) {
    console.error('\n❌ Error:', error);
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
