# Claude Code Instructions for CozyLifeRPG

## ⚠️ CRITICAL: Production Environment

**THIS APPLICATION HAS NO ACTIVE USERS YET, BUT IS PUBLICLY ACCESSIBLE IN PRODUCTION**

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
- User passwords encrypted and managed securely in database

### Backwards compatibility not necessary

Although the application is in production for infrastructure reasons, it is still in early development and has no active users. This means that database structures and existing features can change, and should change if warranted by better architecture or new features. 

## Architecture

### Monorepo Structure
```
/                       # Angular 20 frontend
/server                 # Node.js + Express + TypeScript backend
/shared                 # Shared TypeScript types
```

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

### Deployment

- **Frontend**: GitHub Pages via GitHub Actions (automatic on push to main)
- **Backend**: Railway (automatic deployment on push)
- Deployments happen automatically when pushed to designated Claude branch

## Pre-Commit Checklist

Before committing any changes, **ALWAYS** run the following commands to catch errors:

### 1. Run Full Backend Test Suite

From the project root:

```bash
npm run test:backend
```

This will:
- Run all Jest tests across the entire backend
- Ensure no regressions in functionality
- Verify that new tests pass

**IMPORTANT**: Always run the full test suite, not just individual test files. Tests run quickly (~2 seconds) and may have interdependencies.

### 2. Run TypeScript Type Checking

From the project root:

```bash
npm run typecheck --prefix server
```

Or from the server directory:

```bash
cd server
npm run typecheck
```

This will:
- Run TypeScript compilation (`tsc --noEmit`) to check types without building
- Catch type errors, missing imports, and interface mismatches
- Ensure the code will build successfully in CI/CD

**Why both?**
- `npm run test:backend` uses Jest with ts-jest which is lenient about types (runtime focus)
- `npm run typecheck` uses strict TypeScript compilation (static type checking)
- Railway runs both, so you must too!

### 3. Only Commit if Both Pass

Only proceed with `git commit` if BOTH commands succeed with no errors.

**CRITICAL: Test Quality**
- **Fix failing tests immediately** - never leave tests in a failing state
- If you encounter a failing test (even if pre-existing), fix it before proceeding
- Flaky tests should be made deterministic or use appropriate assertions (e.g., `toBeLessThanOrEqual` instead of `toBeLessThan` when equality is acceptable)
- Maintaining high test quality prevents degradation and ensures CI/CD reliability

### 4. Optional: Build Frontend (if frontend changes)

```bash
npm run build
```

This will build the Angular frontend application.

### 5. Optional: Run All Builds

From the project root:

```bash
npm run build:all
```

This runs both frontend and backend builds in sequence.

## Common Issues

### TypeScript Compilation Errors

If you encounter TypeScript errors during build:

1. **Check for type mismatches**: Ensure that API response types match between:
   - Shared types (`shared/types.ts`)
   - Local route interfaces (e.g., `server/src/routes/activities.ts`)
   - Frontend component types

2. **Missing type definitions**: If you see errors about missing `@types/*` packages, run `npm install` in the appropriate directory.

3. **Interface updates**: When adding fields to API responses:
   - Update the shared type in `shared/types.ts`
   - Update any local interfaces in route files
   - Update frontend components that consume the API

## Development Workflow

1. All changes are committed with clear, descriptive messages
2. **Run tests before pushing** to ensure all tests pass (see Pre-Commit Checklist above)
3. Push to the designated Claude branch
4. Deployments happen automatically:
   - GitHub Actions builds and deploys frontend
   - Railway builds and deploys backend

## Why This Matters

The Railway deployment runs `npm ci && npm test && npm run build` as part of the build process. If the build fails, the deployment will fail. Running these steps locally before pushing ensures:

- No broken builds in CI/CD
- Faster feedback on errors
- Better development workflow

## Post-Failure Recovery

If you missed the build step and pushed code that fails in CI:

1. Fix the TypeScript errors locally
2. Run the build to verify the fix
3. Commit the fix with a clear message
4. Push the corrected code

## Password Management

- Use `server/scripts/hash-password.ts` locally to generate password hashes
- Manual database updates required for password changes (via Railway CLI/interface)
- **Never expose password management via public HTTP endpoints**

## Current User

- Stored with bcrypt hash in production database
- Password managed manually via Railway database tools when needed

## Notes

- Always maintain production-level security standards
- Security was added early specifically because of public accessibility
