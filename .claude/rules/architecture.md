# Architectural Principles

## Domain-Driven Design

The codebase follows Domain-Driven Design (DDD) principles to model complex game mechanics:

**Aggregates** are consistency boundaries—clusters of objects treated as a unit:

- Each aggregate has a root entity that controls access
- Repositories operate on aggregate roots, not internal objects
- Cross-aggregate references use IDs, not direct object references

**Value Objects** are immutable objects defined by their attributes, not identity:

- Two value objects with the same attributes are equal
- Use for concepts like coordinates, axis values, effect magnitudes
- Prefer value objects over primitives for domain concepts

**Domain Services** contain logic that doesn't belong to a single entity:

- Operations spanning multiple aggregates
- Calculations requiring data from several sources
- Pure functions that transform domain objects

**Bounded Contexts** isolate domain models with clear interfaces:

- Each feature area defines its own ubiquitous language
- Shared concepts may have different representations in different contexts
- Translation happens at context boundaries

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

## Data-Driven Game Design

Game content is defined as data, interpreted by generic engines:

**Mechanics as Data:**

- Activities, traits, locations, and other game elements are declarative definitions
- Domain services interpret these definitions without hardcoded element knowledge
- Adding new content means adding data, not writing new logic

**Configuration Hierarchy:**

- `config.ts` files hold tunable constants (thresholds, multipliers, caps)
- Definition files hold game content (activity definitions, trait mappings)
- Domain services receive both as parameters

**Benefits:**

- Balance changes require no code changes
- New content is additive, not invasive
- Testing covers the engine, not every content permutation

This pattern enables rapid iteration on game feel without touching logic.

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

## Effects and State Transitions

Game state evolves through discrete effects applied atomically:

**Effect Objects:**

- Actions produce effect objects describing what should change
- Effects are data structures, not imperative mutations
- Multiple effects from a single action are collected and applied together

**Atomic Application:**

- Use cases collect all effects before applying any
- Database transactions ensure all-or-nothing consistency
- Failed operations leave state unchanged

**State Machines:**

- Complex domain states (relationship status, progression phases) are state machines
- Transitions are explicit and validated—not all state changes are legal
- Current state determines available transitions
- State machine logic lives in domain services, persistence in repositories

**Outcome-Driven Effects:**

- Activities with uncertain outcomes use dice mechanics to determine results
- Outcome tiers (e.g., catastrophic → best) scale effect magnitudes
- Effect definitions specify base values; outcome tier applies multipliers
- This separates "what can happen" from "how well it went"

This pattern keeps state changes predictable, testable, and auditable.
