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
  NPC,
  Relationship,
  StatName,
  StatChange,
  DifficultyBreakdown,
  RelationshipState,
  SexualPreference,
  isSocialActivity,
  NPCTrait
} from '../../../../../shared/types';
import { ActivityTag, ActivityWithDifficulty, hasActivityDifficulty } from '../../../../../shared/types/activity.types';

// Repositories
import {
  npcRepository,
  relationshipRepository,
  playerRepository,
  activityRepository
} from '../../../repositories';

// Domain services
import {
  getActivityById,
  calculateRelationshipState,
  applyRelationshipDelta,
  getRelationshipDifficultyModifier,
  updateUnlockedStates,
  calculateDesireCap
} from '../../relationship';
import { canPerformActivity, addMinutes } from '../../time';
import { rollOutcome, meetsStatRequirements, BASE_DC } from '../../outcome';
import { applyStatEffects, getBaseStat, getCurrentStat } from '../../stat';
import { generateOutcome } from '../../outcome-generator';
import { calculateDynamicDifficulty, getActivityEffects } from '../../social-activity';
import {
  getTraitActivityBonus,
  getTraitActivityBreakdown,
  getContributingTrait,
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
  npcId?: string;
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

// ===== Helper Functions =====

/**
 * Get or create a relationship between player and NPC
 * Uses repositories for all data access
 */
async function getOrCreateRelationship(
  client: PoolClient,
  playerId: string,
  npcId: string,
  playerPreference: SexualPreference
): Promise<{ relationship: Relationship; isNew: boolean }> {
  if (!playerId || !npcId) {
    throw new ActivityValidationError('Invalid player ID or NPC ID');
  }

  // Check for existing relationship
  const existing = await relationshipRepository.getByPlayerAndNpc(client, playerId, npcId);
  if (existing) {
    return { relationship: existing, isNew: false };
  }

  // Get NPC gender for desire cap calculation
  const npcGender = await npcRepository.getGender(client, npcId);
  if (!npcGender) {
    throw new ActivityValidationError(`NPC with ID ${npcId} does not exist`, 404);
  }

  const desireCap = calculateDesireCap(playerPreference, npcGender);

  // Create new relationship
  const relationship = await relationshipRepository.create(client, {
    playerId,
    npcId,
    desireCap
  });

  return { relationship, isNew: true };
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

function calculateOutcome(
  activity: ActivityWithDifficulty,
  player: PlayerCharacter,
  relationship?: Relationship,
  npc?: NPC
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

  if (isSocial && npc && relationship) {
    const activityTags = (activity.tags || []) as ActivityTag[];
    const traitBonus = getTraitActivityBonus(npc.traits, activityTags);
    const individualTraits = getTraitActivityBreakdown(npc.traits, activityTags);

    const relationshipModifier = getRelationshipDifficultyModifier(
      { trust: relationship.trust, affection: relationship.affection, desire: relationship.desire },
      relationship.currentState
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
  previousState: ActivityResult['previousState'];
  newState: ActivityResult['newState'];
  discoveredTrait: ActivityResult['discoveredTrait'];
  updatedRelationship: Relationship;
  updatedNpc: NPC;
  newAxes: { trust: number; affection: number; desire: number };
  unlockedStates: RelationshipState[];
}

async function processSocialEffects(
  client: PoolClient,
  activity: Activity & { relationshipEffects: { trust?: number; affection?: number; desire?: number }; emotionProfile?: any },
  npc: NPC,
  relationship: Relationship,
  outcomeTier: string
): Promise<SocialEffectsResult> {
  const effects = getActivityEffects(
    {
      trust: activity.relationshipEffects.trust || 0,
      affection: activity.relationshipEffects.affection || 0,
      desire: activity.relationshipEffects.desire || 0
    },
    outcomeTier as any
  );

  const newAxes = applyRelationshipDelta(
    { trust: relationship.trust, affection: relationship.affection, desire: relationship.desire },
    effects.relationshipEffects,
    relationship.desireCap
  );

  const previousState = relationship.currentState;
  const newState = calculateRelationshipState(newAxes.trust, newAxes.affection, newAxes.desire);
  const stateChanged = previousState !== newState;
  const unlockedStates = updateUnlockedStates(relationship.unlockedStates, newState);

  const relationshipChanges: ActivityResult['relationshipChanges'] = {
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
  let discoveredTrait: ActivityResult['discoveredTrait'];
  const activityTags = (activity.tags || []) as ActivityTag[];
  if (activityTags.length > 0) {
    const discovery = getContributingTrait(npc, activityTags);
    if (discovery && discovery.isNew) {
      // Use repository to update revealed traits
      await npcRepository.appendRevealedTrait(client, npc.id, discovery.trait as NPCTrait);
      discoveredTrait = {
        trait: discovery.trait as any,
        traitName: getTraitDefinition(discovery.trait as any).name,
        traitDescription: getTraitDefinition(discovery.trait as any).description,
        isNew: discovery.isNew
      };
    }
  }

  // Apply emotion effects
  let updatedNpc = npc;
  if (hasEmotionProfile(activity.emotionProfile)) {
    const emotionPulls = generateActivityEmotionPulls(activity.emotionProfile, outcomeTier as any);
    const updatedEmotionVector = applyEmotionPulls(npc.emotionVector, emotionPulls);

    // Use repository to update emotion vector
    await npcRepository.updateEmotionVector(client, npc.id, updatedEmotionVector);

    updatedNpc = {
      ...npc,
      emotionVector: updatedEmotionVector,
      emotionInterpretation: interpretEmotionVectorSlim(updatedEmotionVector)
    };
  }

  // Validate axis values
  const trustValue = Number.isFinite(newAxes.trust) ? newAxes.trust : 0;
  const affectionValue = Number.isFinite(newAxes.affection) ? newAxes.affection : 0;
  const desireValue = Number.isFinite(newAxes.desire) ? newAxes.desire : 0;

  // Use repository to update relationship
  await relationshipRepository.update(client, relationship.id, {
    trust: trustValue,
    affection: affectionValue,
    desire: desireValue,
    currentState: newState,
    unlockedStates: unlockedStates as RelationshipState[]
  });

  const updatedRelationship: Relationship = {
    ...relationship,
    trust: trustValue,
    affection: affectionValue,
    desire: desireValue,
    currentState: newState,
    unlockedStates: unlockedStates as RelationshipState[],
    lastInteraction: new Date().toISOString(),
    npc: {
      ...updatedNpc,
      revealedTraits: discoveredTrait?.isNew
        ? [...updatedNpc.revealedTraits, discoveredTrait.trait as any]
        : updatedNpc.revealedTraits
    }
  };

  return {
    relationshipChanges,
    stateChanged,
    previousState,
    newState,
    discoveredTrait,
    updatedRelationship,
    updatedNpc,
    newAxes: { trust: trustValue, affection: affectionValue, desire: desireValue },
    unlockedStates: unlockedStates as RelationshipState[]
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

    // Fetch NPC and relationship for social activities
    let npc: NPC | undefined;
    let relationship: Relationship | undefined;

    if (isSocial && npcId) {
      // Use repository to get NPC with all traits (showAllTraits for internal use)
      const npcResult = await npcRepository.getById(client, npcId, { showAllTraits: true });
      if (!npcResult) {
        throw new ActivityValidationError('NPC not found', 404);
      }
      npc = npcResult;

      const relResult = await getOrCreateRelationship(
        client,
        userId,
        npcId,
        player.sexualPreference
      );
      relationship = relResult.relationship;
    }

    // Validate requirements
    validateStatRequirements(player, activity);
    validateAvailability(activity, player, npc?.currentLocation);

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
    let previousState: ActivityResult['previousState'];
    let newState: ActivityResult['newState'];
    let discoveredTrait: ActivityResult['discoveredTrait'];
    let updatedRelationship: Relationship | undefined;
    let updatedNpc: NPC | undefined = npc;

    // Calculate outcome if activity has difficulty
    if (hasActivityDifficulty(activity) && activity.difficulty && activity.difficulty > 0) {
      const outcomeResult = calculateOutcome(activity, player, relationship, npc);

      outcome = outcomeResult.outcome;
      difficultyBreakdown = outcomeResult.difficultyBreakdown;
      statChanges = outcomeResult.statChanges;
      statsTrainedThisActivity = outcomeResult.statsTrainedThisActivity;
      newStats = outcomeResult.newStats;
      additionalEnergyCost = outcomeResult.additionalEnergyCost;
      additionalMoneyCost = outcomeResult.additionalMoneyCost;
      additionalTimeCost = outcomeResult.additionalTimeCost;

      // Process social effects
      if (isSocial && npc && relationship && outcome) {
        const socialResult = await processSocialEffects(
          client,
          activity as any,
          npc,
          relationship,
          outcome.tier
        );

        relationshipChanges = socialResult.relationshipChanges;
        stateChanged = socialResult.stateChanged;
        previousState = socialResult.previousState;
        newState = socialResult.newState;
        discoveredTrait = socialResult.discoveredTrait;
        updatedRelationship = socialResult.updatedRelationship;
        updatedNpc = socialResult.updatedNpc;
      }
    }

    // Calculate new resource values
    const newEnergy = Math.max(0, Math.min(100, player.currentEnergy + activity.energyCost + additionalEnergyCost));
    const newMoney = player.money + activity.moneyCost + additionalMoneyCost;
    const newTime = addMinutes(player.currentTime, activity.timeCost + additionalTimeCost);

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

    // Log success
    const activityType = isSocial ? 'social' : 'solo';
    console.log(
      `✅ User ${userId} performed ${activityType} activity: ${activity.name}` +
      (outcome ? ` (${outcome.tier})` : '') +
      (isSocial && updatedNpc ? ` with ${updatedNpc.name}` : '') +
      (stateChanged ? ` [State: ${previousState} → ${newState}]` : '') +
      (discoveredTrait?.isNew ? ` [Discovered: ${discoveredTrait.trait}]` : '')
    );

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

      // Social activity fields
      npc: updatedNpc,
      relationship: updatedRelationship,
      relationshipChanges,
      stateChanged: isSocial ? stateChanged : undefined,
      previousState: isSocial ? previousState : undefined,
      newState: isSocial ? newState : undefined,
      emotionalState: updatedNpc?.emotionInterpretation?.emotion as any,
      discoveredTrait
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
