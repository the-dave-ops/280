/**
 * Migration script to import customers from XML file to PostgreSQL database
 * 
 * Usage:
 *   tsx scripts/migrate-customers.ts <path-to-xml-file> [default-branch-name]
 * 
 * Example:
 *   tsx scripts/migrate-customers.ts ../original/אנשים.xml אלעד
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';

const prisma = new PrismaClient();

// Default branch name (can be overridden via command line argument)
let DEFAULT_BRANCH_NAME: string | null = null;

// Mapping from XML field names to Prisma Customer model fields
interface XmlCustomer {
  'מזהה_x0020_איש'?: string;
  'תאריך'?: string;
  'שם_x0020_משפחה'?: string;
  'שם_x0020_פרטי'?: string;
  'תעודת_x0020_זהות'?: string;
  'דרכון'?: string;
  'תאריך_x0020_לידה'?: string;
  'רחוב'?: string;
  'מספר_x0020_בית'?: string;
  'כניסה'?: string;
  'דירה'?: string;
  'עיר'?: string;
  'טלפון'?: string;
  'נייד_x0020_1'?: string;
  'נייד_x0020_2'?: string;
  'קופת_x0020_חולים'?: string;
  'קטגוריה'?: string;
  'תאריך_x0020_קליטה'?: string;
  'מזהה_x0020_עובד'?: string;
  'מזהה_x0020_מחשב'?: string;
}

interface ParsedCustomer {
  date?: Date | null;
  lastName?: string | null;
  firstName?: string | null;
  idNumber?: string | null;
  isPassport?: boolean;
  birthDate?: Date | null;
  street?: string | null;
  houseNumber?: string | null;
  entrance?: string | null;
  apartment?: number | null;
  city?: string | null;
  phone?: string | null;
  mobile1?: string | null;
  mobile2?: string | null;
  healthFund?: string | null;
  category?: string | null;
  admissionDate?: Date | null;
  employeeId?: number | null;
  computerId?: number | null;
  branchId?: number | null;
}

/**
 * Parse XML date string to Date object
 */
function parseDate(dateStr: string | number | object | undefined | null): Date | null {
  if (!dateStr) return null;
  
  // Handle objects (from XML parser)
  if (typeof dateStr === 'object') {
    if (dateStr && typeof dateStr === 'object' && '#text' in dateStr) {
      dateStr = (dateStr as any)['#text'];
    } else {
      return null;
    }
  }
  
  const str = String(dateStr).trim();
  if (str === '') return null;
  
  try {
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Parse boolean from string (0/1 or true/false)
 */
function parseBoolean(value: string | number | object | undefined | null): boolean {
  if (!value) return false;
  
  // Handle objects (from XML parser)
  if (typeof value === 'object') {
    if (value && typeof value === 'object' && '#text' in value) {
      value = (value as any)['#text'];
    } else {
      return false;
    }
  }
  
  const str = String(value).trim();
  return str === '1' || str.toLowerCase() === 'true' || str === 'כן';
}

/**
 * Parse integer from string
 */
function parseIntSafe(value: string | number | object | undefined | null): number | null {
  if (!value) return null;
  
  // Handle objects (from XML parser)
  if (typeof value === 'object') {
    if (value && typeof value === 'object' && '#text' in value) {
      value = (value as any)['#text'];
    } else {
      return null;
    }
  }
  
  // If already a number, return it
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  const str = String(value).trim();
  if (str === '') return null;
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Clean string value (trim and return null if empty)
 * Special handling for phone numbers to preserve leading zeros
 */
function cleanString(value: string | number | object | undefined | null, isPhoneNumber: boolean = false): string | null {
  if (!value) return null;
  
  // Handle objects (from XML parser)
  if (typeof value === 'object') {
    // If it's an object with text content, extract it
    if (value && typeof value === 'object' && '#text' in value) {
      value = (value as any)['#text'];
    } else {
      // Try to stringify or return null
      return null;
    }
  }
  
  // If it's a number, convert to string carefully to preserve leading zeros
  // For phone numbers that might have been parsed as numbers
  if (typeof value === 'number') {
    const numStr = value.toString();
    
    // If this is a phone number field and the number looks like a phone number
    if (isPhoneNumber) {
      // Landline phone numbers: 8 digits starting with 2, 3, 4, 8, or 9 (missing leading 0)
      // Example: 89750141 should become 089750141
      if (numStr.length === 8 && /^[23489]/.test(numStr)) {
        return '0' + numStr;
      }
      // Landline phone numbers: 9 digits starting with 2, 3, 4, 8, or 9 (already has leading 0, but parsed as number)
      // This shouldn't happen, but handle it just in case
      if (numStr.length === 9 && /^[23489]/.test(numStr)) {
        return '0' + numStr;
      }
      // Mobile numbers: 9 digits starting with 5 (missing leading 0)
      if (numStr.length === 9 && numStr.startsWith('5')) {
        return '0' + numStr;
      }
      // Mobile numbers: 8 digits starting with 5 (missing leading 0)
      if (numStr.length === 8 && numStr.startsWith('5')) {
        return '0' + numStr;
      }
    }
    // Otherwise, just convert to string
    return numStr;
  }
  
  // Convert to string
  const str = String(value).trim();
  
  // For phone numbers, also check if it's a string that looks like a number missing leading 0
  if (isPhoneNumber && str) {
    // Remove any non-digit characters first
    const digitsOnly = str.replace(/\D/g, '');
    
    // Landline: 8 digits starting with 2, 3, 4, 8, or 9 (missing leading 0)
    if (digitsOnly.length === 8 && /^[23489]/.test(digitsOnly)) {
      return '0' + digitsOnly;
    }
    // Mobile: 9 digits starting with 5 (missing leading 0)
    if (digitsOnly.length === 9 && digitsOnly.startsWith('5')) {
      return '0' + digitsOnly;
    }
    // Mobile: 8 digits starting with 5 (missing leading 0)
    if (digitsOnly.length === 8 && digitsOnly.startsWith('5')) {
      return '0' + digitsOnly;
    }
    
    // Return cleaned digits only
    return digitsOnly === '' ? null : digitsOnly;
  }
  
  return str === '' ? null : str;
}

/**
 * Convert XML customer data to Prisma Customer format
 */
function convertXmlToCustomer(xml: XmlCustomer, defaultBranchId?: number | null): ParsedCustomer {
  return {
    date: parseDate(xml['תאריך']),
    lastName: cleanString(xml['שם_x0020_משפחה']),
    firstName: cleanString(xml['שם_x0020_פרטי']),
    idNumber: cleanString(xml['תעודת_x0020_זהות']),
    isPassport: parseBoolean(xml['דרכון']),
    birthDate: parseDate(xml['תאריך_x0020_לידה']),
    street: cleanString(xml['רחוב']),
    houseNumber: cleanString(xml['מספר_x0020_בית']),
    entrance: cleanString(xml['כניסה']),
    apartment: parseIntSafe(xml['דירה']),
    city: cleanString(xml['עיר']),
    phone: cleanString(xml['טלפון'], true), // Phone number
    mobile1: cleanString(xml['נייד_x0020_1'], true), // Phone number
    mobile2: cleanString(xml['נייד_x0020_2'], true), // Phone number
    healthFund: cleanString(xml['קופת_x0020_חולים']), // Health fund
    category: cleanString(xml['קטגוריה']),
    admissionDate: parseDate(xml['תאריך_x0020_קליטה']),
    employeeId: parseIntSafe(xml['מזהה_x0020_עובד']),
    // Use מזהה איש as computer_id for linking with prescriptions
    // The prescription file uses this ID to link to customers
    computerId: parseIntSafe(xml['מזהה_x0020_איש']) || parseIntSafe(xml['מזהה_x0020_מחשב']),
    branchId: defaultBranchId || undefined,
  };
}

/**
 * Get or create branch by name
 */
async function getOrCreateBranch(branchName: string): Promise<number> {
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

  return branch.id;
}

/**
 * Main migration function
 */
async function migrateCustomers(xmlFilePath: string, defaultBranchName?: string | null) {
  console.log(`Starting migration from: ${xmlFilePath}`);
  
  // Get default branch ID if provided
  let defaultBranchId: number | null = null;
  if (defaultBranchName) {
    defaultBranchId = await getOrCreateBranch(defaultBranchName);
    console.log(`Using default branch: ${defaultBranchName} (ID: ${defaultBranchId})`);
  }
  
  // Check if file exists
  if (!fs.existsSync(xmlFilePath)) {
    throw new Error(`XML file not found: ${xmlFilePath}`);
  }

  // Read XML file
  console.log('Reading XML file...');
  const xmlContent = fs.readFileSync(xmlFilePath, 'utf-8');

  // Parse XML
  console.log('Parsing XML...');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: false, // Don't auto-parse, we'll handle it
    trimValues: true,
    parseTrueNumberOnly: false, // Don't auto-parse numbers - keep as strings
    arrayMode: false,
    alwaysCreateTextNode: true, // Always create #text nodes
  });

  const parsed = parser.parse(xmlContent);
  
  // Extract customers array
  const dataroot = parsed.dataroot;
  if (!dataroot || !dataroot['אנשים']) {
    throw new Error('Invalid XML structure: missing dataroot or אנשים elements');
  }

  let xmlCustomers: XmlCustomer[];
  const אנשיםData = dataroot['אנשים'];
  
  if (Array.isArray(אנשיםData)) {
    xmlCustomers = אנשיםData;
  } else if (typeof אנשיםData === 'object') {
    // Single customer or object with nested structure
    xmlCustomers = [אנשיםData];
  } else {
    throw new Error('Invalid XML structure: אנשים is not an array or object');
  }

  console.log(`Found ${xmlCustomers.length} customers in XML file`);

  // Convert and insert customers
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors: Array<{ index: number; error: string }> = [];

  console.log('Starting database insertion...');

  // Process in batches to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < xmlCustomers.length; i += batchSize) {
    const batch = xmlCustomers.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(xmlCustomers.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, xmlCustomers.length)})`);

    for (let j = 0; j < batch.length; j++) {
      const xmlCustomer = batch[j];
      const index = i + j;

      try {
        const customerData = convertXmlToCustomer(xmlCustomer, defaultBranchId);

        // Skip if no ID number (required for uniqueness check)
        if (!customerData.idNumber) {
          skipCount++;
          continue;
        }

        // Check if customer already exists (by idNumber)
        const existing = await prisma.customer.findUnique({
          where: { idNumber: customerData.idNumber },
        });

        if (existing) {
          // Update existing customer - merge data, but preserve existing branch_id if new one is not provided
          const updateData = { ...customerData };
          // Only update branch_id if it's provided in the migration
          if (defaultBranchId && !existing.branchId) {
            updateData.branchId = defaultBranchId;
          } else if (!defaultBranchId) {
            // Don't update branch_id if not provided
            delete updateData.branchId;
          }
          
          await prisma.customer.update({
            where: { idNumber: customerData.idNumber },
            data: updateData,
          });
          successCount++;
        } else {
          // Create new customer
          await prisma.customer.create({
            data: customerData,
          });
          successCount++;
        }
      } catch (error: any) {
        errorCount++;
        const errorMsg = error.message || String(error);
        errors.push({ index: index + 1, error: errorMsg });
        
        // Log error but continue
        console.error(`Error processing customer at index ${index + 1}:`, errorMsg);
      }
    }

    // Log progress
    if ((i + batchSize) % 1000 === 0 || i + batchSize >= xmlCustomers.length) {
      console.log(`Progress: ${Math.min(i + batchSize, xmlCustomers.length)}/${xmlCustomers.length} processed`);
    }
  }

  // Print summary
  console.log('\n=== Migration Summary ===');
  console.log(`Total customers in XML: ${xmlCustomers.length}`);
  console.log(`Successfully imported/updated: ${successCount}`);
  console.log(`Skipped (no ID number): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\n=== First 10 Errors ===');
    errors.slice(0, 10).forEach(({ index, error }) => {
      console.log(`Index ${index}: ${error}`);
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
  const xmlFilePath = process.argv[2];
  const defaultBranchName = process.argv[3] || null;

  if (!xmlFilePath) {
    console.error('Usage: tsx scripts/migrate-customers.ts <path-to-xml-file> [default-branch-name]');
    console.error('Example: tsx scripts/migrate-customers.ts ../original/אנשים.xml אלעד');
    process.exit(1);
  }

  // Resolve absolute path
  const absolutePath = path.isAbsolute(xmlFilePath)
    ? xmlFilePath
    : path.resolve(process.cwd(), xmlFilePath);

  try {
    await migrateCustomers(absolutePath, defaultBranchName);
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

export { migrateCustomers, convertXmlToCustomer };

