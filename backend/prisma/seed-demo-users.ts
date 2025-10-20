/**
 * Seed Demo Users
 * Creates test users with different roles for demonstration
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo users with different roles...\n');

  // Hash password (same for all demo users for easy testing)
  const hashedPassword = await bcrypt.hash('password', 10);

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
      email: 'admin@obedio.com',
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
    },
    create: {
      username: 'admin',
      email: 'admin@obedio.com',
      password: hashedPassword,
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
    },
  });

  console.log('✅ Admin User:');
  console.log('   Username: admin');
  console.log('   Password: password');
  console.log('   Role: Administrator (Full Access)');
  console.log(`   ID: ${admin.id}\n`);

  // 2. Chief Stewardess
  const chiefStewardess = await prisma.user.upsert({
    where: { username: 'chief' },
    update: {
      password: hashedPassword,
      email: 'chief@obedio.com',
      role: 'chief-stewardess',
      firstName: 'Sophie',
      lastName: 'Anderson',
    },
    create: {
      username: 'chief',
      email: 'chief@obedio.com',
      password: hashedPassword,
      role: 'chief-stewardess',
      firstName: 'Sophie',
      lastName: 'Anderson',
    },
  });

  console.log('✅ Chief Stewardess:');
  console.log('   Username: chief');
  console.log('   Password: password');
  console.log('   Role: Chief Stewardess (Interior Manager)');
  console.log(`   ID: ${chiefStewardess.id}\n`);

  // 3. Stewardess
  const stewardess = await prisma.user.upsert({
    where: { username: 'stewardess' },
    update: {
      password: hashedPassword,
      email: 'stewardess@obedio.com',
      role: 'stewardess',
      firstName: 'Emma',
      lastName: 'Johnson',
    },
    create: {
      username: 'stewardess',
      email: 'stewardess@obedio.com',
      password: hashedPassword,
      role: 'stewardess',
      firstName: 'Emma',
      lastName: 'Johnson',
    },
  });

  console.log('✅ Stewardess:');
  console.log('   Username: stewardess');
  console.log('   Password: password');
  console.log('   Role: Stewardess (Interior Staff)');
  console.log(`   ID: ${stewardess.id}\n`);

  // 4. Crew Member
  const crew = await prisma.user.upsert({
    where: { username: 'crew' },
    update: {
      password: hashedPassword,
      email: 'crew@obedio.com',
      role: 'crew',
      firstName: 'James',
      lastName: 'Wilson',
    },
    create: {
      username: 'crew',
      email: 'crew@obedio.com',
      password: hashedPassword,
      role: 'crew',
      firstName: 'James',
      lastName: 'Wilson',
    },
  });

  console.log('✅ Crew Member:');
  console.log('   Username: crew');
  console.log('   Password: password');
  console.log('   Role: Crew (General Crew Member)');
  console.log(`   ID: ${crew.id}\n`);

  // 5. ETO (Electrical/Technical Officer)
  const eto = await prisma.user.upsert({
    where: { username: 'eto' },
    update: {
      password: hashedPassword,
      email: 'eto@obedio.com',
      role: 'eto',
      firstName: 'Michael',
      lastName: 'Davis',
    },
    create: {
      username: 'eto',
      email: 'eto@obedio.com',
      password: hashedPassword,
      role: 'eto',
      firstName: 'Michael',
      lastName: 'Davis',
    },
  });

  console.log('✅ ETO (Technical Officer):');
  console.log('   Username: eto');
  console.log('   Password: password');
  console.log('   Role: ETO (Manages Technical Systems)');
  console.log(`   ID: ${eto.id}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Demo users created successfully!');
  console.log('\n📋 DEMO LOGIN CREDENTIALS:\n');
  console.log('All users have password: password\n');
  console.log('1. admin       - Full system access');
  console.log('2. chief       - Interior department manager');
  console.log('3. stewardess  - Interior staff');
  console.log('4. crew        - General crew member');
  console.log('5. eto         - Technical officer');
  console.log('\n🎬 Ready for demonstration!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding demo users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
