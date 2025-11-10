const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const JWT_SECRET = "af7bae6536b8a4d6a79139ebfaf48c0d22ca77b3a86837081391b7971fd436c4d6defa1037e571a3a94325a5f8e87ba139e4a94f021a903a69c1df43f1a2b27e";

async function createSophieUser() {
  console.log('\n🔧 Creating user account for Sophie Laurent...\n');

  try {
    // Hash password
    const password = await bcrypt.hash('sophie123', 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: 'sophie.laurent',
        email: 'sophie.laurent@yacht.com',
        password: password,
        role: 'chief_stewardess',
        firstName: 'Sophie',
        lastName: 'Laurent',
        crewMember: {
          connect: { id: 'crew-001' }
        }
      },
      include: {
        crewMember: true
      }
    });

    console.log('✅ User created:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Linked to crew: ${user.crewMember?.name || 'N/A'}`);
    console.log('');

    // Generate JWT token
    const payload = {
      sub: user.id,
      userId: user.id,
      role: user.role,
      username: user.username,
      type: 'watch-auth'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '3650d' });

    console.log('🔑 JWT TOKEN GENERATED:\n');
    console.log('==============================================');
    console.log(token);
    console.log('==============================================\n');
    console.log('📱 Add this token to ApiClient.kt in watch app');
    console.log('   Update the Authorization header with this new token\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createSophieUser();
