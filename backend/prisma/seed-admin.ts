/**
 * Seed Admin User
 * Creates a simple admin user for easy login
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin user...');

  // Hash the simple password
  const hashedPassword = await bcrypt.hash('password', 10);

  // Create or update admin user
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
  console.log('   Password: password');
  console.log('   Email: admin@obedio.com');
  console.log('   Role: admin');
  console.log(`   User ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
