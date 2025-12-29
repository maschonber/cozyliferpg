/**
 * Location Service (Phase 3)
 * Manages location data, travel calculations, and location state
 */

import { Location, LocationId, District, LocationWithNPCCount } from '../../../../shared/types';
import { Pool } from 'pg';
import { toMinutesOfDay, getMinutesOfDay, isWithinOperatingHours } from '../time/game-time.service';

/**
 * All locations in the game
 * Organized into 3 districts with different travel times
 */
export const LOCATIONS: Record<LocationId, Location> = {
  // ===== DISTRICT 1: RESIDENTIAL QUARTER =====
  home: {
    id: 'home',
    name: 'Home',
    description: 'Your cozy personal apartment',
    district: 'residential',
    // Always open (24/7)
  },

  park: {
    id: 'park',
    name: 'Neighborhood Park',
    description: 'Green space with walking paths and a duck pond',
    district: 'residential',
    // Always open (24/7)
  },

  coffee_shop: {
    id: 'coffee_shop',
    name: 'Corner Coffee Shop',
    description: 'A cozy local cafe with warm atmosphere',
    district: 'residential',
    openTime: { hours: 6 },
    closeTime: { hours: 22 },
  },

  // ===== DISTRICT 2: TOWN CENTER (DOWNTOWN) =====
  library: {
    id: 'library',
    name: 'Public Library',
    description: 'Quiet study spaces with extensive book collections',
    district: 'downtown',
    openTime: { hours: 8 },
    closeTime: { hours: 20 },
  },

  shopping_district: {
    id: 'shopping_district',
    name: 'Shopping District',
    description: 'Main street with shops, boutiques, and services',
    district: 'downtown',
    openTime: { hours: 9 },
    closeTime: { hours: 21 },
  },

  gym: {
    id: 'gym',
    name: 'Fitness Center',
    description: 'Modern gym with equipment and fitness classes',
    district: 'downtown',
    openTime: { hours: 5 },
    closeTime: { hours: 23 },
  },

  movie_theater: {
    id: 'movie_theater',
    name: 'Movie Theater',
    description: 'Small cinema showing the latest films',
    district: 'downtown',
    openTime: { hours: 12 },
    closeTime: { hours: 23 },
  },

  // ===== DISTRICT 3: WATERFRONT (SEASIDE) =====
  beach: {
    id: 'beach',
    name: 'Beach',
    description: 'Sandy shoreline with beautiful ocean views',
    district: 'waterfront',
    // Always open (24/7)
  },

  boardwalk: {
    id: 'boardwalk',
    name: 'Boardwalk',
    description: 'Wooden pier with shops, arcade, and attractions',
    district: 'waterfront',
    openTime: { hours: 10 },
    closeTime: { hours: 23 },
  },

  bar: {
    id: 'bar',
    name: 'Seaside Bar & Grill',
    description: 'Casual restaurant and bar with ocean views',
    district: 'waterfront',
    openTime: { hours: 11 },
    closeTime: { hours: 2 }, // Closes at 2 AM (next day)
  },
};

/**
 * Get a location by ID
 */
export function getLocation(locationId: LocationId): Location {
  return LOCATIONS[locationId];
}

/**
 * Get all locations
 */
export function getAllLocations(): Location[] {
  return Object.values(LOCATIONS);
}

/**
 * Get locations by district
 */
export function getLocationsByDistrict(district: District): Location[] {
  return Object.values(LOCATIONS).filter(loc => loc.district === district);
}

/**
 * Calculate travel time between two locations (in minutes)
 * - Same location: 0 minutes
 * - Within same district: 5 minutes
 * - Between different districts: 15 minutes
 */
export function calculateTravelTime(
  from: LocationId,
  to: LocationId
): number {
  if (from === to) {
    return 0;
  }

  const fromLocation = LOCATIONS[from];
  const toLocation = LOCATIONS[to];

  if (fromLocation.district === toLocation.district) {
    return 5; // Within same district
  }

  return 15; // Between different districts
}

/**
 * Check if a location is open at a given time
 * @param locationId - The location to check
 * @param gameTimeMinutes - Current game time in total minutes
 * @returns true if location is open (or has no operating hours), false otherwise
 */
export function isLocationOpen(
  locationId: LocationId,
  gameTimeMinutes: number
): boolean {
  const location = LOCATIONS[locationId];

  // If no operating hours defined, location is always open
  if (!location.openTime || !location.closeTime) {
    return true;
  }

  const currentMinutesOfDay = getMinutesOfDay(gameTimeMinutes);
  const openMinutes = toMinutesOfDay(location.openTime);
  const closeMinutes = toMinutesOfDay(location.closeTime);

  return isWithinOperatingHours(currentMinutesOfDay, openMinutes, closeMinutes);
}

/**
 * Get all locations with NPC counts
 * @param pool - Database pool
 * @returns Array of locations with NPC count for each
 */
export async function getLocationsWithNPCCounts(
  pool: Pool,
  playerId: string
): Promise<LocationWithNPCCount[]> {
  const client = await pool.connect();

  try {
    // Count player NPCs at each location for this player
    const result = await client.query(`
      SELECT current_location, COUNT(*) as count
      FROM player_npcs
      WHERE player_id = $1
      GROUP BY current_location
    `, [playerId]);

    // Create a map of location -> NPC count
    const npcCountMap: Record<string, number> = {};
    for (const row of result.rows) {
      npcCountMap[row.current_location] = parseInt(row.count);
    }

    // Build array of locations with counts
    const locationsWithCounts: LocationWithNPCCount[] = getAllLocations().map(location => ({
      ...location,
      npcCount: npcCountMap[location.id] || 0,
    }));

    return locationsWithCounts;
  } finally {
    client.release();
  }
}

/**
 * Get player NPC IDs at a specific location for a player
 * @param pool - Database pool
 * @param playerId - Player to get NPCs for
 * @param locationId - Location to get NPCs for
 * @returns Array of player NPC IDs at that location
 */
export async function getPlayerNPCsAtLocation(
  pool: Pool,
  playerId: string,
  locationId: LocationId
): Promise<string[]> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT id FROM player_npcs WHERE player_id = $1 AND current_location = $2',
      [playerId, locationId]
    );

    return result.rows.map(row => row.id);
  } finally {
    client.release();
  }
}
