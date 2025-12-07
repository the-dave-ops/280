#!/bin/bash

# Nginx Proxy Quick Start Script
# This script helps you start the application with Nginx reverse proxy

echo "🚀 Starting Optometry Application with Nginx Reverse Proxy"
echo "=========================================================="
echo ""

# Check if docker compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "❌ Error: docker compose is not installed"
    exit 1
fi

# Check if .env file exists in frontend
if [ ! -f "../frontend/.env" ]; then
    echo "⚠️  Warning: frontend/.env file not found"
    echo "📝 Creating from .env.example..."
    cp ../frontend/.env.example ../frontend/.env
    echo "✅ Created frontend/.env"
    echo ""
    echo "⚠️  IMPORTANT: Please update frontend/.env with your configuration:"
    echo "   - VITE_API_URL=https://api.280.kesef-kesef.com"
    echo "   - VITE_ALLOWED_HOSTS=280.kesef-kesef.com,localhost,.localhost"
    echo ""
fi

# Check DNS configuration
echo "🔍 Checking DNS configuration..."
echo ""
echo "Please ensure the following DNS records point to this server:"
echo "   - 280.kesef-kesef.com → $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo "   - api.280.kesef-kesef.com → $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo ""

# Ask about SSL
read -p "Do you have SSL certificates configured? (y/n): " has_ssl

if [ "$has_ssl" = "y" ]; then
    echo "✅ Great! Make sure certificates are in nginx/ssl/"
    echo "   - nginx/ssl/280.kesef-kesef.com.crt"
    echo "   - nginx/ssl/280.kesef-kesef.com.key"
    echo "   - nginx/ssl/api.280.kesef-kesef.com.crt"
    echo "   - nginx/ssl/api.280.kesef-kesef.com.key"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to abort..."
else
    echo "⚠️  Running without SSL (HTTP only)"
    echo "   Frontend will be available at: http://280.kesef-kesef.com"
    echo "   Backend API will be available at: http://api.280.kesef-kesef.com"
    echo ""
    echo "   To enable HTTPS later, follow the guide in nginx/NGINX_SETUP.md"
    echo ""
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
cd ..
docker compose down 2>/dev/null
docker compose -f docker compose.nginx.yml down 2>/dev/null

# Start with nginx
echo ""
echo "🚀 Starting services with Nginx proxy..."
docker compose -f docker compose.nginx.yml up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
docker compose -f docker compose.nginx.yml ps

echo ""
echo "✅ Setup Complete!"
echo ""
echo "🌐 Your application should be available at:"
if [ "$has_ssl" = "y" ]; then
    echo "   Frontend: https://280.kesef-kesef.com"
    echo "   Backend API: https://api.280.kesef-kesef.com"
else
    echo "   Frontend: http://280.kesef-kesef.com"
    echo "   Backend API: http://api.280.kesef-kesef.com"
fi
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker compose -f docker compose.nginx.yml logs -f"
echo "   Stop services: docker compose -f docker compose.nginx.yml down"
echo "   Restart nginx: docker compose -f docker compose.nginx.yml restart nginx"
echo ""
echo "📚 For more information, see nginx/NGINX_SETUP.md"
