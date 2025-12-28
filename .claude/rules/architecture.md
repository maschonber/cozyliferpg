# Architectural Principles

## Separation of Concerns

Every layer has one job. Code should not cross boundaries:

- **HTTP handling** belongs in routes only
- **Business logic** belongs in services only
- **Data access** belongs in repositories only
- **State management** belongs in stores only
- **Presentation** belongs in components only

If a file does two of these things, it needs refactoring.

## Data Flow

Data flows in one direction through clearly defined layers:

**Backend:** Route → Application Service → Domain Service → Repository → Database

**Frontend:** Component → Facade → Repository/Store → Backend

Never skip layers. A component should not call a repository directly. A route should not execute SQL directly.

## Pure Functions for Domain Logic

Domain services must be pure functions:

- No I/O (database, HTTP, filesystem)
- No side effects
- Deterministic output for given input
- All dependencies passed as arguments

This enables testability and reusability.

## Configuration Over Code

Game rules, thresholds, and tunable values belong in configuration:

- Define constants in dedicated config files
- Domain services read from configuration, never hardcode magic numbers
- Changes to game balance should not require logic changes

## Shared Types as Contracts

The `shared/` directory defines the contract between frontend and backend:

- All API request/response types live in shared
- Both frontend and backend import from shared
- Type changes require updating both sides
- Use discriminated unions with type guards for variants

## Feature Cohesion

Related code stays together by feature/domain:

- Each feature has its own directory
- Internal implementation details are private
- Public API is exported through index files
- Features communicate through well-defined interfaces
