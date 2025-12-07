# Cloudflare Setup - Quick Start

## 5-Minute Setup Checklist

### ☁️ Cloudflare Configuration

1. **Add Domain to Cloudflare**
   - Go to cloudflare.com → Add Site
   - Enter: `kesef-kesef.com`
   - Choose Free plan

2. **Update Nameservers**
   - Copy Cloudflare's nameservers
   - Update at your domain registrar
   - Wait for propagation (check status in Cloudflare)

3. **Add DNS Records**
   ```
   Type: A    Name: 280      IPv4: YOUR_EC2_IP    Proxy: ON (🟠)
   Type: A    Name: api.280  IPv4: YOUR_EC2_IP    Proxy: ON (🟠)
   ```
   **Important**: Orange cloud must be ON!

4. **SSL/TLS Settings**
   - Go to SSL/TLS tab
   - Set mode to: **Flexible**
   - Enable: Always Use HTTPS
   - Enable: Automatic HTTPS Rewrites

### 🖥️ Server Configuration

5. **EC2 Security Group**
   - Allow inbound: HTTP (port 80) from 0.0.0.0/0

6. **Update Frontend .env**
   ```bash
   cd /home/david/280-new-3/frontend
   nano .env
   ```
   Add:
   ```bash
   VITE_API_URL=https://api.280.kesef-kesef.com
   VITE_ALLOWED_HOSTS=280.kesef-kesef.com,localhost,.localhost
   ```

7. **Start Application**
   ```bash
   cd /home/david/280-new-3
   docker-compose -f docker-compose.nginx.yml up -d
   ```

### ✅ Test

- Frontend: https://280.kesef-kesef.com
- API: https://api.280.kesef-kesef.com/api/health

## Architecture

```
User → Cloudflare (HTTPS) → Your Server (HTTP Port 80) → Nginx → Frontend/Backend
```

## Why This Works

- **Cloudflare handles SSL**: Free certificates, automatic renewal
- **Your server uses HTTP**: No certificate management needed
- **Users get HTTPS**: Secure connection via Cloudflare
- **Bonus**: DDoS protection, CDN, caching - all free!

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Too many redirects | Change SSL mode to "Flexible" |
| Can't access site | Check orange cloud is ON in DNS |
| Mixed content | Enable "Automatic HTTPS Rewrites" |
| 502 Bad Gateway | Check nginx is running: `docker-compose ps` |

## Full Documentation

See `CLOUDFLARE_SETUP.md` for complete guide with screenshots and advanced configuration.
