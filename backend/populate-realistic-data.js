const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateData() {
  console.log('🌱 Populating database with realistic data...\n');

  try {
    // Clear only guests, crew, devices, service requests, assignments
    console.log('🗑️  Clearing old data (keeping locations with button IDs)...');
    await prisma.activityLog.deleteMany();
    await prisma.serviceRequest.deleteMany();
    await prisma.deviceAssignment.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.guest.deleteMany();
    await prisma.device.deleteMany();
    await prisma.crewMember.deleteMany();
    console.log('✅ Cleared old data\n');

    // Create 6 Crew Members (with uniform photos)
    console.log('👥 Creating 6 crew members...');
    const crew = await Promise.all([
      prisma.crewMember.create({
        data: {
          id: 'crew-001',
          name: 'Sophie Laurent',
          position: 'Chief Stewardess',
          department: 'INTERIOR',
          status: 'on-duty',
          contact: '+33 6 12 34 56 78',
          email: 'sophie.laurent@yacht.com',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop'
        }
      }),
      prisma.crewMember.create({
        data: {
          id: 'crew-002',
          name: 'Maria Rodriguez',
          position: 'Stewardess',
          department: 'INTERIOR',
          status: 'on-duty',
          contact: '+34 612 345 678',
          email: 'maria.rodriguez@yacht.com',
          avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop'
        }
      }),
      prisma.crewMember.create({
        data: {
          id: 'crew-003',
          name: 'James Mitchell',
          position: 'Steward',
          department: 'INTERIOR',
          status: 'on-duty',
          contact: '+44 7700 900123',
          email: 'james.mitchell@yacht.com',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
        }
      }),
      prisma.crewMember.create({
        data: {
          id: 'crew-004',
          name: 'Yuki Tanaka',
          position: 'Stewardess',
          department: 'INTERIOR',
          status: 'off-duty',
          contact: '+81 90 1234 5678',
          email: 'yuki.tanaka@yacht.com',
          avatar: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop'
        }
      }),
      prisma.crewMember.create({
        data: {
          id: 'crew-005',
          name: 'Luca Moretti',
          position: 'Steward',
          department: 'INTERIOR',
          status: 'off-duty',
          contact: '+39 320 123 4567',
          email: 'luca.moretti@yacht.com',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
        }
      }),
      prisma.crewMember.create({
        data: {
          id: 'crew-006',
          name: 'Emma Johansson',
          position: 'Stewardess',
          department: 'INTERIOR',
          status: 'off-duty',
          contact: '+46 70 123 4567',
          email: 'emma.johansson@yacht.com',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop'
        }
      })
    ]);
    console.log(`✅ Created ${crew.length} crew members\n`);

    // Create 10 Guests (4 expected, 6 onboard)
    console.log('🎩 Creating 10 guests...');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);

    const guests = await Promise.all([
      // 6 Onboard guests
      prisma.guest.create({
        data: {
          id: 'guest-001',
          firstName: 'Alexander',
          lastName: 'Volkov',
          type: 'owner',
          status: 'onboard',
          nationality: 'Russia',
          languages: ['English', 'Russian', 'French'],
          locationId: 'owner-1',
          cabin: 'Owner\'s Stateroom',
          checkInDate: new Date(today.setDate(today.getDate() - 3)),
          checkInTime: '14:00',
          checkOutDate: nextWeek,
          checkOutTime: '11:00',
          doNotDisturb: true,
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
          allergies: ['Shellfish'],
          favoriteDrinks: ['Champagne', 'Espresso'],
          specialRequests: 'Late checkout preferred. Extra pillows.',
          createdBy: 'Sophie Laurent'
        }
      }),
      prisma.guest.create({
        data: {
          id: 'guest-002',
          firstName: 'Isabella',
          lastName: 'Rossi',
          type: 'partner',
          status: 'onboard',
          nationality: 'Italy',
          languages: ['English', 'Italian', 'Spanish'],
          locationId: 'owner-2',
          cabin: 'VIP Cabin',
          checkInDate: new Date(today.setDate(today.getDate() - 3)),
          checkInTime: '14:00',
          checkOutDate: nextWeek,
          checkOutTime: '11:00',
          doNotDisturb: true,
          photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          dietaryRestrictions: ['Vegetarian', 'Gluten-free'],
          favoriteFoods: ['Mediterranean cuisine'],
          createdBy: 'Sophie Laurent'
        }
      }),
      prisma.guest.create({
        data: {
          id: 'guest-003',
          firstName: 'Mohammed',
          lastName: 'Al-Mansour',
          type: 'vip',
          status: 'onboard',
          nationality: 'UAE',
          languages: ['Arabic', 'English'],
          locationId: 'lower-1',
          cabin: 'Cabin 6',
          checkInDate: new Date(today.setDate(today.getDate() - 2)),
          checkInTime: '15:00',
          checkOutDate: new Date(nextWeek.setDate(nextWeek.getDate() + 3)),
          checkOutTime: '12:00',
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
          specialRequests: 'Halal meals required',
          createdBy: 'Sophie Laurent'
        }
      }),
      prisma.guest.create({
        data: {
          id: 'guest-004',
          firstName: 'Olivia',
          lastName: 'Chen',
          type: 'vip',
          status: 'onboard',
          nationality: 'Singapore',
          languages: ['English', 'Mandarin', 'Cantonese'],
          locationId: 'owner-3',
          cabin: 'VIP Office',
          checkInDate: tomorrow,
          checkInTime: '13:00',
          checkOutDate: new Date(twoWeeks),
          checkOutTime: '10:00',
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
          allergies: ['Dairy'],
          favoriteFoods: ['Asian fusion', 'Sushi'],
          createdBy: 'Maria Rodriguez'
        }
      }),
      prisma.guest.create({
        data: {
          id: 'guest-005',
          firstName: 'Sebastian',
          lastName: 'Müller',
          type: 'guest',
          status: 'onboard',
          nationality: 'Germany',
          languages: ['German', 'English'],
          locationId: 'main-1',
          cabin: 'Conference Room',
          checkInDate: today,
          checkInTime: '16:00',
          checkOutDate: new Date(nextWeek.setDate(nextWeek.getDate() - 2)),
          checkOutTime: '11:00',
          photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
          favoriteDrinks: ['German beer', 'Wine'],
          createdBy: 'Maria Rodriguez'
        }
      }),
      prisma.guest.create({
        data: {
          id: 'guest-006',
          firstName: 'Priya',
          lastName: 'Sharma',
          type: 'guest',
          status: 'onboard',
          nationality: 'India',
          languages: ['English', 'Hindi'],
          locationId: 'owner-4',
          cabin: 'Dining Room',
          checkInDate: today,
          checkInTime: '14:30',
          checkOutDate: nextWeek,
          checkOutTime: '11:00',
          photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop',
          dietaryRestrictions: ['Vegetarian'],
          allergies: ['Nuts'],
          favoriteFoods: ['Indian cuisine'],
          createdBy: 'James Mitchell'
        }
      }),

      // 4 Expected guests
      prisma.guest.create({
        data: {
          id: 'guest-007',
          firstName: 'Lucas',
          lastName: 'da Silva',
          type: 'guest',
          status: 'expected',
          nationality: 'Brazil',
          languages: ['Portuguese', 'English', 'Spanish'],
          checkInDate: tomorrow,
          checkInTime: '15:00',
          checkOutDate: new Date(twoWeeks),
          checkOutTime: '11:00',
          photo: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop',
          favoriteDrinks: ['Caipirinha', 'Coffee'],
          createdBy: 'Sophie Laurent'
        }
      }),
      prisma.guest.create({
        data: {
          id: 'guest-008',
          firstName: 'Amélie',
          lastName: 'Dubois',
          type: 'guest',
          status: 'expected',
          nationality: 'France',
          languages: ['French', 'English'],
          checkInDate: new Date(tomorrow.setDate(tomorrow.getDate() + 1)),
          checkInTime: '14:00',
          checkOutDate: new Date(twoWeeks.setDate(twoWeeks.getDate() + 5)),
          checkOutTime: '10:00',
          photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop',
          dietaryRestrictions: ['Lactose intolerant'],
          favoriteFoods: ['French cuisine', 'Wine'],
          createdBy: 'Sophie Laurent'
        }
      }),
      prisma.guest.create({
        data: {
          id: 'guest-009',
          firstName: 'Hiroshi',
          lastName: 'Nakamura',
          type: 'vip',
          status: 'expected',
          nationality: 'Japan',
          languages: ['Japanese', 'English'],
          checkInDate: new Date(tomorrow.setDate(tomorrow.getDate() + 2)),
          checkInTime: '13:00',
          checkOutDate: new Date(twoWeeks.setDate(twoWeeks.getDate() + 10)),
          checkOutTime: '11:00',
          photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop',
          allergies: ['Gluten'],
          favoriteFoods: ['Japanese cuisine', 'Sushi'],
          createdBy: 'Maria Rodriguez'
        }
      }),
      prisma.guest.create({
        data: {
          id: 'guest-010',
          firstName: 'Elena',
          lastName: 'Kovač',
          type: 'guest',
          status: 'expected',
          nationality: 'Croatia',
          languages: ['Croatian', 'English', 'Italian'],
          checkInDate: new Date(tomorrow.setDate(tomorrow.getDate() + 3)),
          checkInTime: '16:00',
          checkOutDate: new Date(twoWeeks.setDate(twoWeeks.getDate() + 7)),
          checkOutTime: '12:00',
          photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
          favoriteDrinks: ['Croatian wine', 'Prosecco'],
          createdBy: 'Maria Rodriguez'
        }
      })
    ]);
    console.log(`✅ Created ${guests.length} guests (6 onboard, 4 expected)\n`);

    // Create 1 Wear OS Watch device
    console.log('⌚ Creating Wear OS watch device...');
    const watch = await prisma.device.create({
      data: {
        deviceId: 'WEAR-OS-001',
        name: 'TicWatch Pro 3 - Crew',
        type: 'watch',
        subType: 'wear_os',
        status: 'online',
        batteryLevel: 78,
        signalStrength: -45,
        config: {
          model: 'TicWatch Pro 3',
          os: 'Wear OS 3.5',
          notifications: true,
          vibration: true,
          assignedTo: 'Sophie Laurent'
        },
        firmwareVersion: 'WearOS-3.5.0',
        hardwareVersion: 'TicWatch-Pro-3',
        lastSeen: new Date()
      }
    });
    console.log(`✅ Created watch device: ${watch.name}\n`);

    // Create duty roster for today
    console.log('📋 Creating today\'s duty roster...');
    const today_date = new Date().toISOString().split('T')[0];
    const assignments = await Promise.all([
      prisma.assignment.create({
        data: {
          date: today_date,
          type: 'PRIMARY',
          shiftId: 'morning',
          crewMemberId: 'crew-001'
        }
      }),
      prisma.assignment.create({
        data: {
          date: today_date,
          type: 'PRIMARY',
          shiftId: 'afternoon',
          crewMemberId: 'crew-002'
        }
      }),
      prisma.assignment.create({
        data: {
          date: today_date,
          type: 'PRIMARY',
          shiftId: 'night',
          crewMemberId: 'crew-003'
        }
      }),
      prisma.assignment.create({
        data: {
          date: today_date,
          type: 'BACKUP',
          shiftId: 'morning',
          crewMemberId: 'crew-004'
        }
      })
    ]);
    console.log(`✅ Created ${assignments.length} duty assignments\n`);

    console.log('🎉 Database populated successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${crew.length} Crew Members`);
    console.log(`   • ${guests.length} Guests (6 onboard, 4 expected)`);
    console.log(`   • 1 Wear OS Watch`);
    console.log(`   • ${assignments.length} Duty Assignments`);
    console.log(`   • 9 Locations (unchanged - with button IDs BTN-001 to BTN-009)`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateData();
