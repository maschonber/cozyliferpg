/**
 * Activity System Index
 * Central export point for all game activities
 */

import { Activity } from '../../../shared/types/activity.types';
import { WORK_ACTIVITIES } from './work.activities';
import { SOCIAL_ACTIVITIES } from './social.activities';
import { TRAINING_ACTIVITIES } from './training.activities';
import { LEISURE_ACTIVITIES } from './leisure.activities';
import { RECOVERY_ACTIVITIES } from './recovery.activities';
import { DISCOVERY_ACTIVITIES } from './discovery.activities';

// Re-export type guards and helpers
export * from '../../../shared/types/activity.types';

/**
 * All activities available in the game
 * Organized by category for easier navigation
 */
export const ACTIVITIES: Activity[] = [
  ...WORK_ACTIVITIES,
  ...SOCIAL_ACTIVITIES,
  ...TRAINING_ACTIVITIES,
  ...LEISURE_ACTIVITIES,
  ...RECOVERY_ACTIVITIES,
  ...DISCOVERY_ACTIVITIES,
];

/**
 * Get all available activities
 */
export function getAvailableActivities(): Activity[] {
  return ACTIVITIES;
}

/**
 * Get activity by ID
 *
 * @param activityId - The activity ID to find
 * @param type - Optional: narrow the return type to a specific activity type
 * @returns The activity if found (and matches type if specified), undefined otherwise
 *
 * @example
 * // Returns Activity | undefined
 * const activity = getActivityById('work_part_time');
 *
 * @example
 * // Returns WorkActivity | undefined (type-safe access to outcomeProfile)
 * const workActivity = getActivityById('work_part_time', 'work');
 */
export function getActivityById(activityId: string): Activity | undefined;
export function getActivityById<T extends Activity['type']>(
  activityId: string,
  type: T
): Extract<Activity, { type: T }> | undefined;
export function getActivityById(
  activityId: string,
  type?: Activity['type']
): Activity | undefined {
  const activity = ACTIVITIES.find(a => a.id === activityId);
  if (!activity) return undefined;
  if (type !== undefined && activity.type !== type) return undefined;
  return activity;
}
