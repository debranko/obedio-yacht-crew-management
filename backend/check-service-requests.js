const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkServiceRequests() {
  try {
    console.log('\n=== ALL SERVICE REQUESTS ===');
    const requests = await prisma.serviceRequest.findMany({
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Total:', requests.length);
    requests.forEach(req => {
      console.log({
        id: req.id,
        status: req.status,
        priority: req.priority,
        createdAt: req.createdAt,
        createdAtType: typeof req.createdAt,
        isValid: req.createdAt instanceof Date && !isNaN(req.createdAt.getTime())
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServiceRequests();
