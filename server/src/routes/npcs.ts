/**
 * NPC Routes
 * API endpoints for NPC generation and management
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { generateNPC } from '../services/npc-generator';
import { NPC, ApiResponse, NEUTRAL_EMOTION_VECTOR } from '../../../shared/types';
import { randomUUID } from 'crypto';
import { AuthRequest } from '../auth/auth.middleware';
import { getOrCreatePlayerCharacter } from '../services/player';
import { interpretEmotionVectorSlim } from '../services/plutchik-emotion';

const router = Router();

/**
 * Helper: Build NPC from database row
 * - Parses emotion vector
 * - Filters traits based on showAllTraits flag
 * - Returns NPC with emotion interpretation included
 */
function buildNPCFromRow(row: any, showAllTraits: boolean = false): NPC {
  // Parse emotion vector (new Plutchik system)
  const emotionVector = typeof row.emotion_vector === 'string'
    ? JSON.parse(row.emotion_vector)
    : (row.emotion_vector || NEUTRAL_EMOTION_VECTOR);

  // Get emotion interpretation for display (slim - frontend will enrich with config)
  const emotionInterpretation = interpretEmotionVectorSlim(emotionVector);

  // Build NPC object
  const npc: NPC = {
    id: row.id,
    name: row.name,
    // Filter traits: only show revealed traits unless showAllTraits is true
    traits: showAllTraits ? row.traits : row.revealed_traits || [],
    revealedTraits: row.revealed_traits || [],
    gender: row.gender,
    emotionVector,
    emotionInterpretation,
    appearance: {
      hairColor: row.hair_color,
      hairStyle: row.hair_style,
      eyeColor: row.eye_color,
      faceDetails: row.face_details,
      bodyType: row.body_type,
      torsoSize: row.torso_size,
      height: row.height,
      skinTone: row.skin_tone,
      upperTrace: row.upper_trace,
      lowerTrace: row.lower_trace,
      style: row.style,
      bodyDetails: row.body_details
    },
    loras: row.loras,
    currentLocation: row.current_location,
    createdAt: row.created_at.toISOString()
  };

  return npc;
}

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
  const client = await pool.connect();

  try {
    // Get player's current location
    const player = await getOrCreatePlayerCharacter(pool, userId);

    // Generate random NPC
    const npcData = generateNPC();
    const id = randomUUID();
    const createdAt = new Date();

    // Insert into database with player's current location (Phase 3)
    const result = await client.query(
      `
      INSERT INTO npcs (
        id, name, traits, gender,
        hair_color, hair_style, eye_color, face_details,
        body_type, torso_size, height, skin_tone,
        upper_trace, lower_trace, style, body_details,
        loras, current_location, revealed_traits, emotion_vector, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
      `,
      [
        id,
        npcData.name,
        npcData.traits,
        npcData.gender,
        npcData.appearance.hairColor,
        npcData.appearance.hairStyle,
        npcData.appearance.eyeColor,
        npcData.appearance.faceDetails,
        npcData.appearance.bodyType,
        npcData.appearance.torsoSize,
        npcData.appearance.height,
        npcData.appearance.skinTone,
        npcData.appearance.upperTrace,
        npcData.appearance.lowerTrace,
        npcData.appearance.style,
        npcData.appearance.bodyDetails,
        npcData.loras,
        player.currentLocation, // Spawn at player's location
        npcData.revealedTraits,
        JSON.stringify(npcData.emotionVector),
        createdAt
      ]
    );

    const row = result.rows[0];

    // Use helper to build NPC from row
    const npc = buildNPCFromRow(row, true); // Show all traits for newly created NPC

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
  } finally {
    client.release();
  }
});

/**
 * GET /api/npcs
 * Get all NPCs
 *
 * Task 7: Returns NPCs with:
 * - Filtered traits (only revealed, unless ?showAllTraits=true)
 * - Emotion decay applied
 * - Dominant emotion included
 */
router.get('/', async (req: AuthRequest, res: Response<ApiResponse<NPC[]>>) => {
  const client = await pool.connect();

  // Check for debug flag to show all traits
  const showAllTraits = req.query.showAllTraits === 'true';

  try {
    const result = await client.query(
      `SELECT * FROM npcs ORDER BY created_at DESC`
    );

    const npcs = result.rows.map((row) => buildNPCFromRow(row, showAllTraits));

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
  } finally {
    client.release();
  }
});

/**
 * GET /api/npcs/:id
 * Get NPC by ID
 *
 * Returns NPC with:
 * - Filtered traits (only revealed, unless ?showAllTraits=true)
 * - Emotion interpretation included
 */
router.get('/:id', async (req: AuthRequest, res: Response<ApiResponse<NPC>>) => {
  const { id } = req.params;
  const client = await pool.connect();

  // Check for debug flag to show all traits
  const showAllTraits = req.query.showAllTraits === 'true';

  try {
    const result = await client.query(
      `SELECT * FROM npcs WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'NPC not found'
      });
      return;
    }

    const row = result.rows[0];
    const npc = buildNPCFromRow(row, showAllTraits);

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
  } finally {
    client.release();
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
    await client.query(
      `DELETE FROM relationships WHERE npc_id = $1`,
      [id]
    );

    // Delete the NPC
    const result = await client.query(
      `DELETE FROM npcs WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
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
