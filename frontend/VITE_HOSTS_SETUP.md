# Vite Allowed Hosts Configuration

## Problem
When accessing the application from a custom domain (e.g., `280.kesef-kesef.com`), Vite blocks the request with:
```
Blocked request. This host ("280.kesef-kesef.com") is not allowed.
```

## Solution

### Step 1: Create/Update `.env` file
In the `frontend` directory, create or update the `.env` file:

```bash
# frontend/.env
VITE_ALLOWED_HOSTS=280.kesef-kesef.com,localhost,.localhost
```

**Note:** You can add multiple domains separated by commas.

### Step 2: Restart Vite Dev Server
**IMPORTANT:** You MUST restart the Vite dev server after changing the `.env` file!

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
# or if using docker-compose
docker-compose restart frontend
```

### Step 3: Verify
Try accessing your application from the custom domain. It should now work!

## Configuration Details

- **Environment Variable:** `VITE_ALLOWED_HOSTS`
- **Format:** Comma-separated list of domains
- **Default:** `localhost,.localhost` (if not set)
- **Location:** `frontend/.env` file

## Example Configurations

### Single Custom Domain
```bash
VITE_ALLOWED_HOSTS=280.kesef-kesef.com
```

### Multiple Domains
```bash
VITE_ALLOWED_HOSTS=280.kesef-kesef.com,dev.kesef-kesef.com,staging.kesef-kesef.com,localhost,.localhost
```

### Wildcard Subdomain
```bash
VITE_ALLOWED_HOSTS=.kesef-kesef.com,localhost,.localhost
```
(The dot prefix allows all subdomains)

## Mixed Content Error (HTTPS Issue)

If you see an error like:
```
Mixed Content: The page at 'https://280.kesef-kesef.com' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://localhost:3001'. 
This request has been blocked; the content must be served over HTTPS.
```

**Solution:** Update the API URL to use HTTPS:

```bash
# frontend/.env
VITE_API_URL=https://280.kesef-kesef.com:3001
# or if using a different backend domain:
VITE_API_URL=https://api.280.kesef-kesef.com
```

**Important:** Your backend server must also be configured to serve over HTTPS (SSL/TLS certificate).

### Local Development vs Production

**For local development (HTTP):**
```bash
VITE_API_URL=http://localhost:3001
```

**For production with HTTPS:**
```bash
VITE_API_URL=https://280.kesef-kesef.com:3001
# or
VITE_API_URL=https://your-backend-domain.com
```

## Troubleshooting

1. **Still getting blocked?**
   - Make sure you restarted the Vite dev server
   - Check that the `.env` file is in the `frontend` directory
   - Verify the domain name matches exactly (no typos)

2. **Environment variable not loading?**
   - The variable must start with `VITE_` prefix
   - Check for syntax errors in the `.env` file
   - Make sure there are no spaces around the `=` sign

3. **Mixed Content Error?**
   - If your site uses HTTPS, your API must also use HTTPS
   - Update `VITE_API_URL` to use `https://` instead of `http://`
   - Ensure your backend has a valid SSL certificate

4. **Docker users:**
   - If using Docker, you may need to rebuild: `docker-compose up --build frontend`
   - Or restart the container: `docker-compose restart frontend`
