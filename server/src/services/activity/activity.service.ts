/**
 * Activity Service
 * Manages player activity history for tracking and defensive stat calculations.
 *
 * This service provides a high-level interface for activity operations,
 * delegating to the activity repository for data access.
 */

import { Pool } from 'pg';
import { PlayerActivity, StatName, OutcomeTier } from '../../../../shared/types';
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
