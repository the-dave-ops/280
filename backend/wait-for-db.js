const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function waitForDatabase() {
  let retries = 30;
  while (retries > 0) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database is ready!');
      await prisma.$disconnect();
      process.exit(0);
    } catch (error) {
      console.log(`⏳ Waiting for database... (${retries} retries left)`);
      retries--;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  console.error('❌ Database connection failed after 30 retries');
  process.exit(1);
}

waitForDatabase();

