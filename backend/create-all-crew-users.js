const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAllCrewUsers() {
  console.log('\n👥 Creating user accounts for all crew members...\n');

  try {
    // Get all crew members
    const crew = await prisma.crewMember.findMany({
      include: { user: true }
    });

    console.log(`Found ${crew.length} crew members\n`);

    // Define user data for each crew member
    const crewUserData = [
      {
        crewId: 'crew-001',
        username: 'sophie.laurent',
        email: 'sophie.laurent@yacht.com',
        password: 'sophie123',
        role: 'chief_stewardess',
        firstName: 'Sophie',
        lastName: 'Laurent'
      },
      {
        crewId: 'crew-002',
        username: 'maria.rodriguez',
        email: 'maria.rodriguez@yacht.com',
        password: 'maria123',
        role: 'stewardess',
        firstName: 'Maria',
        lastName: 'Rodriguez'
      },
      {
        crewId: 'crew-003',
        username: 'james.mitchell',
        email: 'james.mitchell@yacht.com',
        password: 'james123',
        role: 'steward',
        firstName: 'James',
        lastName: 'Mitchell'
      },
      {
        crewId: 'crew-004',
        username: 'yuki.tanaka',
        email: 'yuki.tanaka@yacht.com',
        password: 'yuki123',
        role: 'stewardess',
        firstName: 'Yuki',
        lastName: 'Tanaka'
      },
      {
        crewId: 'crew-005',
        username: 'luca.moretti',
        email: 'luca.moretti@yacht.com',
        password: 'luca123',
        role: 'steward',
        firstName: 'Luca',
        lastName: 'Moretti'
      },
      {
        crewId: 'crew-006',
        username: 'emma.johansson',
        email: 'emma.johansson@yacht.com',
        password: 'emma123',
        role: 'stewardess',
        firstName: 'Emma',
        lastName: 'Johansson'
      }
    ];

    let created = 0;
    let skipped = 0;

    for (const userData of crewUserData) {
      // Check if crew member already has user account
      const crewMember = crew.find(c => c.id === userData.crewId);

      if (!crewMember) {
        console.log(`⚠️  Crew member ${userData.crewId} not found, skipping...`);
        skipped++;
        continue;
      }

      if (crewMember.user) {
        console.log(`✓ ${crewMember.name} already has user account (${crewMember.user.username})`);
        skipped++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          crewMember: {
            connect: { id: userData.crewId }
          }
        }
      });

      console.log(`✅ Created user for ${crewMember.name}:`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log('');

      created++;
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created} user accounts`);
    console.log(`   ⏭️  Skipped: ${skipped} (already have accounts)\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAllCrewUsers();
