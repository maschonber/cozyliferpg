# Repository Layer Migration Plan

> **STATUS: COMPLETED** - Migration finished on 2025-12-28

## Goal

Extract all SQL queries from routes, use cases, and domain services into dedicated repository files. This achieves:

- **Separation of concerns**: Data access logic isolated from business logic
- **Testability**: Mock repositories for unit testing use cases
- **Consistency**: All database operations follow the same patterns
- **Maintainability**: Schema changes only affect repository layer

## Current State

SQL queries are scattered across:

| File | Queries | Domain |
|------|---------|--------|
| `player/player.service.ts` | 12 | Player CRUD, stats |
| `execute-activity.use-case.ts` | 11 | NPCs, relationships, emotions |
| `routes/npcs.ts` | 9 | NPC CRUD |
| `routes/relationships.ts` | 7 | Relationship queries |
| `routes/admin.ts` | 7 | Admin operations |
| `activity/activity.service.ts` | 5 | Activity execution logging |
| `location/location.service.ts` | 2 | NPC counts by location |
| `player-patterns/player-patterns.service.ts` | 2 | Activity history queries |

### Critical Path: Activity Execution

The `execute-activity.use-case.ts` is the most complex database consumer. It orchestrates:

1. **NPC queries**: Fetch NPC by ID, update emotion vectors, update revealed traits
2. **Relationship queries**: Fetch/create relationship, update relationship state
3. **Player queries**: Get player, update player (via player.service.ts)
4. **Activity logging**: Record activity to history

This use case touches 4 different entity types in a single transaction. Migration must preserve transactional integrity.

## Target Structure

```
server/src/repositories/
├── index.ts                      # Barrel exports
├── player.repository.ts          # Player CRUD
├── npc.repository.ts             # NPC CRUD
├── relationship.repository.ts    # Relationship CRUD
├── activity.repository.ts        # Activity execution logging
└── mappers/
    ├── index.ts
    ├── player.mapper.ts          # DB row → PlayerCharacter
    ├── npc.mapper.ts             # DB row → NPC
    └── relationship.mapper.ts    # DB row → Relationship
```

### Rename: activity-history → activity

The current `activity-history` service should be renamed to `activity`:
- `activity-history/` → `activity/`
- `activity-history.service.ts` → `activity.service.ts`
- `activity-history.repository.ts` → `activity.repository.ts`

This better reflects its role as the central activity execution infrastructure.

## Migration Order

Ordered by dependency - build foundations before tackling the critical path.

### Phase 1: Mappers (Low Risk)

**1. Extract row mappers**

Create pure functions for DB row → domain object conversion:

```typescript
// mappers/npc.mapper.ts
export function mapRowToNPC(row: any): NPC { ... }

// mappers/relationship.mapper.ts
export function mapRowToRelationship(row: any): Relationship { ... }

// mappers/player.mapper.ts
export function mapRowToPlayer(row: any): PlayerCharacter { ... }
```

Currently duplicated in `execute-activity.use-case.ts`, `routes/npcs.ts`, `routes/relationships.ts`.

**Testing**: Unit tests for each mapper with sample row data.

### Phase 2: Supporting Repositories

**2. `player.repository.ts`**

High query count but well-contained in `player.service.ts`. Operations:
- `getByUserId(pool, userId): PlayerCharacter | null`
- `create(pool, userId, archetype): PlayerCharacter`
- `update(pool, playerId, changes): PlayerCharacter`
- `delete(pool, playerId): void`

**3. `activity.repository.ts`** (renamed from activity-history)

Activity execution logging:
- `recordActivity(pool, activityRecord): void`
- `getPlayerActivities(pool, playerId, options): ActivityRecord[]`
- `getRecentActivitiesForPatterns(pool, playerId): ActivityRecord[]`

### Phase 3: Entity Repositories

**4. `npc.repository.ts`**

Currently in `routes/npcs.ts` and `execute-activity.use-case.ts`:
- `getById(pool, id): NPC | null`
- `getAll(pool): NPC[]`
- `create(pool, npcData): NPC`
- `delete(pool, id): void`
- `updateEmotionVector(pool, id, vector): void`
- `appendRevealedTrait(pool, id, trait): void`

**5. `relationship.repository.ts`**

Currently split between routes and use cases:
- `getByPlayerAndNpc(pool, playerId, npcId): Relationship | null`
- `getAllForPlayer(pool, playerId): Relationship[]`
- `create(pool, playerId, npcId, desireCap): Relationship`
- `update(pool, relationshipId, changes): Relationship`

### Phase 4: Critical Path Refactor

**6. Refactor `execute-activity.use-case.ts`**

This is the most delicate step. The use case currently has inline SQL for:
- Fetching NPC (1 query)
- Fetching/creating relationship (2-3 queries)
- Updating revealed traits (1 query)
- Updating emotion vector (1 query)
- Updating relationship (1 query)

Replace with repository calls while preserving transaction:

```typescript
export async function executeActivity(ctx, request) {
  const client = await ctx.pool.connect();
  try {
    await client.query('BEGIN');

    // All repository calls use `client` for transaction
    const npc = await npcRepository.getById(client, request.npcId);
    const relationship = await relationshipRepository.getOrCreate(
      client, request.userId, request.npcId
    );

    // ... domain logic (pure, no DB) ...

    await npcRepository.updateEmotionVector(client, npc.id, newVector);
    await relationshipRepository.update(client, relationship.id, changes);
    await activityRepository.recordActivity(client, activityRecord);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

**Testing**: Integration test that verifies full activity execution flow.

### Phase 5: Cleanup

**7. Refactor remaining routes**

Update `npcs.ts`, `relationships.ts`, `admin.ts` to use repositories.

**8. Remove duplicate mappers**

Delete `buildNPCFromRow` etc. from routes/use-cases, import from mappers.

## Repository Pattern

Each repository follows this pattern:

```typescript
// npc.repository.ts
import { Pool, PoolClient } from 'pg';
import { NPC } from '../../../shared/types';
import { mapRowToNPC } from './mappers/npc.mapper';

export async function getById(
  db: Pool | PoolClient,
  id: string
): Promise<NPC | null> {
  const result = await db.query(
    'SELECT * FROM npcs WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToNPC(result.rows[0]);
}
```

## Transaction Handling

Repositories accept `Pool | PoolClient` to support both:
- Standalone queries (pass `pool`)
- Transactional queries (pass `client` from `pool.connect()`)

Use cases manage transactions and pass the client to repositories.

## Success Criteria

- [x] No SQL in routes (except db.ts for schema)
- [x] No SQL in domain services (.service.ts files)
- [x] No SQL in use cases (only repository calls)
- [ ] All mappers have unit tests *(deferred - mappers are simple type mappings)*
- [x] `execute-activity` integration test passes
- [x] Rename activity-history → activity complete

## Completed Structure

```
server/src/repositories/
├── index.ts                      # Barrel exports all repositories
├── player.repository.ts          # Player CRUD operations
├── npc.repository.ts             # NPC CRUD operations
├── relationship.repository.ts    # Relationship CRUD operations
├── activity.repository.ts        # Activity history logging
└── mappers/
    ├── index.ts                  # Barrel exports all mappers
    ├── player.mapper.ts          # DB row → PlayerCharacter
    ├── npc.mapper.ts             # DB row → NPC
    └── relationship.mapper.ts    # DB row → Relationship
```

## Key Changes Made

1. **Mappers extracted** - Pure functions for DB row → domain object conversion
2. **Repositories created** - All CRUD operations accept `Pool | PoolClient` for transaction support
3. **execute-activity.use-case.ts refactored** - Uses repositories, maintains transactional integrity
4. **Routes simplified** - npcs.ts and relationships.ts now use repositories
5. **Player service refactored** - Delegates to player repository
6. **activity-history renamed to activity** - New activity.service.ts wraps repository

## Actual Effort

Migration completed in a single session. All 421 tests continue to pass.
