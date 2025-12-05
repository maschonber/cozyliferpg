# CozyLife RPG - Project Outline

## Vision

A lightweight, browser/mobile life simulation RPG inspired by Princess Maker and The Sims. Players discover and build relationships with procedurally generated NPCs in a small fictional neighborhood. The game focuses on organic character discovery, complex relationship dynamics, and AI-generated visuals that bring each unique playthrough to life.

### Core Pillars
1. **Procedurally Generated NPCs** - Unique characters with distinct personalities, appearances, and traits
2. **Complex Relationship Dynamics** - Multi-dimensional relationships that evolve (friendship, romance, rivalry)
3. **AI-Generated Visuals** - Dynamic images based on character state (emotion, context, relationship stage)
4. **Reactive Choice-Driven Gameplay** - Player choices shape relationships and narrative
5. **Sandbox Progression** - Open-ended gameplay with achievements and emergent stories

---

## Phase 1 MVP - Relationship Core ✅ COMPLETED

### What Was Built
Phase 1 successfully implemented the emotional core of the game with the following features:

**Completed Features:**
- ✅ NPC generation with detailed appearance attributes (hair, eyes, body type, clothing style, etc.)
- ✅ Gender-aware character generation (female, male, other)
- ✅ Multi-dimensional relationship system (Friendship & Romance: -100 to +100)
- ✅ Complex relationship state calculation (15+ unique states: stranger, friend, romantic_partner, rival, bitter_ex, etc.)
- ✅ Activity system with relationship effects (4 basic activities for testing)
- ✅ Interaction history tracking
- ✅ AI image generation integration with external service
- ✅ Image caching system
- ✅ RESTful API backend (Node.js + Express + PostgreSQL)
- ✅ Angular frontend with reactive state management
- ✅ User authentication and session management
- ✅ Full database persistence (users, NPCs, relationships, interactions)

**Core Loop (Implemented):**
```
1. User authenticates → Creates/loads save
2. Click "Meet Someone New" → NPC generated & stored
3. View NPC card → AI-generated image loads
4. Select NPC → View detailed profile with relationship bars
5. Choose activity → Relationship values update
6. Emotional state changes → New image generated
7. Interaction history recorded → Return to neighbor list
```

---

## Data Models

### NPC (As Implemented)
```typescript
interface NPCAppearance {
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  faceDetails: string[];      // Facial features like glasses, freckles, dimples
  bodyType: string;           // Body shape/build
  torsoSize: string;          // Chest size descriptor
  height: string;             // short, average, tall
  skinTone: string;
  upperTrace: string;         // Upper body clothing
  lowerTrace: string;         // Lower body clothing
  style?: string;             // Overall fashion style
  bodyDetails: string[];      // Body characteristics (tattoos, piercings, etc.)
}

interface NPC {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'other';
  archetype: string;          // Artist, Athlete, Bookworm, Musician, Scientist
  traits: string[];           // Personality traits
  appearance: NPCAppearance;
  loras: string[];            // AI model LoRAs for image generation
  createdAt: string;

  // Future: Expanded personality, schedules, preferences, jobs
}
```

### Relationship (As Implemented)
```typescript
interface Relationship {
  id: string;
  playerId: string;
  npcId: string;

  // Multi-dimensional values (-100 to +100)
  friendship: number;
  romance: number;

  // State tracking
  currentState: RelationshipState;
  unlockedStates: string[];    // Track which states have been reached

  // Timestamps
  firstMet: string;
  lastInteraction: string;

  // Populated data (joined on fetch, not stored)
  npc?: NPC;
  interactions?: Interaction[];
}

interface Interaction {
  id: string;
  relationshipId: string;
  activityType: string;
  friendshipDelta: number;
  romanceDelta: number;
  emotionalState?: EmotionalState;
  notes?: string;
  createdAt: string;
}

type RelationshipState =
  // Combined states (both dimensions matter)
  | 'close_romantic_partner'
  | 'romantic_partner'
  | 'bitter_ex'
  | 'complicated'
  | 'rival'
  | 'unrequited'
  // Friendship-based states
  | 'enemy'
  | 'dislike'
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  // Romance-based states
  | 'repulsed'
  | 'uncomfortable'
  | 'attracted'
  | 'romantic_interest'
  | 'in_love';

type EmotionalState = 'neutral' | 'happy' | 'sad' | 'flirty' | 'angry';
```

### Activity (As Implemented)
```typescript
interface Activity {
  id: string;
  name: string;
  description: string;
  effects: {
    friendship?: number;
    romance?: number;
  };
}
```

**Current Activities (Basic Testing Set):**
- "Have a friendly chat" → +10 Friendship
- "Flirt a little" → +10 Romance
- "Say something rude" → -10 Friendship
- "Act dismissive" → -10 Romance

**Note:** Phase 2 will expand activities significantly with:
- Cost in time/energy
- Location/time-of-day requirements
- Skill checks
- Varied relationship effects based on NPC traits

---

## AI Image API Integration

### API Contract (To Be Finalized)
```typescript
interface ImageGenerationRequest {
  characterId: string;        // Reference to NPC in database
  emotionalState: string;     // happy, neutral, sad, flirty, angry, etc.
  location?: string;          // home, cafe, park (Phase 2+)
  clothing?: string;          // casual, formal, sleepwear (Phase 2+)
  context?: string;           // Additional context for scene
}

interface ImageGenerationResponse {
  imageUrl: string;
  cached: boolean;            // Was this retrieved from cache?
  generationTime?: number;    // For monitoring
}
```

### Caching Strategy
- **On NPC Creation:** Generate base "neutral" image
- **On State Changes:** Generate new image for significant emotional shifts
- **Cache Key:** `${characterId}_${emotionalState}_${location}_${clothing}`
- **Fallback:** Loading placeholder → Previous cached image if generation fails

---

## Architecture (As Built)

### Tech Stack
- **Frontend:** Angular 18 with standalone components, @ngrx/signals for state
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL with connection pooling
- **External Services:** AI image generation API (separate service)

### Implemented Services
1. **NPC Generation** - Random generation with trait pools and archetypes
2. **Relationship Engine** - Multi-dimensional state calculation and tracking
3. **Image Integration** - Caching system with external AI API
4. **User Authentication** - Session-based auth with bcrypt

### API Endpoints (Implemented)
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/npcs              - Generate new NPC
GET    /api/npcs              - List user's NPCs
GET    /api/npcs/:id          - Get NPC details

GET    /api/relationships     - List all relationships
GET    /api/relationships/:npcId - Get relationship with specific NPC
POST   /api/relationships/:npcId/interact - Perform activity

GET    /api/activities        - List available activities

(Image endpoints handled by external service)
```

---

## UI Flow (Phase 1)

### Home Screen
```
┌─────────────────────────────────┐
│  CozyLife RPG                   │
├─────────────────────────────────┤
│                                 │
│  [Meet Someone New]             │
│                                 │
│  Your Neighbors:                │
│  ┌───────────────────────────┐ │
│  │ 👤 Alex                   │ │
│  │ Friend • Romantic Interest│ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ 👤 Jordan                 │ │
│  │ Acquaintance              │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### NPC Detail View
```
┌─────────────────────────────────┐
│  ← Back                         │
├─────────────────────────────────┤
│                                 │
│  [AI-Generated Character Image] │
│                                 │
│  Alex                           │
│  The Creative Artist            │
│                                 │
│  Friendship: ████████░░ 75      │
│  Romance:    ████░░░░░░ 40      │
│                                 │
│  Spend time with Alex:          │
│  [Have a friendly chat]         │
│  [Flirt a little]               │
│  [Say something rude]           │
│  [Act dismissive]               │
│                                 │
└─────────────────────────────────┘
```

### Interaction Result
```
┌─────────────────────────────────┐
│  You had a friendly chat        │
│  with Alex                      │
│                                 │
│  [Updated Character Image]      │
│  (Alex looks happy)             │
│                                 │
│  Friendship +10 (→ 85)          │
│                                 │
│  [Continue]                     │
└─────────────────────────────────┘
```

---

## Phase 2: Time & Energy Systems 🔨 IN PLANNING

### Overview
Phase 2 introduces the **resource management layer** that creates strategic decision-making and pacing. Players must balance their limited time and energy to pursue relationships, personal development, and survival needs.

### Core Features to Implement

#### 1. Time System
**Time Slots Per Day:**
- Morning (6 AM - 12 PM)
- Afternoon (12 PM - 6 PM)
- Evening (6 PM - 12 AM)
- Night (12 AM - 6 AM)

**Day Progression:**
- Manual "Advance Time" button OR automatic after activity?
- Can player perform multiple activities in one time slot?
- Does time advance automatically after X actions?
- Weekly cycle or continuous days?

#### 2. Energy System
**Energy Pool:**
- Maximum energy per day: 100 points? Variable based on stats?
- How does energy regenerate? (Sleep = full refill? Partial refill?)
- Can energy be negative (exhaustion penalties)?
- Should we have separate Mental/Physical energy or single pool?

**Energy Costs:**
- Social activities (hanging with NPCs): 10-20 energy?
- Work/Study activities: 15-30 energy?
- Exercise: 20-30 energy?
- Rest/Relax: Restores energy?
- Sleep: How much energy restored? (Full? 80%?)

#### 3. Activities Expanded
**New Activity Categories:**

**Social (with NPCs):**
- Have coffee (Low energy, +Friendship)
- Go on a date (Medium energy, +Romance)
- Deep conversation (High energy, +Friendship, requires existing relationship)
- Exercise together (High energy, +Friendship, +Athletic?)

**Personal Development:**
- Study/Read (improves Intelligence?)
- Work out at gym (improves Fitness?)
- Practice creative hobby (improves Creativity?)
- Work part-time job (earns money, costs time+energy)

**Self-Care:**
- Take a nap (restore some energy, costs time slot)
- Relax at home (restore small energy, low time cost)
- Go to sleep (end day, full energy restore)

#### 4. Player Character System
**Do we need player stats? If yes, what stats?**
- Fitness / Athletic ability?
- Intelligence / Creativity?
- Charisma / Social skills?
- Energy capacity (max energy)?

**Should player appearance be customizable?**
- Simple (name + gender only)?
- Detailed (visual customization for future player avatar images)?

**Starting conditions:**
- Start with some money?
- Start with base stats?
- Tutorial NPCs pre-seeded?

#### 5. Money System (Optional for Phase 2?)
**Money Sources:**
- Part-time job activity (earn $50-100 per time slot?)
- Starting allowance?

**Money Sinks:**
- Some activities cost money (going to movies, fancy dinner dates?)
- Future: Buy gifts for NPCs?
- Future: Unlock new locations/activities?

**Question: Should we defer money to Phase 3?**

---

### Design Questions for Discussion

#### **Time System Design:**

1. **Activity-Time Relationship:**
   - Should each activity explicitly cost 1 time slot?
   - Or can some activities be "quick" (don't advance time)?
   - Should players be warned before time advances?

2. **End of Day:**
   - Force player to sleep at night (auto-advance)?
   - Or let player stay up late with energy penalties?
   - What happens at end of week/month? Any resets or events?

3. **Time Representation in UI:**
   - Show current time slot prominently?
   - Show day counter? (Day 1, Day 2... or Monday, Tuesday...?)
   - Calendar view or simple counter?

#### **Energy System Design:**

4. **Energy Costs:**
   - Should different NPCs have different energy costs based on personality?
   - Should relationship level affect energy cost (easier to hang with close friends)?
   - Should failed/awkward interactions cost more energy?

5. **Energy Recovery:**
   - Just sleep = full restore?
   - Or should relaxation activities give partial restore during day?
   - Coffee/food items for energy boost?
   - Energy restoration percentage based on player fitness stat?

6. **Running Out of Energy:**
   - Hard block (can't do activities at 0 energy)?
   - Or allow with penalties (worse activity outcomes)?
   - Visual warnings when energy is low?

#### **Activity System Design:**

7. **Activity Availability:**
   - Should some activities only be available at certain times?
     - Example: "Go to work" only in Morning/Afternoon
     - "Go to a club" only in Evening/Night
   - Should weather/seasons affect activity availability? (defer to Phase 3?)

8. **Activity Requirements:**
   - Should activities have requirements beyond energy/time?
     - Minimum relationship level for certain activities?
     - Stat requirements (need X fitness to go hiking)?
     - Money requirements (movie costs $20)?

9. **Activity Variety:**
   - How many activities should Phase 2 launch with?
     - ~5 social activities with NPCs?
     - ~3 personal development activities?
     - ~2 self-care/rest activities?
   - Or start simpler with ~8 total and expand?

#### **Player Character Design:**

10. **Stats System:**
    - **Option A:** No stats yet, just track energy/time (simplest)
    - **Option B:** 3-4 basic stats that improve with activities
    - **Option C:** Deep stat system with skill trees (too complex?)

    **If we add stats, what should they do?**
    - Affect activity outcomes? (high Charisma = better relationship gains?)
    - Affect energy costs? (high Fitness = activities cost less energy?)
    - Unlock new activities? (need X Intelligence to tutor NPCs?)

11. **Player Progression:**
    - Should stats increase automatically with use (grind-style)?
    - Or milestone-based (every 10 study sessions = +1 Intelligence)?
    - Or no progression in Phase 2 (defer to Phase 3)?

12. **Player Customization:**
    - Do we need player name?
    - Player avatar/appearance (for future AI images of player)?
    - Or stay abstract (camera perspective, never see yourself)?

#### **Game Loop & Pacing:**

13. **Typical Day Structure:**
    What does an ideal player loop look like?
    ```
    Morning:
      - Wake up (100 energy)
      - Activity 1: Have coffee with NPC Alex (-15 energy)
      - Activity 2: ???

    Afternoon:
      - Activity 3: ???
      - Activity 4: ???

    Evening:
      - Activity 5: ???

    Night:
      - Go to sleep (restore energy)
    ```

    - How many activities can player do per day? (4-6?)
    - Should we enforce structure or allow free-form scheduling?

14. **Long-term Goals:**
    - What motivates players to keep playing beyond relationship building?
    - Should we add simple goals? ("Reach close_friend with 3 NPCs")
    - Or pure sandbox (no explicit goals in Phase 2)?

#### **UI & UX Considerations:**

15. **Game Screen Layout:**
    - Persistent HUD showing: Current Day, Time Slot, Energy?
    - Where to put "Advance Time" button?
    - How to show available activities filtered by time/energy?

16. **Activity Selection:**
    - Show energy cost before selecting activity?
    - Show grayed-out activities player can't afford?
    - Tooltips explaining why activity is unavailable?

17. **Feedback & Consequences:**
    - What happens if player tries to do activity without enough energy?
    - Should we show projections? ("This will leave you with 20 energy")
    - End-of-day summary screen? (recap of activities, relationships changed, etc.)

---

### Data Model Additions (Phase 2)

#### PlayerCharacter (NEW)
```typescript
interface PlayerCharacter {
  id: string;
  userId: string;
  name: string;

  // Optional stats (TBD)
  fitness?: number;
  intelligence?: number;
  charisma?: number;

  // Resources
  currentEnergy: number;
  maxEnergy: number;
  money: number;

  // Timestamps
  createdAt: string;
  lastPlayed: string;
}
```

#### GameState (NEW)
```typescript
interface GameState {
  id: string;
  userId: string;

  // Time tracking
  currentDay: number;       // 1, 2, 3...
  currentTimeSlot: TimeSlot;

  // Player reference
  playerCharacterId: string;

  // Optional: Event flags, unlocked content
  flags?: Record<string, boolean>;

  createdAt: string;
  updatedAt: string;
}

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
```

#### Activity (UPDATED)
```typescript
interface Activity {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'personal' | 'work' | 'rest';

  // Costs
  energyCost: number;
  timeCost: number;        // Usually 1, but could be 0 for "quick" activities
  moneyCost?: number;

  // Requirements (optional)
  minEnergy?: number;
  requiredTimeSlot?: TimeSlot[];  // e.g., ["morning", "afternoon"]
  minRelationship?: number;       // For relationship-gated activities

  // Effects
  effects: {
    friendship?: number;
    romance?: number;
    energy?: number;        // Can be negative (cost) or positive (restore)
    money?: number;
    fitness?: number;       // Stat improvements
    intelligence?: number;
    charisma?: number;
  };
}
```

---

### Implementation Questions Summary

**Critical decisions needed before coding:**

1. **Time**: Manual advance vs. auto-advance? Activities per time slot?
2. **Energy**: Single pool vs. multiple types? Recovery mechanics?
3. **Activities**: How many to start with? Cost ranges?
4. **Player Stats**: Include stats in Phase 2 or defer? Which stats?
5. **Money**: Include in Phase 2 or defer to Phase 3?
6. **Progression**: How do stats improve? Automatic or milestone-based?
7. **UI**: How to display time/energy? Where to show activity costs?
8. **Game Loop**: How many activities per day? Structured vs. free-form?

**Let's discuss these questions to define the implementation approach!**

### Phase 3: Locations & Exploration
- Multiple neighborhood locations
- Location-based NPC encounters
- Activity availability based on location/time
- Location discovery system

### Phase 4: Advanced NPCs
- NPC daily schedules/routines
- Rule-based personality generation
- More complex traits and preferences
- NPCs initiate interactions

### Phase 5: Relationship Depth
- Expanded relationship dimensions (trust, rivalry, respect)
- Relationship memory system
- NPCs reference past interactions
- Relationship-dependent dialogue trees
- Complex activity matrix based on relationship state

### Phase 6: Mini-games & Challenges
- Activity-specific mini-games
- Skill checks based on PC attributes
- Relationship challenges/conflicts

### Phase 7: Meta-Progression
- Achievements system
- Cross-player NPC sharing/discovery
- Community-created content

---

## Technical Stack

### Frontend
- **Framework:** Angular 18+
- **State Management:** @ngrx/signals
- **Testing:** Jest
- **UI:** TBD (Material/Tailwind/Custom)

### Backend
- **Framework:** Node.js + Express (assumed, to be confirmed)
- **Database:** PostgreSQL (assumed, to be confirmed)
- **ORM:** TBD
- **Authentication:** TBD (for future multi-player)

### External Services
- **AI Image Generation:** Custom API (shares database access)

---

## Development Approach

### Iteration Strategy
Build incrementally, test each phase thoroughly:
1. Implement core data models
2. Build NPC generation (random)
3. Build relationship system (friendship + romance)
4. Integrate AI image service
5. Create minimal UI
6. Test and refine core loop
7. Gather feedback before expanding

### Quality Standards
- **Clean Architecture:** Domain logic separate from infrastructure
- **Testability:** Unit tests for all services
- **Extensibility:** Design for change (traits, dimensions, activities)
- **Performance:** Image caching, optimized queries
- **User Experience:** Loading states, error handling, smooth transitions

---

*This outline is a living document and will evolve as development progresses.*
