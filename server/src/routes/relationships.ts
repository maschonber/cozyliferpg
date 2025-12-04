/**
 * Relationship Routes
 * API endpoints for relationship management and interactions
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db';
import {
  calculateRelationshipState,
  applyActivityEffects,
  getContextualEmotionalState,
  updateUnlockedStates,
  getActivityById,
  getAvailableActivities
} from '../services/relationship';
import {
  Relationship,
  ApiResponse,
  PerformActivityRequest,
  PerformActivityResponse,
  Activity,
  NPC
} from '../../../shared/types';
import { randomUUID } from 'crypto';

const router = Router();

/**
 * Helper: Map database row to Relationship object
 */
function mapRowToRelationship(row: any, npc?: NPC): Relationship {
  return {
    id: row.id,
    playerId: row.player_id,
    npcId: row.npc_id,
    friendship: row.friendship,
    romance: row.romance,
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
  // Check if relationship exists
  const existing = await client.query(
    `SELECT * FROM relationships WHERE player_id = $1 AND npc_id = $2`,
    [playerId, npcId]
  );

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    return {
      relationship: mapRowToRelationship(row),
      isNew: false
    };
  }

  // Create new relationship
  const id = randomUUID();
  const now = new Date();
  const initialState = 'stranger';

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

  return {
    relationship: mapRowToRelationship(result.rows[0]),
    isNew: true
  };
}

/**
 * GET /api/relationships
 * Get all relationships for the authenticated user
 */
router.get('/', async (req: Request, res: Response<ApiResponse<Relationship[]>>) => {
  const client = await pool.connect();

  try {
    // Get user ID from JWT (added by auth middleware)
    const userId = (req as any).user.id;

    // Join with NPCs to get NPC data
    const result = await client.query(
      `
      SELECT
        r.*,
        n.id as npc_id,
        n.name as npc_name,
        n.archetype as npc_archetype,
        n.traits as npc_traits,
        n.hair_color, n.hair_style, n.eye_color, n.build, n.height, n.skin_tone,
        n.distinctive_features, n.style, n.created_at as npc_created_at
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
        appearance: {
          hairColor: row.hair_color,
          hairStyle: row.hair_style,
          eyeColor: row.eye_color,
          build: row.build,
          height: row.height,
          skinTone: row.skin_tone,
          distinctiveFeatures: row.distinctive_features,
          style: row.style
        },
        createdAt: row.npc_created_at.toISOString()
      };

      return mapRowToRelationship(row, npc);
    });

    res.json({
      success: true,
      data: relationships
    });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch relationships'
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/relationships/:npcId
 * Get or create relationship with specific NPC
 */
router.get('/:npcId', async (req: Request, res: Response<ApiResponse<Relationship>>) => {
  const { npcId } = req.params;
  const client = await pool.connect();

  try {
    const userId = (req as any).user.id;

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
      appearance: {
        hairColor: npcRow.hair_color,
        hairStyle: npcRow.hair_style,
        eyeColor: npcRow.eye_color,
        build: npcRow.build,
        height: npcRow.height,
        skinTone: npcRow.skin_tone,
        distinctiveFeatures: npcRow.distinctive_features,
        style: npcRow.style
      },
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
    console.error('Error fetching/creating relationship:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get relationship'
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/relationships/:npcId/interact
 * Perform an activity with an NPC
 */
router.post(
  '/:npcId/interact',
  async (req: Request, res: Response<PerformActivityResponse>) => {
    const { npcId } = req.params;
    const { activityId }: PerformActivityRequest = req.body;
    const client = await pool.connect();

    try {
      const userId = (req as any).user.id;

      // Validate activity
      const activity = getActivityById(activityId);
      if (!activity) {
        res.status(400).json({
          success: false,
          error: 'Invalid activity'
        });
        return;
      }

      // Get or create relationship
      const { relationship } = await getOrCreateRelationship(client, userId, npcId);

      // Calculate new values
      const { friendship: newFriendship, romance: newRomance } = applyActivityEffects(
        relationship.friendship,
        relationship.romance,
        activity.effects.friendship || 0,
        activity.effects.romance || 0
      );

      // Calculate new state
      const previousState = relationship.currentState;
      const newState = calculateRelationshipState(newFriendship, newRomance);
      const stateChanged = previousState !== newState;

      // Update unlocked states
      const unlockedStates = updateUnlockedStates(relationship.unlockedStates, newState);

      // Get emotional state
      const emotionalState = getContextualEmotionalState(
        activity.effects.friendship || 0,
        activity.effects.romance || 0,
        newState
      );

      // Update relationship in database
      await client.query(
        `
        UPDATE relationships
        SET friendship = $1, romance = $2, current_state = $3,
            unlocked_states = $4, last_interaction = $5
        WHERE id = $6
        `,
        [newFriendship, newRomance, newState, unlockedStates, new Date(), relationship.id]
      );

      // Create interaction record
      const interactionId = randomUUID();
      await client.query(
        `
        INSERT INTO interactions (
          id, relationship_id, activity_type,
          friendship_delta, romance_delta, emotional_state, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          interactionId,
          relationship.id,
          activity.name,
          activity.effects.friendship || 0,
          activity.effects.romance || 0,
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
          n.hair_color, n.hair_style, n.eye_color, n.build, n.height, n.skin_tone,
          n.distinctive_features, n.style, n.created_at as npc_created_at
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
        appearance: {
          hairColor: row.hair_color,
          hairStyle: row.hair_style,
          eyeColor: row.eye_color,
          build: row.build,
          height: row.height,
          skinTone: row.skin_tone,
          distinctiveFeatures: row.distinctive_features,
          style: row.style
        },
        createdAt: row.npc_created_at.toISOString()
      };

      const updatedRelationship = mapRowToRelationship(row, npc);

      console.log(
        `✅ Interaction: ${activity.name} with ${npc.name} ` +
          `(F: ${relationship.friendship} → ${newFriendship}, R: ${relationship.romance} → ${newRomance}) ` +
          `State: ${previousState}${stateChanged ? ` → ${newState}` : ''}`
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
      console.error('Error performing activity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform activity'
      });
    } finally {
      client.release();
    }
  }
);

/**
 * GET /api/activities
 * Get all available activities
 */
router.get('/activities/list', async (req: Request, res: Response<ApiResponse<Activity[]>>) => {
  try {
    const activities = getAvailableActivities();
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities'
    });
  }
});

export default router;
