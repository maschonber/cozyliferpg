# Relationship System - Detailed Design

## Overview
The relationship system uses a multi-dimensional approach where NPCs track separate values for different relationship aspects. In Phase 1, we implement **Friendship** and **Romance** dimensions, each ranging from **-100 to +100**.

## Relationship Dimensions

### Friendship Dimension (-100 to +100)
Represents platonic connection, trust, and mutual respect.

| Range | State | Description | Emotional Cues |
|-------|-------|-------------|----------------|
| -100 to -50 | **Enemy** | Strong animosity, avoids player | Angry, hostile expressions |
| -49 to -20 | **Dislike** | Mild negative feelings | Cold, dismissive body language |
| -19 to +19 | **Stranger** | Neutral, first impressions | Neutral, polite expressions |
| +20 to +49 | **Acquaintance** | Friendly but not close | Slight smile, open posture |
| +50 to +79 | **Friend** | Good relationship, enjoys spending time | Warm smile, relaxed |
| +80 to +100 | **Close Friend** | Best friends, deep trust | Happy, excited to see player |

### Romance Dimension (-100 to +100)
Represents romantic/sexual attraction and interest.

| Range | State | Description | Emotional Cues |
|-------|-------|-------------|----------------|
| -100 to -50 | **Repulsed** | Strong romantic aversion | Uncomfortable, avoiding eye contact |
| -49 to -20 | **Uncomfortable** | Mild romantic disinterest | Awkward, keeping distance |
| -19 to +19 | **Neutral** | No romantic feelings either way | Standard friendly expressions |
| +20 to +49 | **Attracted** | Starting to develop feelings | Shy smiles, blushing |
| +50 to +79 | **Romantic Interest** | Clear romantic feelings | Flirty, affectionate expressions |
| +80 to +100 | **In Love** | Strong romantic attachment | Adoring, intimate expressions |

## Combined Relationship States
Some states require **both dimensions** to meet specific criteria. These supersede single-dimension states.

| State | Friendship | Romance | Description |
|-------|-----------|---------|-------------|
| **Romantic Partner** | ≥ 50 | ≥ 60 | In a romantic relationship |
| **Close Romantic Partner** | ≥ 80 | ≥ 80 | Deeply in love and best friends |
| **Complicated** | ≥ 50 | ≤ -30 | Good friends but romantic tension/rejection |
| **Rival** | ≤ -50 | ≥ -19 | Enemies without romantic involvement |
| **Bitter Ex** | ≤ -30 | ≤ -50 | Failed romance turned sour |
| **Unrequited** | ≤ 30 | ≥ 60 | Player has strong romantic feelings but not reciprocated |

## State Priority System
When determining the current relationship state, check in this order:

1. **Combined States** (check all, use most specific match)
   - Close Romantic Partner
   - Romantic Partner
   - Bitter Ex
   - Complicated
   - Rival
   - Unrequited

2. **Romance States** (if Romance has stronger magnitude than Friendship)
   - Check Romance dimension value

3. **Friendship States** (default)
   - Check Friendship dimension value

### Priority Algorithm
```typescript
function determineRelationshipState(friendship: number, romance: number): RelationshipState {
  // Combined states (highest priority)
  if (friendship >= 80 && romance >= 80) return 'close_romantic_partner';
  if (friendship >= 50 && romance >= 60) return 'romantic_partner';
  if (friendship <= -30 && romance <= -50) return 'bitter_ex';
  if (friendship >= 50 && romance <= -30) return 'complicated';
  if (friendship <= -50 && romance >= -19) return 'rival';
  if (friendship <= 30 && romance >= 60) return 'unrequited';

  // Single dimension states
  // Use romance if it has stronger magnitude
  if (Math.abs(romance) > Math.abs(friendship)) {
    if (romance >= 80) return 'in_love';
    if (romance >= 50) return 'romantic_interest';
    if (romance >= 20) return 'attracted';
    if (romance <= -50) return 'repulsed';
    if (romance <= -20) return 'uncomfortable';
  }

  // Default to friendship dimension
  if (friendship >= 80) return 'close_friend';
  if (friendship >= 50) return 'friend';
  if (friendship >= 20) return 'acquaintance';
  if (friendship <= -50) return 'enemy';
  if (friendship <= -20) return 'dislike';

  // Complete neutral
  return 'stranger';
}
```

## Emotional States for Image Generation

### Phase 1 Emotional States (5 base emotions)
Each relationship state maps to one or more emotional expressions for AI image generation:

| Emotional State | When Used | Example Triggers |
|----------------|-----------|------------------|
| **neutral** | Strangers, first meetings | Friendship -19 to +19, Romance -19 to +19 |
| **happy** | Positive interactions, friends | Friendship +50+, after positive activity |
| **sad** | Negative interactions, rejection | After -Friendship activity, unrequited state |
| **flirty** | Romantic contexts | Romance +40+, romantic activities |
| **angry** | Enemies, conflicts | Friendship -50-, after strong negative activity |

### State-to-Emotion Mapping
```typescript
const stateEmotionMap = {
  // Friendship-based
  'enemy': 'angry',
  'dislike': 'neutral',
  'stranger': 'neutral',
  'acquaintance': 'neutral',
  'friend': 'happy',
  'close_friend': 'happy',

  // Romance-based
  'repulsed': 'angry',
  'uncomfortable': 'neutral',
  'attracted': 'flirty',
  'romantic_interest': 'flirty',
  'in_love': 'happy',

  // Combined
  'romantic_partner': 'flirty',
  'close_romantic_partner': 'happy',
  'complicated': 'sad',
  'rival': 'angry',
  'bitter_ex': 'sad',
  'unrequited': 'sad'
};
```

### Contextual Emotion Overrides
After certain activities, temporarily override the base emotion:
- **Positive activity (+Friendship/+Romance)** → `happy` or `flirty` (based on activity type)
- **Negative activity (-Friendship/-Romance)** → `sad` or `angry` (based on severity)
- **First meeting** → `neutral`
- **Major milestone** (state change) → Appropriate emotion for new state

## Activity System (Phase 1 - Debug)

### Debug Activities
Simple activities to test the relationship system:

| Activity | Friendship Δ | Romance Δ | Description |
|----------|-------------|-----------|-------------|
| "Have a friendly chat" | +10 | 0 | Basic positive interaction |
| "Flirt a little" | 0 | +10 | Romantic advance |
| "Say something rude" | -10 | 0 | Negative interaction |
| "Act dismissive" | 0 | -10 | Romantic rejection/disinterest |

### Activity Effects
- Each activity applies deltas to both dimensions
- Values are clamped to -100/+100 range
- After activity, recalculate relationship state
- Generate new image with contextual emotion if state changed

## Future Expansion Areas

### Additional Dimensions (Phase 5)
- **Trust** (-100 to +100): Reliability, honesty, confidentiality
- **Respect** (-100 to +100): Admiration, professional regard
- **Rivalry** (0 to 100): Competitive tension (not necessarily negative)

### Complex Activities (Phase 4-5)
- **Requirements**: Activities unlock based on relationship thresholds
  - Example: "Deep conversation" requires Friendship ≥ 40
  - Example: "Ask on a date" requires Romance ≥ 30 AND Friendship ≥ 20
- **Multi-dimensional effects**: Activities affect multiple dimensions
  - Example: "Share a secret" → +15 Friendship, +10 Trust, +5 Romance
- **Risk/Reward**: Some activities can backfire
  - Example: "Flirt aggressively" → +20 Romance on success, -20 Romance on failure

### Memory System (Phase 5)
NPCs remember past interactions:
- **Recent interactions** (last 5-10): Influence current mood
- **Significant events**: Unlock special dialogue
- **Patterns**: NPC reacts to repeated behavior (e.g., always being late)

### Dynamic State Evolution (Phase 4)
- **State-dependent interactions**: Different dialogue/activities available based on state
- **State transitions**: Special events when crossing thresholds
  - Example: Reaching "Friend" (50+) unlocks deeper conversations
  - Example: First romance activity triggers special dialogue
- **Time decay**: Relationships slowly drift toward neutral if not maintained (Phase 6)

---

## Database Schema

### Relationships Table
```sql
CREATE TABLE relationships (
  id VARCHAR(255) PRIMARY KEY,
  player_id VARCHAR(255) NOT NULL,
  npc_id VARCHAR(255) NOT NULL,

  -- Dimension values
  friendship INTEGER NOT NULL DEFAULT 0 CHECK (friendship >= -100 AND friendship <= 100),
  romance INTEGER NOT NULL DEFAULT 0 CHECK (romance >= -100 AND romance <= 100),

  -- State tracking
  current_state VARCHAR(50) NOT NULL DEFAULT 'stranger',
  unlocked_states TEXT[] DEFAULT ARRAY['stranger'],

  -- Timestamps
  first_met TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_interaction TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE CASCADE,

  -- Constraints
  UNIQUE(player_id, npc_id)
);

CREATE INDEX idx_relationships_player ON relationships(player_id);
CREATE INDEX idx_relationships_npc ON relationships(npc_id);
```

### Interactions Table (History)
```sql
CREATE TABLE interactions (
  id VARCHAR(255) PRIMARY KEY,
  relationship_id VARCHAR(255) NOT NULL,
  activity_type VARCHAR(100) NOT NULL,

  -- Effects
  friendship_delta INTEGER NOT NULL DEFAULT 0,
  romance_delta INTEGER NOT NULL DEFAULT 0,

  -- Context
  emotional_state VARCHAR(50),
  notes TEXT,

  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key
  FOREIGN KEY (relationship_id) REFERENCES relationships(id) ON DELETE CASCADE
);

CREATE INDEX idx_interactions_relationship ON interactions(relationship_id);
CREATE INDEX idx_interactions_created ON interactions(created_at DESC);
```

---

*This document defines the Phase 1 relationship system and provides clear expansion paths for future phases.*
