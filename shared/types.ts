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
 * Sexual preference for relationship filtering
 */
export type SexualPreference = 'women' | 'men' | 'everyone' | 'no_one';

// ===== Trait System =====

/**
 * NPC traits - simple quirks that affect activity affinities
 * Each trait maps to activity tags with bonuses/penalties
 */
export type NPCTrait =
  // Interest-based traits
  | 'coffee_lover'      // Loves coffee-related activities
  | 'athletic'          // Enjoys physical activities
  | 'bookworm'          // Prefers intellectual, calm activities
  | 'foodie'            // Appreciates food and romantic dining
  | 'gamer'             // Enjoys gaming and competition
  | 'nature_lover'      // Loves outdoor activities
  | 'creative_soul'     // Drawn to creative pursuits
  // Personality-based traits
  | 'competitive'       // Thrives in competitive situations
  | 'romantic'          // Enjoys romantic activities
  | 'intellectual'      // Prefers intellectual engagement
  | 'adventurous'       // Likes outdoor/physical, dislikes calm
  | 'introverted';      // Prefers calm, dislikes competition

// ===== Plutchik Emotion System =====

/**
 * The 8 base emotions from Plutchik's wheel
 */
export type BaseEmotion =
  | 'joy' | 'sadness'
  | 'acceptance' | 'disgust'
  | 'anger' | 'fear'
  | 'anticipation' | 'surprise';

/**
 * Four-dimensional emotion vector
 * Each axis represents two opposing emotions
 * Values range from -1 to +1
 */
export interface EmotionVector {
  joySadness: number;           // -1 (sadness) to +1 (joy)
  acceptanceDisgust: number;    // -1 (disgust) to +1 (acceptance)
  angerFear: number;            // -1 (fear) to +1 (anger)
  anticipationSurprise: number; // -1 (surprise) to +1 (anticipation)
}

/**
 * Neutral emotion vector (all axes at 0)
 */
export const NEUTRAL_EMOTION_VECTOR: EmotionVector = {
  joySadness: 0,
  acceptanceDisgust: 0,
  angerFear: 0,
  anticipationSurprise: 0,
};

/**
 * Intensity levels for interpreted emotions (Plutchik's three levels)
 */
export type InterpretedIntensity = 'low' | 'medium' | 'high';

/**
 * Special emotion states
 */
export type SpecialEmotion = 'neutral' | 'mixed';

/**
 * Emotion dyad names (combinations of two primary emotions)
 */
export type EmotionDyad =
  | 'love' | 'guilt' | 'delight' | 'pride'
  | 'submission' | 'curiosity' | 'sentimentality'
  | 'despair' | 'shame' | 'awe'
  | 'disappointment' | 'unbelief'
  | 'envy' | 'pessimism'
  | 'remorse' | 'contempt' | 'cynicism' | 'morbidness'
  | 'dominance' | 'aggression' | 'outrage'
  | 'optimism' | 'anxiety' | 'fatalism';

/**
 * All possible interpreted emotion names
 */
export type InterpretedEmotion =
  | BaseEmotion
  | EmotionDyad
  | SpecialEmotion;

/**
 * Slim result of interpreting an emotion vector
 * Descriptive data (noun, adjective, color) should be looked up from config
 */
export interface EmotionInterpretationResult {
  /** The interpreted emotion name - use this as key to look up descriptors from config */
  emotion: InterpretedEmotion;

  /** Intensity level (only for single emotions and dyads, not for special emotions) */
  intensity?: InterpretedIntensity;

  /** The base emotions contributing to this interpretation (1 for main emotions, 2 for dyads) */
  contributingEmotions?: BaseEmotion[];
}

/**
 * NPC (Non-Player Character)
 */
export interface NPC {
  id: string;
  name: string;
  gender: Gender;

  // Trait system (Relationship Redesign)
  traits: NPCTrait[];           // All traits (hidden from player initially)
  revealedTraits: NPCTrait[];   // Traits discovered by player through gameplay

  // Plutchik Emotion System
  emotionVector: EmotionVector;
  emotionInterpretation?: EmotionInterpretationResult;  // Current emotion for display

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
 * Relationship state derived from Trust/Affection/Desire axes
 */
export type RelationshipState =
  // Positive combined states (requires multiple high axes)
  | 'partner'           // Trust >= 60, Affection >= 60, Desire >= 50
  | 'lover'             // Desire >= 60, Affection >= 40, Trust < 60
  | 'close_friend'      // Affection >= 60, Trust >= 40, Desire < 30
  | 'friend'            // Affection >= 30, Trust >= 20
  | 'crush'             // Desire >= 40, Affection < 30
  | 'acquaintance'      // Any axis >= 10, none strongly negative
  | 'stranger'          // All axes near 0 (-10 to 10)
  // Mixed/complex states
  | 'complicated'       // Mixed positive/negative across axes
  // Negative states
  | 'rival'             // Trust < -30 OR Affection < -30
  | 'enemy';            // Trust < -50 AND Affection < -50

/**
 * Interaction record in relationship history
 */
export interface Interaction {
  id: string;
  relationshipId: string;
  activityType: string;

  // Axis deltas (Relationship Redesign)
  trustDelta: number;
  affectionDelta: number;
  desireDelta: number;

  notes?: string;
  createdAt: string;
}

/**
 * Relationship axes structure
 */
export interface RelationshipAxes {
  trust: number;      // -100 to +100: Reliability, safety, dependability
  affection: number;  // -100 to +100: Warmth, fondness, emotional bond
  desire: number;     // -100 to +100: Romantic/physical attraction, chemistry
}

/**
 * Relationship between player and NPC
 */
export interface Relationship {
  id: string;
  playerId: string;
  npcId: string;

  // Three-axis relationship values (-100 to +100 each)
  trust: number;
  affection: number;
  desire: number;

  // Desire cap based on player sexual preference (undefined = no cap)
  desireCap?: number;

  // State tracking
  currentState: RelationshipState;
  unlockedStates: RelationshipState[];

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

  // Main money reward (for work activities - scales like main stats)
  mainMoneyGain?: number;  // Base money value before outcome scaling

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
 * Activity types - Re-exported from activity.types.ts
 * See shared/types/activity.types.ts for the full discriminated union definition
 */
import type {
  Activity as ActivityType,
  WorkActivity,
  SocialActivity,
  TrainingActivity,
  LeisureActivity,
  RecoveryActivity,
  DiscoveryActivity
} from './types/activity.types';

export type Activity = ActivityType;
export type {
  WorkActivity,
  SocialActivity,
  TrainingActivity,
  LeisureActivity,
  RecoveryActivity,
  DiscoveryActivity
};

export {
  isWorkActivity,
  isSocialActivity,
  isTrainingActivity,
  isLeisureActivity,
  isRecoveryActivity,
  isDiscoveryActivity,
  requiresNPC
} from './types/activity.types';

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
  emotionalState?: InterpretedEmotion;
  // Trait discovery
  discoveredTrait?: {
    trait: NPCTrait;
    traitName: string;        // Display name of the trait
    traitDescription: string; // Description of the trait
    isNew: boolean;
  };

  // Outcome information
  outcome?: {
    tier: 'best' | 'okay' | 'mixed' | 'catastrophic';
    description: string;
    // Roll details (added for consistency with solo activities)
    roll?: number;              // The 2d100 roll (2-200)
    adjustedRoll?: number;      // roll + statBonus
    statBonus?: number;         // Average of relevant stats
    dc?: number;                // The difficulty class
    isCritSuccess?: boolean;    // Whether roll was in crit success range
    isCritFail?: boolean;       // Whether roll was in crit fail range
    statsUsed?: StatContribution[];  // Detailed breakdown of stats
  };

  // Difficulty breakdown for feedback (replaces old difficultyInfo)
  difficultyBreakdown?: DifficultyBreakdown;

  error?: string;
}

/**
 * Image generation request for AI service
 */
export interface ImageGenerationRequest {
  characterId: string;
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

  // Relationship preferences (Relationship Redesign)
  sexualPreference: SexualPreference;  // Affects desire cap for NPCs

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
  | 'balanced'
  | 'debug_advanced'
  | 'debug_master';

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

  // Relationship effects (deltas from base activity values)
  trustDelta?: number;
  affectionDelta?: number;
  desireDelta?: number;

  // Resource effects
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
 * Stat contribution to roll bonus (detailed breakdown)
 */
export interface StatContribution {
  statName: StatName;
  displayName: string;
  currentValue: number;
}

/**
 * Individual trait contribution to difficulty
 */
export interface TraitContribution {
  trait: NPCTrait;
  traitName: string;
  bonus: number;
}

/**
 * Difficulty calculation breakdown
 * Applicable to both solo and social activities
 */
export interface DifficultyBreakdown {
  // Base difficulty
  baseDifficulty: number;

  // Solo activity modifiers
  activityModifier?: number;  // Activity's difficulty value (0-100)

  // Social activity modifiers
  relationshipModifier?: number; // -15 to +30 (relationship state adjustment)
  traitBonus?: number;           // -20 to +20 (from NPC traits)

  // Trait bonus breakdown (social only)
  traitBreakdown?: {
    npcTraitBonus: number;       // Bonus from NPC's specific traits

    // Detailed individual contributions
    individualTraits?: TraitContribution[];  // Each NPC trait's contribution
  };

  // Final calculated difficulty
  finalDifficulty: number;
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
  statsUsed?: StatContribution[];  // Detailed breakdown of stats used
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
  // Actual resource costs paid (including outcome effects)
  actualEnergyCost?: number;
  actualMoneyCost?: number;
  actualTimeCost?: number;
  // Difficulty calculation breakdown
  difficultyBreakdown?: DifficultyBreakdown;
}

/**
 * Unified activity summary for displaying results in the frontend
 * Used by ActivityResultModal to show both solo and social activity outcomes
 */
export interface ActivitySummary {
  // Activity context
  activity: Activity;
  activityType: 'solo' | 'social';

  // NPC context (for social activities)
  npc?: NPC;

  // Outcome (both types may have this)
  outcome?: {
    tier: 'best' | 'okay' | 'mixed' | 'catastrophic';
    description: string;
  };

  // Roll details (solo activities have more detail)
  rollDetails?: {
    roll: number;
    adjustedRoll: number;
    statBonus?: number;
    difficultyPenalty?: number;
    difficultyClass: number;
    statsUsed?: StatContribution[];  // Detailed stat breakdown
  };

  // Resource costs (both types can have these)
  actualEnergyCost?: number;
  actualMoneyCost?: number;
  actualTimeCost?: number;

  // Stat changes (both types may have these - optional)
  statChanges?: StatChange[];
  statsTrainedThisActivity?: StatName[];

  // Relationship changes (social activities only)
  relationshipChanges?: {
    previousValues: { trust: number; affection: number; desire: number };
    newValues: { trust: number; affection: number; desire: number };
    deltas: { trust: number; affection: number; desire: number };
    stateChanged?: boolean;
    previousState?: RelationshipState;
    newState?: RelationshipState;
  };

  // Emotional state (social activities only)
  emotionalState?: InterpretedEmotion;

  // Trait discovery (social activities only)
  discoveredTrait?: {
    trait: NPCTrait;
    traitName: string;
    traitDescription: string;
    isNew: boolean;
  };

  // Difficulty breakdown (both activity types now have this)
  difficultyBreakdown?: DifficultyBreakdown;

  // Updated player state
  player: PlayerCharacter;
}

/**
 * Activity type discriminator values from code-defined activity definitions
 */
export type ActivityTypeValue = 'work' | 'social' | 'training' | 'leisure' | 'recovery' | 'discovery';

/**
 * Player activity history record
 * Stores history of player activities
 */
export interface PlayerActivity {
  id: string;
  playerId: string;
  activityId: string;

  // When it happened
  performedAt: string;          // ISO timestamp
  dayNumber: number;
  timeOfDay: string;            // "HH:MM"

  // Activity type from code definition
  type: ActivityTypeValue;

  // Outcome (if activity had a roll)
  outcomeTier?: OutcomeTier;
  roll?: number;
  adjustedRoll?: number;
  statBonus?: number;
  difficultyPenalty?: number;

  // Effects (actual effects received)
  statEffects?: Partial<Record<StatName, number>>;
  relationshipEffects?: {
    trust?: number;
    affection?: number;
    desire?: number;
  };
  energyDelta?: number;
  moneyDelta?: number;

  // For social activities (if NPC was involved)
  npcId?: string;

  createdAt: string;
}
