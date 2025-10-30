/**
 * Fix Database Enum Issues
 *
 * This script manually creates missing enum types and converts columns
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('DATABASE ENUM FIX');
  console.log('========================================\n');

  try {
    // Step 1: Check current database state
    console.log('[1/5] Checking current database state...');

    const enumCheck = await prisma.$queryRaw`
      SELECT t.typname AS enum_name
      FROM pg_type t
      WHERE t.typname IN ('ServiceRequestStatus', 'ServiceRequestType', 'ServiceRequestPriority')
    `;
    console.log('   Existing enums:', enumCheck);

    const columnCheck = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'ServiceRequest'
        AND column_name IN ('status', 'requestType', 'priority')
    `;
    console.log('   Current columns:', columnCheck);

    // Step 2: Create missing enum types
    console.log('\n[2/5] Creating missing enum types...');

    // Create ServiceRequestStatus enum
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "ServiceRequestStatus" AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      console.log('   ✅ ServiceRequestStatus enum created/exists');
    } catch (error) {
      console.log('   ⚠️  ServiceRequestStatus:', error.message);
    }

    // Create ServiceRequestType enum
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "ServiceRequestType" AS ENUM ('service', 'housekeeping', 'food_beverage', 'maintenance', 'other');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      console.log('   ✅ ServiceRequestType enum created/exists');
    } catch (error) {
      console.log('   ⚠️  ServiceRequestType:', error.message);
    }

    // Create ServiceRequestPriority enum
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "ServiceRequestPriority" AS ENUM ('low', 'medium', 'high', 'urgent');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      console.log('   ✅ ServiceRequestPriority enum created/exists');
    } catch (error) {
      console.log('   ⚠️  ServiceRequestPriority:', error.message);
    }

    // Step 3: Update existing data to match enum values
    console.log('\n[3/5] Normalizing existing data...');

    // Normalize status values
    await prisma.$executeRaw`
      UPDATE "ServiceRequest"
      SET status = LOWER(status)
      WHERE status IS NOT NULL
    `;
    console.log('   ✅ Status values normalized to lowercase');

    // Normalize requestType values
    await prisma.$executeRaw`
      UPDATE "ServiceRequest"
      SET "requestType" = LOWER("requestType")
      WHERE "requestType" IS NOT NULL
    `;
    console.log('   ✅ RequestType values normalized to lowercase');

    // Normalize priority values
    await prisma.$executeRaw`
      UPDATE "ServiceRequest"
      SET priority = LOWER(priority)
      WHERE priority IS NOT NULL
    `;
    console.log('   ✅ Priority values normalized to lowercase');

    // Step 4: Convert columns to enum types
    console.log('\n[4/5] Converting columns to enum types...');

    // Convert status column
    try {
      await prisma.$executeRaw`
        ALTER TABLE "ServiceRequest"
        ALTER COLUMN "status" DROP DEFAULT
      `;
      await prisma.$executeRaw`
        ALTER TABLE "ServiceRequest"
        ALTER COLUMN "status" TYPE "ServiceRequestStatus"
        USING status::text::"ServiceRequestStatus"
      `;
      await prisma.$executeRaw`
        ALTER TABLE "ServiceRequest"
        ALTER COLUMN "status" SET DEFAULT 'pending'::"ServiceRequestStatus"
      `;
      console.log('   ✅ Status column converted to enum');
    } catch (error) {
      console.log('   ⚠️  Status conversion:', error.message);
    }

    // Convert requestType column
    try {
      await prisma.$executeRaw`
        ALTER TABLE "ServiceRequest"
        ALTER COLUMN "requestType" TYPE "ServiceRequestType"
        USING "requestType"::text::"ServiceRequestType"
      `;
      console.log('   ✅ RequestType column converted to enum');
    } catch (error) {
      console.log('   ⚠️  RequestType conversion:', error.message);
    }

    // Convert priority column
    try {
      await prisma.$executeRaw`
        ALTER TABLE "ServiceRequest"
        ALTER COLUMN "priority" DROP DEFAULT
      `;
      await prisma.$executeRaw`
        ALTER TABLE "ServiceRequest"
        ALTER COLUMN "priority" TYPE "ServiceRequestPriority"
        USING priority::text::"ServiceRequestPriority"
      `;
      await prisma.$executeRaw`
        ALTER TABLE "ServiceRequest"
        ALTER COLUMN "priority" SET DEFAULT 'medium'::"ServiceRequestPriority"
      `;
      console.log('   ✅ Priority column converted to enum');
    } catch (error) {
      console.log('   ⚠️  Priority conversion:', error.message);
    }

    // Step 5: Verify final state
    console.log('\n[5/5] Verifying final state...');

    const finalCheck = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'ServiceRequest'
        AND column_name IN ('status', 'requestType', 'priority')
    `;
    console.log('   Final column state:', finalCheck);

    console.log('\n========================================');
    console.log('✅ DATABASE FIX COMPLETE!');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Restart backend server');
    console.log('3. Test service request creation/completion');

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
