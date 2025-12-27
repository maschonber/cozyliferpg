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
} from '../../../../shared/types';
import {
  OUTCOME_RELATIONSHIP_SCALING,
} from './config';

// ===== Dynamic Difficulty Calculation =====

/**
 * Calculate effective difficulty for an activity
 *
 * Dynamic difficulty calculation based on relationship and traits.
 * Note: Emotion-based difficulty has been removed - will be re-implemented
 * with the new Plutchik emotion system later.
 *
 * Formula:
 * effectiveDifficulty = baseDifficulty
 *   + relationshipModifier // -15 to +15 based on relationship level
 *   + traitBonus           // -20 to +20 from NPC trait matching
 *
 * @param baseDifficulty - Activity base difficulty
 * @param relationshipDifficultyMod - Relationship difficulty modifier (from relationship service)
 * @param npcTraitBonus - Combined trait bonus (from trait service)
 * @param individualTraits - Optional detailed trait contributions
 * @returns Complete difficulty calculation with breakdown
 */
export function calculateDynamicDifficulty(
  baseDifficulty: number,
  relationshipDifficultyMod: number,
  npcTraitBonus: number,
  individualTraits?: TraitContribution[]
): DifficultyBreakdown {
  // Relationship modifier (already calculated by relationship service)
  const relationshipModifier = relationshipDifficultyMod;

  // Trait bonus (negate because config uses positive = easier, but we add to difficulty)
  const traitBonus = -npcTraitBonus;

  // Calculate final difficulty (can go negative, resulting in DC below 100)
  const finalDifficulty =
    baseDifficulty +
    relationshipModifier +
    traitBonus;

  // Negate individual trait contributions for display (positive = reduces difficulty)
  const negatedIndividualTraits = individualTraits?.map(trait => ({
    ...trait,
    bonus: -trait.bonus
  }));

  return {
    baseDifficulty,
    relationshipModifier,
    traitBonus,
    traitBreakdown: {
      npcTraitBonus: -npcTraitBonus,  // Negate for display (positive = reduces difficulty)
      individualTraits: negatedIndividualTraits,
    },
    finalDifficulty,
  };
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

  return breakdown;
}
