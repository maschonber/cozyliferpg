# Claude Code Instructions for CozyLifeRPG

## Pre-Push Checklist

Before pushing any changes to the repository, **ALWAYS** run the following build steps to catch TypeScript compilation errors:

### 1. Build Backend (Server)

```bash
cd server
npm install  # Only needed if dependencies changed
npm run build
```

This will:
- Run TypeScript compilation on all server code
- Catch type errors, missing imports, and interface mismatches
- Ensure the code will build successfully in CI/CD

### 2. Run Backend Tests

```bash
cd server
npm test
```

This will run the Jest test suite to ensure no regressions.

### 3. Build Frontend (Client)

```bash
npm run build
```

This will build the Angular frontend application.

### 4. Run All Builds (Recommended)

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
