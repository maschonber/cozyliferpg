/**
 * Factory functions for creating activities with less boilerplate
 * Phase 8: Activity System Refactoring
 */

import {
  WorkActivity,
  SocialActivity,
  TrainingActivity,
  LeisureActivity,
  RecoveryActivity,
  DiscoveryActivity,
  ActivityTag
} from '../../../shared/types/activity.types';

import {
  ActivityOutcomeProfile,
  StatName,
  TimeSlot,
  LocationId,
  RelationshipState
} from '../../../shared/types';

/**
 * Common fields shared across all activities
 */
interface BaseActivityParams {
  id: string;
  name: string;
  description: string;
  location?: LocationId;
  timeCost: number;
  energyCost: number;
  moneyCost: number;
  allowedTimeSlots?: TimeSlot[];
  tags?: ActivityTag[];
}

/**
 * Create a work activity with sensible defaults
 */
export function createWorkActivity(
  params: BaseActivityParams & {
    difficulty: number;
    relevantStats: StatName[];
    outcomeProfile: ActivityOutcomeProfile;
    statRequirements?: Partial<Record<StatName, number>>;
  }
): WorkActivity {
  return {
    type: 'work',
    ...params,
    tags: params.tags || []
  };
}

/**
 * Create a social activity with sensible defaults
 */
export function createSocialActivity(
  params: BaseActivityParams & {
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
): SocialActivity {
  return {
    type: 'social',
    ...params,
    tags: params.tags || []
  };
}

/**
 * Create a training activity with sensible defaults
 */
export function createTrainingActivity(
  params: BaseActivityParams & {
    difficulty: number;
    relevantStats: StatName[];
    outcomeProfile: ActivityOutcomeProfile;
    statRequirements?: Partial<Record<StatName, number>>;
  }
): TrainingActivity {
  return {
    type: 'training',
    ...params,
    tags: params.tags || []
  };
}

/**
 * Create a leisure activity with sensible defaults
 */
export function createLeisureActivity(
  params: BaseActivityParams
): LeisureActivity {
  return {
    type: 'leisure',
    ...params,
    tags: params.tags || []
  };
}

/**
 * Create a recovery activity with sensible defaults
 */
export function createRecoveryActivity(
  params: BaseActivityParams
): RecoveryActivity {
  return {
    type: 'recovery',
    ...params,
    tags: params.tags || []
  };
}

/**
 * Create a discovery activity with sensible defaults
 */
export function createDiscoveryActivity(
  params: BaseActivityParams & {
    difficulty: number;
    relevantStats: StatName[];
    outcomeProfile: ActivityOutcomeProfile;
  }
): DiscoveryActivity {
  return {
    type: 'discovery',
    ...params,
    tags: params.tags || []
  };
}
