/**
 * Relationship Routes
 * API endpoints for relationship management (read-only)
 * Activity execution has been moved to /api/activities/perform
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { calculateDesireCap } from '../services/relationship';
import { Relationship, ApiResponse } from '../../../shared/types';
import {
  npcRepository,
  relationshipRepository,
  playerRepository
} from '../repositories';

const router = Router();

/**
 * GET /api/relationships
 * Get all relationships for the authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response<ApiResponse<Relationship[]>>) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const userId = req.user.userId;

  try {
    // Use repository to get relationships with joined NPC data
    const relationships = await relationshipRepository.getAllForPlayerWithNPC(pool, userId);

    res.json({
      success: true,
      data: relationships
    });
  } catch (error) {
    console.error('❌ Error fetching relationships for user', userId, ':', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch relationships';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * GET /api/relationships/:npcId
 * Get or create relationship with specific NPC
 */
router.get('/:npcId', async (req: AuthRequest, res: Response<ApiResponse<Relationship>>) => {
  const { npcId } = req.params;

  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const userId = req.user.userId;

  try {
    // Check if NPC exists
    const npc = await npcRepository.getById(pool, npcId);
    if (!npc) {
      res.status(404).json({
        success: false,
        error: 'NPC not found'
      });
      return;
    }

    // Check for existing relationship
    let relationship = await relationshipRepository.getByPlayerAndNpc(pool, userId, npcId);
    let isNew = false;

    if (!relationship) {
      // Get player preference to calculate desire cap
      let player = await playerRepository.getByUserId(pool, userId);
      if (!player) {
        player = await playerRepository.create(pool, userId);
      }

      const desireCap = calculateDesireCap(player.sexualPreference, npc.gender);

      // Create new relationship
      relationship = await relationshipRepository.create(pool, {
        playerId: userId,
        npcId,
        desireCap
      });
      isNew = true;

      console.log(`✅ Created new relationship: User ${userId} met ${npc.name}`);
    }

    // Attach NPC data
    relationship.npc = npc;

    if (isNew) {
      console.log(`📝 New relationship established with ${npc.name}`);
    }

    res.json({
      success: true,
      data: relationship
    });
  } catch (error) {
    console.error(`❌ Error fetching/creating relationship for user ${userId} and NPC ${npcId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get relationship';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

export default router;
