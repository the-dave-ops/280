import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setupAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  console.log(`Setting up admin user: ${adminEmail}`);

  try {
    // Check if admin user exists
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (adminUser) {
      // Update existing user with password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          password: hashedPassword,
          role: 'admin',
          isApproved: true,
          isActive: true,
        },
      });
      console.log(`✅ Updated existing admin user: ${adminEmail}`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Admin',
          role: 'admin',
          isApproved: true,
          isActive: true,
        },
      });
      console.log(`✅ Created new admin user: ${adminEmail}`);
    }

    console.log(`\nAdmin user ready!`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`\n⚠️  Please change the default password after first login!`);
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupAdmin();
}

