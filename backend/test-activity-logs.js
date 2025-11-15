/**
 * Test script to verify Activity Logs are working
 * This simulates a button press and checks if activity logs are created
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testActivityLogs() {
  console.log('\n========================================');
  console.log('   TESTING ACTIVITY LOGS');
  console.log('========================================\n');

  try {
    // 1. Check existing activity logs
    console.log('📊 Checking existing activity logs...');
    const existingLogs = await prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        location: true,
        guest: true,
        device: true
      }
    });

    console.log(`\n✅ Found ${existingLogs.length} recent activity logs:\n`);
    existingLogs.forEach(log => {
      console.log(`  - [${log.type}] ${log.action}`);
      console.log(`    Details: ${log.details}`);
      console.log(`    Time: ${log.timestamp || log.createdAt}`);
      console.log('');
    });

    // 2. Create a test activity log
    console.log('\n🧪 Creating test activity log...');
    const testLog = await prisma.activityLog.create({
      data: {
        type: 'system',
        action: 'Test Activity Log',
        details: 'Testing activity log system - this log was created by test script',
        metadata: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          source: 'test-activity-logs.js'
        })
      }
    });

    console.log('✅ Test activity log created:');
    console.log(`   ID: ${testLog.id}`);
    console.log(`   Type: ${testLog.type}`);
    console.log(`   Action: ${testLog.action}`);

    // 3. Count logs by type
    console.log('\n📈 Activity logs by type:');
    const logsByType = await prisma.activityLog.groupBy({
      by: ['type'],
      _count: true
    });

    logsByType.forEach(group => {
      console.log(`  - ${group.type}: ${group._count} logs`);
    });

    // 4. Recent service request logs
    console.log('\n🔔 Recent service request activity:');
    const serviceRequestLogs = await prisma.activityLog.findMany({
      where: { type: 'service_request' },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        guest: true,
        location: true,
        user: true
      }
    });

    if (serviceRequestLogs.length === 0) {
      console.log('  ⚠️  No service request logs found yet');
      console.log('  💡 Try pressing a button to create activity logs!');
    } else {
      serviceRequestLogs.forEach(log => {
        console.log(`  - ${log.action}`);
        console.log(`    ${log.details}`);
        console.log(`    Time: ${log.createdAt}`);
        console.log('');
      });
    }

    // 5. Total count
    const totalLogs = await prisma.activityLog.count();
    console.log(`\n✅ Total activity logs in database: ${totalLogs}`);

    console.log('\n========================================');
    console.log('   TEST COMPLETE!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error testing activity logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testActivityLogs();
