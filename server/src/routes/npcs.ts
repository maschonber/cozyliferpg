/**
 * NPC Routes
 * API endpoints for NPC generation and management
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { generateNPC } from '../services/npc-generator';
import { NPC, ApiResponse } from '../../../shared/types';
import { AuthRequest } from '../auth/auth.middleware';
import { npcRepository, relationshipRepository, playerRepository } from '../repositories';

const router = Router();

/**
 * POST /api/npcs
 * Generate and create a new NPC at player's current location
 */
router.post('/', async (req: AuthRequest, res: Response<ApiResponse<NPC>>) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const userId = req.user.userId;

  try {
    // Get player's current location
    let player = await playerRepository.getByUserId(pool, userId);
    if (!player) {
      player = await playerRepository.create(pool, userId);
    }

    // Generate random NPC data
    const npcData = generateNPC();

    // Create NPC using repository
    const npc = await npcRepository.create(pool, {
      name: npcData.name,
      gender: npcData.gender,
      traits: npcData.traits,
      revealedTraits: npcData.revealedTraits,
      emotionVector: npcData.emotionVector,
      appearance: npcData.appearance,
      loras: npcData.loras,
      currentLocation: player.currentLocation
    });

    console.log(`✅ Created NPC: ${npc.name} at ${npc.currentLocation}`);

    res.json({
      success: true,
      data: npc
    });
  } catch (error) {
    console.error('Error creating NPC:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create NPC'
    });
  }
});

/**
 * GET /api/npcs
 * Get all NPCs
 */
router.get('/', async (req: AuthRequest, res: Response<ApiResponse<NPC[]>>) => {
  // Check for debug flag to show all traits
  const showAllTraits = req.query.showAllTraits === 'true';

  try {
    const npcs = await npcRepository.getAll(pool, { showAllTraits });

    res.json({
      success: true,
      data: npcs
    });
  } catch (error) {
    console.error('Error fetching NPCs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NPCs'
    });
  }
});

/**
 * GET /api/npcs/:id
 * Get NPC by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response<ApiResponse<NPC>>) => {
  const { id } = req.params;

  // Check for debug flag to show all traits
  const showAllTraits = req.query.showAllTraits === 'true';

  try {
    const npc = await npcRepository.getById(pool, id, { showAllTraits });

    if (!npc) {
      res.status(404).json({
        success: false,
        error: 'NPC not found'
      });
      return;
    }

    res.json({
      success: true,
      data: npc
    });
  } catch (error) {
    console.error('Error fetching NPC:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NPC'
    });
  }
});

/**
 * DELETE /api/npcs/:id
 * Delete an NPC by ID
 */
router.delete('/:id', async (req: AuthRequest, res: Response<ApiResponse<void>>) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    // Start a transaction to delete both NPC and related relationships
    await client.query('BEGIN');

    // Delete relationships associated with this NPC
    await relationshipRepository.deleteAllForNpc(client, id);

    // Delete the NPC
    const deleted = await npcRepository.deleteById(client, id);

    if (!deleted) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        error: 'NPC not found'
      });
      return;
    }

    await client.query('COMMIT');

    console.log(`✅ Deleted NPC: ${id}`);

    res.json({
      success: true,
      data: undefined
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting NPC:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete NPC'
    });
  } finally {
    client.release();
  }
});

export default router;
