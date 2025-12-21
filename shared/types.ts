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

// ===== Trait System (Relationship Redesign) =====

/**
 * Personality traits - affect social interactions and emotion baselines
 */
export type PersonalityTrait =
  // Social energy
  | 'outgoing'
  | 'reserved'
  // Thinking style
  | 'logical'
  | 'creative'
  | 'intuitive'
  // Risk attitude
  | 'adventurous'
  | 'cautious'
  | 'spontaneous'
  // Emotional style
  | 'optimistic'
  | 'melancholic'
  | 'passionate'
  | 'stoic'
  // Interpersonal
  | 'empathetic'
  | 'independent'
  | 'nurturing'
  | 'competitive';

/**
 * Romance traits - affect romantic relationship dynamics
 */
export type RomanceTrait =
  | 'flirtatious'
  | 'romantic'
  | 'physical'
  | 'intellectual'
  | 'slow_burn'
  | 'intense'
  | 'commitment_seeking'
  | 'free_spirit';

/**
 * Interest traits - affect activity bonuses
 */
export type InterestTrait =
  | 'coffee_lover'
  | 'fitness_enthusiast'
  | 'music_fan'
  | 'art_appreciator'
  | 'foodie'
  | 'reader'
  | 'gamer'
  | 'nature_lover';

/**
 * Combined trait type for NPCs
 */
export type NPCTrait = PersonalityTrait | RomanceTrait | InterestTrait;

// ===== Emotion System (Relationship Redesign) =====

/**
 * Core emotion types tracked numerically
 */
export type EmotionType =
  | 'joy'
  | 'affection'
  | 'excitement'
  | 'calm'
  | 'sadness'
  | 'anger'
  | 'anxiety'
  | 'romantic';

/**
 * Emotion intensity tier based on value
 */
export type EmotionIntensity = 'mild' | 'moderate' | 'strong' | 'intense';

/**
 * Emotion values for an NPC (0-100 each)
 */
export interface EmotionValues {
  joy: number;
  affection: number;
  excitement: number;
  calm: number;
  sadness: number;
  anger: number;
  anxiety: number;
  romantic: number;
}

/**
 * Full emotion state with metadata
 */
export interface NPCEmotionState extends EmotionValues {
  lastUpdated: string;
}

/**
 * Display-ready emotion with intensity
 */
export interface EmotionDisplay {
  emotion: EmotionType;
  intensity: EmotionIntensity;
  value: number;
  label: string;  // e.g., "joyful", "content", "ecstatic"
}

/**
 * NPC Archetype
 */
export type NPCArchetype = 'Artist' | 'Athlete' | 'Bookworm' | 'Musician' | 'Scientist';

/**
 * NPC (Non-Player Character)
 */
export interface NPC {
  id: string;
  name: string;
  archetype: NPCArchetype;
  gender: Gender;

  // Trait system (Relationship Redesign)
  traits: NPCTrait[];           // All traits (hidden from player initially)
  revealedTraits: NPCTrait[];   // Traits discovered by player through gameplay

  // Emotion system (Relationship Redesign)
  emotionState: NPCEmotionState;
  dominantEmotion?: EmotionDisplay;  // Current dominant emotion for display

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
 * Emotional state for image generation (legacy - use EmotionDisplay for new code)
 * @deprecated Use EmotionDisplay from emotion system instead
 */
export type EmotionalState = 'neutral' | 'happy' | 'sad' | 'flirty' | 'angry';

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

  // Emotion at time of interaction
  emotionalState?: EmotionalState;  // Legacy field for compatibility
  emotionSnapshot?: EmotionValues;  // Full emotion state at interaction time

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

  // Relationship effects (Relationship Redesign)
  effects: {
    trust?: number;
    affection?: number;
    desire?: number;
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

  // Trait discovery (Relationship Redesign)
  discoveredTrait?: {
    trait: NPCTrait;
    traitName: string;        // Display name of the trait
    traitDescription: string; // Description of the trait
    isNew: boolean;
    category: 'personality' | 'romance' | 'interest';
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
 * Archetype contribution breakdown
 */
export interface ArchetypeContribution {
  playerArchetype: PlayerArchetype;
  npcArchetype: NPCArchetype;
  activityCategory?: ActivityCategory;
  matchBonus: number;           // Bonus from player-NPC archetype compatibility
  activityAffinityBonus: number; // Bonus from NPC archetype's activity preference
  totalBonus: number;            // matchBonus + activityAffinityBonus
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
  emotionModifier?: number;      // -20 to +30 (emotion-based adjustment)
  relationshipModifier?: number; // -15 to +30 (relationship state adjustment)
  traitBonus?: number;           // -20 to +20 (combined trait + archetype)
  streakModifier?: number;       // -10 to +10 (performance streak)

  // Trait bonus breakdown (social only)
  traitBreakdown?: {
    npcTraitBonus: number;       // Bonus from NPC's specific traits
    archetypeBonus: number;      // Bonus from archetype compatibility

    // Detailed individual contributions
    individualTraits?: TraitContribution[];  // Each NPC trait's contribution
    archetypeDetails?: ArchetypeContribution; // Separated archetype bonuses
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
  emotionalState?: EmotionalState;

  // Trait discovery (social activities only)
  discoveredTrait?: {
    trait: NPCTrait;
    traitName: string;
    traitDescription: string;
    isNew: boolean;
    category: 'personality' | 'romance' | 'interest';
  };

  // Difficulty breakdown (both activity types now have this)
  difficultyBreakdown?: DifficultyBreakdown;

  // Updated player state
  player: PlayerCharacter;
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
