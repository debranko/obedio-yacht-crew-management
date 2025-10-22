import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdminPassword() {
  console.log('🔧 Fixing admin password...');
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('📝 New password hash created');
    
    // Update admin user
    const result = await prisma.user.updateMany({
      where: { username: 'admin' },
      data: { password: hashedPassword }
    });
    
    console.log(`✅ Updated ${result.count} user(s)`);
    
    // Verify it worked
    const admin = await prisma.user.findFirst({
      where: { username: 'admin' }
    });
    
    if (admin) {
      const testPassword = await bcrypt.compare('admin123', admin.password);
      console.log('🔑 Password test:', testPassword ? 'PASSED' : 'FAILED');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();