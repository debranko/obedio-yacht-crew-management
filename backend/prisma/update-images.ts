import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateImages() {
  console.log('🖼️  Updating location images...');

  const locationsToUpdate = [
    { name: 'Sun Deck', image: 'https://images.unsplash.com/photo-1572931448553-452a559e3c9c?w=1920' },
    { name: 'Bridge', image: 'https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?w=1920' },
    { name: 'Gym', image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920' },
    { name: 'Dining Room', image: 'https://images.unsplash.com/photo-1617011442183-5336ad56b6c2?w=1920' },
    { name: 'Main Salon', image: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=1920' },
    { name: 'External Main Salon', image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1920' },
    { name: 'VAP Cabin', image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1920' },
    { name: 'VAP Office', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920' },
    { name: 'Master Bedroom', image: 'https://images.unsplash.com/photo-1615529183002-ebb1417a88a4?w=1920' },
    { name: 'Meeting Room', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920' },
    { name: 'Welcome Salon', image: 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=1920' },
    { name: 'Staff Cabin', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1920' },
    { name: 'Guest Cabin 1', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920' },
    { name: 'Massage Room', image: 'https://images.unsplash.com/photo-1512290923902-8a9f31c83659?w=1920' }
  ];

  for (const loc of locationsToUpdate) {
    try {
      const updated = await prisma.location.update({
        where: { name: loc.name },
        data: { image: loc.image },
      });
      if (updated) {
        console.log(`✅ Updated image for: ${loc.name}`);
      }
    } catch (error) {
      console.warn(`Could not update ${loc.name}. It may not exist in the database. Skipping.`);
    }
  }

  console.log('\n🎉 Image update script completed!');
}

updateImages()
  .catch((e) => {
    console.error('❌ Error updating images:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });