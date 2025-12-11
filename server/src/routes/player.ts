/**
 * Player Routes (Phase 2 + Phase 2.5)
 * API endpoints for player character management
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { getOrCreatePlayerCharacter, resetPlayerCharacter, updatePlayerCharacter, updatePlayerArchetype } from '../services/player';
import { calculateSleepResults, addMinutes } from '../services/time';
import { calculateTravelTime } from '../services/location';
import { processDailyStatChanges, setBaseStat } from '../services/stat';
import { calculateDefensiveStatChanges } from '../services/defensive-stats';
import { ApiResponse, PlayerCharacter, SleepResultWithStats, StatName, PlayerArchetype } from '../../../shared/types';

const router = Router();

/**
 * GET /api/player
 * Get current player character (creates if doesn't exist)
 */
router.get('/', async (req: AuthRequest, res: Response<ApiResponse<PlayerCharacter>>) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const userId = req.user.userId;

  try {
    const player = await getOrCreatePlayerCharacter(pool, userId);

    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error('❌ Error fetching player character:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch player character';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * POST /api/player/archetype
 * Set player archetype and reset stats to match
 * (Phase 2.5: Character creation/customization)
 */
router.post('/archetype', async (req: AuthRequest, res: Response<ApiResponse<PlayerCharacter>>) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const userId = req.user.userId;
  const { archetype }: { archetype: PlayerArchetype } = req.body;

  // Validate archetype
  const validArchetypes: PlayerArchetype[] = ['athlete', 'scholar', 'social_butterfly', 'artist', 'professional', 'balanced'];
  if (!archetype || !validArchetypes.includes(archetype)) {
    res.status(400).json({
      success: false,
      error: 'Invalid archetype. Must be one of: ' + validArchetypes.join(', ')
    });
    return;
  }

  try {
    // Get player character
    const player = await getOrCreatePlayerCharacter(pool, userId);

    // Update archetype and reset stats
    const updatedPlayer = await updatePlayerArchetype(pool, player.id, archetype);

    console.log(`✅ Updated player ${userId} archetype to ${archetype}`);

    res.json({
      success: true,
      data: updatedPlayer
    });
  } catch (error) {
    console.error('❌ Error setting player archetype:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to set archetype';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * POST /api/player/reset
 * Reset player character to initial state and delete all NPCs
 */
router.post('/reset', async (req: AuthRequest, res: Response<ApiResponse<PlayerCharacter>>) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const userId = req.user.userId;

  try {
    const player = await resetPlayerCharacter(pool, userId);

    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error('❌ Error resetting player character:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset player character';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * POST /api/player/sleep
 * Go to sleep and advance to next day
 * Phase 2.5: Process stat changes (base growth, current decay)
 */
router.post('/sleep', async (req: AuthRequest, res: Response<ApiResponse<SleepResultWithStats>>) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const userId = req.user.userId;

  try {
    const player = await getOrCreatePlayerCharacter(pool, userId);

    // Phase 3: Calculate travel time home if not already there
    let bedtime = player.currentTime;
    let travelTimeHome = 0;

    if (player.currentLocation !== 'home') {
      travelTimeHome = calculateTravelTime(player.currentLocation, 'home');
      bedtime = addMinutes(player.currentTime, travelTimeHome);
    }

    // Calculate sleep results based on bedtime (after potential travel)
    const sleepResults = calculateSleepResults(bedtime);
    const newDay = player.currentDay + 1;
    const newEnergy = Math.min(100, player.currentEnergy + sleepResults.energyRestored);

    // Phase 2.5: Process daily stat changes (base growth, current decay)
    const trainedStats = new Set<StatName>(player.tracking.statsTrainedToday);
    const statResult = processDailyStatChanges(player.stats, trainedStats);

    // Phase 2.5.2: Calculate defensive stat changes (Vitality, Ambition, Empathy)
    const defensiveChanges = await calculateDefensiveStatChanges(pool, player, bedtime);

    // Apply defensive stat changes to BASE stats
    let finalStats = { ...statResult.newStats };
    finalStats = setBaseStat(finalStats, 'vitality',
      Math.max(0, finalStats.baseVitality + defensiveChanges.vitality));
    finalStats = setBaseStat(finalStats, 'ambition',
      Math.max(0, finalStats.baseAmbition + defensiveChanges.ambition));
    finalStats = setBaseStat(finalStats, 'empathy',
      Math.max(0, finalStats.baseEmpathy + defensiveChanges.empathy));

    // Separate changes into growth vs decay for the response
    const baseGrowth = statResult.changes.filter(c => c.baseDelta > 0);
    const currentDecay = statResult.changes.filter(c => c.currentDelta < 0);

    // Update player character with new stats and reset tracking
    await updatePlayerCharacter(pool, player.id, {
      currentTime: sleepResults.wakeTime,
      currentDay: newDay,
      currentEnergy: newEnergy,
      lastSleptAt: bedtime,
      currentLocation: 'home',
      stats: finalStats,
      tracking: {
        minEnergyToday: newEnergy,  // Reset for new day (starts at wake energy)
        endingEnergyToday: newEnergy,  // Reset for new day
        workStreak: player.tracking.workedToday
          ? player.tracking.workStreak + 1
          : 0,
        restStreak: player.tracking.workedToday
          ? 0
          : player.tracking.restStreak + 1,
        burnoutStreak: player.tracking.minEnergyToday <= 0
          ? player.tracking.burnoutStreak + 1
          : 0,
        lateNightStreak: parseInt(bedtime.split(':')[0]) >= 2
          ? player.tracking.lateNightStreak + 1
          : 0,
        workedToday: false,
        hadCatastrophicFailureToday: false,
        statsTrainedToday: []  // Reset for new day
      }
    });

    res.json({
      success: true,
      data: {
        ...sleepResults,
        newDay,
        traveledHome: travelTimeHome > 0,
        travelTime: travelTimeHome,
        statChanges: statResult.changes,
        baseGrowth,
        currentDecay,
        defensiveStatChanges: defensiveChanges
      }
    });
  } catch (error) {
    console.error('❌ Error processing sleep:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process sleep';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

export default router;
