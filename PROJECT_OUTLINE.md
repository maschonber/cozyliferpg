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

## Phase 2: Time & Energy Systems 🔨 NEXT

### Scope
Phase 2 introduces resource management and pacing through time and energy systems. Players must strategically balance limited resources to pursue relationships, personal development, and daily life needs.

**Planned Features:**
- Time system (day cycles with morning/afternoon/evening/night slots)
- Energy resource management
- Player character creation and tracking
- Expanded activity system with costs and requirements
- Money system (work to earn, activities cost money)
- Player stats (Fitness, Intelligence, Charisma) - optional

**Core Questions to Resolve:**
- Time mechanics (automatic vs manual advancement)
- Energy system design (single pool, recovery mechanics)
- Player stats inclusion/scope
- Activity variety and balancing
- UI/UX for resource tracking

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
