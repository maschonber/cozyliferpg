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

## Phase 2: Time & Energy Systems ✅ COMPLETED

### What Was Built
Phase 2 successfully transformed the game from a simple relationship simulator into a resource management experience. Players must now strategically balance time, energy, and money to pursue relationships and daily activities.

**Development Period:** ~2 weeks
**Key Commits:**
- b060fc8: Implement Phase 2 backend and state management
- 68f1f5c: Fix sleep calculation algorithm
- 490cede: Add Phase 2 player HUD component
- bbb7990: Complete Phase 2 frontend UI implementation

### Implemented Features

#### ✅ Time System
- **Clock System:** HH:MM format tracking from wake-up (6-8 AM) to bedtime (max 4 AM)
- **Time Slots:** Automatic derivation (Morning, Afternoon, Evening, Night) from current time
- **Activity Duration:** 21 activities with varied time costs (30 min - 8 hours)
- **Sleep Schedule:** Sophisticated wake time calculation based on bedtime
  - Early sleep (before 10 PM) → Wake at 6 AM
  - Optimal sleep (10 PM - midnight) → Wake 8 hours later
  - Late sleep (after midnight) → Reduced sleep, wake at 8 AM max
- **Time Validation:** Activities blocked if they would end after 4 AM

#### ✅ Energy System
- **Energy Pool:** 0-100 range with dynamic costs per activity
- **Activity Costs:** Range from -50 (full day work) to +5 (napping, light leisure)
- **Sleep Restoration:** Formula: `hoursSlept × 10` (max 80 energy from 8 hours)
- **Strategic Depth:** Energy doesn't fully restore, requiring long-term planning

#### ✅ Money System
- **Starting Capital:** $200
- **Income Sources:** Part-time job (+$80), Full-day work (+$150)
- **Expenses:** Social activities (coffee -$5, dates -$30), gym (-$10), movies (-$20)
- **Balance Challenge:** Players must work to afford social activities

#### ✅ Player Character Tracking
- **Database Model:** Full PlayerCharacter table with resource tracking
- **Persisted State:** Energy, money, current day, current time, last sleep time
- **Reset Function:** Debug tool to restart progress (deletes NPCs, resets to Day 1)

#### ✅ Activities (21 Total)
Exceeded target of ~20 activities across all categories:
- **Work (2):** Part-time job, full-day shift
- **Social with NPCs (8):** Coffee, quick chat, dates, deep conversation, movies, exercise together, cook dinner, flirt
- **Self-Improvement (4):** Study library, gym workout, read book, creative hobby
- **Leisure (4):** Park stroll, video games, watch TV, listen to music
- **Self-Care (2):** Nap, sleep
- **Discovery (1):** Meet Someone New

#### ✅ Activity System Enhancements
- **Availability Validation:** Real-time checks for energy, money, time slot, end time
- **Time Restrictions:** Some activities limited to specific time slots (e.g., work only in morning/afternoon)
- **Visual Feedback:** Grayed-out unavailable activities with reason tooltips
- **Category Classification:** Each activity tagged for future filtering/organization

#### ✅ UI/UX Implementation
- **Player HUD Component:** Persistent top bar showing Day, Time (with slot label), Energy bar, Money
- **Energy Bar Colors:** Dynamic coloring (green/yellow/red) based on energy level
- **Activity Display:** Shows time cost, energy cost, money cost for each activity
- **Sleep Button:** Dedicated sleep action with projected energy restoration preview
- **Reset Option:** Confirmation dialog for progress reset

#### ✅ Backend Services
- **Time Service:** Helper functions for time calculations, sleep results, activity validation
- **Player Service:** CRUD operations for player character
- **API Endpoints:**
  - `GET /api/player` - Get/create player character
  - `POST /api/player/sleep` - Sleep and advance day
  - `POST /api/player/reset` - Reset progress
  - `GET /api/activities` - List all activities with availability
  - `POST /api/activities/perform` - Perform solo activity

#### ✅ Testing & Refinement
- **Unit Tests:** Time service thoroughly tested (sleep calculations, time slot logic)
- **Energy Balancing:** Adjusted after initial testing (commit d07f5df)
- **Bug Fixes:** Fixed duplicate sleep action, NPC creation, UI consistency issues
- **Mobile Responsive:** Activity buttons and HUD optimized for mobile

### Postponed to Later Phases
Features deliberately deferred for future development:
- **Player Customization:** Name/gender selection (planned for Phase 3+)
- **Player Stats:** Intelligence, Fitness, Creativity attributes (system exists but not implemented)
- **Stat Gains:** Activities prepared with "Future: +Stat" notes, no actual progression yet
- **Relationship-Gated Activities:** `minRelationship` field exists but minimally used
- **Item Upgrades:** Better beds, equipment (mentioned in outline as future enhancement)

---

## Phase 2.5: Player Stats & Progression (Postponed from Phase 2)

### Scope
Introduce player character stats and progression system to give activities long-term meaning beyond immediate resource management.

### Features to Implement
- **Player Stats:** Intelligence, Fitness, Creativity, Charisma (0-100 scale)
- **Stat Gains:** Activities grant stat experience (Study → Intelligence, Gym → Fitness, etc.)
- **Stat Display:** Show current stats in player profile/HUD
- **Stat Effects:** Stats influence activity outcomes and unlock new interactions
  - High Charisma → Better relationship gains
  - High Fitness → Lower energy cost for physical activities
  - High Intelligence → New conversation options
  - High Creativity → New hobby activities

### Optional Player Customization
- Player name selection
- Player gender/pronouns selection
- Appearance customization (basic)

**Priority:** Medium - Adds depth but not critical for core gameplay
**Estimated Scope:** 1-2 weeks

---

## Phase 3: Locations & Exploration 🔨 NEXT

### Scope
Transform the neighborhood from an abstract space into a living world with distinct locations. Players navigate between places, discovering NPCs in their natural habitats and unlocking location-specific activities.

### Core Features

#### Location System
- **Multiple Locations:** 5-8 distinct neighborhood locations
  - Home (player's apartment)
  - Coffee Shop
  - Park
  - Gym
  - Library
  - Downtown/Shopping District
  - Beach/Waterfront (optional)
  - Bar/Nightclub (optional)

#### Location Mechanics
- **Navigation:** Simple location selection UI (no complex maps initially)
- **Travel Time:** Moving between locations costs time (5-15 minutes depending on distance)
- **Current Location:** Track player's current location in PlayerCharacter
- **Activity Filtering:** Activities only available at specific locations
  - Coffee Shop → Have Coffee, Quick Chat
  - Gym → Work Out, Exercise Together
  - Park → Stroll, Picnic (new)
  - Library → Study, Read
  - Home → Sleep, Nap, Watch TV, Creative Hobbies

#### NPC Integration
- **Location Presence:** NPCs have preferred locations based on archetype
  - Artist → Park, Coffee Shop, Downtown
  - Athlete → Gym, Park, Beach
  - Bookworm → Library, Coffee Shop, Home
  - Musician → Coffee Shop, Bar, Park
  - Scientist → Library, Coffee Shop, Home
- **Discovery System:** "Meet Someone New" generates NPC + assigns to current location
- **NPC Schedules (Basic):** Time-of-day preferences for locations
  - Morning: NPCs at coffee shops, gyms, parks
  - Afternoon: Scattered across various locations
  - Evening: Bars, restaurants, home
  - Night: Mostly home (limited availability)

#### Location-Specific Content
- **New Activities:** 5-10 new location-exclusive activities
  - Picnic in Park
  - Bar Drinks
  - Beach Walk
  - Window Shopping
  - Art Gallery Visit
- **Ambient Details:** Each location has description/atmosphere text
- **Visual Enhancement:** Location background images (stretch goal)

#### UI/UX
- **Location Selector:** Dropdown or card-based location navigation
- **Location Header:** Display current location prominently
- **Neighbor List Filtering:** Option to filter NPCs by current location
- **Travel Confirmation:** Show time cost before moving to new location

### Data Model Changes

#### PlayerCharacter (Updated)
```typescript
interface PlayerCharacter {
  // ... existing fields ...
  currentLocation: string;  // 'home', 'coffee_shop', 'park', etc.
}
```

#### NPC (Updated)
```typescript
interface NPC {
  // ... existing fields ...
  favoriteLocations: string[];  // Based on archetype
  currentLocation?: string;     // Where they are right now (optional for Phase 3)
}
```

#### Activity (Updated)
```typescript
interface Activity {
  // ... existing fields ...
  location?: string;  // Required location (undefined = available anywhere)
}
```

#### Location (New)
```typescript
interface Location {
  id: string;
  name: string;
  description: string;
  travelTimeMinutes: { [fromLocation: string]: number };  // Travel times from other locations
  availableTimeSlots?: TimeSlot[];  // Some locations might have hours
  imageUrl?: string;  // Optional background image
}
```

### Implementation Strategy
1. Define location data (names, descriptions, travel times)
2. Add currentLocation to PlayerCharacter table and API
3. Update Activity definitions with location requirements
4. Implement location navigation UI
5. Update NPC generation with favorite locations
6. Filter activities and NPCs by current location
7. Test location flow and balance travel times

**Priority:** High - Critical for expanding game world
**Estimated Scope:** 2-3 weeks

---

## Phase 4: Advanced NPCs
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
