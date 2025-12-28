/**
 * Process Sleep Use Case
 *
 * Orchestrates the end-of-day sleep process:
 * - Travel home if not already there
 * - Calculate sleep results and energy restoration
 * - Evaluate lifestyle patterns (work streaks, sleep habits)
 * - Apply stat changes (growth, decay, surplus conversion)
 * - Advance to next day with reset tracking
 */

import { Pool } from 'pg';
import {
  PlayerCharacter,
  SleepResultWithStats,
  StatName,
  StatChangeBreakdown,
  StatChangeComponent
} from '../../../../../shared/types';

// Domain services
import { getOrCreatePlayerCharacter, updatePlayerCharacter } from '../../player';
import { calculateSleepResults, addMinutes } from '../../time';
import { calculateTravelTime } from '../../location';
import { processDailyStatChanges, setCurrentStat, getBaseStat, getCurrentStat } from '../../stat';
import { buildPlayerPatternSnapshot } from '../../player-patterns';
import { evaluateAllPatterns } from '../../stat-evaluators/engine';

// ===== Types =====

export interface ProcessSleepRequest {
  userId: string;
}

export interface ProcessSleepContext {
  pool: Pool;
}

// ===== Constants =====

const ALL_STATS: StatName[] = [
  'fitness', 'vitality', 'poise',
  'knowledge', 'creativity', 'ambition',
  'confidence', 'wit', 'empathy'
];

// ===== Helper Functions =====

/**
 * Calculate travel time home and adjusted bedtime
 */
function calculateBedtime(
  player: PlayerCharacter
): { bedtime: string; travelTimeHome: number } {
  if (player.currentLocation === 'home') {
    return { bedtime: player.currentTime, travelTimeHome: 0 };
  }

  const travelTimeHome = calculateTravelTime(player.currentLocation, 'home');
  const bedtime = addMinutes(player.currentTime, travelTimeHome);

  return { bedtime, travelTimeHome };
}

/**
 * Apply lifestyle pattern changes to stats
 */
function applyLifestyleChanges(
  stats: PlayerCharacter['stats'],
  lifestyleChanges: Map<StatName, number>
): PlayerCharacter['stats'] {
  let updatedStats = { ...stats };

  for (const [stat, change] of lifestyleChanges.entries()) {
    updatedStats = setCurrentStat(
      updatedStats,
      stat,
      getCurrentStat(updatedStats, stat) + change
    );
  }

  return updatedStats;
}

/**
 * Build comprehensive stat change breakdowns for response
 */
function buildStatChangeBreakdowns(
  previousStats: PlayerCharacter['stats'],
  finalStats: PlayerCharacter['stats'],
  lifestyleComponents: Map<StatName, StatChangeComponent[]>,
  surplusComponents: Map<StatName, StatChangeComponent[]>
): StatChangeBreakdown[] {
  const breakdowns: StatChangeBreakdown[] = [];

  for (const stat of ALL_STATS) {
    const previousBase = getBaseStat(previousStats, stat);
    const previousCurrent = getCurrentStat(previousStats, stat);
    const newBase = getBaseStat(finalStats, stat);
    const newCurrent = getCurrentStat(finalStats, stat);
    const components: StatChangeComponent[] = [];

    // Add lifestyle pattern components
    if (lifestyleComponents.has(stat)) {
      components.push(...lifestyleComponents.get(stat)!);
    }

    // Add surplus conversion components
    if (surplusComponents.has(stat)) {
      components.push(...surplusComponents.get(stat)!);
    }

    // Only include stats that have changes
    if (components.length > 0) {
      breakdowns.push({
        stat,
        baseChange: newBase - previousBase,
        currentChange: newCurrent - previousCurrent,
        previousBase,
        newBase,
        previousCurrent,
        newCurrent,
        components
      });
    }
  }

  return breakdowns;
}

// ===== Main Use Case =====

export async function processSleep(
  ctx: ProcessSleepContext,
  request: ProcessSleepRequest
): Promise<SleepResultWithStats> {
  const { pool } = ctx;
  const { userId } = request;

  // Get player
  const player = await getOrCreatePlayerCharacter(pool, userId);

  // Calculate travel home if needed
  const { bedtime, travelTimeHome } = calculateBedtime(player);

  // Calculate sleep results
  const sleepResults = calculateSleepResults(bedtime);
  const newDay = player.currentDay + 1;
  const newEnergy = Math.min(100, player.currentEnergy + sleepResults.energyRestored);

  // Build player pattern snapshot for lifestyle evaluation
  const snapshot = await buildPlayerPatternSnapshot(pool, player, bedtime);

  // Evaluate lifestyle patterns
  const lifestyleResult = evaluateAllPatterns(snapshot);

  // Apply lifestyle changes to current stats
  const statsAfterLifestyle = applyLifestyleChanges(player.stats, lifestyleResult.changes);

  // Process daily stat changes (surplus conversion)
  const trainedStats = new Set<StatName>(player.tracking.statsTrainedToday);
  const statResult = processDailyStatChanges(statsAfterLifestyle, trainedStats);

  const finalStats = statResult.newStats;

  // Build stat change breakdowns for response
  const statChangeBreakdowns = buildStatChangeBreakdowns(
    player.stats,
    finalStats,
    lifestyleResult.components,
    statResult.components
  );

  // Legacy response fields
  const baseGrowth = statResult.changes.filter(c => c.baseDelta > 0);
  const currentDecay = statResult.changes.filter(c => c.currentDelta < 0);

  // Update player with new state
  await updatePlayerCharacter(pool, player.id, {
    currentTime: sleepResults.wakeTime,
    currentDay: newDay,
    currentEnergy: newEnergy,
    lastSleptAt: bedtime,
    currentLocation: 'home',
    stats: finalStats,
    tracking: {
      minEnergyToday: newEnergy,
      endingEnergyToday: newEnergy,
      workStreak: snapshot.work.currentWorkStreak,
      restStreak: snapshot.work.currentRestStreak,
      burnoutStreak: snapshot.sleep.burnoutStreak,
      lateNightStreak: snapshot.sleep.lateNightStreak,
      workedToday: false,
      hadCatastrophicFailureToday: false,
      statsTrainedToday: []
    }
  });

  return {
    ...sleepResults,
    newDay,
    traveledHome: travelTimeHome > 0,
    travelTime: travelTimeHome,
    statChanges: statResult.changes,
    baseGrowth,
    currentDecay,
    defensiveStatChanges: {
      vitality: lifestyleResult.changes.get('vitality') || 0,
      ambition: lifestyleResult.changes.get('ambition') || 0,
      empathy: lifestyleResult.changes.get('empathy') || 0
    },
    mixedStatChanges: {
      poise: lifestyleResult.changes.get('poise') || 0,
      creativity: lifestyleResult.changes.get('creativity') || 0,
      wit: lifestyleResult.changes.get('wit') || 0
    },
    statChangeBreakdowns
  };
}
