#!/bin/bash
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed successfully!"
echo "🚀 Starting application..."
exec "$@"
