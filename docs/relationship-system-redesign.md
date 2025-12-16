# Relationship System Redesign

## Technical Requirements Specification

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2025-12-16

---

## 1. Overview

This document specifies the redesign of the relationship system to create a rich dating simulator experience. The system introduces:

- **3-axis relationship model:** Trust, Affection, Desire (replacing friendship/romance)
- **Numerical emotion tracking:** 8 emotion values with intensity tiers and decay
- **Expanded trait system:** Personality and romance-focused traits affecting gameplay
- **Dynamic difficulty:** Social activity success influenced by emotions, relationship level, and trait matching
- **Trait discovery:** Hidden traits revealed through gameplay

---

## 2. Architecture Principles

### 2.1 Domain Separation

Each subsystem should be implemented as an independent service module:

```
services/
  relationship/      → Relationship axis calculations, state machine
  emotion/           → Emotion tracking, decay, display logic
  trait/             → Trait definitions, discovery, bonus calculations
  social-activity/   → Activity execution, difficulty, outcomes
```

**Pattern:** Use the existing service pattern (`server/src/services/*/index.ts`). Each service exports pure functions for calculations and stateful functions for persistence.

### 2.2 Single Responsibility

- **Emotion service:** Only manages emotion values and transitions
- **Relationship service:** Only manages relationship axes and states
- **Trait service:** Only manages trait definitions and bonus calculations
- **Social activity service:** Orchestrates the above for activity execution

**Pattern:** Facade pattern for `social-activity` service—it coordinates other services but delegates domain logic.

### 2.3 Data Flow

```
Activity Request
    ↓
[Social Activity Service] ←→ [Trait Service] (get bonuses)
    ↓
[Outcome Service] (existing) → roll calculation
    ↓
[Relationship Service] ←→ [Emotion Service]
    ↓
Persist & Return Response
```

---

## 3. Domain Models

### 3.1 Relationship Axes

| Axis | Range | Volatility | Description |
|------|-------|------------|-------------|
| **Trust** | -100 to +100 | Low | Reliability, safety, consistency |
| **Affection** | -100 to +100 | Medium | Warmth, fondness, emotional bond |
| **Desire** | -100 to +100 | High | Romantic/physical attraction, chemistry |

**Constraints:**
- Player sexual preference caps Desire for non-matching NPCs (max: 25)
- Future: Family NPCs cap Desire at 0

### 3.2 Emotion Model

**8 tracked emotions (0-100 each):**

| Category | Emotion | Decay Rate | Baseline |
|----------|---------|------------|----------|
| Positive | joy | Medium | 15 |
| Positive | affection | Slow | 10 |
| Positive | excitement | Fast | 5 |
| Positive | calm | Medium | 20 |
| Negative | sadness | Medium | 5 |
| Negative | anger | Fast | 0 |
| Negative | anxiety | Medium | 5 |
| Romantic | romantic | Variable* | 10 |

*Romantic decay rate inversely proportional to Trust level.

**Intensity Tiers:**

| Value Range | Tier | Display Modifier |
|-------------|------|------------------|
| 1-25 | Mild | content, friendly, interested, uneasy, disappointed, annoyed, curious |
| 26-50 | Moderate | happy, warm, intrigued, relaxed, sad, irritated, nervous, flirty |
| 51-75 | Strong | joyful, affectionate, excited, serene, upset, angry, anxious, romantic |
| 76-100 | Intense | ecstatic, adoring, thrilled, blissful, devastated, furious, distressed, passionate |

### 3.3 Trait Categories

**Personality Traits (16):**
- Social: `outgoing`, `reserved`
- Thinking: `logical`, `creative`, `intuitive`
- Risk: `adventurous`, `cautious`, `spontaneous`
- Emotional: `optimistic`, `melancholic`, `passionate`, `stoic`
- Interpersonal: `empathetic`, `independent`, `nurturing`, `competitive`

**Romance Traits (8):**
- `flirtatious`, `romantic`, `physical`, `intellectual`
- `slow_burn`, `intense`, `commitment_seeking`, `free_spirit`

**Interest Traits (8):**
- `coffee_lover`, `fitness_enthusiast`, `music_fan`, `art_appreciator`
- `foodie`, `reader`, `gamer`, `nature_lover`

### 3.4 Relationship States

Derive from 3-axis values using threshold logic:

| State | Conditions |
|-------|------------|
| `partner` | Trust ≥ 60, Affection ≥ 60, Desire ≥ 50 |
| `lover` | Desire ≥ 60, Affection ≥ 40, Trust < 60 |
| `close_friend` | Affection ≥ 60, Trust ≥ 40, Desire < 30 |
| `friend` | Affection ≥ 30, Trust ≥ 20 |
| `crush` | Desire ≥ 40, Affection < 30 |
| `acquaintance` | Any axis ≥ 10, none negative |
| `stranger` | All axes near 0 (-10 to 10) |
| `complicated` | Mixed positive/negative across axes |
| `rival` | Trust < -30 OR Affection < -30 |
| `enemy` | Trust < -50 AND Affection < -50 |

**Pattern:** State pattern or lookup table with priority ordering. Check conditions top-to-bottom, first match wins.

---

## 4. Work Tasks

### Task 1: Core Types & Schema

**Objective:** Define foundational types and database schema for the new system.

**Scope:**
- TypeScript interfaces in `shared/types.ts`
- Database schema updates in `server/src/db.ts`
- Type exports and enums

**Requirements:**

1. **Relationship interface:**
   - Replace `friendship: number, romance: number` with `trust: number, affection: number, desire: number`
   - Add `desireCap?: number` for preference-based limiting
   - Retain: `id`, `playerId`, `npcId`, `currentState`, `unlockedStates`, timestamps

2. **Emotion interface:**
   ```
   NPCEmotionState {
     npcId: string
     joy, affection, excitement, calm: number (0-100)
     sadness, anger, anxiety, romantic: number (0-100)
     lastUpdated: timestamp
   }
   ```

3. **Trait types:**
   - `PersonalityTrait` union type (16 values)
   - `RomanceTrait` union type (8 values)
   - `InterestTrait` union type (8 values)
   - `NPCTrait = PersonalityTrait | RomanceTrait | InterestTrait`

4. **NPC interface updates:**
   - Change `traits: string[]` to `traits: NPCTrait[]`
   - Add `revealedTraits: NPCTrait[]` (traits player has discovered)
   - Add `emotionState: NPCEmotionState`

5. **Database tables:**
   - Modify `relationships` table (new columns, remove old)
   - Add `npc_emotions` table (or embed in NPCs as JSON)
   - Update `npcs` table for trait structure

**Architectural Guidance:**
- Use discriminated unions for trait types to enable exhaustive checking
- Consider JSON column for emotion state (frequently updated as unit)
- Index relationships on `(playerId, npcId)` composite

**Testing:** Schema migration runs without error, types compile correctly.

**Dependencies:** None (foundational task)

---

### Task 2: Emotion System

**Objective:** Implement emotion tracking, decay, and display logic.

**Scope:**
- New service: `server/src/services/emotion/index.ts`
- Emotion calculations, decay, dominant emotion selection

**Requirements:**

1. **Emotion initialization:**
   - `initializeEmotions(npcId, traits): NPCEmotionState`
   - Baseline values modified by personality traits (optimistic → +10 joy baseline, melancholic → +10 sadness baseline)

2. **Emotion modification:**
   - `applyEmotionDelta(state, deltas: Partial<EmotionValues>): NPCEmotionState`
   - Clamp all values to 0-100
   - Track which emotions changed for event emission

3. **Decay calculation:**
   - `decayEmotions(state, hoursPassed, trustLevel): NPCEmotionState`
   - Each emotion decays toward its baseline at configured rate
   - Strong emotions (51+) decay slower
   - Romantic decay rate: `baseRate * (1 - trustLevel/200)` (higher trust = slower romantic decay)

4. **Dominant emotion:**
   - `getDominantEmotions(state): { primary: EmotionDisplay, secondary?: EmotionDisplay }`
   - Return highest value emotion mapped to intensity tier
   - If second highest within 10 points, include as secondary
   - Handle "mixed" state when 3+ emotions are close

5. **Intensity mapping:**
   - `getEmotionDisplay(emotion, value): EmotionDisplay`
   - Map emotion type + value to specific display string (e.g., `joy` + 65 → `"joyful"`)

**Architectural Guidance:**
- **Strategy pattern** for decay rates per emotion type
- **Pure functions** for all calculations (easy testing)
- Emotion display strings should be defined as const lookup tables, not computed
- Consider memoization for `getDominantEmotions` if called frequently

**Testing Requirements:**
- Unit tests for decay calculation at various intervals
- Unit tests for dominant emotion selection edge cases (ties, close values)
- Unit tests for trait-based initialization

**Dependencies:** Task 1 (types)

---

### Task 3: Relationship Axis System

**Objective:** Implement 3-axis relationship calculations and state derivation.

**Scope:**
- Refactor: `server/src/services/relationship/index.ts`
- New calculation logic, state machine

**Requirements:**

1. **Axis modification:**
   - `applyRelationshipDelta(current, deltas, desireCap?): RelationshipAxes`
   - Apply Trust, Affection, Desire changes
   - Respect `desireCap` for preference-limited relationships
   - Clamp to -100/+100

2. **State calculation:**
   - `calculateRelationshipState(axes): RelationshipState`
   - Implement priority-ordered condition checking (see §3.4)
   - Return most specific matching state

3. **Difficulty modifier:**
   - `getRelationshipDifficultyModifier(axes, state): number`
   - Positive relationship = easier interactions (-5 to -15)
   - Negative relationship = harder interactions (+10 to +30)
   - Stranger = neutral (0)

4. **Repair difficulty scaling:**
   - `getRepairDifficulty(currentValue): number`
   - Logarithmic scaling: repairing from -80 is proportionally harder than from -40
   - Formula suggestion: `baseDifficulty * (1 + Math.abs(currentValue) / 50)`

5. **Preference-based capping:**
   - `calculateDesireCap(playerPreference, npcGender): number`
   - Matching preference: no cap (100)
   - Non-matching: cap at 25
   - Future family: cap at 0

**Architectural Guidance:**
- **State pattern** or **lookup table** for relationship states
- Keep state calculation pure—no side effects
- Relationship service should not know about emotions (separation of concerns)
- Use **specification pattern** for state conditions if they become complex

**Testing Requirements:**
- Unit tests for state derivation across axis combinations
- Unit tests for edge cases at threshold boundaries
- Unit tests for desire capping logic

**Dependencies:** Task 1 (types)

---

### Task 4: Trait System

**Objective:** Implement trait definitions, discovery mechanics, and bonus calculations.

**Scope:**
- New service: `server/src/services/trait/index.ts`
- Trait data definitions, bonus calculations

**Requirements:**

1. **Trait definitions:**
   - Define all traits with metadata: category, description, gameplay effects
   - Store as const data structure, not database (traits are game rules, not user data)

2. **Trait-activity bonuses:**
   - `getTraitActivityBonus(npcTraits, activityId, playerArchetype): number`
   - Calculate cumulative bonus/penalty from trait-activity alignment
   - Example: `intellectual` + "deep_conversation" activity → +15 bonus
   - Example: `reserved` + "party" activity → -10 penalty

3. **Archetype bonuses:**
   - `getArchetypeBonus(npcArchetype, playerArchetype, activityCategory): number`
   - Matching archetypes on relevant activities → bonus
   - Define affinity matrix: which archetypes resonate with which activity types

4. **Trait discovery:**
   - `discoverTrait(npc, method): { trait: NPCTrait, isNew: boolean }`
   - Methods: "conversation" (reveals personality), "date" (reveals romance), "shared_activity" (reveals interest)
   - Prioritize unrevealed traits matching the method's category
   - Track in `npc.revealedTraits`

5. **Trait-based emotion modifiers:**
   - `getTraitEmotionModifiers(traits): Partial<EmotionBaselines>`
   - Personality traits affect emotion baselines and volatility
   - Example: `passionate` → higher baseline excitement, faster emotion swings

**Architectural Guidance:**
- **Data-driven design:** Trait effects defined in configuration, not hardcoded in logic
- Use **lookup tables** for trait-activity and archetype-activity bonuses
- **Factory pattern** for trait discovery (different discovery methods)
- Keep bonus calculations composable: `totalBonus = traitBonus + archetypeBonus + ...`

**Testing Requirements:**
- Unit tests for bonus calculations with various trait combinations
- Unit tests for discovery prioritization logic
- Validate that all traits have defined effects (no orphan traits)

**Dependencies:** Task 1 (types)

---

### Task 5: NPC Generation Updates

**Objective:** Update NPC generation to use expanded trait system and initialize emotions.

**Scope:**
- Refactor: `server/src/services/npc-generator/index.ts`
- Integration with emotion and trait services

**Requirements:**

1. **Trait assignment:**
   - Generate 2-3 personality traits (weighted by archetype)
   - Generate 1-2 romance traits (random)
   - Generate 2-3 interest traits (random)
   - Ensure no conflicting traits (e.g., not both `outgoing` and `reserved`)

2. **Archetype-trait weighting:**
   - Define which personality traits are more likely per archetype
   - Example: Athlete → higher chance of `adventurous`, `competitive`
   - Example: Bookworm → higher chance of `logical`, `reserved`

3. **Emotion initialization:**
   - On NPC creation, initialize emotion state
   - Apply trait-based baseline modifiers
   - Set `lastUpdated` to creation time

4. **Daily emotion reset:**
   - `initializeDailyEmotion(npc, timeOfDay): NPCEmotionState`
   - Base randomization weighted by traits and time of day
   - Morning: higher `calm`, lower extremes
   - Evening: more varied, higher `excitement` potential
   - Relationship level affects starting disposition (friends start happier)

**Architectural Guidance:**
- **Builder pattern** for NPC generation (many optional configurations)
- Trait conflict detection as separate validation function
- Emotion initialization should call emotion service, not duplicate logic

**Testing Requirements:**
- Unit tests for trait conflict detection
- Unit tests for archetype-trait weight distribution
- Integration test: generated NPC has valid emotion state

**Dependencies:** Task 1 (types), Task 2 (emotion service), Task 4 (trait service)

---

### Task 6: Social Activity Integration

**Objective:** Integrate all systems into social activity execution flow.

**Scope:**
- Refactor: `server/src/services/relationship/index.ts` (activity handling)
- New: Dynamic difficulty calculation
- Integration with outcome service

**Requirements:**

1. **Dynamic difficulty calculation:**
   ```
   effectiveDifficulty = baseDifficulty
     + emotionModifier      // -20 to +30 based on NPC emotion
     + relationshipModifier // -15 to +15 based on relationship level
     + traitBonus           // -20 to +20 from trait/archetype matching
     + streakModifier       // -10 to +10 based on recent interaction history
   ```

2. **Emotion-based difficulty:**
   - `getEmotionDifficultyModifier(emotionState): number`
   - Positive dominant emotion → easier (negative modifier)
   - Negative dominant emotion → harder (positive modifier)
   - Intensity affects magnitude

3. **Activity outcome effects:**
   - Define per-activity effects on each relationship axis
   - Define per-activity effects on emotions
   - Scale by outcome tier (existing pattern):
     - Best: 1.5x relationship, strong positive emotion shift
     - Okay: 1.0x relationship, mild positive emotion shift
     - Mixed: 0.3x relationship, no/mild negative emotion shift
     - Catastrophic: -0.5x relationship, strong negative emotion shift

4. **Activity-emotion mapping:**
   - Define which emotions each activity affects
   - Example: "flirt" → +romantic, +excitement
   - Example: "deep_conversation" → +affection, +calm, -anxiety
   - Example: "adventurous_date" → +excitement, +joy (if success), +anxiety (if fail)

5. **Streak tracking:**
   - Track consecutive positive/negative interactions
   - Positive streak → NPC "warming up" (easier)
   - Negative streak → NPC "pulling away" (harder)
   - Reset on day change or significant time gap

**Architectural Guidance:**
- **Chain of responsibility** for difficulty modifier calculation
- **Observer pattern** for propagating activity outcomes to emotion/relationship services
- Activity-effect mappings as configuration data, not hardcoded
- Orchestration in social activity service, domain logic in respective services

**Testing Requirements:**
- Integration tests for full activity flow (request → roll → outcome → state changes)
- Unit tests for difficulty modifier composition
- Unit tests for outcome-to-effect scaling

**Dependencies:** Task 1-5 (all previous tasks)

---

### Task 7: API & Persistence

**Objective:** Update API endpoints and persistence layer for new data structures.

**Scope:**
- Refactor: `server/src/routes/relationships.ts`
- Refactor: `server/src/routes/npcs.ts`
- Database operations

**Requirements:**

1. **Relationship endpoints:**
   - `GET /relationships/:id` — Return relationship with 3 axes, state, emotion display
   - `POST /relationships/:id/interact` — Execute social activity
   - Response includes: outcome, new axis values, emotion changes, trait discoveries

2. **NPC endpoints:**
   - `GET /npcs/:id` — Return NPC with revealed traits only (hide unrevealed)
   - Include current dominant emotion in response
   - Admin/debug flag to show all traits

3. **Emotion persistence:**
   - Save emotion state after each interaction
   - Load and apply decay on NPC fetch (calculate time since `lastUpdated`)

4. **Trait discovery persistence:**
   - Update `revealedTraits` array on discovery
   - Return discovery event in interaction response

5. **Response DTOs:**
   - Create DTOs that hide internal implementation details
   - Separate internal models from API responses
   - Include computed fields (relationship state, emotion display) in responses

**Architectural Guidance:**
- **Repository pattern** for data access (if not already in place)
- **DTO pattern** for API responses—don't expose internal models directly
- Lazy decay calculation: compute on read, not via background job
- Consider **CQRS light:** separate read models for complex relationship views

**Testing Requirements:**
- Integration tests for API endpoints
- Test that unrevealed traits are not exposed in normal responses
- Test emotion decay is applied correctly on fetch

**Dependencies:** Task 1-6 (requires all systems implemented)

---

## 5. Task Dependencies

```
Task 1: Types & Schema
   ↓
   ├── Task 2: Emotion System
   ├── Task 3: Relationship Axes
   └── Task 4: Trait System
          ↓
       Task 5: NPC Generation (requires 2, 4)
          ↓
       Task 6: Activity Integration (requires 2, 3, 4, 5)
          ↓
       Task 7: API & Persistence (requires all)
```

**Parallel work possible:**
- Tasks 2, 3, 4 can be developed in parallel after Task 1
- Task 5 can start once Tasks 2 and 4 are complete
- Tasks 6 and 7 are sequential and depend on prior work

**Suggested team distribution:**
- Developer A: Task 1 → Task 3 → Task 6
- Developer B: Task 2 → Task 5 → Task 7
- Developer C: Task 4 (then assist with 6 or 7)

---

## 6. Glossary

| Term | Definition |
|------|------------|
| **Axis** | One of the three relationship dimensions (Trust, Affection, Desire) |
| **Baseline** | The default value an emotion decays toward |
| **Decay** | Gradual reduction of emotion values toward baseline over time |
| **Dominant Emotion** | The highest-value emotion that determines displayed state |
| **Intensity Tier** | Categorization of emotion value into mild/moderate/strong/intense |
| **Revealed Trait** | A trait the player has discovered through gameplay |
| **State** | The derived relationship label (friend, lover, rival, etc.) |

---

## 7. Future Considerations

The following are explicitly **out of scope** but the architecture should not preclude them:

- **NPC-to-NPC relationships:** Emotions affected by other NPCs
- **World events:** Weather, holidays affecting NPC moods
- **Reputation system:** Actions affecting multiple NPCs
- **Family relationships:** Desire permanently capped, different interaction types
- **NPC schedules:** Location and availability based on time/day

Design services to be extensible for these additions.

---

## Appendix A: Emotion Display Mapping

| Emotion | Mild (1-25) | Moderate (26-50) | Strong (51-75) | Intense (76-100) |
|---------|-------------|------------------|----------------|------------------|
| joy | content | happy | joyful | ecstatic |
| affection | friendly | warm | affectionate | adoring |
| excitement | interested | intrigued | excited | thrilled |
| calm | neutral | relaxed | serene | blissful |
| sadness | disappointed | sad | upset | devastated |
| anger | annoyed | irritated | angry | furious |
| anxiety | uneasy | nervous | anxious | distressed |
| romantic | curious | flirty | romantic | passionate |

---

## Appendix B: Trait-Activity Affinity Matrix

To be defined during Task 4 implementation. Structure:

```
{
  "intellectual": {
    "deep_conversation": +15,
    "study_together": +10,
    "party": -5
  },
  "physical": {
    "gym_together": +15,
    "dance": +10,
    "library_date": -5
  },
  ...
}
```

---

## Appendix C: Archetype Affinity Matrix

To be defined during Task 4 implementation. Structure:

```
{
  "Athlete": {
    "Athlete": +10,      // Same archetype bonus
    "Artist": 0,
    "Bookworm": -5,      // Low natural affinity
    ...
  },
  ...
}
```

Combined with activity category affinities for full bonus calculation.
