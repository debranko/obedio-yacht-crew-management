const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDutyStatus() {
  try {
    console.log('🔍 Debugging Duty Status...\n');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinutes;

    console.log(`📅 Today: ${today}`);
    console.log(`⏰ Current Time: ${currentHour}:${String(currentMinutes).padStart(2, '0')} (${currentTime} minutes)\n`);

    // Get all shifts
    const shifts = await prisma.shift.findMany({
      orderBy: { order: 'asc' }
    });

    console.log(`⏰ All Shifts (${shifts.length}):`);
    shifts.forEach((shift, index) => {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      let endTime = endHour * 60 + endMin;

      if (endTime < startTime) {
        endTime += 24 * 60;
      }

      const isCurrent = currentTime >= startTime && currentTime < endTime;
      const isNext = startTime > currentTime;

      console.log(`  ${index + 1}. ${shift.name} (${shift.startTime} - ${shift.endTime})`);
      console.log(`     Start: ${startTime} min, End: ${endTime} min`);
      console.log(`     Current? ${isCurrent ? '✅ YES' : '❌ No'}`);
      console.log(`     Next? ${isNext ? '✅ YES' : '❌ No'}`);
    });

    // Find current shift
    const currentShift = shifts.find(shift => {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      let endTime = endHour * 60 + endMin;

      if (endTime < startTime) {
        endTime += 24 * 60;
      }

      return currentTime >= startTime && currentTime < endTime;
    });

    console.log(`\n🎯 CURRENT SHIFT: ${currentShift ? currentShift.name : 'NONE'}`);

    // Find next shift
    const nextShift = shifts.find(shift => {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      return startTime > currentTime;
    }) || shifts[0];

    console.log(`🎯 NEXT SHIFT: ${nextShift ? nextShift.name : 'NONE'}\n`);

    // Get today's assignments
    const todayAssignments = await prisma.assignment.findMany({
      where: { date: today },
      include: { shift: true }
    });

    console.log(`📋 Today's Assignments (${todayAssignments.length}):`);
    if (todayAssignments.length > 0) {
      todayAssignments.forEach(a => {
        console.log(`   - ${a.shift.name}: ${a.crewMemberId.substring(0, 8)}... (${a.type})`);
      });
    } else {
      console.log('   ❌ NO ASSIGNMENTS FOR TODAY!');
    }

    // Currently on Duty
    console.log('\n👥 CURRENTLY ON DUTY:');
    if (currentShift) {
      const currentPrimary = todayAssignments.filter(
        a => a.shiftId === currentShift.id && a.type === 'primary'
      );
      console.log(`   Primary crew for ${currentShift.name}: ${currentPrimary.length}`);
      currentPrimary.forEach(a => {
        console.log(`      - ${a.crewMemberId.substring(0, 8)}...`);
      });

      const currentBackup = todayAssignments.filter(
        a => a.shiftId === currentShift.id && a.type === 'backup'
      );
      console.log(`   Backup crew for ${currentShift.name}: ${currentBackup.length}`);
      currentBackup.forEach(a => {
        console.log(`      - ${a.crewMemberId.substring(0, 8)}...`);
      });
    } else {
      console.log('   ❌ No current shift found');
    }

    // Next on Duty
    console.log('\n👥 NEXT ON DUTY:');
    if (nextShift) {
      let nextPrimary = todayAssignments.filter(
        a => a.shiftId === nextShift.id && a.type === 'primary'
      );

      console.log(`   Looking for ${nextShift.name} assignments...`);
      console.log(`   Found TODAY: ${nextPrimary.length}`);

      if (nextPrimary.length === 0) {
        console.log('   ⚠️  No assignments today, checking TOMORROW...');

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const tomorrowAssignments = await prisma.assignment.findMany({
          where: { date: tomorrowStr },
          include: { shift: true }
        });

        console.log(`   Tomorrow (${tomorrowStr}): ${tomorrowAssignments.length} total assignments`);

        nextPrimary = tomorrowAssignments.filter(
          a => a.shiftId === nextShift.id && a.type === 'primary'
        );

        console.log(`   Found TOMORROW: ${nextPrimary.length}`);
      }

      if (nextPrimary.length > 0) {
        console.log(`   ✅ Primary crew for ${nextShift.name}:`);
        nextPrimary.forEach(a => {
          console.log(`      - ${a.crewMemberId.substring(0, 8)}...`);
        });
      } else {
        console.log('   ❌ NO PRIMARY CREW FOUND for next shift');
      }
    } else {
      console.log('   ❌ No next shift found');
    }

    // Get crew members
    const crewMembers = await prisma.crewMember.findMany({
      where: { department: 'Interior' }
    });

    console.log(`\n👤 Interior Crew Members: ${crewMembers.length}`);
    crewMembers.forEach(c => {
      console.log(`   - ${c.name} (${c.position}) - Status: ${c.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugDutyStatus();
