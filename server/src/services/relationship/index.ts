/**
 * Relationship Service
 * Manages relationship state calculations, activity effects, and emotional state mapping
 *
 * ARCHITECTURE NOTE: This service encapsulates all relationship logic
 * to make it easy to expand with additional dimensions and complex rules.
 */

import { RelationshipState, EmotionalState } from '../../../../shared/types';

// ===== Constants =====

/**
 * Phase 1 Activities (Debug/Testing)
 */
export const ACTIVITIES = [
  {
    id: 'friendly_chat',
    name: 'Have a friendly chat',
    description: 'A casual, friendly conversation',
    effects: { friendship: 10, romance: 0 }
  },
  {
    id: 'flirt',
    name: 'Flirt a little',
    description: 'Show romantic interest',
    effects: { friendship: 0, romance: 10 }
  },
  {
    id: 'be_rude',
    name: 'Say something rude',
    description: 'Be mean or dismissive',
    effects: { friendship: -10, romance: 0 }
  },
  {
    id: 'act_dismissive',
    name: 'Act dismissive',
    description: 'Show romantic disinterest',
    effects: { friendship: 0, romance: -10 }
  }
];

/**
 * Map relationship states to default emotional states
 */
const STATE_EMOTION_MAP: Record<RelationshipState, EmotionalState> = {
  // Combined states
  'close_romantic_partner': 'happy',
  'romantic_partner': 'flirty',
  'bitter_ex': 'sad',
  'complicated': 'sad',
  'rival': 'angry',
  'unrequited': 'sad',

  // Friendship-based
  'enemy': 'angry',
  'dislike': 'neutral',
  'stranger': 'neutral',
  'acquaintance': 'neutral',
  'friend': 'happy',
  'close_friend': 'happy',

  // Romance-based
  'repulsed': 'angry',
  'uncomfortable': 'neutral',
  'attracted': 'flirty',
  'romantic_interest': 'flirty',
  'in_love': 'happy'
};

// ===== Utility Functions =====

/**
 * Clamp a value to the range [-100, 100]
 */
function clamp(value: number): number {
  return Math.max(-100, Math.min(100, value));
}

// ===== State Calculation =====

/**
 * Determine relationship state based on friendship and romance values
 *
 * Priority:
 * 1. Combined states (both dimensions matter)
 * 2. Romance states (if romance has stronger magnitude)
 * 3. Friendship states (default)
 */
export function calculateRelationshipState(
  friendship: number,
  romance: number
): RelationshipState {
  // Combined states (highest priority)
  if (friendship >= 80 && romance >= 80) return 'close_romantic_partner';
  if (friendship >= 50 && romance >= 60) return 'romantic_partner';
  if (friendship <= -30 && romance <= -50) return 'bitter_ex';
  if (friendship >= 50 && romance <= -30) return 'complicated';
  if (friendship <= -50 && romance >= -19) return 'rival';
  if (friendship <= 30 && romance >= 60) return 'unrequited';

  // Single dimension states
  // Use romance if it has stronger magnitude
  if (Math.abs(romance) > Math.abs(friendship)) {
    if (romance >= 80) return 'in_love';
    if (romance >= 50) return 'romantic_interest';
    if (romance >= 20) return 'attracted';
    if (romance <= -50) return 'repulsed';
    if (romance <= -20) return 'uncomfortable';
  }

  // Default to friendship dimension
  if (friendship >= 80) return 'close_friend';
  if (friendship >= 50) return 'friend';
  if (friendship >= 20) return 'acquaintance';
  if (friendship <= -50) return 'enemy';
  if (friendship <= -20) return 'dislike';

  // Complete neutral
  return 'stranger';
}

/**
 * Apply activity effects to relationship values
 *
 * @returns New friendship and romance values (clamped to -100/+100)
 */
export function applyActivityEffects(
  currentFriendship: number,
  currentRomance: number,
  friendshipDelta: number,
  romanceDelta: number
): { friendship: number; romance: number } {
  return {
    friendship: clamp(currentFriendship + friendshipDelta),
    romance: clamp(currentRomance + romanceDelta)
  };
}

/**
 * Get default emotional state for a relationship state
 */
export function getEmotionalStateForRelationship(state: RelationshipState): EmotionalState {
  return STATE_EMOTION_MAP[state];
}

/**
 * Get contextual emotional state after an activity
 *
 * Overrides default emotion based on activity type:
 * - Positive friendship activity → happy
 * - Positive romance activity → flirty
 * - Negative friendship activity → sad or angry (based on severity)
 * - Negative romance activity → sad
 */
export function getContextualEmotionalState(
  friendshipDelta: number,
  romanceDelta: number,
  newState: RelationshipState
): EmotionalState {
  // Strong negative effects → angry
  if (friendshipDelta <= -15 || romanceDelta <= -15) {
    return 'angry';
  }

  // Mild negative effects → sad
  if (friendshipDelta < 0 || romanceDelta < 0) {
    return 'sad';
  }

  // Positive romance activity → flirty
  if (romanceDelta > 0) {
    return 'flirty';
  }

  // Positive friendship activity → happy
  if (friendshipDelta > 0) {
    return 'happy';
  }

  // Default: use relationship state emotion
  return getEmotionalStateForRelationship(newState);
}

/**
 * Update unlocked states list
 *
 * Adds new state if not already unlocked
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

/**
 * Get all activities available at current relationship state
 *
 * FUTURE: Filter based on requirements (min friendship, min romance, etc.)
 */
export function getAvailableActivities(): typeof ACTIVITIES {
  // Phase 1: All activities always available (debug mode)
  return ACTIVITIES;
}

/**
 * Find activity by ID
 */
export function getActivityById(activityId: string): typeof ACTIVITIES[0] | undefined {
  return ACTIVITIES.find((a) => a.id === activityId);
}

// ===== Relationship State Info =====

/**
 * Get human-readable description of relationship state
 */
export function getStateDescription(state: RelationshipState): string {
  const descriptions: Record<RelationshipState, string> = {
    // Combined
    'close_romantic_partner': 'Deeply in love and best friends',
    'romantic_partner': 'In a romantic relationship',
    'bitter_ex': 'Former romantic partner, now hostile',
    'complicated': 'Good friends but romantic tension',
    'rival': 'Strong animosity and competition',
    'unrequited': 'One-sided romantic feelings',

    // Friendship
    'enemy': 'Strong dislike, actively hostile',
    'dislike': 'Mild negative feelings',
    'stranger': 'Just met, neutral feelings',
    'acquaintance': 'Friendly but not close',
    'friend': 'Good relationship, enjoys spending time',
    'close_friend': 'Best friends, deep trust',

    // Romance
    'repulsed': 'Strong romantic aversion',
    'uncomfortable': 'Mild romantic discomfort',
    'attracted': 'Starting to develop feelings',
    'romantic_interest': 'Clear romantic feelings',
    'in_love': 'Strong romantic attachment'
  };

  return descriptions[state];
}

/**
 * Get display name for relationship state (for UI)
 */
export function getStateDisplayName(state: RelationshipState): string {
  // Convert snake_case to Title Case
  return state
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
