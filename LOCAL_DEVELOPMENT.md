# Local Development Setup Guide

This guide will help you set up the CozyLifeRPG project for local development.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Access to the Railway project (for database connection string)

## Initial Setup

### 1. Install Dependencies

From the project root:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run server:install
```

### 2. Set Up Railway CLI (for Database Access)

The backend needs to connect to Railway's PostgreSQL database. The easiest way is using the Railway CLI:

```bash
# Install Railway CLI globally
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project (run from project root)
railway link
```

Select your CozyLifeRPG project when prompted.

**How it works:** Railway CLI automatically injects environment variables (including `DATABASE_PUBLIC_URL`) when you run commands with `railway run`.

**Note:** The backend connects to the **production database**. Be cautious with destructive operations.

## Running the Application

### Option 1: Run Everything Together (Recommended)

From the project root, run:

```bash
npm run dev
```

This starts both services with one command:
- Frontend on `http://localhost:4200`
- Backend on `http://localhost:3000` (connected to Railway database)

### Option 2: Run Services Separately

**Terminal 1 - Frontend:**
```bash
npm start
```

**Terminal 2 - Backend (with Railway):**
```bash
npm run server
# OR from server directory:
cd server
railway run npm run dev
```

## How Environment Configuration Works

### Frontend

The frontend uses Angular's environment system:

- **Local development** (`ng serve`): Uses [src/environments/environment.development.ts](src/environments/environment.development.ts)
  - API URL: `http://localhost:3000/api`

- **Production build** (`ng build`): Uses [src/environments/environment.ts](src/environments/environment.ts)
  - API URL: `https://cozyliferpg-production.up.railway.app/api`

The [angular.json](angular.json) configuration automatically swaps environment files based on the build configuration.

### Backend

The backend uses environment variables from [server/.env](server/.env):

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `FRONTEND_URL`: Allowed CORS origin
- `JWT_SECRET`: JWT token signing secret
- `ADMIN_TOKEN`: Admin API authentication token

## Testing Your Setup

1. Start both frontend and backend: `npm run dev`
2. Open browser to `http://localhost:4200`
3. Try logging in with username: `qurbl` (password from production)
4. Check the Network tab - API calls should go to `http://localhost:3000/api`

## Common Issues

### Frontend shows CORS errors

- Make sure backend is running on port 3000
- Check that [server/.env](server/.env) has `FRONTEND_URL=http://localhost:4200`

### Backend can't connect to database

- Verify your `DATABASE_URL` is correct in [server/.env](server/.env)
- Test connection from Railway dashboard
- Check Railway PostgreSQL service is running

### Frontend still calls production API

- Make sure you're running `npm start` (not `npm run build`)
- Check browser DevTools > Network tab to see actual API URLs
- Clear browser cache and restart dev server

## Deployment

When you push to the main branch:

- **Frontend**: Automatically deployed to GitHub Pages via GitHub Actions
- **Backend**: Automatically deployed to Railway

The production environment uses:
- Frontend: `https://maschonber.github.io/cozyliferpg/`
- Backend: `https://cozyliferpg-production.up.railway.app`
- Database: Railway PostgreSQL (production database)

## Next Steps

- For production password changes, see [CLAUDE.md](CLAUDE.md#password-management)
- For database schema updates, see the migration functions in [server/src/db.ts](server/src/db.ts)
- Always run tests before pushing: `npm run test:backend`
