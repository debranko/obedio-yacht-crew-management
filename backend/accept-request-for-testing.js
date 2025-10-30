const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function acceptRequestForTesting() {
  console.log('\n🔧 ACCEPTING PENDING REQUEST FOR TESTING\n');

  try {
    // Get the first pending request
    const pendingRequest = await prisma.serviceRequest.findFirst({
      where: { status: 'pending' },
      include: {
        guest: true,
        location: true
      }
    });

    if (!pendingRequest) {
      console.log('⚠️  No pending requests found. Creating a test request...\n');

      // Get a guest and location for the test request
      const guest = await prisma.guest.findFirst();
      const location = await prisma.location.findFirst();

      if (!guest || !location) {
        console.log('❌ Need at least one guest and one location in the database');
        return;
      }

      // Create a test service request
      const newRequest = await prisma.serviceRequest.create({
        data: {
          guestId: guest.id,
          locationId: location.id,
          guestName: `${guest.firstName} ${guest.lastName}`,
          guestCabin: location.name,
          requestType: 'call',
          priority: 'normal',
          status: 'pending',
          notes: 'Test request for Finish button functionality'
        }
      });

      console.log('✅ Created test service request:');
      console.log(`   ID: ${newRequest.id}`);
      console.log(`   Guest: ${newRequest.guestName}`);
      console.log(`   Cabin: ${newRequest.guestCabin}\n`);

      pendingRequest = newRequest;
    } else {
      console.log('📋 Found pending request:');
      console.log(`   ID: ${pendingRequest.id}`);
      console.log(`   Guest: ${pendingRequest.guestName || 'Unknown'}`);
      console.log(`   Cabin: ${pendingRequest.guestCabin || 'Unknown'}\n`);
    }

    // Get a crew member to assign the request to
    const crewMember = await prisma.crewMember.findFirst();

    if (!crewMember) {
      console.log('❌ No crew members found in database');
      return;
    }

    // Accept the request
    const acceptedRequest = await prisma.serviceRequest.update({
      where: { id: pendingRequest.id },
      data: {
        status: 'accepted',
        assignedTo: crewMember.name,
        assignedToId: crewMember.id,
        acceptedAt: new Date(),
        guestName: pendingRequest.guestName || (pendingRequest.guest ? `${pendingRequest.guest.firstName} ${pendingRequest.guest.lastName}` : 'Test Guest'),
        guestCabin: pendingRequest.guestCabin || (pendingRequest.location ? pendingRequest.location.name : 'Test Cabin')
      }
    });

    console.log('✅ REQUEST ACCEPTED SUCCESSFULLY!\n');
    console.log('📊 Details:');
    console.log(`   ID: ${acceptedRequest.id}`);
    console.log(`   Status: ${acceptedRequest.status}`);
    console.log(`   Guest: ${acceptedRequest.guestName}`);
    console.log(`   Cabin: ${acceptedRequest.guestCabin}`);
    console.log(`   Assigned To: ${acceptedRequest.assignedTo}`);
    console.log(`   Accepted At: ${new Date(acceptedRequest.acceptedAt).toLocaleString()}`);
    console.log('\n🎯 Now you can test the Finish button in the application!');
    console.log('   Go to: http://localhost:5173');
    console.log('   Look for the "Serving Now" widget or Service Requests page');
    console.log('   Click the "Finish" button and check the console logs\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

acceptRequestForTesting();
