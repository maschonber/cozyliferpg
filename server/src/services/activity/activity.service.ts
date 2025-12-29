/**
 * Activity Service
 * Manages player activity history, validation, and tracking.
 *
 * This service provides a high-level interface for activity operations,
 * delegating to the activity repository for data access.
 */

import { Pool } from 'pg';
import {
  PlayerActivity,
  StatName,
  OutcomeTier,
  Activity,
  PlayerCharacter,
  ActivityAvailability,
  requiresNPC,
} from '../../../../shared/types';
import { isLocationOpen, LOCATIONS } from '../location';
import { getTimeSlot, checkActivityEndTime } from '../time/game-time.service';
import { meetsStatRequirements } from '../outcome';
import { activityRepository } from '../../repositories';

/**
 * Data for recording a new activity
 */
export interface RecordActivityData {
  playerId: string;
  activityId: string;
  dayNumber: number;
  timeOfDay: string;
  outcomeTier?: OutcomeTier;
  roll?: number;
  adjustedRoll?: number;
  statBonus?: number;
  difficultyPenalty?: number;
  statEffects?: Partial<Record<StatName, number>>;
  relationshipEffects?: { trust?: number; affection?: number; desire?: number };
  energyDelta?: number;
  moneyDelta?: number;
  npcId?: string;
}

/**
 * Record a player activity
 */
export async function recordPlayerActivity(
  pool: Pool,
  data: RecordActivityData
): Promise<PlayerActivity> {
  return activityRepository.recordActivity(pool, data);
}

/**
 * Get activities for a specific day
 */
export async function getActivitiesForDay(
  pool: Pool,
  playerId: string,
  dayNumber: number
): Promise<PlayerActivity[]> {
  return activityRepository.getActivitiesForDay(pool, playerId, dayNumber);
}

/**
 * Get activities within a date range (for 7-day rolling window calculations)
 */
export async function getActivitiesInDateRange(
  pool: Pool,
  playerId: string,
  startDate: Date,
  endDate: Date
): Promise<PlayerActivity[]> {
  return activityRepository.getActivitiesInDateRange(pool, playerId, startDate, endDate);
}

/**
 * Get activities for last N days
 */
export async function getActivitiesForLastNDays(
  pool: Pool,
  playerId: string,
  days: number
): Promise<PlayerActivity[]> {
  return activityRepository.getActivitiesForLastNDays(pool, playerId, days);
}

/**
 * Delete all activities for a player (used during reset)
 */
export async function deletePlayerActivities(
  pool: Pool,
  playerId: string
): Promise<void> {
  return activityRepository.deleteAllForPlayer(pool, playerId);
}

// ===== Activity Validation =====

/**
 * Format opening time for display (e.g., "Opens at 8:00")
 */
function formatOpeningTime(openTime: { hours: number; minutes?: number }): string {
  const hours = openTime.hours;
  const minutes = openTime.minutes ?? 0;
  const timeStr = `${hours}:${String(minutes).padStart(2, '0')}`;
  return `Opens at ${timeStr}`;
}

/**
 * Check if an activity can be performed based on player state.
 * Uses minutes-based time internally.
 *
 * Priority order for unavailability reasons:
 * 1. Stat requirements (highest priority)
 * 2. Location/venue constraints
 * 3. Resource constraints (energy, money)
 * 4. Time constraints
 *
 * @param activity - The activity to check
 * @param player - Current player state
 * @param npcLocation - Optional NPC location (for social activities)
 * @returns Availability result with reason if not available
 */
export function canPerformActivity(
  activity: Activity,
  player: PlayerCharacter,
  npcLocation?: string
): ActivityAvailability {
  // Check stat requirements first (highest priority)
  if ('statRequirements' in activity && activity.statRequirements) {
    const reqCheck = meetsStatRequirements(player.stats, activity.statRequirements);
    if (!reqCheck.meets) {
      // Show the first unmet requirement
      const first = reqCheck.unmet[0];
      const statLabel = first.stat.charAt(0).toUpperCase() + first.stat.slice(1);
      return {
        activityId: activity.id,
        available: false,
        reason: `Requires ${first.required} ${statLabel}`,
      };
    }
  }

  // Check location requirement
  if (activity.location) {
    if (player.currentLocation !== activity.location) {
      return {
        activityId: activity.id,
        available: false,
        reason: `Must be at ${activity.location.replace('_', ' ')}`,
      };
    }
  }

  // Check if NPC is at same location (for social activities)
  if (requiresNPC(activity) && npcLocation) {
    if (player.currentLocation !== npcLocation) {
      return {
        activityId: activity.id,
        available: false,
        reason: 'Must be at same location as NPC',
      };
    }
  }

  // Special case: "Meet Someone New" blocked at home
  if (activity.id === 'meet_someone' && player.currentLocation === 'home') {
    return {
      activityId: activity.id,
      available: false,
      reason: 'Cannot meet new people at home',
    };
  }

  // Check venue opening hours (if activity has a location)
  if (activity.location) {
    const location = LOCATIONS[activity.location];

    if (location.openTime && location.closeTime) {
      const startTimeMinutes = player.gameTimeMinutes;
      const endTimeMinutes = startTimeMinutes + activity.timeCost;

      const openAtStart = isLocationOpen(activity.location, startTimeMinutes);
      const openAtEnd = isLocationOpen(activity.location, endTimeMinutes);

      if (!openAtStart) {
        return {
          activityId: activity.id,
          available: false,
          reason: formatOpeningTime(location.openTime),
        };
      }

      if (!openAtEnd) {
        return {
          activityId: activity.id,
          available: false,
          reason: `${location.name} would close before activity ends`,
        };
      }
    }
  }

  // Check energy
  if (player.currentEnergy + activity.energyCost < 0) {
    return {
      activityId: activity.id,
      available: false,
      reason: 'Not enough energy',
    };
  }

  // Check money
  if (player.money + activity.moneyCost < 0) {
    return {
      activityId: activity.id,
      available: false,
      reason: 'Not enough money',
    };
  }

  // Check time slot restriction
  if (activity.allowedTimeSlots) {
    const currentSlot = getTimeSlot(player.gameTimeMinutes);
    if (!activity.allowedTimeSlots.includes(currentSlot)) {
      return {
        activityId: activity.id,
        available: false,
        reason: 'Not available at this time',
      };
    }
  }

  // Check if activity would end after 4 AM (forbidden)
  const { after4am, afterMidnight } = checkActivityEndTime(
    player.gameTimeMinutes,
    activity.timeCost
  );

  if (after4am) {
    return {
      activityId: activity.id,
      available: false,
      reason: 'Would end too late (after 4 AM)',
    };
  }

  return {
    activityId: activity.id,
    available: true,
    endsAfterMidnight: afterMidnight,
  };
}
