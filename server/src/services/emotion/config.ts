/**
 * Emotion System Configuration
 *
 * This file contains all configuration data for the emotion system:
 * - Base emotion values and decay rates
 * - Trait-based emotion modifiers
 * - Display string mappings
 *
 * Design: Data-driven configuration allows easy tweaking without code changes
 */

import { EmotionType, PersonalityTrait, NPCTrait } from '../../../../shared/types';

// ===== Emotion Baselines =====

/**
 * Default baseline values for each emotion (where they decay toward)
 */
export const EMOTION_BASELINES: Record<EmotionType, number> = {
  joy: 15,
  affection: 10,
  excitement: 5,
  calm: 20,
  sadness: 5,
  anger: 0,
  anxiety: 5,
  romantic: 10,
};

// ===== Decay Configuration =====

/**
 * Decay rates in points per hour
 * - Fast: High volatility emotions (anger, excitement)
 * - Medium: Moderate stability emotions (joy, sadness, anxiety, calm)
 * - Slow: Stable emotions (affection)
 * - Variable: Romantic emotion (affected by trust level)
 */
export const DECAY_RATES: Record<EmotionType, number> = {
  // Positive emotions
  joy: 1.5,        // Medium decay
  affection: 0.8,  // Slow decay (more stable)
  excitement: 2.5, // Fast decay (high volatility)
  calm: 1.2,       // Medium decay

  // Negative emotions
  sadness: 1.5,    // Medium decay
  anger: 3.0,      // Fast decay (burns out quickly)
  anxiety: 1.8,    // Medium decay

  // Romantic
  romantic: 1.5,   // Base rate (modified by trust in decay function)
};

/**
 * Decay slowdown multipliers based on emotion intensity
 * - Moderate (26-50): normal decay
 * - Strong (51-75): 25% slower
 * - Intense (76-100): 50% slower
 *
 * Rationale: Strong emotions are more persistent and take longer to fade
 */
export const INTENSITY_DECAY_MULTIPLIERS = {
  mild: 1.0,      // 1-25: normal decay
  moderate: 1.0,  // 26-50: normal decay
  strong: 0.75,   // 51-75: 25% slower
  intense: 0.5,   // 76-100: 50% slower
};

// ===== Trait-Based Emotion Modifiers =====

/**
 * Trait-based baseline adjustments
 * Applied during emotion initialization to create personality variation
 *
 * Design: Additive modifiers that stack if multiple traits apply
 */
export const TRAIT_EMOTION_MODIFIERS: Partial<Record<NPCTrait, Partial<Record<EmotionType, number>>>> = {
  // Emotional style traits
  optimistic: {
    joy: 10,
    sadness: -3,
  },
  melancholic: {
    sadness: 10,
    joy: -5,
  },
  passionate: {
    excitement: 10,
    romantic: 10,
  },
  stoic: {
    calm: 15,
    excitement: -3,
    anger: -5,
  },

  // Social energy traits
  outgoing: {
    joy: 5,
    excitement: 5,
    anxiety: -3,
  },
  reserved: {
    calm: 5,
    anxiety: 3,
  },

  // Risk attitude traits
  adventurous: {
    excitement: 5,
    anxiety: -2,
  },
  cautious: {
    anxiety: 5,
    excitement: -3,
  },
  spontaneous: {
    excitement: 7,
    calm: -5,
  },

  // Interpersonal traits
  empathetic: {
    affection: 5,
  },
  nurturing: {
    affection: 7,
    calm: 3,
  },

  // Romance traits
  flirtatious: {
    romantic: 10,
    excitement: 5,
  },
  romantic: {
    romantic: 15,
    affection: 5,
  },
  slow_burn: {
    romantic: -5,
    calm: 5,
  },
  intense: {
    romantic: 10,
    excitement: 8,
  },
};

// ===== Display String Mappings =====

/**
 * Emotion display labels by intensity tier
 * Maps from (emotion, intensity) → display string
 *
 * Source: Appendix A of relationship-system-redesign.md
 */
export const EMOTION_DISPLAY_LABELS: Record<EmotionType, {
  mild: string;      // 1-25
  moderate: string;  // 26-50
  strong: string;    // 51-75
  intense: string;   // 76-100
}> = {
  joy: {
    mild: 'content',
    moderate: 'happy',
    strong: 'joyful',
    intense: 'ecstatic',
  },
  affection: {
    mild: 'friendly',
    moderate: 'warm',
    strong: 'affectionate',
    intense: 'adoring',
  },
  excitement: {
    mild: 'interested',
    moderate: 'intrigued',
    strong: 'excited',
    intense: 'thrilled',
  },
  calm: {
    mild: 'neutral',
    moderate: 'relaxed',
    strong: 'serene',
    intense: 'blissful',
  },
  sadness: {
    mild: 'disappointed',
    moderate: 'sad',
    strong: 'upset',
    intense: 'devastated',
  },
  anger: {
    mild: 'annoyed',
    moderate: 'irritated',
    strong: 'angry',
    intense: 'furious',
  },
  anxiety: {
    mild: 'uneasy',
    moderate: 'nervous',
    strong: 'anxious',
    intense: 'distressed',
  },
  romantic: {
    mild: 'curious',
    moderate: 'flirty',
    strong: 'romantic',
    intense: 'passionate',
  },
};

// ===== Helper Constants =====

/**
 * Threshold for considering a secondary emotion in dominant emotion calculation
 * If second-highest emotion is within this many points of highest, include it
 */
export const SECONDARY_EMOTION_THRESHOLD = 10;

/**
 * Threshold for "mixed" emotional state
 * If 3+ emotions are within this range, return mixed state
 */
export const MIXED_EMOTION_THRESHOLD = 15;
