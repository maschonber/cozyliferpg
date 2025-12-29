/**
 * Execute Activity Use Case
 *
 * Orchestrates the execution of both solo and social activities.
 * Handles validation, outcome calculation, stat/relationship effects,
 * and persistence within a single transaction.
 */

import { Pool, PoolClient } from 'pg';
import {
  ActivityResult,
  PlayerCharacter,
  Activity,
  NpcView,
  StatName,
  StatChange,
  DifficultyBreakdown,
  RelationshipState,
  isSocialActivity,
  NPCTrait,
  EmotionProfile
} from '../../../../../shared/types';
import { ActivityTag, ActivityWithDifficulty, hasActivityDifficulty } from '../../../../../shared/types/activity.types';

// Repositories
import {
  npcRepository,
  npcTemplateRepository,
  playerRepository,
  activityRepository
} from '../../../repositories';

// Domain services
import {
  getActivityById,
  calculateRelationshipState,
  applyRelationshipDelta,
  getRelationshipDifficultyModifier,
  calculateDesireCap
} from '../../relationship';
import { canPerformActivity } from '../activity.service';
import { addGameMinutes } from '../../time/game-time.service';
import { rollOutcome, meetsStatRequirements, BASE_DC } from '../../outcome';
import { applyStatEffects, getBaseStat, getCurrentStat } from '../../stat';
import { generateOutcome } from '../../outcome-generator';
import { calculateDynamicDifficulty, getActivityEffects } from '../../social-activity';
import {
  getTraitActivityBonus,
  getTraitActivityBreakdown,
  getContributingTraitFromPlayerNpc,
  getTraitDefinition
} from '../../trait';
import {
  interpretEmotionVectorSlim,
  applyEmotionPulls,
  generateActivityEmotionPulls,
  hasEmotionProfile
} from '../../plutchik-emotion';

// ===== Types =====

export interface ExecuteActivityRequest {
  userId: string;
  activityId: string;
  npcId?: string;  // This is now the player_npc ID, not the template ID
}

export interface ExecuteActivityContext {
  pool: Pool;
}

export class ActivityValidationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ActivityValidationError';
  }
}

// ===== Validation =====

function validateActivity(activity: Activity | undefined): asserts activity is Activity {
  if (!activity) {
    throw new ActivityValidationError('Invalid activity');
  }
}

function validateSocialActivityHasNpc(isSocial: boolean, npcId?: string): void {
  if (isSocial && !npcId) {
    throw new ActivityValidationError('Social activities require an NPC. Provide npcId in the request.');
  }
}

function validateStatRequirements(player: PlayerCharacter, activity: Activity): void {
  if ('statRequirements' in activity && activity.statRequirements) {
    const reqCheck = meetsStatRequirements(player.stats, activity.statRequirements);
    if (!reqCheck.meets) {
      const unmetList = reqCheck.unmet.map(u => `${u.stat}: ${u.actual}/${u.required}`).join(', ');
      throw new ActivityValidationError(`Stat requirements not met: ${unmetList}`);
    }
  }
}

function validateAvailability(activity: Activity, player: PlayerCharacter, npcLocation?: string): void {
  const availability = canPerformActivity(activity, player, npcLocation);
  if (!availability.available) {
    throw new ActivityValidationError(availability.reason || 'Activity cannot be performed');
  }
}

// ===== Outcome Calculation =====

interface OutcomeCalculationResult {
  outcome: ActivityResult['outcome'];
  difficultyBreakdown: DifficultyBreakdown;
  statChanges: StatChange[];
  statsTrainedThisActivity: StatName[];
  newStats: PlayerCharacter['stats'];
  additionalEnergyCost: number;
  additionalMoneyCost: number;
  additionalTimeCost: number;
}

/**
 * Calculate outcome for an activity with difficulty
 * For social activities, uses the PlayerNPCView which contains all needed data
 */
function calculateOutcome(
  activity: ActivityWithDifficulty,
  player: PlayerCharacter,
  playerNpc?: NpcView,
  allTraits?: NPCTrait[]  // Master traits from template (for difficulty calculation)
): OutcomeCalculationResult {
  const isSocial = isSocialActivity(activity);
  let statChanges: StatChange[] = [];
  let statsTrainedThisActivity: StatName[] = [];
  let newStats = player.stats;
  let additionalEnergyCost = 0;
  let additionalMoneyCost = 0;
  let additionalTimeCost = 0;

  // Activity difficulty (guaranteed to exist by caller's type guard)
  const activityDifficulty = activity.difficulty ?? 0;

  // Calculate difficulty
  let finalDifficulty: number;
  let difficultyBreakdown: DifficultyBreakdown;

  if (isSocial && playerNpc && allTraits) {
    const activityTags = (activity.tags || []) as ActivityTag[];
    const traitBonus = getTraitActivityBonus(allTraits, activityTags);
    const individualTraits = getTraitActivityBreakdown(allTraits, activityTags);

    const relationshipModifier = getRelationshipDifficultyModifier(
      { trust: playerNpc.trust, affection: playerNpc.affection, desire: playerNpc.desire },
      playerNpc.currentState
    );

    const difficultyCalc = calculateDynamicDifficulty(
      activityDifficulty,
      relationshipModifier,
      traitBonus,
      individualTraits
    );

    finalDifficulty = difficultyCalc.finalDifficulty;
    difficultyBreakdown = difficultyCalc;
  } else {
    // Solo activities: calculate full DC (BASE_DC + activity difficulty)
    finalDifficulty = BASE_DC + activityDifficulty;
    difficultyBreakdown = {
      baseDifficulty: BASE_DC,
      activityModifier: activityDifficulty,
      finalDifficulty
    };
  }

  // Roll for outcome
  const rollResult = rollOutcome(
    player.stats,
    ('relevantStats' in activity && activity.relevantStats) ? activity.relevantStats : [],
    finalDifficulty
  );

  const outcome: ActivityResult['outcome'] = {
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
        .map(([stat]) => stat as StatName);
    }

    additionalEnergyCost = generatedOutcome.additionalEnergyCost;
    additionalMoneyCost = generatedOutcome.additionalMoneyCost;
    additionalTimeCost = generatedOutcome.additionalTimeCost;
  }

  return {
    outcome,
    difficultyBreakdown,
    statChanges,
    statsTrainedThisActivity,
    newStats,
    additionalEnergyCost,
    additionalMoneyCost,
    additionalTimeCost
  };
}

// ===== Social Effects Processing =====

interface SocialEffectsResult {
  relationshipChanges: ActivityResult['relationshipChanges'];
  stateChanged: boolean;
  previousState: RelationshipState;
  newState: RelationshipState;
  discoveredTrait: ActivityResult['discoveredTrait'];
  updatedPlayerNpc: NpcView;
  newAxes: { trust: number; affection: number; desire: number };
}

/**
 * Process social activity effects on the player-NPC relationship
 * Updates emotion, traits, and relationship axes in the database
 */
async function processSocialEffects(
  client: PoolClient,
  activity: Activity & { relationshipEffects: { trust?: number; affection?: number; desire?: number }; emotionProfile?: EmotionProfile },
  playerNpc: NpcView,
  allTraits: NPCTrait[],
  outcomeTier: string,
  player: PlayerCharacter,
  gameTimeMinutes: number
): Promise<SocialEffectsResult> {
  // Calculate desire cap at runtime
  const desireCap = calculateDesireCap(player.sexualPreference, playerNpc.gender);

  const effects = getActivityEffects(
    {
      trust: activity.relationshipEffects.trust || 0,
      affection: activity.relationshipEffects.affection || 0,
      desire: activity.relationshipEffects.desire || 0
    },
    outcomeTier as 'best' | 'okay' | 'mixed' | 'catastrophic'
  );

  const newAxes = applyRelationshipDelta(
    { trust: playerNpc.trust, affection: playerNpc.affection, desire: playerNpc.desire },
    effects.relationshipEffects,
    desireCap
  );

  const previousState = playerNpc.currentState;
  const newState = calculateRelationshipState(newAxes.trust, newAxes.affection, newAxes.desire);
  const stateChanged = previousState !== newState;

  const relationshipChanges: ActivityResult['relationshipChanges'] = {
    previousValues: {
      trust: playerNpc.trust,
      affection: playerNpc.affection,
      desire: playerNpc.desire
    },
    newValues: newAxes,
    deltas: {
      trust: effects.relationshipEffects.trust || 0,
      affection: effects.relationshipEffects.affection || 0,
      desire: effects.relationshipEffects.desire || 0
    }
  };

  // Attempt trait discovery
  let discoveredTrait: ActivityResult['discoveredTrait'];
  let updatedRevealedTraits = playerNpc.revealedTraits;
  const activityTags = (activity.tags || []) as ActivityTag[];

  if (activityTags.length > 0) {
    const discovery = getContributingTraitFromPlayerNpc(allTraits, playerNpc.revealedTraits, activityTags);
    if (discovery && discovery.isNew) {
      // Update revealed traits in database
      await npcRepository.appendRevealedTrait(client, playerNpc.id, discovery.trait as NPCTrait);
      updatedRevealedTraits = [...playerNpc.revealedTraits, discovery.trait as NPCTrait];
      discoveredTrait = {
        trait: discovery.trait as NPCTrait,
        traitName: getTraitDefinition(discovery.trait as NPCTrait).name,
        traitDescription: getTraitDefinition(discovery.trait as NPCTrait).description,
        isNew: discovery.isNew
      };
    }
  }

  // Apply emotion effects
  let updatedEmotionVector = playerNpc.emotionVector;
  let updatedEmotionInterpretation = playerNpc.emotionInterpretation;

  if (hasEmotionProfile(activity.emotionProfile)) {
    const emotionPulls = generateActivityEmotionPulls(activity.emotionProfile, outcomeTier as 'best' | 'okay' | 'mixed' | 'catastrophic');
    updatedEmotionVector = applyEmotionPulls(playerNpc.emotionVector, emotionPulls);

    // Update emotion vector in database
    await npcRepository.updateEmotionVector(client, playerNpc.id, updatedEmotionVector);
    updatedEmotionInterpretation = interpretEmotionVectorSlim(updatedEmotionVector);
  }

  // Validate axis values
  const trustValue = Number.isFinite(newAxes.trust) ? newAxes.trust : 0;
  const affectionValue = Number.isFinite(newAxes.affection) ? newAxes.affection : 0;
  const desireValue = Number.isFinite(newAxes.desire) ? newAxes.desire : 0;

  // Update player NPC with new axes and state
  await npcRepository.update(client, playerNpc.id, {
    trust: trustValue,
    affection: affectionValue,
    desire: desireValue,
    currentState: newState,
    lastInteraction: gameTimeMinutes
  });

  const updatedPlayerNpc: NpcView = {
    ...playerNpc,
    trust: trustValue,
    affection: affectionValue,
    desire: desireValue,
    currentState: newState,
    revealedTraits: updatedRevealedTraits,
    emotionVector: updatedEmotionVector,
    emotionInterpretation: updatedEmotionInterpretation
  };

  return {
    relationshipChanges,
    stateChanged,
    previousState,
    newState,
    discoveredTrait,
    updatedPlayerNpc,
    newAxes: { trust: trustValue, affection: affectionValue, desire: desireValue }
  };
}

// ===== Main Use Case =====

export async function executeActivity(
  ctx: ExecuteActivityContext,
  request: ExecuteActivityRequest
): Promise<ActivityResult> {
  const { pool } = ctx;
  const { userId, activityId, npcId } = request;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate activity exists
    const activity = getActivityById(activityId);
    validateActivity(activity);

    const isSocial = isSocialActivity(activity);
    validateSocialActivityHasNpc(isSocial, npcId);

    // Get player using repository (get or create pattern)
    let player = await playerRepository.getByUserId(client, userId);
    if (!player) {
      player = await playerRepository.create(client, userId);
    }

    // Fetch player NPC and template traits for social activities
    let playerNpc: NpcView | undefined;
    let allTraits: NPCTrait[] | undefined;

    if (isSocial && npcId) {
      // Get player NPC (which contains template data via JOIN)
      const playerNpcResult = await npcRepository.getById(client, npcId);
      if (!playerNpcResult) {
        throw new ActivityValidationError('NPC not found', 404);
      }
      playerNpc = playerNpcResult;

      // Get full traits from template for difficulty calculation
      const template = await npcTemplateRepository.getById(client, playerNpc.templateId);
      if (!template) {
        throw new ActivityValidationError('NPC template not found', 404);
      }
      allTraits = template.traits;
    }

    // Validate requirements
    validateStatRequirements(player, activity);
    validateAvailability(activity, player, playerNpc?.currentLocation);

    // Initialize result variables
    let outcome: ActivityResult['outcome'];
    let difficultyBreakdown: DifficultyBreakdown | undefined;
    let statChanges: StatChange[] = [];
    let statsTrainedThisActivity: StatName[] = [];
    let newStats = player.stats;
    let additionalEnergyCost = 0;
    let additionalMoneyCost = 0;
    let additionalTimeCost = 0;

    // Social activity specific
    let relationshipChanges: ActivityResult['relationshipChanges'];
    let stateChanged = false;
    let previousState: RelationshipState | undefined;
    let newState: RelationshipState | undefined;
    let discoveredTrait: ActivityResult['discoveredTrait'];
    let updatedPlayerNpc: NpcView | undefined = playerNpc;

    // Calculate new game time (needed for last_interaction update)
    const newGameTimeMinutes = addGameMinutes(player.gameTimeMinutes, activity.timeCost + additionalTimeCost);

    // Calculate outcome if activity has difficulty
    if (hasActivityDifficulty(activity) && activity.difficulty && activity.difficulty > 0) {
      const outcomeResult = calculateOutcome(activity, player, playerNpc, allTraits);

      outcome = outcomeResult.outcome;
      difficultyBreakdown = outcomeResult.difficultyBreakdown;
      statChanges = outcomeResult.statChanges;
      statsTrainedThisActivity = outcomeResult.statsTrainedThisActivity;
      newStats = outcomeResult.newStats;
      additionalEnergyCost = outcomeResult.additionalEnergyCost;
      additionalMoneyCost = outcomeResult.additionalMoneyCost;
      additionalTimeCost = outcomeResult.additionalTimeCost;

      // Process social effects
      if (isSocial && playerNpc && allTraits && outcome) {
        const socialResult = await processSocialEffects(
          client,
          activity as Activity & { relationshipEffects: { trust?: number; affection?: number; desire?: number }; emotionProfile?: EmotionProfile },
          playerNpc,
          allTraits,
          outcome.tier,
          player,
          newGameTimeMinutes
        );

        relationshipChanges = socialResult.relationshipChanges;
        stateChanged = socialResult.stateChanged;
        previousState = socialResult.previousState;
        newState = socialResult.newState;
        discoveredTrait = socialResult.discoveredTrait;
        updatedPlayerNpc = socialResult.updatedPlayerNpc;
      }
    }

    // Calculate new resource values
    const newEnergy = Math.max(0, Math.min(100, player.currentEnergy + activity.energyCost + additionalEnergyCost));
    const newMoney = player.money + activity.moneyCost + additionalMoneyCost;
    const finalGameTimeMinutes = addGameMinutes(player.gameTimeMinutes, activity.timeCost + additionalTimeCost);

    // Update tracking
    const minEnergy = Math.min(player.tracking.minEnergyToday, newEnergy);
    const workedToday = player.tracking.workedToday || activity.type === 'work';
    const hadCatastrophicFailure = player.tracking.hadCatastrophicFailureToday || (outcome?.tier === 'catastrophic');
    const allStatsTrainedToday = Array.from(new Set([
      ...player.tracking.statsTrainedToday,
      ...statsTrainedThisActivity
    ]));

    // Record activity history using repository
    await activityRepository.recordActivity(client, {
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

    // Update player using repository
    const updatedPlayer = await playerRepository.update(client, player.id, {
      currentEnergy: newEnergy,
      money: newMoney,
      gameTimeMinutes: finalGameTimeMinutes,
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

    // Log success
    const activityType = isSocial ? 'social' : 'solo';
    console.log(
      `✅ User ${userId} performed ${activityType} activity: ${activity.name}` +
      (outcome ? ` (${outcome.tier})` : '') +
      (isSocial && updatedPlayerNpc ? ` with ${updatedPlayerNpc.name}` : '') +
      (stateChanged ? ` [State: ${previousState} → ${newState}]` : '') +
      (discoveredTrait?.isNew ? ` [Discovered: ${discoveredTrait.trait}]` : '')
    );

    // Build result - convert PlayerNPCView back to NPC/Relationship for API compatibility
    // TODO: Update ActivityResult type to use PlayerNPCView directly
    const npcForResult = updatedPlayerNpc ? {
      id: updatedPlayerNpc.id,
      name: updatedPlayerNpc.name,
      gender: updatedPlayerNpc.gender,
      traits: updatedPlayerNpc.revealedTraits,  // Only show revealed traits
      revealedTraits: updatedPlayerNpc.revealedTraits,
      emotionVector: updatedPlayerNpc.emotionVector,
      emotionInterpretation: updatedPlayerNpc.emotionInterpretation,
      appearance: updatedPlayerNpc.appearance,
      loras: [],  // Not needed for result
      currentLocation: updatedPlayerNpc.currentLocation,
      createdAt: ''  // Not needed for result
    } : undefined;

    const relationshipForResult = updatedPlayerNpc ? {
      id: updatedPlayerNpc.id,
      playerId: userId,
      npcId: updatedPlayerNpc.templateId,
      trust: updatedPlayerNpc.trust,
      affection: updatedPlayerNpc.affection,
      desire: updatedPlayerNpc.desire,
      currentState: updatedPlayerNpc.currentState,
      unlockedStates: [updatedPlayerNpc.currentState],  // Simplified
      firstMet: '',  // Not needed for result
      lastInteraction: '',  // Not needed for result
      npc: npcForResult
    } : undefined;

    return {
      player: updatedPlayer,
      activityType,
      outcome,
      statChanges: statChanges.length > 0 ? statChanges : undefined,
      statsTrainedThisActivity: statsTrainedThisActivity.length > 0 ? statsTrainedThisActivity : undefined,
      actualEnergyCost: activity.energyCost + additionalEnergyCost,
      actualMoneyCost: activity.moneyCost + additionalMoneyCost,
      actualTimeCost: activity.timeCost + additionalTimeCost,
      difficultyBreakdown,

      // Social activity fields - use compatibility wrappers
      npc: npcForResult,
      relationship: relationshipForResult,
      relationshipChanges,
      stateChanged: isSocial ? stateChanged : undefined,
      previousState: isSocial ? previousState : undefined,
      newState: isSocial ? newState : undefined,
      emotionalState: updatedPlayerNpc?.emotionInterpretation?.emotion,
      discoveredTrait
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
