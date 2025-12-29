/**
 * Location Routes
 * API endpoints for location data and travel
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { getAllLocations, getLocationsWithNPCCounts } from '../services/location';
import { travel, goHome, TravelValidationError } from '../services/location/use-cases';
import {
  ApiResponse,
  Location,
  LocationWithNPCCount,
  TravelRequest,
  TravelResult,
  LocationId,
  PlayerCharacter
} from '../../../shared/types';

const router = Router();

/**
 * GET /api/locations
 * Get all locations (optionally with NPC counts)
 */
router.get('/', async (req: AuthRequest, res: Response<ApiResponse<Location[] | LocationWithNPCCount[]>>) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
    return;
  }

  try {
    const includeNPCCounts = req.query.includeNPCCounts === 'true';

    let locations: Location[] | LocationWithNPCCount[];

    if (includeNPCCounts) {
      locations = await getLocationsWithNPCCounts(pool, req.user.userId);
    } else {
      locations = getAllLocations();
    }

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('❌ Error fetching locations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch locations';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * POST /api/locations/travel
 * Travel to a new location
 */
router.post(
  '/travel',
  async (req: AuthRequest, res: Response<ApiResponse<{ player: PlayerCharacter, travelResult: TravelResult }>>) => {
    const { destinationId }: TravelRequest = req.body;

    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const userId = req.user.userId;

    try {
      const result = await travel(
        { pool },
        { userId, destinationId: destinationId as LocationId }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof TravelValidationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
        return;
      }

      console.error(`❌ Error during travel for user ${userId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to travel';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
);

/**
 * POST /api/locations/go-home
 * Quick travel home
 */
router.post(
  '/go-home',
  async (req: AuthRequest, res: Response<ApiResponse<{ player: PlayerCharacter, travelResult: TravelResult }>>) => {
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const userId = req.user.userId;

    try {
      const result = await goHome({ pool }, { userId });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error(`❌ Error going home for user ${userId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to go home';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
);

export default router;
