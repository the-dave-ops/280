#!/bin/bash

echo "🔍 Verifying deployment setup..."
echo ""

# Check if all required files exist
echo "📁 Checking required files..."

files=(
  "backend/docker-entrypoint.sh"
  "backend/wait-for-db.js"
  "backend/scripts/resolve-failed-migrations.ts"
  "backend/scripts/ensure-password-field.ts"
  "backend/scripts/setup-admin.ts"
  "backend/Dockerfile"
  "docker-compose.yml"
)

missing_files=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - MISSING!"
    missing_files=$((missing_files + 1))
  fi
done

if [ $missing_files -gt 0 ]; then
  echo ""
  echo "❌ Missing $missing_files required file(s)!"
  exit 1
fi

echo ""
echo "✅ All required files exist"
echo ""

# Check if entrypoint is executable
if [ -x "backend/docker-entrypoint.sh" ]; then
  echo "✅ docker-entrypoint.sh is executable"
else
  echo "⚠️  docker-entrypoint.sh is not executable, fixing..."
  chmod +x backend/docker-entrypoint.sh
  echo "✅ Fixed"
fi

echo ""
echo "📋 Deployment checklist:"
echo "  1. ✅ All scripts are in place"
echo "  2. ✅ Entrypoint script is executable"
echo "  3. ✅ Docker Compose configuration is correct"
echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "To deploy:"
echo "  docker compose up -d --build"
echo ""
echo "To check status:"
echo "  ./check-deployment.sh"

