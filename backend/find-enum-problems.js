const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findEnumProblems() {
  console.log('=== SEARCHING FOR ENUM PROBLEMS ===\n');

  try {
    // Check all enum types in database
    const enums = await prisma.$queryRaw`
      SELECT
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typtype = 'e'
      ORDER BY t.typname, e.enumsortorder
    `;

    console.log('📊 Database Enums:');
    const enumGroups = {};
    for (const row of enums) {
      if (!enumGroups[row.enum_name]) {
        enumGroups[row.enum_name] = [];
      }
      enumGroups[row.enum_name].push(row.enum_value);
    }

    for (const [name, values] of Object.entries(enumGroups)) {
      console.log(`\n${name}:`);
      values.forEach(v => console.log(`  - ${v}`));
    }

    // Check for invalid enum values in data
    console.log('\n\n🔍 Checking for invalid data...\n');

    // Check ServiceRequest statuses
    const invalidSR = await prisma.$queryRaw`
      SELECT id, status FROM "ServiceRequest"
      WHERE status NOT IN ('pending', 'accepted', 'completed', 'cancelled')
      LIMIT 5
    `;
    if (invalidSR.length > 0) {
      console.log('❌ Invalid ServiceRequest statuses:', invalidSR);
    } else {
      console.log('✅ All ServiceRequest statuses are valid');
    }

    // Check Guest statuses
    const invalidGuests = await prisma.$queryRaw`
      SELECT id, status FROM "Guest"
      WHERE status NOT IN ('expected', 'onboard', 'ashore', 'departed')
      LIMIT 5
    `;
    if (invalidGuests.length > 0) {
      console.log('❌ Invalid Guest statuses:', invalidGuests);
    } else {
      console.log('✅ All Guest statuses are valid');
    }

    // Check CrewMember statuses
    const invalidCrew = await prisma.$queryRaw`
      SELECT id, status FROM "CrewMember"
      WHERE status NOT IN ('active', 'on-duty', 'off-duty', 'on-leave')
      LIMIT 5
    `;
    if (invalidCrew.length > 0) {
      console.log('❌ Invalid CrewMember statuses:', invalidCrew);
    } else {
      console.log('✅ All CrewMember statuses are valid');
    }

    // Check User roles
    const invalidUsers = await prisma.$queryRaw`
      SELECT id, role FROM "User"
      WHERE role NOT IN ('admin', 'chief-stewardess', 'stewardess', 'crew', 'eto')
      LIMIT 5
    `;
    if (invalidUsers.length > 0) {
      console.log('❌ Invalid User roles:', invalidUsers);
    } else {
      console.log('✅ All User roles are valid');
    }

    console.log('\n✅ Enum problem scan complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findEnumProblems();
