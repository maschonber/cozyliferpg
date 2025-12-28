/**
 * Activities Routes (Unified Endpoint)
 * API endpoints for activity management and execution
 * Handles both solo and social activities through a single endpoint
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import {
  getActivityById,
  getAvailableActivities,
  calculateRelationshipState,
  applyRelationshipDelta,
  getRelationshipDifficultyModifier,
  updateUnlockedStates,
  calculateDesireCap
} from '../services/relationship';
import { getOrCreatePlayerCharacter, updatePlayerCharacter } from '../services/player';
import { canPerformActivity, addMinutes } from '../services/time';
import { rollOutcome, meetsStatRequirements } from '../services/outcome';
import { applyStatEffects, getBaseStat, getCurrentStat } from '../services/stat';
import { recordPlayerActivity } from '../services/activity-history';
import { generateOutcome } from '../services/outcome-generator';
import {
  calculateDynamicDifficulty,
  getActivityEffects
} from '../services/social-activity';
import {
  getTraitActivityBonus,
  getTraitActivityBreakdown,
  getContributingTrait,
  getTraitDefinition
} from '../services/trait';
import {
  interpretEmotionVectorSlim,
  applyEmotionPulls,
  generateActivityEmotionPulls,
  hasEmotionProfile
} from '../services/plutchik-emotion';
import { ActivityTag } from '../../../shared/types/activity.types';
import { randomUUID } from 'crypto';
import {
  ApiResponse,
  PerformActivityRequest,
  Activity,
  ActivityAvailability,
  ActivityResult,
  isSocialActivity,
  StatName,
  StatChange,
  DifficultyBreakdown,
  Relationship,
  NPC,
  NEUTRAL_EMOTION_VECTOR
} from '../../../shared/types';

const router = Router();

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
 * Helper: Map database row to Relationship object
 */
function mapRowToRelationship(row: any, npc?: NPC): Relationship {
  return {
    id: row.id,
    playerId: row.player_id,
    npcId: row.npc_id,
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
 * Helper: Get or create relationship between player and NPC
 */
async function getOrCreateRelationship(
  client: any,
  playerId: string,
  npcId: string
): Promise<{ relationship: Relationship; isNew: boolean }> {
  if (!playerId || !npcId) {
    throw new Error('Invalid player ID or NPC ID');
  }

  const existing = await client.query(
    `SELECT * FROM relationships WHERE player_id = $1 AND npc_id = $2`,
    [playerId, npcId]
  );

  if (existing.rows.length > 0) {
    return {
      relationship: mapRowToRelationship(existing.rows[0]),
      isNew: false
    };
  }

  // Get NPC gender and player preference to calculate desire cap
  const npcResult = await client.query('SELECT gender FROM npcs WHERE id = $1', [npcId]);
  if (npcResult.rows.length === 0) {
    throw new Error(`NPC with ID ${npcId} does not exist`);
  }
  const npcGender = npcResult.rows[0].gender;

  const playerResult = await client.query('SELECT sexual_preference FROM player_characters WHERE user_id = $1', [playerId]);
  const playerPreference = playerResult.rows[0]?.sexual_preference || 'everyone';
  const desireCap = calculateDesireCap(playerPreference, npcGender);

  // Create new relationship
  const id = randomUUID();
  const now = new Date();
  const initialState = 'stranger';

  const result = await client.query(
    `INSERT INTO relationships (
      id, player_id, npc_id, trust, affection, desire, desire_cap,
      current_state, unlocked_states, first_met, last_interaction
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [id, playerId, npcId, 0, 0, 0, desireCap, initialState, [initialState], now, now]
  );

  return {
    relationship: mapRowToRelationship(result.rows[0]),
    isNew: true
  };
}

/**
 * GET /api/activities
 * Get all available activities with availability status
 */
router.get('/', async (req: AuthRequest, res: Response<ApiResponse<{ activities: Activity[], availability: ActivityAvailability[] }>>) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  const userId = req.user.userId;

  try {
    const activities = getAvailableActivities();
    const player = await getOrCreatePlayerCharacter(pool, userId);
    const availability = activities.map(activity => canPerformActivity(activity, player));

    res.json({
      success: true,
      data: {
        activities,
        availability
      }
    });
  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch activities';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * POST /api/activities/perform
 * Perform an activity (solo or social)
 * For social activities, npcId is required in the request body
 */
router.post(
  '/perform',
  async (req: AuthRequest, res: Response<ApiResponse<ActivityResult>>) => {
    const { activityId, npcId }: PerformActivityRequest = req.body;

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

      const isSocial = isSocialActivity(activity);

      // Validate NPC requirement
      if (isSocial && !npcId) {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          error: 'Social activities require an NPC. Provide npcId in the request.'
        });
        return;
      }

      // Get player character
      const player = await getOrCreatePlayerCharacter(pool, userId);

      // Fetch NPC data for social activities
      let npc: NPC | undefined;
      let relationship: Relationship | undefined;

      if (isSocial && npcId) {
        const npcResult = await client.query(`SELECT * FROM npcs WHERE id = $1`, [npcId]);
        if (npcResult.rows.length === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({
            success: false,
            error: 'NPC not found'
          });
          return;
        }
        npc = buildNPCFromRow(npcResult.rows[0]);

        // Get or create relationship
        const relResult = await getOrCreateRelationship(client, userId, npcId);
        relationship = relResult.relationship;
      }

      // Check stat requirements (uses BASE stat)
      if ('statRequirements' in activity && activity.statRequirements) {
        const reqCheck = meetsStatRequirements(player.stats, activity.statRequirements);
        if (!reqCheck.meets) {
          await client.query('ROLLBACK');
          const unmetList = reqCheck.unmet.map(u => `${u.stat}: ${u.actual}/${u.required}`).join(', ');
          res.status(400).json({
            success: false,
            error: `Stat requirements not met: ${unmetList}`
          });
          return;
        }
      }

      // Validate activity can be performed (energy, money, time, location)
      const availability = canPerformActivity(activity, player, npc?.currentLocation);
      if (!availability.available) {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          error: availability.reason || 'Activity cannot be performed'
        });
        return;
      }

      // Initialize result tracking variables
      let outcome: ActivityResult['outcome'];
      let difficultyBreakdown: DifficultyBreakdown | undefined;
      let statChanges: StatChange[] = [];
      let statsTrainedThisActivity: StatName[] = [];
      let newStats = player.stats;
      let additionalEnergyCost = 0;
      let additionalMoneyCost = 0;
      let additionalTimeCost = 0;

      // Social activity specific variables
      let relationshipChanges: ActivityResult['relationshipChanges'];
      let stateChanged = false;
      let previousState: ActivityResult['previousState'];
      let newState: ActivityResult['newState'];
      let discoveredTrait: ActivityResult['discoveredTrait'];
      let updatedRelationship: Relationship | undefined;

      // Calculate difficulty and roll outcome
      if ('difficulty' in activity && activity.difficulty !== undefined && activity.difficulty > 0) {
        let finalDifficulty: number;

        if (isSocial && npc && relationship) {
          // Social activity: dynamic difficulty with relationship and trait modifiers
          const activityTags = (activity.tags || []) as ActivityTag[];
          const traitBonus = getTraitActivityBonus(npc.traits, activityTags);
          const individualTraits = getTraitActivityBreakdown(npc.traits, activityTags);

          const relationshipModifier = getRelationshipDifficultyModifier(
            { trust: relationship.trust, affection: relationship.affection, desire: relationship.desire },
            relationship.currentState
          );

          const difficultyCalc = calculateDynamicDifficulty(
            activity.difficulty,
            relationshipModifier,
            traitBonus,
            individualTraits
          );

          finalDifficulty = difficultyCalc.finalDifficulty;
          difficultyBreakdown = difficultyCalc;
        } else {
          // Solo activity: simple difficulty
          finalDifficulty = 100 + activity.difficulty;
          difficultyBreakdown = {
            baseDifficulty: 100,
            activityModifier: activity.difficulty,
            finalDifficulty
          };
        }

        // Roll for outcome
        const rollResult = rollOutcome(
          player.stats,
          ('relevantStats' in activity && activity.relevantStats) ? activity.relevantStats : [],
          finalDifficulty
        );

        outcome = {
          tier: rollResult.tier,
          roll: rollResult.roll,
          adjustedRoll: rollResult.adjustedRoll,
          statBonus: rollResult.statBonus,
          difficultyPenalty: rollResult.difficultyPenalty,
          statsUsed: rollResult.statsUsed
        };

        // Generate stat effects from outcome profile
        if ('outcomeProfile' in activity && activity.outcomeProfile) {
          const generatedOutcome = generateOutcome(rollResult.tier, activity.outcomeProfile);

          if (Object.keys(generatedOutcome.statEffects).length > 0) {
            const statResult = applyStatEffects(player.stats, generatedOutcome.statEffects);
            newStats = statResult.newStats;

            statChanges = Object.entries(statResult.actualChanges).map(([stat, change]) => {
              const statName = stat as StatName;
              const previousCurrent = getCurrentStat(player.stats, statName);
              const newCurrent = getCurrentStat(newStats, statName);
              const baseStat = getBaseStat(player.stats, statName);

              return {
                stat: statName,
                previousBase: baseStat,
                newBase: baseStat,
                previousCurrent: previousCurrent,
                newCurrent: newCurrent,
                baseDelta: 0,
                currentDelta: change || 0
              };
            });

            statsTrainedThisActivity = Object.entries(generatedOutcome.statEffects)
              .filter(([_, value]) => value > 0)
              .map(([stat, _]) => stat as StatName);
          }

          additionalEnergyCost = generatedOutcome.additionalEnergyCost;
          additionalMoneyCost = generatedOutcome.additionalMoneyCost;
          additionalTimeCost = generatedOutcome.additionalTimeCost;
        }

        // Process social activity relationship effects
        if (isSocial && npc && relationship) {
          const effects = getActivityEffects(
            {
              trust: activity.relationshipEffects.trust || 0,
              affection: activity.relationshipEffects.affection || 0,
              desire: activity.relationshipEffects.desire || 0
            },
            rollResult.tier
          );

          const newAxes = applyRelationshipDelta(
            { trust: relationship.trust, affection: relationship.affection, desire: relationship.desire },
            effects.relationshipEffects,
            relationship.desireCap
          );

          previousState = relationship.currentState;
          newState = calculateRelationshipState(newAxes.trust, newAxes.affection, newAxes.desire);
          stateChanged = previousState !== newState;

          const unlockedStates = updateUnlockedStates(relationship.unlockedStates, newState);

          // Track relationship changes for response
          relationshipChanges = {
            previousValues: {
              trust: relationship.trust,
              affection: relationship.affection,
              desire: relationship.desire
            },
            newValues: newAxes,
            deltas: {
              trust: effects.relationshipEffects.trust || 0,
              affection: effects.relationshipEffects.affection || 0,
              desire: effects.relationshipEffects.desire || 0
            }
          };

          // Attempt trait discovery
          const activityTags = (activity.tags || []) as ActivityTag[];
          if (activityTags.length > 0) {
            const discovery = getContributingTrait(npc, activityTags);
            if (discovery && discovery.isNew) {
              await client.query(
                `UPDATE npcs SET revealed_traits = array_append(revealed_traits, $1) WHERE id = $2`,
                [discovery.trait, npcId]
              );
              discoveredTrait = {
                trait: discovery.trait as any,
                traitName: getTraitDefinition(discovery.trait as any).name,
                traitDescription: getTraitDefinition(discovery.trait as any).description,
                isNew: discovery.isNew
              };
            }
          }

          // Validate axis values before database update
          const trustValue = Number.isFinite(newAxes.trust) ? newAxes.trust : 0;
          const affectionValue = Number.isFinite(newAxes.affection) ? newAxes.affection : 0;
          const desireValue = Number.isFinite(newAxes.desire) ? newAxes.desire : 0;

          // Apply emotion effects to NPC based on activity outcome
          let updatedEmotionVector = npc.emotionVector;
          if (hasEmotionProfile(activity.emotionProfile)) {
            const emotionPulls = generateActivityEmotionPulls(
              activity.emotionProfile,
              rollResult.tier
            );
            updatedEmotionVector = applyEmotionPulls(npc.emotionVector, emotionPulls);

            // Update NPC emotion vector in database
            await client.query(
              `UPDATE npcs SET emotion_vector = $1 WHERE id = $2`,
              [JSON.stringify(updatedEmotionVector), npcId]
            );

            // Update the npc object with new emotion state for response
            npc = {
              ...npc,
              emotionVector: updatedEmotionVector,
              emotionInterpretation: interpretEmotionVectorSlim(updatedEmotionVector)
            };
          }

          // Update relationship in database
          await client.query(
            `UPDATE relationships
             SET trust = $1, affection = $2, desire = $3, current_state = $4,
                 unlocked_states = $5, last_interaction = $6
             WHERE id = $7`,
            [trustValue, affectionValue, desireValue, newState, unlockedStates, new Date(), relationship.id]
          );

          // Build updated relationship object
          updatedRelationship = {
            ...relationship,
            trust: trustValue,
            affection: affectionValue,
            desire: desireValue,
            currentState: newState,
            unlockedStates: unlockedStates as any,
            lastInteraction: new Date().toISOString(),
            npc: {
              ...npc,
              revealedTraits: discoveredTrait?.isNew
                ? [...npc.revealedTraits, discoveredTrait.trait as any]
                : npc.revealedTraits
            }
          };
        }
      }

      // Calculate new resource values
      const newEnergy = Math.max(0, Math.min(100, player.currentEnergy + activity.energyCost + additionalEnergyCost));
      const newMoney = player.money + activity.moneyCost + additionalMoneyCost;
      const newTime = addMinutes(player.currentTime, activity.timeCost + additionalTimeCost);

      // Track minimum energy
      const minEnergy = Math.min(player.tracking.minEnergyToday, newEnergy);
      const workedToday = player.tracking.workedToday || activity.type === 'work';
      const hadCatastrophicFailure = player.tracking.hadCatastrophicFailureToday || (outcome?.tier === 'catastrophic');
      const allStatsTrainedToday = Array.from(new Set([
        ...player.tracking.statsTrainedToday,
        ...statsTrainedThisActivity
      ]));

      // Record activity in history
      await recordPlayerActivity(pool, {
        playerId: player.id,
        activityId: activity.id,
        dayNumber: player.currentDay,
        timeOfDay: player.currentTime,
        outcomeTier: outcome?.tier,
        roll: outcome?.roll,
        adjustedRoll: outcome?.adjustedRoll,
        statBonus: outcome?.statBonus,
        difficultyPenalty: outcome?.difficultyPenalty,
        statEffects: statChanges.length > 0 ? Object.fromEntries(
          statChanges.map(c => [c.stat, c.currentDelta])
        ) : undefined,
        relationshipEffects: isSocial && relationshipChanges ? {
          trust: relationshipChanges.deltas.trust,
          affection: relationshipChanges.deltas.affection,
          desire: relationshipChanges.deltas.desire
        } : undefined,
        energyDelta: newEnergy - player.currentEnergy,
        moneyDelta: newMoney - player.money,
        npcId: isSocial ? npcId : undefined
      });

      // Update player with new stats and tracking
      const updatedPlayer = await updatePlayerCharacter(pool, player.id, {
        currentEnergy: newEnergy,
        money: newMoney,
        currentTime: newTime,
        stats: newStats,
        tracking: {
          ...player.tracking,
          minEnergyToday: minEnergy,
          endingEnergyToday: newEnergy,
          workedToday,
          hadCatastrophicFailureToday: hadCatastrophicFailure,
          statsTrainedToday: allStatsTrainedToday as StatName[]
        }
      });

      await client.query('COMMIT');

      const activityType = isSocial ? 'social' : 'solo';
      console.log(
        `✅ User ${userId} performed ${activityType} activity: ${activity.name}` +
        (outcome ? ` (${outcome.tier})` : '') +
        (isSocial && npc ? ` with ${npc.name}` : '') +
        (stateChanged ? ` [State: ${previousState} → ${newState}]` : '') +
        (discoveredTrait?.isNew ? ` [Discovered: ${discoveredTrait.trait}]` : '')
      );

      res.json({
        success: true,
        data: {
          player: updatedPlayer,
          activityType,
          outcome,
          statChanges: statChanges.length > 0 ? statChanges : undefined,
          statsTrainedThisActivity: statsTrainedThisActivity.length > 0 ? statsTrainedThisActivity : undefined,
          actualEnergyCost: activity.energyCost + additionalEnergyCost,
          actualMoneyCost: activity.moneyCost + additionalMoneyCost,
          actualTimeCost: activity.timeCost + additionalTimeCost,
          difficultyBreakdown,

          // Social activity fields
          npc,
          relationship: updatedRelationship,
          relationshipChanges,
          stateChanged: isSocial ? stateChanged : undefined,
          previousState: isSocial ? previousState : undefined,
          newState: isSocial ? newState : undefined,
          emotionalState: npc?.emotionInterpretation?.emotion as any,
          discoveredTrait
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Error performing activity for user ${userId}:`, error);
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
