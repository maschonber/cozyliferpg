# Activity System Refactoring Plan

## Overview

This plan refactors the activity system from a single 943-line file with a bloated interface into a well-organized, type-safe, extensible architecture.

**Goals:**
1. Split activities into category-based files
2. Remove deprecated fields and clean up inconsistencies
3. Introduce discriminated union types for type safety
4. Add factory functions for cleaner activity definitions
5. (Optional) Enhance tag system for flexible filtering

---

## Phase 1: Cleanup & Preparation

**Objective:** Remove technical debt without changing architecture.

### 1.1 Remove Deprecated `statEffects` Field

**Files to change:**
- `shared/types.ts` - Remove `statEffects` from Activity interface
- `server/src/services/relationship/activities.ts` - Migrate 4 activities using `statEffects`:
  - `stroll_park` (line 727)
  - `beach_walk` (line 842)
  - `play_video_games` (line 740) - needs outcomeProfile or remove effects
  - `watch_tv` (line 753) - needs outcomeProfile or remove effects
  - `window_shopping` (line 855) - needs outcomeProfile or remove effects
- `server/src/routes/activities.ts` - Remove fallback logic for `statEffects` (lines 237-272)

**Decision needed:** For passive leisure activities (video games, TV, window shopping) that have no stat effects - should they:
- A) Stay passive (no outcomeProfile, no difficulty) - simplest
- B) Get minimal outcomeProfile (e.g., +0.5 poise for relaxing)

### 1.2 Remove Unused `minEnergy` Field

**Files to change:**
- `shared/types.ts` - Remove `minEnergy` from Activity interface
- No activities use this field, and `canPerformActivity` in time service doesn't check it

### 1.3 Add Missing `outcomeProfile` to Incomplete Activities

Activities currently missing outcomeProfile (beyond passive leisure):
- All passive leisure activities need decision (see 1.1)

### 1.4 Ensure All Activities Have Consistent Structure

- Verify all social activities have `effects` defined
- Verify all training activities have `difficulty` and `relevantStats`
- Verify all work activities have `outcomeProfile.mainMoneyGain`

---

## Phase 2: File Organization

**Objective:** Split the monolithic activities file by category.

### 2.1 Create New Directory Structure

```
server/src/activities/
├── index.ts                 # Re-exports ACTIVITIES array and types
├── types.ts                 # Activity type definitions (discriminated unions)
├── factories.ts             # Factory functions for each activity type
├── work.activities.ts       # 3 work activities
├── social.activities.ts     # 12 social activities
├── training.activities.ts   # 13 self-improvement activities
├── leisure.activities.ts    # 9 leisure activities
├── recovery.activities.ts   # 2 self-care activities
├── discovery.activities.ts  # 1 discovery activity
└── config.ts                # Shared constants and defaults
```

### 2.2 Move Activities to Category Files

Each file exports a typed array:
```typescript
// work.activities.ts
import { WorkActivity } from './types';

export const WORK_ACTIVITIES: WorkActivity[] = [
  // ... work activities
];
```

### 2.3 Update Index to Combine All Activities

```typescript
// index.ts
import { WORK_ACTIVITIES } from './work.activities';
import { SOCIAL_ACTIVITIES } from './social.activities';
// ... etc

export const ACTIVITIES: Activity[] = [
  ...WORK_ACTIVITIES,
  ...SOCIAL_ACTIVITIES,
  ...TRAINING_ACTIVITIES,
  ...LEISURE_ACTIVITIES,
  ...RECOVERY_ACTIVITIES,
  ...DISCOVERY_ACTIVITIES,
];

// Re-export for backward compatibility
export { getActivityById, getAvailableActivities } from './queries';
```

### 2.4 Update Import Paths

**Files to update:**
- `server/src/services/relationship/index.ts` - Update import path
- `server/src/routes/activities.ts` - Update import path
- `server/src/routes/relationships.ts` - Update import path

### 2.5 Remove Old File

- Delete `server/src/services/relationship/activities.ts`
- Keep `server/src/services/relationship/index.ts` (relationship logic stays)

---

## Phase 3: Discriminated Union Types

**Objective:** Replace the bloated Activity interface with focused types per activity kind.

### 3.1 Define Base Activity Type

```typescript
// shared/types.ts or server/src/activities/types.ts

interface BaseActivity {
  id: string;
  name: string;
  description: string;
  timeCost: number;
  energyCost: number;
  moneyCost: number;
  location?: LocationId;
  allowedTimeSlots?: TimeSlot[];
  tags?: ActivityTag[];
}
```

### 3.2 Define Discriminated Activity Types

```typescript
// Type discriminator replaces both 'category' and 'requiresNPC'

interface WorkActivity extends BaseActivity {
  type: 'work';
  difficulty: number;
  relevantStats: StatName[];
  outcomeProfile: WorkOutcomeProfile;  // mainMoneyGain required
  statRequirements?: Partial<Record<StatName, number>>;
}

interface SocialActivity extends BaseActivity {
  type: 'social';
  relationshipEffects: { trust?: number; affection?: number; desire?: number };
  minRelationship?: RelationshipState;
  difficulty: number;
  relevantStats: StatName[];
  outcomeProfile?: ActivityOutcomeProfile;
  statRequirements?: Partial<Record<StatName, number>>;
}

interface TrainingActivity extends BaseActivity {
  type: 'training';
  difficulty: number;
  relevantStats: StatName[];
  outcomeProfile: ActivityOutcomeProfile;
  statRequirements?: Partial<Record<StatName, number>>;
}

interface LeisureActivity extends BaseActivity {
  type: 'leisure';
  difficulty?: number;  // Optional - passive activities have none
  relevantStats?: StatName[];
  outcomeProfile?: ActivityOutcomeProfile;
}

interface RecoveryActivity extends BaseActivity {
  type: 'recovery';
  // energyCost is positive (restores energy)
  // No difficulty, no stats
}

interface DiscoveryActivity extends BaseActivity {
  type: 'discovery';
  difficulty: number;
  relevantStats: StatName[];
  outcomeProfile: ActivityOutcomeProfile;
}

type Activity =
  | WorkActivity
  | SocialActivity
  | TrainingActivity
  | LeisureActivity
  | RecoveryActivity
  | DiscoveryActivity;
```

### 3.3 Create Type Guards

```typescript
// Utility functions for type narrowing
export function isWorkActivity(a: Activity): a is WorkActivity {
  return a.type === 'work';
}

export function isSocialActivity(a: Activity): a is SocialActivity {
  return a.type === 'social';
}

export function requiresNPC(a: Activity): boolean {
  return a.type === 'social';
}

export function getCategory(a: Activity): ActivityCategory {
  const categoryMap: Record<Activity['type'], ActivityCategory> = {
    work: 'work',
    social: 'social',
    training: 'self_improvement',
    leisure: 'leisure',
    recovery: 'self_care',
    discovery: 'discovery',
  };
  return categoryMap[a.type];
}
```

### 3.4 Update Consumers to Use New Types

**Backend routes (HIGH IMPACT):**

`server/src/routes/activities.ts`:
```typescript
// Before
if (activity.requiresNPC) { ... }

// After
if (isSocialActivity(activity)) { ... }
// Or: if (activity.type === 'social') { ... }
```

`server/src/routes/relationships.ts`:
```typescript
// Before
if (!activity.requiresNPC) { ... }

// After
if (!isSocialActivity(activity)) { ... }
```

**Frontend components:**

`game-home.ts` and `neighbor-detail.ts`:
```typescript
// Before
activities.filter(a => a.requiresNPC === false)

// After
activities.filter(a => a.type !== 'social')
// Or use helper: activities.filter(a => !requiresNPC(a))
```

**Services using category:**

`server/src/services/trait/index.ts`:
```typescript
// Before
if (activity.category === 'work') { ... }

// After
if (activity.type === 'work') { ... }
// Or: if (getCategory(activity) === 'work') { ... }
```

### 3.5 Backward Compatibility Layer (Optional)

If we want to minimize changes to consumers, add computed properties:

```typescript
// In index.ts, after combining activities
export const ACTIVITIES: Activity[] = [
  ...WORK_ACTIVITIES,
  // ...
].map(activity => ({
  ...activity,
  // Computed for backward compat
  requiresNPC: activity.type === 'social',
  category: getCategory(activity),
}));
```

**Recommendation:** Skip this. Better to update consumers properly.

---

## Phase 4: Factory Functions

**Objective:** Reduce boilerplate and enforce type safety at definition time.

### 4.1 Define Factory Functions

```typescript
// server/src/activities/factories.ts

import { WorkActivity, SocialActivity, TrainingActivity, ... } from './types';

// Work activity factory
interface WorkActivityConfig {
  id: string;
  name: string;
  description: string;
  location: LocationId;
  timeCost: number;
  energyCost: number;
  difficulty: number;
  relevantStats: StatName[];
  mainMoneyGain: number;
  allowedTimeSlots?: TimeSlot[];
  statRequirements?: Partial<Record<StatName, number>>;
  secondaryStats?: StatName[];
  secondaryStatGain?: number;
  negativeEffects?: NegativeEffects;
  tags?: ActivityTag[];
}

export function workActivity(config: WorkActivityConfig): WorkActivity {
  return {
    type: 'work',
    id: config.id,
    name: config.name,
    description: config.description,
    location: config.location,
    timeCost: config.timeCost,
    energyCost: config.energyCost,
    moneyCost: 0,  // Work activities earn, not cost
    difficulty: config.difficulty,
    relevantStats: config.relevantStats,
    allowedTimeSlots: config.allowedTimeSlots,
    statRequirements: config.statRequirements,
    tags: config.tags ?? ['work'],
    outcomeProfile: {
      mainStats: [],
      mainStatGain: 0,
      mainMoneyGain: config.mainMoneyGain,
      secondaryStats: config.secondaryStats,
      secondaryStatGain: config.secondaryStatGain,
      negativeEffects: config.negativeEffects,
    },
  };
}

// Similar factories for other types...
export function socialActivity(config: SocialActivityConfig): SocialActivity { ... }
export function trainingActivity(config: TrainingActivityConfig): TrainingActivity { ... }
export function leisureActivity(config: LeisureActivityConfig): LeisureActivity { ... }
export function recoveryActivity(config: RecoveryActivityConfig): RecoveryActivity { ... }
export function discoveryActivity(config: DiscoveryActivityConfig): DiscoveryActivity { ... }
```

### 4.2 Rewrite Activities Using Factories

```typescript
// server/src/activities/work.activities.ts

import { workActivity } from './factories';

export const WORK_ACTIVITIES = [
  workActivity({
    id: 'work_part_time',
    name: 'Work Part-Time Job',
    description: 'Work a 4-hour shift at your part-time job',
    location: 'shopping_district',
    timeCost: 240,
    energyCost: -30,
    difficulty: 30,
    relevantStats: ['ambition'],
    mainMoneyGain: 80,
    allowedTimeSlots: ['morning', 'afternoon'],
    secondaryStats: ['confidence', 'poise', 'wit'],
    secondaryStatGain: 0.5,
    negativeEffects: {
      stats: ['confidence', 'ambition'],
      statPenalty: 1,
      energyCost: 10,
      timeCost: 30,
    },
  }),

  // ... more work activities
];
```

### 4.3 Benefits of Factories

1. **Default values** - `moneyCost: 0` for work, `requiresNPC` implicit
2. **Required fields** - TypeScript enforces `mainMoneyGain` for work
3. **Cleaner syntax** - Nested outcomeProfile flattened in config
4. **Validation** - Could add runtime checks in factory
5. **Auto-tagging** - Work activities auto-tagged with 'work'

---

## Phase 5: Update Tests

**Objective:** Ensure all tests pass with new structure.

### 5.1 Update Test Imports

All test files importing from old path need updates:
- `server/src/services/relationship/index.test.ts`
- `server/src/services/npc-generator/index.test.ts`
- `server/src/services/social-activity/index.test.ts`
- Any other tests using ACTIVITIES

### 5.2 Add Type Guard Tests

```typescript
// server/src/activities/types.test.ts
describe('Activity type guards', () => {
  it('identifies work activities', () => {
    expect(isWorkActivity(WORK_ACTIVITIES[0])).toBe(true);
    expect(isWorkActivity(SOCIAL_ACTIVITIES[0])).toBe(false);
  });

  // ... more tests
});
```

### 5.3 Run Full Test Suite

```bash
npm run test:backend
npm run typecheck --prefix server
```

---

## Phase 6: (Optional) Enhanced Tag System

**Objective:** Add rich tagging for flexible filtering.

### 6.1 Define Tag Types

```typescript
type ActivityTag =
  // Primary type (one per activity, matches type)
  | 'work' | 'social' | 'training' | 'leisure' | 'recovery' | 'discovery'
  // Focus area
  | 'physical' | 'mental' | 'creative' | 'social-skill'
  // Social mood
  | 'romantic' | 'friendly' | 'casual'
  // Environment
  | 'indoor' | 'outdoor'
  // Cost
  | 'free' | 'cheap' | 'expensive'
  // Duration
  | 'quick' | 'medium' | 'long';
```

### 6.2 Add Tags to All Activities

Example tagging:
- `work_part_time`: ['work', 'indoor', 'medium']
- `have_coffee`: ['social', 'friendly', 'casual', 'indoor', 'cheap', 'quick']
- `morning_jog`: ['training', 'physical', 'outdoor', 'free', 'quick']
- `deep_conversation`: ['social', 'friendly', 'mental', 'indoor', 'free', 'medium']

### 6.3 Create Tag Query Functions

```typescript
export function getActivitiesByTag(tag: ActivityTag): Activity[] {
  return ACTIVITIES.filter(a => a.tags?.includes(tag));
}

export function getActivitiesByTags(tags: ActivityTag[], matchAll = false): Activity[] {
  return ACTIVITIES.filter(a => {
    if (!a.tags) return false;
    return matchAll
      ? tags.every(t => a.tags!.includes(t))
      : tags.some(t => a.tags!.includes(t));
  });
}
```

---

## Implementation Order

### Step 1: Cleanup (Phase 1)
- [ ] Remove `statEffects` from 4 activities (migrate to outcomeProfile or remove)
- [ ] Remove `statEffects` from Activity interface
- [ ] Remove `statEffects` fallback in routes/activities.ts
- [ ] Remove unused `minEnergy` field
- [ ] Run tests, fix any issues

### Step 2: File Split (Phase 2)
- [ ] Create `server/src/activities/` directory
- [ ] Create category files with current Activity interface (no type changes yet)
- [ ] Create index.ts to combine and re-export
- [ ] Update all import paths
- [ ] Delete old activities.ts
- [ ] Run tests, fix any issues

### Step 3: Type Safety (Phase 3)
- [ ] Define discriminated union types in `types.ts`
- [ ] Create type guard functions
- [ ] Update activity definitions to use `type` field
- [ ] Update all consumers to use new type checks
- [ ] Remove `requiresNPC` and `category` from activities (use `type` instead)
- [ ] Run tests, fix any issues

### Step 4: Factories (Phase 4)
- [ ] Create factory functions in `factories.ts`
- [ ] Rewrite activity definitions using factories
- [ ] Run tests, verify no regressions

### Step 5: (Optional) Tags (Phase 6)
- [ ] Define tag type
- [ ] Add tags to all activities
- [ ] Create query functions
- [ ] Update consumers to use tags if beneficial

---

## Files Changed Summary

### Backend Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `shared/types.ts` | Modify | New Activity union type, remove deprecated fields |
| `server/src/activities/*` | New | New directory with split files |
| `server/src/services/relationship/activities.ts` | Delete | Replaced by new structure |
| `server/src/services/relationship/index.ts` | Modify | Update imports |
| `server/src/routes/activities.ts` | Modify | Use type guards, remove statEffects fallback |
| `server/src/routes/relationships.ts` | Modify | Use type guards |
| `server/src/services/time/index.ts` | Modify | Use type guards if needed |
| `server/src/services/trait/index.ts` | Modify | Use getCategory() helper |
| `server/src/services/defensive-stats/index.ts` | Modify | Use getCategory() helper |
| `server/src/services/mixed-stats/index.ts` | Modify | Use getCategory() helper |

### Frontend Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/app/features/game/components/game-home/game-home.ts` | Modify | Filter by type instead of requiresNPC |
| `src/app/features/game/components/neighbor-detail/neighbor-detail.ts` | Modify | Filter by type instead of requiresNPC |
| `src/app/shared/components/activity-button/activity-button.component.ts` | Minor | May need type narrowing |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking API response format | Low | High | Activity objects still have same shape, just typed differently |
| Frontend type errors | Medium | Medium | Run `npm run build` to catch all issues |
| Database activity_history mismatch | Low | Low | History stores activity_id, not full object |
| Test failures | Medium | Low | Run tests after each phase |

---

## Success Criteria

1. All tests pass (`npm run test:backend`)
2. TypeScript compiles without errors (`npm run typecheck --prefix server`)
3. Frontend builds successfully (`npm run build`)
4. Activities render correctly in UI
5. Solo and social activities work as before
6. Activity outcomes unchanged

---

## Time Estimate

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Cleanup | 30 min |
| Phase 2: File Split | 45 min |
| Phase 3: Discriminated Unions | 1-2 hours |
| Phase 4: Factories | 1 hour |
| Phase 5: Tests | 30 min |
| Phase 6: Tags (optional) | 30 min |
| **Total** | **4-5 hours** |

---

## Questions to Resolve Before Starting

1. **Passive leisure activities** - Should `play_video_games`, `watch_tv`, `window_shopping` remain truly passive (no stat effects) or get minimal outcomeProfiles?

2. **Backward compatibility** - Do we need to maintain `requiresNPC` and `category` fields on the Activity type, or can we fully replace with `type`?

3. **Tag scope** - How extensive should initial tagging be? Minimal (just primary type) or rich (all suggested tags)?

4. **Shared types location** - Should discriminated union types live in `shared/types.ts` (accessible to frontend) or `server/src/activities/types.ts` (backend only)?
