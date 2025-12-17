# Claude Code Instructions for CozyLifeRPG

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
