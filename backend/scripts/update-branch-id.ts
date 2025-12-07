/**
 * Script to update branch_id for all customers
 * 
 * Usage:
 *   tsx scripts/update-branch-id.ts <branch-name>
 * 
 * Example:
 *   tsx scripts/update-branch-id.ts אלעד
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBranchId(branchName: string) {
  console.log(`Updating branch_id to "${branchName}" for all customers...`);

  // Get or create branch
  let branch = await prisma.branch.findFirst({
    where: { name: branchName },
  });

  if (!branch) {
    console.log(`Creating branch: ${branchName}`);
    branch = await prisma.branch.create({
      data: {
        name: branchName,
      },
    });
  }

  console.log(`Using branch: ${branch.name} (ID: ${branch.id})`);

  // Update all customers that don't have a branch_id
  const result = await prisma.customer.updateMany({
    where: {
      branchId: null,
    },
    data: {
      branchId: branch.id,
    },
  });

  console.log(`\n=== Update Summary ===`);
  console.log(`Customers updated: ${result.count}`);
  console.log(`Branch: ${branch.name} (ID: ${branch.id})`);
  console.log('\nUpdate completed!');
}

async function main() {
  const branchName = process.argv[2];

  if (!branchName) {
    console.error('Usage: tsx scripts/update-branch-id.ts <branch-name>');
    console.error('Example: tsx scripts/update-branch-id.ts אלעד');
    process.exit(1);
  }

  try {
    await updateBranchId(branchName);
  } catch (error: any) {
    console.error('Update failed:', error.message);
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

export { updateBranchId };

