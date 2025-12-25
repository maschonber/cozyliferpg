/**
 * Social Activity Service Configuration
 *
 * Configuration for outcome scaling and streak tracking.
 * Note: Activity-emotion mappings have been removed - will be re-implemented
 * with the new Plutchik emotion system later.
 *
 * Task 6: Social Activity Integration
 */

import { OutcomeTier } from '../../../../shared/types';

// ===== Outcome Tier Scaling =====

/**
 * Relationship effect scaling by outcome tier
 *
 * Scales the base relationship axis changes based on activity outcome.
 * Balanced to allow progression while maintaining meaningful failures.
 */
export const OUTCOME_RELATIONSHIP_SCALING: Record<OutcomeTier, number> = {
  best: 1.5,         // Best outcome: 150% of base effect
  okay: 1.0,         // Okay outcome: 100% of base effect
  mixed: 0.0,        // Mixed outcome: no relationship change (awkward but not harmful)
  catastrophic: -0.5 // Catastrophic: reverse 50% of base effect (setback but recoverable)
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
