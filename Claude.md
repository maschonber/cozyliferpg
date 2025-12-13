# Claude Code Guidelines for CozyLife RPG

## ⚠️ CRITICAL: Production Environment

**THIS APPLICATION IS PUBLICLY ACCESSIBLE IN PRODUCTION**

- Frontend: Deployed at `https://maschonber.github.io/cozyliferpg/`
- Backend: Deployed at `https://cozyliferpg-production.up.railway.app`
- Database: PostgreSQL on Railway (production database with live data)

### Security Requirements

1. **Never add unauthenticated endpoints** that expose sensitive operations (password changes, admin functions, etc.)
2. **All new endpoints** must be properly authenticated unless explicitly intended to be public (login, health check)
3. **Assume production context** - do not suggest "temporary" or "quick" solutions that compromise security
4. **No test data exposure** - do not add debug endpoints that leak information
5. **Review all changes** for security implications before committing

### Authentication System

- JWT-based authentication with 24-hour token expiry
- Bcrypt password hashing (10 salt rounds)
- Protected routes require `authenticateToken` middleware
- Initial user: `qurbl` (password managed securely)

## Architecture

### Monorepo Structure
```
/                       # Angular 20 frontend
/server                 # Node.js + Express + TypeScript backend
/shared                 # Shared TypeScript types
```

### Deployment

- **Frontend**: GitHub Pages via GitHub Actions (automatic on push to main)
- **Backend**: Railway (automatic deployment on push)
- **Branch**: All work done on `claude/angular-demo-setup-01UPXYm1eQLUvvydK3z9XS5Y`

### Technology Stack

**Frontend:**
- Angular 20 (standalone components, signals)
- TypeScript 5.9
- RxJS 7.8

**Backend:**
- Node.js 18+
- Express 4
- PostgreSQL (via `pg` library)
- JWT for authentication
- Bcrypt for password hashing

## Development Workflow

1. All changes are committed with clear, descriptive messages
2. **Run tests before pushing** to ensure all tests pass:
   - Backend: `cd server && npm test`
   - Confirm all test suites pass before proceeding
3. Push to the designated Claude branch
4. Deployments happen automatically:
   - GitHub Actions builds and deploys frontend
   - Railway builds and deploys backend

## Password Management

- Use `server/scripts/hash-password.ts` locally to generate password hashes
- Manual database updates required for password changes (via Railway CLI/interface)
- **Never expose password management via public HTTP endpoints**

## Current User

- Username: `qurbl`
- Stored with bcrypt hash in production database
- Password managed manually via Railway database tools when needed

## Notes

- Application started as "simple demo" but is now in production
- Security was added early specifically because of public accessibility
- Always maintain production-level security standards
