const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearPendingRequests() {
  console.log('🧹 Clearing all pending and accepted service requests...');

  const deleted = await prisma.serviceRequest.deleteMany({
    where: {
      OR: [
        { status: 'pending' },
        { status: 'accepted' }
      ]
    }
  });

  console.log(`✅ Deleted ${deleted.count} service requests`);

  const remaining = await prisma.serviceRequest.findMany({
    select: {
      id: true,
      status: true,
      guestName: true,
      guestCabin: true
    }
  });

  console.log(`📊 Remaining requests: ${remaining.length}`);
  if (remaining.length > 0) {
    console.log(JSON.stringify(remaining, null, 2));
  }

  await prisma.$disconnect();
}

clearPendingRequests().catch(console.error);
