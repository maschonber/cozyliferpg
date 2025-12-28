---
paths: src/app/**/*.ts
---

# Frontend Layer Responsibilities

## Components (src/app/**/components/)

Components handle presentation only:

- Render UI based on signals
- Capture user input
- Delegate actions to facades immediately
- Display loading and error states

Components must NOT:

- Contain business logic
- Call repositories directly
- Manage complex state
- Make decisions about data

### Smart vs Presentational

**Smart components** (feature containers):

- Inject facades
- Subscribe to signals
- Pass data to presentational children

**Presentational components**:

- Receive data via @Input
- Emit events via @Output
- No injected services
- Pure rendering

## Facades (src/app/**/services/*.facade.ts)

Facades orchestrate frontend operations:

- Coordinate store and repository calls
- Manage side effects (navigation, logging)
- Expose signals for components
- Handle error states

Facades must NOT:

- Contain game logic calculations
- Know about component implementation
- Directly manipulate DOM

Facades are the single point of contact for components. One facade per feature domain.

## Stores (src/app/**/store/*.store.ts)

Stores manage reactive state:

- Hold application state as signals
- Provide computed signals for derived data
- Expose methods to update state
- Maintain single source of truth

Stores must NOT:

- Make HTTP calls
- Contain business logic
- Know about components

Use `@ngrx/signals` patterns. State changes through explicit methods only.

## Repositories (src/app/**/services/*.repository.ts)

Repositories handle HTTP communication:

- Build and execute requests
- Transform API responses to domain models
- Handle HTTP errors

Repositories must NOT:

- Contain business logic
- Manage state
- Know about UI concerns

One repository per backend domain. Return Observables of domain types.

## Shared Components (src/app/shared/)

Shared components are reusable UI elements:

- Purely presentational
- Feature-agnostic
- Well-documented inputs/outputs
- Consistent styling
