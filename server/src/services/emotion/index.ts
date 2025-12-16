/**
 * Emotion Service
 * Manages NPC emotion tracking, decay, and display logic
 *
 * Implements the 8-emotion system with intensity tiers and decay mechanics
 */

import {
  EmotionType,
  EmotionValues,
  NPCEmotionState,
  EmotionDisplay,
  EmotionIntensity,
  PersonalityTrait
} from '../../../../shared/types';

// ===== Constants =====

/**
 * Baseline emotion values (what emotions decay toward)
 */
export const EMOTION_BASELINES: EmotionValues = {
  joy: 15,
  affection: 10,
  excitement: 5,
  calm: 20,
  sadness: 5,
  anger: 0,
  anxiety: 5,
  romantic: 10
};

/**
 * Decay rates per emotion (points per hour toward baseline)
 * - Fast: 3 points/hour
 * - Medium: 2 points/hour
 * - Slow: 1 point/hour
 * - Variable (romantic): depends on trust level
 */
export const DECAY_RATES: Record<EmotionType, number> = {
  joy: 2,        // Medium
  affection: 1,  // Slow
  excitement: 3, // Fast
  calm: 2,       // Medium
  sadness: 2,    // Medium
  anger: 3,      // Fast
  anxiety: 2,    // Medium
  romantic: 2    // Variable (base rate, modified by trust)
};

/**
 * Strong emotions (51+) decay at half rate
 */
const STRONG_EMOTION_DECAY_MULTIPLIER = 0.5;

/**
 * Personality trait modifiers for emotion baselines
 * Not all traits affect baselines - only the most emotionally relevant ones
 */
const TRAIT_BASELINE_MODIFIERS: Partial<Record<PersonalityTrait, Partial<EmotionValues>>> = {
  // Emotional style traits
  optimistic: { joy: 10, sadness: -3 },
  melancholic: { sadness: 10, joy: -5 },
  passionate: { excitement: 8, romantic: 5, calm: -5 },
  stoic: { calm: 10, anger: -5, anxiety: -5 },

  // Interpersonal traits
  empathetic: { affection: 5, anxiety: 3 },
  nurturing: { affection: 8, calm: 5 }
};

/**
 * Emotion display labels mapped by intensity tier
 * From Appendix A of design document
 */
const EMOTION_DISPLAY_LABELS: Record<EmotionType, Record<EmotionIntensity, string>> = {
  joy: {
    mild: 'content',
    moderate: 'happy',
    strong: 'joyful',
    intense: 'ecstatic'
  },
  affection: {
    mild: 'friendly',
    moderate: 'warm',
    strong: 'affectionate',
    intense: 'adoring'
  },
  excitement: {
    mild: 'interested',
    moderate: 'intrigued',
    strong: 'excited',
    intense: 'thrilled'
  },
  calm: {
    mild: 'neutral',
    moderate: 'relaxed',
    strong: 'serene',
    intense: 'blissful'
  },
  sadness: {
    mild: 'disappointed',
    moderate: 'sad',
    strong: 'upset',
    intense: 'devastated'
  },
  anger: {
    mild: 'annoyed',
    moderate: 'irritated',
    strong: 'angry',
    intense: 'furious'
  },
  anxiety: {
    mild: 'uneasy',
    moderate: 'nervous',
    strong: 'anxious',
    intense: 'distressed'
  },
  romantic: {
    mild: 'curious',
    moderate: 'flirty',
    strong: 'romantic',
    intense: 'passionate'
  }
};

// ===== Helper Functions =====

/**
 * Clamp emotion value to 0-100 range
 */
function clampEmotion(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Get intensity tier based on emotion value
 */
function getIntensityTier(value: number): EmotionIntensity {
  if (value >= 76) return 'intense';
  if (value >= 51) return 'strong';
  if (value >= 26) return 'moderate';
  return 'mild';
}

/**
 * Check if emotion is in "strong" range (decays slower)
 */
function isStrongEmotion(value: number): boolean {
  return value >= 51;
}

// ===== Core Functions =====

/**
 * Initialize emotion state for a new NPC
 * Applies trait-based baseline modifiers
 */
export function initializeEmotions(
  traits: PersonalityTrait[],
  timestamp?: string
): NPCEmotionState {
  // Start with base baselines
  const emotions: EmotionValues = { ...EMOTION_BASELINES };

  // Apply trait modifiers
  for (const trait of traits) {
    const modifiers = TRAIT_BASELINE_MODIFIERS[trait];
    if (modifiers) {
      for (const [emotion, modifier] of Object.entries(modifiers) as [EmotionType, number][]) {
        emotions[emotion] = clampEmotion(emotions[emotion] + modifier);
      }
    }
  }

  return {
    ...emotions,
    lastUpdated: timestamp || new Date().toISOString()
  };
}

/**
 * Apply emotion deltas to current state
 * Returns new state with clamped values
 */
export function applyEmotionDelta(
  state: NPCEmotionState,
  deltas: Partial<EmotionValues>
): NPCEmotionState {
  const newState: NPCEmotionState = {
    ...state,
    lastUpdated: new Date().toISOString()
  };

  // Apply each delta and clamp
  for (const [emotion, delta] of Object.entries(deltas) as [EmotionType, number][]) {
    if (delta !== undefined) {
      newState[emotion] = clampEmotion(state[emotion] + delta);
    }
  }

  return newState;
}

/**
 * Apply emotion decay toward baselines
 *
 * @param state Current emotion state
 * @param hoursPassed Hours since last update
 * @param trustLevel Trust value (-100 to +100) - affects romantic decay rate
 * @param traits Personality traits - affects baselines
 * @returns New emotion state after decay
 */
export function decayEmotions(
  state: NPCEmotionState,
  hoursPassed: number,
  trustLevel: number,
  traits: PersonalityTrait[]
): NPCEmotionState {
  if (hoursPassed <= 0) {
    return state;
  }

  // Calculate personalized baselines based on traits
  const baselines = { ...EMOTION_BASELINES };
  for (const trait of traits) {
    const modifiers = TRAIT_BASELINE_MODIFIERS[trait];
    if (modifiers) {
      for (const [emotion, modifier] of Object.entries(modifiers) as [EmotionType, number][]) {
        baselines[emotion] = clampEmotion(baselines[emotion] + modifier);
      }
    }
  }

  const newState: NPCEmotionState = {
    ...state,
    lastUpdated: new Date().toISOString()
  };

  // Decay each emotion toward its baseline
  const emotions = Object.keys(EMOTION_BASELINES) as EmotionType[];

  for (const emotion of emotions) {
    const currentValue = state[emotion];
    const baseline = baselines[emotion];

    if (currentValue === baseline) {
      continue; // Already at baseline
    }

    // Calculate decay rate
    let decayRate = DECAY_RATES[emotion];

    // Special handling for romantic emotion - slower decay with higher trust
    if (emotion === 'romantic') {
      // Trust ranges from -100 to +100, normalize to 0-1 for multiplier
      // Higher trust = slower decay: multiplier = 1 - (trust/200)
      // At trust=0: multiplier=1 (normal decay)
      // At trust=100: multiplier=0.5 (half decay)
      // At trust=-100: multiplier=1.5 (faster decay)
      const trustMultiplier = 1 - (trustLevel / 200);
      decayRate *= trustMultiplier;
    }

    // Strong emotions (51+) decay slower
    if (isStrongEmotion(currentValue)) {
      decayRate *= STRONG_EMOTION_DECAY_MULTIPLIER;
    }

    // Calculate total decay for the time period
    const totalDecay = decayRate * hoursPassed;

    // Apply decay toward baseline
    if (currentValue > baseline) {
      newState[emotion] = Math.max(baseline, currentValue - totalDecay);
    } else {
      newState[emotion] = Math.min(baseline, currentValue + totalDecay);
    }

    // Clamp to valid range
    newState[emotion] = clampEmotion(newState[emotion]);
  }

  return newState;
}

/**
 * Get the dominant emotion(s) from current state
 * Returns primary and optionally secondary emotion if within 10 points
 */
export function getDominantEmotions(state: NPCEmotionState): {
  primary: EmotionDisplay;
  secondary?: EmotionDisplay;
} {
  // Get all emotions with their values
  const emotions = Object.keys(EMOTION_BASELINES) as EmotionType[];
  const emotionValues = emotions.map(emotion => ({
    emotion,
    value: state[emotion]
  }));

  // Sort by value descending
  emotionValues.sort((a, b) => b.value - a.value);

  const primary = getEmotionDisplay(emotionValues[0].emotion, emotionValues[0].value);

  // Check if second highest is within 10 points
  let secondary: EmotionDisplay | undefined;
  if (emotionValues.length > 1) {
    const secondValue = emotionValues[1].value;
    const primaryValue = emotionValues[0].value;

    if (primaryValue - secondValue <= 10) {
      secondary = getEmotionDisplay(emotionValues[1].emotion, secondValue);
    }
  }

  return { primary, secondary };
}

/**
 * Map emotion type and value to display format with intensity
 */
export function getEmotionDisplay(emotion: EmotionType, value: number): EmotionDisplay {
  const intensity = getIntensityTier(value);
  const label = EMOTION_DISPLAY_LABELS[emotion][intensity];

  return {
    emotion,
    intensity,
    value,
    label
  };
}

/**
 * Calculate hours passed between two timestamps
 */
export function calculateHoursPassed(from: string, to: string): number {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const millisPassed = toDate.getTime() - fromDate.getTime();
  return millisPassed / (1000 * 60 * 60); // Convert to hours
}

/**
 * Get trait-modified baseline for a specific emotion
 * Useful for understanding why an emotion is at a certain baseline
 */
export function getEmotionBaseline(emotion: EmotionType, traits: PersonalityTrait[]): number {
  let baseline = EMOTION_BASELINES[emotion];

  for (const trait of traits) {
    const modifiers = TRAIT_BASELINE_MODIFIERS[trait];
    if (modifiers && modifiers[emotion] !== undefined) {
      baseline += modifiers[emotion]!;
    }
  }

  return clampEmotion(baseline);
}
