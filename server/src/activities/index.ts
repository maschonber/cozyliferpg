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
 */
export function getActivityById(activityId: string): Activity | undefined {
  return ACTIVITIES.find(activity => activity.id === activityId);
}
