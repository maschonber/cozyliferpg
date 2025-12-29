/**
 * Player NPCs Routes
 * Unified API for player-specific NPC data (combined NPC + relationship view)
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { generateNPC } from '../services/npc-generator';
import { PlayerNPCView, ApiResponse } from '../../../shared/types';
import {
  npcTemplateRepository,
  playerNpcRepository,
  playerRepository
} from '../repositories';

const router = Router();

/**
 * GET /api/player-npcs
 * Get all NPCs for the authenticated player (unified view)
 */
router.get('/', async (req: AuthRequest, res: Response<ApiResponse<PlayerNPCView[]>>) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const userId = req.user.userId;

  try {
    const playerNpcs = await playerNpcRepository.getAllForPlayer(pool, userId);

    res.json({
      success: true,
      data: playerNpcs
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
 * GET /api/player-npcs/:id
 * Get a specific player NPC by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response<ApiResponse<PlayerNPCView>>) => {
  const { id } = req.params;

  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  try {
    const playerNpc = await playerNpcRepository.getById(pool, id);

    if (!playerNpc) {
      res.status(404).json({
        success: false,
        error: 'Player NPC not found'
      });
      return;
    }

    res.json({
      success: true,
      data: playerNpc
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
 * POST /api/player-npcs
 * Generate and create a new NPC at player's current location
 * Creates both the template and the player-NPC entry
 */
router.post('/', async (req: AuthRequest, res: Response<ApiResponse<PlayerNPCView>>) => {
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
    const playerNpc = await playerNpcRepository.create(client, {
      playerId: userId,
      templateId: template.id,
      currentLocation: player.currentLocation,
      firstMet: player.gameTimeMinutes
    });

    await client.query('COMMIT');

    console.log(`Created NPC: ${template.name} at ${player.currentLocation} for user ${userId}`);

    res.json({
      success: true,
      data: playerNpc
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
 * DELETE /api/player-npcs/:id
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
    const playerNpc = await playerNpcRepository.getById(client, id);
    if (!playerNpc) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        error: 'Player NPC not found'
      });
      return;
    }

    const templateId = playerNpc.templateId;

    // Delete the player NPC
    await playerNpcRepository.deleteById(client, id);

    // Check if template is still used by other players
    const result = await client.query(
      'SELECT COUNT(*) as count FROM player_npcs WHERE npc_template_id = $1',
      [templateId]
    );
    const usageCount = parseInt(result.rows[0].count, 10);

    // If no other players use this template, delete it
    if (usageCount === 0) {
      await npcTemplateRepository.deleteById(client, templateId);
      console.log(`Deleted orphaned template: ${templateId}`);
    }

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
