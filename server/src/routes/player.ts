/**
 * Player Routes
 * API endpoints for player character management
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { getOrCreatePlayerCharacter, resetPlayerCharacter, updatePlayerArchetype } from '../services/player';
import { processSleep } from '../services/player/use-cases';
import { ApiResponse, PlayerCharacter, SleepResultWithStats, PlayerArchetype } from '../../../shared/types';

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
    const player = await getOrCreatePlayerCharacter(pool, userId);
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
    const result = await processSleep({ pool }, { userId });

    res.json({
      success: true,
      data: result
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
