/**
 * Plutchik Emotion System - Emotion Decay Service
 *
 * Handles passive decay of emotions toward neutral baseline over time.
 * Stronger emotions decay slower than weaker ones (exponential decay).
 *
 * ## Decay Characteristics
 * - 0.00 to 0.25: 4 hours to decay
 * - 0.25 to 0.50: 8 hours to decay
 * - 0.50 to 0.75: 16 hours to decay
 * - 0.75 to 1.00: 32 hours to decay
 *
 * This applies symmetrically to both positive and negative values.
 * All values decay toward neutral (0).
 *
 * ## Design Decisions
 * - Pure function (no side effects)
 * - Immutable (returns new EmotionVector)
 * - Component-wise decay (each axis decays independently)
 * - Exponential decay curve (more natural than linear)
 * - Clamps at zero (doesn't overshoot to opposite emotion)
 * - Handles small time increments (down to ~0.1 hours)
 */

import { EmotionVector } from './types';

/**
 * Piecewise linear decay model.
 *
 * Based on the requirements:
 * - From 0.25 to 0 takes 4 hours
 * - From 0.50 to 0.25 takes 8 hours
 * - From 0.75 to 0.50 takes 16 hours
 * - From 1.00 to 0.75 takes 32 hours
 *
 * This creates a piecewise linear decay where each quartile has a different decay rate.
 * The time to lose 0.25 doubles with each higher quartile, meaning strong emotions
 * decay much slower than weak ones.
 *
 * Decay rates by quartile:
 * - [0.75-1.00]: 0.0078125 per hour (32h to cross quartile)
 * - [0.50-0.75]: 0.015625 per hour (16h to cross quartile)
 * - [0.25-0.50]: 0.03125 per hour (8h to cross quartile)
 * - [0.00-0.25]: 0.0625 per hour (4h to cross quartile)
 */

/**
 * Calculate decay factor for a single emotion component value.
 *
 * Uses exponential decay where decay rate decreases with intensity.
 *
 * @param value - Current emotion value (-1 to 1)
 * @param hours - Time elapsed in hours (positive number)
 * @returns New emotion value after decay
 */
function decayComponent(value: number, hours: number): number {
  // Edge cases
  if (hours <= 0) return value;
  if (value === 0) return 0;

  // Work with absolute value, preserve sign
  const sign = Math.sign(value);
  let absValue = Math.abs(value);

  // For very small values, decay to zero quickly
  if (absValue < 0.001) return 0;

  // Piecewise linear decay with different rates for each quartile
  // Requirements:
  // - 1.00 → 0.75 takes 32h (rate = 0.25/32 = 0.0078125 per hour)
  // - 0.75 → 0.50 takes 16h (rate = 0.25/16 = 0.015625 per hour)
  // - 0.50 → 0.25 takes 8h (rate = 0.25/8 = 0.03125 per hour)
  // - 0.25 → 0.00 takes 4h (rate = 0.25/4 = 0.0625 per hour)
  //
  // The decay rate depends on which quartile the value is in.
  // We process the time in steps, using the appropriate rate for each quartile.

  let remainingTime = hours;

  // Process decay through quartiles from high to low
  while (remainingTime > 0 && absValue > 0.001) {
    let decayRate: number;
    let quartileMax: number;
    let quartileMin: number;

    // Determine current quartile and decay rate
    if (absValue > 0.75) {
      // Quartile 4: [0.75, 1.00]
      decayRate = 0.25 / 32; // 0.0078125 per hour
      quartileMax = 1.00;
      quartileMin = 0.75;
    } else if (absValue > 0.50) {
      // Quartile 3: [0.50, 0.75]
      decayRate = 0.25 / 16; // 0.015625 per hour
      quartileMax = 0.75;
      quartileMin = 0.50;
    } else if (absValue > 0.25) {
      // Quartile 2: [0.25, 0.50]
      decayRate = 0.25 / 8; // 0.03125 per hour
      quartileMax = 0.50;
      quartileMin = 0.25;
    } else {
      // Quartile 1: [0.00, 0.25]
      decayRate = 0.25 / 4; // 0.0625 per hour
      quartileMax = 0.25;
      quartileMin = 0.00;
    }

    // Calculate how much time it takes to reach the quartile boundary
    const distanceToMin = absValue - quartileMin;
    const timeToReachMin = distanceToMin / decayRate;

    if (timeToReachMin <= remainingTime) {
      // We have enough time to reach the quartile boundary
      absValue = quartileMin;
      remainingTime -= timeToReachMin;
    } else {
      // Decay within this quartile
      absValue -= decayRate * remainingTime;
      remainingTime = 0;
    }
  }

  // Clamp very small values to zero
  if (absValue < 0.001) return 0;

  // Restore sign
  return sign * absValue;
}

/**
 * Apply emotion decay to an emotion vector over a time period.
 *
 * Each component of the emotion vector decays independently toward zero.
 * Stronger emotions decay slower than weaker ones.
 *
 * @param vector - Current emotion state
 * @param hours - Time elapsed in hours (should be >= 0)
 * @returns New emotion vector after decay
 */
export function applyEmotionDecay(
  vector: EmotionVector,
  hours: number
): EmotionVector {
  // Handle edge cases
  if (hours <= 0) {
    return { ...vector };
  }

  // Apply decay to each axis independently
  return {
    joySadness: decayComponent(vector.joySadness, hours),
    acceptanceDisgust: decayComponent(vector.acceptanceDisgust, hours),
    angerFear: decayComponent(vector.angerFear, hours),
    anticipationSurprise: decayComponent(vector.anticipationSurprise, hours),
  };
}

// Export for testing
export const _testing = {
  decayComponent,
};
