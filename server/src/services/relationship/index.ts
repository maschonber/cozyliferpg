/**
 * Relationship Service
 *
 * Pure functions for relationship state calculations and activity logic.
 * All activity data has been moved to activities.ts for better maintainability.
 *
 * Architecture: Configuration-driven, pure functions, clear separation of concerns
 */

import { RelationshipState, EmotionalState } from '../../../../shared/types';
import { ACTIVITIES } from './activities';
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

/**
 * Apply activity effects to relationship values
 *
 * @param currentTrust - Current trust value
 * @param currentAffection - Current affection value
 * @param currentDesire - Current desire value
 * @param trustDelta - Change in trust
 * @param affectionDelta - Change in affection
 * @param desireDelta - Change in desire
 * @param desireCap - Optional cap on desire (for sexual preference filtering)
 * @returns New trust, affection, and desire values (clamped to -100/+100)
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
  let newDesire = clamp(currentDesire + desireDelta);

  // Apply desire cap if specified (sexual preference)
  if (desireCap !== undefined && newDesire > desireCap) {
    newDesire = desireCap;
  }

  return {
    trust: clamp(currentTrust + trustDelta),
    affection: clamp(currentAffection + affectionDelta),
    desire: newDesire
  };
}

// ===== Emotional State Functions =====

/**
 * Get default emotional state for a relationship state
 *
 * Uses STATE_EMOTION_MAP from config.ts.
 * Legacy system - will be replaced by emotion service in Task 7.
 */
export function getEmotionalStateForRelationship(
  state: RelationshipState
): EmotionalState {
  return STATE_EMOTION_MAP[state];
}

/**
 * Get contextual emotional state after an activity
 *
 * Overrides default emotion based on activity deltas.
 * Uses thresholds from config.ts for consistency.
 *
 * @param trustDelta - Change in trust from activity
 * @param affectionDelta - Change in affection from activity
 * @param desireDelta - Change in desire from activity
 * @param newState - New relationship state after activity
 * @returns Contextual emotional state
 */
export function getContextualEmotionalState(
  trustDelta: number,
  affectionDelta: number,
  desireDelta: number,
  newState: RelationshipState
): EmotionalState {
  const t = CONTEXTUAL_EMOTION_THRESHOLDS;

  // Strong negative effects → angry
  if (
    trustDelta <= t.strongNegative ||
    affectionDelta <= t.strongNegative ||
    desireDelta <= t.strongNegative
  ) {
    return 'angry';
  }

  // Mild negative effects → sad
  if (
    trustDelta < t.anyNegative ||
    affectionDelta < t.anyNegative ||
    desireDelta < t.anyNegative
  ) {
    return 'sad';
  }

  // Positive desire activity → flirty
  if (desireDelta > 0) {
    return 'flirty';
  }

  // Positive affection or trust activity → happy
  if (affectionDelta > 0 || trustDelta > 0) {
    return 'happy';
  }

  // Default: use relationship state emotion
  return getEmotionalStateForRelationship(newState);
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
