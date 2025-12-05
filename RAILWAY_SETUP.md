# Railway Setup & Database Management

## Initial Setup on Railway

### 1. Set Environment Variables

In your Railway project settings, add these environment variables:

```
FRONTEND_URL=https://maschonber.github.io/cozyliferpg
NODE_ENV=production
JWT_SECRET=<generate-a-strong-random-string>
ADMIN_TOKEN=<generate-a-strong-random-token>
```

**Important**: Generate strong random tokens for `JWT_SECRET` and `ADMIN_TOKEN` in production!

Railway automatically provides:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port

### 2. Deploy Your Code

Push your code to GitHub, and Railway will automatically deploy.

## Database Schema Management

### Check Database Status

To check which tables exist and verify the schema:

```
GET https://your-railway-app.up.railway.app/api/admin/schema-status?token=YOUR_ADMIN_TOKEN
```

**Example:**
```bash
curl "https://cozyliferpg-production.up.railway.app/api/admin/schema-status?token=dev-admin-token"
```

This returns:
- List of all tables
- Details about player_characters table (if it exists)
- Column information

### Initialize Database Schema

To create/update all database tables (safe to run multiple times):

```
GET https://your-railway-app.up.railway.app/api/admin/init-db?token=YOUR_ADMIN_TOKEN
```

**Example:**
```bash
curl "https://cozyliferpg-production.up.railway.app/api/admin/init-db?token=dev-admin-token"
```

This will:
- ✅ Create `users` table if missing
- ✅ Create `player_characters` table if missing (Phase 2)
- ✅ Create `npcs` table if missing
- ✅ Create `relationships` table if missing
- ✅ Create `interactions` table if missing
- ✅ Create all necessary indexes

Uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run repeatedly.

### Force Create Player Table

If you specifically need to ensure the `player_characters` table exists:

```
POST https://your-railway-app.up.railway.app/api/admin/create-player-table?token=YOUR_ADMIN_TOKEN
```

**Example:**
```bash
curl -X POST "https://cozyliferpg-production.up.railway.app/api/admin/create-player-table?token=dev-admin-token"
```

## Testing Your Deployment

### 1. Health Check

```
GET https://your-railway-app.up.railway.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-05T...",
  "version": "1.0.0"
}
```

### 2. Check Database Schema

Use the schema-status endpoint above to verify all tables exist.

### 3. Test Frontend Integration

1. Open your deployed frontend: `https://maschonber.github.io/cozyliferpg`
2. Login with credentials
3. You should see the Player HUD at the top showing:
   - Day 1
   - 06:00 Morning
   - Energy bar (100/100)
   - Money $200
   - Sleep button

## Troubleshooting

### Phase 2 Features Not Showing

**Symptom:** UI looks like Phase 1, no Player HUD, no activity costs

**Solution:**
1. Check database schema status
2. Run init-db endpoint to create missing tables
3. Restart Railway deployment (sometimes needed for env var changes)
4. Clear browser cache and refresh

### "player_characters table not found" Error

**Solution:**
```bash
curl "https://your-railway-app.up.railway.app/api/admin/init-db?token=YOUR_ADMIN_TOKEN"
```

### CORS Errors

**Check:** Ensure `FRONTEND_URL` in Railway matches your actual frontend URL exactly (including https://)

### Admin Endpoints Return 403

**Check:** Ensure `ADMIN_TOKEN` environment variable is set in Railway and matches your request

## Security Notes

⚠️ **Important**:
- Change `ADMIN_TOKEN` from default value in production
- Keep your admin token secret
- Only use admin endpoints when needed
- Consider disabling admin endpoints in production after initial setup

## Quick Reference

```bash
# Replace these values
RAILWAY_URL="https://cozyliferpg-production.up.railway.app"
ADMIN_TOKEN="your-admin-token"

# Check schema
curl "${RAILWAY_URL}/api/admin/schema-status?token=${ADMIN_TOKEN}"

# Initialize database
curl "${RAILWAY_URL}/api/admin/init-db?token=${ADMIN_TOKEN}"

# Create player table
curl -X POST "${RAILWAY_URL}/api/admin/create-player-table?token=${ADMIN_TOKEN}"
```
