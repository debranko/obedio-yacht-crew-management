import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedYersinLocations() {
  console.log('🚢 Seeding Yersin yacht locations...');

  // Clear existing locations first (optional - comment out if you want to keep existing)
  await prisma.location.deleteMany({});
  console.log('✅ Cleared existing locations');

  // Yersin Yacht Real Locations
  const locations = [
    // Sun Deck
    {
      name: 'Sun Deck',
      type: 'exterior' as const,
      floor: 'Sun Deck',
      description: 'Top deck outdoor area'
    },

    // Bridge Deck
    {
      name: 'Bridge',
      type: 'common' as const,
      floor: 'Bridge Deck',
      description: 'Navigation and control center'
    },
    {
      name: 'Gym',
      type: 'common' as const,
      floor: 'Bridge Deck',
      description: 'Fitness and exercise area'
    },

    // Owner's Deck
    {
      name: 'Dining Room',
      type: 'common' as const,
      floor: "Owner's Deck",
      description: 'Formal dining area'
    },
    {
      name: 'Main Salon',
      type: 'common' as const,
      floor: "Owner's Deck",
      description: 'Main interior living area'
    },
    {
      name: 'External Main Salon',
      type: 'exterior' as const,
      floor: "Owner's Deck",
      description: 'Outdoor lounge area'
    },
    {
      name: 'VAP Cabin',
      type: 'cabin' as const,
      floor: "Owner's Deck",
      description: 'VIP guest accommodation'
    },
    {
      name: 'VAP Office',
      type: 'common' as const,
      floor: "Owner's Deck",
      description: 'VIP office space'
    },
    {
      name: 'Master Bedroom',
      type: 'cabin' as const,
      floor: "Owner's Deck",
      description: "Owner's master suite"
    },

    // Main Deck
    {
      name: 'Meeting Room',
      type: 'common' as const,
      floor: 'Main Deck',
      description: 'Conference and meeting space'
    },
    {
      name: 'Welcome Salon',
      type: 'common' as const,
      floor: 'Main Deck',
      description: 'Guest reception area'
    },
    {
      name: 'Staff Cabin',
      type: 'cabin' as const,
      floor: 'Main Deck',
      description: 'Staff accommodation'
    },

    // Lower Deck - 6 Guest Cabins
    {
      name: 'Guest Cabin 1',
      type: 'cabin' as const,
      floor: 'Lower Deck',
      description: 'Guest accommodation'
    },
    {
      name: 'Guest Cabin 2',
      type: 'cabin' as const,
      floor: 'Lower Deck',
      description: 'Guest accommodation'
    },
    {
      name: 'Guest Cabin 3',
      type: 'cabin' as const,
      floor: 'Lower Deck',
      description: 'Guest accommodation'
    },
    {
      name: 'Guest Cabin 4',
      type: 'cabin' as const,
      floor: 'Lower Deck',
      description: 'Guest accommodation'
    },
    {
      name: 'Guest Cabin 5',
      type: 'cabin' as const,
      floor: 'Lower Deck',
      description: 'Guest accommodation'
    },
    {
      name: 'Guest Cabin 6',
      type: 'cabin' as const,
      floor: 'Lower Deck',
      description: 'Guest accommodation'
    },

    // Tank Deck
    {
      name: 'Massage Room',
      type: 'common' as const,
      floor: 'Tank Deck',
      description: 'Spa and wellness area'
    },
  ];

  // Create all locations
  for (const location of locations) {
    const created = await prisma.location.create({
      data: location,
    });
    console.log(`✅ Created: ${created.name} (${created.floor})`);
  }

  console.log(`\n🎉 Successfully seeded ${locations.length} Yersin locations!`);
  console.log('\n📊 Summary:');
  console.log(`   Sun Deck: 1 location`);
  console.log(`   Bridge Deck: 2 locations`);
  console.log(`   Owner's Deck: 6 locations`);
  console.log(`   Main Deck: 3 locations`);
  console.log(`   Lower Deck: 6 cabins`);
  console.log(`   Tank Deck: 1 location`);
  console.log(`   TOTAL: ${locations.length} locations`);
}

seedYersinLocations()
  .catch((e) => {
    console.error('❌ Error seeding Yersin locations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
