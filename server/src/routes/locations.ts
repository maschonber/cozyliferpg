/**
 * Location Routes (Phase 3)
 * API endpoints for location data and travel
 */

import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../auth/auth.middleware';
import { getOrCreatePlayerCharacter, updatePlayerCharacter } from '../services/player';
import { addMinutes } from '../services/time';
import {
  getAllLocations,
  getLocationsWithNPCCounts,
  calculateTravelTime,
  isLocationOpen,
} from '../services/location';
import {
  ApiResponse,
  Location,
  LocationWithNPCCount,
  TravelRequest,
  TravelResult,
  LocationId,
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
      locations = await getLocationsWithNPCCounts(pool);
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
  async (req: AuthRequest, res: Response<ApiResponse<{ player: any, travelResult: TravelResult }>>) => {
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
      // Validate destination
      if (!destinationId) {
        res.status(400).json({
          success: false,
          error: 'Destination ID is required'
        });
        return;
      }

      // Get player
      const player = await getOrCreatePlayerCharacter(pool, userId);

      // Calculate travel time
      const travelTime = calculateTravelTime(player.currentLocation, destinationId as LocationId);

      // If already at destination, no travel needed
      if (travelTime === 0) {
        res.json({
          success: true,
          data: {
            player,
            travelResult: {
              newLocation: destinationId as LocationId,
              travelTime: 0,
              arrivedAt: player.currentTime
            }
          }
        });
        return;
      }

      // Calculate new time after travel
      const newTime = addMinutes(player.currentTime, travelTime);

      // Update player location and time
      const updatedPlayer = await updatePlayerCharacter(pool, player.id, {
        currentLocation: destinationId as LocationId,
        currentTime: newTime
      });

      console.log(`✅ User ${userId} traveled from ${player.currentLocation} to ${destinationId} (${travelTime} min)`);

      const travelResult: TravelResult = {
        newLocation: destinationId as LocationId,
        travelTime,
        arrivedAt: newTime
      };

      res.json({
        success: true,
        data: {
          player: updatedPlayer,
          travelResult
        }
      });
    } catch (error) {
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
  async (req: AuthRequest, res: Response<ApiResponse<{ player: any, travelResult: TravelResult }>>) => {
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const userId = req.user.userId;

    try {
      // Get player
      const player = await getOrCreatePlayerCharacter(pool, userId);

      // If already home, no travel needed
      if (player.currentLocation === 'home') {
        res.json({
          success: true,
          data: {
            player,
            travelResult: {
              newLocation: 'home',
              travelTime: 0,
              arrivedAt: player.currentTime
            }
          }
        });
        return;
      }

      // Calculate travel time to home
      const travelTime = calculateTravelTime(player.currentLocation, 'home');

      // Calculate new time after travel
      const newTime = addMinutes(player.currentTime, travelTime);

      // Update player location and time
      const updatedPlayer = await updatePlayerCharacter(pool, player.id, {
        currentLocation: 'home',
        currentTime: newTime
      });

      console.log(`✅ User ${userId} went home from ${player.currentLocation} (${travelTime} min)`);

      const travelResult: TravelResult = {
        newLocation: 'home',
        travelTime,
        arrivedAt: newTime
      };

      res.json({
        success: true,
        data: {
          player: updatedPlayer,
          travelResult
        }
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
