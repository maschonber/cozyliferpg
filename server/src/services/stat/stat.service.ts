/**
 * Stat Service (Phase 2.5)
 * Pure functions for stat calculations - no database access
 */

import {
  StatName,
  PlayerArchetype,
  PlayerStats,
  StatTracking,
  StatChange,
  StatChangeComponent
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
 * Offensive stats (can be trained actively during the day)
 * Subject to current decay if not trained
 */
export const OFFENSIVE_STATS: StatName[] = [
  'fitness', 'poise',
  'knowledge', 'creativity',
  'confidence', 'wit'
];

/**
 * Defensive stats (cannot be trained actively, only through lifestyle patterns)
 * NOT subject to current decay
 */
export const DEFENSIVE_STATS: StatName[] = [
  'vitality', 'ambition', 'empathy'
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
  },
  debug_advanced: {
    fitness: 50, vitality: 50, poise: 50,
    knowledge: 50, creativity: 50, ambition: 50,
    confidence: 50, wit: 50, empathy: 50
  },
  debug_master: {
    fitness: 80, vitality: 80, poise: 80,
    knowledge: 80, creativity: 80, ambition: 80,
    confidence: 80, wit: 80, empathy: 80
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
    endingEnergyToday: 100,
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
 * Calculate surplus conversion and decay (unified for all stats)
 * Called during sleep - converts 25% of surplus to base, decays 50% from current
 *
 * Formula:
 *   surplus = current - base
 *   newBase = base + (surplus × 0.25)
 *   newCurrent = current - (surplus × 0.5)
 *
 * Example: 30/46 → surplus=16 → base+4, current-8 → 34/38
 */
export function calculateSurplusConversion(
  baseStat: number,
  currentStat: number
): { baseGrowth: number; currentDecay: number } {
  const surplus = currentStat - baseStat;

  if (surplus <= 0) {
    // No surplus - no growth or decay
    return { baseGrowth: 0, currentDecay: 0 };
  }

  const baseGrowth = surplus * 0.25;
  const currentDecay = surplus * 0.5;

  // Respect base stat cap
  const cappedBaseGrowth = Math.min(baseGrowth, BASE_STAT_CAP - baseStat);

  return {
    baseGrowth: cappedBaseGrowth,
    currentDecay
  };
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
 * Returns updated stats, change records, and detailed breakdowns
 *
 * Unified system: For all stats, converts 25% of surplus to base growth,
 * decays 50% of surplus from current (applies after defensive stat changes)
 */
export function processDailyStatChanges(
  stats: PlayerStats,
  trainedStats: Set<StatName>
): {
  newStats: PlayerStats;
  changes: StatChange[];
  components: Map<StatName, StatChangeComponent[]>;
} {
  let newStats = { ...stats };
  const changes: StatChange[] = [];
  const components = new Map<StatName, StatChangeComponent[]>();

  for (const statName of ALL_STATS) {
    const baseStat = getBaseStat(stats, statName);
    const currentStat = getCurrentStat(stats, statName);
    const statComponents: StatChangeComponent[] = [];

    // Calculate surplus conversion (applies to ALL stats uniformly)
    const { baseGrowth, currentDecay } = calculateSurplusConversion(baseStat, currentStat);

    // Apply base growth
    const newBase = Math.min(baseStat + baseGrowth, BASE_STAT_CAP);

    if (baseGrowth > 0) {
      const surplus = currentStat - baseStat;
      statComponents.push({
        source: 'surplus_to_base',
        category: 'Surplus Conversion',
        description: '25% of surplus converted to base',
        value: baseGrowth,
        details: `Surplus: ${surplus.toFixed(1)} → Base +${baseGrowth.toFixed(2)}`
      });
    }

    // Apply current decay
    let newCurrent = currentStat - currentDecay;

    if (currentDecay > 0) {
      const surplus = currentStat - baseStat;
      statComponents.push({
        source: 'surplus_decay',
        category: 'Surplus Decay',
        description: '50% of surplus decayed from current',
        value: -currentDecay,
        details: `Surplus: ${surplus.toFixed(1)} → Current -${currentDecay.toFixed(2)}`
      });
    }

    // Cap current (can go below base due to defensive/mixed stat penalties)
    // Only enforce minimum of 0 and maximum of base + MAX_CURRENT_GAP
    newCurrent = capCurrentStat(newBase, newCurrent);

    // Record change if anything changed
    if (baseGrowth !== 0 || currentDecay !== 0) {
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

    // Store components if any exist
    if (statComponents.length > 0) {
      components.set(statName, statComponents);
    }

    // Update stats
    newStats = setBaseStat(newStats, statName, newBase);
    newStats = setCurrentStat(newStats, statName, newCurrent);
  }

  return { newStats, changes, components };
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
