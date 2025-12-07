import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';

const prisma = new PrismaClient();

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

async function resolveFailedMigrations() {
  const pgClient = new Client(pgConfig);
  
  try {
    await pgClient.connect();
    console.log('🔍 Checking for failed migrations...');

    // Check for failed migrations
    const failedMigrations = await pgClient.query(`
      SELECT migration_name, started_at, finished_at, applied_steps_count, rolled_back_at
      FROM _prisma_migrations
      WHERE finished_at IS NULL AND rolled_back_at IS NULL
      ORDER BY started_at DESC
    `);

    if (failedMigrations.rows.length === 0) {
      console.log('✅ No failed migrations found');
      return;
    }

    console.log(`⚠️  Found ${failedMigrations.rows.length} failed migration(s):`);
    failedMigrations.rows.forEach((row: any) => {
      console.log(`   - ${row.migration_name} (started at ${row.started_at})`);
    });

    // For each failed migration, check if the changes were already applied
    for (const migration of failedMigrations.rows) {
      const migrationName = migration.migration_name;
      
      // Check if password column exists (for the add_password_field migration)
      if (migrationName.includes('password') || migrationName.includes('password_field')) {
        // First check if the users table exists
        const tableExists = await pgClient.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'users'
        `);

        if (tableExists.rows.length === 0) {
          console.log(`⚠️  Table 'users' does not exist yet. Migration ${migrationName} will be applied after table creation.`);
          console.log(`   Deleting migration record so it can be retried after table creation...`);
          // Delete the migration record so Prisma can retry it after the table is created
          await pgClient.query(`
            DELETE FROM _prisma_migrations
            WHERE migration_name = $1
          `, [migrationName]);
          console.log(`✅ Migration ${migrationName} record deleted - will be retried after table creation`);
          continue;
        }

        const hasPasswordColumn = await pgClient.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'password'
        `);

        const googleIdInfo = await pgClient.query(`
          SELECT is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'google_id'
        `);

        const isGoogleIdNullable = googleIdInfo.rows.length > 0 ? googleIdInfo.rows[0]?.is_nullable === 'YES' : false;

        if (hasPasswordColumn.rows.length > 0 && isGoogleIdNullable) {
          console.log(`✅ Migration ${migrationName} changes already applied, marking as resolved...`);
          
          // Mark migration as applied
          await pgClient.query(`
            UPDATE _prisma_migrations
            SET finished_at = NOW(),
                applied_steps_count = 2
            WHERE migration_name = $1
          `, [migrationName]);
          
          console.log(`✅ Migration ${migrationName} marked as resolved`);
        } else {
          console.log(`⚠️  Migration ${migrationName} changes not fully applied, attempting to apply...`);
          
          // Try to apply the migration manually
          try {
            // Add password column if it doesn't exist
            if (hasPasswordColumn.rows.length === 0) {
              await pgClient.query(`
                ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255);
              `);
              console.log('   ✓ Added password column');
            }
            
            // Make google_id nullable if it's not already
            if (!isGoogleIdNullable && googleIdInfo.rows.length > 0) {
              // Drop NOT NULL constraint if exists
              await pgClient.query(`
                ALTER TABLE "users" ALTER COLUMN "google_id" DROP NOT NULL;
              `);
              console.log('   ✓ Made google_id nullable');
            }
            
            // Mark as applied
            await pgClient.query(`
              UPDATE _prisma_migrations
              SET finished_at = NOW(),
                  applied_steps_count = 2
              WHERE migration_name = $1
            `, [migrationName]);
            
            console.log(`✅ Migration ${migrationName} applied successfully`);
          } catch (error: any) {
            console.error(`❌ Failed to apply migration ${migrationName}:`, error.message);
            // If error is about column already exists, mark as applied
            if (error.message.includes('already exists')) {
              console.log(`⚠️  Migration ${migrationName} appears to be already applied, marking as resolved...`);
              await pgClient.query(`
                UPDATE _prisma_migrations
                SET finished_at = NOW(),
                    applied_steps_count = 2
                WHERE migration_name = $1
              `, [migrationName]);
            } else {
              // Rollback the migration record so it can be retried
              await pgClient.query(`
                UPDATE _prisma_migrations
                SET rolled_back_at = NOW()
                WHERE migration_name = $1
              `, [migrationName]);
              console.log(`⚠️  Migration ${migrationName} marked as rolled back (will be retried)`);
            }
          }
        }
      } else {
        // For other migrations, check if we can determine if they're already applied
        console.log(`⚠️  Unknown migration type: ${migrationName}`);
        console.log(`   Attempting to mark as rolled back to allow new migrations...`);
        await pgClient.query(`
          UPDATE _prisma_migrations
          SET rolled_back_at = NOW()
          WHERE migration_name = $1
        `, [migrationName]);
        console.log(`✅ Migration ${migrationName} marked as rolled back`);
      }
    }

    console.log('✅ Failed migrations resolved');
  } catch (error: any) {
    console.error('❌ Error resolving failed migrations:', error.message);
    // Don't throw - allow the process to continue
    console.log('⚠️  Continuing despite migration resolution errors...');
  } finally {
    await pgClient.end();
  }
}

async function main() {
  try {
    await resolveFailedMigrations();
    process.exit(0);
  } catch (error) {
    console.error('Failed to resolve migrations:', error);
    // Don't exit with error - allow the process to continue
    // The migration deploy will handle the actual migration
    process.exit(0);
  } finally {
    await prisma.$disconnect();
  }
}

main();

