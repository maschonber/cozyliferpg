/**
 * Outcome Service (Phase 2.5)
 * Pure functions for activity outcome determination
 */

import {
  OutcomeTier,
  StatName,
  PlayerStats,
  ActivityOutcome
} from '../../../../shared/types';
import { getCurrentStat } from '../stat';

// ===== Constants =====

/**
 * Outcome tier thresholds (adjusted roll values)
 */
export const OUTCOME_THRESHOLDS = {
  catastrophic: 20,   // Below 20 = catastrophic
  mixed: 45,          // 20-44 = mixed
  okay: 80,           // 45-79 = okay
  best: 80            // 80+ = best
};

// ===== Roll Mechanics =====

/**
 * Calculate stat bonus for roll
 * Formula: relevantStat / 3 (rounded)
 */
export function calculateStatBonus(stats: PlayerStats, relevantStats: StatName[]): number {
  if (relevantStats.length === 0) return 0;

  // Average the relevant stats and divide by 3
  const totalStat = relevantStats.reduce((sum, statName) => {
    return sum + getCurrentStat(stats, statName);
  }, 0);

  const averageStat = totalStat / relevantStats.length;
  return Math.round(averageStat / 3);
}

/**
 * Calculate difficulty penalty for roll
 * Formula: difficulty / 2 (rounded)
 */
export function calculateDifficultyPenalty(difficulty: number): number {
  return Math.round(difficulty / 2);
}

/**
 * Determine outcome tier from adjusted roll
 */
export function determineOutcomeTier(adjustedRoll: number): OutcomeTier {
  if (adjustedRoll < OUTCOME_THRESHOLDS.catastrophic) return 'catastrophic';
  if (adjustedRoll < OUTCOME_THRESHOLDS.mixed) return 'mixed';
  if (adjustedRoll < OUTCOME_THRESHOLDS.okay) return 'okay';
  return 'best';
}

/**
 * Roll for activity outcome
 * @param stats - Player's current stats
 * @param relevantStats - Stats that affect this roll
 * @param difficulty - Activity difficulty (1-100)
 * @param roll - Optional roll value (1-100), random if not provided
 * @returns Outcome tier and roll details
 */
export function rollOutcome(
  stats: PlayerStats,
  relevantStats: StatName[],
  difficulty: number,
  roll?: number
): { tier: OutcomeTier; roll: number; adjustedRoll: number; statBonus: number; difficultyPenalty: number } {
  // Generate roll if not provided (for testing, roll can be injected)
  const actualRoll = roll ?? Math.floor(Math.random() * 100) + 1;

  // Calculate modifiers
  const statBonus = calculateStatBonus(stats, relevantStats);
  const difficultyPenalty = calculateDifficultyPenalty(difficulty);

  // Calculate adjusted roll
  const adjustedRoll = actualRoll + statBonus - difficultyPenalty;

  // Determine tier
  const tier = determineOutcomeTier(adjustedRoll);

  return {
    tier,
    roll: actualRoll,
    adjustedRoll,
    statBonus,
    difficultyPenalty
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
 * Calculate probability distribution for a given stat/difficulty combo
 * Returns approximate percentages for each tier
 */
export function calculateOutcomeProbabilities(
  statValue: number,
  difficulty: number
): Record<OutcomeTier, number> {
  const statBonus = Math.round(statValue / 3);
  const difficultyPenalty = Math.round(difficulty / 2);
  const modifier = statBonus - difficultyPenalty;

  // For each roll 1-100, determine the tier and count
  const counts: Record<OutcomeTier, number> = {
    catastrophic: 0,
    mixed: 0,
    okay: 0,
    best: 0
  };

  for (let roll = 1; roll <= 100; roll++) {
    const adjustedRoll = roll + modifier;
    const tier = determineOutcomeTier(adjustedRoll);
    counts[tier]++;
  }

  // Convert to percentages
  return {
    catastrophic: counts.catastrophic,
    mixed: counts.mixed,
    okay: counts.okay,
    best: counts.best
  };
}

/**
 * Check if player meets stat requirements for an activity
 * Requirements use BASE stat, not current
 */
export function meetsStatRequirements(
  stats: PlayerStats,
  requirements: Partial<Record<StatName, number>>
): { meets: boolean; unmet: Array<{ stat: StatName; required: number; actual: number }> } {
  const unmet: Array<{ stat: StatName; required: number; actual: number }> = [];

  for (const [statName, required] of Object.entries(requirements)) {
    if (required === undefined) continue;

    const stat = statName as StatName;
    // Use base stat for requirements
    const baseKey = `base${stat.charAt(0).toUpperCase() + stat.slice(1)}` as keyof PlayerStats;
    const actual = stats[baseKey] as number;

    if (actual < required) {
      unmet.push({ stat, required, actual });
    }
  }

  return {
    meets: unmet.length === 0,
    unmet
  };
}
