/**
 * Script to fix phone numbers in the database that are missing leading zeros
 * 
 * Usage:
 *   tsx scripts/fix-phone-numbers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix phone numbers that are missing leading zeros
 */
async function fixPhoneNumbers() {
  console.log('Starting phone number fix...');

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { phone: { not: null, not: '' } },
        { mobile1: { not: null, not: '' } },
        { mobile2: { not: null, not: '' } },
      ],
    },
    select: { id: true, phone: true, mobile1: true, mobile2: true },
  });

  console.log(`Found ${customers.length} customers with phone numbers`);

  let fixedCount = 0;
  let skippedCount = 0;

  for (const customer of customers) {
    let updated = false;
    let newPhone = customer.phone;
    let newMobile1 = customer.mobile1;
    let newMobile2 = customer.mobile2;

    // Fix phone (landline) - 8 digits starting with 2, 3, 4, 8, or 9
    if (customer.phone) {
      const phoneDigits = customer.phone.replace(/\D/g, '');
      if (phoneDigits.length === 8 && /^[23489]/.test(phoneDigits)) {
        newPhone = '0' + phoneDigits;
        updated = true;
      } else if (phoneDigits.length === 9 && /^[23489]/.test(phoneDigits)) {
        // Already has 9 digits, but check if it starts with 0
        if (!phoneDigits.startsWith('0')) {
          newPhone = '0' + phoneDigits;
          updated = true;
        }
      }
    }

    // Fix mobile1 - 9 digits starting with 5
    if (customer.mobile1) {
      const mobile1Digits = customer.mobile1.replace(/\D/g, '');
      if (mobile1Digits.length === 9 && mobile1Digits.startsWith('5')) {
        newMobile1 = '0' + mobile1Digits;
        updated = true;
      } else if (mobile1Digits.length === 8 && mobile1Digits.startsWith('5')) {
        newMobile1 = '0' + mobile1Digits;
        updated = true;
      }
    }

    // Fix mobile2 - 9 digits starting with 5
    if (customer.mobile2) {
      const mobile2Digits = customer.mobile2.replace(/\D/g, '');
      if (mobile2Digits.length === 9 && mobile2Digits.startsWith('5')) {
        newMobile2 = '0' + mobile2Digits;
        updated = true;
      } else if (mobile2Digits.length === 8 && mobile2Digits.startsWith('5')) {
        newMobile2 = '0' + mobile2Digits;
        updated = true;
      }
    }

    if (updated) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { 
          phone: newPhone,
          mobile1: newMobile1,
          mobile2: newMobile2,
        },
      });
      fixedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('\n=== Fix Summary ===');
  console.log(`Total customers checked: ${customers.length}`);
  console.log(`Phone numbers fixed: ${fixedCount}`);
  console.log(`Customers skipped: ${skippedCount}`);
  console.log('\nFix completed!');
}

async function main() {
  try {
    await fixPhoneNumbers();
  } catch (error: any) {
    console.error('Fix failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

