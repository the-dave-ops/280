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

## Troubleshooting

1. **Still getting blocked?**
   - Make sure you restarted the Vite dev server
   - Check that the `.env` file is in the `frontend` directory
   - Verify the domain name matches exactly (no typos)

2. **Environment variable not loading?**
   - The variable must start with `VITE_` prefix
   - Check for syntax errors in the `.env` file
   - Make sure there are no spaces around the `=` sign

3. **Docker users:**
   - If using Docker, you may need to rebuild: `docker-compose up --build frontend`
   - Or restart the container: `docker-compose restart frontend`
