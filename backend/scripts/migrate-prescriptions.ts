/**
 * Migration script to import prescriptions from HTML file to PostgreSQL database
 * 
 * Usage:
 *   tsx scripts/migrate-prescriptions.ts <path-to-html-file> [default-branch-name]
 * 
 * Example:
 *   tsx scripts/migrate-prescriptions.ts ../original/מרשמים.html אלעד
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as htmlparser2 from 'htmlparser2';

const prisma = new PrismaClient();

// Mapping of HTML table cells to prescription fields
// Based on analysis: 44 cells total
// Cell 1: Prescription ID (old system)
// Cell 2: Customer ID (old system - computer_id)
// Cell 3: R (Right eye sphere)
// Cell 4: Cyl R (Right cylinder) - optional
// Cell 5: Ax R (Right axis) - optional
// Cell 6-7: Empty
// Cell 8: L (Left eye sphere)
// Cell 9: Cyl L (Left cylinder)
// Cell 10: Ax L (Left axis)
// Cell 11: PD (Pupillary Distance)
// Cell 12-14: Empty
// Cell 15: 0 (unknown)
// Cell 16-19: Empty
// Cell 20: Optometrist ID
// Cell 21: Branch ID
// Cell 22: Empty
// Cell 23: Date (DD/MM/YYYY)
// Cell 24: Empty
// Cell 25: Update Date (DD/MM/YYYY)
// Cell 26-28: Empty
// Cell 29: Price
// Cell 30: Type (מרחק, קריאה, עדשות מגע)
// Cell 31: Empty
// Cell 32: 0 (unknown)
// Cell 33-44: Empty or additional fields

interface ParsedPrescription {
  oldPrescriptionId?: number;
  oldCustomerId?: number; // This is the computer_id from old system
  r?: number | null;
  l?: number | null;
  cylR?: number | null;
  axR?: number | null;
  cylL?: number | null;
  axL?: number | null;
  pd?: number | null;
  optometristId?: number | null;
  branchId?: number | null;
  date?: Date | null;
  updateDate?: Date | null;
  price?: number | null;
  type?: string | null;
  customerId?: number; // Will be resolved from oldCustomerId
}

/**
 * Parse date string in DD/MM/YYYY format
 */
function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  
  try {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    
    return date;
  } catch {
    return null;
  }
}

/**
 * Parse number from string
 */
function parseFloatSafe(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null;
  
  const cleaned = value.trim();
  if (cleaned === '' || cleaned === '-') return null;
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse integer from string
 */
function parseIntSafe(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null;
  
  const cleaned = value.trim();
  if (cleaned === '' || cleaned === '-') return null;
  
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Clean and decode HTML entity
 */
function cleanHtmlValue(value: string): string {
  // Decode HTML entities
  return value
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Parse prescription type
 */
function parsePrescriptionType(typeStr: string | null | undefined): 'מרחק' | 'קריאה' | 'עדשות מגע' | null {
  if (!typeStr) return null;
  
  const cleaned = cleanHtmlValue(typeStr).toLowerCase();
  if (cleaned.includes('מרחק')) return 'מרחק';
  if (cleaned.includes('קריאה') || cleaned.includes('קריא')) return 'קריאה';
  if (cleaned.includes('עדשות') || cleaned.includes('מגע')) return 'עדשות מגע';
  
  return null;
}

/**
 * Convert HTML row cells to prescription data
 */
function parsePrescriptionRow(cells: string[]): ParsedPrescription | null {
  if (cells.length < 30) {
    return null; // Not enough cells
  }
  
  const oldPrescriptionId = parseIntSafe(cells[0]);
  const oldCustomerId = parseIntSafe(cells[1]);
  
  // Skip if no customer ID
  if (!oldCustomerId) {
    return null;
  }
  
  const r = parseFloatSafe(cells[2]);
  const cylR = parseFloatSafe(cells[3]);
  const axR = parseIntSafe(cells[4]);
  const l = parseFloatSafe(cells[7]);
  const cylL = parseFloatSafe(cells[8]);
  const axL = parseIntSafe(cells[9]);
  const pd = parseFloatSafe(cells[10]);
  
  const optometristId = parseIntSafe(cells[19]);
  const branchId = parseIntSafe(cells[20]);
  
  const date = parseDate(cells[22]);
  const updateDate = parseDate(cells[24]);
  
  const price = parseFloatSafe(cells[28]);
  const type = parsePrescriptionType(cells[29]);
  
  return {
    oldPrescriptionId,
    oldCustomerId,
    r: r || null,
    l: l || null,
    cylR: cylR || null,
    axR: axR || null,
    cylL: cylL || null,
    axL: axL || null,
    pd: pd || null,
    optometristId: optometristId || null,
    branchId: branchId || null,
    date: date || null,
    updateDate: updateDate || null,
    price: price || null,
    type: type || null,
  };
}

/**
 * Find customer by old computer_id
 * The oldCustomerId from prescriptions matches computer_id in customers
 * 
 * Note: If computer_id was not migrated, this will return null.
 * In that case, we need to update the customer migration to include computer_id.
 */
async function findCustomerByOldId(oldCustomerId: number): Promise<number | null> {
  // First try to find by computer_id
  const customerByComputerId = await prisma.customer.findFirst({
    where: {
      computerId: oldCustomerId,
    },
    select: { id: true },
  });
  
  if (customerByComputerId) {
    return customerByComputerId.id;
  }
  
  // If not found by computer_id, try to find by employee_id (as fallback)
  // This is a workaround if computer_id wasn't migrated
  const customerByEmployeeId = await prisma.customer.findFirst({
    where: {
      employeeId: oldCustomerId,
    },
    select: { id: true },
  });
  
  return customerByEmployeeId?.id || null;
}

/**
 * Get or create branch by ID
 */
async function getOrCreateBranch(branchId: number): Promise<number | null> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });
  
  if (branch) {
    return branch.id;
  }
  
  // If branch doesn't exist, return null (will use default branch)
  console.warn(`Branch ID ${branchId} not found in database`);
  return null;
}

/**
 * Validate optometrist ID exists
 */
async function validateOptometristId(optometristId: number | null | undefined): Promise<number | null> {
  if (!optometristId) return null;
  
  const optometrist = await prisma.optometrist.findUnique({
    where: { id: optometristId },
  });
  
  if (optometrist) {
    return optometrist.id;
  }
  
  // If optometrist doesn't exist, return null (will be set to null in prescription)
  return null;
}

/**
 * Main migration function
 */
async function migratePrescriptions(htmlFilePath: string, defaultBranchName?: string | null) {
  console.log(`Starting prescription migration from: ${htmlFilePath}`);
  
  // Get default branch ID if provided
  let defaultBranchId: number | null = null;
  if (defaultBranchName) {
    const branch = await prisma.branch.findFirst({
      where: { name: defaultBranchName },
    });
    if (branch) {
      defaultBranchId = branch.id;
      console.log(`Using default branch: ${defaultBranchName} (ID: ${defaultBranchId})`);
    } else {
      console.warn(`Warning: Default branch "${defaultBranchName}" not found.`);
    }
  }
  
  // Check if file exists
  if (!fs.existsSync(htmlFilePath)) {
    throw new Error(`HTML file not found: ${htmlFilePath}`);
  }
  
  // Read HTML file
  console.log('Reading HTML file...');
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
  
  // Parse HTML
  console.log('Parsing HTML...');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let inTableCell = false;
  let currentCell = '';
  
  const parser = new htmlparser2.Parser({
    onopentag(name, attribs) {
      if (name === 'tr') {
        currentRow = [];
      } else if (name === 'td') {
        inTableCell = true;
        currentCell = '';
      }
    },
    ontext(text) {
      if (inTableCell) {
        currentCell += text;
      }
    },
    onclosetag(name) {
      if (name === 'td') {
        currentRow.push(currentCell);
        inTableCell = false;
        currentCell = '';
      } else if (name === 'tr') {
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [];
      }
    },
  });
  
  parser.write(htmlContent);
  parser.end();
  
  console.log(`Found ${rows.length} rows in HTML file`);
  
  // Parse and insert prescriptions
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors: Array<{ index: number; error: string }> = [];
  
  console.log('Starting database insertion...');
  
  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, rows.length)})`);
    
    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      const index = i + j;
      
      try {
        const prescriptionData = parsePrescriptionRow(row);
        
        if (!prescriptionData) {
          skipCount++;
          continue;
        }
        
        // Find customer by old computer_id
        const customerId = await findCustomerByOldId(prescriptionData.oldCustomerId!);
        
        if (!customerId) {
          // Log warning but don't skip - we'll try to find by other means
          if (skipCount < 10 || (skipCount % 100 === 0)) {
            console.warn(`Customer not found for old ID: ${prescriptionData.oldCustomerId} (row ${index + 1})`);
          }
          skipCount++;
          continue;
        }
        
        // Resolve branch ID
        let branchId = prescriptionData.branchId;
        if (branchId) {
          const resolvedBranchId = await getOrCreateBranch(branchId);
          if (resolvedBranchId) {
            branchId = resolvedBranchId;
          } else {
            branchId = defaultBranchId;
          }
        } else {
          branchId = defaultBranchId;
        }
        
        // Validate optometrist ID
        const validatedOptometristId = await validateOptometristId(prescriptionData.optometristId);
        
        // Check if prescription already exists (by old prescription ID or by customer + date + type)
        const existing = await prisma.prescription.findFirst({
          where: {
            customerId,
            date: prescriptionData.date || undefined,
            type: prescriptionData.type || undefined,
          },
        });
        
        if (existing) {
          // Update existing prescription
          await prisma.prescription.update({
            where: { id: existing.id },
            data: {
              r: prescriptionData.r,
              l: prescriptionData.l,
              cylR: prescriptionData.cylR,
              axR: prescriptionData.axR,
              cylL: prescriptionData.cylL,
              axL: prescriptionData.axL,
              pd: prescriptionData.pd,
              optometristId: validatedOptometristId || undefined,
              branchId: branchId || undefined,
              date: prescriptionData.date || undefined,
              price: prescriptionData.price || 0,
              type: prescriptionData.type || 'מרחק',
            },
          });
          successCount++;
        } else {
          // Create new prescription
          await prisma.prescription.create({
            data: {
              customerId,
              r: prescriptionData.r,
              l: prescriptionData.l,
              cylR: prescriptionData.cylR,
              axR: prescriptionData.axR,
              cylL: prescriptionData.cylL,
              axL: prescriptionData.axL,
              pd: prescriptionData.pd,
              optometristId: validatedOptometristId || undefined,
              branchId: branchId || undefined,
              date: prescriptionData.date || new Date(),
              price: prescriptionData.price || 0,
              type: prescriptionData.type || 'מרחק',
            },
          });
          successCount++;
        }
      } catch (error: any) {
        errorCount++;
        const errorMsg = error.message || String(error);
        errors.push({ index: index + 1, error: errorMsg });
        
        // Log error but continue
        console.error(`Error processing prescription at row ${index + 1}:`, errorMsg);
      }
    }
    
    // Log progress
    if ((i + batchSize) % 1000 === 0 || i + batchSize >= rows.length) {
      console.log(`Progress: ${Math.min(i + batchSize, rows.length)}/${rows.length} processed`);
    }
  }
  
  // Print summary
  console.log('\n=== Migration Summary ===');
  console.log(`Total rows in HTML: ${rows.length}`);
  console.log(`Successfully imported/updated: ${successCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n=== First 10 Errors ===');
    errors.slice(0, 10).forEach(({ index, error }) => {
      console.log(`Row ${index}: ${error}`);
    });
    if (errors.length > 10) {
      console.log(`... and ${errors.length - 10} more errors`);
    }
  }
  
  console.log('\nMigration completed!');
}

/**
 * Main execution
 */
async function main() {
  const htmlFilePath = process.argv[2];
  const defaultBranchName = process.argv[3] || null;
  
  if (!htmlFilePath) {
    console.error('Usage: tsx scripts/migrate-prescriptions.ts <path-to-html-file> [default-branch-name]');
    console.error('Example: tsx scripts/migrate-prescriptions.ts ../original/מרשמים.html אלעד');
    process.exit(1);
  }
  
  // Resolve absolute path
  const absolutePath = path.isAbsolute(htmlFilePath)
    ? htmlFilePath
    : path.resolve(process.cwd(), htmlFilePath);
  
  try {
    await migratePrescriptions(absolutePath, defaultBranchName);
  } catch (error: any) {
    console.error('Migration failed:', error.message);
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

export { migratePrescriptions, parsePrescriptionRow };

