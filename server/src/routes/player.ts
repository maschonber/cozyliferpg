/**
 * Player Routes (Phase 2)
 * API endpoints for player character management
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { getOrCreatePlayerCharacter, resetPlayerCharacter, updatePlayerCharacter } from '../services/player';
import { calculateSleepResults, addMinutes } from '../services/time';
import { calculateTravelTime } from '../services/location';
import { ApiResponse, PlayerCharacter, SleepResult } from '../../../shared/types';

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
 */
router.post('/sleep', async (req: AuthRequest, res: Response<ApiResponse<SleepResult>>) => {
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

    // Update player character (Phase 3: always set location to home)
    await updatePlayerCharacter(pool, player.id, {
      currentTime: sleepResults.wakeTime,
      currentDay: newDay,
      currentEnergy: newEnergy,
      lastSleptAt: bedtime,
      currentLocation: 'home'
    });

    res.json({
      success: true,
      data: {
        ...sleepResults,
        newDay,
        traveledHome: travelTimeHome > 0,
        travelTime: travelTimeHome
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
