# Nginx Reverse Proxy Configuration

This directory contains the Nginx reverse proxy configuration for serving the Optometry Management System on separate domains.

## Quick Start

```bash
# Run the setup script
./start-with-nginx.sh
```

Or manually:

```bash
# From project root
docker-compose -f docker-compose.nginx.yml up -d
```

## Domain Configuration

- **Frontend**: `280.kesef-kesef.com` → Port 3000 (Vite dev server)
- **Backend API**: `api.280.kesef-kesef.com` → Port 3001 (Express server)

## Files

- `nginx.conf` - Main Nginx configuration
- `NGINX_SETUP.md` - Comprehensive setup guide
- `start-with-nginx.sh` - Quick start script
- `ssl/` - Directory for SSL certificates (create this)

## DNS Setup Required

Before using this configuration, ensure your DNS records point to your server:

```
280.kesef-kesef.com      A    YOUR_SERVER_IP
api.280.kesef-kesef.com  A    YOUR_SERVER_IP
```

## SSL/HTTPS Options

### Option 1: Cloudflare Proxy (Recommended - Easiest)

Use Cloudflare to handle SSL/TLS. No certificate management needed!

- ✅ Free SSL certificates
- ✅ DDoS protection
- ✅ CDN and caching
- ✅ No server-side SSL configuration

**See `CLOUDFLARE_SETUP.md` for complete guide.**

### Option 2: Let's Encrypt (Self-Managed)

Install SSL certificates directly on your server.

```bash
sudo certbot certonly --standalone -d 280.kesef-kesef.com
sudo certbot certonly --standalone -d api.280.kesef-kesef.com
```

Then copy certificates to `nginx/ssl/` directory.

**See `NGINX_SETUP.md` for detailed instructions.**

## Environment Configuration

Update `frontend/.env`:

```bash
VITE_API_URL=https://api.280.kesef-kesef.com
VITE_ALLOWED_HOSTS=280.kesef-kesef.com,localhost,.localhost
```

## Features

✅ Separate domains for frontend and backend  
✅ HTTPS support (when SSL configured)  
✅ CORS configuration  
✅ Rate limiting on API  
✅ Security headers  
✅ Gzip compression  
✅ WebSocket support for Vite HMR  

## Troubleshooting

See `NGINX_SETUP.md` for detailed troubleshooting guide.

Quick checks:

```bash
# View nginx logs
docker-compose -f docker-compose.nginx.yml logs nginx

# Test nginx configuration
docker-compose -f docker-compose.nginx.yml exec nginx nginx -t

# Reload nginx (after config changes)
docker-compose -f docker-compose.nginx.yml exec nginx nginx -s reload
```

## Documentation

- [Cloudflare Proxy Setup](./CLOUDFLARE_SETUP.md) - **Recommended for easy SSL**
- [Complete Nginx Setup Guide](./NGINX_SETUP.md)
- [Vite Hosts Configuration](../frontend/VITE_HOSTS_SETUP.md)
