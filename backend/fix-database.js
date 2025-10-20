const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDatabase() {
  try {
    console.log('🔧 Fixing database schema...');
    
    // Add isActive column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
    `);
    
    console.log('✅ Added isActive column to User table');
    
    // Add updatedAt columns with default NOW() to all tables
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
    `);
    console.log('✅ Added updatedAt to User table');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CrewMember" 
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
    `);
    console.log('✅ Added updatedAt to CrewMember table');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Guest" 
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
    `);
    console.log('✅ Added updatedAt to Guest table');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Location" 
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
    `);
    console.log('✅ Added updatedAt to Location table');
    
    // Add lastLogin column to User table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3);
    `);
    console.log('✅ Added lastLogin to User table');
    
    // Add createdAt column to User table if missing
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
    `);
    console.log('✅ Added createdAt to User table');
    
    console.log('\n🎉 Database schema fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  }
}

fixDatabase();
