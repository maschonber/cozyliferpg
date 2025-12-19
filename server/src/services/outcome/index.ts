/**
 * Outcome Service (Phase 2.5)
 * Pure functions for activity outcome determination
 */

import {
  OutcomeTier,
  StatName,
  PlayerStats,
  ActivityOutcome,
  StatContribution
} from '../../../../shared/types';
import { getCurrentStat } from '../stat';

// ===== Constants =====

/**
 * Base DC offset - all difficulties are 100 + activity difficulty
 */
export const BASE_DC = 100;

/**
 * Outcome tier offsets from DC
 */
export const OUTCOME_OFFSETS = {
  catastrophic: -50,  // DC - 50 or below = catastrophic
  best: 50            // DC + 50 or above = best
};

/**
 * Critical roll ranges (on 2d100 sum, before adding stats)
 * These improve/worsen the outcome tier by one step
 */
export const CRIT_RANGES = {
  fail: { min: 2, max: 50 },      // ~10% chance to worsen tier
  success: { min: 152, max: 200 }  // ~10% chance to improve tier
};

// ===== Roll Mechanics =====

/**
 * Roll 2d100 for bell curve distribution
 * Returns a value between 2-200 with average around 101
 */
function roll2d100(): number {
  const die1 = Math.floor(Math.random() * 100) + 1;
  const die2 = Math.floor(Math.random() * 100) + 1;
  return die1 + die2;
}

/**
 * Format stat name for display
 */
function formatStatName(statName: StatName): string {
  return statName.charAt(0).toUpperCase() + statName.slice(1);
}

/**
 * Calculate stat bonus for roll
 * Uses FULL average of relevant stats (no division)
 */
export function calculateStatBonus(stats: PlayerStats, relevantStats: StatName[]): number {
  if (relevantStats.length === 0) return 0;

  // Average the relevant stats (full value, no division)
  const totalStat = relevantStats.reduce((sum, statName) => {
    return sum + getCurrentStat(stats, statName);
  }, 0);

  return Math.round(totalStat / relevantStats.length);
}

/**
 * Calculate DC from difficulty
 * Formula: BASE_DC (100) + difficulty
 */
export function calculateDC(difficulty: number): number {
  return BASE_DC + difficulty;
}

/**
 * Determine outcome tier from total vs DC
 * @param total - The total roll (2d100 + stat bonus)
 * @param dc - The difficulty class to beat
 */
export function determineOutcomeTier(total: number, dc: number): OutcomeTier {
  if (total <= dc + OUTCOME_OFFSETS.catastrophic) return 'catastrophic';
  if (total < dc) return 'mixed';
  if (total >= dc + OUTCOME_OFFSETS.best) return 'best';
  return 'okay';
}

/**
 * Apply critical success/failure tier shifts
 * @param tier - The base tier before crit
 * @param isCritSuccess - Whether this is a critical success
 * @param isCritFail - Whether this is a critical failure
 */
export function applyCritShift(tier: OutcomeTier, isCritSuccess: boolean, isCritFail: boolean): OutcomeTier {
  if (isCritSuccess) {
    // Improve by one tier
    if (tier === 'catastrophic') return 'mixed';
    if (tier === 'mixed') return 'okay';
    if (tier === 'okay') return 'best';
    return 'best'; // Already best
  }

  if (isCritFail) {
    // Worsen by one tier
    if (tier === 'best') return 'okay';
    if (tier === 'okay') return 'mixed';
    if (tier === 'mixed') return 'catastrophic';
    return 'catastrophic'; // Already catastrophic
  }

  return tier;
}

/**
 * Roll for activity outcome
 * @param stats - Player's current stats
 * @param relevantStats - Stats that affect this roll
 * @param difficulty - Activity difficulty (added to BASE_DC of 100)
 * @param diceRoll - Optional dice roll value (2-200), random 2d100 if not provided
 * @returns Outcome tier and roll details
 */
export function rollOutcome(
  stats: PlayerStats,
  relevantStats: StatName[],
  difficulty: number,
  diceRoll?: number
): {
  tier: OutcomeTier;
  roll: number;           // The 2d100 roll (2-200)
  adjustedRoll: number;   // roll + statBonus
  statBonus: number;      // Average of relevant stats
  difficultyPenalty: number; // DC value (kept for compatibility, equals DC)
  dc: number;             // The difficulty class
  isCritSuccess: boolean; // Whether roll was in crit success range
  isCritFail: boolean;    // Whether roll was in crit fail range
  statsUsed: StatContribution[];  // Detailed breakdown of stats used
} {
  // Generate 2d100 roll if not provided (for testing, roll can be injected)
  const actualRoll = diceRoll ?? roll2d100();

  // Calculate stat bonus (full average of relevant stats)
  const statBonus = calculateStatBonus(stats, relevantStats);

  // Capture detailed stat contributions
  const statsUsed: StatContribution[] = relevantStats.map(statName => ({
    statName,
    displayName: formatStatName(statName),
    currentValue: getCurrentStat(stats, statName)
  }));

  // Calculate DC
  const dc = calculateDC(difficulty);

  // Calculate total
  const total = actualRoll + statBonus;

  // Check for crits (based on raw 2d100 roll, before stat bonus)
  const isCritFail = actualRoll >= CRIT_RANGES.fail.min && actualRoll <= CRIT_RANGES.fail.max;
  const isCritSuccess = actualRoll >= CRIT_RANGES.success.min && actualRoll <= CRIT_RANGES.success.max;

  // Determine base tier
  const baseTier = determineOutcomeTier(total, dc);

  // Apply crit shifts
  const tier = applyCritShift(baseTier, isCritSuccess, isCritFail);

  return {
    tier,
    roll: actualRoll,
    adjustedRoll: total,
    statBonus,
    difficultyPenalty: dc, // For backwards compatibility with existing code
    dc,
    isCritSuccess,
    isCritFail,
    statsUsed
  };
}

// ===== Outcome Effect Scaling =====

/**
 * Scale an effect value based on outcome tier
 * Best: 150-200% of base
 * Okay: 100% of base (no change)
 * Mixed: 50-75% of base (or negative)
 * Catastrophic: 0% or negative
 */
export function scaleEffectByTier(
  baseValue: number,
  tier: OutcomeTier,
  isPositiveEffect: boolean
): number {
  switch (tier) {
    case 'best':
      // 150-175% for positive effects
      return isPositiveEffect ? baseValue * 1.5 : baseValue;

    case 'okay':
      // Standard value
      return baseValue;

    case 'mixed':
      // 50-75% for positive, or flip to negative
      if (isPositiveEffect) {
        return baseValue * 0.5;
      }
      return baseValue;

    case 'catastrophic':
      // 0 or negative for positive effects
      if (isPositiveEffect) {
        return -Math.abs(baseValue) * 0.3;  // Flip to small negative
      }
      return baseValue * 1.5;  // Amplify negative effects

    default:
      return baseValue;
  }
}

/**
 * Generate default outcome descriptions
 */
export function getDefaultOutcomeDescription(
  activityName: string,
  tier: OutcomeTier
): string {
  switch (tier) {
    case 'best':
      return `${activityName} went exceptionally well!`;
    case 'okay':
      return `${activityName} went as expected.`;
    case 'mixed':
      return `${activityName} had some complications.`;
    case 'catastrophic':
      return `${activityName} was a disaster.`;
    default:
      return `Completed ${activityName}.`;
  }
}

// ===== Probability Calculations (for UI/debugging) =====

/**
 * Calculate probability distribution for 2d100 bell curve
 * Simulates all possible 2d100 outcomes (10,000 combinations)
 * Returns percentages for each tier
 */
export function calculateOutcomeProbabilities(
  statValue: number,
  difficulty: number
): Record<OutcomeTier, number> {
  const dc = calculateDC(difficulty);
  const statBonus = Math.round(statValue);

  // Count outcomes for each tier
  const counts: Record<OutcomeTier, number> = {
    catastrophic: 0,
    mixed: 0,
    okay: 0,
    best: 0
  };

  let totalCombinations = 0;

  // Simulate all possible 2d100 rolls
  for (let die1 = 1; die1 <= 100; die1++) {
    for (let die2 = 1; die2 <= 100; die2++) {
      const diceRoll = die1 + die2;
      const total = diceRoll + statBonus;

      // Check for crits
      const isCritFail = diceRoll >= CRIT_RANGES.fail.min && diceRoll <= CRIT_RANGES.fail.max;
      const isCritSuccess = diceRoll >= CRIT_RANGES.success.min && diceRoll <= CRIT_RANGES.success.max;

      // Determine base tier
      const baseTier = determineOutcomeTier(total, dc);

      // Apply crit shifts
      const finalTier = applyCritShift(baseTier, isCritSuccess, isCritFail);

      counts[finalTier]++;
      totalCombinations++;
    }
  }

  // Convert to percentages
  return {
    catastrophic: Math.round((counts.catastrophic / totalCombinations) * 1000) / 10,
    mixed: Math.round((counts.mixed / totalCombinations) * 1000) / 10,
    okay: Math.round((counts.okay / totalCombinations) * 1000) / 10,
    best: Math.round((counts.best / totalCombinations) * 1000) / 10
  };
}

/**
 * Check if player meets stat requirements for an activity
 * Requirements use CURRENT stat, not base
 */
export function meetsStatRequirements(
  stats: PlayerStats,
  requirements: Partial<Record<StatName, number>>
): { meets: boolean; unmet: Array<{ stat: StatName; required: number; actual: number }> } {
  const unmet: Array<{ stat: StatName; required: number; actual: number }> = [];

  for (const [statName, required] of Object.entries(requirements)) {
    if (required === undefined) continue;

    const stat = statName as StatName;
    // Use current stat for requirements
    const actual = getCurrentStat(stats, stat);

    if (actual < required) {
      unmet.push({ stat, required, actual });
    }
  }

  return {
    meets: unmet.length === 0,
    unmet
  };
}
