/**
 * Plutchik Emotion System - Core Service
 *
 * A sophisticated emotion system based on Plutchik's Wheel of Emotions.
 * Emotions are represented as 4 bipolar axes, and compete for "emotional space".
 *
 * ## Key Features
 * - Emotions suppress each other based on wheel distance
 * - High emotions are harder to increase (diminishing returns)
 * - High total emotional energy makes extremes harder to reach
 * - Pure functions for testability
 *
 * ## Architecture
 * - All functions are pure (no side effects)
 * - Normalized scale (-1 to +1) for clean math
 * - Configuration-driven (see config.ts)
 *
 * ## Design Decisions
 *
 * ### Multi-Pull Behavior
 * When multiple pulls are applied simultaneously (e.g., joy + acceptance to create "love"):
 * - All pulls are treated equally - neither is "primary" or "secondary"
 * - Energy resistance is calculated ONCE using the initial vector state
 * - This is intentional: multi-pulls facilitate emotion dyads that would otherwise
 *   be harder to reach due to suppression between sequential pulls
 * - Each pull applies suppression to non-pulled emotions independently, which means
 *   emotions not being pulled may be suppressed more strongly than with a single pull
 *
 * ### Axis Resistance (Emotional Momentum)
 * The resistance formula uses abs(currentValue), meaning:
 * - Extreme emotions resist change in BOTH directions
 * - This creates "emotional momentum" - strong emotions are hard to shift
 * - Pushing toward zero from an extreme (0.8) faces the same resistance as
 *   pushing further toward the extreme
 * - This is intentional: calming down from intense emotions takes effort
 *
 * ### Suppression Never Flips Emotions
 * Suppression can reduce an emotion toward zero but never past it:
 * - If joy is at 0.5, suppression can reduce it to 0 but not make it negative
 * - This prevents the counter-intuitive behavior of one emotion "creating" its opposite
 */

import {
  BaseEmotion,
  EmotionVector,
  EmotionPull,
  NEUTRAL_EMOTION_VECTOR,
} from './types';
import {
  EMOTION_WHEEL_ORDER,
  BASE_INTENSITY_VALUES,
} from './config';

// ===== Helper Functions =====

/**
 * Map a base emotion to its axis and direction
 */
function getAxisForEmotion(emotion: BaseEmotion): {
  axis: keyof EmotionVector;
  direction: 1 | -1;
} {
  const mapping: Record<BaseEmotion, { axis: keyof EmotionVector; direction: 1 | -1 }> = {
    joy: { axis: 'joySadness', direction: 1 },
    sadness: { axis: 'joySadness', direction: -1 },
    acceptance: { axis: 'acceptanceDisgust', direction: 1 },
    disgust: { axis: 'acceptanceDisgust', direction: -1 },
    anger: { axis: 'angerFear', direction: 1 },
    fear: { axis: 'angerFear', direction: -1 },
    anticipation: { axis: 'anticipationSurprise', direction: 1 },
    surprise: { axis: 'anticipationSurprise', direction: -1 },
  };

  return mapping[emotion];
}

/**
 * Calculate distance between two emotions on the Plutchik wheel
 * Distance ranges from 0 (same emotion) to 4 (opposite emotion)
 */
function getEmotionDistance(from: BaseEmotion, to: BaseEmotion): number {
  const fromIndex = EMOTION_WHEEL_ORDER.indexOf(from);
  const toIndex = EMOTION_WHEEL_ORDER.indexOf(to);

  // Calculate shortest distance around the wheel (clockwise or counter-clockwise)
  const wheelSize = EMOTION_WHEEL_ORDER.length;
  const clockwiseDistance = (toIndex - fromIndex + wheelSize) % wheelSize;
  const counterClockwiseDistance = (fromIndex - toIndex + wheelSize) % wheelSize;

  return Math.min(clockwiseDistance, counterClockwiseDistance);
}

/**
 * Calculate total emotional energy (magnitude across all axes)
 * Used to determine overall emotional agitation
 */
function getTotalEmotionalEnergy(vector: EmotionVector): number {
  return (
    Math.abs(vector.joySadness) +
    Math.abs(vector.acceptanceDisgust) +
    Math.abs(vector.angerFear) +
    Math.abs(vector.anticipationSurprise)
  );
}

/**
 * Clamp a value to [-1, 1] range
 */
function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

// ===== Core Service Functions =====

/**
 * Calculate resistance factor for a single axis value
 * Returns a multiplier in [0, 1] that reduces the effect as value approaches extremes
 *
 * Uses a quadratic curve: resistance increases as abs(value) approaches 1
 */
function calculateAxisResistance(currentValue: number): number {
  const absValue = Math.abs(currentValue);
  // Use 1 - x^2 to create smooth resistance curve
  // At 0: resistance = 1 (no resistance)
  // At 0.5: resistance = 0.75 (some resistance)
  // At 0.8: resistance = 0.36 (strong resistance)
  // At 0.9: resistance = 0.19 (very strong resistance)
  return 1 - absValue * absValue;
}

/**
 * Calculate resistance factor based on total emotional energy
 * Returns a multiplier in [0, 1] that reduces effects when many emotions are active
 */
function calculateEnergyResistance(totalEnergy: number): number {
  // Total energy ranges from 0 (neutral) to ~4 (all axes maxed)
  // We want resistance to kick in around 1.0+ and be strong by 2.0+
  if (totalEnergy < 0.8) {
    return 1.0; // No resistance for low energy
  }

  // Exponential decay: resistance = e^(-energy/2)
  // At energy = 1.0: ~0.61 (moderate resistance)
  // At energy = 1.5: ~0.47 (strong resistance)
  // At energy = 2.0: ~0.37 (very strong resistance)
  return Math.exp(-totalEnergy / 2);
}

/**
 * Get all 8 base emotions from a vector with their current values
 */
function getAllEmotions(vector: EmotionVector): Array<{ emotion: BaseEmotion; value: number }> {
  return [
    { emotion: 'joy', value: Math.max(0, vector.joySadness) },
    { emotion: 'sadness', value: Math.max(0, -vector.joySadness) },
    { emotion: 'acceptance', value: Math.max(0, vector.acceptanceDisgust) },
    { emotion: 'disgust', value: Math.max(0, -vector.acceptanceDisgust) },
    { emotion: 'anger', value: Math.max(0, vector.angerFear) },
    { emotion: 'fear', value: Math.max(0, -vector.angerFear) },
    { emotion: 'anticipation', value: Math.max(0, vector.anticipationSurprise) },
    { emotion: 'surprise', value: Math.max(0, -vector.anticipationSurprise) },
  ];
}

/**
 * Calculate suppression amount for an emotion based on distance
 * Simple linear scaling: more distant emotions get suppressed more
 *
 * @param distance - Distance on the wheel (0-4)
 * @param pullStrength - Strength of the pull causing suppression
 * @returns Amount to suppress (positive value, as percentage of current emotion)
 */
function calculateSuppressionPercentage(
  distance: number,
  pullStrength: number
): number {
  const distanceFactor = distance / 5;

  // Pull strength also matters linearly
  // Stronger pulls suppress more aggressively
  const strengthFactor = pullStrength;

  // Combine: percentage to suppress (0 to 1)
  // Scale up to make it more aggressive
  const suppressionPercentage = distanceFactor * strengthFactor * 1.8;

  // Clamp to max 100% suppression
  return Math.min(1.0, suppressionPercentage);
}

/**
 * Apply emotion pull(s) to a vector
 *
 * This is the main service function that handles the complex emotion dynamics:
 * - Applies direct pull to target emotion(s)
 * - Suppresses other emotions based on distance and magnitude
 * - Handles resistance based on current intensity
 * - Prevents more than 2 strong emotions at once
 *
 * ## Processing Phases
 *
 * **Phase 1-2: Apply Pulls with Resistance**
 * Each pull is applied with two resistance factors:
 * - Axis resistance: 1 - x² where x is current axis value (harder to push extremes)
 * - Energy resistance: e^(-energy/2) where energy is sum of all axis magnitudes
 * Both factors are calculated from the INITIAL state (before any pulls in this call).
 *
 * **Phase 3: Suppress Non-Pulled Emotions**
 * For each pull, other elevated emotions are suppressed based on:
 * - Distance on Plutchik's wheel (0-4, opposite emotions suppressed most)
 * - Current magnitude of the emotion (higher emotions lose more)
 * - Strength of the pull causing suppression
 * Suppression runs once per pull, so multi-pulls cause cumulative suppression.
 *
 * @param currentVector - Current emotion state
 * @param pulls - 1-2 emotion pulls to apply (treated equally, not sequentially)
 * @returns New emotion vector after applying pulls
 */
export function applyEmotionPulls(
  currentVector: EmotionVector,
  pulls: EmotionPull[]
): EmotionVector {
  // Start with a copy of the current vector
  const result: EmotionVector = { ...currentVector };

  // Calculate total emotional energy for resistance
  const totalEnergy = getTotalEmotionalEnergy(currentVector);
  const energyResistance = calculateEnergyResistance(totalEnergy);

  // Phase 1 + Phase 2: Apply each pull with resistance
  for (const pull of pulls) {
    const { axis, direction } = getAxisForEmotion(pull.emotion);
    const currentValue = result[axis];
    const baseValue = BASE_INTENSITY_VALUES[pull.intensity];

    // Calculate resistance factors
    const axisResistance = calculateAxisResistance(currentValue);

    // Combined resistance (multiply both factors)
    const combinedResistance = axisResistance * energyResistance;

    // Apply the pull with resistance
    const delta = baseValue * direction * combinedResistance;
    result[axis] = clamp(currentValue + delta);
  }

  // Phase 3: Suppress other emotions based on distance and magnitude
  // Collect all pulled emotions to avoid suppressing them
  const pulledEmotions = new Set(pulls.map(p => p.emotion));

  for (const pull of pulls) {
    const pullStrength = BASE_INTENSITY_VALUES[pull.intensity];
    const allEmotions = getAllEmotions(result);

    // For each emotion, calculate suppression based on distance from pulled emotion
    for (const { emotion, value } of allEmotions) {
      if (value <= 0) continue; // Skip emotions that aren't elevated
      if (pulledEmotions.has(emotion)) continue; // Don't suppress emotions being pulled

      const distance = getEmotionDistance(pull.emotion, emotion);
      const suppressionPercentage = calculateSuppressionPercentage(distance, pullStrength);

      // Calculate suppression as percentage of current emotion value
      const suppressionAmount = value * suppressionPercentage;

      // Apply suppression to the appropriate axis
      const { axis, direction } = getAxisForEmotion(emotion);
      const currentAxisValue = result[axis];

      // Reduce the emotion (opposite direction of its natural direction)
      const suppressionDelta = -suppressionAmount * direction;

      // Apply suppression, but don't push past zero (don't flip to opposite emotion)
      const newValue = currentAxisValue + suppressionDelta;

      // Clamp based on direction to prevent flipping
      if (direction > 0) {
        // Positive emotion: don't let it go below 0
        result[axis] = Math.max(0, Math.min(1, newValue));
      } else {
        // Negative emotion: don't let it go above 0
        result[axis] = Math.min(0, Math.max(-1, newValue));
      }
    }
  }

  return result;
}

/**
 * Interpret an emotion vector into human-readable emotion state
 *
 * Uses a priority-based system to determine the dominant emotion:
 *  1. High intensity single emotion (>= 75)
 *  2. Emotion dyad (two emotions >= 40)
 *  3. Medium intensity single emotion (>= 50)
 *  4. Low intensity single emotion (>= 25)
 *  5. Mixed (3+ emotions >= 40)
 *  6. Neutral (no emotions >= 25)
 *
 * @param vector - Emotion vector to interpret
 * @returns Interpretation with emotion name, intensity, and descriptors
 */
export { interpretEmotionVector } from './interpretation';

// ===== Exported for Testing =====

export const _testing = {
  getAxisForEmotion,
  getEmotionDistance,
  getTotalEmotionalEnergy,
  clamp,
};
