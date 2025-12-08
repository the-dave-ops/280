# Cloudflare Setup - Simple Version (Current Docker Setup)

## Your Current Setup

You're running the services directly (without nginx):
- Frontend on port 80 (exposed directly)
- Backend on port 3001 (exposed directly)

## Cloudflare Configuration for This Setup

### Step 1: Add DNS Records in Cloudflare

Add TWO separate A records pointing to your EC2 IP:

```
Type: A    Name: 280        IPv4: YOUR_EC2_IP    Proxy: ON (🟠)    Port: 80
Type: A    Name: api.280    IPv4: YOUR_EC2_IP    Proxy: ON (🟠)    Port: 3001
```

**Problem**: Cloudflare proxied records don't support custom ports!

## Solution: Use Nginx (Recommended)

Since Cloudflare can't proxy to custom ports, you need nginx to route both domains through port 80.

### Quick Migration Steps:

1. **Stop current containers**:
```bash
docker compose down
```

2. **Start with nginx**:
```bash
docker compose -f docker-compose.nginx.yml up -d
```

3. **Verify nginx is running**:
```bash
docker compose -f docker-compose.nginx.yml ps
```

You should see 4 containers: db, backend, frontend, **nginx**

## Alternative: Cloudflare Tunnel (No Port Issues)

If you don't want to use nginx, use Cloudflare Tunnel:

### Install Cloudflare Tunnel

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create optometry

# Configure tunnel
cat > ~/.cloudflared/config.yml << EOF
tunnel: optometry
credentials-file: /root/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: 280.kesef-kesef.com
    service: http://localhost:80
  - hostname: api.280.kesef-kesef.com
    service: http://localhost:3001
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run optometry
```

## Recommended: Use Nginx Setup

The nginx setup is cleaner and more standard. Here's why:

✅ Single port (80) for all traffic
✅ Better control over routing
✅ CORS handling
✅ Rate limiting
✅ Security headers
✅ Works with standard Cloudflare proxy

### To Switch to Nginx:

```bash
# Stop current setup
docker compose down

# Start with nginx
docker compose -f docker-compose.nginx.yml up -d

# Check status
docker compose -f docker-compose.nginx.yml ps
```

You should see the **nginx** container running.

## Current Issue Diagnosis

Your error `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` happens because:

1. Frontend tries to call: `https://api.280.kesef-kesef.com`
2. DNS resolves to your EC2 IP directly (not through Cloudflare)
3. Browser tries HTTPS connection to port 443
4. Your server doesn't have port 443 open or SSL configured
5. Connection fails

### Why This Happens:

- Cloudflare proxy only works on standard ports (80, 443)
- Your backend is on port 3001
- Cloudflare can't proxy to custom ports
- Browser connects directly to your server
- No SSL = error

### The Fix:

Use nginx to handle routing on port 80, then Cloudflare can proxy properly.
