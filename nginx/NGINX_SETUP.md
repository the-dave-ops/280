# Nginx Reverse Proxy Setup Guide

This guide explains how to set up Nginx as a reverse proxy to serve your application on two separate domains:
- **Frontend**: `280.kesef-kesef.com`
- **Backend API**: `api.280.kesef-kesef.com`

## Architecture

```
Internet
    ↓
Nginx (Port 80/443)
    ├── 280.kesef-kesef.com → Frontend (Port 3000)
    └── api.280.kesef-kesef.com → Backend (Port 3001)
```

## Prerequisites

1. **DNS Configuration**: Point both domains to your server's IP address
   - `280.kesef-kesef.com` → Your Server IP
   - `api.280.kesef-kesef.com` → Your Server IP

2. **SSL Certificates** (for HTTPS):
   - You'll need SSL certificates for both domains
   - Options: Let's Encrypt (free), Cloudflare, or commercial SSL

## Quick Start (HTTP Only)

### Step 1: Use the Nginx Docker Compose Configuration

```bash
# Use the nginx-enabled docker-compose file
docker-compose -f docker-compose.nginx.yml up -d
```

### Step 2: Update Frontend Environment

Update `frontend/.env`:
```bash
VITE_API_URL=http://api.280.kesef-kesef.com
VITE_ALLOWED_HOSTS=280.kesef-kesef.com,localhost,.localhost
```

### Step 3: Test the Setup

- Frontend: http://280.kesef-kesef.com
- Backend API: http://api.280.kesef-kesef.com/api/health

## Production Setup with HTTPS

### Step 1: Obtain SSL Certificates

#### Option A: Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Get certificates for both domains
sudo certbot certonly --standalone -d 280.kesef-kesef.com
sudo certbot certonly --standalone -d api.280.kesef-kesef.com

# Certificates will be in:
# /etc/letsencrypt/live/280.kesef-kesef.com/
# /etc/letsencrypt/live/api.280.kesef-kesef.com/
```

#### Option B: Using Certbot with Docker

Create `docker-compose.certbot.yml`:
```yaml
version: '3.8'
services:
  certbot:
    image: certbot/certbot
    volumes:
      - ./nginx/ssl:/etc/letsencrypt
    command: certonly --standalone -d 280.kesef-kesef.com -d api.280.kesef-kesef.com --email your@email.com --agree-tos
```

Run:
```bash
docker-compose -f docker-compose.certbot.yml up
```

### Step 2: Copy SSL Certificates

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy certificates (adjust paths as needed)
sudo cp /etc/letsencrypt/live/280.kesef-kesef.com/fullchain.pem nginx/ssl/280.kesef-kesef.com.crt
sudo cp /etc/letsencrypt/live/280.kesef-kesef.com/privkey.pem nginx/ssl/280.kesef-kesef.com.key
sudo cp /etc/letsencrypt/live/api.280.kesef-kesef.com/fullchain.pem nginx/ssl/api.280.kesef-kesef.com.crt
sudo cp /etc/letsencrypt/live/api.280.kesef-kesef.com/privkey.pem nginx/ssl/api.280.kesef-kesef.com.key

# Set proper permissions
sudo chmod 644 nginx/ssl/*.crt
sudo chmod 600 nginx/ssl/*.key
```

### Step 3: Enable HTTPS in Nginx Config

Edit `nginx/nginx.conf` and uncomment the HTTPS server blocks (lines starting with `# server {` for ports 443).

Also uncomment the HTTP to HTTPS redirect lines:
```nginx
# Change from:
# return 301 https://$server_name$request_uri;

# To:
return 301 https://$server_name$request_uri;
```

### Step 4: Update Frontend Environment for HTTPS

Update `frontend/.env`:
```bash
VITE_API_URL=https://api.280.kesef-kesef.com
VITE_ALLOWED_HOSTS=280.kesef-kesef.com,localhost,.localhost
```

### Step 5: Restart Services

```bash
docker-compose -f docker-compose.nginx.yml down
docker-compose -f docker-compose.nginx.yml up -d
```

### Step 6: Test HTTPS

- Frontend: https://280.kesef-kesef.com
- Backend API: https://api.280.kesef-kesef.com/api/health

## Configuration Files

### nginx/nginx.conf
Main Nginx configuration with:
- Reverse proxy settings for both domains
- CORS headers for API
- Rate limiting
- Security headers
- WebSocket support for Vite HMR
- Gzip compression

### docker-compose.nginx.yml
Docker Compose configuration with:
- Nginx service
- Network configuration
- Volume mounts for SSL certificates

## Features

### Security
- Rate limiting on API endpoints (10 requests/second)
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- CORS configuration
- SSL/TLS support

### Performance
- Gzip compression
- HTTP/2 support (when using HTTPS)
- Proper proxy headers

### Development
- WebSocket support for Vite Hot Module Replacement
- Separate networks for service isolation

## Troubleshooting

### 1. "502 Bad Gateway"
- Check if backend/frontend containers are running: `docker-compose ps`
- Check nginx logs: `docker-compose logs nginx`
- Verify network connectivity: `docker network inspect optometry-network`

### 2. "Connection Refused"
- Ensure DNS is pointing to your server
- Check firewall rules (ports 80 and 443 should be open)
- Verify nginx is running: `docker-compose ps nginx`

### 3. SSL Certificate Errors
- Verify certificate files exist in `nginx/ssl/`
- Check file permissions
- Ensure certificate paths in nginx.conf are correct

### 4. CORS Errors
- Check CORS headers in nginx.conf
- Verify `Access-Control-Allow-Origin` matches your frontend domain
- Check browser console for specific CORS errors

### 5. Mixed Content Warnings
- Ensure `VITE_API_URL` uses `https://` when frontend is served over HTTPS
- Check that all resources are loaded over HTTPS

## Useful Commands

```bash
# View nginx logs
docker-compose -f docker-compose.nginx.yml logs nginx

# Reload nginx configuration (without downtime)
docker-compose -f docker-compose.nginx.yml exec nginx nginx -s reload

# Test nginx configuration
docker-compose -f docker-compose.nginx.yml exec nginx nginx -t

# View all running containers
docker-compose -f docker-compose.nginx.yml ps

# Restart nginx only
docker-compose -f docker-compose.nginx.yml restart nginx

# View nginx access logs in real-time
docker-compose -f docker-compose.nginx.yml logs -f nginx
```

## SSL Certificate Renewal

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e

# Add this line (runs twice daily):
0 0,12 * * * certbot renew --quiet && docker-compose -f /path/to/docker-compose.nginx.yml restart nginx
```

## Switching Between Configurations

### Use Nginx Proxy
```bash
docker-compose -f docker-compose.nginx.yml up -d
```

### Use Original Direct Access
```bash
docker-compose up -d
```

## Environment Variables Summary

### Frontend (.env)
```bash
VITE_API_URL=https://api.280.kesef-kesef.com
VITE_ALLOWED_HOSTS=280.kesef-kesef.com,localhost,.localhost
```

### Backend (in docker-compose.nginx.yml)
```bash
FRONTEND_URL=https://280.kesef-kesef.com
```

## Next Steps

1. Set up SSL certificates
2. Configure DNS records
3. Test HTTP setup first
4. Enable HTTPS
5. Set up SSL auto-renewal
6. Configure monitoring and logging
7. Set up backups

## Support

For issues or questions, check:
- Nginx logs: `docker-compose logs nginx`
- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
