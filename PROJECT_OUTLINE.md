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

## Phase 2.5: Player Stats & Progression

### Vision

Introduce a meaningful, long-term progression system that rewards diverse gameplay. Player stats grow through both dedicated training AND organic gameplay, encouraging players to forge genuine connections, maintain healthy habits, and balance work with social life. The dual-value system (Base + Current) creates interesting tension between short-term optimization and long-term growth.

### Design Philosophy

- **Organic Growth Over Grinding:** Stats grow through relationships and lifestyle, not just repetitive activities
- **Lifestyle Matters:** Good habits (sleep, self-care) directly impact progression
- **Specialization is Valid:** Can't max everything; playstyle shapes your character
- **Progress Feels Earned:** Base stat represents true growth that can't be lost
- **Consequences Exist:** Negative actions impact Current stat, slowing overall progress

---

### The 9 Player Stats

#### Physical Stats
| Stat | Description |
|------|-------------|
| **Fitness** | Athletic capability, strength, physical attractiveness through exercise |
| **Vitality** | Overall wellness, health, natural energy, recovery speed |
| **Poise** | Body language, posture, physical grace, how you carry yourself |

#### Mental Stats
| Stat | Description |
|------|-------------|
| **Knowledge** | Book smarts, trivia, conversational depth, intellectual capability |
| **Creativity** | Artistic expression, problem-solving, spontaneity, original thinking |
| **Ambition** | Career drive, goal-setting, work ethic, professional motivation |

#### Social Stats
| Stat | Description |
|------|-------------|
| **Confidence** | Self-assurance, social courage, willingness to take initiative |
| **Wit** | Quick thinking, humor, clever responses, conversational agility |
| **Empathy** | Emotional intelligence, listening skills, understanding others |

*Note: Each stat can grow through multiple methods - dedicated training activities, organic gameplay triggers, lifestyle choices, and social interactions. Specific growth sources will be defined during implementation.*

---

### Dual-Value System: Base & Current

Each stat has two values that work together:

#### Base Stat
- **Nature:** Long-term, permanent progress - your true capability floor
- **Range:** 0-100 (hard cap at 100, represents mastery)
- **Direction:** Only increases, never decreases
- **Growth:** Rises slowly when Current is considerably higher than Base
- **Purpose:** Represents genuine character development that can't be lost

#### Current Stat
- **Nature:** Short-term, active level - your recent performance
- **Range:** 0 to Base+30 (capped relative to Base), can exceed 100 with effort
- **Direction:** Can increase AND decrease based on actions
- **Decay:** Moves toward Base daily when not actively maintained
- **Purpose:** Represents recent training, habits, and behavior

#### Base Growth Mechanics
```
Daily calculation (during sleep):
  If Current >= Base + 10: Base += 0.3
  If Current >= Base + 20: Base += 0.5
  If Current >= Base + 30: Base += 0.8 (maximum)
```

#### Current Decay Mechanics
```
Daily calculation (during sleep):
  Gap = Current - Base
  If Gap > 0 and stat wasn't trained today:
    If Gap <= 10: Current -= 0.5
    If Gap <= 20: Current -= 1.0
    If Gap <= 30: Current -= 1.5
  Current never drops below Base
```

#### Current Cap Mechanics
```
Maximum Current = Base + 30
This prevents "overtraining" Current while ignoring Base growth
Players must let Base catch up to push Current higher
```

---

### Stat Growth Methods

*To be designed in detail during implementation.* Each stat will have multiple growth sources including:
- Dedicated training activities (e.g., gym for Fitness)
- Organic gameplay triggers (e.g., social success for Confidence)
- Lifestyle factors (e.g., sleep habits for Vitality)
- Interaction outcomes (e.g., deep conversations for Empathy)

Specific activities and their stat effects will be defined iteratively during development.

---

### Negative Growth (Current Stat Only)

*To be designed in detail during implementation.* Bad behavior and poor habits will reduce Current stat values, which slows Base growth. Specific triggers and penalties will be determined after core stat mechanics are stable.

**Note:** Negative effects only impact Current, never Base. This means poor behavior slows progress but doesn't undo permanent growth.

---

### Diminishing Returns

Higher stats are harder to improve:

```
Effective Gain = Base Gain × (1 - Current/150)

At Current 0:   100% of base gain
At Current 50:  67% of base gain
At Current 75:  50% of base gain
At Current 100: 33% of base gain
At Current 120: 20% of base gain
```

Additionally, maintaining a high Current-Base gap becomes harder at higher values due to increased decay rates and reduced gains.

---

### Gameplay Effects

Stats influence gameplay through three mechanisms:

#### 1. Percentage Modifiers

*To be designed in detail during implementation.* Stats will provide scaling bonuses to resource costs, gains, and other numerical effects. Specific modifiers will be determined after playtesting the core stat system.

#### 2. Unlock Gates (Uses Base Stat)

Certain activities require minimum **Base** stat thresholds (not Current). This ensures players have achieved genuine, permanent growth before accessing advanced content.

*Unlock requirements and thresholds to be defined during implementation.*

#### 3. Success Probability (Primary Mechanic)

Activities have a **difficulty rating** (1-100) that determines how challenging they are. Player stats improve odds but never guarantee success or eliminate failure.

**Outcome Tiers:**
| Tier | Description |
|------|-------------|
| **Catastrophic** | Everything goes wrong - relationship loss, extra costs, setbacks |
| **Mixed** | Partial success with complications - reduced gains, minor issues |
| **Okay** | Standard expected outcome - normal gains as designed |
| **Best** | Exceptional success - bonus gains, special benefits (always somewhat rare) |

**Roll Mechanic:**
```
Activity Difficulty: 1-100 (easy activities low, hard activities high)
Roll: random(1-100)
Stat Bonus: RelevantStat / 3 (rounded)
Difficulty Penalty: Difficulty / 2 (rounded)

Adjusted Roll = Roll + Stat Bonus - Difficulty Penalty

Catastrophic:  Adjusted Roll < 20
Mixed:         Adjusted Roll 20-44
Okay:          Adjusted Roll 45-79
Best:          Adjusted Roll >= 80
```

**Key Properties:**
- **No guaranteed success:** Even at 100 stat, bad rolls can still produce Catastrophic/Mixed outcomes
- **No guaranteed failure:** Even at 0 stat on easy activities, good rolls can produce Best outcomes
- **Best is rare:** Typically 10-25% chance even when well-matched to difficulty
- **Difficulty creates challenge tiers:** Easy activities (10-20) vs Hard activities (60-80)

**Example Difficulties:**
| Activity | Difficulty | Notes |
|----------|------------|-------|
| Stroll in the Park | 10 | Easy, relaxing activity |
| Quick Chat | 20 | Basic social interaction |
| Gym Workout | 35 | Moderate physical challenge |
| Deep Conversation | 45 | Requires emotional engagement |
| Job Interview | 60 | High-stakes social situation |
| Marathon | 75 | Serious athletic challenge |
| Give a Speech | 70 | Demanding public performance |

**Probability Examples:**

*Stroll in the Park (Difficulty 10) - using Fitness:*
| Fitness | Catastrophic | Mixed | Okay | Best |
|---------|--------------|-------|------|------|
| 5 | ~17% | ~25% | ~35% | ~23% |
| 50 | ~3% | ~22% | ~35% | ~40% |
| 100 | ~0% | ~7% | ~35% | ~58% |

*Marathon (Difficulty 75) - using Fitness:*
| Fitness | Catastrophic | Mixed | Okay | Best |
|---------|--------------|-------|------|------|
| 5 | ~57% | ~25% | ~17% | ~1% |
| 50 | ~40% | ~25% | ~30% | ~5% |
| 100 | ~22% | ~25% | ~35% | ~18% |

*Note: Even a max-Fitness athlete has meaningful failure chance on a marathon, and Best outcome remains uncommon (~18%). Meanwhile, a beginner can reliably enjoy a park stroll.*

---

### Starting Values & Character Archetypes

Players begin with different stat distributions based on chosen archetype:

| Archetype | High Stats (25) | Medium Stats (15) | Low Stats (5) |
|-----------|-----------------|-------------------|---------------|
| **Athlete** | Fitness, Vitality | Confidence, Ambition, Poise | Knowledge, Creativity, Wit, Empathy |
| **Scholar** | Knowledge, Creativity | Ambition, Wit, Vitality | Fitness, Confidence, Poise, Empathy |
| **Social Butterfly** | Confidence, Wit, Empathy | Poise, Vitality | Fitness, Knowledge, Creativity, Ambition |
| **Artist** | Creativity, Empathy | Poise, Wit, Vitality | Fitness, Ambition, Knowledge, Confidence |
| **Professional** | Ambition, Knowledge | Vitality, Confidence, Poise | Creativity, Empathy, Fitness, Wit |
| **Balanced** | — | All stats at 15 | — |

*Note: Exact stat assignments per archetype to be finalized during implementation.*
*Future: Point-buy character creation for custom distributions*

---

### UI Requirements

#### Player Profile Screen
- Display all 9 stats with both Base and Current values
- Visual representation (bars or numbers) showing:
  - Base value (solid portion)
  - Current value (extended portion above base)
  - Gap indicator when Current > Base
- Category grouping (Physical / Mental / Social)

#### Activity Summary (After Each Activity)
- Show stat changes from each action
- Show roll result and outcome tier for activities with success probability
- Display any negative effects clearly

#### Sleep Summary (End of Day)
- Daily stat change summary for all stats
- Base growth notifications when Base increases
- Current decay notifications when Current moves toward Base
- Highlight stats that grew vs declined

#### Development Mode (Current Phase)
- Full transparency: show all numbers, rolls, modifiers
- Useful for playtesting and balance tweaking

#### Production Mode (Future)
- Consider hiding exact numbers
- Show tiers/ranks instead of precise values
- Make gains feel more natural, less "gamey"

---

### Data Model Updates

#### PlayerCharacter (Extended)
```typescript
interface PlayerStats {
  // Base stats (permanent, 0-100)
  baseFitness: number;
  baseVitality: number;
  basePoise: number;
  baseKnowledge: number;
  baseCreativity: number;
  baseAmbition: number;
  baseConfidence: number;
  baseWit: number;
  baseEmpathy: number;

  // Current stats (active, 0 to base+30)
  currentFitness: number;
  currentVitality: number;
  currentPoise: number;
  currentKnowledge: number;
  currentCreativity: number;
  currentAmbition: number;
  currentConfidence: number;
  currentWit: number;
  currentEmpathy: number;
}

interface PlayerCharacter {
  // ... existing fields ...
  stats: PlayerStats;
  archetype: PlayerArchetype;  // Starting archetype chosen
}

type PlayerArchetype =
  | 'athlete'
  | 'scholar'
  | 'social_butterfly'
  | 'artist'
  | 'professional'
  | 'balanced';
```

#### Activity (Extended)
```typescript
interface Activity {
  // ... existing fields ...

  // Stat effects (to be implemented)
  statEffects?: {
    [statName: string]: number;  // Base gain before modifiers
  };

  // Success roll configuration
  difficulty?: number;  // 1-100, determines challenge level
  relevantStats?: string[];  // Stats that modify the roll

  // Unlock requirements (uses Base stat)
  statRequirements?: {
    [statName: string]: number;  // Minimum Base stat required
  };
}

interface ActivityOutcome {
  tier: 'catastrophic' | 'mixed' | 'okay' | 'best';
  friendshipDelta?: number;
  romanceDelta?: number;
  energyDelta?: number;
  moneyDelta?: number;
  statEffects?: { [statName: string]: number };
  description: string;  // Flavor text for this outcome
}
```

---

### Implementation Strategy

#### Phase 2.5.1: Foundation
1. Extend database schema with stat columns (Base and Current for all 9)
2. Create PlayerStats interface and types
3. Implement stat service with Base/Current logic
4. Add archetype selection to character creation flow
5. Initialize stats based on chosen archetype

#### Phase 2.5.2: Core Mechanics
6. Implement Current stat cap (Base + 30)
7. Implement Base growth during sleep (when Current > Base)
8. Implement Current decay during sleep (toward Base)
9. Implement diminishing returns formula
10. Add stat tracking to daily cycle

#### Phase 2.5.3: Activity Integration
11. Add difficulty ratings to existing activities
12. Implement success roll system
13. Create outcome determination logic
14. Add stat requirements (Base) to select activities
15. Integrate rolls into activity execution flow

#### Phase 2.5.4: UI Implementation
16. Build stats display component for player profile
17. Add stat changes to activity summary screen
18. Add stat summary to sleep/end-of-day screen
19. Show unlock requirements on gated activities
20. Display roll results and outcome tiers

#### Phase 2.5.5: Growth Sources (Iterative)
21. Define stat effects for existing activities
22. Implement organic growth triggers
23. Implement negative growth triggers
24. Playtest and balance stat progression

#### Phase 2.5.6: Testing & Balance
25. Playtest stat progression over 30+ days
26. Adjust Base growth rates if needed
27. Adjust Current decay rates if needed
28. Tune activity difficulties
29. Balance outcome tier thresholds

---

### Success Criteria

Phase 2.5 is complete when:
- [ ] 9 stats exist with Base and Current values for each
- [ ] Character archetype selection works with varied starting stats (25/15/5)
- [ ] Current stat is capped at Base + 30
- [ ] Base grows during sleep when Current exceeds it
- [ ] Current decays toward Base when not maintained
- [ ] Diminishing returns affect stat gains at higher levels
- [ ] Activities have difficulty ratings
- [ ] Success roll system produces four outcome tiers
- [ ] At least some activities have stat unlock requirements (using Base)
- [ ] UI shows all stat information (Base, Current, changes)
- [ ] Activity summary shows roll results and outcomes
- [ ] Sleep summary shows daily stat changes
- [ ] System feels balanced over 30+ day playtest

---

### Future Enhancements (Post Phase 2.5)

- **Percentage Modifiers:** Stat-based bonuses to costs and gains
- **Negative Growth Triggers:** Specific penalties for bad behavior
- **NPC Stat Preferences:** Archetypes impressed by matching player stats
- **Point-Buy Creation:** Custom stat distribution instead of archetypes
- **Stat-Based Dialogue:** Different conversation options based on stats
- **Achievements:** Milestones for reaching stat thresholds
- **Stat Synergies:** Bonuses when multiple stats are high together
- **Mentor System:** High-stat NPCs can boost your training
- **Stat Visibility Options:** Toggle between detailed and minimal UI

---

## Phase 3: Locations & Exploration 🔨 NEXT

### Vision
Transform the game's abstract space into a living coastal town. Players navigate between distinct locations, each with unique activities and atmospheres. NPCs are discovered at specific locations, creating natural meeting points and adding spatial strategy to relationship building.

### Setting: Cozy Coastal Town
A small, charming seaside community with 10 distinct locations organized into 3 districts. The town has residential neighborhoods, a quaint downtown, and a scenic waterfront.

---

## Location System Design

### The 10 Locations

#### District 1: Residential Quarter (Home Base)
**Within-district travel: 5 minutes | To other districts: 15 minutes**

1. **Home (Player's Apartment)**
   - Your cozy personal space
   - Special location: Sleep action available everywhere but calculates travel home
   - Future: Upgradeable, exclusive advanced activities
   - Starting location for new players

2. **Neighborhood Park**
   - Green space with walking paths, benches, duck pond
   - Peaceful atmosphere, good for relaxation and casual encounters
   - Time: Always open

3. **Corner Coffee Shop**
   - Local cafe with warm atmosphere
   - Social hub for morning and afternoon meetings
   - Time: 6 AM - 10 PM

#### District 2: Town Center (Downtown)
**Within-district travel: 5 minutes | To other districts: 15 minutes**

4. **Public Library**
   - Quiet study spaces, book collections
   - Intellectual activities, deep conversations
   - Time: 8 AM - 8 PM

5. **Shopping District**
   - Main street with shops, boutiques, services
   - Work opportunities (retail jobs)
   - Browsing and window shopping
   - Time: 9 AM - 9 PM

6. **Fitness Center**
   - Modern gym with equipment and classes
   - Athletic activities, health-focused NPCs
   - Time: 5 AM - 11 PM

7. **Movie Theater**
   - Small cinema showing films
   - Date activity location
   - Time: 12 PM - 11 PM (matinees and evening shows)

#### District 3: Waterfront (Seaside)
**Within-district travel: 5 minutes | To other districts: 15 minutes**

8. **Beach**
   - Sandy shoreline, ocean views
   - Relaxation, swimming, beach activities
   - Time: Always open

9. **Boardwalk**
   - Wooden pier with shops, arcade, attractions
   - Mix of casual entertainment and dining
   - Combines pier/marina elements (boat views, nautical theme)
   - Time: 10 AM - 11 PM

10. **Seaside Bar & Grill**
    - Casual restaurant and bar with ocean view
    - Evening social hub, date location
    - Time: 11 AM - 2 AM

---

## Core Mechanics

### Travel System

**Movement Action:**
- New "Move to..." action always available (except during other activities)
- Opens full-screen location selector view
- Shows all 10 locations with:
  - Location name and brief description
  - Number of NPCs currently there
  - Travel time from current location
  - Availability status (open/closed based on time)

**Travel Costs:**
- **Within same district:** 5 minutes, no energy cost
- **Between different districts:** 15 minutes, no energy cost
- **Full mesh navigation:** Can travel from anywhere to anywhere
- Time is deducted upon arrival

**Special: "Go Home" Quick Action**
- Direct button/action to return home instantly
- Same travel time rules apply
- Convenient for ending the day

### Location Availability
- Most locations have operating hours
- Attempting to travel to closed location shows warning
- Can still travel there, but limited/no activities available
- **Home, Park, Beach:** Always accessible (24/7)

---

## NPC Location Integration

### NPC Positioning (Phase 3 - Static)

**Core Rules:**
- ✅ NPCs are assigned a location when first met via "Meet Someone New"
- ✅ NPC spawns at player's current location
- ✅ NPCs remain at that location permanently (no movement in Phase 3)
- ⚠️ Deferred to Phase 4: NPC schedules, autonomous movement, time-based repositioning

**Interaction Constraints:**
- **Can only interact with NPCs at your current location**
- Social activities require both player and NPC to be at same place
- Neighbor list shows all NPCs but indicates their locations
- Filter option: "Show only NPCs here"

**NPC Discovery:**
- "Meet Someone New" available at all locations **except Home**
- Generates new NPC and places them at current location
- NPC's archetype influences personality, but not initial location (for Phase 3)
- Future: Archetype could suggest favorite locations, but Phase 3 keeps it simple

**Display in UI:**
- Location selector shows NPC count: "Coffee Shop (3)"
- At each location, clearly show which NPCs are present
- Visual indicator if no NPCs at current location

---

## Activity Location Gating

### Existing Activities (21) - Location Assignments

#### **Home (Player's Apartment)**
- Sleep (works everywhere, but calculates travel home)
- Take a Nap ✅
- Watch TV ✅
- Listen to Music ✅
- Practice Creative Hobby ✅
- Play Video Games ✅
- Read a Book (Home variant - less efficient than library)
- Study (Home variant - less focused than library)

**Future exclusive:** Advanced relationship activities

#### **Corner Coffee Shop**
- Have Coffee Together (social) ✅
- Quick Chat (social, if NPC present) ✅
- Work Part-Time (Barista job) 🆕

#### **Neighborhood Park**
- Stroll in the Park ✅
- Meet Someone New ✅
- Quick Chat (social, if NPC present)
- Have Deep Conversation (social, if NPC present)

#### **Public Library**
- Study at Library ✅ (more efficient than home)
- Read a Book ✅ (most enjoyable here)
- Quick Chat (social, whisper mode)
- Have Deep Conversation (social)

#### **Shopping District**
- Work Part-Time (Retail job) 🆕
- Work Full Day (Retail/office job) ✅
- Meet Someone New ✅

#### **Fitness Center**
- Work Out at Gym ✅
- Exercise Together (social) ✅

#### **Movie Theater**
- Go to Movies (social) ✅ - Requires both people at theater

#### **Beach**
- Stroll/Beach Walk (solo or social)
- Meet Someone New ✅

#### **Boardwalk**
- Meet Someone New ✅
- Casual Date (social, boardwalk variant)
- Quick Chat (social)

#### **Seaside Bar & Grill**
- Go on Casual Date (social) ✅ - Dinner/drinks
- Cook Dinner Together (social) 🤔 - Maybe "Share a Meal" instead?
- Flirt Playfully (social) ✅
- Quick Chat (social)

### Social Activity Rules

**General Social Activities (Quick Chat, Deep Conversation, Flirting):**
- ✅ Available at ANY location if NPC is present
- ❌ NOT tied to specific locations
- Location provides flavor text/context only

**Special Social Activities (Movies, Dates, Exercise Together):**
- ✅ Require specific location
- ✅ Both player and NPC must be at that location
- Examples:
  - Go to Movies → Movie Theater only
  - Exercise Together → Fitness Center only
  - Go on Casual Date → Bar & Grill or Boardwalk

**Exception - Home Activities:**
- Most social activities NOT available at Home in Phase 3
- Future: Unlock "invite to home" after certain relationship level

---

## New Activities (Phase 3 Additions)

### Solo Activities (5 new)
Target: Add variety and location flavor

1. **Beach Walk** (Beach)
   - 45 min | -5 energy | $0
   - Peaceful walk along the shoreline
   - Category: Leisure

2. **Window Shopping** (Shopping District)
   - 60 min | -10 energy | $0
   - Browse shops without buying
   - Category: Leisure

3. **Morning Jog** (Park or Beach)
   - 45 min | -20 energy | $0
   - Energizing run outdoors
   - Category: Self-improvement
   - Available: Morning, Afternoon only
   - Future: +Fitness

4. **Swim at Beach** (Beach)
   - 60 min | -25 energy | $0
   - Refreshing ocean swim
   - Category: Self-improvement
   - Available: Morning, Afternoon, Evening (not night)
   - Future: +Fitness

5. **Play Arcade Games** (Boardwalk)
   - 90 min | -15 energy | -$10
   - Retro gaming fun
   - Category: Leisure

### Social Activities (3 new)

6. **Beach Picnic** (Beach, social with NPC)
   - 90 min | -20 energy | -$15 | +15 Friendship, +8 Romance
   - Share food and relaxation by the ocean
   - Category: Social
   - Available: Morning, Afternoon, Evening

7. **Play Pool/Darts** (Seaside Bar, social with NPC)
   - 60 min | -15 energy | -$10 | +10 Friendship
   - Friendly competition over games
   - Category: Social
   - Available: Evening, Night

8. **Boardwalk Stroll** (Boardwalk, social with NPC)
   - 75 min | -10 energy | -$5 | +8 Friendship, +10 Romance
   - Romantic walk along the pier
   - Category: Social
   - Available: Evening, Night

### Work Activities (Updates to existing + new)

**Existing Work Activities - Add Location:**
- Work Part-Time → Shopping District (Retail)
- Work Full Day → Shopping District (Office/Management)

**New Work Variant:**
9. **Work Part-Time Barista** (Coffee Shop)
   - 240 min | -35 energy | +$70
   - Serve coffee and pastries
   - Available: Morning, Afternoon
   - Category: Work
   - (Slightly less pay but different location option)

---

## Data Model Updates

### Location Interface
```typescript
interface Location {
  id: string;
  name: string;
  description: string;
  district: 'residential' | 'downtown' | 'waterfront';

  // Operating hours (optional - undefined means 24/7)
  openTime?: string;    // "06:00"
  closeTime?: string;   // "22:00"

  // Future: Background image
  imageUrl?: string;
}
```

### PlayerCharacter (Updated)
```typescript
interface PlayerCharacter {
  // ... existing fields ...
  currentLocation: string;  // Location ID: 'home', 'coffee_shop', 'park', etc.
}
```

### NPC (Updated)
```typescript
interface NPC {
  // ... existing fields ...
  currentLocation: string;  // Where they were first met and currently are

  // Future Phase 4+:
  // favoriteLocations?: string[];  // Preferred hangout spots based on archetype
  // schedule?: NPCSchedule;        // Time-based location patterns
}
```

### Activity (Updated)
```typescript
interface Activity {
  // ... existing fields ...

  // Location requirement
  location?: string;  // Specific location ID required (undefined = available anywhere with NPC)

  // For social activities without location: available anywhere if NPC is present
  // For social activities WITH location: both must be at that location
}
```

### Travel Action Type
```typescript
interface TravelAction {
  type: 'travel';
  destinationId: string;
  travelTimeMinutes: number;
}
```

---

## UI/UX Implementation

### Location Navigation Flow

**1. Main Game View (Updated):**
```
┌─────────────────────────────────────┐
│ Day 3 | 14:30 (Afternoon) | ⚡65 | 💰$180 │ [HUD]
├─────────────────────────────────────┤
│ 📍 Corner Coffee Shop               │ ← New location indicator
│ A cozy local cafe with warm vibes   │ ← Short description
├─────────────────────────────────────┤
│ Actions:                            │
│ [🚶 Move to...] [🏠 Go Home]       │ ← New travel actions
│                                     │
│ NPCs Here (2):                      │ ← Filter: show only local NPCs
│ ┌─────────────────────────────┐   │
│ │ 👤 Alex (Friend)            │   │
│ │ 📍 Here at Coffee Shop      │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ 👤 Jordan (Acquaintance)    │   │
│ │ 📍 At Beach                 │   │ ← Shows where other NPCs are
│ └─────────────────────────────┘   │
│                                     │
│ Solo Activities:                    │
│ [Have Coffee] [Study] [Work Part-Time]...
│                                     │
│ With Alex:                          │
│ [Quick Chat] [Have Coffee Together]...
└─────────────────────────────────────┘
```

**2. Location Selector View (New - Full Screen Modal):**
```
┌─────────────────────────────────────┐
│ ✕ Select Location              [Close]│
├─────────────────────────────────────┤
│ Current: Corner Coffee Shop         │
│                                     │
│ RESIDENTIAL QUARTER                 │
│ ┌─────────────────────────────┐   │
│ │ 🏠 Home                      │   │
│ │ Your apartment              │   │
│ │ 👤 0 people | ⏱ 5 min       │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ 🌳 Neighborhood Park        │   │
│ │ Green space with duck pond  │   │
│ │ 👤 1 person | ⏱ 5 min       │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ ☕ Corner Coffee Shop       │   │
│ │ You are here                │   │ ← Current location
│ └─────────────────────────────┘   │
│                                     │
│ TOWN CENTER                         │
│ ┌─────────────────────────────┐   │
│ │ 📚 Public Library           │   │
│ │ Quiet study and books       │   │
│ │ 👤 2 people | ⏱ 15 min      │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ 🛍️ Shopping District        │   │
│ │ Main street shops           │   │
│ │ 👤 3 people | ⏱ 15 min      │   │
│ └─────────────────────────────┘   │
│ ... (more locations)                │
└─────────────────────────────────────┘
```

**3. Travel Confirmation (If needed):**
```
┌─────────────────────────────────────┐
│ Travel to Public Library?           │
│                                     │
│ ⏱ Travel time: 15 minutes           │
│ 👤 2 people there                   │
│                                     │
│ You'll arrive at 14:45              │
│                                     │
│ [Confirm] [Cancel]                  │
└─────────────────────────────────────┘
```

### UI Components to Build

1. **Location Indicator Component** (below HUD)
   - Shows current location name with icon
   - Shows brief description
   - Always visible on main view

2. **Travel Action Buttons**
   - "Move to..." - Opens location selector
   - "Go Home" - Quick action with confirmation

3. **Location Selector Modal**
   - Full-screen or large modal
   - Grouped by district
   - Shows each location card with:
     - Name and icon
     - Description (1 sentence)
     - NPC count
     - Travel time
     - Open/closed status
   - Scrollable list

4. **NPC List Filtering**
   - Toggle: "Show all" vs "Only at [current location]"
   - NPCs not at current location show location badge
   - Grayed out or separate section

5. **Activity Filtering by Location**
   - Automatically filter activities based on:
     - Current location
     - Whether location-specific activities are available
     - Whether NPC is present (for social activities)

---

## Implementation Strategy

### Phase 3.1: Foundation (Week 1)
1. **Define Location Data**
   - Create location constants with all 10 locations
   - Define district groupings
   - Write descriptions
   - Set operating hours

2. **Database Schema**
   - Add `current_location` column to `player_characters` table (default: 'home')
   - Add `current_location` column to `npcs` table
   - Migration script

3. **Backend - Location Service**
   - Location data access functions
   - Calculate travel time between locations (district-based logic)
   - Validate location transitions
   - Check if location is open at given time

4. **Backend - API Endpoints**
   - `GET /api/locations` - List all locations with current NPC counts
   - `POST /api/player/travel` - Move to new location (updates time, location)
   - Update `GET /api/player` to include current location
   - Update NPC endpoints to include location filtering

### Phase 3.2: Activity Integration (Week 1-2)
5. **Update Activity Definitions**
   - Assign `location` field to all 21 existing activities
   - Add 9 new activities with location requirements
   - Update activity service to check location constraints

6. **Activity Availability Logic**
   - Extend `canPerformActivity()` to check:
     - Player at correct location (if activity requires location)
     - NPC at same location (if social activity)
     - Location is open (based on operating hours)
   - Update availability reasons for better UX

7. **Update NPC Generation**
   - "Meet Someone New" generates NPC at player's current location
   - Store NPC's location in database
   - Prevent "Meet Someone New" at Home location

### Phase 3.3: Frontend UI (Week 2-3)
8. **Location Indicator Component**
   - Display current location below HUD
   - Show description
   - Responsive design

9. **Location Selector Modal**
   - Build full-screen location picker
   - Group by district
   - Show NPC counts (fetch from API)
   - Calculate and display travel times
   - Handle location selection and travel action

10. **Update Main Game View**
    - Add "Move to..." and "Go Home" action buttons
    - Filter NPC list by location (with toggle)
    - Show NPC locations in neighbor list
    - Update activity filtering based on location

11. **Special Sleep Handling**
    - Sleep action available everywhere
    - Calculate travel home time
    - Add to sleep duration calculation
    - Update sleep result to show "Traveled home and slept X hours"

### Phase 3.4: Testing & Polish (Week 3)
12. **Testing**
    - Test all location transitions
    - Verify activity filtering at each location
    - Test NPC creation at different locations
    - Verify travel time calculations
    - Test location operating hours

13. **Balance & Polish**
    - Adjust travel times if needed
    - Tune new activity costs/effects
    - Add flavor text variations
    - Ensure mobile responsiveness
    - Loading states for location changes

14. **Bug Fixes & Edge Cases**
    - Handle closed locations gracefully
    - Ensure NPCs can't be at closed locations (Phase 3: they stay where they are)
    - Validate all social activities check NPC presence
    - Test "Go Home" from all locations

---

## Success Criteria

Phase 3 is complete when:
- ✅ 10 locations exist with descriptions and districts
- ✅ Players can navigate between all locations with correct travel times
- ✅ All activities are gated to appropriate locations
- ✅ NPCs are created at player's current location and stay there
- ✅ Social activities only work when at same location as NPC
- ✅ "Meet Someone New" works at all locations except Home
- ✅ UI clearly shows current location and NPC positions
- ✅ Sleep works from anywhere with travel home calculation
- ✅ 9+ new activities add location-specific variety
- ✅ Mobile and desktop UI work smoothly
- ✅ No critical bugs in location system

**Priority:** High - Core feature for game world expansion
**Estimated Scope:** 2-3 weeks

---

## Future Enhancements (Post-Phase 3)

Deferred to Phase 4 and beyond:
- **NPC Movement:** NPCs change locations based on time of day
- **NPC Schedules:** Archetype-based location preferences
- **Location Discovery:** Unlock locations through gameplay
- **Background Images:** Visual atmosphere for each location
- **Location Events:** Special occurrences at certain places/times
- **Weather System:** Affects location availability and mood
- **Home Upgrades:** Customize and improve player apartment
- **New Locations:** Expand town with additional venues
- **Fast Travel:** Unlock quick transit between key locations

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
