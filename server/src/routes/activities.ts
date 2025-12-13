/**
 * Activities Routes (Phase 2 + Phase 2.5)
 * API endpoints for activity management and execution
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { getActivityById, getAvailableActivities } from '../services/relationship';
import { getOrCreatePlayerCharacter, updatePlayerCharacter } from '../services/player';
import { canPerformActivity, addMinutes } from '../services/time';
import { rollOutcome, scaleEffectByTier, meetsStatRequirements } from '../services/outcome';
import { applyStatEffects, getBaseStat, getCurrentStat } from '../services/stat';
import { recordPlayerActivity } from '../services/activity-history';
import { generateOutcome, generateOutcomeDescription } from '../services/outcome-generator';
import {
  ApiResponse,
  PerformActivityRequest,
  Activity,
  ActivityAvailability,
  ActivityOutcome,
  OutcomeTier,
  StatName,
  StatChange,
  PlayerStats
} from '../../../shared/types';

const router = Router();

/**
 * Result of performing an activity (Phase 2.5)
 */
interface ActivityResult {
  player: any;
  outcome?: {
    tier: OutcomeTier;
    roll: number;
    adjustedRoll: number;
    statBonus: number;
    difficultyPenalty: number;
  };
  statChanges?: StatChange[];
  statsTrainedThisActivity?: StatName[];
  // Actual resource costs paid (including outcome effects)
  actualEnergyCost?: number;
  actualMoneyCost?: number;
  actualTimeCost?: number;
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

    // Get player character to check availability
    const player = await getOrCreatePlayerCharacter(pool, userId);

    // Check availability for each activity
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
 * Perform a solo activity (no NPC required)
 * Phase 2.5: Includes stat roll system and stat effects
 */
router.post(
  '/perform',
  async (req: AuthRequest, res: Response<ApiResponse<ActivityResult>>) => {
    const { activityId }: PerformActivityRequest = req.body;

    // Get user ID from JWT
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const userId = req.user.userId;

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

      // Verify activity doesn't require NPC
      if (activity.requiresNPC) {
        res.status(400).json({
          success: false,
          error: 'This activity requires a neighbor. Use the relationship interaction endpoint instead.'
        });
        return;
      }

      // Get player character
      const player = await getOrCreatePlayerCharacter(pool, userId);

      // Phase 2.5: Check stat requirements (uses BASE stat)
      if (activity.statRequirements) {
        const reqCheck = meetsStatRequirements(player.stats, activity.statRequirements);
        if (!reqCheck.meets) {
          const unmetList = reqCheck.unmet.map(u => `${u.stat}: ${u.actual}/${u.required}`).join(', ');
          res.status(400).json({
            success: false,
            error: `Stat requirements not met: ${unmetList}`
          });
          return;
        }
      }

      // Validate activity can be performed (energy, money, time, location)
      const availability = canPerformActivity(activity, player);
      if (!availability.available) {
        res.status(400).json({
          success: false,
          error: availability.reason || 'Activity cannot be performed'
        });
        return;
      }

      // Phase 2.5 & 2.5.3: Roll for outcome if activity has difficulty
      let outcome: ActivityResult['outcome'];
      let statChanges: StatChange[] = [];
      let statsTrainedThisActivity: StatName[] = [];
      let newStats = player.stats;
      let additionalEnergyCost = 0;
      let additionalMoneyCost = 0;
      let additionalTimeCost = 0;

      if (activity.difficulty !== undefined && activity.difficulty > 0) {
        // Roll using relevant stats
        const rollResult = rollOutcome(
          player.stats,
          activity.relevantStats || [],
          activity.difficulty
        );

        outcome = {
          tier: rollResult.tier,
          roll: rollResult.roll,
          adjustedRoll: rollResult.adjustedRoll,
          statBonus: rollResult.statBonus,
          difficultyPenalty: rollResult.difficultyPenalty
        };

        // Phase 2.5.3: Use outcome profile if available, otherwise fallback to old system
        const activityWithProfile = activity as typeof activity & { outcomeProfile?: typeof activity.outcomeProfile; statEffects?: typeof activity.statEffects };

        if (activityWithProfile.outcomeProfile) {
          // NEW: Generate outcome from profile
          const generatedOutcome = generateOutcome(rollResult.tier, activityWithProfile.outcomeProfile);

          // Apply stat effects from generated outcome
          if (Object.keys(generatedOutcome.statEffects).length > 0) {
            const statResult = applyStatEffects(player.stats, generatedOutcome.statEffects);
            newStats = statResult.newStats;

            // Convert actualChanges to StatChange format
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

            // Track which stats were trained (positive gains)
            statsTrainedThisActivity = Object.entries(generatedOutcome.statEffects)
              .filter(([_, value]) => value > 0)
              .map(([stat, _]) => stat as StatName);
          }

          // Apply additional resource costs from outcome
          additionalEnergyCost = generatedOutcome.additionalEnergyCost;
          additionalMoneyCost = generatedOutcome.additionalMoneyCost;
          additionalTimeCost = generatedOutcome.additionalTimeCost;

        } else if (activityWithProfile.statEffects) {
          // OLD: Use legacy scaling system (deprecated)
          const scaledEffects: Partial<Record<StatName, number>> = {};
          const legacyStatEffects: Partial<Record<StatName, number>> = activityWithProfile.statEffects;

          for (const [stat, baseValue] of Object.entries(legacyStatEffects)) {
            const scaledValue = scaleEffectByTier(baseValue as number, rollResult.tier, (baseValue as number) > 0);
            if (scaledValue !== 0) {
              scaledEffects[stat as StatName] = scaledValue;
              if (scaledValue > 0) {
                statsTrainedThisActivity.push(stat as StatName);
              }
            }
          }

          const statResult = applyStatEffects(player.stats, scaledEffects);
          newStats = statResult.newStats;

          // Convert actualChanges to StatChange format
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
        }
      } else {
        // No roll required - apply stat effects directly (for passive/leisure activities)
        if (activity.statEffects) {
          const legacyStatEffects = activity.statEffects;
          const statResult = applyStatEffects(player.stats, legacyStatEffects);
          newStats = statResult.newStats;

          // Convert actualChanges to StatChange format
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

          statsTrainedThisActivity = (Object.entries(legacyStatEffects)
            .filter(([_, value]) => value !== undefined && value > 0)
            .map(([stat, _]) => stat) as StatName[]);
        }
      }

      // Calculate new resource values (including outcome-based additional costs)
      const newEnergy = Math.max(0, Math.min(100, player.currentEnergy + activity.energyCost + additionalEnergyCost));
      const newMoney = player.money + activity.moneyCost + additionalMoneyCost;
      const newTime = addMinutes(player.currentTime, activity.timeCost + additionalTimeCost);

      // Track minimum energy (for defensive stats)
      const minEnergy = Math.min(player.tracking.minEnergyToday, newEnergy);

      // Track if this was a work activity
      const workedToday = player.tracking.workedToday || activity.category === 'work';

      // Track if this was a catastrophic failure (for defensive stats)
      const hadCatastrophicFailure = player.tracking.hadCatastrophicFailureToday ||
        (outcome?.tier === 'catastrophic');

      // Track stats trained today (merge with existing)
      const allStatsTrainedToday = Array.from(new Set([
        ...player.tracking.statsTrainedToday,
        ...statsTrainedThisActivity
      ]));

      // Record activity in history (Phase 2.5.1)
      await recordPlayerActivity(pool, {
        playerId: player.id,
        activityId: activity.id,
        dayNumber: player.currentDay,
        timeOfDay: player.currentTime,
        activityName: activity.name,
        category: activity.category,
        difficulty: activity.difficulty,
        relevantStats: activity.relevantStats || [],
        tags: activity.tags,
        timeCost: activity.timeCost,
        energyCost: activity.energyCost,
        moneyCost: activity.moneyCost,
        outcomeTier: outcome?.tier,
        roll: outcome?.roll,
        adjustedRoll: outcome?.adjustedRoll,
        statBonus: outcome?.statBonus,
        difficultyPenalty: outcome?.difficultyPenalty,
        statEffects: statChanges.length > 0 ? Object.fromEntries(
          statChanges.map(c => [c.stat, c.currentDelta])
        ) : undefined,
        energyDelta: newEnergy - player.currentEnergy,
        moneyDelta: newMoney - player.money
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
          endingEnergyToday: newEnergy,  // Track ending energy after this activity
          workedToday,
          hadCatastrophicFailureToday: hadCatastrophicFailure,
          statsTrainedToday: allStatsTrainedToday as StatName[]
        }
      });

      console.log(`✅ User ${userId} performed activity: ${activity.name}${outcome ? ` (${outcome.tier})` : ''}`);

      res.json({
        success: true,
        data: {
          player: updatedPlayer,
          outcome,
          statChanges: statChanges.length > 0 ? statChanges : undefined,
          statsTrainedThisActivity: statsTrainedThisActivity.length > 0 ? statsTrainedThisActivity : undefined,
          // Include actual resource costs (base + additional from outcome)
          actualEnergyCost: activity.energyCost + additionalEnergyCost,
          actualMoneyCost: activity.moneyCost + additionalMoneyCost,
          actualTimeCost: activity.timeCost + additionalTimeCost
        }
      });
    } catch (error) {
      console.error(`❌ Error performing activity for user ${userId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform activity';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
);

export default router;
