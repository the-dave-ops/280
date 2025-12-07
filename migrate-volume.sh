#!/bin/bash

set -e

echo "🔄 Migrating PostgreSQL data from named volume to mounted volume..."
echo ""

# Stop containers
echo "⏹️  Stopping containers..."
docker compose down

# Find the correct volume name
VOLUME_NAME="280-new_postgres_data"
if ! docker volume inspect "$VOLUME_NAME" > /dev/null 2>&1; then
  echo "⚠️  Named volume '$VOLUME_NAME' not found. Searching for postgres volume..."
  # Try to find volume by checking what the container was using
  VOLUME_NAME=$(docker volume ls | grep -E "(280-new|postgres)" | grep -v "financial\|github\|gihub\|docker-pilot\|3_" | awk '{print $2}' | head -1)
  if [ -z "$VOLUME_NAME" ]; then
    echo "❌ No postgres volume found. Creating new mounted volume..."
    mkdir -p ./database/data
    chmod 700 ./database/data
    echo "✅ Created ./database/data directory"
    # Still update docker-compose.yml
    if grep -q "postgres_data:" docker-compose.yml; then
      cp docker-compose.yml docker-compose.yml.backup
      sed -i 's|- postgres_data:/var/lib/postgresql/data|- ./database/data:/var/lib/postgresql/data|g' docker-compose.yml
      # Remove volumes section if it only contains postgres_data
      sed -i '/^volumes:$/,/^[^ ]/ { /postgres_data:/d; }' docker-compose.yml
      # Remove empty volumes section
      sed -i '/^volumes:$/{ N; /^volumes:\n$/d; }' docker-compose.yml
    fi
    exit 0
  fi
  echo "📦 Found volume: $VOLUME_NAME"
fi

echo "📦 Using volume: $VOLUME_NAME"

# Create target directory
TARGET_DIR="./database/data"
echo "📁 Creating target directory: $TARGET_DIR"
mkdir -p "$TARGET_DIR"
chmod 700 "$TARGET_DIR"

# Create temporary container to copy data
TEMP_CONTAINER="postgres-migration-temp-$(date +%s)"
echo "📦 Creating temporary container to copy data..."

# Start a temporary postgres container with the named volume
docker run -d \
  --name "$TEMP_CONTAINER" \
  -v "$VOLUME_NAME:/source:ro" \
  -v "$(pwd)/$TARGET_DIR:/target" \
  postgres:15-alpine \
  sh -c "while true; do sleep 3600; done"

# Wait for container to be ready
sleep 2

# Copy data from source to target
echo "📋 Copying data from volume to mounted directory..."
if docker exec "$TEMP_CONTAINER" test -d /source && [ "$(docker exec "$TEMP_CONTAINER" ls -A /source 2>/dev/null | wc -l)" -gt 0 ]; then
  echo "   Copying files..."
  docker exec "$TEMP_CONTAINER" sh -c "cp -a /source/. /target/ 2>&1"
  echo "✅ Data copied successfully"
  
  # Set correct permissions (PostgreSQL runs as user 999)
  echo "🔐 Setting correct permissions..."
  docker exec "$TEMP_CONTAINER" sh -c "chown -R 999:999 /target 2>/dev/null || true"
else
  echo "⚠️  Source directory is empty (new database) - no data to copy"
fi

# Clean up temporary container
echo "🧹 Cleaning up temporary container..."
docker rm -f "$TEMP_CONTAINER"

# Update docker-compose.yml
echo "📝 Updating docker-compose.yml..."
if grep -q "postgres_data:" docker-compose.yml; then
  # Backup original file
  cp docker-compose.yml docker-compose.yml.backup
  echo "📋 Backup saved as docker-compose.yml.backup"
  
  # Replace named volume with bind mount
  sed -i 's|- postgres_data:/var/lib/postgresql/data|- ./database/data:/var/lib/postgresql/data|g' docker-compose.yml
  
  # Remove postgres_data from volumes section
  # Check if there are other volumes defined
  OTHER_VOLUMES=$(grep -A 10 "^volumes:" docker-compose.yml | grep -v "postgres_data" | grep -E "^  [a-z]" | wc -l)
  if [ "$OTHER_VOLUMES" -gt 0 ]; then
    # There are other volumes, just remove postgres_data line
    sed -i '/^  postgres_data:/d' docker-compose.yml
  else
    # Only postgres_data or empty, remove the entire volumes section
    sed -i '/^volumes:$/,/^[^ ]/{ /^volumes:$/d; /^  postgres_data:/d; }' docker-compose.yml
  fi
  
  echo "✅ docker-compose.yml updated"
else
  echo "⚠️  Volume configuration not found in docker-compose.yml"
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Summary:"
echo "  - Data copied to: $TARGET_DIR"
echo "  - docker-compose.yml updated to use mounted volume"
echo "  - Backup saved as: docker-compose.yml.backup"
echo ""
echo "📋 Next steps:"
echo "  1. Review the changes: diff docker-compose.yml docker-compose.yml.backup"
echo "  2. Start the containers: docker compose up -d"
echo "  3. Verify everything works correctly"
echo ""
echo "⚠️  The named volume '$VOLUME_NAME' still exists but is no longer used."
echo "   After verifying everything works, you can remove it with:"
echo "   docker volume rm $VOLUME_NAME"
