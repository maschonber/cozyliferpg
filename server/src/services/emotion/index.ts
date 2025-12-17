/**
 * Emotion Service
 *
 * Manages NPC emotion tracking, decay, and display logic.
 * All functions are pure (no side effects) for easy testing and predictability.
 *
 * Architecture:
 * - Pure functions for calculations (testable, composable)
 * - Configuration-driven (see config.ts)
 * - Strategy pattern for decay rates
 */

import {
  EmotionType,
  EmotionIntensity,
  EmotionValues,
  NPCEmotionState,
  EmotionDisplay,
  NPCTrait,
} from '../../../../shared/types';
import {
  EMOTION_BASELINES,
  DECAY_RATES,
  INTENSITY_DECAY_MULTIPLIERS,
  TRAIT_EMOTION_MODIFIERS,
  EMOTION_DISPLAY_LABELS,
  SECONDARY_EMOTION_THRESHOLD,
  MIXED_EMOTION_THRESHOLD,
} from './config';

// ===== Helper Functions =====

/**
 * Clamp a value between 0 and 100
 */
function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Get intensity tier for an emotion value
 */
function getIntensityTier(value: number): EmotionIntensity {
  if (value <= 25) return 'mild';
  if (value <= 50) return 'moderate';
  if (value <= 75) return 'strong';
  return 'intense';
}

/**
 * Get baseline value for an emotion, optionally modified by traits
 */
function getBaselineForEmotion(
  emotion: EmotionType,
  traits: NPCTrait[]
): number {
  let baseline = EMOTION_BASELINES[emotion];

  // Apply trait modifiers
  for (const trait of traits) {
    const modifier = TRAIT_EMOTION_MODIFIERS[trait]?.[emotion];
    if (modifier !== undefined) {
      baseline += modifier;
    }
  }

  return clamp(baseline);
}

// ===== Core Service Functions =====

/**
 * Initialize emotion state for a new NPC
 *
 * Creates baseline emotion values modified by personality traits.
 * This should be called once when an NPC is created.
 *
 * @param npcId - NPC identifier (unused but kept for consistency)
 * @param traits - NPC's traits (affects baseline emotions)
 * @returns Initial emotion state with trait-adjusted baselines
 *
 * @example
 * const emotions = initializeEmotions('npc_123', ['optimistic', 'adventurous']);
 * // Result: Higher joy and excitement baselines
 */
export function initializeEmotions(
  npcId: string,
  traits: NPCTrait[]
): NPCEmotionState {
  const emotions: Record<EmotionType, number> = {
    joy: getBaselineForEmotion('joy', traits),
    affection: getBaselineForEmotion('affection', traits),
    excitement: getBaselineForEmotion('excitement', traits),
    calm: getBaselineForEmotion('calm', traits),
    sadness: getBaselineForEmotion('sadness', traits),
    anger: getBaselineForEmotion('anger', traits),
    anxiety: getBaselineForEmotion('anxiety', traits),
    romantic: getBaselineForEmotion('romantic', traits),
  };

  return {
    ...emotions,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Apply emotion deltas to current state
 *
 * Modifies emotion values by specified amounts (positive or negative).
 * All values are clamped to 0-100 range.
 *
 * @param state - Current emotion state
 * @param deltas - Emotion changes to apply (partial - only specify changed emotions)
 * @returns New emotion state with deltas applied
 *
 * @example
 * const newState = applyEmotionDelta(currentState, {
 *   joy: 15,      // Increase joy by 15
 *   anxiety: -10  // Decrease anxiety by 10
 * });
 */
export function applyEmotionDelta(
  state: NPCEmotionState,
  deltas: Partial<EmotionValues>
): NPCEmotionState {
  return {
    joy: clamp(state.joy + (deltas.joy ?? 0)),
    affection: clamp(state.affection + (deltas.affection ?? 0)),
    excitement: clamp(state.excitement + (deltas.excitement ?? 0)),
    calm: clamp(state.calm + (deltas.calm ?? 0)),
    sadness: clamp(state.sadness + (deltas.sadness ?? 0)),
    anger: clamp(state.anger + (deltas.anger ?? 0)),
    anxiety: clamp(state.anxiety + (deltas.anxiety ?? 0)),
    romantic: clamp(state.romantic + (deltas.romantic ?? 0)),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calculate decay for a single emotion value toward its baseline
 *
 * @param currentValue - Current emotion value
 * @param baseline - Target baseline value
 * @param decayRate - Points per hour decay rate
 * @param hoursPassed - Hours since last update
 * @param intensityMultiplier - Slowdown multiplier based on intensity
 * @returns New emotion value after decay
 */
function decaySingleEmotion(
  currentValue: number,
  baseline: number,
  decayRate: number,
  hoursPassed: number,
  intensityMultiplier: number
): number {
  if (currentValue === baseline) return baseline;

  // Calculate effective decay rate (adjusted for intensity)
  const effectiveRate = decayRate * intensityMultiplier * hoursPassed;

  // Decay toward baseline
  if (currentValue > baseline) {
    // Decaying downward
    const newValue = currentValue - effectiveRate;
    return Math.max(baseline, newValue); // Don't overshoot baseline
  } else {
    // Decaying upward
    const newValue = currentValue + effectiveRate;
    return Math.min(baseline, newValue); // Don't overshoot baseline
  }
}

/**
 * Apply time-based emotion decay
 *
 * Each emotion decays toward its baseline at a configured rate.
 * - Decay rate depends on emotion type (fast/medium/slow)
 * - Strong emotions (51+) decay slower
 * - Romantic emotion decay rate affected by trust level
 *
 * @param state - Current emotion state
 * @param hoursPassed - Hours since last update (can be fractional)
 * @param trustLevel - Current trust level (-100 to 100, affects romantic decay)
 * @param traits - NPC traits (affects baselines)
 * @returns New emotion state after decay
 *
 * @example
 * // 2 hours have passed since last update
 * const decayed = decayEmotions(state, 2, 40, npc.traits);
 */
export function decayEmotions(
  state: NPCEmotionState,
  hoursPassed: number,
  trustLevel: number,
  traits: NPCTrait[]
): NPCEmotionState {
  if (hoursPassed <= 0) return state;

  // Calculate baselines (may be modified by traits)
  const baselines: Record<EmotionType, number> = {
    joy: getBaselineForEmotion('joy', traits),
    affection: getBaselineForEmotion('affection', traits),
    excitement: getBaselineForEmotion('excitement', traits),
    calm: getBaselineForEmotion('calm', traits),
    sadness: getBaselineForEmotion('sadness', traits),
    anger: getBaselineForEmotion('anger', traits),
    anxiety: getBaselineForEmotion('anxiety', traits),
    romantic: getBaselineForEmotion('romantic', traits),
  };

  // Decay each emotion
  const emotions: EmotionType[] = [
    'joy',
    'affection',
    'excitement',
    'calm',
    'sadness',
    'anger',
    'anxiety',
    'romantic',
  ];

  const result: Partial<EmotionValues> = {};

  for (const emotion of emotions) {
    const currentValue = state[emotion];
    const baseline = baselines[emotion];
    let decayRate = DECAY_RATES[emotion];

    // Special case: Romantic decay affected by trust
    if (emotion === 'romantic') {
      // Formula: baseRate * (1 - trustLevel/200)
      // Trust=0: normal rate, Trust=100: half rate
      const trustFactor = 1 - Math.min(100, Math.max(-100, trustLevel)) / 200;
      decayRate = decayRate * trustFactor;
    }

    // Get intensity-based slowdown multiplier
    const intensity = getIntensityTier(currentValue);
    const intensityMultiplier = INTENSITY_DECAY_MULTIPLIERS[intensity];

    // Calculate new value
    result[emotion] = clamp(
      decaySingleEmotion(
        currentValue,
        baseline,
        decayRate,
        hoursPassed,
        intensityMultiplier
      )
    );
  }

  return {
    ...(result as EmotionValues),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get display-ready emotion with intensity mapping
 *
 * Maps raw emotion value to a user-friendly display string.
 *
 * @param emotion - Emotion type
 * @param value - Emotion value (0-100)
 * @returns Display object with label, intensity, etc.
 *
 * @example
 * getEmotionDisplay('joy', 72) // → { emotion: 'joy', intensity: 'strong', value: 72, label: 'joyful' }
 */
export function getEmotionDisplay(
  emotion: EmotionType,
  value: number
): EmotionDisplay {
  const intensity = getIntensityTier(value);
  const label = EMOTION_DISPLAY_LABELS[emotion][intensity];

  return {
    emotion,
    intensity,
    value,
    label,
  };
}

/**
 * Get dominant emotions from current state
 *
 * Returns the strongest emotion(s) currently felt by the NPC.
 * - Primary: highest value emotion
 * - Secondary: included if within threshold of primary
 * - Mixed: if 3+ emotions are close together
 *
 * @param state - Current emotion state
 * @returns Object with primary and optional secondary emotion displays
 *
 * @example
 * getDominantEmotions(state)
 * // → { primary: { emotion: 'joy', label: 'joyful', ... }, secondary: { emotion: 'excitement', ... } }
 */
export function getDominantEmotions(state: NPCEmotionState): {
  primary: EmotionDisplay;
  secondary?: EmotionDisplay;
} {
  // Get all emotions with their values
  const emotions: Array<{ emotion: EmotionType; value: number }> = [
    { emotion: 'joy', value: state.joy },
    { emotion: 'affection', value: state.affection },
    { emotion: 'excitement', value: state.excitement },
    { emotion: 'calm', value: state.calm },
    { emotion: 'sadness', value: state.sadness },
    { emotion: 'anger', value: state.anger },
    { emotion: 'anxiety', value: state.anxiety },
    { emotion: 'romantic', value: state.romantic },
  ];

  // Sort by value (descending)
  emotions.sort((a, b) => b.value - a.value);

  // Get primary emotion
  const primaryEmotion = emotions[0];
  const primary = getEmotionDisplay(primaryEmotion.emotion, primaryEmotion.value);

  // Check for secondary emotion (within threshold of primary)
  const secondaryEmotion = emotions[1];
  if (primaryEmotion.value - secondaryEmotion.value <= SECONDARY_EMOTION_THRESHOLD) {
    const secondary = getEmotionDisplay(
      secondaryEmotion.emotion,
      secondaryEmotion.value
    );
    return { primary, secondary };
  }

  // Check for "mixed" state (3+ emotions close together)
  const closeEmotions = emotions.filter(
    (e) => primaryEmotion.value - e.value <= MIXED_EMOTION_THRESHOLD
  );

  if (closeEmotions.length >= 3) {
    // Return "mixed" as secondary to indicate complexity
    // Note: We don't have a "mixed" emotion type, so we just return the second strongest
    const secondary = getEmotionDisplay(
      secondaryEmotion.emotion,
      secondaryEmotion.value
    );
    return { primary, secondary };
  }

  // Just primary emotion
  return { primary };
}

/**
 * Calculate hours elapsed since last emotion update
 *
 * Helper function for lazy decay calculation.
 *
 * @param lastUpdated - ISO timestamp of last update
 * @returns Hours elapsed (can be fractional)
 */
export function getHoursSinceUpdate(lastUpdated: string): number {
  const lastUpdate = new Date(lastUpdated);
  const now = new Date();
  const msElapsed = now.getTime() - lastUpdate.getTime();
  return msElapsed / (1000 * 60 * 60); // Convert ms to hours
}
