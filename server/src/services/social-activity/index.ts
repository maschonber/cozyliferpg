/**
 * Social Activity Service
 *
 * Orchestrates activity execution by combining emotion, relationship, trait, and outcome systems.
 * Pure functions for difficulty calculation and outcome effects.
 *
 * Architecture: Facade pattern - coordinates other services but delegates domain logic.
 *
 * Task 6: Social Activity Integration
 */

import {
  RelationshipAxes,
  OutcomeTier,
  DifficultyBreakdown,
  TraitContribution,
  ArchetypeContribution,
} from '../../../../shared/types';
import {
  OUTCOME_RELATIONSHIP_SCALING,
  STREAK_DIFFICULTY_MODIFIERS,
  POSITIVE_OUTCOME_TIERS,
} from './config';

// ===== Types =====

/**
 * Interaction streak tracking
 */
export interface InteractionStreak {
  consecutivePositive: number;  // Count of consecutive positive outcomes
  consecutiveNegative: number;  // Count of consecutive negative outcomes
  lastInteraction: string;       // ISO timestamp of last interaction
  lastDay: number;               // Day number of last interaction
}

// Note: DifficultyCalculation interface moved to shared/types.ts as DifficultyBreakdown
// for consistency across solo and social activities

// ===== Dynamic Difficulty Calculation =====

/**
 * Calculate effective difficulty for an activity
 *
 * Dynamic difficulty calculation based on relationship, traits, and streaks.
 * Note: Emotion-based difficulty has been removed - will be re-implemented
 * with the new Plutchik emotion system later.
 *
 * Formula:
 * effectiveDifficulty = baseDifficulty
 *   + relationshipModifier // -15 to +15 based on relationship level
 *   + traitBonus           // -20 to +20 from trait/archetype matching
 *   + streakModifier       // -10 to +10 based on recent interaction history
 *
 * @param baseDifficulty - Activity base difficulty
 * @param relationshipDifficultyMod - Relationship difficulty modifier (from relationship service)
 * @param npcTraitBonus - Combined trait bonus (from trait service)
 * @param archetypeBonus - Combined archetype bonus (from trait service)
 * @param streak - Interaction streak data
 * @param individualTraits - Optional detailed trait contributions
 * @param archetypeDetails - Optional detailed archetype breakdown
 * @returns Complete difficulty calculation with breakdown
 */
export function calculateDynamicDifficulty(
  baseDifficulty: number,
  relationshipDifficultyMod: number,
  npcTraitBonus: number,
  archetypeBonus: number,
  streak?: InteractionStreak,
  individualTraits?: TraitContribution[],
  archetypeDetails?: ArchetypeContribution
): DifficultyBreakdown {
  // Relationship modifier (already calculated by relationship service)
  const relationshipModifier = relationshipDifficultyMod;

  // Combined trait bonus (negate because config uses positive = easier, but we add to difficulty)
  const traitBonus = -(npcTraitBonus + archetypeBonus);

  // Streak modifier
  const streakModifier = streak ? getStreakModifier(streak) : 0;

  // Calculate final difficulty
  const finalDifficulty = Math.max(
    0,
    baseDifficulty +
      relationshipModifier +
      traitBonus +
      streakModifier
  );

  // Negate individual trait contributions for display (positive = reduces difficulty)
  const negatedIndividualTraits = individualTraits?.map(trait => ({
    ...trait,
    bonus: -trait.bonus
  }));

  // Negate archetype details for display (positive = reduces difficulty)
  const negatedArchetypeDetails = archetypeDetails ? {
    ...archetypeDetails,
    matchBonus: -archetypeDetails.matchBonus,
    activityAffinityBonus: -archetypeDetails.activityAffinityBonus,
    totalBonus: -archetypeDetails.totalBonus
  } : undefined;

  return {
    baseDifficulty,
    relationshipModifier,
    traitBonus,
    traitBreakdown: {
      npcTraitBonus: -npcTraitBonus,  // Negate for display (positive = reduces difficulty)
      archetypeBonus: -archetypeBonus, // Negate for display (positive = reduces difficulty)
      individualTraits: negatedIndividualTraits,
      archetypeDetails: negatedArchetypeDetails,
    },
    streakModifier,
    finalDifficulty,
  };
}

// ===== Streak System =====

/**
 * Get difficulty modifier from interaction streak
 *
 * Task 6 Requirement 5: Streak tracking
 * - Positive streak → NPC "warming up" (easier, negative modifier)
 * - Negative streak → NPC "pulling away" (harder, positive modifier)
 *
 * @param streak - Streak data
 * @returns Difficulty modifier (-10 to +10)
 *
 * @example
 * getStreakModifier({ consecutivePositive: 4, consecutiveNegative: 0, ... })
 * // → -2 (NPC is warming up, 4 interactions / 2 = -2)
 */
export function getStreakModifier(streak: InteractionStreak): number {
  const { consecutivePositive, consecutiveNegative } = streak;
  const { streakPerPoint, maxPositiveBonus, maxNegativePenalty } = STREAK_DIFFICULTY_MODIFIERS;

  // Positive streak: easier (negative modifier)
  if (consecutivePositive > 0) {
    const modifier = -Math.floor(consecutivePositive / streakPerPoint);
    return Math.max(maxPositiveBonus, modifier);
  }

  // Negative streak: harder (positive modifier)
  if (consecutiveNegative > 0) {
    const modifier = Math.floor(consecutiveNegative / streakPerPoint);
    return Math.min(maxNegativePenalty, modifier);
  }

  return 0;
}

/**
 * Update streak based on activity outcome
 *
 * @param currentStreak - Current streak data
 * @param outcome - Activity outcome tier
 * @param currentDay - Current game day number
 * @returns Updated streak data
 *
 * @example
 * const newStreak = updateStreak(streak, 'best', 5);
 * // Increments consecutivePositive, resets consecutiveNegative
 */
export function updateStreak(
  currentStreak: InteractionStreak | undefined,
  outcome: OutcomeTier,
  currentDay: number
): InteractionStreak {
  const now = new Date().toISOString();

  // Initialize streak if doesn't exist
  if (!currentStreak) {
    const isPositive = POSITIVE_OUTCOME_TIERS.includes(outcome);
    return {
      consecutivePositive: isPositive ? 1 : 0,
      consecutiveNegative: isPositive ? 0 : 1,
      lastInteraction: now,
      lastDay: currentDay,
    };
  }

  // Check if streak should reset
  if (shouldResetStreak(currentStreak, currentDay)) {
    const isPositive = POSITIVE_OUTCOME_TIERS.includes(outcome);
    return {
      consecutivePositive: isPositive ? 1 : 0,
      consecutiveNegative: isPositive ? 0 : 1,
      lastInteraction: now,
      lastDay: currentDay,
    };
  }

  // Update existing streak
  const isPositive = POSITIVE_OUTCOME_TIERS.includes(outcome);
  const maxStreak = STREAK_DIFFICULTY_MODIFIERS.maxStreakCount;

  if (isPositive) {
    return {
      consecutivePositive: Math.min(maxStreak, currentStreak.consecutivePositive + 1),
      consecutiveNegative: 0,  // Reset negative streak
      lastInteraction: now,
      lastDay: currentDay,
    };
  } else {
    return {
      consecutivePositive: 0,  // Reset positive streak
      consecutiveNegative: Math.min(maxStreak, currentStreak.consecutiveNegative + 1),
      lastInteraction: now,
      lastDay: currentDay,
    };
  }
}

/**
 * Check if streak should be reset
 *
 * @param streak - Current streak
 * @param currentDay - Current game day
 * @returns True if streak should reset
 */
export function shouldResetStreak(streak: InteractionStreak, currentDay: number): boolean {
  // Reset on new day
  if (currentDay !== streak.lastDay) {
    return true;
  }

  // Reset if time gap too large
  const lastInteractionDate = new Date(streak.lastInteraction);
  const now = new Date();
  const hoursSince = (now.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60);

  if (hoursSince > 24) {
    return true;
  }

  return false;
}

// ===== Activity Outcome Effects =====

/**
 * Calculate relationship axis changes from activity outcome
 *
 * Task 6 Requirement 3: Activity outcome effects
 * - Scales base relationship effects by outcome tier
 * - Best: 1.5x, Okay: 1.0x, Mixed: 0.3x, Catastrophic: -0.5x
 *
 * @param baseEffects - Base relationship effects from activity
 * @param outcome - Activity outcome tier
 * @returns Scaled relationship effects
 *
 * @example
 * scaleRelationshipEffects({ affection: 10, trust: 5 }, 'best')
 * // → { affection: 15, trust: 7.5 } (1.5x multiplier)
 */
export function scaleRelationshipEffects(
  baseEffects: Partial<RelationshipAxes>,
  outcome: OutcomeTier
): Partial<RelationshipAxes> {
  const scaling = OUTCOME_RELATIONSHIP_SCALING[outcome];

  const scaled: Partial<RelationshipAxes> = {};

  if (baseEffects.trust !== undefined) {
    scaled.trust = Math.round(baseEffects.trust * scaling);
  }
  if (baseEffects.affection !== undefined) {
    scaled.affection = Math.round(baseEffects.affection * scaling);
  }
  if (baseEffects.desire !== undefined) {
    scaled.desire = Math.round(baseEffects.desire * scaling);
  }

  return scaled;
}

/**
 * Get complete activity effects package
 *
 * Returns scaled relationship effects based on activity and outcome.
 * Note: Emotion effects have been removed - will be re-implemented
 * with the new Plutchik emotion system later.
 *
 * @param baseRelationshipEffects - Base relationship axis effects from activity definition
 * @param outcome - Activity outcome tier
 * @returns Scaled relationship effects
 */
export function getActivityEffects(
  baseRelationshipEffects: Partial<RelationshipAxes>,
  outcome: OutcomeTier
): {
  relationshipEffects: Partial<RelationshipAxes>;
} {
  return {
    relationshipEffects: scaleRelationshipEffects(baseRelationshipEffects, outcome),
  };
}

// ===== Display Functions =====

/**
 * Get human-readable difficulty breakdown for UI display
 *
 * @param calculation - Difficulty calculation
 * @returns Array of modifier descriptions
 */
export function getDifficultyBreakdown(calculation: DifficultyBreakdown): Array<{
  source: string;
  modifier: number;
  description: string;
}> {
  const breakdown: Array<{ source: string; modifier: number; description: string }> = [];

  breakdown.push({
    source: 'Base',
    modifier: calculation.baseDifficulty,
    description: 'Activity base difficulty',
  });

  if (calculation.relationshipModifier !== undefined && calculation.relationshipModifier !== 0) {
    breakdown.push({
      source: 'Relationship',
      modifier: calculation.relationshipModifier,
      description:
        calculation.relationshipModifier > 0
          ? 'Strained relationship'
          : 'Good relationship',
    });
  }

  if (calculation.traitBonus !== undefined && calculation.traitBonus !== 0) {
    breakdown.push({
      source: 'Traits',
      modifier: calculation.traitBonus,
      description:
        calculation.traitBonus > 0
          ? 'NPC traits make this harder'
          : 'NPC traits make this easier',
    });
  }

  if (calculation.streakModifier !== undefined && calculation.streakModifier !== 0) {
    breakdown.push({
      source: 'Streak',
      modifier: calculation.streakModifier,
      description:
        calculation.streakModifier > 0
          ? 'Recent negative interactions'
          : 'Recent positive interactions',
    });
  }

  return breakdown;
}
