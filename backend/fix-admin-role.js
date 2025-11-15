const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminRole() {
  try {
    // Update admin user role to 'admin'
    const result = await prisma.user.update({
      where: { username: 'admin' },
      data: { role: 'admin' }
    });

    console.log('✅ Admin user role updated:');
    console.log('  Username:', result.username);
    console.log('  Role:', result.role);
    console.log('  Email:', result.email);
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRole();
