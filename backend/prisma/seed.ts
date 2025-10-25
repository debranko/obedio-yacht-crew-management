import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
  console.log(' Seeding admin user...');
  const u = process.env.ADMIN_BOOTSTRAP_USER ?? 'admin';
  const p = process.env.ADMIN_BOOTSTRAP_PASS ?? 'admin123';
  const e = process.env.ADMIN_BOOTSTRAP_EMAIL ?? 'admin@yacht.local';
  const hash = await bcrypt.hash(p, 10);
  
  await prisma.user.upsert({
    where: { username: u },
    update: {},
    create: { 
      username: u, 
      email: e, 
      password: hash, 
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
      // isActive će biti default true iz schema
    }
  });
  console.log(' Admin user created (username: admin, password: admin123)');
}

async function seedLocations() {
  console.log(' Seeding locations (Real Yacht Layout with Images)...');
  
  const locations = [
    // SUN DECK
    { name: 'Sun Deck Lounge', type: 'common', floor: 'Sun Deck', description: 'Top deck lounge with panoramic views', image: '/images/locations/Sun Deck.jpg' },
    
    // BRIDGE DECK
    { name: 'Gym', type: 'common', floor: 'Bridge Deck', description: 'Fitness center with modern equipment', image: '/images/locations/Gym.jpg' },
    
    // OWNER\'S DECK
    { name: 'External Saloon', type: 'common', floor: 'Owner\'s Deck', description: 'Outdoor lounge and entertainment area', image: '/images/locations/Exterior Aft.jpg' },
    { name: 'Main Saloon', type: 'common', floor: 'Owner\'s Deck', description: 'Primary living and entertainment space', image: '/images/locations/Main Salon.jpg' },
    { name: 'VIP Office', type: 'cabin', floor: 'Owner\'s Deck', description: 'Private office for VIP guests', image: '/images/locations/VIP Office.jpg' },
    { name: 'VIP Cabin', type: 'cabin', floor: 'Owner\'s Deck', description: 'Luxury VIP guest accommodation', image: '/images/locations/vip bedroom.jpg' },
    { name: 'Master Bedroom', type: 'cabin', floor: 'Owner\'s Deck', description: 'Owner\'s master suite with balcony', image: '/images/locations/Master Bedroom.jpg' },
    { name: 'Dining Room', type: 'common', floor: 'Owner\'s Deck', description: 'Formal dining area', image: '/images/locations/dinning room.jpg' },
    
    // MAIN DECK
    { name: 'Meeting Room', type: 'common', floor: 'Main Deck', description: 'Conference and meeting space', image: '/images/locations/Meeting Room.jpg' },
    { name: 'Welcome Salon', type: 'common', floor: 'Main Deck', description: 'Guest reception and lounge', image: '/images/locations/Welcome Salon.jpg' },
    { name: 'Staff Cabin', type: 'service', floor: 'Main Deck', description: 'Crew accommodation', image: '/images/locations/Staff Cabin.jpg' },
    
    // LOWER DECK
    { name: 'Lazzaret', type: 'deck', floor: 'Lower Deck', description: 'Swim platform and water sports access', image: '/images/locations/Lazzaret (swimming platform).jpg' },
    
    // TANK DECK - Guest Cabins
    { name: 'Cabin 1', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities', image: '/images/locations/Yersin.jpg' },
    { name: 'Cabin 2', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities', image: '/images/locations/Yersin.jpg' },
    { name: 'Cabin 3', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities', image: '/images/locations/Yersin.jpg' },
    { name: 'Cabin 4', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities', image: '/images/locations/Yersin.jpg' },
    { name: 'Cabin 5', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities', image: '/images/locations/Yersin.jpg' },
    { name: 'Cabin 6', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities', image: '/images/locations/Yersin.jpg' },
  ];

  await prisma.location.createMany({
    data: locations,
    skipDuplicates: true,
  });
  
  console.log(` Created ${locations.length} locations (Real Yacht Layout)`);
}

async function seedCrew() {
  console.log(' Seeding crew members (Interior Department only)...');
  
  const crew = [
    // Interior Department ONLY - Stewardesses
    { name: 'Sarah Johnson', position: 'Chief Stewardess', department: 'Interior', status: 'active', email: 'sarah@yacht.local', role: 'chief-stewardess' },
    { name: 'Emma Williams', position: 'Senior Stewardess', department: 'Interior', status: 'active', email: 'emma@yacht.local', role: 'stewardess' },
    { name: 'Lisa Brown', position: 'Stewardess', department: 'Interior', status: 'active', email: 'lisa@yacht.local', role: 'stewardess' },
    { name: 'Maria Garcia', position: 'Stewardess', department: 'Interior', status: 'active', email: 'maria@yacht.local', role: 'stewardess' },
    { name: 'Sophie Martin', position: 'Junior Stewardess', department: 'Interior', status: 'active', email: 'sophie@yacht.local', role: 'stewardess' },
    { name: 'Isabella Rossi', position: 'Laundry Stewardess', department: 'Interior', status: 'active', email: 'isabella@yacht.local', role: 'stewardess' },
    { name: 'Chloe Anderson', position: 'Night Stewardess', department: 'Interior', status: 'active', email: 'chloe@yacht.local', role: 'stewardess' },
    { name: 'Olivia Taylor', position: 'Stewardess', department: 'Interior', status: 'on-leave', email: 'olivia@yacht.local', role: 'stewardess' },
    
    // NOTE: Removed all non-Interior departments:
    // - Deck Department (Captain, Officers, Deckhand) - REMOVED
    // - Engineering Department (Engineers, ETO) - REMOVED
    // - Galley Department (Chefs) - REMOVED
    // Only Interior stewardesses remain as per user requirements
  ];

  await prisma.crewMember.createMany({
    data: crew.map(c => ({
      ...c,
      contact: null,
      joinDate: new Date('2024-01-01'),
    })),
    skipDuplicates: true,
  });
  
  console.log(` Created ${crew.length} Interior crew members`);
}

async function seedGuests() {
  console.log(' Seeding celebrity guests...');
  
  // Get location IDs from new yacht layout
  const masterBedroom = await prisma.location.findFirst({ where: { name: 'Master Bedroom' } });
  const vipCabin = await prisma.location.findFirst({ where: { name: 'VIP Cabin' } });
  const vipOffice = await prisma.location.findFirst({ where: { name: 'VIP Office' } });
  const cabin1 = await prisma.location.findFirst({ where: { name: 'Cabin 1' } });
  const cabin2 = await prisma.location.findFirst({ where: { name: 'Cabin 2' } });
  const cabin3 = await prisma.location.findFirst({ where: { name: 'Cabin 3' } });
  const cabin4 = await prisma.location.findFirst({ where: { name: 'Cabin 4' } });
  const cabin5 = await prisma.location.findFirst({ where: { name: 'Cabin 5' } });
  const cabin6 = await prisma.location.findFirst({ where: { name: 'Cabin 6' } });
  
  const guests = [
    // MASTER BEDROOM (Owner's Deck) - Leonardo DiCaprio & Scarlett Johansson
    { 
      firstName: 'Leonardo', 
      lastName: 'DiCaprio',
      preferredName: 'Leo',
      type: 'owner', 
      status: 'onboard',
      nationality: 'American',
      languages: ['English', 'German'],
      locationId: masterBedroom?.id,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
    },
    { 
      firstName: 'Scarlett', 
      lastName: 'Johansson',
      type: 'partner', 
      status: 'onboard',
      nationality: 'American',
      languages: ['English', 'French'],
      locationId: masterBedroom?.id,
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
    },
    
    // VIP CABIN (Owner's Deck) - George Clooney & Amal
    { 
      firstName: 'George', 
      lastName: 'Clooney',
      type: 'vip', 
      status: 'onboard',
      nationality: 'American',
      languages: ['English', 'Italian'],
      locationId: vipCabin?.id,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
    },
    { 
      firstName: 'Amal', 
      lastName: 'Clooney',
      type: 'vip', 
      status: 'onboard',
      nationality: 'British',
      languages: ['English', 'Arabic', 'French'],
      locationId: vipCabin?.id,
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
    },
    
    // VIP OFFICE (Owner's Deck) - Chris Hemsworth & Elsa Pataky
    { 
      firstName: 'Chris', 
      lastName: 'Hemsworth',
      type: 'vip', 
      status: 'onboard',
      nationality: 'Australian',
      languages: ['English'],
      locationId: vipOffice?.id,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'
    },
    { 
      firstName: 'Elsa', 
      lastName: 'Pataky',
      type: 'vip', 
      status: 'onboard',
      nationality: 'Spanish',
      languages: ['Spanish', 'English'],
      locationId: vipOffice?.id,
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop'
    },
    
    // CABIN 1 (Tank Deck) - Ed Sheeran & Cherry Seaborn
    { 
      firstName: 'Ed', 
      lastName: 'Sheeran',
      type: 'guest', 
      status: 'onboard',
      nationality: 'British',
      languages: ['English'],
      locationId: cabin1?.id,
      photo: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&h=400&fit=crop'
    },
    { 
      firstName: 'Cherry', 
      lastName: 'Seaborn',
      type: 'guest', 
      status: 'onboard',
      nationality: 'British',
      languages: ['English'],
      locationId: cabin1?.id,
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop'
    },
    
    // CABIN 2 (Tank Deck) - Timothée Chalamet & Zendaya
    { 
      firstName: 'Timothée', 
      lastName: 'Chalamet',
      type: 'guest', 
      status: 'onboard',
      nationality: 'American',
      languages: ['English', 'French'],
      locationId: cabin2?.id,
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop'
    },
    { 
      firstName: 'Zendaya', 
      lastName: 'Coleman',
      preferredName: 'Z',
      type: 'guest', 
      status: 'onboard',
      nationality: 'American',
      languages: ['English'],
      locationId: cabin2?.id,
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop'
    },
    
    // CABIN 3 (Tank Deck) - Dwayne Johnson & Lauren
    { 
      firstName: 'Dwayne', 
      lastName: 'Johnson',
      preferredName: 'The Rock',
      type: 'guest', 
      status: 'onboard',
      nationality: 'American',
      languages: ['English'],
      locationId: cabin3?.id,
      photo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop'
    },
    { 
      firstName: 'Lauren', 
      lastName: 'Hashian',
      type: 'guest', 
      status: 'onboard',
      nationality: 'American',
      languages: ['English'],
      locationId: cabin3?.id,
      photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop'
    },
    { 
      firstName: 'Ryan', 
      lastName: 'Reynolds',
      type: 'guest', 
      status: 'onboard',
      nationality: 'Canadian',
      languages: ['English', 'French'],
      locationId: cabin4?.id,
      photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop'
    },
    { 
      firstName: 'Blake', 
      lastName: 'Lively',
      type: 'guest', 
      status: 'onboard',
      nationality: 'American',
      languages: ['English'],
      locationId: cabin4?.id,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop'
    },
    
    // CABIN 5 (Tank Deck) - Tom Holland & Zendaya's friend
    { 
      firstName: 'Tom', 
      lastName: 'Holland',
      type: 'guest', 
      status: 'onboard',
      nationality: 'British',
      languages: ['English'],
      locationId: cabin5?.id,
      photo: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=400&fit=crop'
    },
    
    // CABIN 6 (Tank Deck) - Margot Robbie (solo guest)
    { 
      firstName: 'Margot', 
      lastName: 'Robbie',
      type: 'guest', 
      status: 'onboard',
      nationality: 'Australian',
      languages: ['English'],
      locationId: cabin6?.id,
      photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop'
    },
  ];

  for (const guest of guests) {
    await prisma.guest.create({
      data: guest
    });
  }
  
  console.log(` Created ${guests.length} guests`);
}

async function seedServiceRequests() {
  console.log(' Seeding service requests...');
  
  const guests = await prisma.guest.findMany();
  const locations = await prisma.location.findMany();
  
  if (guests.length > 0 && locations.length > 0) {
    const requests = [
      {
        requestType: 'call',
        guestId: guests[0]?.id,
        locationId: locations[0]?.id,
        priority: 'normal',
        status: 'open',
        notes: 'Guest requested coffee service'
      },
      {
        requestType: 'service',
        guestId: guests[1]?.id,
        locationId: locations[1]?.id,
        priority: 'urgent',
        status: 'accepted',
        notes: 'Room cleaning requested'
      }
    ];

    await prisma.serviceRequest.createMany({
      data: requests,
      skipDuplicates: true,
    });
    
    console.log(` Created ${requests.length} service requests`);
  }
}

async function seedDevices() {
  console.log(' Seeding devices...');
  
  const locations = await prisma.location.findMany();
  const crewMembers = await prisma.crewMember.findMany();
  
  const devices: any[] = [];
  
  // Smart buttons for each cabin
  const cabinLocations = locations.filter(l => l.type === 'cabin');
  for (const location of cabinLocations) {
    devices.push({
      deviceId: `BTN-${location.name.replace(/\s+/g, '-').toUpperCase()}`,
      name: `${location.name} Smart Button`,
      type: 'smart_button',
      status: 'online',
      locationId: location.id,
      config: {
        version: '1.0.0',
        batteryLevel: 85 + Math.floor(Math.random() * 15),
        firmwareVersion: 'v2.1.0',
        lastSync: new Date().toISOString()
      }
    });
  }
  
  // Add some common area buttons
  const commonAreas = locations.filter(l => l.type === 'common').slice(0, 4);
  for (const location of commonAreas) {
    devices.push({
      deviceId: `BTN-${location.name.replace(/\s+/g, '-').toUpperCase()}`,
      name: `${location.name} Smart Button`,
      type: 'smart_button',
      status: Math.random() > 0.8 ? 'offline' : 'online',
      locationId: location.id,
      config: {
        version: '1.0.0',
        batteryLevel: 70 + Math.floor(Math.random() * 30),
        firmwareVersion: 'v2.1.0',
        lastSync: new Date().toISOString()
      }
    });
  }
  
  // Add some wearable devices for crew
  const activeStaff = crewMembers.filter(c => c.status === 'active').slice(0, 5);
  for (const crew of activeStaff) {
    devices.push({
      deviceId: `WEAR-${crew.name.split(' ')[1].toUpperCase()}-001`,
      name: `${crew.name}'s Watch`,
      type: 'wearable',
      status: 'online',
      crewMemberId: crew.id,
      config: {
        version: '1.0.0',
        model: 'Apple Watch Series 8',
        batteryLevel: 60 + Math.floor(Math.random() * 40),
        lastSync: new Date().toISOString()
      }
    });
  }
  
  // Create devices
  const createdDevices: any[] = [];
  for (const device of devices) {
    const created = await prisma.device.create({
      data: device
    });
    createdDevices.push(created);
  }
  
  console.log(` Created ${createdDevices.length} devices`);
  
  // Create device logs
  console.log(' Seeding device logs...');
  
  const logs: any[] = [];
  const now = new Date();
  
  for (const device of createdDevices) {
    // Add various log events for each device
    const eventTypes = ['device_online', 'button_press', 'config_change', 'battery_low', 'device_offline'];
    const numLogs = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < numLogs; i++) {
      const hoursAgo = Math.floor(Math.random() * 48); // Random time within last 48 hours
      const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      let eventData: any = {};
      
      switch (eventType) {
        case 'button_press':
          eventData = {
            location: device.name.replace(' Smart Button', ''),
            user: activeStaff[Math.floor(Math.random() * activeStaff.length)]?.name || 'System'
          };
          break;
        case 'battery_low':
          eventData = { level: 10 + Math.floor(Math.random() * 10) };
          break;
        case 'config_change':
          eventData = { changes: { firmwareVersion: 'v2.1.1' } };
          break;
        case 'device_online':
        case 'device_offline':
          eventData = { reason: 'scheduled' };
          break;
      }
      
      logs.push({
        deviceId: device.id,
        eventType,
        eventData,
        severity: eventType === 'battery_low' ? 'warning' : 'info',
        createdAt: timestamp
      });
    }
  }
  
  await prisma.deviceLog.createMany({
    data: logs,
    skipDuplicates: true
  });
  
  console.log(` Created ${logs.length} device logs`);
}

async function seedShifts() {
  console.log(' Seeding duty roster shifts...');

  const shifts = [
    {
      name: 'Morning',
      startTime: '06:00',
      endTime: '14:00',
      color: '#D4B877',
      description: 'Morning shift - breakfast and early afternoon service',
      isActive: true,
      order: 0,
    },
    {
      name: 'Afternoon',
      startTime: '14:00',
      endTime: '22:00',
      color: '#06B6D4',
      description: 'Afternoon shift - lunch, dinner, and evening service',
      isActive: true,
      order: 1,
    },
    {
      name: 'Night',
      startTime: '22:00',
      endTime: '06:00',
      color: '#7C3AED',
      description: 'Night shift - late evening and overnight service',
      isActive: true,
      order: 2,
    },
  ];

  await prisma.shift.createMany({
    data: shifts,
    skipDuplicates: true,
  });

  console.log(` Created ${shifts.length} shifts (Morning, Afternoon, Night)`);
}

async function main() {
  console.log(' Starting database seed...\n');

  try {
    // Clean up existing data (except users)
    console.log(' Cleaning up existing data...');
    await prisma.assignment.deleteMany({});
    await prisma.shift.deleteMany({});
    await prisma.deviceLog.deleteMany({});
    await prisma.device.deleteMany({});
    await prisma.serviceRequest.deleteMany({});
    await prisma.guest.deleteMany({});
    await prisma.crewMember.deleteMany({});
    await prisma.location.deleteMany({});
    console.log(' Cleanup complete!\n');

    await seedAdmin();
    await seedLocations();
    await seedCrew();
    await seedGuests();
    await seedServiceRequests();
    await seedDevices();
    await seedShifts();
    
    console.log('\n Database seeded successfully!');
    console.log('\n Summary:');
    console.log(`   • Users: ${await prisma.user.count()}`);
    console.log(`   • Locations: ${await prisma.location.count()}`);
    console.log(`   • Crew: ${await prisma.crewMember.count()}`);
    console.log(`   • Guests: ${await prisma.guest.count()}`);
    console.log(`   • Service Requests: ${await prisma.serviceRequest.count()}`);
    console.log(`   • Devices: ${await prisma.device.count()}`);
    console.log(`   • Device Logs: ${await prisma.deviceLog.count()}`);
    console.log(`   • Shifts: ${await prisma.shift.count()}`);
    console.log(`   • Assignments: ${await prisma.assignment.count()}`);
  } catch (error) {
    console.error(' Seed failed:', error);
    throw error;
  }
}

main().then(async () => {
  console.log('Seed done');
  await prisma.$disconnect();
}).catch(async e => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});