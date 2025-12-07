/**
 * Script to fix mobile numbers that are missing leading zero
 * 
 * Usage:
 *   tsx scripts/fix-mobile-numbers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMobileNumbers() {
  console.log('Starting mobile number fix...');

  // Find all mobile numbers that are 9 digits and start with 5 (missing leading 0)
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        {
          mobile1: {
            not: null,
          },
        },
        {
          mobile2: {
            not: null,
          },
        },
      ],
    },
    select: {
      id: true,
      mobile1: true,
      mobile2: true,
    },
  });

  console.log(`Found ${customers.length} customers with mobile numbers`);

  let fixedCount = 0;
  let skippedCount = 0;

  for (const customer of customers) {
    let needsUpdate = false;
    const updateData: { mobile1?: string; mobile2?: string } = {};

    // Fix mobile1
    if (customer.mobile1) {
      const mobile1 = customer.mobile1.replace(/-/g, ''); // Remove dashes
      // Check if it's 9 digits and starts with 5 (missing leading 0)
      if (/^5\d{8}$/.test(mobile1)) {
        updateData.mobile1 = '0' + mobile1;
        needsUpdate = true;
        fixedCount++;
      } else if (/^5\d{7}$/.test(mobile1)) {
        // 8 digits starting with 5
        updateData.mobile1 = '0' + mobile1;
        needsUpdate = true;
        fixedCount++;
      }
    }

    // Fix mobile2
    if (customer.mobile2) {
      const mobile2 = customer.mobile2.replace(/-/g, ''); // Remove dashes
      // Check if it's 9 digits and starts with 5 (missing leading 0)
      if (/^5\d{8}$/.test(mobile2)) {
        updateData.mobile2 = '0' + mobile2;
        needsUpdate = true;
        fixedCount++;
      } else if (/^5\d{7}$/.test(mobile2)) {
        // 8 digits starting with 5
        updateData.mobile2 = '0' + mobile2;
        needsUpdate = true;
        fixedCount++;
      }
    }

    if (needsUpdate) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: updateData,
      });
    } else {
      skippedCount++;
    }
  }

  console.log('\n=== Fix Summary ===');
  console.log(`Total customers checked: ${customers.length}`);
  console.log(`Mobile numbers fixed: ${fixedCount}`);
  console.log(`Customers skipped: ${skippedCount}`);
  console.log('\nFix completed!');
}

async function main() {
  try {
    await fixMobileNumbers();
  } catch (error: any) {
    console.error('Fix failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { fixMobileNumbers };

