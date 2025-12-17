/**
 * Social Activity Service Configuration
 *
 * Configuration for activity-emotion mappings, outcome scaling, and streak tracking.
 * Design: Data-driven configuration to enable easy tuning and extension.
 *
 * Task 6: Social Activity Integration
 */

import { EmotionType, EmotionValues, OutcomeTier } from '../../../../shared/types';

// ===== Activity-Emotion Mappings =====

/**
 * Emotion effects for each activity
 *
 * Defines which emotions are affected by each activity and by how much.
 * Values are BASE effects that get scaled by outcome tier.
 *
 * Structure: { activityId: { emotion: baseChange } }
 */
export const ACTIVITY_EMOTION_EFFECTS: Record<string, Partial<EmotionValues>> = {
  // Social activities
  have_coffee: {
    joy: 10,
    affection: 8,
    calm: 5,
    anxiety: -5
  },

  quick_chat: {
    joy: 5,
    affection: 5,
    calm: 3
  },

  casual_date: {
    excitement: 15,
    romantic: 12,
    joy: 8,
    anxiety: 5  // Some nervousness is natural
  },

  deep_conversation: {
    affection: 15,
    calm: 10,
    anxiety: -10,
    joy: 5
  },

  go_to_movies: {
    joy: 10,
    excitement: 8,
    calm: 5
  },

  exercise_together: {
    excitement: 10,
    joy: 8,
    calm: 5
  },

  cook_dinner: {
    affection: 12,
    romantic: 10,
    joy: 10,
    calm: 5
  },

  flirt_playfully: {
    romantic: 20,
    excitement: 15,
    joy: 10,
    anxiety: 8  // Flirting can be nerve-wracking
  },

  beach_picnic: {
    joy: 12,
    affection: 10,
    calm: 8,
    romantic: 5
  },

  play_pool_darts: {
    joy: 10,
    excitement: 8,
    affection: 5
  },

  boardwalk_stroll: {
    romantic: 12,
    calm: 10,
    affection: 8,
    joy: 5
  }
};

// ===== Emotion-Based Difficulty Modifiers =====

/**
 * Base difficulty modifiers for each emotion type
 *
 * Positive emotions make interactions easier (negative modifier)
 * Negative emotions make interactions harder (positive modifier)
 *
 * These are BASE values that get scaled by intensity tier.
 */
export const EMOTION_DIFFICULTY_BASE: Record<EmotionType, number> = {
  // Positive emotions (make things easier)
  joy: -5,        // Happy NPCs are more receptive
  affection: -6,  // Feeling affectionate makes interactions smoother
  excitement: -4, // Excitement can be distracting but generally positive
  calm: -3,       // Calm NPCs are easier to interact with
  romantic: -5,   // Romantic feelings facilitate romantic activities

  // Negative emotions (make things harder)
  sadness: 8,     // Sad NPCs are withdrawn
  anger: 15,      // Angry NPCs are difficult to interact with
  anxiety: 10     // Anxious NPCs are on edge
};

/**
 * Intensity multipliers for emotion difficulty modifiers
 *
 * Scales the base emotion modifier based on intensity tier.
 */
export const EMOTION_INTENSITY_MULTIPLIERS = {
  mild: 0.5,      // 1-25: half effect
  moderate: 1.0,  // 26-50: full effect
  strong: 1.5,    // 51-75: 1.5x effect
  intense: 2.0    // 76-100: double effect
};

// ===== Outcome Tier Scaling =====

/**
 * Relationship effect scaling by outcome tier
 *
 * Scales the base relationship axis changes based on activity outcome.
 */
export const OUTCOME_RELATIONSHIP_SCALING: Record<OutcomeTier, number> = {
  best: 1.5,         // Best outcome: 150% of base effect
  okay: 1.0,         // Okay outcome: 100% of base effect
  mixed: 0.3,        // Mixed outcome: 30% of base effect
  catastrophic: -0.5 // Catastrophic: reverse 50% of base effect (damages relationship)
};

/**
 * Emotion effect scaling by outcome tier
 *
 * Scales the base emotion changes based on activity outcome.
 */
export const OUTCOME_EMOTION_SCALING: Record<OutcomeTier, Partial<EmotionValues>> = {
  best: {
    // Strong positive emotion shifts
    joy: 15,
    affection: 10,
    excitement: 10,
    calm: 5,
    // Reduce negative emotions
    sadness: -10,
    anger: -10,
    anxiety: -10,
    romantic: 10
  },

  okay: {
    // Mild positive emotion shifts
    joy: 5,
    affection: 3,
    calm: 3,
    // Slightly reduce negative emotions
    sadness: -3,
    anger: -3,
    anxiety: -3
  },

  mixed: {
    // No strong emotion change, slight anxiety
    anxiety: 5,
    sadness: 3
  },

  catastrophic: {
    // Strong negative emotion shifts
    sadness: 15,
    anger: 10,
    anxiety: 15,
    // Reduce positive emotions
    joy: -15,
    affection: -10,
    excitement: -10,
    romantic: -10
  }
};

// ===== Streak System =====

/**
 * Streak-based difficulty modifiers
 *
 * Consecutive positive/negative interactions affect difficulty.
 */
export const STREAK_DIFFICULTY_MODIFIERS = {
  maxPositiveBonus: -10,  // Max bonus from positive streak
  maxNegativePenalty: 10, // Max penalty from negative streak
  streakPerPoint: 2,      // Interactions needed per +/-1 difficulty point
  maxStreakCount: 20      // Maximum streak count (caps at +/-10 modifier)
};

/**
 * Streak reset conditions
 */
export const STREAK_RESET_CONDITIONS = {
  hoursGap: 24,           // Reset if > 24 hours since last interaction
  dayChange: true,        // Reset on new day
  stateChange: false      // Don't reset on relationship state change
};

/**
 * Outcome tiers that count as "positive" for streak tracking
 */
export const POSITIVE_OUTCOME_TIERS: OutcomeTier[] = ['best', 'okay'];

/**
 * Outcome tiers that count as "negative" for streak tracking
 */
export const NEGATIVE_OUTCOME_TIERS: OutcomeTier[] = ['mixed', 'catastrophic'];
