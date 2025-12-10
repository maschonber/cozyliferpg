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
import { applyStatEffects } from '../services/stat';
import {
  ApiResponse,
  PerformActivityRequest,
  Activity,
  ActivityAvailability,
  ActivityOutcome,
  StatName,
  StatChange
} from '../../../shared/types';

const router = Router();

/**
 * Result of performing an activity (Phase 2.5)
 */
interface ActivityResult {
  player: any;
  outcome?: {
    tier: string;
    roll: number;
    adjustedRoll: number;
    statBonus: number;
    difficultyPenalty: number;
  };
  statChanges?: StatChange[];
  statsTrainedThisActivity?: StatName[];
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

      // Phase 2.5: Roll for outcome if activity has difficulty
      let outcome: ActivityResult['outcome'];
      let statChanges: StatChange[] = [];
      let statsTrainedThisActivity: StatName[] = [];
      let newStats = player.stats;

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

        // Apply stat effects scaled by outcome tier
        if (activity.statEffects) {
          const scaledEffects: Partial<Record<StatName, number>> = {};

          for (const [stat, baseValue] of Object.entries(activity.statEffects)) {
            const scaledValue = scaleEffectByTier(baseValue, rollResult.tier, baseValue > 0);
            if (scaledValue !== 0) {
              scaledEffects[stat as StatName] = scaledValue;
              if (scaledValue > 0) {
                statsTrainedThisActivity.push(stat as StatName);
              }
            }
          }

          const statResult = applyStatEffects(player.stats, scaledEffects);
          newStats = statResult.newStats;
          statChanges = statResult.changes;
        }
      } else {
        // No roll required - apply stat effects directly (for passive/leisure activities)
        if (activity.statEffects) {
          const statResult = applyStatEffects(player.stats, activity.statEffects);
          newStats = statResult.newStats;
          statChanges = statResult.changes;
          statsTrainedThisActivity = Object.keys(activity.statEffects).filter(
            stat => (activity.statEffects as any)[stat] > 0
          ) as StatName[];
        }
      }

      // Calculate new resource values
      const newEnergy = Math.max(0, Math.min(100, player.currentEnergy + activity.energyCost));
      const newMoney = player.money + activity.moneyCost;
      const newTime = addMinutes(player.currentTime, activity.timeCost);

      // Track minimum energy (for defensive stats)
      const minEnergy = Math.min(player.tracking.minEnergyToday, newEnergy);

      // Track if this was a work activity
      const workedToday = player.tracking.workedToday || activity.category === 'work';

      // Track stats trained today (merge with existing)
      const allStatsTrainedToday = Array.from(new Set([
        ...player.tracking.statsTrainedToday,
        ...statsTrainedThisActivity
      ]));

      // Update player with new stats and tracking
      const updatedPlayer = await updatePlayerCharacter(pool, player.id, {
        currentEnergy: newEnergy,
        money: newMoney,
        currentTime: newTime,
        stats: newStats,
        tracking: {
          ...player.tracking,
          minEnergyToday: minEnergy,
          workedToday,
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
          statsTrainedThisActivity: statsTrainedThisActivity.length > 0 ? statsTrainedThisActivity : undefined
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
