/**
 * Social Activity Service Configuration
 *
 * Configuration for outcome scaling.
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
