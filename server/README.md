# CozyLife RPG Backend

Node.js + TypeScript + Express + PostgreSQL backend for CozyLife RPG.

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express
- **Database**: PostgreSQL
- **Deployment**: Railway

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL (or use Railway's PostgreSQL locally)

### Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your local database connection:
```env
DATABASE_URL=postgresql://localhost:5432/cozyliferpg
PORT=3000
FRONTEND_URL=http://localhost:4200
```

4. Run in development mode:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run typecheck` - Check TypeScript types

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Items
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create new item
- `DELETE /api/items/:id` - Delete item

## Railway Deployment

### First Time Setup

1. Create Railway account at https://railway.app
2. Create a new project
3. Add PostgreSQL database service
4. Add your GitHub repository
5. Configure environment variables:
   - `FRONTEND_URL=https://maschonber.github.io/cozyliferpg`
   - Railway will auto-provide `DATABASE_URL`

### Environment Variables

Railway will automatically set:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port

You need to set:
- `FRONTEND_URL` - Your frontend URL for CORS
- `NODE_ENV=production`

### Database Initialization

On first deploy, you'll need to initialize the database schema. You can do this by:
1. Connecting to your Railway PostgreSQL
2. Running the SQL from `src/db.ts` (initDatabase function)

Or use Railway's CLI to run migrations.


## Project Structure

```
server/
├── src/
│   ├── index.ts          # Express app entry point
│   ├── db.ts             # Database connection & schema
│   └── routes/
│       └── items.ts      # Items API routes
├── .env.example          # Environment variables template
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## Shared Types

Shared TypeScript types are in `/shared/types.ts` and used by both frontend and backend for type safety.
