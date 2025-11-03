const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssignments() {
  try {
    console.log('🔍 Checking assignments in database...\n');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today: ${today}\n`);

    // Get all assignments
    const allAssignments = await prisma.assignment.findMany({
      include: {
        shift: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    console.log(`📊 Total assignments in database: ${allAssignments.length}\n`);

    if (allAssignments.length === 0) {
      console.log('❌ NO ASSIGNMENTS FOUND IN DATABASE!');
      console.log('   This is why "Next on duty" is empty.\n');
      console.log('💡 Solution: Go to Duty Roster tab and:');
      console.log('   1. Use Auto-Fill to populate shifts');
      console.log('   2. Click "Save Changes"');
      console.log('   3. Refresh the page\n');
      return;
    }

    // Today's assignments
    const todayAssignments = allAssignments.filter(a => a.date === today);
    console.log(`📅 Today's assignments: ${todayAssignments.length}`);
    if (todayAssignments.length > 0) {
      console.table(todayAssignments.map(a => ({
        date: a.date,
        shift: a.shift?.name || a.shiftId,
        crewMemberId: a.crewMemberId.substring(0, 8) + '...',
        type: a.type
      })));
    }

    // Future assignments (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const futureAssignments = allAssignments.filter(a => a.date > today && a.date <= nextWeekStr);
    console.log(`\n📆 Next 7 days assignments: ${futureAssignments.length}`);
    if (futureAssignments.length > 0) {
      console.table(futureAssignments.map(a => ({
        date: a.date,
        shift: a.shift?.name || a.shiftId,
        crewMemberId: a.crewMemberId.substring(0, 8) + '...',
        type: a.type
      })));
    }

    // Group by date
    const byDate = {};
    allAssignments.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = 0;
      byDate[a.date]++;
    });

    console.log('\n📊 Assignments by date:');
    Object.entries(byDate).forEach(([date, count]) => {
      console.log(`   ${date}: ${count} assignment(s)`);
    });

    // Check for shifts
    console.log('\n⏰ Checking shifts...');
    const shifts = await prisma.shift.findMany({
      orderBy: {
        order: 'asc'
      }
    });

    console.log(`   Total shifts configured: ${shifts.length}`);
    if (shifts.length > 0) {
      console.table(shifts.map(s => ({
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        primary: s.primaryCount,
        backup: s.backupCount
      })));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssignments();
