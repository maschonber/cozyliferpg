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
  EmotionType,
  EmotionIntensity,
  EmotionValues,
  NPCEmotionState,
  RelationshipAxes,
  RelationshipState,
  OutcomeTier,
  NPCTrait,
  NPCArchetype,
  PlayerArchetype,
  ActivityCategory,
  DifficultyBreakdown,
} from '../../../../shared/types';
import {
  ACTIVITY_EMOTION_EFFECTS,
  EMOTION_DIFFICULTY_BASE,
  EMOTION_INTENSITY_MULTIPLIERS,
  OUTCOME_RELATIONSHIP_SCALING,
  OUTCOME_EMOTION_SCALING,
  STREAK_DIFFICULTY_MODIFIERS,
  POSITIVE_OUTCOME_TIERS,
  NEGATIVE_OUTCOME_TIERS,
} from './config';
import { getDominantEmotions } from '../emotion';

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

// ===== Emotion-Based Difficulty Modifiers =====

/**
 * Get difficulty modifier based on NPC emotion state
 *
 * Task 6 Requirement 2: Emotion-based difficulty
 * - Positive dominant emotion → easier (negative modifier)
 * - Negative dominant emotion → harder (positive modifier)
 * - Intensity affects magnitude
 *
 * @param emotionState - Current NPC emotion state
 * @returns Difficulty modifier (-20 to +30)
 *
 * @example
 * // NPC is feeling intensely joyful
 * getEmotionDifficultyModifier(state) // → -10 (much easier)
 *
 * // NPC is feeling intensely angry
 * getEmotionDifficultyModifier(state) // → +30 (much harder)
 */
export function getEmotionDifficultyModifier(emotionState: NPCEmotionState): number {
  // Get dominant emotions
  const { primary } = getDominantEmotions(emotionState);

  // Get base modifier for this emotion type
  const baseModifier = EMOTION_DIFFICULTY_BASE[primary.emotion];

  // Get intensity multiplier
  const intensityMultiplier = EMOTION_INTENSITY_MULTIPLIERS[primary.intensity];

  // Calculate final modifier
  const modifier = Math.round(baseModifier * intensityMultiplier);

  // Clamp to range [-20, +30]
  return Math.max(-20, Math.min(30, modifier));
}

// ===== Dynamic Difficulty Calculation =====

/**
 * Calculate effective difficulty for an activity
 *
 * Task 6 Requirement 1: Dynamic difficulty calculation
 *
 * Formula:
 * effectiveDifficulty = baseDifficulty
 *   + emotionModifier      // -20 to +30 based on NPC emotion
 *   + relationshipModifier // -15 to +15 based on relationship level
 *   + traitBonus           // -20 to +20 from trait/archetype matching
 *   + streakModifier       // -10 to +10 based on recent interaction history
 *
 * @param baseDifficulty - Activity base difficulty
 * @param emotionState - NPC current emotions
 * @param relationshipAxes - Relationship axes values
 * @param relationshipState - Current relationship state
 * @param relationshipDifficultyMod - Relationship difficulty modifier (from relationship service)
 * @param traitBonus - Combined trait/archetype bonus (from trait service)
 * @param streak - Interaction streak data
 * @returns Complete difficulty calculation with breakdown
 *
 * @example
 * const diff = calculateDynamicDifficulty(
 *   40,              // base difficulty
 *   emotionState,    // NPC is happy
 *   axes,            // good relationship
 *   'friend',        // friendship state
 *   -8,              // friend bonus
 *   5,               // matching traits
 *   { consecutivePositive: 4, ... } // on a roll
 * );
 * // Result: { finalDifficulty: 25, ... } (easier due to all positive factors)
 */
export function calculateDynamicDifficulty(
  baseDifficulty: number,
  emotionState: NPCEmotionState,
  relationshipAxes: RelationshipAxes,
  relationshipState: RelationshipState,
  relationshipDifficultyMod: number,
  npcTraitBonus: number,
  archetypeBonus: number,
  streak?: InteractionStreak
): DifficultyBreakdown {
  // Calculate emotion modifier
  const emotionModifier = getEmotionDifficultyModifier(emotionState);

  // Relationship modifier (already calculated by relationship service)
  const relationshipModifier = relationshipDifficultyMod;

  // Combined trait bonus
  const traitBonus = npcTraitBonus + archetypeBonus;

  // Streak modifier
  const streakModifier = streak ? getStreakModifier(streak) : 0;

  // Calculate final difficulty
  const finalDifficulty = Math.max(
    0,
    baseDifficulty +
      emotionModifier +
      relationshipModifier +
      traitBonus +
      streakModifier
  );

  return {
    baseDifficulty,
    emotionModifier,
    relationshipModifier,
    traitBonus,
    traitBreakdown: {
      npcTraitBonus,
      archetypeBonus,
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
 * Calculate emotion changes from activity and outcome
 *
 * Task 6 Requirement 4: Activity-emotion mapping
 * - Combines base activity emotion effects with outcome-based modifiers
 * - Activity-specific effects scaled by outcome
 * - General outcome emotion effects applied
 *
 * @param activityId - Activity identifier
 * @param outcome - Activity outcome tier
 * @returns Combined emotion effects
 *
 * @example
 * calculateEmotionEffects('flirt_playfully', 'best')
 * // → { romantic: 35, excitement: 25, joy: 25, anxiety: -2 }
 * // (base flirt effects + best outcome bonuses)
 */
export function calculateEmotionEffects(
  activityId: string,
  outcome: OutcomeTier
): Partial<EmotionValues> {
  // Get base activity emotion effects
  const baseEffects = ACTIVITY_EMOTION_EFFECTS[activityId] ?? {};

  // Get outcome-based emotion modifiers
  const outcomeEffects = OUTCOME_EMOTION_SCALING[outcome];

  // Scale base activity effects by outcome
  const scaledBaseEffects: Partial<EmotionValues> = {};
  const outcomeScaling = OUTCOME_RELATIONSHIP_SCALING[outcome]; // Reuse relationship scaling

  for (const [emotion, value] of Object.entries(baseEffects)) {
    const emotionKey = emotion as EmotionType;
    scaledBaseEffects[emotionKey] = Math.round(value * outcomeScaling);
  }

  // Combine scaled activity effects with outcome effects
  const combined: Partial<EmotionValues> = { ...scaledBaseEffects };

  for (const [emotion, value] of Object.entries(outcomeEffects)) {
    const emotionKey = emotion as EmotionType;
    combined[emotionKey] = (combined[emotionKey] ?? 0) + value;
  }

  return combined;
}

/**
 * Get complete activity effects package
 *
 * Combines relationship and emotion effects based on activity and outcome.
 * This is the main function to call when applying activity results.
 *
 * @param activityId - Activity identifier
 * @param baseRelationshipEffects - Base relationship axis effects from activity definition
 * @param outcome - Activity outcome tier
 * @returns Complete effects package
 *
 * @example
 * const effects = getActivityEffects('have_coffee', { affection: 10 }, 'best');
 * // → {
 * //   relationshipEffects: { affection: 15 },
 * //   emotionEffects: { joy: 25, affection: 18, calm: 12, ... }
 * // }
 */
export function getActivityEffects(
  activityId: string,
  baseRelationshipEffects: Partial<RelationshipAxes>,
  outcome: OutcomeTier
): {
  relationshipEffects: Partial<RelationshipAxes>;
  emotionEffects: Partial<EmotionValues>;
} {
  return {
    relationshipEffects: scaleRelationshipEffects(baseRelationshipEffects, outcome),
    emotionEffects: calculateEmotionEffects(activityId, outcome),
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

  if (calculation.emotionModifier !== undefined && calculation.emotionModifier !== 0) {
    breakdown.push({
      source: 'Emotion',
      modifier: calculation.emotionModifier,
      description:
        calculation.emotionModifier > 0
          ? 'NPC is in a negative emotional state'
          : 'NPC is in a positive emotional state',
    });
  }

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
