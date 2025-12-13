/**
 * Shared TypeScript types for CozyLife RPG
 * Used by both frontend (Angular) and backend (Node.js)
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'healthy';
  timestamp: string;
  version: string;
}

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

// ===== CozyLife RPG - Game Data Types =====

/**
 * NPC Appearance for AI image generation and visualization API
 */
export interface NPCAppearance {
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  faceDetails: string[];
  bodyType: string;
  torsoSize: string;
  height: string;
  skinTone: string;
  upperTrace: string;
  lowerTrace: string;
  style?: string;
  bodyDetails: string[];
}

/**
 * Gender type
 */
export type Gender = 'female' | 'male' | 'other';

/**
 * NPC (Non-Player Character)
 */
export interface NPC {
  id: string;
  name: string;
  archetype: string;  // Artist, Athlete, Bookworm, Musician, Scientist
  traits: string[];   // Array of personality traits
  gender: Gender;

  // Appearance (for AI image generation)
  appearance: NPCAppearance;

  // LoRAs for AI model
  loras: string[];

  // Location (Phase 3)
  currentLocation: LocationId;  // Where they were first met and currently are

  createdAt: string;

  // Future Phase 4+:
  // favoriteLocations?: LocationId[];  // Preferred hangout spots based on archetype
  // schedule?: NPCSchedule;             // Time-based location patterns
}

/**
 * Relationship state based on friendship/romance values
 */
export type RelationshipState =
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

/**
 * Emotional state for image generation
 */
export type EmotionalState = 'neutral' | 'happy' | 'sad' | 'flirty' | 'angry';

/**
 * Interaction record in relationship history
 */
export interface Interaction {
  id: string;
  relationshipId: string;
  activityType: string;
  friendshipDelta: number;
  romanceDelta: number;
  emotionalState?: EmotionalState;
  notes?: string;
  createdAt: string;
}

/**
 * Relationship between player and NPC
 */
export interface Relationship {
  id: string;
  playerId: string;
  npcId: string;

  // Multi-dimensional values (-100 to +100)
  friendship: number;
  romance: number;

  // State tracking
  currentState: RelationshipState;
  unlockedStates: string[];

  // Timestamps
  firstMet: string;
  lastInteraction: string;

  // Populated data (not in DB, joined on fetch)
  npc?: NPC;
  interactions?: Interaction[];
}

/**
 * Time slot of day (Phase 2)
 */
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Activity category (Phase 2)
 */
export type ActivityCategory = 'work' | 'social' | 'self_improvement' | 'leisure' | 'self_care' | 'discovery';

/**
 * Activity outcome profile (Phase 2.5.3)
 * Defines how activity outcomes vary by tier
 */
export interface ActivityOutcomeProfile {
  // Main stat benefits (granted except on catastrophic)
  mainStats: StatName[];
  mainStatGain: number;  // Base value before outcome scaling

  // Secondary benefits (granted on best/okay outcomes)
  secondaryStats?: StatName[];  // Pool to randomly select from
  secondaryStatGain?: number;

  // Negative effects (applied on mixed/catastrophic outcomes)
  negativeEffects?: {
    stats?: StatName[];  // Pool of stats that can be penalized
    statPenalty?: number;  // Base penalty per stat
    energyCost?: number;  // Additional energy cost
    moneyCost?: number;  // Additional money cost
    timeCost?: number;  // Additional time cost (minutes)
  };
}

/**
 * Activity that player can perform with an NPC or alone
 */
export interface Activity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;

  // Activity type
  requiresNPC: boolean;       // true = social activity (needs neighbor), false = solo activity

  // Costs (Phase 2)
  timeCost: number;           // Minutes consumed
  energyCost: number;         // Can be negative (cost) or positive (restore)
  moneyCost: number;          // Can be negative (cost) or positive (earn)

  // Time restrictions (Phase 2)
  allowedTimeSlots?: TimeSlot[];  // If undefined, available anytime

  // Location restriction (Phase 3)
  location?: LocationId;  // Specific location required (undefined = available anywhere with NPC for social, or flexible solo)

  // Requirements (Phase 2+)
  minEnergy?: number;              // Minimum energy required
  minRelationship?: string;        // e.g., "friend" (for relationship-gated activities)

  // Effects (from Phase 1)
  effects: {
    friendship?: number;
    romance?: number;
  };

  // Stat system (Phase 2.5)
  difficulty?: number;              // 1-100, determines challenge level
  relevantStats?: StatName[];       // Stats that modify the success roll
  statEffects?: Partial<Record<StatName, number>>;  // Base stat gains before modifiers (deprecated - use outcomeProfile)
  statRequirements?: Partial<Record<StatName, number>>;  // Minimum BASE stat required

  // Outcome system (Phase 2.5.3)
  outcomeProfile?: ActivityOutcomeProfile;  // Defines varied outcomes by tier

  // Tags for filtering (Phase 2.5.4)
  tags?: string[];  // Optional tags for mixed stat calculations (e.g., 'work', 'recovery')
}

/**
 * Request to perform an activity with an NPC
 */
export interface PerformActivityRequest {
  activityId: string;
}

/**
 * Response after performing an activity
 */
export interface PerformActivityResponse {
  success: boolean;
  relationship?: Relationship;
  interaction?: Interaction;
  stateChanged?: boolean;
  previousState?: RelationshipState;
  newState?: RelationshipState;
  emotionalState?: EmotionalState;
  error?: string;
}

/**
 * Image generation request for AI service
 */
export interface ImageGenerationRequest {
  characterId: string;
  emotionalState: EmotionalState;
  location?: string;
  clothing?: string;
  context?: string;
}

/**
 * Image generation response
 */
export interface ImageGenerationResponse {
  imageUrl: string;
  cached: boolean;
  generationTime?: number;
}

/**
 * District type (Phase 3)
 */
export type District = 'residential' | 'downtown' | 'waterfront';

/**
 * Location ID type (Phase 3)
 */
export type LocationId =
  | 'home'
  | 'park'
  | 'coffee_shop'
  | 'library'
  | 'shopping_district'
  | 'gym'
  | 'movie_theater'
  | 'beach'
  | 'boardwalk'
  | 'bar';

/**
 * Location (Phase 3)
 */
export interface Location {
  id: LocationId;
  name: string;
  description: string;
  district: District;

  // Operating hours (optional - undefined means 24/7)
  openTime?: string;    // "06:00"
  closeTime?: string;   // "22:00"

  // Future: Background image
  imageUrl?: string;
}

/**
 * Player Character (Phase 2+3+2.5)
 */
export interface PlayerCharacter {
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

  // Location tracking (Phase 3)
  currentLocation: LocationId; // Where the player currently is

  // Stats (Phase 2.5)
  archetype: PlayerArchetype;
  stats: PlayerStats;
  tracking: StatTracking;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Activity availability check result (Phase 2)
 */
export interface ActivityAvailability {
  activityId: string;
  available: boolean;
  reason?: string;
  endsAfterMidnight?: boolean;
}

/**
 * Sleep result (Phase 2 + Phase 3)
 */
export interface SleepResult {
  wakeTime: string;
  energyRestored: number;
  hoursSlept: number;
  newDay: number;
  traveledHome?: boolean;  // Phase 3: if player traveled home before sleeping
  travelTime?: number;     // Phase 3: travel time in minutes
}

/**
 * Location with NPC count (Phase 3)
 * Used for displaying locations with how many NPCs are there
 */
export interface LocationWithNPCCount extends Location {
  npcCount: number;
}

/**
 * Travel request (Phase 3)
 */
export interface TravelRequest {
  destinationId: LocationId;
}

/**
 * Travel result (Phase 3)
 */
export interface TravelResult {
  newLocation: LocationId;
  travelTime: number;  // Minutes spent traveling
  arrivedAt: string;   // New time after travel
}

// ===== Phase 2.5: Player Stats & Progression =====

/**
 * Stat names (Phase 2.5)
 */
export type StatName =
  // Physical stats
  | 'fitness'
  | 'vitality'
  | 'poise'
  // Mental stats
  | 'knowledge'
  | 'creativity'
  | 'ambition'
  // Social stats
  | 'confidence'
  | 'wit'
  | 'empathy';

/**
 * Stat category (Phase 2.5)
 */
export type StatCategory = 'physical' | 'mental' | 'social';

/**
 * Player archetype for starting stat distribution (Phase 2.5)
 */
export type PlayerArchetype =
  | 'athlete'
  | 'scholar'
  | 'social_butterfly'
  | 'artist'
  | 'professional'
  | 'balanced';

/**
 * Activity outcome tier (Phase 2.5)
 */
export type OutcomeTier = 'catastrophic' | 'mixed' | 'okay' | 'best';

/**
 * Player stats - both base and current values (Phase 2.5)
 */
export interface PlayerStats {
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

/**
 * Stat tracking for defensive stat calculations (Phase 2.5)
 */
export interface StatTracking {
  minEnergyToday: number;       // Lowest energy reached today
  endingEnergyToday: number;    // Energy at end of day (before sleep)
  workStreak: number;           // Consecutive days with work
  restStreak: number;           // Consecutive days without work
  burnoutStreak: number;        // Consecutive days hitting 0 energy
  lateNightStreak: number;      // Consecutive days sleeping after 2am
  workedToday: boolean;         // Did work activity today
  hadCatastrophicFailureToday: boolean;  // Had a catastrophic outcome today
  statsTrainedToday: StatName[]; // Stats that gained experience today (won't decay)
}

/**
 * Stat change record for UI display (Phase 2.5)
 */
export interface StatChange {
  stat: StatName;
  previousBase: number;
  newBase: number;
  previousCurrent: number;
  newCurrent: number;
  baseDelta: number;
  currentDelta: number;
}

/**
 * Activity outcome with all effects (Phase 2.5)
 */
export interface ActivityOutcome {
  tier: OutcomeTier;
  roll: number;                  // Raw roll (1-100)
  adjustedRoll: number;          // After stat bonus and difficulty penalty
  description: string;           // Flavor text for this outcome

  // Effects (deltas from base activity values)
  friendshipDelta?: number;
  romanceDelta?: number;
  energyDelta?: number;          // Additional energy cost/savings
  moneyDelta?: number;           // Additional money cost/savings
  timeDelta?: number;            // Additional time cost/savings (minutes)
  statEffects?: Partial<Record<StatName, number>>;  // Stat changes
}

/**
 * Individual component contributing to a stat change
 */
export interface StatChangeComponent {
  source: string;        // Unique identifier (e.g., "base_growth_gap", "vitality_min_energy")
  category: string;      // Human-readable category (e.g., "Base Growth", "Defensive Stats")
  description: string;   // Human-readable reason
  value: number;         // The contribution to the stat change
  details?: string;      // Additional context (optional)
}

/**
 * Detailed breakdown of stat changes for a single stat
 */
export interface StatChangeBreakdown {
  stat: StatName;
  baseChange: number;      // Total change to base stat
  currentChange: number;   // Total change to current stat
  previousBase: number;
  newBase: number;
  previousCurrent: number;
  newCurrent: number;
  components: StatChangeComponent[];
}

/**
 * Defensive stat changes (Phase 2.5.2)
 */
export interface DefensiveStatChanges {
  vitality: number;
  ambition: number;
  empathy: number;
}

/**
 * Mixed stat changes (Phase 2.5.4)
 */
export interface MixedStatChanges {
  poise: number;
  creativity: number;
  wit: number;
}

/**
 * Sleep result with stat changes (Phase 2.5 extension)
 */
export interface SleepResultWithStats extends SleepResult {
  statChanges: StatChange[];     // All stat changes that occurred (legacy)
  baseGrowth: StatChange[];      // Stats where base increased (legacy)
  currentDecay: StatChange[];    // Stats where current decayed toward base (legacy)
  defensiveStatChanges?: DefensiveStatChanges;  // Defensive stat changes (Phase 2.5.2, legacy)
  mixedStatChanges?: MixedStatChanges;  // Mixed stat changes (Phase 2.5.4)
  statChangeBreakdowns: StatChangeBreakdown[];  // Detailed breakdown for all stats
}

/**
 * Solo activity outcome from roll system (Phase 2.5)
 * Different from NPC ActivityOutcome - includes roll details
 */
export interface SoloActivityOutcome {
  tier: OutcomeTier;        // 'catastrophic' | 'mixed' | 'okay' | 'best'
  roll: number;             // Raw d100 roll
  adjustedRoll: number;     // Roll after stat bonus and difficulty
  statBonus: number;        // Bonus from relevant stats
  difficultyPenalty: number; // Penalty from difficulty
}

/**
 * Solo activity result (Phase 2.5)
 * Returned from POST /api/activities/perform
 */
export interface SoloActivityResult {
  player: PlayerCharacter;
  outcome?: SoloActivityOutcome;
  statChanges?: StatChange[];
  statsTrainedThisActivity?: StatName[];
}

/**
 * Player activity history record (Phase 2.5.1)
 * Stores complete history of player activities for defensive stat calculations
 */
export interface PlayerActivity {
  id: string;
  playerId: string;
  activityId: string;

  // When it happened
  performedAt: string;          // ISO timestamp
  dayNumber: number;
  timeOfDay: string;            // "HH:MM"

  // Activity details (denormalized for historical accuracy)
  activityName: string;
  category: ActivityCategory;
  difficulty?: number;
  relevantStats: StatName[];
  tags?: string[];  // Optional tags for filtering (e.g., 'work', 'recovery')

  // Costs (actual costs paid)
  timeCost: number;
  energyCost: number;
  moneyCost: number;

  // Outcome (if activity had a roll)
  outcomeTier?: OutcomeTier;
  roll?: number;
  adjustedRoll?: number;
  statBonus?: number;
  difficultyPenalty?: number;

  // Effects (actual effects received)
  statEffects?: Partial<Record<StatName, number>>;
  energyDelta?: number;
  moneyDelta?: number;

  // For social activities (if NPC was involved)
  npcId?: string;
  interactionId?: string;

  createdAt: string;
}
