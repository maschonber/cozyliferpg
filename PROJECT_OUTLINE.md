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

## Phase 1 MVP - Relationship Core

### Scope
The first phase focuses on the **emotional core** of the game: discovering interesting characters and building dynamic relationships with them.

**In Scope:**
- Meet new neighbors (NPC generation)
- Spend time with neighbors (relationship activities)
- Multi-dimensional relationship progression (Friendship + Romance)
- AI-generated character images based on relationship state
- Database persistence for NPCs and game state

**Out of Scope (Deferred):**
- Player character creation/customization
- Time/energy resource management
- Multiple locations
- NPC schedules/routines
- Complex activity matrix
- Achievements system
- Advanced personality generation rules

### Core Loop (MVP)
```
1. Click "Meet Someone New"
   ↓
2. NPC is generated (appearance, traits, archetype)
   ↓
3. View NPC profile (image, basic info, relationship status)
   ↓
4. Choose activity (+Friendship, +Romance, -Friendship, -Romance)
   ↓
5. Relationship values change
   ↓
6. New emotional states/images unlock
   ↓
7. Return to neighbor list or meet more people
```

---

## Data Models

### NPC (Extensible)
```typescript
interface NPC {
  id: string;
  name: string;

  // Appearance (detailed for AI image generation)
  appearance: {
    hairColor: string;
    hairStyle: string;
    eyeColor: string;
    build: string;        // slim, athletic, average, stocky, etc.
    height: string;       // short, average, tall
    skinTone: string;
    distinctiveFeatures?: string[];  // glasses, freckles, tattoos, etc.
    style?: string;       // casual, formal, sporty, alternative, etc.
  };

  // Personality (simple archetypes for MVP, expandable later)
  archetype: string;      // Artist, Athlete, Bookworm, etc.
  traits: string[];       // ["creative", "introverted", "coffee_lover"]

  // Future fields (not implemented in Phase 1)
  // schedule?: DailySchedule;
  // job?: string;
  // preferences?: { likes: string[], dislikes: string[] };

  createdAt: Date;

  // Future: Cross-player discovery
  // isShared?: boolean;
  // originalCreator?: string;
}
```

### Relationship (Extensible)
```typescript
interface Relationship {
  id: string;
  playerId: string;     // Future: multi-player support
  npcId: string;

  // Multi-dimensional values (-100 to +100)
  friendship: number;   // -100 (enemy) to +100 (best friend)
  romance: number;      // -100 (repulsed) to +100 (in love)

  // Future dimensions (not implemented in Phase 1)
  // trust?: number;
  // rivalry?: number;
  // respect?: number;

  // State tracking
  currentState: RelationshipState;  // Derived from dimension values
  unlockedStates: string[];         // Track which emotional states have been seen

  // Interaction history (for future use)
  interactions: Interaction[];

  lastInteraction: Date;
  createdAt: Date;
}

interface Interaction {
  activityType: string;
  timestamp: Date;
  friendshipDelta: number;
  romanceDelta: number;
  // Future: NPCs can remember and reference past interactions
}

type RelationshipState =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'romantic_interest'
  | 'partner'
  | 'rival'
  | 'enemy';
  // Expandable as relationship matrix grows
```

### Activity (Simple for MVP)
```typescript
interface Activity {
  id: string;
  name: string;
  description: string;

  // Relationship effects
  effects: {
    friendship?: number;  // Delta to apply
    romance?: number;     // Delta to apply
  };

  // Future: Complex requirements/conditions
  // requirements?: {
  //   minFriendship?: number;
  //   minRomance?: number;
  //   location?: string;
  //   timeOfDay?: string;
  // };
}
```

**Phase 1 Activities (Debug/Testing):**
- "Have a friendly chat" → +10 Friendship
- "Flirt a little" → +10 Romance
- "Say something rude" → -10 Friendship
- "Act dismissive" → -10 Romance

### GameState
```typescript
interface GameState {
  playerId: string;

  // Current session
  discoveredNPCs: string[];  // Array of NPC IDs

  // Future fields (Phase 2+)
  // currentDay: number;
  // currentTime: TimeSlot;
  // playerCharacter: PlayerCharacter;
  // energy: number;
  // money: number;
  // discoveredLocations: string[];

  createdAt: Date;
  lastPlayed: Date;
}
```

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

## Architecture Principles

### Modularity & Extensibility
To support iterative development and prevent spaghetti code:

1. **NPC Generation Service (Isolated)**
   - `NPCGeneratorService` handles all generation logic
   - Easy to swap random generation for rule-based system later
   - Located in: `backend/src/services/npc-generator/`

2. **Relationship Engine (Isolated)**
   - `RelationshipService` manages relationship state calculations
   - Activity effects → State transitions
   - Future: Complex interaction matrix, memory system
   - Located in: `backend/src/services/relationship/`

3. **Image Service (Abstracted)**
   - `ImageService` wraps AI API calls
   - Handles caching, fallbacks, retries
   - Located in: `backend/src/services/image/`

4. **State Management (Frontend)**
   - @ngrx/signals for reactive state
   - Separate stores for: NPCs, Relationships, GameState
   - Clean separation from UI components

### Database-First Approach
- All game state persists to database immediately
- Prevents cheating, enables future cross-player features
- Local debugging overrides available for development

### API Design
RESTful endpoints for Phase 1:
```
POST   /api/npcs              - Generate new NPC
GET    /api/npcs              - List discovered NPCs
GET    /api/npcs/:id          - Get NPC details

GET    /api/relationships     - List all relationships
GET    /api/relationships/:id - Get specific relationship
POST   /api/relationships/:id/interact - Perform activity

GET    /api/images/character/:id/:state - Get character image

GET    /api/game-state        - Get current game state
PUT    /api/game-state        - Update game state
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

## Future Phases (Roadmap)

### Phase 2: Daily Life Simulation
- Player character creation (name, appearance, starting attributes)
- Time system (morning/afternoon/evening/night)
- Energy resource management
- Basic activities (work, study, workout, relax)
- Money system

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

## Open Questions

1. **Backend Framework & Database:** Confirm tech stack details
2. **AI Image API Specifics:** Finalize contract, authentication, rate limits
3. **NPC Generation:** How many archetypes for Phase 1? Trait pool size?
4. **Image States:** How many emotional states to support initially?
5. **Relationship State Transitions:** Define exact thresholds (e.g., Friendship 50+ = Friend)
6. **Activity Variety:** Stick with 4 debug activities or expand to ~8 with flavor?
7. **UI Framework:** Material, Tailwind, or custom styling?

---

## Success Metrics (Phase 1)

- Players can generate unique NPCs with varied appearances
- Relationship values change smoothly with interactions
- AI images reflect relationship states appropriately
- Core loop is engaging (players want to discover more NPCs)
- No major bugs or data loss
- Smooth image loading experience (caching works)

---

*This outline is a living document and will evolve as development progresses.*
