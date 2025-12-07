# Cloudflare Proxy Setup Guide

This guide explains how to use Cloudflare as a reverse proxy with SSL/TLS termination. Cloudflare will handle HTTPS for your users, while communication between Cloudflare and your EC2 VM uses HTTP.

## Architecture

```
User Browser (HTTPS)
    ↓
Cloudflare Proxy (SSL/TLS Termination)
    ↓
Your EC2 VM (HTTP - Port 80)
    ↓
Nginx Reverse Proxy
    ├── 280.kesef-kesef.com → Frontend (Port 3000)
    └── api.280.kesef-kesef.com → Backend (Port 3001)
```

## Benefits

✅ **Free SSL Certificates** - Cloudflare provides free SSL  
✅ **DDoS Protection** - Built-in protection  
✅ **CDN** - Global content delivery network  
✅ **Caching** - Improved performance  
✅ **No SSL Management** - No need to manage certificates on your server  
✅ **Easy Setup** - No certbot or SSL configuration needed  

## Step-by-Step Setup

### Step 1: Add Your Domain to Cloudflare

1. Sign up at [cloudflare.com](https://cloudflare.com) (free plan is fine)
2. Add your domain `kesef-kesef.com`
3. Cloudflare will scan your existing DNS records
4. Update your domain's nameservers to Cloudflare's nameservers (provided by Cloudflare)
5. Wait for nameserver propagation (can take up to 24 hours, usually much faster)

### Step 2: Configure DNS Records in Cloudflare

In Cloudflare Dashboard → DNS → Records:

1. **Add A Record for Frontend**:
   - Type: `A`
   - Name: `280`
   - IPv4 address: `YOUR_EC2_PUBLIC_IP`
   - Proxy status: **Proxied** (orange cloud) ✅
   - TTL: Auto

2. **Add A Record for Backend API**:
   - Type: `A`
   - Name: `api.280`
   - IPv4 address: `YOUR_EC2_PUBLIC_IP`
   - Proxy status: **Proxied** (orange cloud) ✅
   - TTL: Auto

**Important**: Make sure the orange cloud is enabled (Proxied) for both records!

### Step 3: Configure Cloudflare SSL/TLS Settings

In Cloudflare Dashboard → SSL/TLS:

1. **SSL/TLS Encryption Mode**: Select **Flexible**
   - This allows HTTPS between users and Cloudflare
   - HTTP between Cloudflare and your server

2. **Always Use HTTPS**: Enable this
   - Automatically redirects HTTP to HTTPS

3. **Automatic HTTPS Rewrites**: Enable this
   - Helps prevent mixed content issues

### Step 4: Configure Cloudflare Security Settings

#### Firewall Rules (Optional but Recommended)

In Cloudflare Dashboard → Security → WAF:

1. Create a rule to allow only Cloudflare IPs to access your origin
2. This prevents direct access to your EC2 IP

#### Rate Limiting (Optional)

Configure rate limiting rules for API endpoints if needed.

### Step 5: Update Your EC2 Security Group

In AWS Console → EC2 → Security Groups:

**Allow HTTP traffic**:
- Type: HTTP
- Protocol: TCP
- Port: 80
- Source: `0.0.0.0/0` (or Cloudflare IP ranges for better security)

**Optional - Restrict to Cloudflare IPs only**:
For better security, only allow Cloudflare IPs. See: https://www.cloudflare.com/ips/

### Step 6: Update Nginx Configuration

The nginx configuration is already set up for HTTP (port 80). No changes needed!

The existing `nginx/nginx.conf` works perfectly with Cloudflare because:
- It listens on port 80 (HTTP)
- Cloudflare handles HTTPS termination
- Your server only needs to handle HTTP

### Step 7: Update Frontend Environment

Update `frontend/.env`:

```bash
# Cloudflare will handle HTTPS, so use https:// in the URL
VITE_API_URL=https://api.280.kesef-kesef.com
VITE_ALLOWED_HOSTS=280.kesef-kesef.com,localhost,.localhost
```

**Important**: Even though your server uses HTTP, the frontend should use `https://` because users access it via Cloudflare's HTTPS.

### Step 8: Start Your Application

```bash
# From project root
docker-compose -f docker-compose.nginx.yml up -d
```

Or use the quick start script:

```bash
./nginx/start-with-nginx.sh
```

When asked about SSL, select **No** since Cloudflare handles it.

### Step 9: Test Your Setup

1. **Test Frontend**: https://280.kesef-kesef.com
2. **Test Backend API**: https://api.280.kesef-kesef.com/api/health

Both should work with HTTPS (provided by Cloudflare)!

## Cloudflare Settings Summary

### SSL/TLS Settings
- **Encryption Mode**: Flexible
- **Always Use HTTPS**: On
- **Automatic HTTPS Rewrites**: On
- **Minimum TLS Version**: TLS 1.2 (recommended)

### DNS Settings
```
280.kesef-kesef.com      A    YOUR_EC2_IP    Proxied ☁️
api.280.kesef-kesef.com  A    YOUR_EC2_IP    Proxied ☁️
```

### Speed Settings (Optional)
- **Auto Minify**: Enable for HTML, CSS, JS
- **Brotli**: Enable
- **Rocket Loader**: Enable (may need testing with your app)

### Caching (Optional)
- **Caching Level**: Standard
- **Browser Cache TTL**: Respect Existing Headers

## Detecting Cloudflare in Your Application

Cloudflare adds headers that you can use to get the real client IP:

### In Nginx (Already Configured)
```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

### In Your Backend (Node.js/Express)
```javascript
// Get real client IP behind Cloudflare
const clientIp = req.headers['cf-connecting-ip'] || 
                 req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress;

// Check if request came through Cloudflare
const isCloudflare = req.headers['cf-ray'] !== undefined;
```

## Troubleshooting

### 1. "Too Many Redirects" Error

**Cause**: Cloudflare is set to "Full" or "Full (Strict)" SSL mode, but your server only supports HTTP.

**Solution**: 
- Go to Cloudflare → SSL/TLS
- Change to **Flexible** mode

### 2. Mixed Content Warnings

**Cause**: Frontend trying to load HTTP resources on HTTPS page.

**Solution**:
- Enable "Automatic HTTPS Rewrites" in Cloudflare
- Ensure `VITE_API_URL` uses `https://`

### 3. Can't Access Site

**Checks**:
- Verify DNS records are proxied (orange cloud)
- Check EC2 security group allows port 80
- Verify nginx is running: `docker-compose ps`
- Check nginx logs: `docker-compose logs nginx`

### 4. API Requests Failing

**Checks**:
- Verify `api.280.kesef-kesef.com` DNS record exists and is proxied
- Check CORS headers in nginx.conf
- Verify backend is running: `docker-compose ps backend`
- Check backend logs: `docker-compose logs backend`

### 5. Slow Performance

**Solutions**:
- Enable Cloudflare caching for static assets
- Enable Auto Minify
- Enable Brotli compression
- Use Cloudflare's CDN features

## Security Best Practices

### 1. Restrict Origin Access

Only allow Cloudflare IPs to access your EC2:

```bash
# In EC2 Security Group, instead of 0.0.0.0/0, add Cloudflare IP ranges:
# https://www.cloudflare.com/ips/
```

### 2. Enable Cloudflare Firewall

- Set up WAF rules
- Enable Bot Fight Mode
- Configure rate limiting

### 3. Use Cloudflare Access (Optional)

For admin areas, consider using Cloudflare Access for additional authentication.

### 4. Enable DNSSEC

In Cloudflare → DNS → Settings → Enable DNSSEC

## Monitoring

### Cloudflare Analytics

View traffic, threats, and performance in Cloudflare Dashboard → Analytics

### Your Server Logs

```bash
# View nginx access logs
docker-compose -f docker-compose.nginx.yml logs nginx | grep "GET\|POST"

# View backend logs
docker-compose -f docker-compose.nginx.yml logs backend

# Real-time monitoring
docker-compose -f docker-compose.nginx.yml logs -f
```

## Cost

- **Cloudflare Free Plan**: $0/month
  - Unlimited bandwidth
  - Free SSL certificates
  - Basic DDoS protection
  - CDN
  - DNS management

Perfect for most small to medium applications!

## Upgrading SSL Mode (Optional)

If you want end-to-end encryption later:

1. **Install SSL on your server** (Let's Encrypt)
2. **Update nginx.conf** to enable HTTPS (port 443)
3. **Change Cloudflare SSL mode** to "Full" or "Full (Strict)"

But for most use cases, Flexible mode is sufficient and easier to manage.

## Environment Variables Summary

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=https://api.280.kesef-kesef.com
VITE_ALLOWED_HOSTS=280.kesef-kesef.com,localhost,.localhost
```

### Backend (in `docker-compose.nginx.yml`)
```bash
FRONTEND_URL=https://280.kesef-kesef.com
```

## Quick Reference

| Setting | Value |
|---------|-------|
| SSL Mode | Flexible |
| Always Use HTTPS | On |
| Proxy Status | Proxied (Orange Cloud) |
| Server Port | 80 (HTTP) |
| User Access | HTTPS via Cloudflare |
| Cloudflare → Server | HTTP |

## Next Steps

1. ✅ Add domain to Cloudflare
2. ✅ Update nameservers
3. ✅ Configure DNS records (proxied)
4. ✅ Set SSL mode to Flexible
5. ✅ Update EC2 security group
6. ✅ Update frontend .env
7. ✅ Start application
8. ✅ Test both domains

## Support Resources

- [Cloudflare Documentation](https://developers.cloudflare.com/)
- [Cloudflare Community](https://community.cloudflare.com/)
- [Cloudflare SSL/TLS Guide](https://developers.cloudflare.com/ssl/)
