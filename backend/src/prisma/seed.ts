/**
 * Database Seed - Initialize with mock data from frontend
 * Migrates existing localStorage data structure to PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    await prisma.activityLog.deleteMany();
    await prisma.serviceRequest.deleteMany();
    await prisma.deviceAssignment.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.guest.deleteMany();
    await prisma.location.deleteMany();
    await prisma.device.deleteMany();
    await prisma.smartButton.deleteMany();
    await prisma.crewMember.deleteMany();
    await prisma.shiftConfig.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleared existing data');

    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@yacht.local',
        password: adminPassword,
        role: 'ADMIN',
        firstName: 'System',
        lastName: 'Administrator'
      }
    });

    console.log('✅ Created admin user (admin/admin123)');

    // Create shift configurations
    const shifts = await Promise.all([
      prisma.shiftConfig.create({
        data: {
          id: 'morning',
          name: 'Morning Shift',
          startTime: '07:00',
          endTime: '15:00',
          color: '#3b82f6'
        }
      }),
      prisma.shiftConfig.create({
        data: {
          id: 'afternoon',
          name: 'Afternoon Shift',
          startTime: '15:00',
          endTime: '23:00',
          color: '#f59e0b'
        }
      }),
      prisma.shiftConfig.create({
        data: {
          id: 'night',
          name: 'Night Shift',
          startTime: '23:00',
          endTime: '07:00',
          color: '#8b5cf6'
        }
      })
    ]);

    console.log('✅ Created shift configurations');

    // Create locations (from frontend mock data)
    const locations = await Promise.all([
      // Sun Deck
      prisma.location.create({
        data: {
          id: 'sun-1',
          name: 'Sun Deck Lounge',
          type: 'OUTDOOR',
          description: 'Open-air lounge area with sun beds and panoramic views',
          floor: 'Sun Deck',
          capacity: 12,
          status: 'ACTIVE',
          smartButtonId: 'BTN-SUN-1',
          image: 'https://images.unsplash.com/photo-1686845928517-8ffc9009a45d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
          doNotDisturb: false
        }
      }),
      // Bridge Deck
      prisma.location.create({
        data: {
          id: 'bridge-1',
          name: 'Gym',
          type: 'COMMON',
          description: 'Fitness center with state-of-the-art equipment',
          floor: 'Bridge Deck',
          capacity: 4,
          status: 'ACTIVE',
          smartButtonId: 'BTN-BRG-1',
          image: 'https://images.unsplash.com/photo-1719024483000-e72451273b5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
          doNotDisturb: false
        }
      }),
      // Owner's Deck
      prisma.location.create({
        data: {
          id: 'owner-1',
          name: 'Owner\'s Stateroom',
          type: 'CABIN',
          description: 'Luxurious master suite with private amenities',
          floor: 'Sun Deck Aft (Owner\'s Deck)',
          capacity: 2,
          status: 'ACTIVE',
          smartButtonId: 'BTN-OWNER-1',
          image: 'https://images.unsplash.com/photo-1753505889211-9cfbac527474?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
          doNotDisturb: true // DND active for owner
        }
      }),
      prisma.location.create({
        data: {
          id: 'owner-2',
          name: 'VIP Cabin',
          type: 'CABIN',
          description: 'Premium guest stateroom with ensuite',
          floor: 'Sun Deck Aft (Owner\'s Deck)',
          capacity: 2,
          status: 'ACTIVE',
          smartButtonId: 'BTN-OWNER-2',
          image: 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
          doNotDisturb: true // DND active for VIP
        }
      }),
      prisma.location.create({
        data: {
          id: 'owner-3',
          name: 'VIP Office',
          type: 'COMMON',
          description: 'Private office and study area',
          floor: 'Sun Deck Aft (Owner\'s Deck)',
          capacity: 2,
          status: 'ACTIVE',
          smartButtonId: 'BTN-OWNER-3',
          image: 'https://images.unsplash.com/photo-1697124510316-13efcb2e3abd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
        }
      }),
      prisma.location.create({
        data: {
          id: 'owner-4',
          name: 'Dining Room',
          type: 'COMMON',
          description: 'Formal dining area for elegant meals',
          floor: 'Sun Deck Aft (Owner\'s Deck)',
          capacity: 12,
          status: 'ACTIVE',
          smartButtonId: 'BTN-OWNER-4',
          image: 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
        }
      }),
      prisma.location.create({
        data: {
          id: 'owner-5',
          name: 'Main Salon',
          type: 'COMMON',
          description: 'Primary living and social space',
          floor: 'Sun Deck Aft (Owner\'s Deck)',
          capacity: 14,
          status: 'ACTIVE',
          smartButtonId: 'BTN-OWNER-6',
          image: 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
        }
      }),
      // Main Deck
      prisma.location.create({
        data: {
          id: 'main-1',
          name: 'Conference Room',
          type: 'COMMON',
          description: 'Professional meeting room with AV equipment',
          floor: 'Main Deck',
          capacity: 10,
          status: 'ACTIVE',
          smartButtonId: 'BTN-MAIN-1',
          image: 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
        }
      }),
      // Lower Deck
      prisma.location.create({
        data: {
          id: 'lower-1',
          name: 'Cabin 6',
          type: 'CABIN',
          description: 'Guest stateroom with comfortable accommodations',
          floor: 'Lower Deck',
          capacity: 2,
          status: 'ACTIVE',
          smartButtonId: 'BTN-LWR-1',
          image: 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
        }
      })
    ]);

    console.log('✅ Created locations');

    // Create crew members
    const crewMembers = await Promise.all([
      prisma.crewMember.create({
        data: {
          id: 'crew-1',
          name: 'Maria Lopez',
          position: 'Chief Stewardess',
          department: 'INTERIOR',
          status: 'ON_DUTY',
          contact: '+1 555 0101',
          email: 'maria.lopez@yacht.com'
        }
      }),
      prisma.crewMember.create({
        data: {
          id: 'crew-2',
          name: 'Sarah Johnson',
          position: 'Stewardess',
          department: 'INTERIOR',
          status: 'ON_DUTY',
          contact: '+1 555 0102',
          email: 'sarah.johnson@yacht.com'
        }
      }),
      prisma.crewMember.create({
        data: {
          id: 'crew-3',
          name: 'Sophie Martin',
          position: 'Stewardess',
          department: 'INTERIOR',
          status: 'OFF_DUTY',
          contact: '+1 555 0103',
          email: 'sophie.martin@yacht.com'
        }
      })
    ]);

    console.log('✅ Created crew members');

    // Create guests with proper foreign key relationships
    const guests = await Promise.all([
      prisma.guest.create({
        data: {
          id: 'guest-1',
          firstName: 'Alexander',
          lastName: 'Anderson',
          type: 'PRIMARY',
          status: 'ONBOARD',
          nationality: 'USA',
          languages: ['English', 'French'],
          locationId: 'owner-1', // Owner's Stateroom
          cabin: 'Owner\'s Stateroom', // Legacy field
          checkInDate: '2024-01-15',
          checkInTime: '14:00',
          checkOutDate: '2024-01-22',
          checkOutTime: '11:00',
          doNotDisturb: true, // Matches location DND
          allergies: ['Shellfish'],
          specialRequests: 'Late checkout preferred. Extra pillows in cabin.',
          createdBy: 'Chief Stewardess'
        }
      }),
      prisma.guest.create({
        data: {
          id: 'guest-2',
          firstName: 'Victoria',
          lastName: 'Chen',
          type: 'PARTNER',
          status: 'ONBOARD',
          nationality: 'China',
          languages: ['English', 'Mandarin'],
          locationId: 'owner-2', // VIP Cabin
          cabin: 'VIP Cabin', // Legacy field
          checkInDate: '2024-01-15',
          checkInTime: '14:00',
          checkOutDate: '2024-01-22',
          checkOutTime: '11:00',
          doNotDisturb: true, // Matches location DND
          dietaryRestrictions: ['Vegetarian'],
          createdBy: 'Chief Stewardess'
        }
      }),
      prisma.guest.create({
        data: {
          id: 'guest-3',
          firstName: 'James',
          lastName: 'Williams',
          type: 'VIP',
          status: 'ONBOARD',
          nationality: 'UK',
          languages: ['English'],
          locationId: 'lower-1', // Cabin 6
          cabin: 'Cabin 6', // Legacy field
          checkInDate: '2024-01-16',
          checkInTime: '14:00',
          checkOutDate: '2024-01-23',
          checkOutTime: '11:00',
          allergies: ['Nuts'],
          favoriteFoods: ['Steak'],
          createdBy: 'Chief Stewardess'
        }
      })
    ]);

    console.log('✅ Created guests with proper location relationships');

    // Create smart buttons
    const smartButtons = await Promise.all([
      prisma.smartButton.create({
        data: {
          id: 'smart-btn-1',
          deviceId: 'BTN-OWNER-1',
          name: 'Owner\'s Stateroom Button',
          macAddress: '00:11:22:33:44:01',
          status: 'ONLINE',
          batteryLevel: 85,
          locationId: 'owner-1',
          assignedLocation: 'Owner\'s Stateroom',
          mainButtonFunction: 'service_call',
          auxButton1Function: 'dnd_toggle',
          auxButton2Function: 'lights_control',
          auxButton3Function: 'housekeeping',
          auxButton4Function: 'climate_control'
        }
      }),
      prisma.smartButton.create({
        data: {
          id: 'smart-btn-2',
          deviceId: 'BTN-OWNER-2',
          name: 'VIP Cabin Button',
          macAddress: '00:11:22:33:44:02',
          status: 'ONLINE',
          batteryLevel: 92,
          locationId: 'owner-2',
          assignedLocation: 'VIP Cabin',
          mainButtonFunction: 'service_call',
          auxButton1Function: 'dnd_toggle',
          auxButton2Function: 'lights_control',
          auxButton3Function: 'housekeeping',
          auxButton4Function: 'climate_control'
        }
      })
    ]);

    console.log('✅ Created smart buttons');

    // Create sample service requests
    const serviceRequests = await Promise.all([
      prisma.serviceRequest.create({
        data: {
          guestName: 'Mr. Anderson',
          guestCabin: 'Owner\'s Stateroom',
          cabinId: 'owner-1',
          locationId: 'owner-1',
          guestId: 'guest-1',
          requestType: 'CALL',
          priority: 'NORMAL',
          status: 'PENDING',
          voiceTranscript: 'Could we have a bottle of champagne and some fresh towels brought to the sun deck please?',
          cabinImage: 'https://images.unsplash.com/photo-1753505889211-9cfbac527474?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
        }
      }),
      prisma.serviceRequest.create({
        data: {
          guestName: 'Mrs. Chen',
          guestCabin: 'VIP Cabin',
          cabinId: 'owner-2',
          locationId: 'owner-2',
          guestId: 'guest-2',
          requestType: 'CALL',
          priority: 'URGENT',
          status: 'PENDING',
          voiceTranscript: 'We would like evening turndown service at 8 PM.',
          cabinImage: 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
        }
      })
    ]);

    console.log('✅ Created service requests');

    // Create today's assignments
    const today = new Date().toISOString().split('T')[0];
    const assignments = await Promise.all([
      prisma.assignment.create({
        data: {
          date: today,
          type: 'PRIMARY',
          shiftId: 'morning',
          crewId: 'crew-1'
        }
      }),
      prisma.assignment.create({
        data: {
          date: today,
          type: 'PRIMARY',
          shiftId: 'afternoon',
          crewId: 'crew-2'
        }
      }),
      prisma.assignment.create({
        data: {
          date: today,
          type: 'BACKUP',
          shiftId: 'morning',
          crewId: 'crew-3'
        }
      })
    ]);

    console.log('✅ Created duty roster assignments');

    // Create activity logs
    await prisma.activityLog.create({
      data: {
        type: 'SYSTEM',
        action: 'Database Seeded',
        details: 'Initial data populated from frontend mock data',
        userId: adminUser.id
      }
    });

    console.log('✅ Created activity log');

    console.log(`
🎉 Database seed completed successfully!

📊 Created:
   • 1 Admin User (admin/admin123)
   • 3 Shift Configurations
   • 9 Locations (including DND locations)
   • 3 Crew Members
   • 3 Guests (with proper foreign key relationships)
   • 2 Smart Buttons
   • 2 Service Requests
   • 3 Duty Roster Assignments
   • 1 Activity Log

🔑 Login Credentials:
   • Username: admin
   • Password: admin123

🛥️ Ready for yacht crew management!
    `);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  });