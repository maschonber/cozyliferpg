/**
 * Stat Service (Phase 2.5)
 * Pure functions for stat calculations - no database access
 */

import {
  StatName,
  PlayerArchetype,
  PlayerStats,
  StatTracking,
  StatChange
} from '../../../../shared/types';

// ===== Constants =====

/**
 * All stat names for iteration
 */
export const ALL_STATS: StatName[] = [
  'fitness', 'vitality', 'poise',
  'knowledge', 'creativity', 'ambition',
  'confidence', 'wit', 'empathy'
];

/**
 * Base stat cap (maximum base stat value)
 */
export const BASE_STAT_CAP = 100;

/**
 * Maximum gap between current and base
 */
export const MAX_CURRENT_GAP = 30;

/**
 * Stat category mapping
 */
export const STAT_CATEGORIES: Record<StatName, 'physical' | 'mental' | 'social'> = {
  fitness: 'physical',
  vitality: 'physical',
  poise: 'physical',
  knowledge: 'mental',
  creativity: 'mental',
  ambition: 'mental',
  confidence: 'social',
  wit: 'social',
  empathy: 'social'
};

// ===== Archetype Starting Stats =====

/**
 * Starting stat distributions by archetype (25/15/5)
 */
export const ARCHETYPE_STATS: Record<PlayerArchetype, Record<StatName, number>> = {
  athlete: {
    fitness: 25, vitality: 25,
    confidence: 15, ambition: 15, poise: 15,
    knowledge: 5, creativity: 5, wit: 5, empathy: 5
  },
  scholar: {
    knowledge: 25, creativity: 25,
    ambition: 15, wit: 15, vitality: 15,
    fitness: 5, confidence: 5, poise: 5, empathy: 5
  },
  social_butterfly: {
    confidence: 25, wit: 25, empathy: 25,
    poise: 15, vitality: 15,
    fitness: 5, knowledge: 5, creativity: 5, ambition: 5
  },
  artist: {
    creativity: 25, empathy: 25,
    poise: 15, wit: 15, vitality: 15,
    fitness: 5, ambition: 5, knowledge: 5, confidence: 5
  },
  professional: {
    ambition: 25, knowledge: 25,
    vitality: 15, confidence: 15, poise: 15,
    creativity: 5, empathy: 5, fitness: 5, wit: 5
  },
  balanced: {
    fitness: 15, vitality: 15, poise: 15,
    knowledge: 15, creativity: 15, ambition: 15,
    confidence: 15, wit: 15, empathy: 15
  }
};

// ===== Pure Functions =====

/**
 * Get starting stats for an archetype
 */
export function getStartingStats(archetype: PlayerArchetype): PlayerStats {
  const baseStats = ARCHETYPE_STATS[archetype];

  return {
    // Base stats
    baseFitness: baseStats.fitness,
    baseVitality: baseStats.vitality,
    basePoise: baseStats.poise,
    baseKnowledge: baseStats.knowledge,
    baseCreativity: baseStats.creativity,
    baseAmbition: baseStats.ambition,
    baseConfidence: baseStats.confidence,
    baseWit: baseStats.wit,
    baseEmpathy: baseStats.empathy,

    // Current stats start equal to base
    currentFitness: baseStats.fitness,
    currentVitality: baseStats.vitality,
    currentPoise: baseStats.poise,
    currentKnowledge: baseStats.knowledge,
    currentCreativity: baseStats.creativity,
    currentAmbition: baseStats.ambition,
    currentConfidence: baseStats.confidence,
    currentWit: baseStats.wit,
    currentEmpathy: baseStats.empathy
  };
}

/**
 * Get default stat tracking values
 */
export function getDefaultTracking(): StatTracking {
  return {
    minEnergyToday: 100,
    workStreak: 0,
    restStreak: 0,
    burnoutStreak: 0,
    lateNightStreak: 0,
    workedToday: false,
    hadCatastrophicFailureToday: false,
    statsTrainedToday: []
  };
}

/**
 * Apply diminishing returns to a stat gain
 * Formula: effectiveGain = baseGain × (1 - currentStat/150)
 */
export function applyDiminishingReturns(baseGain: number, currentStat: number): number {
  const multiplier = Math.max(0, 1 - currentStat / 150);
  return baseGain * multiplier;
}

/**
 * Cap current stat to base + MAX_CURRENT_GAP
 */
export function capCurrentStat(baseStat: number, currentStat: number): number {
  const maxCurrent = Math.min(baseStat + MAX_CURRENT_GAP, BASE_STAT_CAP + MAX_CURRENT_GAP);
  return Math.min(Math.max(currentStat, 0), maxCurrent);
}

/**
 * Calculate base stat growth based on current-base gap
 * Called during sleep
 */
export function calculateBaseGrowth(baseStat: number, currentStat: number): number {
  if (baseStat >= BASE_STAT_CAP) return 0;  // Already at cap

  const gap = currentStat - baseStat;

  if (gap >= 30) return 0.8;
  if (gap >= 20) return 0.5;
  if (gap >= 10) return 0.3;
  return 0;
}

/**
 * Calculate current stat decay toward base
 * Called during sleep for stats not trained today
 */
export function calculateCurrentDecay(
  baseStat: number,
  currentStat: number,
  wasTrainedToday: boolean
): number {
  if (wasTrainedToday) return 0;  // No decay if trained

  const gap = currentStat - baseStat;
  if (gap <= 0) return 0;  // Already at or below base

  // Higher gap = faster decay
  if (gap <= 10) return 0.5;
  if (gap <= 20) return 1.0;
  return 1.5;
}

/**
 * Apply stat change and return capped result
 */
export function applyStatChange(
  baseStat: number,
  currentStat: number,
  change: number
): number {
  const newCurrent = currentStat + change;
  return capCurrentStat(baseStat, newCurrent);
}

/**
 * Get base stat value from PlayerStats by name
 */
export function getBaseStat(stats: PlayerStats, statName: StatName): number {
  const key = `base${capitalize(statName)}` as keyof PlayerStats;
  return stats[key] as number;
}

/**
 * Get current stat value from PlayerStats by name
 */
export function getCurrentStat(stats: PlayerStats, statName: StatName): number {
  const key = `current${capitalize(statName)}` as keyof PlayerStats;
  return stats[key] as number;
}

/**
 * Set base stat value in PlayerStats by name
 */
export function setBaseStat(stats: PlayerStats, statName: StatName, value: number): PlayerStats {
  const key = `base${capitalize(statName)}` as keyof PlayerStats;
  return { ...stats, [key]: Math.min(value, BASE_STAT_CAP) };
}

/**
 * Set current stat value in PlayerStats by name (with capping)
 */
export function setCurrentStat(stats: PlayerStats, statName: StatName, value: number): PlayerStats {
  const baseStat = getBaseStat(stats, statName);
  const cappedValue = capCurrentStat(baseStat, value);
  const key = `current${capitalize(statName)}` as keyof PlayerStats;
  return { ...stats, [key]: cappedValue };
}

/**
 * Process daily stat changes during sleep
 * Returns updated stats and change records
 */
export function processDailyStatChanges(
  stats: PlayerStats,
  trainedStats: Set<StatName>
): { newStats: PlayerStats; changes: StatChange[] } {
  let newStats = { ...stats };
  const changes: StatChange[] = [];

  for (const statName of ALL_STATS) {
    const baseStat = getBaseStat(stats, statName);
    const currentStat = getCurrentStat(stats, statName);
    const wasTrained = trainedStats.has(statName);

    // Calculate base growth
    const baseGrowth = calculateBaseGrowth(baseStat, currentStat);
    const newBase = Math.min(baseStat + baseGrowth, BASE_STAT_CAP);

    // Calculate current decay
    const decay = calculateCurrentDecay(newBase, currentStat, wasTrained);
    let newCurrent = currentStat - decay;

    // Ensure current doesn't go below base
    newCurrent = Math.max(newCurrent, newBase);

    // Cap current
    newCurrent = capCurrentStat(newBase, newCurrent);

    // Record change if anything changed
    if (baseGrowth !== 0 || decay !== 0) {
      changes.push({
        stat: statName,
        previousBase: baseStat,
        newBase: newBase,
        previousCurrent: currentStat,
        newCurrent: newCurrent,
        baseDelta: baseGrowth,
        currentDelta: newCurrent - currentStat
      });
    }

    // Update stats
    newStats = setBaseStat(newStats, statName, newBase);
    newStats = setCurrentStat(newStats, statName, newCurrent);
  }

  return { newStats, changes };
}

/**
 * Apply a stat gain from an activity
 * Applies diminishing returns and caps the result
 */
export function applyActivityStatGain(
  stats: PlayerStats,
  statName: StatName,
  baseGain: number
): { newStats: PlayerStats; actualGain: number } {
  const currentStat = getCurrentStat(stats, statName);
  const baseStat = getBaseStat(stats, statName);

  // Apply diminishing returns
  const effectiveGain = applyDiminishingReturns(baseGain, currentStat);

  // Apply gain and cap
  const newCurrent = capCurrentStat(baseStat, currentStat + effectiveGain);
  const actualGain = newCurrent - currentStat;

  const newStats = setCurrentStat(stats, statName, newCurrent);

  return { newStats, actualGain };
}

/**
 * Apply multiple stat changes from an activity outcome
 */
export function applyStatEffects(
  stats: PlayerStats,
  effects: Partial<Record<StatName, number>>
): { newStats: PlayerStats; actualChanges: Partial<Record<StatName, number>> } {
  let newStats = { ...stats };
  const actualChanges: Partial<Record<StatName, number>> = {};

  for (const [statName, change] of Object.entries(effects)) {
    if (change === undefined || change === 0) continue;

    const stat = statName as StatName;

    if (change > 0) {
      // Positive gain - apply diminishing returns
      const result = applyActivityStatGain(newStats, stat, change);
      newStats = result.newStats;
      actualChanges[stat] = result.actualGain;
    } else {
      // Negative change - apply directly (no diminishing returns on penalties)
      const currentStat = getCurrentStat(newStats, stat);
      const baseStat = getBaseStat(newStats, stat);
      const newCurrent = Math.max(currentStat + change, baseStat); // Can't go below base
      newStats = setCurrentStat(newStats, stat, newCurrent);
      actualChanges[stat] = newCurrent - currentStat;
    }
  }

  return { newStats, actualChanges };
}

// ===== Helper Functions =====

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
