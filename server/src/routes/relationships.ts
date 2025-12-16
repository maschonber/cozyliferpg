/**
 * Relationship Routes
 * API endpoints for relationship management and interactions
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import {
  calculateRelationshipState,
  applyActivityEffects,
  getContextualEmotionalState,
  updateUnlockedStates,
  getActivityById
} from '../services/relationship';
import { getOrCreatePlayerCharacter, updatePlayerCharacter } from '../services/player';
import { canPerformActivity, addMinutes } from '../services/time';
import {
  Relationship,
  ApiResponse,
  PerformActivityRequest,
  PerformActivityResponse,
  NPC
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
    trust: row.trust,
    affection: row.affection,
    desire: row.desire,
    desireCap: row.desire_cap,
    currentState: row.current_state,
    unlockedStates: row.unlocked_states,
    firstMet: row.first_met.toISOString(),
    lastInteraction: row.last_interaction.toISOString(),
    npc
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

  // Create new relationship
  const id = randomUUID();
  const now = new Date();
  const initialState = 'stranger';

  console.log(`📝 Creating new relationship: Player ${playerId} <-> NPC ${npcId}`);

  const result = await client.query(
    `
    INSERT INTO relationships (
      id, player_id, npc_id, friendship, romance,
      current_state, unlocked_states, first_met, last_interaction
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [id, playerId, npcId, 0, 0, initialState, [initialState], now, now]
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
        n.archetype as npc_archetype,
        n.traits as npc_traits,
        n.revealed_traits as npc_revealed_traits,
        n.gender as npc_gender,
        n.emotion_state as npc_emotion_state,
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
      const npc: NPC = {
        id: row.npc_id,
        name: row.npc_name,
        archetype: row.npc_archetype,
        traits: row.npc_traits,
        revealedTraits: row.npc_revealed_traits || [],
        gender: row.npc_gender,
        emotionState: typeof row.npc_emotion_state === 'string'
          ? JSON.parse(row.npc_emotion_state)
          : row.npc_emotion_state,
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
        loras: row.npc_loras,
        currentLocation: row.current_location,
        createdAt: row.npc_created_at.toISOString()
      };

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
    const npc: NPC = {
      id: npcRow.id,
      name: npcRow.name,
      archetype: npcRow.archetype,
      traits: npcRow.traits,
      revealedTraits: npcRow.revealed_traits || [],
      gender: npcRow.gender,
      emotionState: typeof npcRow.emotion_state === 'string'
        ? JSON.parse(npcRow.emotion_state)
        : npcRow.emotion_state,
      appearance: {
        hairColor: npcRow.hair_color,
        hairStyle: npcRow.hair_style,
        eyeColor: npcRow.eye_color,
        faceDetails: npcRow.face_details,
        bodyType: npcRow.body_type,
        torsoSize: npcRow.torso_size,
        height: npcRow.height,
        skinTone: npcRow.skin_tone,
        upperTrace: npcRow.upper_trace,
        lowerTrace: npcRow.lower_trace,
        style: npcRow.style,
        bodyDetails: npcRow.body_details
      },
      loras: npcRow.loras,
      currentLocation: npcRow.current_location,
      createdAt: npcRow.created_at.toISOString()
    };

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

/**
 * POST /api/relationships/:npcId/interact
 * Perform an activity with an NPC (Phase 2: includes resource management)
 */
router.post(
  '/:npcId/interact',
  async (req: AuthRequest, res: Response<PerformActivityResponse>) => {
    const { npcId } = req.params;
    const { activityId }: PerformActivityRequest = req.body;

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

      // Validate activity
      const activity = getActivityById(activityId);
      if (!activity) {
        res.status(400).json({
          success: false,
          error: 'Invalid activity'
        });
        return;
      }

      // Get player character (Phase 2)
      const player = await getOrCreatePlayerCharacter(pool, userId);

      // Fetch NPC data to check location (Phase 3)
      const npcResult = await client.query(`SELECT * FROM npcs WHERE id = $1`, [npcId]);
      if (npcResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'NPC not found'
        });
        return;
      }
      const npcRow = npcResult.rows[0];
      const npcLocation = npcRow.current_location;

      // Validate activity can be performed (Phase 2 + Phase 3 location checks)
      const availability = canPerformActivity(activity, player, npcLocation);
      if (!availability.available) {
        res.status(400).json({
          success: false,
          error: availability.reason || 'Activity cannot be performed'
        });
        return;
      }

      // Get or create relationship
      const { relationship } = await getOrCreateRelationship(client, userId, npcId);

      // Calculate new values with the 3-axis system
      const trustDelta = activity.effects.trust || 0;
      const affectionDelta = activity.effects.affection || 0;
      const desireDelta = activity.effects.desire || 0;

      const { trust: newTrust, affection: newAffection, desire: newDesire } = applyActivityEffects(
        relationship.trust,
        relationship.affection,
        relationship.desire,
        trustDelta,
        affectionDelta,
        desireDelta,
        relationship.desireCap
      );

      // Calculate new state
      const previousState = relationship.currentState;
      const newState = calculateRelationshipState(newTrust, newAffection, newDesire);
      const stateChanged = previousState !== newState;

      // Update unlocked states
      const unlockedStates = updateUnlockedStates(relationship.unlockedStates, newState);

      // Get emotional state
      const emotionalState = getContextualEmotionalState(
        trustDelta,
        affectionDelta,
        desireDelta,
        newState
      );

      // Update player resources (Phase 2)
      const newEnergy = Math.max(0, Math.min(100, player.currentEnergy + activity.energyCost));
      const newMoney = player.money + activity.moneyCost;
      const newTime = addMinutes(player.currentTime, activity.timeCost);

      await updatePlayerCharacter(pool, player.id, {
        currentEnergy: newEnergy,
        money: newMoney,
        currentTime: newTime
      });

      // Update relationship in database
      await client.query(
        `
        UPDATE relationships
        SET trust = $1, affection = $2, desire = $3, current_state = $4,
            unlocked_states = $5, last_interaction = $6
        WHERE id = $7
        `,
        [newTrust, newAffection, newDesire, newState, unlockedStates, new Date(), relationship.id]
      );

      // Create interaction record
      const interactionId = randomUUID();
      await client.query(
        `
        INSERT INTO interactions (
          id, relationship_id, activity_type,
          trust_delta, affection_delta, desire_delta, emotional_state, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          interactionId,
          relationship.id,
          activity.name,
          trustDelta,
          affectionDelta,
          desireDelta,
          emotionalState,
          new Date()
        ]
      );

      // Fetch updated relationship with NPC data
      const updatedResult = await client.query(
        `
        SELECT
          r.*,
          n.id as npc_id,
          n.name as npc_name,
          n.archetype as npc_archetype,
          n.traits as npc_traits,
          n.revealed_traits as npc_revealed_traits,
          n.gender as npc_gender,
          n.emotion_state as npc_emotion_state,
          n.hair_color, n.hair_style, n.eye_color, n.face_details,
          n.body_type, n.torso_size, n.height, n.skin_tone,
          n.upper_trace, n.lower_trace, n.style, n.body_details,
          n.loras as npc_loras,
          n.current_location,
          n.created_at as npc_created_at
        FROM relationships r
        JOIN npcs n ON r.npc_id = n.id
        WHERE r.id = $1
        `,
        [relationship.id]
      );

      const row = updatedResult.rows[0];
      const npc: NPC = {
        id: row.npc_id,
        name: row.npc_name,
        archetype: row.npc_archetype,
        traits: row.npc_traits,
        revealedTraits: row.npc_revealed_traits || [],
        gender: row.npc_gender,
        emotionState: typeof row.npc_emotion_state === 'string'
          ? JSON.parse(row.npc_emotion_state)
          : row.npc_emotion_state,
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
        loras: row.npc_loras,
        currentLocation: row.current_location,
        createdAt: row.npc_created_at.toISOString()
      };

      const updatedRelationship = mapRowToRelationship(row, npc);

      console.log(
        `✅ Interaction: ${activity.name} with ${npc.name} ` +
          `(T: ${relationship.trust} → ${newTrust}, A: ${relationship.affection} → ${newAffection}, D: ${relationship.desire} → ${newDesire}) ` +
          `State: ${previousState}${stateChanged ? ` → ${newState}` : ''} ` +
          `[Energy: ${player.currentEnergy} → ${newEnergy}, Money: ${player.money} → ${newMoney}]`
      );

      res.json({
        success: true,
        relationship: updatedRelationship,
        stateChanged,
        previousState,
        newState,
        emotionalState
      });
    } catch (error) {
      console.error(`❌ Error performing activity for user ${userId} with NPC ${npcId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform activity';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    } finally {
      client.release();
    }
  }
);

export default router;
