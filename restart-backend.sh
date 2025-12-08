#!/bin/bash

echo "🔄 Restarting Backend Server..."
echo "================================"

# Find and kill the old backend process
echo "🛑 Stopping old backend process..."
pkill -f "tsx watch src/index.ts" || echo "No old process found"
sleep 2

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Regenerate Prisma Client
echo "🔧 Regenerating Prisma Client..."
npx prisma generate

# Start the backend server
echo "🚀 Starting backend server..."
npm run dev &

echo ""
echo "✅ Backend server is starting..."
echo "   Check logs with: tail -f backend/logs.txt"
echo "   Or check if it's running: curl http://localhost:3001/api/customers"
echo ""
