const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWatchAssignment() {
  console.log('\n🔧 Fixing watch assignment...\n');

  // Update watch to be assigned to Sophie Laurent
  const watch = await prisma.device.update({
    where: { deviceId: 'WEAR-OS-001' },
    data: {
      crewMemberId: 'crew-001'  // Sophie Laurent
    },
    include: {
      crewMember: true
    }
  });

  console.log('✅ Watch updated:');
  console.log(`   Device: ${watch.deviceId}`);
  console.log(`   Assigned to: ${watch.crewMember?.name || 'N/A'}`);
  console.log('');

  // Check if Sophie has a user account
  const sophie = await prisma.crewMember.findUnique({
    where: { id: 'crew-001' },
    include: { user: true }
  });

  console.log('👤 Sophie Laurent:');
  console.log(`   User account: ${sophie?.user ? sophie.user.username : '❌ NO USER ACCOUNT'}`);
  console.log('');

  if (!sophie?.user) {
    console.log('⚠️  WARNING: Sophie has no user account!');
    console.log('   Watch authentication will fail without a user account.');
    console.log('   Consider creating a user account for Sophie in admin panel.');
  }

  await prisma.$disconnect();
}

fixWatchAssignment();
