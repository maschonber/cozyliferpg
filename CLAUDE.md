# Claude Code Instructions for CozyLifeRPG

## Project Overview

CozyLifeRPG is a life simulation RPG with a monorepo structure:

```
/                       # Angular 20 frontend
/server                 # Node.js + Express + TypeScript backend
/shared                 # Shared TypeScript types (API contracts)
```

## Production Environment

This application is publicly accessible in production:

- Frontend: `https://maschonber.github.io/cozyliferpg/`
- Backend: `https://cozyliferpg-production.up.railway.app`
- Database: PostgreSQL on Railway

**No active users yet** - breaking changes to database and features are acceptable when warranted by better architecture.

## Architecture & Code Guidelines

Follow the principles documented in the rule files:

- @.claude/rules/architecture.md - Core architectural principles
- @.claude/rules/backend-layers.md - Backend layer responsibilities
- @.claude/rules/frontend-layers.md - Frontend layer responsibilities
- @.claude/rules/code-style.md - Code style and patterns
- @.claude/rules/testing.md - Testing principles
- @.claude/rules/security.md - Security requirements

In addition, refer to the overarching design document for questions of purpose and tone:

- @.claude/rules/game-design.md - Game Design Considerations

## Pre-Commit Checklist

Before committing, **ALWAYS** run:

```bash
# 1. Run backend tests
npm run test:backend

# 2. Run type checking
npm run typecheck --prefix server

# 3. Optional: Build frontend (if frontend changes)
npm run build
```

Only commit if both tests and typecheck pass. Fix failing tests immediately.

## Deployment

Deployments are automatic on push:

- Frontend: GitHub Pages via GitHub Actions
- Backend: Railway

Railway runs `npm ci && npm test && npm run build` - local verification prevents failed deployments.

## Quick Reference

**Shared types**: All API contracts live in `shared/types.ts`. Update shared types when changing API responses.

**Authentication**: JWT tokens, bcrypt password hashing, `authenticateToken` middleware on protected routes.

**Password management**: Use `server/scripts/hash-password.ts` locally. Never expose password endpoints.
