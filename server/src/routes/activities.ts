/**
 * Activities Routes
 * API endpoints for activity management and execution
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { getActivityById, getAvailableActivities } from '../services/relationship';
import { getOrCreatePlayerCharacter, updatePlayerCharacter } from '../services/player';
import { canPerformActivity, addMinutes } from '../services/time';
import {
  ApiResponse,
  PerformActivityRequest,
  Activity,
  ActivityAvailability
} from '../../../shared/types';

const router = Router();

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
 */
router.post(
  '/perform',
  async (req: AuthRequest, res: Response<ApiResponse<{ player: any }>>) => {
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

      // Validate activity can be performed
      const availability = canPerformActivity(activity, player);
      if (!availability.available) {
        res.status(400).json({
          success: false,
          error: availability.reason || 'Activity cannot be performed'
        });
        return;
      }

      // Update player resources
      const newEnergy = Math.max(0, Math.min(100, player.currentEnergy + activity.energyCost));
      const newMoney = player.money + activity.moneyCost;
      const newTime = addMinutes(player.currentTime, activity.timeCost);

      const updatedPlayer = await updatePlayerCharacter(pool, player.id, {
        currentEnergy: newEnergy,
        money: newMoney,
        currentTime: newTime
      });

      console.log(`✅ User ${userId} performed activity: ${activity.name}`);

      res.json({
        success: true,
        data: {
          player: updatedPlayer
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
