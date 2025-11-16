/**
 * Full Demo Seed Script with Devices
 * Creates complete demo environment: users, locations, guests, crew, and devices
 * Runs with plain Node.js (no tsx required)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with full demo data...\n');

  try {
    // 1. Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@obedio.com',
        password: hashedPassword,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
      },
    });
    console.log('✅ Admin user created (admin/admin123)\n');

    // 2. Create locations
    console.log('📍 Creating locations...');
    const locations = [
      // SUN DECK
      { name: 'Sun Deck Lounge', type: 'common', floor: 'Sun Deck', description: 'Top deck lounge with panoramic views' },

      // BRIDGE DECK
      { name: 'Gym', type: 'common', floor: 'Bridge Deck', description: 'Fitness center with modern equipment' },

      // OWNER\'S DECK
      { name: 'External Saloon', type: 'common', floor: 'Owner\'s Deck', description: 'Outdoor lounge and entertainment area' },
      { name: 'Main Saloon', type: 'common', floor: 'Owner\'s Deck', description: 'Primary living and entertainment space' },
      { name: 'VIP Office', type: 'cabin', floor: 'Owner\'s Deck', description: 'Private office for VIP guests' },
      { name: 'VIP Cabin', type: 'cabin', floor: 'Owner\'s Deck', description: 'Luxury VIP guest accommodation' },
      { name: 'Master Bedroom', type: 'cabin', floor: 'Owner\'s Deck', description: 'Owner\'s master suite with balcony' },
      { name: 'Dining Room', type: 'common', floor: 'Owner\'s Deck', description: 'Formal dining area' },

      // MAIN DECK
      { name: 'Meeting Room', type: 'common', floor: 'Main Deck', description: 'Conference and meeting space' },
      { name: 'Welcome Salon', type: 'common', floor: 'Main Deck', description: 'Guest reception and lounge' },
      { name: 'Staff Cabin', type: 'service', floor: 'Main Deck', description: 'Crew accommodation' },

      // LOWER DECK
      { name: 'Lazzaret', type: 'deck', floor: 'Lower Deck', description: 'Swim platform and water sports access' },

      // TANK DECK - Guest Cabins
      { name: 'Cabin 1', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities' },
      { name: 'Cabin 2', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities' },
      { name: 'Cabin 3', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities' },
      { name: 'Cabin 4', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities' },
      { name: 'Cabin 5', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities' },
      { name: 'Cabin 6', type: 'cabin', floor: 'Tank Deck', description: 'Guest cabin with modern amenities' },
    ];

    await prisma.location.createMany({ data: locations, skipDuplicates: true });
    console.log(`✅ Created ${locations.length} locations\n`);

    // 3. Create crew members
    console.log('👥 Creating crew members...');
    const crew = [
      { name: 'Sarah Johnson', position: 'Chief Stewardess', department: 'Interior', status: 'active', email: 'sarah@obedio.com', role: 'chief-stewardess' },
      { name: 'Emma Williams', position: 'Senior Stewardess', department: 'Interior', status: 'active', email: 'emma@obedio.com', role: 'stewardess' },
      { name: 'Lisa Brown', position: 'Stewardess', department: 'Interior', status: 'active', email: 'lisa@obedio.com', role: 'stewardess' },
      { name: 'Maria Garcia', position: 'Stewardess', department: 'Interior', status: 'active', email: 'maria@obedio.com', role: 'stewardess' },
    ];

    await prisma.crewMember.createMany({
      data: crew.map(c => ({
        ...c,
        contact: null,
        joinDate: new Date('2024-01-01'),
      })),
      skipDuplicates: true,
    });
    console.log(`✅ Created ${crew.length} crew members\n`);

    // 4. Create guests
    console.log('🎭 Creating demo guests...');
    const masterBedroom = await prisma.location.findFirst({ where: { name: 'Master Bedroom' } });
    const vipCabin = await prisma.location.findFirst({ where: { name: 'VIP Cabin' } });
    const cabin1 = await prisma.location.findFirst({ where: { name: 'Cabin 1' } });

    const guests = [
      {
        firstName: 'John',
        lastName: 'Smith',
        type: 'owner',
        status: 'onboard',
        nationality: 'American',
        languages: ['English'],
        locationId: masterBedroom?.id,
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        type: 'vip',
        status: 'onboard',
        nationality: 'British',
        languages: ['English'],
        locationId: vipCabin?.id,
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        type: 'guest',
        status: 'onboard',
        nationality: 'Australian',
        languages: ['English'],
        locationId: cabin1?.id,
      },
    ];

    await prisma.guest.createMany({ data: guests, skipDuplicates: true });
    console.log(`✅ Created ${guests.length} guests\n`);

    // 5. Create smart button devices for all cabins
    console.log('📱 Creating smart button devices...');
    const allLocations = await prisma.location.findMany();
    const cabinLocations = allLocations.filter(l => l.type === 'cabin');

    const devices = [];
    for (const location of cabinLocations) {
      const deviceId = `BTN-${location.name.replace(/\s+/g, '-').toUpperCase()}`;
      const macAddress = `AA:BB:CC:DD:EE:${(devices.length + 1).toString(16).padStart(2, '0')}`;

      devices.push({
        deviceId: deviceId,
        name: `${location.name} Smart Button`,
        type: 'smart_button',
        macAddress: macAddress,
        status: 'online',
        locationId: location.id,
        batteryLevel: 85 + Math.floor(Math.random() * 15),
        signalStrength: -40 - Math.floor(Math.random() * 30),
        connectionType: 'wifi',
        lastSeen: new Date(),
      });
    }

    // Create devices one by one (createMany doesn't return created records)
    const createdDevices = [];
    for (const device of devices) {
      const created = await prisma.device.create({ data: device });
      createdDevices.push(created);
    }

    console.log(`✅ Created ${createdDevices.length} smart button devices\n`);

    // 6. Create device logs for testing
    console.log('📝 Creating device logs...');
    const logs = [];
    for (const device of createdDevices.slice(0, 3)) { // Add logs for first 3 devices
      logs.push({
        deviceId: device.id,
        eventType: 'device_online',
        eventData: { message: 'Device came online' },
        severity: 'info',
      });
    }

    if (logs.length > 0) {
      await prisma.deviceLog.createMany({ data: logs });
      console.log(`✅ Created ${logs.length} device log entries\n`);
    }

    console.log('🎉 Full database seeding completed successfully!\n');
    console.log('📝 Login credentials:');
    console.log('   Admin: admin / admin123\n');
    console.log('📊 Demo data created:');
    console.log(`   - ${locations.length} locations`);
    console.log(`   - ${crew.length} crew members`);
    console.log(`   - ${guests.length} guests`);
    console.log(`   - ${createdDevices.length} smart button devices`);
    console.log(`   - ${logs.length} device logs\n`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
