---
paths: server/**/*.ts
---

# Backend Layer Responsibilities

## Routes (server/src/routes/)

Routes handle HTTP concerns only:

- Parse and validate request input
- Authenticate and authorize
- Call use cases for complex operations
- Transform results to HTTP responses
- Catch errors and map to HTTP status codes

Routes must NOT:

- Contain business logic
- Execute database queries
- Instantiate domain objects
- Know about game mechanics

A route should be thin: validate, delegate, respond.

## Use Cases (server/src/services/**/use-cases/)

Use cases orchestrate complex operations:

- Coordinate multiple domain services
- Manage transactions
- Call repositories for data access
- Enforce cross-cutting concerns

### When to Create a Use Case

Create a use case when an operation:

- Coordinates multiple services or data sources
- Requires transaction management
- Has complex validation or business rules
- Would make a route exceed ~50 lines

Keep simple CRUD operations in routes until complexity warrants extraction.

### Use Case Pattern

Use functional style with context injection:

```typescript
interface UseCaseContext {
  pool: Pool;
}

interface ExecuteActivityRequest {
  userId: string;
  activityId: string;
}

export async function executeActivity(
  ctx: UseCaseContext,
  request: ExecuteActivityRequest
): Promise<ActivityResult> {
  // orchestration logic
}
```

### Use Case Error Handling

Define typed errors with HTTP status codes for validation failures:

```typescript
export class ActivityValidationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ActivityValidationError';
  }
}
```

Routes catch these and map to HTTP responses:

```typescript
try {
  const result = await executeActivity(ctx, request);
  res.json({ success: true, data: result });
} catch (error) {
  if (error instanceof ActivityValidationError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }
  // handle unexpected errors
}
```

## Domain Services (server/src/services/**/[name].service.ts)

Domain services implement pure game logic:

- Calculate outcomes, modifiers, effects
- Apply game rules and formulas
- Transform domain objects

Domain services must:

- Be pure functions (no I/O)
- Accept all data as parameters
- Return results, not persist them
- Have comprehensive unit tests
- Own their constants (define in one place, import elsewhere)
- Return complete values, not partial results that callers must augment

## Repositories (server/src/repositories/)

Repositories encapsulate data access:

- Execute SQL queries
- Map database rows to domain objects
- Handle database-specific concerns

Repositories must NOT:

- Contain business logic
- Know about HTTP
- Transform data beyond mapping

One repository per aggregate root. Return domain objects, not raw rows.

## Configuration (server/src/services/**/config.ts)

Configuration holds tunable values:

- Thresholds, multipliers, caps
- Feature flags
- Game balance constants

Configuration must be:

- Separate from logic
- Easy to find and modify
- Documented with purpose
