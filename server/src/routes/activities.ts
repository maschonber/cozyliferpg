/**
 * Activities Routes
 * API endpoints for activity management and execution
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { getAvailableActivities } from '../services/relationship';
import { getOrCreatePlayerCharacter } from '../services/player';
import { canPerformActivity } from '../services/activity';
import {
  executeActivity,
  ActivityValidationError
} from '../services/activity/use-cases';
import {
  ApiResponse,
  PerformActivityRequest,
  Activity,
  ActivityAvailability,
  ActivityResult
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

    try {
      const result = await executeActivity(
        { pool },
        { userId, activityId, npcId }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof ActivityValidationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
        return;
      }

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
