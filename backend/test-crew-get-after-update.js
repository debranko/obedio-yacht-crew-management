const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCrewGetAfterUpdate() {
  try {
    console.log('🧪 Testing GET after UPDATE...\n');

    // Get first interior crew member
    const crew = await prisma.crewMember.findFirst({
      where: { department: 'Interior' }
    });

    if (!crew) {
      console.log('❌ No interior crew found');
      return;
    }

    console.log('👤 Testing with crew member:');
    console.log(`   Name: ${crew.name}`);
    console.log(`   ID: ${crew.id}`);
    console.log(`   Original Status: ${crew.status}\n`);

    // Step 1: Update to on-duty
    console.log('📝 Step 1: Updating status to "on-duty"...');
    await prisma.crewMember.update({
      where: { id: crew.id },
      data: { status: 'on-duty' }
    });
    console.log('   ✅ Updated\n');

    // Step 2: GET without include (like direct query)
    console.log('📥 Step 2: GET without include...');
    const withoutInclude = await prisma.crewMember.findUnique({
      where: { id: crew.id }
    });
    console.log('   Status:', withoutInclude?.status);
    console.log('   Has user field:', 'user' in (withoutInclude || {}));
    console.log('   Keys:', Object.keys(withoutInclude || {}).join(', '));

    // Step 3: GET with include (like API endpoint does)
    console.log('\n📥 Step 3: GET with include: { user: true }...');
    const withInclude = await prisma.crewMember.findUnique({
      where: { id: crew.id },
      include: { user: true }
    });
    console.log('   Status:', withInclude?.status);
    console.log('   Has user field:', 'user' in (withInclude || {}));
    console.log('   User value:', withInclude?.user);
    console.log('   Keys:', Object.keys(withInclude || {}).join(', '));

    // Step 4: GET ALL with include (like API GET /api/crew)
    console.log('\n📥 Step 4: GET ALL with include (API simulation)...');
    const allCrew = await prisma.crewMember.findMany({
      orderBy: { name: 'asc' },
      include: { user: true }
    });

    const ourCrew = allCrew.find(c => c.id === crew.id);
    console.log('   Found in list:', !!ourCrew);
    console.log('   Status in list:', ourCrew?.status);
    console.log('   Has user field:', 'user' in (ourCrew || {}));

    // Step 5: Check if status is still on-duty
    if (withInclude?.status === 'on-duty' && ourCrew?.status === 'on-duty') {
      console.log('\n✅ SUCCESS: Status "on-duty" is returned correctly by all GET methods!\n');
    } else {
      console.log('\n❌ PROBLEM: Status is not "on-duty" in GET response!\n');
    }

    // Restore original status
    console.log('🔄 Restoring original status...');
    await prisma.crewMember.update({
      where: { id: crew.id },
      data: { status: crew.status }
    });
    console.log(`   ✅ Restored to: ${crew.status}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testCrewGetAfterUpdate();
