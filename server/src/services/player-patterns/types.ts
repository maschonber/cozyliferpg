/**
 * Player Pattern Snapshot Types
 *
 * Consolidated view of player behavioral patterns for lifestyle stat evaluation.
 */

import { StatName, PlayerActivity, PlayerStats, ActivityTypeValue } from '../../../../shared/types';

/**
 * Summary of activities within a time window.
 * Pre-aggregated for efficient evaluator access.
 */
export interface ActivityWindow {
  /** All activities in this window */
  activities: PlayerActivity[];

  /** Unique activity IDs performed */
  uniqueActivityIds: Set<string>;

  /** Unique NPC IDs interacted with */
  uniqueNpcIds: Set<string>;

  /** Activities grouped by type (work, social, training, leisure, recovery, discovery) */
  byType: Map<ActivityTypeValue, PlayerActivity[]>;

  /** Count of activities with 'best' outcome */
  bestOutcomeCount: number;

  /** Count of activities with 'catastrophic' outcome */
  catastrophicCount: number;
}

/**
 * Relationship summary for social pattern evaluation.
 */
export interface RelationshipSummary {
  npcId: string;
  state: string;  // friend, close_friend, partner, lover, crush, acquaintance, stranger
  daysSinceContact: number | null;  // null if never contacted
}

/**
 * Complete snapshot of player patterns for lifestyle evaluation.
 * Built once per sleep, used by all evaluators.
 */
export interface PlayerPatternSnapshot {
  // === Time Context ===
  currentDay: number;
  bedtime: string;  // HH:MM format

  // === Player Stats ===
  /** Current player stats (needed for difficulty/comfort level calculations) */
  playerStats: PlayerStats;

  // === Energy Patterns ===
  energy: {
    minToday: number;
    endingToday: number;
    hitZero: boolean;  // true if minToday <= 0
  };

  // === Work/Rest Patterns ===
  /**
   * Streaks INCLUDE today's activity.
   * If player worked today, workStreak reflects that.
   */
  work: {
    workedToday: boolean;
    currentWorkStreak: number;   // Consecutive work days including today
    currentRestStreak: number;   // Consecutive rest days including today
  };

  // === Sleep Patterns ===
  sleep: {
    sleptBeforeMidnight: boolean;  // Bedtime 20:00-23:59
    sleptAfter2AM: boolean;        // Bedtime 02:00-05:59
    lateNightStreak: number;       // Consecutive late nights including today
    burnoutStreak: number;         // Consecutive zero-energy days including today
  };

  // === Activity Windows ===
  /** Activities performed today (current day) */
  today: ActivityWindow;

  /** Activities from last 3 days (includes today) */
  last3Days: ActivityWindow;

  /** Activities from last 7 days (includes today) */
  last7Days: ActivityWindow;

  // === Social Patterns ===
  social: {
    /** All relationships with current state and last contact */
    relationships: RelationshipSummary[];

    /** Relationships in friend/close_friend/partner state */
    friends: RelationshipSummary[];

    /** Relationships in crush/lover state */
    romanticOnly: RelationshipSummary[];

    /** Friends not contacted in 7+ days */
    neglectedFriends: RelationshipSummary[];

    /** NPCs interacted with today */
    npcsContactedToday: Set<string>;

    /** Unique NPCs contacted in last 7 days */
    uniqueNpcsLast7Days: number;
  };

  // === Tracking Flags ===
  flags: {
    hadCatastrophicFailureToday: boolean;
    statsTrainedToday: Set<StatName>;
  };
}
