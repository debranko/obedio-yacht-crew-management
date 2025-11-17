require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteSarahAssignments() {
  try {
    console.log('🗑️  Deleting assignments for Sarah Johnson...');

    const result = await prisma.assignment.deleteMany({
      where: {
        crewMemberId: 'cmham7nis000jiuy6d9meitkv'
      }
    });

    console.log(`✅ Deleted ${result.count} assignments for Sarah Johnson`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteSarahAssignments();
