# Emotion Service

**Status:** Phase 2 (Task 2) - Implemented ✅

## Overview

The Emotion Service implements the 8-emotion numerical tracking system for NPCs with decay mechanics and intensity-based display.

## Features Implemented

- ✅ **8 Emotion Types**: joy, affection, excitement, calm, sadness, anger, anxiety, romantic
- ✅ **Trait-Based Baselines**: Personality traits modify emotion baselines
- ✅ **Emotion Decay**: Time-based decay toward baselines with configurable rates
- ✅ **Trust-Dependent Romantic Decay**: Higher trust = slower romantic emotion decay
- ✅ **Strong Emotion Protection**: Emotions 51+ decay at half rate
- ✅ **Dominant Emotion Selection**: Primary and secondary emotion detection
- ✅ **Intensity Tiers**: 4 tiers (mild, moderate, strong, intense) with display labels

## Core Functions

### `initializeEmotions(traits, timestamp?)`
Initialize emotion state for a new NPC with trait-based baseline modifiers.

### `applyEmotionDelta(state, deltas)`
Apply emotion changes from interactions, clamped to 0-100 range.

### `decayEmotions(state, hoursPassed, trustLevel, traits)`
Apply time-based decay toward trait-modified baselines.

### `getDominantEmotions(state)`
Get primary and optionally secondary dominant emotions.

### `getEmotionDisplay(emotion, value)`
Map emotion type and value to display format with intensity and label.

## Integration Points

### ✅ NPC Generation
The NPC generator (`npc-generator/index.ts`) now uses `initializeEmotions()` to set up emotion state for new NPCs.

### 🔄 Emotion Decay (Future Integration)
**When to apply:** Emotion decay should be applied lazily when NPCs are fetched, calculating time since `lastUpdated`.

**Where to integrate:**
- `GET /api/relationships` - Apply decay to NPC emotion states before returning
- `GET /api/relationships/:npcId` - Apply decay before returning single relationship
- `GET /api/npcs/:id` - Apply decay before returning NPC data

**Recommended approach:**
Create a helper function in the emotion service:
```typescript
export function applyLazyDecay(
  emotionState: NPCEmotionState,
  trustLevel: number,
  traits: PersonalityTrait[]
): NPCEmotionState {
  const now = new Date().toISOString();
  const hoursPassed = calculateHoursPassed(emotionState.lastUpdated, now);
  return decayEmotions(emotionState, hoursPassed, trustLevel, traits);
}
```

Then call this in routes before returning NPC data.

### 🔄 Emotion Updates (Future Integration)
**When to apply:** When social activities are performed with NPCs.

**Where to integrate:**
- `POST /api/relationships/:npcId/interact` - Apply emotion deltas based on activity outcome

## Trait-Emotion Baseline Modifiers

Currently implemented modifiers:
- **optimistic**: +10 joy, -3 sadness
- **melancholic**: +10 sadness, -5 joy
- **passionate**: +8 excitement, +5 romantic, -5 calm
- **stoic**: +10 calm, -5 anger, -5 anxiety
- **empathetic**: +5 affection, +3 anxiety
- **nurturing**: +8 affection, +5 calm

Other personality traits currently have no baseline modifiers (intentional - not all traits should affect emotions directly).

## Testing

Comprehensive unit tests are in `index.test.ts`:
- Trait-based initialization
- Emotion delta application
- Decay at various intervals
- Trust-based romantic decay
- Strong emotion decay protection
- Dominant emotion selection
- Edge cases and integration scenarios

**Run tests:**
```bash
npm test -- emotion
```

## Next Steps (Task 3+)

- **Task 3**: Relationship Axis System - Will use emotion states for difficulty modifiers
- **Task 4**: Trait System - Will integrate with emotion modifiers
- **Task 6**: Social Activity Integration - Will apply emotion deltas during interactions
- **Task 7**: API & Persistence - Full integration with lazy decay on fetch
