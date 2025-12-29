/**
 * Player NPCs Routes
 * Unified API for player-specific NPC data (combined NPC + relationship view)
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { generateNPC } from '../services/npc-generator';
import { NpcView, ApiResponse } from '../../../shared/types';
import {
  npcTemplateRepository,
  npcRepository,
  playerRepository
} from '../repositories';

const router = Router();

/**
 * GET /api/npcs
 * Get all NPCs for the authenticated player (unified view)
 */
router.get('/', async (req: AuthRequest, res: Response<ApiResponse<NpcView[]>>) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const userId = req.user.userId;

  try {
    const npcs = await npcRepository.getAllForPlayer(pool, userId);

    res.json({
      success: true,
      data: npcs
    });
  } catch (error) {
    console.error('Error fetching player NPCs for user', userId, ':', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch player NPCs';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * GET /api/npcs/:id
 * Get a specific player NPC by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response<ApiResponse<NpcView>>) => {
  const { id } = req.params;

  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  try {
    const npc = await npcRepository.getById(pool, id);

    if (!npc) {
      res.status(404).json({
        success: false,
        error: 'Player NPC not found'
      });
      return;
    }

    res.json({
      success: true,
      data: npc
    });
  } catch (error) {
    console.error('Error fetching player NPC:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch player NPC';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * POST /api/npcs
 * Generate and create a new NPC at player's current location
 * Creates both the template and the player-NPC entry
 */
router.post('/', async (req: AuthRequest, res: Response<ApiResponse<NpcView>>) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const userId = req.user.userId;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get player's current location and game time
    let player = await playerRepository.getByUserId(client, userId);
    if (!player) {
      player = await playerRepository.create(client, userId);
    }

    // Generate random NPC data
    const npcData = generateNPC();

    // Create NPC template
    const template = await npcTemplateRepository.create(client, {
      name: npcData.name,
      gender: npcData.gender,
      traits: npcData.traits,
      appearance: npcData.appearance,
      loras: npcData.loras
    });

    // Create player NPC entry
    const npc = await npcRepository.create(client, {
      playerId: userId,
      templateId: template.id,
      currentLocation: player.currentLocation,
      firstMet: player.gameTimeMinutes
    });

    await client.query('COMMIT');

    console.log(`Created NPC: ${template.name} at ${player.currentLocation} for user ${userId}`);

    res.json({
      success: true,
      data: npc
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating player NPC:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create NPC'
    });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/npcs/:id
 * Delete a player NPC (and potentially the template if no other players use it)
 */
router.delete('/:id', async (req: AuthRequest, res: Response<ApiResponse<void>>) => {
  const { id } = req.params;

  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get the player NPC to find template ID
    const npc = await npcRepository.getById(client, id);
    if (!npc) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        error: 'Player NPC not found'
      });
      return;
    }

    const templateId = npc.templateId;

    // Delete the player NPC
    await npcRepository.deleteById(client, id);

    await client.query('COMMIT');

    console.log(`Deleted player NPC: ${id}`);

    res.json({
      success: true,
      data: undefined
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting player NPC:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete player NPC'
    });
  } finally {
    client.release();
  }
});

export default router;
