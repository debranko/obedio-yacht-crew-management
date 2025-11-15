/**
 * Production-ready seed script
 * Creates admin user and basic demo data
 * Runs with plain Node.js (no tsx required)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        password: hashedPassword,
        email: 'admin@obedio.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
      },
      create: {
        username: 'admin',
        email: 'admin@obedio.com',
        password: hashedPassword,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
      },
    });

    console.log('✅ Admin user created/updated:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@obedio.com');
    console.log('   Role: admin');
    console.log(`   User ID: ${admin.id}`);

    // Create demo crew member (optional - only if doesn't exist)
    console.log('👥 Creating demo crew member...');
    const demoCrewPassword = await bcrypt.hash('crew123', 10);

    const demoCrew = await prisma.user.upsert({
      where: { username: 'crew' },
      update: {},
      create: {
        username: 'crew',
        email: 'crew@obedio.com',
        password: demoCrewPassword,
        role: 'crew',
        firstName: 'Demo',
        lastName: 'Crew',
      },
    });

    console.log('✅ Demo crew member created:');
    console.log('   Username: crew');
    console.log('   Password: crew123');
    console.log(`   User ID: ${demoCrew.id}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin: admin / admin123');
    console.log('   Crew:  crew / crew123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
