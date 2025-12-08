/**
 * Location Service (Phase 3)
 * Manages location data, travel calculations, and location state
 */

import { Location, LocationId, District, LocationWithNPCCount } from '../../../../shared/types';
import { Pool } from 'pg';

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
    openTime: '06:00',
    closeTime: '22:00',
  },

  // ===== DISTRICT 2: TOWN CENTER (DOWNTOWN) =====
  library: {
    id: 'library',
    name: 'Public Library',
    description: 'Quiet study spaces with extensive book collections',
    district: 'downtown',
    openTime: '08:00',
    closeTime: '20:00',
  },

  shopping_district: {
    id: 'shopping_district',
    name: 'Shopping District',
    description: 'Main street with shops, boutiques, and services',
    district: 'downtown',
    openTime: '09:00',
    closeTime: '21:00',
  },

  gym: {
    id: 'gym',
    name: 'Fitness Center',
    description: 'Modern gym with equipment and fitness classes',
    district: 'downtown',
    openTime: '05:00',
    closeTime: '23:00',
  },

  movie_theater: {
    id: 'movie_theater',
    name: 'Movie Theater',
    description: 'Small cinema showing the latest films',
    district: 'downtown',
    openTime: '12:00',
    closeTime: '23:00',
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
    openTime: '10:00',
    closeTime: '23:00',
  },

  bar: {
    id: 'bar',
    name: 'Seaside Bar & Grill',
    description: 'Casual restaurant and bar with ocean views',
    district: 'waterfront',
    openTime: '11:00',
    closeTime: '02:00', // Closes at 2 AM (next day)
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
 * @param time - Current time in "HH:MM" format
 * @returns true if location is open (or has no operating hours), false otherwise
 */
export function isLocationOpen(
  locationId: LocationId,
  time: string
): boolean {
  const location = LOCATIONS[locationId];

  // If no operating hours defined, location is always open
  if (!location.openTime || !location.closeTime) {
    return true;
  }

  const currentMinutes = timeToMinutes(time);
  const openMinutes = timeToMinutes(location.openTime);
  const closeMinutes = timeToMinutes(location.closeTime);

  // Handle locations that close after midnight (e.g., bar closes at 02:00)
  if (closeMinutes < openMinutes) {
    // Location is open from openTime until midnight, then from midnight until closeTime
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  // Normal operating hours
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get all locations with NPC counts
 * @param pool - Database pool
 * @returns Array of locations with NPC count for each
 */
export async function getLocationsWithNPCCounts(
  pool: Pool
): Promise<LocationWithNPCCount[]> {
  const client = await pool.connect();

  try {
    // Count NPCs at each location
    const result = await client.query(`
      SELECT current_location, COUNT(*) as count
      FROM npcs
      GROUP BY current_location
    `);

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
 * Get NPC IDs at a specific location
 * @param pool - Database pool
 * @param locationId - Location to get NPCs for
 * @returns Array of NPC IDs at that location
 */
export async function getNPCsAtLocation(
  pool: Pool,
  locationId: LocationId
): Promise<string[]> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT id FROM npcs WHERE current_location = $1',
      [locationId]
    );

    return result.rows.map(row => row.id);
  } finally {
    client.release();
  }
}
