/**
 * Relationship Routes
 * API endpoints for relationship management (read-only)
 * Activity execution has been moved to /api/activities/perform
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { calculateDesireCap } from '../services/relationship';
import { interpretEmotionVectorSlim } from '../services/plutchik-emotion';
import {
  Relationship,
  ApiResponse,
  NPC,
  NEUTRAL_EMOTION_VECTOR
} from '../../../shared/types';
import { randomUUID } from 'crypto';

const router = Router();

/**
 * Helper: Validate NPC exists
 */
async function validateNPCExists(client: any, npcId: string): Promise<boolean> {
  const result = await client.query('SELECT id FROM npcs WHERE id = $1', [npcId]);
  return result.rows.length > 0;
}

/**
 * Helper: Map database row to Relationship object
 */
function mapRowToRelationship(row: any, npc?: NPC): Relationship {
  return {
    id: row.id,
    playerId: row.player_id,
    npcId: row.npc_id,
    // Defensive: ensure axis values are never null/undefined
    trust: row.trust ?? 0,
    affection: row.affection ?? 0,
    desire: row.desire ?? 0,
    desireCap: row.desire_cap,
    currentState: row.current_state,
    unlockedStates: row.unlocked_states,
    firstMet: row.first_met.toISOString(),
    lastInteraction: row.last_interaction.toISOString(),
    npc
  };
}

/**
 * Helper: Build NPC object from database row
 */
function buildNPCFromRow(row: any): NPC {
  // Parse emotion vector (new Plutchik system)
  const emotionVector = typeof row.emotion_vector === 'string'
    ? JSON.parse(row.emotion_vector)
    : (row.emotion_vector || NEUTRAL_EMOTION_VECTOR);

  // Get emotion interpretation for display
  const emotionInterpretation = interpretEmotionVectorSlim(emotionVector);

  return {
    id: row.id,
    name: row.name,
    traits: row.traits,
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
}

/**
 * Helper: Get or create relationship between player and NPC
 */
async function getOrCreateRelationship(
  client: any,
  playerId: string,
  npcId: string
): Promise<{ relationship: Relationship; isNew: boolean }> {
  // Validate inputs
  if (!playerId || !npcId) {
    throw new Error('Invalid player ID or NPC ID');
  }

  // Check if relationship exists
  const existing = await client.query(
    `SELECT * FROM relationships WHERE player_id = $1 AND npc_id = $2`,
    [playerId, npcId]
  );

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    console.log(`✅ Found existing relationship: Player ${playerId} <-> NPC ${npcId}`);
    return {
      relationship: mapRowToRelationship(row),
      isNew: false
    };
  }

  // Validate NPC exists before creating relationship
  const npcExists = await validateNPCExists(client, npcId);
  if (!npcExists) {
    throw new Error(`NPC with ID ${npcId} does not exist`);
  }

  // Get NPC gender and player preference to calculate desire cap
  const npcResult = await client.query('SELECT gender FROM npcs WHERE id = $1', [npcId]);
  const npcGender = npcResult.rows[0].gender;

  const playerResult = await client.query('SELECT sexual_preference FROM player_characters WHERE user_id = $1', [playerId]);
  const playerPreference = playerResult.rows[0]?.sexual_preference || 'everyone';

  // Calculate desire cap based on player preference and NPC gender
  const desireCap = calculateDesireCap(playerPreference, npcGender);

  // Create new relationship
  const id = randomUUID();
  const now = new Date();
  const initialState = 'stranger';

  console.log(`📝 Creating new relationship: Player ${playerId} <-> NPC ${npcId} (desireCap: ${desireCap})`);

  const result = await client.query(
    `
    INSERT INTO relationships (
      id, player_id, npc_id, trust, affection, desire, desire_cap,
      current_state, unlocked_states, first_met, last_interaction
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
    `,
    [id, playerId, npcId, 0, 0, 0, desireCap, initialState, [initialState], now, now]
  );

  console.log(`✅ Created new relationship with ID: ${id}`);

  return {
    relationship: mapRowToRelationship(result.rows[0]),
    isNew: true
  };
}

/**
 * GET /api/relationships
 * Get all relationships for the authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response<ApiResponse<Relationship[]>>) => {
  // Get user ID from JWT (added by auth middleware)
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

    // Join with NPCs to get NPC data
    const result = await client.query(
      `
      SELECT
        r.*,
        n.id as npc_id,
        n.name as npc_name,
        n.traits as npc_traits,
        n.revealed_traits as npc_revealed_traits,
        n.gender as npc_gender,
        n.emotion_vector as npc_emotion_vector,
        n.hair_color, n.hair_style, n.eye_color, n.face_details,
        n.body_type, n.torso_size, n.height, n.skin_tone,
        n.upper_trace, n.lower_trace, n.style, n.body_details,
        n.loras as npc_loras,
        n.current_location,
        n.created_at as npc_created_at
      FROM relationships r
      JOIN npcs n ON r.npc_id = n.id
      WHERE r.player_id = $1
      ORDER BY r.last_interaction DESC
      `,
      [userId]
    );

    const relationships: Relationship[] = result.rows.map((row) => {
      // Build NPC from row
      const npc = buildNPCFromRow({
        id: row.npc_id,
        name: row.npc_name,
        traits: row.npc_traits,
        revealed_traits: row.npc_revealed_traits,
        gender: row.npc_gender,
        emotion_vector: row.npc_emotion_vector,
        hair_color: row.hair_color,
        hair_style: row.hair_style,
        eye_color: row.eye_color,
        face_details: row.face_details,
        body_type: row.body_type,
        torso_size: row.torso_size,
        height: row.height,
        skin_tone: row.skin_tone,
        upper_trace: row.upper_trace,
        lower_trace: row.lower_trace,
        style: row.style,
        body_details: row.body_details,
        loras: row.npc_loras,
        current_location: row.current_location,
        created_at: row.npc_created_at
      });

      return mapRowToRelationship(row, npc);
    });

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
  } finally {
    client.release();
  }
});

/**
 * GET /api/relationships/:npcId
 * Get or create relationship with specific NPC
 */
router.get('/:npcId', async (req: AuthRequest, res: Response<ApiResponse<Relationship>>) => {
  const { npcId } = req.params;

  // Get user ID from JWT (added by auth middleware)
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

    // Check if NPC exists
    const npcResult = await client.query(`SELECT * FROM npcs WHERE id = $1`, [npcId]);

    if (npcResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'NPC not found'
      });
      return;
    }

    // Get or create relationship
    const { relationship, isNew } = await getOrCreateRelationship(client, userId, npcId);

    // Populate NPC data
    const npcRow = npcResult.rows[0];
    const npc = buildNPCFromRow(npcRow);

    relationship.npc = npc;

    if (isNew) {
      console.log(`✅ Created new relationship: User ${userId} met ${npc.name}`);
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
  } finally {
    client.release();
  }
});

export default router;
