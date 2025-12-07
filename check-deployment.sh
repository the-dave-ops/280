#!/bin/bash

echo "🔍 Checking deployment status..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker first."
  exit 1
fi

echo "✅ Docker is running"
echo ""

# Check containers
echo "📦 Checking containers..."
docker compose ps

echo ""
echo "🔍 Checking backend logs (last 20 lines)..."
docker compose logs backend --tail 20

echo ""
echo "🔍 Checking if backend is responding..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "✅ Backend is responding at http://localhost:3001"
else
  echo "❌ Backend is not responding at http://localhost:3001"
  echo ""
  echo "📋 Full backend logs:"
  docker compose logs backend --tail 50
fi

echo ""
echo "🔍 Checking frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Frontend is responding at http://localhost:3000"
else
  echo "⚠️  Frontend may still be starting..."
fi

echo ""
echo "📝 To view logs:"
echo "   docker compose logs backend"
echo "   docker compose logs frontend"
echo "   docker compose logs db"

