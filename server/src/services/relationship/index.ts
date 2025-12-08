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
 * Phase 2 Activities
 */
export const ACTIVITIES = [
  // Work Activities (solo)
  {
    id: 'work_part_time',
    name: 'Work Part-Time Job',
    description: 'Work a 4-hour shift at your part-time job',
    category: 'work' as const,
    requiresNPC: false,
    timeCost: 240,
    energyCost: -30,
    moneyCost: 80,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const],
    effects: {}
  },
  {
    id: 'work_full_day',
    name: 'Work Full Day',
    description: 'Work a full 8-hour shift for maximum pay',
    category: 'work' as const,
    requiresNPC: false,
    timeCost: 480,
    energyCost: -50,
    moneyCost: 150,
    allowedTimeSlots: ['morning' as const],
    effects: {}
  },

  // Social Activities (with NPCs)
  {
    id: 'have_coffee',
    name: 'Have Coffee Together',
    description: 'Grab a casual coffee and catch up',
    category: 'social' as const,
    requiresNPC: true,
    timeCost: 60,
    energyCost: -15,
    moneyCost: -5,
    effects: { friendship: 10 }
  },
  {
    id: 'quick_chat',
    name: 'Quick Chat',
    description: 'Have a brief conversation',
    category: 'social' as const,
    requiresNPC: true,
    timeCost: 30,
    energyCost: -10,
    moneyCost: 0,
    effects: { friendship: 5 }
  },
  {
    id: 'casual_date',
    name: 'Go on Casual Date',
    description: 'Go out for dinner or drinks together',
    category: 'social' as const,
    requiresNPC: true,
    timeCost: 120,
    energyCost: -20,
    moneyCost: -30,
    allowedTimeSlots: ['evening' as const, 'night' as const],
    effects: { romance: 15 }
  },
  {
    id: 'deep_conversation',
    name: 'Have Deep Conversation',
    description: 'Share meaningful thoughts and feelings',
    category: 'social' as const,
    requiresNPC: true,
    timeCost: 90,
    energyCost: -25,
    moneyCost: 0,
    minRelationship: 'friend',
    effects: { friendship: 20 }
  },
  {
    id: 'go_to_movies',
    name: 'Go to Movies',
    description: 'Watch a film together at the cinema',
    category: 'social' as const,
    requiresNPC: true,
    timeCost: 150,
    energyCost: -15,
    moneyCost: -20,
    allowedTimeSlots: ['evening' as const, 'night' as const],
    effects: { friendship: 10, romance: 5 }
  },
  {
    id: 'exercise_together',
    name: 'Exercise Together',
    description: 'Work out or play sports together',
    category: 'social' as const,
    requiresNPC: true,
    timeCost: 90,
    energyCost: -30,
    moneyCost: 0,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const, 'evening' as const],
    effects: { friendship: 10 }
  },
  {
    id: 'cook_dinner',
    name: 'Cook Dinner Together',
    description: 'Prepare and share a homemade meal',
    category: 'social' as const,
    requiresNPC: true,
    timeCost: 120,
    energyCost: -20,
    moneyCost: -15,
    allowedTimeSlots: ['evening' as const, 'night' as const],
    effects: { friendship: 12, romance: 8 }
  },
  {
    id: 'flirt_playfully',
    name: 'Flirt Playfully',
    description: 'Engage in some lighthearted flirting',
    category: 'social' as const,
    requiresNPC: true,
    timeCost: 45,
    energyCost: -15,
    moneyCost: 0,
    effects: { romance: 12 }
  },

  // Self-Improvement Activities (solo)
  {
    id: 'study_library',
    name: 'Study at Library',
    description: 'Hit the books and expand your knowledge',
    category: 'self_improvement' as const,
    requiresNPC: false,
    timeCost: 120,
    energyCost: -25,
    moneyCost: 0,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const, 'evening' as const],
    effects: {}
  },
  {
    id: 'work_out_gym',
    name: 'Work Out at Gym',
    description: 'Get a solid workout in at the gym',
    category: 'self_improvement' as const,
    requiresNPC: false,
    timeCost: 90,
    energyCost: -30,
    moneyCost: -10,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const, 'evening' as const],
    effects: {}
  },
  {
    id: 'read_book',
    name: 'Read a Book',
    description: 'Read for pleasure and relaxation',
    category: 'self_improvement' as const,
    requiresNPC: false,
    timeCost: 90,
    energyCost: -10,
    moneyCost: 0,
    effects: {}
  },
  {
    id: 'creative_hobby',
    name: 'Practice Creative Hobby',
    description: 'Work on art, music, or creative projects',
    category: 'self_improvement' as const,
    requiresNPC: false,
    timeCost: 120,
    energyCost: -20,
    moneyCost: 0,
    effects: {}
  },

  // Leisure/Relaxation Activities (solo)
  {
    id: 'stroll_park',
    name: 'Stroll in the Park',
    description: 'Take a peaceful walk outdoors',
    category: 'leisure' as const,
    requiresNPC: false,
    timeCost: 60,
    energyCost: -5,
    moneyCost: 0,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const, 'evening' as const],
    effects: {}
  },
  {
    id: 'play_video_games',
    name: 'Play Video Games',
    description: 'Unwind with some gaming',
    category: 'leisure' as const,
    requiresNPC: false,
    timeCost: 120,
    energyCost: -10,
    moneyCost: 0,
    effects: {}
  },
  {
    id: 'watch_tv',
    name: 'Watch TV',
    description: 'Relax and watch your favorite shows',
    category: 'leisure' as const,
    requiresNPC: false,
    timeCost: 90,
    energyCost: 0,
    moneyCost: 0,
    effects: {}
  },
  {
    id: 'listen_music',
    name: 'Listen to Music',
    description: 'Put on some tunes and chill',
    category: 'leisure' as const,
    requiresNPC: false,
    timeCost: 30,
    energyCost: 0,
    moneyCost: 0,
    effects: {}
  },

  // Self-Care Activities (solo)
  {
    id: 'take_nap',
    name: 'Take a Nap',
    description: 'Get some quick rest to recharge',
    category: 'self_care' as const,
    requiresNPC: false,
    timeCost: 60,
    energyCost: 5,
    moneyCost: 0,
    allowedTimeSlots: ['afternoon' as const, 'evening' as const],
    effects: {}
  },
  {
    id: 'go_to_sleep',
    name: 'Go to Sleep',
    description: 'Go to bed and end the day',
    category: 'self_care' as const,
    requiresNPC: false,
    timeCost: 0, // Special: ends day
    energyCost: 0, // Special: calculated based on sleep duration
    moneyCost: 0,
    allowedTimeSlots: ['evening' as const, 'night' as const],
    effects: {}
  },

  // Discovery Activity (solo)
  {
    id: 'meet_someone',
    name: 'Meet Someone New',
    description: 'Explore the neighborhood and meet a new person',
    category: 'discovery' as const,
    requiresNPC: false,
    timeCost: 45,
    energyCost: -20,
    moneyCost: 0,
    effects: {}
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
