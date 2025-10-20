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
  console.log(' Seeding locations...');
  
  const locations = [
    { name: 'Master Suite', type: 'cabin', description: 'Owner\'s primary cabin' },
    { name: 'VIP Suite', type: 'cabin', description: 'VIP guest cabin' },
    { name: 'Guest Cabin 1', type: 'cabin', description: 'Guest accommodation' },
    { name: 'Guest Cabin 2', type: 'cabin', description: 'Guest accommodation' },
    { name: 'Main Salon', type: 'common', description: 'Main living area' },
    { name: 'Upper Deck', type: 'deck', description: 'Upper deck area' },
    { name: 'Sun Deck', type: 'deck', description: 'Sun deck with pool' },
    { name: 'Bridge', type: 'service', description: 'Navigation bridge' },
    { name: 'Galley', type: 'service', description: 'Main kitchen' },
  ];

  await prisma.location.createMany({
    data: locations,
    skipDuplicates: true,
  });
  
  console.log(` Created ${locations.length} locations`);
}

async function seedCrew() {
  console.log(' Seeding crew members...');
  
  const crew = [
    { name: 'Sarah Johnson', position: 'Chief Stewardess', department: 'Interior', status: 'active', email: 'sarah@yacht.local', role: 'chief-stewardess' },
    { name: 'Emma Williams', position: 'Stewardess', department: 'Interior', status: 'active', email: 'emma@yacht.local', role: 'stewardess' },
    { name: 'Lisa Brown', position: 'Stewardess', department: 'Interior', status: 'active', email: 'lisa@yacht.local', role: 'stewardess' },
    { name: 'John Smith', position: 'Captain', department: 'Deck', status: 'active', email: 'captain@yacht.local', role: 'admin' },
    { name: 'Mike Davis', position: 'First Officer', department: 'Deck', status: 'active', email: 'mike@yacht.local', role: 'crew' },
    { name: 'Tom Wilson', position: 'Chief Engineer', department: 'Engineering', status: 'active', email: 'tom@yacht.local', role: 'eto' },
  ];

  await prisma.crewMember.createMany({
    data: crew.map(c => ({
      ...c,
      contact: null,
      joinDate: new Date('2024-01-01'),
    })),
    skipDuplicates: true,
  });
  
  console.log(` Created ${crew.length} crew members`);
}

async function seedGuests() {
  console.log(' Seeding guests...');
  
  // Get location IDs
  const masterSuite = await prisma.location.findFirst({ where: { name: 'Master Suite' } });
  const vipSuite = await prisma.location.findFirst({ where: { name: 'VIP Suite' } });
  const guestCabin1 = await prisma.location.findFirst({ where: { name: 'Guest Cabin 1' } });
  
  const guests = [
    { 
      firstName: 'Alexander', 
      lastName: 'Montgomery',
      preferredName: 'Alex',
      type: 'owner', 
      status: 'onboard',
      nationality: 'British',
      languages: ['English', 'French'],
      locationId: masterSuite?.id
    },
    { 
      firstName: 'Victoria', 
      lastName: 'Montgomery',
      preferredName: 'Vicky',
      type: 'partner', 
      status: 'onboard',
      nationality: 'British',
      languages: ['English', 'Spanish'],
      locationId: masterSuite?.id
    },
    { 
      firstName: 'Robert', 
      lastName: 'Harrison',
      preferredName: 'Rob',
      type: 'vip', 
      status: 'onboard',
      nationality: 'American',
      languages: ['English'],
      locationId: vipSuite?.id
    },
    { 
      firstName: 'Sophie', 
      lastName: 'Anderson',
      type: 'family', 
      status: 'onboard',
      nationality: 'Swedish',
      languages: ['English', 'Swedish'],
      locationId: guestCabin1?.id
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

async function main() {
  console.log(' Starting database seed...\n');
  
  try {
    await seedAdmin();
    await seedLocations();
    await seedCrew();
    await seedGuests();
    await seedServiceRequests();
    
    console.log('\n Database seeded successfully!');
    console.log('\n Summary:');
    console.log(`   • Users: ${await prisma.user.count()}`);
    console.log(`   • Locations: ${await prisma.location.count()}`);
    console.log(`   • Crew: ${await prisma.crewMember.count()}`);
    console.log(`   • Guests: ${await prisma.guest.count()}`);
    console.log(`   • Service Requests: ${await prisma.serviceRequest.count()}`);
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