/**
 * Relationship Routes
 * API endpoints for relationship management and interactions
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import {
  calculateRelationshipState,
  applyRelationshipDelta,
  getRelationshipDifficultyModifier,
  updateUnlockedStates,
  getActivityById,
  calculateDesireCap
} from '../services/relationship';
import { getOrCreatePlayerCharacter, updatePlayerCharacter } from '../services/player';
import { canPerformActivity, addMinutes } from '../services/time';
import {
  applyEmotionDelta,
  decayEmotions,
  getDominantEmotions,
  getHoursSinceUpdate
} from '../services/emotion';
import {
  calculateDynamicDifficulty,
  getActivityEffects,
  updateStreak
} from '../services/social-activity';
import {
  getTraitActivityBonus,
  getArchetypeBonus,
  discoverTrait
} from '../services/trait';
import { rollOutcome } from '../services/outcome';
import {
  Relationship,
  ApiResponse,
  PerformActivityRequest,
  PerformActivityResponse,
  NPC,
  NPCEmotionState,
  EmotionDisplay
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
 * Helper: Build NPC object from database row with emotion decay applied
 */
function buildNPCFromRow(row: any, trustLevel: number): NPC {
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

  return {
    id: row.id,
    name: row.name,
    archetype: row.archetype,
    traits: row.traits,
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

  // Create new relationship
  const id = randomUUID();
  const now = new Date();
  const initialState = 'stranger';

  console.log(`📝 Creating new relationship: Player ${playerId} <-> NPC ${npcId}`);

  const result = await client.query(
    `
    INSERT INTO relationships (
      id, player_id, npc_id, trust, affection, desire,
      current_state, unlocked_states, first_met, last_interaction
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
    `,
    [id, playerId, npcId, 0, 0, 0, initialState, [initialState], now, now]
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
      // Build NPC with emotion decay applied
      const npc = buildNPCFromRow({
        id: row.npc_id,
        name: row.npc_name,
        archetype: row.npc_archetype,
        traits: row.npc_traits,
        revealed_traits: row.npc_revealed_traits,
        gender: row.npc_gender,
        emotion_state: row.npc_emotion_state,
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
      }, row.trust);

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

    // Populate NPC data with emotion decay applied
    const npcRow = npcResult.rows[0];
    const npc = buildNPCFromRow(npcRow, relationship.trust);

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
 * Perform an activity with an NPC
 *
 * Task 7: Fully integrated with emotion, relationship, trait, and outcome systems
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
      await client.query('BEGIN');

      // Validate activity
      const activity = getActivityById(activityId);
      if (!activity) {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          error: 'Invalid activity'
        });
        return;
      }

      // Get player character
      const player = await getOrCreatePlayerCharacter(pool, userId);

      // Fetch NPC data with emotion state
      const npcResult = await client.query(`SELECT * FROM npcs WHERE id = $1`, [npcId]);
      if (npcResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({
          success: false,
          error: 'NPC not found'
        });
        return;
      }
      const npcRow = npcResult.rows[0];

      // Parse NPC data
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

      // Validate activity can be performed (location, time, energy checks)
      const availability = canPerformActivity(activity, player, npc.currentLocation);
      if (!availability.available) {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          error: availability.reason || 'Activity cannot be performed'
        });
        return;
      }

      // Get or create relationship
      const { relationship } = await getOrCreateRelationship(client, userId, npcId);

      // Apply emotion decay since last update
      const hoursSinceUpdate = getHoursSinceUpdate(npc.emotionState.lastUpdated);
      let currentEmotionState = decayEmotions(
        npc.emotionState,
        hoursSinceUpdate,
        relationship.trust,
        npc.traits
      );

      // Calculate dynamic difficulty with all modifiers
      const traitBonus = getTraitActivityBonus(npc.revealedTraits, activityId);
      const archetypeBonus = getArchetypeBonus(
        player.archetype,
        npc.archetype,
        activity.category
      );
      const totalTraitBonus = traitBonus + archetypeBonus;

      const relationshipModifier = getRelationshipDifficultyModifier(
        { trust: relationship.trust, affection: relationship.affection, desire: relationship.desire },
        relationship.currentState
      );

      // TODO: Load streak from database if we want to persist it
      const streak = undefined; // For now, no streak tracking

      const difficultyCalc = calculateDynamicDifficulty(
        activity.difficulty || 50, // Default to medium difficulty if not specified
        currentEmotionState,
        { trust: relationship.trust, affection: relationship.affection, desire: relationship.desire },
        relationship.currentState,
        relationshipModifier,
        totalTraitBonus,
        streak
      );

      // Roll for outcome
      const outcomeResult = rollOutcome(
        player.stats,
        activity.relevantStats || [],
        difficultyCalc.finalDifficulty
      );

      // Get scaled relationship and emotion effects based on outcome
      const effects = getActivityEffects(
        activityId,
        {
          trust: activity.effects.trust || 0,
          affection: activity.effects.affection || 0,
          desire: activity.effects.desire || 0
        },
        outcomeResult.tier
      );

      // Apply relationship deltas
      const newAxes = applyRelationshipDelta(
        { trust: relationship.trust, affection: relationship.affection, desire: relationship.desire },
        effects.relationshipEffects,
        relationship.desireCap
      );

      // Calculate new relationship state
      const previousState = relationship.currentState;
      const newState = calculateRelationshipState(newAxes.trust, newAxes.affection, newAxes.desire);
      const stateChanged = previousState !== newState;

      // Update unlocked states
      const unlockedStates = updateUnlockedStates(relationship.unlockedStates, newState);

      // Apply emotion deltas
      currentEmotionState = applyEmotionDelta(currentEmotionState, effects.emotionEffects);

      // Get dominant emotion for display
      const dominantEmotion = getDominantEmotions(currentEmotionState);

      // Attempt trait discovery based on activity type
      let discoveredTrait: { trait: string; isNew: boolean } | null = null;
      const discoveryMethod = getDiscoveryMethod(activityId);
      if (discoveryMethod) {
        const discovery = discoverTrait(npc, discoveryMethod);
        if (discovery && discovery.isNew) {
          discoveredTrait = discovery;
          // Update revealed traits in NPC
          await client.query(
            `UPDATE npcs SET revealed_traits = array_append(revealed_traits, $1) WHERE id = $2`,
            [discovery.trait, npcId]
          );
        }
      }

      // Update player resources
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
        `UPDATE relationships
         SET trust = $1, affection = $2, desire = $3, current_state = $4,
             unlocked_states = $5, last_interaction = $6
         WHERE id = $7`,
        [newAxes.trust, newAxes.affection, newAxes.desire, newState, unlockedStates, new Date(), relationship.id]
      );

      // Update NPC emotion state
      await client.query(
        `UPDATE npcs SET emotion_state = $1 WHERE id = $2`,
        [JSON.stringify(currentEmotionState), npcId]
      );

      // Create interaction record
      const interactionId = randomUUID();
      await client.query(
        `INSERT INTO interactions (
           id, relationship_id, activity_type,
           trust_delta, affection_delta, desire_delta,
           emotion_snapshot, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          interactionId,
          relationship.id,
          activity.name,
          effects.relationshipEffects.trust || 0,
          effects.relationshipEffects.affection || 0,
          effects.relationshipEffects.desire || 0,
          JSON.stringify(currentEmotionState),
          new Date()
        ]
      );

      await client.query('COMMIT');

      // Build updated relationship object
      const updatedRelationship: Relationship = {
        ...relationship,
        trust: newAxes.trust,
        affection: newAxes.affection,
        desire: newAxes.desire,
        currentState: newState,
        unlockedStates: unlockedStates as any,
        lastInteraction: new Date().toISOString(),
        npc: {
          ...npc,
          emotionState: currentEmotionState,
          revealedTraits: discoveredTrait && discoveredTrait.isNew
            ? [...npc.revealedTraits, discoveredTrait.trait as any]
            : npc.revealedTraits
        }
      };

      console.log(
        `✅ Interaction: ${activity.name} with ${npc.name} ` +
          `(Outcome: ${outcomeResult.tier}) ` +
          `(T: ${relationship.trust} → ${newAxes.trust}, A: ${relationship.affection} → ${newAxes.affection}, D: ${relationship.desire} → ${newAxes.desire}) ` +
          `State: ${previousState}${stateChanged ? ` → ${newState}` : ''} ` +
          `Emotion: ${dominantEmotion.primary.label}` +
          (discoveredTrait?.isNew ? ` [Discovered: ${discoveredTrait.trait}]` : '')
      );

      res.json({
        success: true,
        relationship: updatedRelationship,
        stateChanged,
        previousState,
        newState,
        emotionalState: dominantEmotion.primary.label as any // Use new emotion display
      });
    } catch (error) {
      await client.query('ROLLBACK');
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

/**
 * Helper: Map activity ID to trait discovery method
 */
function getDiscoveryMethod(activityId: string): string | null {
  // Map specific activities to discovery methods
  const discoveryMap: Record<string, string> = {
    'have_coffee': 'conversation',
    'study_together': 'conversation',
    'go_to_movie': 'shared_activity',
    'work_out_together': 'shared_activity',
    'go_to_party': 'shared_activity',
    'have_deep_conversation': 'deep_conversation',
    'go_on_date': 'date',
    'flirt_playfully': 'date'
  };

  return discoveryMap[activityId] || 'conversation'; // Default to conversation
}

export default router;
