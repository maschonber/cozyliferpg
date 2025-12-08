# CozyLife RPG - Full Stack Demo

A beautiful full-stack application showcasing modern web development with Angular 20 frontend and Node.js + TypeScript backend.

## 🏗️ Architecture

**Monorepo Structure:**
- **Frontend**: Angular 20 → Deployed to GitHub Pages
- **Backend**: Node.js + TypeScript + Express + PostgreSQL → Deployed to Railway
- **Shared**: Common TypeScript types used by both

## 🚀 Tech Stack

### Frontend
- Angular 20 (Signals, Standalone Components, Control Flow)
- TypeScript
- CSS with modern gradients and animations
- Deployed on GitHub Pages

### Backend
- Node.js + TypeScript
- Express.js REST API
- PostgreSQL database
- Deployed on Railway

### Shared
- TypeScript types for full-stack type safety

## ✨ Features

- 🎮 Interactive counter demonstrating Angular Signals
- 🏡 Beautiful UI
- 📱 Fully responsive design
- ⚡ RESTful API with Express
- 🗄️ PostgreSQL database integration
- 🔒 Type-safe communication between frontend and backend
- 🚀 Production-ready deployment setup

## 🌐 Live Demo

**Frontend**: [https://maschonber.github.io/cozyliferpg/](https://maschonber.github.io/cozyliferpg/)
**Backend**: Deploy to Railway (see instructions below)

## 📁 Project Structure

```
cozyliferpg/
├── src/                    # Angular 20 frontend
│   ├── app/
│   ├── index.html
│   └── ...
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── index.ts       # Express server
│   │   ├── db.ts          # Database config
│   │   └── routes/        # API routes
│   ├── package.json
│   └── tsconfig.json
├── shared/                 # Shared TypeScript types
│   └── types.ts
├── package.json            # Root package.json
├── angular.json
└── railway.json           # Railway deployment config
```

## 🛠️ Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL (optional - for backend)
- npm or yarn

### First Time Setup

1. **Install root dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
npm run server:install
```

3. **Set up backend environment** (if using database):
```bash
cd server
cp .env.example .env
# Edit .env with your database credentials
```

### Running the Application

**Option 1: Run frontend and backend together (recommended)**
```bash
npm run dev
```
- Frontend: http://localhost:4200
- Backend: http://localhost:3000

**Option 2: Run separately**

Frontend only:
```bash
npm start
```

Backend only:
```bash
npm run server
```

The application will automatically reload when you modify source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## 🏗️ Building

**Build frontend only:**
```bash
npm run build
```

**Build everything (frontend + backend):**
```bash
npm run build:all
```

This will compile your project and store build artifacts in:
- Frontend: `dist/` directory
- Backend: `server/dist/` directory

## 🚀 Deployment

### Frontend (GitHub Pages)

Already configured! Just push to your branch and GitHub Actions will deploy automatically.

### Backend (Railway)

1. **Create Railway account**: https://railway.app
2. **Create new project** and add PostgreSQL database
3. **Connect your GitHub repository**
4. **Configure Railway:**
   - Root Directory: `/server` (leave empty, Railway will detect it)
   - Build Command: Auto-detected from `railway.json`
   - Start Command: Auto-detected from `railway.json`

5. **Set environment variables in Railway:**
   ```
   NODE_ENV=production
   FRONTEND_URL=https://maschonber.github.io/cozyliferpg
   ```
   (Railway auto-provides `DATABASE_URL` and `PORT`)

6. **Deploy!** Railway will automatically build and deploy your backend

### Database Setup on Railway

After first deployment, initialize the database:
1. Go to Railway dashboard → PostgreSQL service
2. Click "Connect" and use the provided credentials
3. Run the SQL from `server/src/db.ts` to create tables
4. Or use the Railway CLI to run migrations

See `server/README.md` for detailed backend deployment instructions.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## 📚 Documentation

- **Frontend (Angular)**: See root directory and `src/`
- **Backend (Node.js)**: See `server/README.md`
- **Shared Types**: See `shared/types.ts`

## 🔌 API Endpoints

Once backend is running:

- `GET /api/health` - Health check
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create new item
- `DELETE /api/items/:id` - Delete item

## 🧪 Testing

**Frontend tests:**
```bash
ng test
```

**End-to-end tests:**
```bash
ng e2e
```

Angular CLI does not come with an e2e testing framework by default. You can choose one that suits your needs.

## 📦 Available Scripts

### Root Level
- `npm start` - Run frontend dev server
- `npm run dev` - Run frontend + backend together
- `npm run server` - Run backend only
- `npm run build` - Build frontend
- `npm run build:all` - Build frontend + backend
- `npm run server:install` - Install backend dependencies

### Backend (`cd server`)
- `npm run dev` - Run with hot reload
- `npm run build` - Build TypeScript
- `npm start` - Run production build
- `npm run typecheck` - Type check only

## 🤝 Contributing

This is a demo project showcasing modern full-stack development patterns with Angular 20 and Node.js + TypeScript.

## 📖 Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Railway Documentation](https://docs.railway.app)
- [Express.js Guide](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
