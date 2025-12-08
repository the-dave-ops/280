# Troubleshooting: ERR_SSL_VERSION_OR_CIPHER_MISMATCH

## Error Description

```
Failed to load resource: net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH
api.280.kesef-kesef.com/api/customers
```

## What This Means

Your browser is trying to connect to `api.280.kesef-kesef.com` via HTTPS, but:
- Your server is only configured for HTTP (port 80)
- The connection isn't going through Cloudflare's proxy
- The browser can't establish an HTTPS connection directly to your server

## Root Causes & Solutions

### Cause 1: Cloudflare DNS Not Proxied ⭐ MOST COMMON

**Check**: Is the orange cloud enabled in Cloudflare DNS?

**Solution**:
1. Go to Cloudflare Dashboard → DNS → Records
2. Find the `api.280` record
3. Make sure the cloud icon is **ORANGE** (Proxied), not gray
4. If it's gray, click it to turn it orange
5. Wait 1-2 minutes for DNS propagation
6. Clear browser cache and try again

### Cause 2: DNS Record Missing

**Check**: Does `api.280.kesef-kesef.com` DNS record exist?

**Solution**:
1. Go to Cloudflare Dashboard → DNS → Records
2. Add A record:
   - Type: `A`
   - Name: `api.280`
   - IPv4 address: `YOUR_EC2_PUBLIC_IP`
   - Proxy status: **Proxied** (orange cloud) ✅
   - TTL: Auto
3. Click Save

### Cause 3: Cloudflare SSL Mode Incorrect

**Check**: What's your SSL/TLS mode in Cloudflare?

**Solution**:
1. Go to Cloudflare Dashboard → SSL/TLS
2. Set encryption mode to: **Flexible**
3. Enable: "Always Use HTTPS"
4. Enable: "Automatic HTTPS Rewrites"

### Cause 4: DNS Not Propagated Yet

**Check**: Has DNS propagated?

**Test DNS**:
```bash
# Check if DNS points to Cloudflare
nslookup api.280.kesef-kesef.com

# Should show Cloudflare IPs (104.x.x.x or 172.x.x.x range)
```

**Solution**: Wait for DNS propagation (up to 24 hours, usually 5-15 minutes)

### Cause 5: Browser Accessing Server Directly

**Check**: Is browser bypassing Cloudflare?

**Solution**:
1. Clear browser cache completely
2. Try in incognito/private window
3. Check if you have any hosts file entries pointing to your server IP

## Quick Diagnostic Steps

### Step 1: Check DNS Resolution

```bash
# From your local machine
nslookup api.280.kesef-kesef.com
```

**Expected**: Should show Cloudflare IPs (not your EC2 IP directly)

### Step 2: Check Cloudflare Dashboard

1. DNS tab → Verify `api.280` record exists and is **Proxied** (orange)
2. SSL/TLS tab → Verify mode is **Flexible**
3. Overview tab → Check if site is active

### Step 3: Test Direct Server Access

```bash
# This should work (HTTP to your server)
curl -I http://YOUR_EC2_IP

# This should fail (no HTTPS on server)
curl -I https://YOUR_EC2_IP
```

### Step 4: Test Through Cloudflare

```bash
# This should work if Cloudflare is configured correctly
curl -I https://api.280.kesef-kesef.com/api/health
```

## Temporary Workaround (Testing Only)

While setting up Cloudflare, you can temporarily use HTTP for local testing:

### Option A: Use Direct IP (Local Testing)

Update `frontend/.env`:
```bash
VITE_API_URL=http://YOUR_EC2_IP:3001
```

### Option B: Use HTTP Domain (If DNS works)

Update `frontend/.env`:
```bash
VITE_API_URL=http://api.280.kesef-kesef.com
```

**Important**: This is only for testing! Switch back to HTTPS once Cloudflare is configured.

## Complete Solution Checklist

- [ ] Domain added to Cloudflare
- [ ] Nameservers updated at registrar
- [ ] Nameservers active in Cloudflare (check Overview tab)
- [ ] DNS A record for `api.280` exists
- [ ] DNS A record is **Proxied** (orange cloud)
- [ ] SSL/TLS mode set to **Flexible**
- [ ] "Always Use HTTPS" enabled
- [ ] EC2 security group allows port 80
- [ ] Nginx container is running: `docker compose ps`
- [ ] Frontend .env has: `VITE_API_URL=https://api.280.kesef-kesef.com`
- [ ] Browser cache cleared
- [ ] Tested in incognito window

## Verification Commands

```bash
# Check if nginx is running
docker compose -f docker-compose.nginx.yml ps

# Check nginx logs
docker compose -f docker-compose.nginx.yml logs nginx

# Check backend logs
docker compose -f docker-compose.nginx.yml logs backend

# Test backend directly (should work)
curl http://localhost:3001/api/health

# Test through nginx (should work)
curl http://localhost/api/health
```

## Expected Behavior After Fix

1. User accesses: `https://api.280.kesef-kesef.com`
2. DNS resolves to Cloudflare IP
3. Cloudflare terminates SSL
4. Cloudflare forwards to your EC2 via HTTP
5. Nginx receives HTTP request
6. Nginx forwards to backend
7. Response flows back through the chain

## Still Not Working?

### Check Cloudflare Status
- Go to Cloudflare Dashboard → Overview
- Look for any warnings or errors
- Verify site status is "Active"

### Check DNS Propagation
- Use: https://dnschecker.org
- Enter: `api.280.kesef-kesef.com`
- Should show Cloudflare IPs globally

### Check Browser
- Clear all cache and cookies
- Try different browser
- Try incognito/private mode
- Check browser console for other errors

### Check Server
```bash
# Verify containers are running
docker compose -f docker-compose.nginx.yml ps

# Verify port 80 is listening
sudo netstat -tlnp | grep :80

# Test local connectivity
curl -v http://localhost/api/health
```

## Common Mistakes

❌ DNS record not proxied (gray cloud instead of orange)
❌ SSL mode set to "Full" instead of "Flexible"
❌ Nameservers not updated at registrar
❌ Wrong IP address in DNS record
❌ EC2 security group blocking port 80
❌ Browser cache not cleared

## Need More Help?

1. Check Cloudflare status page: https://www.cloudflarestatus.com
2. Review Cloudflare logs in Dashboard → Analytics → Logs
3. Check nginx logs: `docker compose -f docker-compose.nginx.yml logs nginx`
4. Verify your setup matches: `nginx/CLOUDFLARE_QUICK_START.md`
