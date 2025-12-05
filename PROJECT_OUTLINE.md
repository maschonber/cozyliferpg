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
Phase 2 introduces resource management and pacing through time and energy systems. Players must strategically balance limited time, energy, and money to pursue relationships, personal development, and daily life needs.

### Core Design Decisions

#### 1. Time System
- **Time Tracking:** Real-time clock (HH:MM format) from wake-up to bedtime
- **Time Display:** Show both actual time (e.g., "14:30") and derived period (Afternoon)
- **Time Progression:** Automatic - activities consume specific minutes
- **Activity Time Costs:**
  - Quick actions (check phone, browse): 0 minutes
  - Light activities (coffee, casual chat): 30-60 minutes
  - Medium activities (dates, study, nap): 60-120 minutes
  - Heavy activities (work, intense workouts): 180-240 minutes
- **Day Structure:**
  - Day starts at wake-up time (6 AM - 8 AM, varies by sleep schedule)
  - Latest bedtime: 4 AM (activities cannot end after 4 AM)
  - Activities ending after midnight visually marked (reduces available sleep)
  - Time slots derived from clock:
    - Morning: 6 AM - 12 PM
    - Afternoon: 12 PM - 6 PM
    - Evening: 6 PM - 12 AM
    - Night: 12 AM - 6 AM
- **Wake-Up Schedule:**
  - Sleep 8+ hours → Wake at 6 AM
  - Sleep < 8 hours → Wake later (up to 8 AM max)
  - Go to bed before 10 PM → Still wake at 6 AM (no extra benefit)
  - Go to bed after midnight → Reduced sleep time (wake at 8 AM max)

#### 2. Energy System
- **Single Energy Pool:** 100 points maximum (no stats initially)
- **Energy Costs:** Activities can cost, restore, or be neutral
  - Heavy work/study: -25 to -40 energy
  - Social activities: -15 to -25 energy
  - Light relaxation: -5 to +10 energy
  - Napping: +20 to +30 energy (costs time)
  - Sleeping: Variable restoration (see formula below)
- **Sleep Energy Restoration Formula:**
  - Energy restored = Hours slept × 10 (max 80 energy at 8 hours)
  - Examples:
    - Sleep 8 hours → +80 energy
    - Sleep 6 hours → +60 energy
    - Sleep 4 hours → +40 energy
  - Sleeping longer than 8 hours provides no extra energy
  - Does NOT fully restore to 100 (encourages long-term resource management)
  - Future: Better beds could increase restoration rate or maximum

#### 3. Money System
- **Basic Resource:** Track money as integer ($)
- **Sources:** Part-time work activities
- **Sinks:** Some activities cost money (dates, entertainment, shopping)
- **Starting Amount:** $200
- **Future Expansion:** Jobs, gifts for NPCs, purchases

#### 3b. Starting Conditions
- **Day 1, 6:00 AM**
- **Energy:** 100/100
- **Money:** $200
- **Restart Option:** Available for debugging (resets all progress)

#### 4. Player Character (Minimal)
- **No name/gender selection** in Phase 2 (defer to Phase 3)
- **Track only:** Current energy, current money, current time/day
- **Stats:** Deferred to Phase 3+

#### 5. Activities (Expanded)
- **Target Count:** ~20 activities covering diverse categories
- **Categories:**
  - Work (earn money, high energy cost, long time)
  - Social with NPCs (varying costs, affect friendship/romance)
  - Self-improvement (study, exercise - costs resources, future stat gains)
  - Leisure/Relaxation (low/neutral energy, variable time)
  - Self-care (nap, sleep - restore energy)
  - Discovery (Meet Someone New - costs time/energy)
- **Design Philosophy:**
  - Heavy activities (work, study) = high energy cost, long time
  - Light activities (park stroll, relaxing) = low energy, variable time
  - Some activities restricted by time of day (work in morning/afternoon, etc.)
  - Social activities maintain Phase 1 relationship effects (friendship/romance deltas)
  - Some activities OK to have minimal impact if they rely on future systems

#### 6. UI/UX
- **Top Bar HUD (Always Visible):**
  ```
  Day 3  |  14:30 (Afternoon)  |  ⚡ 65/100  |  💰 $180
  ```
- **Activity Selection:**
  - Show time cost (in minutes), energy cost, money cost
  - Gray out activities player can't afford (insufficient energy/money/wrong time)
  - Clear tooltips for unavailable activities
  - Visual warning for activities ending after midnight (⚠️ icon)
- **Sleep/Day Transition:**
  - Option to sleep manually before 4 AM
  - Show projected energy restoration based on current time
  - Summary of day before advancing to next day

---

### Phase 2 Activity Specifications

**Legend:** Time | Energy | Money | Effects

#### Work Activities
1. **Work Part-Time Job**
   - 240 min (4 hours) | -30 energy | +$80
   - Available: Morning, Afternoon only
   - Description: "Work a 4-hour shift at your part-time job"

2. **Work Full Day**
   - 480 min (8 hours) | -50 energy | +$150
   - Available: Morning only (must start early)
   - Description: "Work a full 8-hour shift for maximum pay"

#### Social Activities (with NPCs)
3. **Have Coffee Together**
   - 60 min | -15 energy | -$5 | +10 Friendship
   - Available: Anytime
   - Description: "Grab a casual coffee and catch up"

4. **Quick Chat**
   - 30 min | -10 energy | $0 | +5 Friendship
   - Available: Anytime
   - Description: "Have a brief conversation"

5. **Go on Casual Date**
   - 120 min | -20 energy | -$30 | +15 Romance
   - Available: Evening, Night
   - Description: "Go out for dinner or drinks together"

6. **Have Deep Conversation**
   - 90 min | -25 energy | $0 | +20 Friendship
   - Available: Anytime
   - Requirement: Friend level or higher
   - Description: "Share meaningful thoughts and feelings"

7. **Go to Movies**
   - 150 min | -15 energy | -$20 | +10 Friendship, +5 Romance
   - Available: Evening, Night only
   - Description: "Watch a film together at the cinema"

8. **Exercise Together**
   - 90 min | -30 energy | $0 | +10 Friendship
   - Available: Morning, Afternoon, Evening
   - Description: "Work out or play sports together"

9. **Cook Dinner Together**
   - 120 min | -20 energy | -$15 | +12 Friendship, +8 Romance
   - Available: Evening, Night
   - Description: "Prepare and share a homemade meal"

10. **Flirt Playfully**
    - 45 min | -15 energy | $0 | +12 Romance
    - Available: Anytime
    - Description: "Engage in some lighthearted flirting"

#### Self-Improvement Activities
11. **Study at Library**
    - 120 min | -25 energy | $0
    - Available: Morning, Afternoon, Evening
    - Description: "Hit the books and expand your knowledge"
    - Future: +Intelligence

12. **Work Out at Gym**
    - 90 min | -30 energy | -$10 (gym fee)
    - Available: Morning, Afternoon, Evening
    - Description: "Get a solid workout in at the gym"
    - Future: +Fitness

13. **Read a Book**
    - 90 min | -10 energy | $0
    - Available: Anytime
    - Description: "Read for pleasure and relaxation"
    - Future: +Intelligence (small)

14. **Practice Creative Hobby**
    - 120 min | -20 energy | $0
    - Available: Anytime
    - Description: "Work on art, music, or creative projects"
    - Future: +Creativity

#### Leisure/Relaxation Activities
15. **Stroll in the Park**
    - 60 min | -5 energy | $0
    - Available: Morning, Afternoon, Evening
    - Description: "Take a peaceful walk outdoors"

16. **Play Video Games**
    - 120 min | -10 energy | $0
    - Available: Anytime
    - Description: "Unwind with some gaming"

17. **Watch TV**
    - 90 min | +5 energy | $0
    - Available: Anytime
    - Description: "Relax and watch your favorite shows"

18. **Listen to Music**
    - 30 min | +10 energy | $0
    - Available: Anytime
    - Description: "Put on some tunes and chill"

#### Self-Care Activities
19. **Take a Nap**
    - 60 min | +25 energy | $0
    - Available: Afternoon, Evening
    - Description: "Get some quick rest to recharge"

20. **Go to Sleep**
    - Special (ends day) | +Energy (hours × 10, max 80) | $0
    - Available: Evening, Night only
    - Description: "Go to bed and end the day"

#### Discovery Activity
21. **Meet Someone New**
    - 45 min | -20 energy | $0
    - Available: Anytime
    - Description: "Explore the neighborhood and meet a new person"
    - Effect: Generates new NPC and creates relationship

---

### Data Model Updates for Phase 2

#### PlayerCharacter (NEW)
```typescript
interface PlayerCharacter {
  id: string;
  userId: string;

  // Resources
  currentEnergy: number;      // 0-100
  maxEnergy: number;          // 100 (fixed for Phase 2, variable in future)
  money: number;              // Starting: $200

  // Time tracking
  currentDay: number;         // 1, 2, 3...
  currentTime: string;        // "HH:MM" format (e.g., "14:30")
  lastSleptAt: string;        // "HH:MM" - for calculating sleep duration

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

#### Activity (UPDATED - Phase 2)
```typescript
interface Activity {
  id: string;
  name: string;
  description: string;
  category: 'work' | 'social' | 'self_improvement' | 'leisure' | 'self_care' | 'discovery';

  // Costs (Phase 2 additions)
  timeCost: number;           // Minutes consumed
  energyCost: number;         // Can be negative (cost) or positive (restore)
  moneyCost: number;          // Can be negative (cost) or positive (earn)

  // Time restrictions (Phase 2)
  allowedTimeSlots?: TimeSlot[];  // If undefined, available anytime
                                   // e.g., ["morning", "afternoon"]

  // Requirements (Phase 2+)
  minEnergy?: number;              // Minimum energy required
  minRelationship?: string;        // e.g., "friend" (for relationship-gated activities)

  // Effects (from Phase 1, still used)
  effects: {
    friendship?: number;
    romance?: number;
    // Future: stats like fitness, intelligence, etc.
  };
}

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
```

#### Helper Functions/Logic (Implementation Notes)

**Time Slot Calculation:**
```typescript
function getTimeSlot(time: string): TimeSlot {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night'; // 0-6
}
```

**Sleep Duration & Wake Time Calculation:**
```typescript
function calculateSleepResults(currentTime: string, bedtime: string) {
  // Calculate hours until 6 AM or 8 AM based on bedtime
  const bedHour = parseInt(bedtime.split(':')[0]);
  const bedMinute = parseInt(bedtime.split(':')[1]);

  let wakeTime: string;
  let hoursSlept: number;

  if (bedHour < 6) {
    // After midnight, before 6 AM
    hoursSlept = (6 - bedHour) - (bedMinute / 60);
    wakeTime = hoursSlept >= 8 ? "06:00" : "08:00";
  } else if (bedHour >= 22) {
    // 10 PM or later
    hoursSlept = (24 - bedHour) + 6 - (bedMinute / 60);
    wakeTime = "06:00";
  } else {
    // Between 6 AM and 10 PM
    hoursSlept = (24 - bedHour) + 6 - (bedMinute / 60);
    wakeTime = "06:00";
  }

  // Cap at 8 hours max
  hoursSlept = Math.min(hoursSlept, 8);

  // Calculate energy restoration
  const energyRestored = Math.floor(hoursSlept * 10); // Max 80

  return { wakeTime, energyRestored, hoursSlept };
}
```

**Activity End Time Validation:**
```typescript
function canPerformActivity(activity: Activity, currentTime: string, currentEnergy: number, currentMoney: number): { allowed: boolean; reason?: string } {
  // Check energy
  if (currentEnergy + activity.energyCost < 0) {
    return { allowed: false, reason: "Not enough energy" };
  }

  // Check money
  if (currentMoney + activity.moneyCost < 0) {
    return { allowed: false, reason: "Not enough money" };
  }

  // Check time slot restriction
  if (activity.allowedTimeSlots) {
    const currentSlot = getTimeSlot(currentTime);
    if (!activity.allowedTimeSlots.includes(currentSlot)) {
      return { allowed: false, reason: "Not available at this time" };
    }
  }

  // Check if activity would end after 4 AM
  const endTime = addMinutes(currentTime, activity.timeCost);
  const endHour = parseInt(endTime.split(':')[0]);
  if (endHour >= 4 && endHour < 6) {
    return { allowed: false, reason: "Would end too late (after 4 AM)" };
  }

  return { allowed: true };
}
```

---

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
