/**
 * Travel Use Case
 *
 * Orchestrates player travel between locations.
 * Handles travel time calculation and player state updates.
 */

import { Pool } from 'pg';
import {
  PlayerCharacter,
  TravelResult,
  LocationId
} from '../../../../../shared/types';

// Domain services
import { getOrCreatePlayerCharacter, updatePlayerCharacter } from '../../player';
import { addGameMinutes, getTimeString } from '../../time';
import { calculateTravelTime } from '../../location';

// ===== Types =====

export interface TravelRequest {
  userId: string;
  destinationId: LocationId;
}

export interface TravelContext {
  pool: Pool;
}

export interface TravelResponse {
  player: PlayerCharacter;
  travelResult: TravelResult;
}

export class TravelValidationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'TravelValidationError';
  }
}

// ===== Main Use Case =====

export async function travel(
  ctx: TravelContext,
  request: TravelRequest
): Promise<TravelResponse> {
  const { pool } = ctx;
  const { userId, destinationId } = request;

  if (!destinationId) {
    throw new TravelValidationError('Destination ID is required');
  }

  // Get player
  const player = await getOrCreatePlayerCharacter(pool, userId);

  // Calculate travel time
  const travelTime = calculateTravelTime(player.currentLocation, destinationId);

  // If already at destination, no travel needed
  if (travelTime === 0) {
    return {
      player,
      travelResult: {
        newLocation: destinationId,
        travelTime: 0,
        arrivedAt: player.currentTime
      }
    };
  }

  // Calculate new time after travel (in minutes)
  const newGameTimeMinutes = addGameMinutes(player.gameTimeMinutes, travelTime);

  // Update player location and time
  const updatedPlayer = await updatePlayerCharacter(pool, player.id, {
    currentLocation: destinationId,
    gameTimeMinutes: newGameTimeMinutes
  });

  console.log(`✅ User ${userId} traveled from ${player.currentLocation} to ${destinationId} (${travelTime} min)`);

  return {
    player: updatedPlayer,
    travelResult: {
      newLocation: destinationId,
      travelTime,
      arrivedAt: getTimeString(newGameTimeMinutes)
    }
  };
}

/**
 * Quick travel home
 */
export async function goHome(
  ctx: TravelContext,
  request: { userId: string }
): Promise<TravelResponse> {
  const { pool } = ctx;
  const { userId } = request;

  // Get player
  const player = await getOrCreatePlayerCharacter(pool, userId);

  // If already home, no travel needed
  if (player.currentLocation === 'home') {
    return {
      player,
      travelResult: {
        newLocation: 'home',
        travelTime: 0,
        arrivedAt: player.currentTime
      }
    };
  }

  // Calculate travel time to home
  const travelTime = calculateTravelTime(player.currentLocation, 'home');

  // Calculate new time after travel (in minutes)
  const newGameTimeMinutes = addGameMinutes(player.gameTimeMinutes, travelTime);

  // Update player location and time
  const updatedPlayer = await updatePlayerCharacter(pool, player.id, {
    currentLocation: 'home',
    gameTimeMinutes: newGameTimeMinutes
  });

  console.log(`✅ User ${userId} went home from ${player.currentLocation} (${travelTime} min)`);

  return {
    player: updatedPlayer,
    travelResult: {
      newLocation: 'home',
      travelTime,
      arrivedAt: getTimeString(newGameTimeMinutes)
    }
  };
}
