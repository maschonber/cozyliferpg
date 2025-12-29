# Code Style and Patterns

## Naming Conventions

**Files:**

- Lowercase with hyphens: `activity-history.service.ts`
- Suffix indicates type: `.service.ts`, `.repository.ts`, `.store.ts`, `.facade.ts`, `.use-case.ts`

**Backend service structure:**

```
services/[domain]/
├── [domain].service.ts      # Main logic (descriptive name for IDE)
├── index.ts                 # Barrel export: export * from './[domain].service'
├── config.ts                # Configuration constants (if needed)
└── use-cases/               # Complex operations (if needed)
    ├── [action].use-case.ts
    └── index.ts
```

The `index.ts` files are thin barrel exports only. Main logic lives in descriptively named files.

**Functions:**

- Verbs for actions: `calculateDifficulty()`, `applyEffects()`
- Prefixes indicate intent: `get*`, `create*`, `update*`, `delete*`, `is*`, `has*`, `can*`

**Types:**

- PascalCase for interfaces and types: `PlayerCharacter`, `ActivityResult`
- Descriptive names over abbreviations: `RelationshipAxes` not `RelAxes`

## Function Design

**Keep functions small and focused:**

- One responsibility per function
- If explaining with "and", split it
- Extract named helpers over inline complexity

**Prefer pure functions:**

- Same input always produces same output
- No side effects
- Easy to test in isolation

**Parameter objects for 3+ arguments:**

```typescript
// Prefer
function calculate(options: CalculateOptions): Result

// Over
function calculate(a: number, b: number, c: string, d: boolean): Result
```

## Error Handling

**Fail fast and explicitly:**

- Validate inputs at boundaries
- Throw descriptive errors, not silent failures
- Use typed error classes for expected failures

**Errors bubble up:**

- Domain services throw, use cases catch or propagate
- Use cases throw typed errors, routes catch and map to HTTP
- Facades catch, stores update error state
- Components display error state

## Imports and Exports

**Explicit exports:**

- Export only public API from index files
- Internal helpers stay private to their module

**Import order:**

1. External libraries
2. Shared types
3. Internal modules
4. Relative imports

## Comments

**Code should be self-documenting:**

- Prefer clear names over comments
- Comment the "why", not the "what", and only document the bare necessities
- JSDoc for public API only

**Required comments:**

- Non-obvious business rules
- Workarounds with context
- Configuration value meanings, if not clear from variables (which should be preferred)

**Comment antipatterns:**
- Historical context ("this was implemented in phase 2.5.1") is irrelevant: avoid this, and remove it on refactorings