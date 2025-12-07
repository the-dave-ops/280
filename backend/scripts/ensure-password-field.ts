import { Client } from 'pg';

// Parse DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || 'postgresql://optometry_user:optometry_pass@db:5432/optometry_db';
const url = new URL(databaseUrl);
const pgConfig = {
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  database: url.pathname.slice(1) || 'optometry_db',
  user: url.username || 'optometry_user',
  password: url.password || 'optometry_pass',
};

async function ensurePasswordField() {
  const pgClient = new Client(pgConfig);
  
  try {
    await pgClient.connect();
    console.log('🔍 Checking if password field exists...');

    // Check if users table exists
    const tableExists = await pgClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    `);

    if (tableExists.rows.length === 0) {
      console.log('⚠️  Users table does not exist yet, skipping...');
      return;
    }

    // Check if password column exists
    const hasPasswordColumn = await pgClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password'
    `);

    if (hasPasswordColumn.rows.length > 0) {
      console.log('✅ Password field already exists');
      return;
    }

    console.log('⚠️  Password field is missing, adding it...');
    
    // Add password column
    await pgClient.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255);
    `);
    console.log('✅ Added password column');

    // Check if google_id is nullable
    const googleIdInfo = await pgClient.query(`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'google_id'
    `);

    const isGoogleIdNullable = googleIdInfo.rows.length > 0 ? googleIdInfo.rows[0]?.is_nullable === 'YES' : false;

    if (!isGoogleIdNullable && googleIdInfo.rows.length > 0) {
      await pgClient.query(`
        ALTER TABLE "users" ALTER COLUMN "google_id" DROP NOT NULL;
      `);
      console.log('✅ Made google_id nullable');
    }

    console.log('✅ Password field setup complete');
  } catch (error: any) {
    console.error('❌ Error ensuring password field:', error.message);
    // Don't throw - allow the process to continue
  } finally {
    await pgClient.end();
  }
}

async function main() {
  try {
    await ensurePasswordField();
    process.exit(0);
  } catch (error) {
    console.error('Failed to ensure password field:', error);
    process.exit(0); // Don't fail the process
  }
}

main();

