#!/bin/sh
# Don't use set -e here - we want to handle errors gracefully
set +e

echo "🚀 Starting backend initialization..."

# Ensure dependencies are installed (in case volume mount replaced node_modules)
# The volume mount ./backend:/app can replace node_modules, so we need to reinstall if needed
if [ ! -d "node_modules" ] || [ ! -d "node_modules/pg" ]; then
  echo "📦 Installing dependencies (node_modules may have been replaced by volume mount)..."
  npm install
fi

# Wait for database to be ready
echo "⏳ Waiting for database..."
if ! node wait-for-db.js; then
  echo "❌ Failed to connect to database after retries"
  echo "⚠️  Continuing anyway - database may become available later"
fi

# Resolve any failed migrations first (this must succeed or be skipped)
echo "🔧 Resolving failed migrations (if any)..."
npx tsx scripts/resolve-failed-migrations.ts || {
  echo "⚠️  Failed to resolve migrations, but continuing..."
}

# Run Prisma migrations (this is critical)
echo "📦 Running database migrations..."
MIGRATION_RETRIES=0
MAX_MIGRATION_RETRIES=3

while [ $MIGRATION_RETRIES -lt $MAX_MIGRATION_RETRIES ]; do
  if npx prisma migrate deploy; then
    echo "✅ Migrations applied successfully"
    break
  else
    MIGRATION_RETRIES=$((MIGRATION_RETRIES + 1))
    echo "❌ Migration failed (attempt $MIGRATION_RETRIES/$MAX_MIGRATION_RETRIES)"
    
    if [ $MIGRATION_RETRIES -lt $MAX_MIGRATION_RETRIES ]; then
      echo "🔧 Attempting to resolve failed migrations..."
      npx tsx scripts/resolve-failed-migrations.ts || true
      echo "🔄 Retrying migrations..."
      sleep 2
    else
      echo "❌ Migration failed after $MAX_MIGRATION_RETRIES attempts"
      echo "⚠️  Continuing anyway - database may be in inconsistent state"
    fi
  fi
done

# Generate Prisma client (in case it's not generated)
echo "🔧 Generating Prisma client..."
npx prisma generate

# Ensure password field exists (in case migration failed before table creation)
echo "🔧 Ensuring password field exists..."
npx tsx scripts/ensure-password-field.ts || echo "⚠️  Failed to ensure password field (may not be needed)"

# Setup admin user (CRITICAL - must succeed)
echo "👤 Setting up admin user..."
if ! npx tsx scripts/setup-admin.ts; then
  echo "❌ CRITICAL: Failed to setup admin user!"
  echo "⚠️  Retrying admin user setup..."
  sleep 3
  if ! npx tsx scripts/setup-admin.ts; then
    echo "❌ CRITICAL: Admin user setup failed after retry!"
    echo "⚠️  Continuing anyway, but admin user may not be available"
  fi
fi

# Start the application
echo "✅ Initialization complete. Starting application..."
echo "📡 Backend will be available at http://localhost:3001"
echo "🔍 If you see connection errors, check logs with: docker compose logs backend"

# Use exec to replace shell with the command
exec "$@"

