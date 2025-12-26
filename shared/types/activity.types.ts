/**
 * Activity Type Definitions
 *
 * Discriminated union types for the activity system.
 * Each activity type has exactly the fields it needs, enforced at compile time.
 */

import {
  LocationId,
  TimeSlot,
  StatName,
  RelationshipState,
  ActivityOutcomeProfile
} from '../types';

/**
 * Base properties shared by all activities
 */
interface BaseActivity {
  id: string;
  name: string;
  description: string;
  timeCost: number;           // Minutes consumed
  energyCost: number;         // Can be negative (cost) or positive (restore)
  moneyCost: number;          // Can be negative (cost) or positive (earn)
  location?: LocationId;      // Specific location required
  allowedTimeSlots?: TimeSlot[];  // If undefined, available anytime
  tags?: string[];            // Optional tags for filtering
}

/**
 * Work Activity
 * Solo activities where money is the primary reward
 */
export interface WorkActivity extends BaseActivity {
  type: 'work';
  difficulty: number;
  relevantStats: StatName[];
  outcomeProfile: ActivityOutcomeProfile;
  statRequirements?: Partial<Record<StatName, number>>;
}

/**
 * Social Activity
 * Requires NPC, relationship building is primary benefit
 */
export interface SocialActivity extends BaseActivity {
  type: 'social';
  relationshipEffects: {
    trust?: number;
    affection?: number;
    desire?: number;
  };
  difficulty: number;
  relevantStats: StatName[];
  outcomeProfile?: ActivityOutcomeProfile;
  minRelationship?: RelationshipState;
  statRequirements?: Partial<Record<StatName, number>>;
}

/**
 * Training Activity
 * Solo stat-building activities (self-improvement)
 */
export interface TrainingActivity extends BaseActivity {
  type: 'training';
  difficulty: number;
  relevantStats: StatName[];
  outcomeProfile: ActivityOutcomeProfile;
  statRequirements?: Partial<Record<StatName, number>>;
}

/**
 * Leisure Activity
 * Light relaxation activities, may be passive or have light outcomes
 */
export interface LeisureActivity extends BaseActivity {
  type: 'leisure';
  difficulty?: number;        // Optional - passive activities have none
  relevantStats?: StatName[];
  outcomeProfile?: ActivityOutcomeProfile;
}

/**
 * Recovery Activity
 * Self-care and rest activities
 */
export interface RecoveryActivity extends BaseActivity {
  type: 'recovery';
  // energyCost is typically positive (restores energy)
  // No difficulty, no stats
}

/**
 * Discovery Activity
 * Special activities for meeting new NPCs
 */
export interface DiscoveryActivity extends BaseActivity {
  type: 'discovery';
  difficulty: number;
  relevantStats: StatName[];
  outcomeProfile: ActivityOutcomeProfile;
}

/**
 * Union of all activity types
 */
export type Activity =
  | WorkActivity
  | SocialActivity
  | TrainingActivity
  | LeisureActivity
  | RecoveryActivity
  | DiscoveryActivity;

// ===== Type Guards =====

/**
 * Check if activity is a work activity
 */
export function isWorkActivity(activity: Activity): activity is WorkActivity {
  return activity.type === 'work';
}

/**
 * Check if activity is a social activity
 */
export function isSocialActivity(activity: Activity): activity is SocialActivity {
  return activity.type === 'social';
}

/**
 * Check if activity is a training activity
 */
export function isTrainingActivity(activity: Activity): activity is TrainingActivity {
  return activity.type === 'training';
}

/**
 * Check if activity is a leisure activity
 */
export function isLeisureActivity(activity: Activity): activity is LeisureActivity {
  return activity.type === 'leisure';
}

/**
 * Check if activity is a recovery activity
 */
export function isRecoveryActivity(activity: Activity): activity is RecoveryActivity {
  return activity.type === 'recovery';
}

/**
 * Check if activity is a discovery activity
 */
export function isDiscoveryActivity(activity: Activity): activity is DiscoveryActivity {
  return activity.type === 'discovery';
}

// ===== Helper Functions =====

/**
 * Check if activity requires an NPC
 */
export function requiresNPC(activity: Activity): boolean {
  return activity.type === 'social';
}

