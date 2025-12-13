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
 * - Main money × 1.75 (if specified)
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

  // Apply main money gain (for work activities)
  if (profile.mainMoneyGain !== undefined) {
    outcome.additionalMoneyCost = Math.round(profile.mainMoneyGain * OUTCOME_SCALING.best.mainMultiplier);
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
 * - Main money × 1.0 (if specified)
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

  // Apply main money gain (for work activities)
  if (profile.mainMoneyGain !== undefined) {
    outcome.additionalMoneyCost = Math.round(profile.mainMoneyGain * OUTCOME_SCALING.okay.mainMultiplier);
  }

  return outcome;
}

/**
 * Generate Mixed outcome:
 * - Main stat × 0.5
 * - Main money × 0.5 (if specified)
 * - 1 stat penalty + optionally 1 resource cost
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

  // Apply reduced main money gain (for work activities)
  if (profile.mainMoneyGain !== undefined) {
    outcome.additionalMoneyCost = Math.round(profile.mainMoneyGain * OUTCOME_SCALING.mixed.mainMultiplier);
  }

  // Apply negative effects
  if (profile.negativeEffects) {
    const effects = profile.negativeEffects;

    // ALWAYS apply 1 stat penalty if stats are defined
    if (effects.stats && effects.stats.length > 0) {
      const selectedStats = selectRandom(effects.stats, 1);
      for (const stat of selectedStats) {
        outcome.statEffects[stat] = (outcome.statEffects[stat] || 0) - (effects.statPenalty || 1);
      }
    }

    // OPTIONALLY add 1 resource cost
    const availableResourceCosts: Array<'energy' | 'money' | 'time'> = [];
    if (effects.energyCost) availableResourceCosts.push('energy');
    if (effects.moneyCost) availableResourceCosts.push('money');
    if (effects.timeCost) availableResourceCosts.push('time');

    if (availableResourceCosts.length > 0) {
      const selectedResource = selectRandom(availableResourceCosts, 1);
      for (const resourceType of selectedResource) {
        if (resourceType === 'energy') {
          outcome.additionalEnergyCost = -Math.round(effects.energyCost || 0);
        } else if (resourceType === 'money') {
          outcome.additionalMoneyCost += -Math.round(effects.moneyCost || 0);
        } else if (resourceType === 'time') {
          outcome.additionalTimeCost = Math.round(effects.timeCost || 0);
        }
      }
    }
  }

  return outcome;
}

/**
 * Generate Catastrophic outcome:
 * - Main stat × 0 (no gain)
 * - Main money × 0 (if specified - no money earned)
 * - 2 stat penalties + all available resource costs (amplified)
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
  // NO main money gains on catastrophic (for work activities - you don't get paid!)

  // Apply multiple negative effects
  if (profile.negativeEffects) {
    const effects = profile.negativeEffects;

    // ALWAYS apply 2 stat penalties if stats are defined (or all if pool is small)
    if (effects.stats && effects.stats.length > 0) {
      const penaltyCount = Math.min(2, effects.stats.length);
      const selectedStats = selectRandom(effects.stats, penaltyCount);
      for (const stat of selectedStats) {
        outcome.statEffects[stat] = (outcome.statEffects[stat] || 0) - (effects.statPenalty || 1) * 1.5;
      }
    }

    // ALWAYS apply ALL resource costs at 1.5x amplification
    if (effects.energyCost) {
      outcome.additionalEnergyCost = -Math.round((effects.energyCost || 0) * 1.5);
    }
    if (effects.moneyCost) {
      outcome.additionalMoneyCost = -Math.round((effects.moneyCost || 0) * 1.5);
    }
    if (effects.timeCost) {
      outcome.additionalTimeCost = Math.round((effects.timeCost || 0) * 1.5);
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
