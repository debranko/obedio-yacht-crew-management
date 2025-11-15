/**
 * Clear all pending service requests from database
 * Run this before presentation/demo to start with clean slate
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearPendingRequests() {
  try {
    console.log('🧹 Clearing all pending service requests...');

    // Update all pending requests to 'cancelled' status
    const result = await prisma.serviceRequest.updateMany({
      where: {
        status: 'pending'
      },
      data: {
        status: 'cancelled'
      }
    });

    console.log(`✅ Cleared ${result.count} pending requests`);
    console.log('✨ Database is ready for presentation!');

  } catch (error) {
    console.error('❌ Error clearing pending requests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearPendingRequests();
