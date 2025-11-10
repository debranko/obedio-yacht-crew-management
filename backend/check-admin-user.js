const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdminUser() {
  console.log('\n🔍 Checking admin user...\n');

  try {
    // Find admin user
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { role: 'admin' }
        ]
      }
    });

    if (!admin) {
      console.log('❌ Admin user NOT FOUND in database!\n');
      console.log('Creating admin user...\n');

      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);

      const newAdmin = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@obedio.yacht',
          password: hashedPassword,
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User'
        }
      });

      console.log('✅ Admin user created:');
      console.log(`   Username: ${newAdmin.username}`);
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Role: ${newAdmin.role}`);
      console.log(`   Password: admin123\n`);
    } else {
      console.log('✅ Admin user found:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}\n`);

      // Test password
      const isValidPassword = await bcrypt.compare('admin123', admin.password);

      if (isValidPassword) {
        console.log('✅ Password "admin123" is CORRECT\n');
      } else {
        console.log('❌ Password "admin123" is WRONG!\n');
        console.log('Updating password to "admin123"...\n');

        const hashedPassword = await bcrypt.hash('admin123', 12);
        await prisma.user.update({
          where: { id: admin.id },
          data: { password: hashedPassword }
        });

        console.log('✅ Password updated to "admin123"\n');
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAdminUser();
