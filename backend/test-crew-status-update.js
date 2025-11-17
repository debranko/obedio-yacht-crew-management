const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCrewStatusUpdate() {
  try {
    console.log('🧪 Testing Crew Status Update...\n');

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
    console.log(`   Current Status: ${crew.status}\n`);

    // Test 1: Update to on-duty
    console.log('📝 Test 1: Updating status to "on-duty"...');
    const updated = await prisma.crewMember.update({
      where: { id: crew.id },
      data: { status: 'on-duty' }
    });

    console.log(`   ✅ Update completed`);
    console.log(`   New Status: ${updated.status}`);

    // Test 2: Fetch again to verify persistence
    console.log('\n🔍 Test 2: Fetching from database to verify...');
    const fetched = await prisma.crewMember.findUnique({
      where: { id: crew.id }
    });

    console.log(`   Status in DB: ${fetched?.status}`);

    if (fetched?.status === 'on-duty') {
      console.log('   ✅ SUCCESS: Status persisted correctly!\n');
    } else {
      console.log('   ❌ FAILED: Status did NOT persist!\n');
    }

    // Test 3: Restore original status
    console.log('🔄 Test 3: Restoring original status...');
    await prisma.crewMember.update({
      where: { id: crew.id },
      data: { status: crew.status }
    });
    console.log(`   ✅ Restored to: ${crew.status}\n`);

    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testCrewStatusUpdate();
