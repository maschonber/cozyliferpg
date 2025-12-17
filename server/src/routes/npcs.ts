/**
 * NPC Routes
 * API endpoints for NPC generation and management
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { generateNPC } from '../services/npc-generator';
import { NPC, ApiResponse, NPCEmotionState, EmotionDisplay } from '../../../shared/types';
import { randomUUID } from 'crypto';
import { AuthRequest } from '../auth/auth.middleware';
import { getOrCreatePlayerCharacter } from '../services/player';
import { decayEmotions, getDominantEmotions, getHoursSinceUpdate } from '../services/emotion';

const router = Router();

/**
 * Helper: Build NPC from database row
 * - Applies emotion decay
 * - Filters traits based on showAllTraits flag
 * - Returns NPC with dominant emotion included
 */
function buildNPCFromRow(row: any, showAllTraits: boolean = false, trustLevel: number = 0): NPC & { dominantEmotion?: EmotionDisplay } {
  // Parse emotion state
  let emotionState: NPCEmotionState = typeof row.emotion_state === 'string'
    ? JSON.parse(row.emotion_state)
    : row.emotion_state;

  // Apply decay based on time since last update
  const hoursSinceUpdate = getHoursSinceUpdate(emotionState.lastUpdated);
  if (hoursSinceUpdate > 0) {
    emotionState = decayEmotions(
      emotionState,
      hoursSinceUpdate,
      trustLevel,
      row.traits
    );
  }

  // Get dominant emotion for display
  const dominantEmotionData = getDominantEmotions(emotionState);

  // Build NPC object
  const npc: NPC & { dominantEmotion?: EmotionDisplay } = {
    id: row.id,
    name: row.name,
    archetype: row.archetype,
    // Filter traits: only show revealed traits unless showAllTraits is true
    traits: showAllTraits ? row.traits : row.revealed_traits || [],
    revealedTraits: row.revealed_traits || [],
    gender: row.gender,
    emotionState,
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
    createdAt: row.created_at.toISOString(),
    dominantEmotion: dominantEmotionData.primary
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
        id, name, archetype, traits, gender,
        hair_color, hair_style, eye_color, face_details,
        body_type, torso_size, height, skin_tone,
        upper_trace, lower_trace, style, body_details,
        loras, current_location, revealed_traits, emotion_state, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
      `,
      [
        id,
        npcData.name,
        npcData.archetype,
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
        JSON.stringify(npcData.emotionState),
        createdAt
      ]
    );

    const row = result.rows[0];

    // Map database row to NPC type
    const npc: NPC = {
      id: row.id,
      name: row.name,
      archetype: row.archetype,
      traits: row.traits,
      revealedTraits: row.revealed_traits || [],
      gender: row.gender,
      emotionState: typeof row.emotion_state === 'string'
        ? JSON.parse(row.emotion_state)
        : row.emotion_state,
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
      currentLocation: row.current_location, // Phase 3
      createdAt: row.created_at.toISOString()
    };

    console.log(`✅ Created NPC: ${npc.name} (${npc.archetype}) at ${npc.currentLocation}`);

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

    const npcs = result.rows.map((row) => buildNPCFromRow(row, showAllTraits, 0));

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
 * Task 7: Returns NPC with:
 * - Filtered traits (only revealed, unless ?showAllTraits=true)
 * - Emotion decay applied
 * - Dominant emotion included
 * - Trust level from relationship if it exists
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

    // Get trust level from relationship if it exists (for better emotion decay)
    let trustLevel = 0;
    if (req.user?.userId) {
      const relResult = await client.query(
        `SELECT trust FROM relationships WHERE player_id = $1 AND npc_id = $2`,
        [req.user.userId, id]
      );
      if (relResult.rows.length > 0) {
        trustLevel = relResult.rows[0].trust;
      }
    }

    const row = result.rows[0];
    const npc = buildNPCFromRow(row, showAllTraits, trustLevel);

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
