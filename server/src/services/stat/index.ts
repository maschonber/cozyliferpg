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
 * Calculate defensive stat pull toward base
 * Called during sleep for defensive stats (after defensive growth is applied)
 * Always pulls toward base regardless of training
 */
export function calculateDefensiveStatPull(
  baseStat: number,
  currentStat: number
): number {
  const gap = currentStat - baseStat;
  if (gap <= 0) return 0;  // Already at or below base

  // Same pull rate as offensive stat decay
  // Higher gap = faster pull
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
 * Returns updated stats, change records, and detailed breakdowns
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
    const wasTrained = trainedStats.has(statName);
    const isDefensiveStat = DEFENSIVE_STATS.includes(statName);
    const statComponents: StatChangeComponent[] = [];

    // Calculate base growth (applies to ALL stats)
    const baseGrowth = calculateBaseGrowth(baseStat, currentStat);
    const newBase = Math.min(baseStat + baseGrowth, BASE_STAT_CAP);

    if (baseGrowth > 0) {
      const gap = currentStat - baseStat;
      statComponents.push({
        source: 'base_growth_gap',
        category: 'Base Growth',
        description: `Trained during the day${wasTrained ? '' : ' (passive growth)'}`,
        value: baseGrowth,
        details: `Current stat ${gap.toFixed(1)} points above base`
      });
    }

    // Calculate current decay (for offensive stats) or pull (for defensive stats)
    let decay = 0;
    if (!isDefensiveStat) {
      // Offensive stats: decay only if not trained
      decay = calculateCurrentDecay(newBase, currentStat, wasTrained);

      if (decay > 0) {
        const gap = currentStat - newBase;
        statComponents.push({
          source: 'current_decay',
          category: 'Current Decay',
          description: wasTrained ? 'No decay (trained today)' : 'Decay toward base (not trained)',
          value: -decay,
          details: `Gap to base: ${gap.toFixed(1)}`
        });
      }
    } else {
      // Defensive stats: always pull toward base (after defensive growth is applied)
      const pull = calculateDefensiveStatPull(newBase, currentStat);
      decay = pull;

      if (pull > 0) {
        const gap = currentStat - newBase;
        statComponents.push({
          source: 'defensive_pull',
          category: 'Current Pull to Base',
          description: 'Pull toward base (defensive stat)',
          value: -pull,
          details: `Gap to base: ${gap.toFixed(1)}`
        });
      }
    }

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
