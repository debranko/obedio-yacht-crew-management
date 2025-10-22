/**
 * Update location images with Unsplash URLs
 * This script updates all locations in the database with proper image URLs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping from location names to Unsplash images
const imageMapping: Record<string, string> = {
  // Sun Deck
  'Sun Deck Lounge': 'https://images.unsplash.com/photo-1686845928517-8ffc9009a45d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',

  // Bridge Deck
  'Gym': 'https://images.unsplash.com/photo-1719024483000-e72451273b5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',

  // Owner's Deck / Sun Deck Aft
  'Owner\'s Stateroom': 'https://images.unsplash.com/photo-1753505889211-9cfbac527474?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Master Bedroom': 'https://images.unsplash.com/photo-1753505889211-9cfbac527474?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Alias for Owner's Stateroom
  'VIP Cabin': 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'VIP Office': 'https://images.unsplash.com/photo-1697124510316-13efcb2e3abd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Dining Room': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Music Salon': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Main Salon': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Main Saloon': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Alias
  'External Salon': 'https://images.unsplash.com/photo-1722032259251-91cc9365b349?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'External Saloon': 'https://images.unsplash.com/photo-1722032259251-91cc9365b349?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Alias

  // Main Deck
  'Conference Room': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Meeting Room': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Alias
  'Welcome Salon': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',

  // Lower Deck / Tank Deck
  'Cabin 1': 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Cabin 2': 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Cabin 3': 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Cabin 4': 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Cabin 5': 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Cabin 6': 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Staff Cabin': 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Lazarette / Swimming Platform': 'https://images.unsplash.com/photo-1712142369890-8202255a278a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'Lazzaret': 'https://images.unsplash.com/photo-1712142369890-8202255a278a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Alias
};

async function main() {
  console.log('🖼️  Updating location images...\n');

  // Get all locations
  const locations = await prisma.location.findMany();
  console.log(`📍 Found ${locations.length} locations\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const location of locations) {
    const imageUrl = imageMapping[location.name];

    if (!imageUrl) {
      console.log(`⚠️  No image mapping found for: "${location.name}"`);
      notFound++;
      continue;
    }

    // Check if image is already set
    if (location.image === imageUrl) {
      console.log(`⏭️  Skipped (already set): ${location.name}`);
      skipped++;
      continue;
    }

    // Update location
    await prisma.location.update({
      where: { id: location.id },
      data: { image: imageUrl },
    });

    console.log(`✅ Updated: ${location.name}`);
    console.log(`   Old: ${location.image || '(none)'}`);
    console.log(`   New: ${imageUrl.substring(0, 60)}...\n`);
    updated++;
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ⚠️  Not found: ${notFound}`);
  console.log(`   📍 Total: ${locations.length}`);

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
