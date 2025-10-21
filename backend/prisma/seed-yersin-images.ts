import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️  Adding Yersin yacht location images...');

  // Image 1: Guest Cabin (twin beds, beige interior)
  await prisma.location.update({
    where: { name: 'Guest Cabin 1' },
    data: {
      image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1920'
    }
  });
  console.log('✅ Updated: Guest Cabin 1');

  // Image 2: Beach Club / Main Salon (ocean view, lounge)
  await prisma.location.update({
    where: { name: 'External Main Salon' },
    data: {
      image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1920'
    }
  });
  console.log('✅ Updated: External Main Salon');

  // Image 3: Dining Room (long table, elegant)
  await prisma.location.update({
    where: { name: 'Dining Room' },
    data: {
      image: 'https://images.unsplash.com/photo-1560185127-6a7e4c0e25e2?w=1920'
    }
  });
  console.log('✅ Updated: Dining Room');

  // Image 4: Bar / Welcome Salon (bar counter, wine storage)
  await prisma.location.update({
    where: { name: 'Welcome Salon' },
    data: {
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920'
    }
  });
  console.log('✅ Updated: Welcome Salon (Bar)');

  // Image 5: Main Salon (white sofas, luxury lounge)
  await prisma.location.update({
    where: { name: 'Main Salon' },
    data: {
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920'
    }
  });
  console.log('✅ Updated: Main Salon');

  // Additional luxury yacht images for other key locations
  
  // Bridge Deck
  await prisma.location.update({
    where: { name: 'Bridge' },
    data: {
      image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1920'
    }
  });
  console.log('✅ Updated: Bridge');

  // Gym
  await prisma.location.update({
    where: { name: 'Gym' },
    data: {
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920'
    }
  });
  console.log('✅ Updated: Gym');

  // VAP Cabin (VIP)
  await prisma.location.update({
    where: { name: 'VAP Cabin' },
    data: {
      image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1920'
    }
  });
  console.log('✅ Updated: VAP Cabin');

  // Fix Master Bedroom (reset name if corrupted)
  const masterBed = await prisma.location.findFirst({
    where: {
      floor: "Owner's Deck",
      type: "cabin",
      description: { contains: "master" }
    }
  });

  if (masterBed) {
    await prisma.location.update({
      where: { id: masterBed.id },
      data: {
        name: 'Master Bedroom',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920'
      }
    });
    console.log('✅ Fixed & Updated: Master Bedroom');
  }

  // Massage Room (spa)
  await prisma.location.update({
    where: { name: 'Massage Room' },
    data: {
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920'
    }
  });
  console.log('✅ Updated: Massage Room');

  console.log('\n🎉 Successfully added images to 10 Yersin locations!');
  console.log('\n📊 Summary:');
  console.log('   • Guest Cabin 1 ✅');
  console.log('   • External Main Salon (Beach Club) ✅');
  console.log('   • Dining Room ✅');
  console.log('   • Welcome Salon (Bar) ✅');
  console.log('   • Main Salon ✅');
  console.log('   • Bridge ✅');
  console.log('   • Gym ✅');
  console.log('   • VAP Cabin ✅');
  console.log('   • Master Bedroom ✅');
  console.log('   • Massage Room ✅');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
