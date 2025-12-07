# Migration Scripts

This directory contains migration scripts for importing data from legacy systems.

## Available Scripts

### 1. Customer Migration (`migrate-customers.ts`)

Imports customers from XML file to PostgreSQL database.

**Usage:**
```bash
npm run migrate:customers <path-to-xml-file> [default-branch-name]
```

**Example:**
```bash
npm run migrate:customers ../original/אנשים.xml אלעד
```

**Features:**
- Parses XML file with customer data
- Handles phone number formatting (preserves leading zeros)
- Maps old system fields to new database schema
- Supports default branch assignment
- Updates existing customers or creates new ones

### 2. Prescription Migration (`migrate-prescriptions.ts`)

Imports prescriptions from HTML file to PostgreSQL database.

**Usage:**
```bash
npm run migrate:prescriptions <path-to-html-file> [default-branch-name]
```

**Example:**
```bash
npm run migrate:prescriptions ../original/מרשמים.html אלעד
```

**Features:**
- Parses HTML table with prescription data
- Links prescriptions to customers by `computer_id` (from old system)
- Maps prescription fields (R, L, PD, Cyl, Ax, etc.)
- Handles different prescription types (מרחק, קריאה, עדשות מגע)
- Supports default branch assignment
- Updates existing prescriptions or creates new ones

**Important Notes:**
- The script links prescriptions to customers using the `computer_id` field
- If `computer_id` was not migrated in the customer migration, you may need to:
  1. Re-run the customer migration to include `computer_id`
  2. Or update the prescription migration script to use an alternative linking method

### 3. Fix Mobile Numbers (`fix-mobile-numbers.ts`)

Fixes mobile numbers that are missing leading zeros.

**Usage:**
```bash
npm run fix:mobiles
```

### 4. Fix Phone Numbers (`fix-phone-numbers.ts`)

Fixes landline phone numbers that are missing leading zeros.

**Usage:**
```bash
npm run fix:phones
```

### 5. Update Branch ID (`update-branch-id.ts`)

Updates all customers to a specific branch.

**Usage:**
```bash
npm run update:branch <branch-name>
```

**Example:**
```bash
npm run update:branch אלעד
```

## Running Scripts

All scripts should be run from within the Docker container:

```bash
docker compose exec backend npm run migrate:customers <args>
docker compose exec backend npm run migrate:prescriptions <args>
```

Or directly with tsx:

```bash
docker compose exec backend npx tsx scripts/migrate-customers.ts <args>
docker compose exec backend npx tsx scripts/migrate-prescriptions.ts <args>
```

## File Locations

- Customer XML file: `original/אנשים.xml`
- Prescription HTML file: `original/מרשמים.html`

Make sure these files are accessible from within the Docker container. You may need to copy them to the `backend` directory:

```bash
cp original/אנשים.xml backend/
cp original/מרשמים.html backend/
```

Then run the migration with the file path relative to the backend directory:

```bash
docker compose exec backend npm run migrate:customers /app/אנשים.xml אלעד
docker compose exec backend npm run migrate:prescriptions /app/מרשמים.html אלעד
```
