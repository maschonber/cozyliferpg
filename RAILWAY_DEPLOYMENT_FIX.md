# Railway Deployment Configuration

## Problem
Railway was configured to deploy from an old branch (likely the previous Angular demo branch). When you switched GitHub Pages to deploy from `main`, Railway didn't follow along and is still deploying old code.

## Solution

### Step 1: Update Railway Branch Configuration

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your CozyLife RPG backend service**
3. **Go to Settings tab**
4. **Find "Source" or "GitHub Repository" section**
5. **Change the branch from the old branch to `main`**
6. **Save changes**

### Step 2: Configure Root Directory (if needed)

In the same Settings tab:
1. **Find "Root Directory" setting**
2. **Set it to:** `server` (or leave blank if using railway.toml)
3. **Save changes**

### Step 3: Verify Build & Start Commands

Ensure these are set correctly (either in dashboard or using the railway.toml file I created):

- **Build Command**: `cd server && npm ci && npm run build`
- **Start Command**: `cd server && npm start`

### Step 4: Verify Environment Variables

Make sure these are still set in Railway:
- `DATABASE_URL` - (Auto-provided by Railway PostgreSQL service)
- `PORT` - (Auto-provided by Railway)
- `NODE_ENV` - Should be `production`
- `FRONTEND_URL` - Should be `https://maschonber.github.io/cozyliferpg`
- `ADMIN_TOKEN` - Your admin token for database operations (optional, defaults to `dev-admin-token`)

### Step 5: Redeploy

After making these changes:
1. **Trigger a manual deployment** from the Railway dashboard
2. **Or push a new commit to main branch** to trigger auto-deployment

### Step 6: Verify Deployment

Once deployed, test these endpoints:
```bash
# Health check
curl https://your-railway-url.railway.app/api/health

# Should return: {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

## Files Added

I've created `railway.toml` which provides explicit configuration for Railway:
- Specifies build commands
- Specifies start command
- Sets restart policy
- Configures health check endpoint

Railway will automatically use this file if the dashboard settings don't override it.

## Alternative: Railway CLI

If you prefer using the CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set the branch
railway service

# Redeploy
railway up
```

## Troubleshooting

### If deployment still fails:

1. **Check Railway logs** for build/deployment errors
2. **Verify the branch** is set to `main` in Railway settings
3. **Check that DATABASE_URL** is connected to PostgreSQL service
4. **Run the database migration** after first successful deploy:
   ```bash
   curl "https://your-railway-url.railway.app/api/admin/init-db?token=dev-admin-token"
   ```

### If you see "old code" still running:

1. **Force a rebuild** by clicking "Redeploy" in Railway
2. **Check the deployment logs** to see which branch/commit it's building
3. **Verify the branch in Railway settings** is actually `main`

## After Successful Deployment

Once Railway is deploying from `main`:

1. **Every push to main** will auto-deploy both:
   - Frontend to GitHub Pages (via GitHub Actions)
   - Backend to Railway (via Railway integration)

2. **Test the full stack**:
   - Frontend: https://maschonber.github.io/cozyliferpg
   - Backend: https://your-railway-url.railway.app

3. **Run database migration** if needed:
   ```bash
   curl "https://your-railway-url.railway.app/api/admin/init-db?token=YOUR_ADMIN_TOKEN"
   ```
