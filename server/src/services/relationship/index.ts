/**
 * Relationship Service
 *
 * Pure functions for relationship state calculations and activity logic.
 * All activity data has been moved to activities.ts for better maintainability.
 *
 * Architecture: Configuration-driven, pure functions, clear separation of concerns
 *
 * Task 3: Relationship Axis System
 * - Three-axis relationship model (Trust, Affection, Desire)
 * - State derivation from axes
 * - Difficulty modifiers based on relationship level
 * - Repair difficulty scaling for negative relationships
 * - Preference-based desire capping
 */

import {
  RelationshipState,
  EmotionalState,
  RelationshipAxes,
  SexualPreference,
  Gender
} from '../../../../shared/types';
import { ACTIVITIES } from '../../activities';
import {
  RELATIONSHIP_THRESHOLDS,
  STATE_EMOTION_MAP,
  CONTEXTUAL_EMOTION_THRESHOLDS,
  STATE_DESCRIPTIONS
} from './config';

// ===== Exports =====

// Re-export activities for backward compatibility
export { ACTIVITIES };

// ===== Utility Functions =====

/**
 * Clamp a value to the range [-100, 100]
 */
function clamp(value: number): number {
  return Math.max(-100, Math.min(100, value));
}

// ===== State Calculation =====

/**
 * Determine relationship state based on Trust/Affection/Desire values
 *
 * Uses thresholds from config.ts for easy tuning.
 * Priority order: positive combined > negative > mixed > neutral
 *
 * @param trust - Trust value (-100 to 100)
 * @param affection - Affection value (-100 to 100)
 * @param desire - Desire value (-100 to 100)
 * @returns Calculated relationship state
 */
export function calculateRelationshipState(
  trust: number,
  affection: number,
  desire: number
): RelationshipState {
  const t = RELATIONSHIP_THRESHOLDS;

  // === Positive combined states (highest priority) ===

  // Partner: high trust + affection + desire
  if (
    trust >= t.partner.trust &&
    affection >= t.partner.affection &&
    desire >= t.partner.desire
  ) {
    return 'partner';
  }

  // Lover: high desire + affection but lower trust
  if (
    desire >= t.lover.desire &&
    affection >= t.lover.affection &&
    trust < t.lover.trust
  ) {
    return 'lover';
  }

  // Close friend: high affection + trust, low desire
  if (
    affection >= t.close_friend.affection &&
    trust >= t.close_friend.trust &&
    desire < t.close_friend.desire
  ) {
    return 'close_friend';
  }

  // Friend: moderate affection and trust
  if (affection >= t.friend.affection && trust >= t.friend.trust) {
    return 'friend';
  }

  // Crush: high desire but low affection
  if (desire >= t.crush.desire && affection < t.crush.affection) {
    return 'crush';
  }

  // === Negative states ===

  // Enemy: strongly negative trust AND affection
  if (trust < t.enemy.trust && affection < t.enemy.affection) {
    return 'enemy';
  }

  // Rival: negative trust OR affection
  if (trust < t.rival.trust || affection < t.rival.affection) {
    return 'rival';
  }

  // === Mixed states ===

  // Complicated: mix of positive and negative across axes
  const hasPositive =
    trust > t.complicated.positiveThreshold ||
    affection > t.complicated.positiveThreshold ||
    desire > t.complicated.positiveThreshold;

  const hasNegative =
    trust < t.complicated.negativeThreshold ||
    affection < t.complicated.negativeThreshold ||
    desire < t.complicated.negativeThreshold;

  if (hasPositive && hasNegative) {
    return 'complicated';
  }

  // === Neutral/early states ===

  // Acquaintance: any axis slightly positive, none negative
  if (
    (trust >= t.acquaintance.positive ||
      affection >= t.acquaintance.positive ||
      desire >= t.acquaintance.positive) &&
    trust > t.acquaintance.negative &&
    affection > t.acquaintance.negative &&
    desire > t.acquaintance.negative
  ) {
    return 'acquaintance';
  }

  // Default: stranger
  return 'stranger';
}

// ===== Relationship Axis Modification =====

/**
 * Apply relationship deltas to current axes
 *
 * Task 3 Requirement 1: Axis modification
 * - Apply Trust, Affection, Desire changes
 * - Respect desireCap for preference-limited relationships
 * - Clamp to -100/+100
 *
 * @param current - Current relationship axes
 * @param deltas - Changes to apply (partial - only specify changed axes)
 * @param desireCap - Optional cap on desire value (for sexual preference filtering)
 * @returns New relationship axes with deltas applied and clamped
 *
 * @example
 * const newAxes = applyRelationshipDelta(
 *   { trust: 30, affection: 40, desire: 20 },
 *   { affection: 15, desire: 10 },
 *   25  // Desire capped at 25 due to sexual preference
 * );
 * // Result: { trust: 30, affection: 55, desire: 25 }
 */
export function applyRelationshipDelta(
  current: RelationshipAxes,
  deltas: Partial<RelationshipAxes>,
  desireCap?: number
): RelationshipAxes {
  // Ensure current values are never null/undefined (defensive programming)
  const currentTrust = current.trust ?? 0;
  const currentAffection = current.affection ?? 0;
  const currentDesire = current.desire ?? 0;

  // Apply deltas to each axis
  const newTrust = clamp(currentTrust + (deltas.trust ?? 0));
  const newAffection = clamp(currentAffection + (deltas.affection ?? 0));
  let newDesire = clamp(currentDesire + (deltas.desire ?? 0));

  // Apply desire cap if specified (sexual preference)
  if (desireCap !== undefined && newDesire > desireCap) {
    newDesire = desireCap;
  }

  return {
    trust: newTrust,
    affection: newAffection,
    desire: newDesire
  };
}

/**
 * Apply activity effects to relationship values
 *
 * DEPRECATED: Use applyRelationshipDelta instead.
 * Kept for backward compatibility with existing code.
 *
 * @param currentTrust - Current trust value
 * @param currentAffection - Current affection value
 * @param currentDesire - Current desire value
 * @param trustDelta - Change in trust
 * @param affectionDelta - Change in affection
 * @param desireDelta - Change in desire
 * @param desireCap - Optional cap on desire (for sexual preference filtering)
 * @returns New trust, affection, and desire values (clamped to -100/+100)
 * @deprecated Use applyRelationshipDelta with RelationshipAxes instead
 */
export function applyActivityEffects(
  currentTrust: number,
  currentAffection: number,
  currentDesire: number,
  trustDelta: number,
  affectionDelta: number,
  desireDelta: number,
  desireCap?: number
): { trust: number; affection: number; desire: number } {
  return applyRelationshipDelta(
    { trust: currentTrust, affection: currentAffection, desire: currentDesire },
    { trust: trustDelta, affection: affectionDelta, desire: desireDelta },
    desireCap
  );
}

// ===== Difficulty and Repair Calculations =====

/**
 * Get difficulty modifier based on relationship state
 *
 * Task 3 Requirement 3: Difficulty modifier
 * - Positive relationships make interactions easier (negative modifier)
 * - Negative relationships make interactions harder (positive modifier)
 * - Stranger/neutral relationships have no modifier
 *
 * @param axes - Current relationship axes
 * @param state - Current relationship state
 * @returns Difficulty modifier (-15 to +30)
 *
 * @example
 * getRelationshipDifficultyModifier({ trust: 70, affection: 80, desire: 60 }, 'partner')
 * // → -15 (much easier with a partner)
 *
 * getRelationshipDifficultyModifier({ trust: -60, affection: -60, desire: 0 }, 'enemy')
 * // → +30 (much harder with an enemy)
 */
export function getRelationshipDifficultyModifier(
  axes: RelationshipAxes,
  state: RelationshipState
): number {
  // State-based modifiers (highest priority states first)
  switch (state) {
    // Positive combined states (easier interactions)
    case 'partner':
      return -15; // Deeply committed, very easy
    case 'lover':
      return -12; // Passionate connection, easier
    case 'close_friend':
      return -12; // Deep trust and affection, easier
    case 'friend':
      return -8; // Good friends, moderately easier
    case 'crush':
      return -5; // Attraction helps a bit

    // Negative states (harder interactions)
    case 'enemy':
      return 30; // Actively hostile, very hard
    case 'rival':
      return 15; // Tension and animosity, harder

    // Mixed/complex states
    case 'complicated':
      return 10; // Mixed feelings make things harder

    // Neutral/early states
    case 'acquaintance':
      return -3; // Slightly positive, slightly easier
    case 'stranger':
      return 0; // Neutral, no modifier

    default:
      return 0;
  }
}

/**
 * Calculate repair difficulty for negative relationship values
 *
 * Task 3 Requirement 4: Repair difficulty scaling
 * - Logarithmic scaling: repairing from -80 is proportionally harder than from -40
 * - Used when attempting to repair damaged relationships
 *
 * @param currentValue - Current axis value (should be negative)
 * @param baseDifficulty - Base difficulty of the repair activity (default: 50)
 * @returns Scaled difficulty value
 *
 * @example
 * getRepairDifficulty(-40, 50) // → 90 (50 * (1 + 40/50))
 * getRepairDifficulty(-80, 50) // → 130 (50 * (1 + 80/50))
 * getRepairDifficulty(20, 50)  // → 50 (no scaling for positive values)
 */
export function getRepairDifficulty(
  currentValue: number,
  baseDifficulty: number = 50
): number {
  // Only scale for negative values
  if (currentValue >= 0) {
    return baseDifficulty;
  }

  // Formula: baseDifficulty * (1 + Math.abs(currentValue) / 50)
  // This creates logarithmic scaling where deeper negatives are proportionally harder
  const scalingFactor = 1 + Math.abs(currentValue) / 50;
  return Math.round(baseDifficulty * scalingFactor);
}

/**
 * Calculate desire cap based on player sexual preference and NPC gender
 *
 * Task 3 Requirement 5: Preference-based capping
 * - Matching preference: no cap (100)
 * - Non-matching: cap at 25
 * - Future: family relationships cap at 0
 *
 * @param playerPreference - Player's sexual preference
 * @param npcGender - NPC's gender
 * @returns Maximum allowed desire value (0-100)
 *
 * @example
 * calculateDesireCap('women', 'female')  // → 100 (matching)
 * calculateDesireCap('women', 'male')    // → 25 (non-matching)
 * calculateDesireCap('everyone', 'male') // → 100 (everyone matches)
 * calculateDesireCap('no_one', 'female') // → 0 (aromantic/asexual)
 */
export function calculateDesireCap(
  playerPreference: SexualPreference,
  npcGender: Gender
): number {
  // No romantic/sexual interest
  if (playerPreference === 'no_one') {
    return 0;
  }

  // Interested in everyone
  if (playerPreference === 'everyone') {
    return 100;
  }

  // Check gender matching
  const matches =
    (playerPreference === 'women' && npcGender === 'female') ||
    (playerPreference === 'men' && npcGender === 'male');

  return matches ? 100 : 25;
}

// ===== State Management Functions =====

/**
 * Update unlocked states list
 *
 * Adds new state if not already unlocked.
 *
 * @param currentUnlocked - Currently unlocked states
 * @param newState - New state to potentially unlock
 * @returns Updated unlocked states array
 */
export function updateUnlockedStates(
  currentUnlocked: string[],
  newState: RelationshipState
): string[] {
  if (currentUnlocked.includes(newState)) {
    return currentUnlocked;
  }

  return [...currentUnlocked, newState];
}

// ===== Activity Query Functions =====

/**
 * Get all available activities
 *
 * Currently returns all activities.
 * FUTURE (Task 6): Filter based on relationship requirements.
 */
export function getAvailableActivities(): typeof ACTIVITIES {
  return ACTIVITIES;
}

/**
 * Find activity by ID
 *
 * @param activityId - Activity identifier
 * @returns Activity object or undefined if not found
 */
export function getActivityById(
  activityId: string
): typeof ACTIVITIES[0] | undefined {
  return ACTIVITIES.find((a) => a.id === activityId);
}

// Note: These functions are kept here for backward compatibility.
// The activities module also exports these same functions.

// ===== Display Functions =====

/**
 * Get human-readable description of relationship state
 *
 * @param state - Relationship state
 * @returns Description string for UI display
 */
export function getStateDescription(state: RelationshipState): string {
  return STATE_DESCRIPTIONS[state];
}

/**
 * Get display name for relationship state (Title Case)
 *
 * Converts snake_case to Title Case for UI.
 *
 * @param state - Relationship state
 * @returns Display name (e.g., "Close Friend")
 */
export function getStateDisplayName(state: RelationshipState): string {
  return state
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
