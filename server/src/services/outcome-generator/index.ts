/**
 * Outcome Generator Service (Phase 2.5.3)
 * Generates varied activity outcomes based on tier and outcome profile
 */

import {
  StatName,
  OutcomeTier,
  ActivityOutcomeProfile
} from '../../../../shared/types';

// ===== Constants =====

/**
 * Standard outcome scaling rules
 */
export const OUTCOME_SCALING = {
  best: {
    mainMultiplier: 1.75,
    secondaryCount: 2  // Pick 2 random from pool
  },
  okay: {
    mainMultiplier: 1.0
  },
  mixed: {
    mainMultiplier: 0.5,
    negativeCount: 1  // Pick 1 negative effect
  },
  catastrophic: {
    mainMultiplier: 0,
    negativeCount: 2  // Pick 2 negative effects
  }
};

// ===== Helper Functions =====

/**
 * Randomly select N unique items from an array
 */
function selectRandom<T>(array: T[], count: number): T[] {
  if (!array || array.length === 0) return [];

  const selected: T[] = [];
  const available = [...array];
  const selectCount = Math.min(count, available.length);

  for (let i = 0; i < selectCount; i++) {
    const index = Math.floor(Math.random() * available.length);
    selected.push(available[index]);
    available.splice(index, 1);
  }

  return selected;
}

// ===== Outcome Generation =====

/**
 * Generated outcome effects for a specific tier
 */
export interface GeneratedOutcome {
  statEffects: Partial<Record<StatName, number>>;
  additionalEnergyCost: number;
  additionalMoneyCost: number;
  additionalTimeCost: number;
  friendshipMultiplier: number;  // For relationship effects
  romanceMultiplier: number;
}

/**
 * Generate outcome effects based on tier and profile
 */
export function generateOutcome(
  tier: OutcomeTier,
  profile: ActivityOutcomeProfile
): GeneratedOutcome {
  const outcome: GeneratedOutcome = {
    statEffects: {},
    additionalEnergyCost: 0,
    additionalMoneyCost: 0,
    additionalTimeCost: 0,
    friendshipMultiplier: 1.0,
    romanceMultiplier: 1.0
  };

  switch (tier) {
    case 'best':
      return generateBestOutcome(profile);

    case 'okay':
      return generateOkayOutcome(profile);

    case 'mixed':
      return generateMixedOutcome(profile);

    case 'catastrophic':
      return generateCatastrophicOutcome(profile);

    default:
      return outcome;
  }
}

/**
 * Generate Best outcome:
 * - Main stat × 1.75
 * - 2 random secondary stats
 * - Relationship effects × 1.5
 */
function generateBestOutcome(profile: ActivityOutcomeProfile): GeneratedOutcome {
  const outcome: GeneratedOutcome = {
    statEffects: {},
    additionalEnergyCost: 0,
    additionalMoneyCost: 0,
    additionalTimeCost: 0,
    friendshipMultiplier: 1.5,
    romanceMultiplier: 1.5
  };

  // Apply main stat gains
  const mainGain = profile.mainStatGain * OUTCOME_SCALING.best.mainMultiplier;
  for (const stat of profile.mainStats) {
    outcome.statEffects[stat] = mainGain;
  }

  // Apply secondary stat gains
  if (profile.secondaryStats && profile.secondaryStats.length > 0 && profile.secondaryStatGain) {
    const selectedSecondary = selectRandom(
      profile.secondaryStats,
      OUTCOME_SCALING.best.secondaryCount
    );

    for (const stat of selectedSecondary) {
      outcome.statEffects[stat] = (outcome.statEffects[stat] || 0) + profile.secondaryStatGain;
    }
  }

  return outcome;
}

/**
 * Generate Okay outcome:
 * - Main stat × 1.0
 * - No secondary stats
 * - Relationship effects × 1.0
 */
function generateOkayOutcome(profile: ActivityOutcomeProfile): GeneratedOutcome {
  const outcome: GeneratedOutcome = {
    statEffects: {},
    additionalEnergyCost: 0,
    additionalMoneyCost: 0,
    additionalTimeCost: 0,
    friendshipMultiplier: 1.0,
    romanceMultiplier: 1.0
  };

  // Apply main stat gains
  const mainGain = profile.mainStatGain * OUTCOME_SCALING.okay.mainMultiplier;
  for (const stat of profile.mainStats) {
    outcome.statEffects[stat] = mainGain;
  }

  return outcome;
}

/**
 * Generate Mixed outcome:
 * - Main stat × 0.5
 * - 1 random negative effect (stat penalty OR resource cost)
 * - Relationship effects × 0.3 (reduced but still positive)
 */
function generateMixedOutcome(profile: ActivityOutcomeProfile): GeneratedOutcome {
  const outcome: GeneratedOutcome = {
    statEffects: {},
    additionalEnergyCost: 0,
    additionalMoneyCost: 0,
    additionalTimeCost: 0,
    friendshipMultiplier: 0.3,  // Reduced but positive
    romanceMultiplier: 0.3
  };

  // Apply reduced main stat gains
  const mainGain = profile.mainStatGain * OUTCOME_SCALING.mixed.mainMultiplier;
  for (const stat of profile.mainStats) {
    outcome.statEffects[stat] = mainGain;
  }

  // Apply negative effects
  if (profile.negativeEffects) {
    const effects = profile.negativeEffects;
    const availableNegatives: Array<'stat' | 'energy' | 'money' | 'time'> = [];

    if (effects.stats && effects.stats.length > 0) availableNegatives.push('stat');
    if (effects.energyCost) availableNegatives.push('energy');
    if (effects.moneyCost) availableNegatives.push('money');
    if (effects.timeCost) availableNegatives.push('time');

    // Select 1 random negative effect
    const selectedNegatives = selectRandom(availableNegatives, OUTCOME_SCALING.mixed.negativeCount);

    for (const negType of selectedNegatives) {
      if (negType === 'stat' && effects.stats) {
        const selectedStats = selectRandom(effects.stats, 1);
        for (const stat of selectedStats) {
          outcome.statEffects[stat] = (outcome.statEffects[stat] || 0) - (effects.statPenalty || 1);
        }
      } else if (negType === 'energy') {
        outcome.additionalEnergyCost = -(effects.energyCost || 0);
      } else if (negType === 'money') {
        outcome.additionalMoneyCost = -(effects.moneyCost || 0);
      } else if (negType === 'time') {
        outcome.additionalTimeCost = effects.timeCost || 0;
      }
    }
  }

  return outcome;
}

/**
 * Generate Catastrophic outcome:
 * - Main stat × 0 (no gain)
 * - 2 random negative effects (stat penalties AND/OR resource costs)
 * - Relationship effects × -0.5 (damages relationship!)
 */
function generateCatastrophicOutcome(profile: ActivityOutcomeProfile): GeneratedOutcome {
  const outcome: GeneratedOutcome = {
    statEffects: {},
    additionalEnergyCost: 0,
    additionalMoneyCost: 0,
    additionalTimeCost: 0,
    friendshipMultiplier: -0.5,  // Negative! Damages relationship
    romanceMultiplier: -0.5
  };

  // NO main stat gains on catastrophic

  // Apply multiple negative effects
  if (profile.negativeEffects) {
    const effects = profile.negativeEffects;
    const availableNegatives: Array<'stat' | 'energy' | 'money' | 'time'> = [];

    if (effects.stats && effects.stats.length > 0) availableNegatives.push('stat');
    if (effects.energyCost) availableNegatives.push('energy');
    if (effects.moneyCost) availableNegatives.push('money');
    if (effects.timeCost) availableNegatives.push('time');

    // Select 2 random negative effects
    const selectedNegatives = selectRandom(
      availableNegatives,
      OUTCOME_SCALING.catastrophic.negativeCount
    );

    for (const negType of selectedNegatives) {
      if (negType === 'stat' && effects.stats) {
        // For catastrophic, apply larger penalty and potentially multiple stats
        const selectedStats = selectRandom(effects.stats, 2);
        for (const stat of selectedStats) {
          outcome.statEffects[stat] = (outcome.statEffects[stat] || 0) - (effects.statPenalty || 1) * 1.5;
        }
      } else if (negType === 'energy') {
        outcome.additionalEnergyCost = -(effects.energyCost || 0) * 1.5;
      } else if (negType === 'money') {
        outcome.additionalMoneyCost = -(effects.moneyCost || 0) * 1.5;
      } else if (negType === 'time') {
        outcome.additionalTimeCost = (effects.timeCost || 0) * 1.5;
      }
    }
  }

  return outcome;
}

/**
 * Generate generic outcome description
 */
export function generateOutcomeDescription(
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
