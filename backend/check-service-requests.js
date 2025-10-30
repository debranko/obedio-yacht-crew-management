const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkServiceRequests() {
  console.log('\n📊 CHECKING SERVICE REQUESTS STATUS\n');

  try {
    const allRequests = await prisma.serviceRequest.findMany({
      include: {
        guest: true,
        location: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Total service requests: ${allRequests.length}\n`);

    const groupedByStatus = {
      pending: [],
      accepted: [],
      completed: [],
      cancelled: []
    };

    allRequests.forEach(req => {
      if (groupedByStatus[req.status]) {
        groupedByStatus[req.status].push(req);
      }
    });

    console.log('📋 BY STATUS:');
    console.log(`  ✅ Accepted (can be completed): ${groupedByStatus.accepted.length}`);
    console.log(`  ⏳ Pending: ${groupedByStatus.pending.length}`);
    console.log(`  ✔️  Completed: ${groupedByStatus.completed.length}`);
    console.log(`  ❌ Cancelled: ${groupedByStatus.cancelled.length}`);

    if (groupedByStatus.accepted.length > 0) {
      console.log('\n🎯 ACCEPTED REQUESTS (Ready to be finished):');
      groupedByStatus.accepted.forEach((req, index) => {
        console.log(`\n  ${index + 1}. ID: ${req.id}`);
        console.log(`     Guest: ${req.guestName || 'Unknown'}`);
        console.log(`     Cabin: ${req.guestCabin || 'Unknown'}`);
        console.log(`     Assigned To: ${req.assignedTo || 'Not assigned'}`);
        console.log(`     Accepted At: ${req.acceptedAt ? new Date(req.acceptedAt).toLocaleString() : 'Not set'}`);
        console.log(`     Created At: ${new Date(req.createdAt).toLocaleString()}`);
      });
    } else {
      console.log('\n⚠️  NO ACCEPTED REQUESTS FOUND');
      console.log('   You need to accept a pending request first to test the Finish button.\n');

      if (groupedByStatus.pending.length > 0) {
        console.log('📝 PENDING REQUESTS (Accept one of these first):');
        groupedByStatus.pending.slice(0, 3).forEach((req, index) => {
          console.log(`\n  ${index + 1}. ID: ${req.id}`);
          console.log(`     Guest: ${req.guestName || 'Unknown'}`);
          console.log(`     Cabin: ${req.guestCabin || 'Unknown'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkServiceRequests();
