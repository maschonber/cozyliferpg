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
import {
  isSocialActivity
} from '../../../shared/types';
import { getOrCreatePlayerCharacter, updatePlayerCharacter } from '../services/player';
import { canPerformActivity, addMinutes } from '../services/time';
import { recordPlayerActivity } from '../services/activity-history';
import {
  calculateDynamicDifficulty,
  getActivityEffects,
} from '../services/social-activity';
import {
  getTraitActivityBonus,
  getTraitActivityBreakdown,
  getContributingTrait,
  getTraitDefinition
} from '../services/trait';
import { ActivityTag } from '../../../shared/types/activity.types';
import { rollOutcome } from '../services/outcome';
import { interpretEmotionVectorSlim } from '../services/plutchik-emotion';
import {
  Relationship,
  ApiResponse,
  PerformActivityRequest,
  PerformActivityResponse,
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

      // Fetch NPC data
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

      // Build NPC from row (uses new Plutchik emotion system)
      const npc = buildNPCFromRow(npcRow);

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

      // Calculate dynamic difficulty with all modifiers (no emotion modifier for now)
      // Use activity tags for trait bonus calculation (all traits, not just revealed)
      const activityTags = (activity.tags || []) as ActivityTag[];
      const traitBonus = getTraitActivityBonus(npc.traits, activityTags);

      // Get detailed breakdowns for transparency
      const individualTraits = getTraitActivityBreakdown(npc.traits, activityTags);

      const relationshipModifier = getRelationshipDifficultyModifier(
        { trust: relationship.trust, affection: relationship.affection, desire: relationship.desire },
        relationship.currentState
      );

      // Calculate difficulty (emotion modifier removed - will be re-added with Plutchik system)
      const difficultyCalc = calculateDynamicDifficulty(
        ('difficulty' in activity && activity.difficulty) ? activity.difficulty : 50, // Default to medium difficulty if not specified
        relationshipModifier,
        traitBonus,        // NPC trait bonus
        individualTraits   // Detailed trait contributions
      );

      // Roll for outcome
      const outcomeResult = rollOutcome(
        player.stats,
        ('relevantStats' in activity && activity.relevantStats) ? activity.relevantStats : [],
        difficultyCalc.finalDifficulty
      );

      // Get scaled relationship effects based on outcome (no emotion effects for now)
      // Social activities have relationshipEffects
      if (!isSocialActivity(activity)) {
        throw new Error('Activity must be a social activity');
      }

      const effects = getActivityEffects(
        {
          trust: activity.relationshipEffects.trust || 0,
          affection: activity.relationshipEffects.affection || 0,
          desire: activity.relationshipEffects.desire || 0
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

      // Attempt trait discovery - reveal trait when it first affects an activity
      let discoveredTrait: { trait: string; isNew: boolean } | null = null;
      if (activityTags.length > 0) {
        const discovery = getContributingTrait(npc, activityTags);
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

      // Validate axis values before database update (defensive programming)
      const trustValue = Number.isFinite(newAxes.trust) ? newAxes.trust : 0;
      const affectionValue = Number.isFinite(newAxes.affection) ? newAxes.affection : 0;
      const desireValue = Number.isFinite(newAxes.desire) ? newAxes.desire : 0;

      // Update relationship in database
      await client.query(
        `UPDATE relationships
         SET trust = $1, affection = $2, desire = $3, current_state = $4,
             unlocked_states = $5, last_interaction = $6
         WHERE id = $7`,
        [trustValue, affectionValue, desireValue, newState, unlockedStates, new Date(), relationship.id]
      );

      // Record activity in player_activities (social activities now go here too)
      await recordPlayerActivity(pool, {
        playerId: player.id,
        activityId: activity.id,
        dayNumber: player.currentDay,
        timeOfDay: player.currentTime,
        outcomeTier: outcomeResult.tier,
        roll: outcomeResult.roll,
        adjustedRoll: outcomeResult.adjustedRoll,
        statBonus: outcomeResult.statBonus,
        difficultyPenalty: difficultyCalc.finalDifficulty,
        relationshipEffects: {
          trust: effects.relationshipEffects.trust || 0,
          affection: effects.relationshipEffects.affection || 0,
          desire: effects.relationshipEffects.desire || 0
        },
        energyDelta: newEnergy - player.currentEnergy,
        moneyDelta: newMoney - player.money,
        npcId: npcId
      });

      await client.query('COMMIT');

      // Build updated relationship object (use validated values)
      const updatedRelationship: Relationship = {
        ...relationship,
        trust: trustValue,
        affection: affectionValue,
        desire: desireValue,
        currentState: newState,
        unlockedStates: unlockedStates as any,
        lastInteraction: new Date().toISOString(),
        npc: {
          ...npc,
          revealedTraits: discoveredTrait && discoveredTrait.isNew
            ? [...npc.revealedTraits, discoveredTrait.trait as any]
            : npc.revealedTraits
        }
      };

      console.log(
        `✅ Interaction: ${activity.name} with ${npc.name} ` +
          `(Outcome: ${outcomeResult.tier}) ` +
          `(T: ${relationship.trust} → ${trustValue}, A: ${relationship.affection} → ${affectionValue}, D: ${relationship.desire} → ${desireValue}) ` +
          `State: ${previousState}${stateChanged ? ` → ${newState}` : ''} ` +
          `Emotion: ${npc.emotionInterpretation?.emotion || 'neutral'}` +
          (discoveredTrait?.isNew ? ` [Discovered: ${discoveredTrait.trait}]` : '')
      );

      res.json({
        success: true,
        relationship: updatedRelationship,
        stateChanged,
        previousState,
        newState,
        emotionalState: (npc.emotionInterpretation?.emotion || 'neutral') as any,

        // Enhanced response fields
        discoveredTrait: discoveredTrait ? {
          trait: discoveredTrait.trait as any,
          traitName: getTraitDefinition(discoveredTrait.trait as any).name,
          traitDescription: getTraitDefinition(discoveredTrait.trait as any).description,
          isNew: discoveredTrait.isNew
        } : undefined,

        outcome: {
          tier: outcomeResult.tier,
          description: getOutcomeDescription(outcomeResult.tier),
          roll: outcomeResult.roll,
          adjustedRoll: outcomeResult.adjustedRoll,
          statBonus: outcomeResult.statBonus,
          dc: outcomeResult.dc,
          isCritSuccess: outcomeResult.isCritSuccess,
          isCritFail: outcomeResult.isCritFail,
          statsUsed: outcomeResult.statsUsed
        },

        // Difficulty breakdown with full details
        difficultyBreakdown: difficultyCalc
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
 * Helper: Get description for outcome tier
 */
function getOutcomeDescription(tier: string): string {
  switch (tier) {
    case 'best':
      return 'Everything went perfectly!';
    case 'okay':
      return 'Things went well.';
    case 'mixed':
      return 'Some good, some not so good.';
    case 'catastrophic':
      return 'Things went wrong...';
    default:
      return 'Activity completed.';
  }
}

export default router;
