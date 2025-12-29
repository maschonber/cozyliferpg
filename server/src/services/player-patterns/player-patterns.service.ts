/**
 * Player Pattern Snapshot Builder
 *
 * Builds a consolidated snapshot of player behavioral patterns
 * with minimal database queries (2 total).
 */

import { Pool } from 'pg';
import { PlayerCharacter, PlayerActivity, StatName, ActivityTypeValue, OutcomeTier } from '../../../../shared/types';
import { PlayerPatternSnapshot, ActivityWindow, RelationshipSummary } from './types';
import { calculateRelationshipState } from '../relationship';
import { getActivityById } from '../../activities';
import { isBeforeMidnight, isAfter2AM } from '../time/game-time.service';

// === Time Window Constants ===
const TIME_WINDOWS = {
  SHORT: 3,   // days
  MEDIUM: 7,  // days
} as const;

// === Activity Window Builder ===
function buildActivityWindow(activities: PlayerActivity[]): ActivityWindow {
  const byType = new Map<ActivityTypeValue, PlayerActivity[]>();

  for (const activity of activities) {
    const activityType = activity.type;
    const list = byType.get(activityType) || [];
    list.push(activity);
    byType.set(activityType, list);
  }

  return {
    activities,
    uniqueActivityIds: new Set(activities.map(a => a.activityId)),
    uniqueNpcIds: new Set(activities.filter(a => a.npcId).map(a => a.npcId!)),
    byType,
    bestOutcomeCount: activities.filter(a => a.outcomeTier === 'best').length,
    catastrophicCount: activities.filter(a => a.outcomeTier === 'catastrophic').length,
  };
}

// === Main Builder ===
/**
 * Build a complete pattern snapshot for the player.
 * This performs exactly 2 database queries:
 * 1. Activities for last 7 days
 * 2. Relationships with interaction history
 *
 * @param bedtimeMinutes - Bedtime as minutes within day (0-1439)
 */
export async function buildPlayerPatternSnapshot(
  pool: Pool,
  player: PlayerCharacter,
  bedtimeMinutes: number
): Promise<PlayerPatternSnapshot> {
  const client = await pool.connect();

  try {
    // === Calculate Updated Streaks (include today) ===
    const workedToday = player.tracking.workedToday;
    const currentWorkStreak = workedToday
      ? player.tracking.workStreak + 1
      : 0;
    const currentRestStreak = workedToday
      ? 0
      : player.tracking.restStreak + 1;
    const hitZeroToday = player.tracking.minEnergyToday <= 0;
    const burnoutStreak = hitZeroToday
      ? player.tracking.burnoutStreak + 1
      : 0;
    const sleptLate = isAfter2AM(bedtimeMinutes);
    const lateNightStreak = sleptLate
      ? player.tracking.lateNightStreak + 1
      : 0;

    // === Fetch Activities (single query for all windows) ===
    // We only fetch performance data from DB, then join with code-defined activity definitions
    const activitiesResult = await client.query(
      `SELECT * FROM player_activities
       WHERE player_id = $1
         AND day_number > $2
       ORDER BY day_number DESC, created_at DESC`,
      [player.id, player.currentDay - TIME_WINDOWS.MEDIUM]
    );

    // Join DB rows with in-memory activity definitions
    const allActivities: PlayerActivity[] = activitiesResult.rows.map(row => {
      const activityDef = getActivityById(row.activity_id);

      return {
        // Core identifiers
        id: row.id,
        playerId: row.player_id,
        activityId: row.activity_id,

        // When it happened
        performedAt: row.performed_at?.toISOString?.() ?? row.performed_at,
        dayNumber: row.day_number,
        timeOfDay: row.time_of_day,

        // Activity type from code definition
        type: activityDef?.type ?? 'leisure' as ActivityTypeValue,

        // Outcome data (from DB)
        outcomeTier: row.outcome_tier as OutcomeTier | undefined,
        roll: row.roll,
        adjustedRoll: row.adjusted_roll,
        statBonus: row.stat_bonus,
        difficultyPenalty: row.difficulty_penalty,

        // Effects (from DB)
        statEffects: row.stat_effects,
        relationshipEffects: row.relationship_effects,
        energyDelta: row.energy_delta,
        moneyDelta: row.money_delta,

        // Social activity data (from DB)
        npcId: row.npc_id,

        createdAt: row.created_at?.toISOString?.() ?? row.created_at,
      };
    });

    // Partition into time windows
    const todayActivities = allActivities.filter(
      a => a.dayNumber === player.currentDay
    );
    const last3DaysActivities = allActivities.filter(
      a => a.dayNumber > player.currentDay - TIME_WINDOWS.SHORT
    );
    const last7DaysActivities = allActivities; // All fetched

    // === Fetch Relationships ===
    // Get last contact from player_activities where npc_id matches
    const relationshipsResult = await client.query(
      `SELECT pn.id as npc_id, pn.trust, pn.affection, pn.desire,
              MAX(pa.performed_at) as last_contact
       FROM player_npcs pn
       LEFT JOIN player_activities pa ON pa.npc_id = pn.id AND pa.player_id = $2
       WHERE pn.player_id = $1
       GROUP BY pn.id, pn.trust, pn.affection, pn.desire`,
      [player.userId, player.id]
    );

    const now = new Date();
    const relationships: RelationshipSummary[] = relationshipsResult.rows.map(row => {
      const state = calculateRelationshipState(row.trust, row.affection, row.desire);
      const daysSinceContact = row.last_contact
        ? Math.floor((now.getTime() - new Date(row.last_contact).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        npcId: row.npc_id,
        state,
        daysSinceContact,
      };
    });

    const friends = relationships.filter(r =>
      ['friend', 'close_friend', 'partner'].includes(r.state)
    );
    const romanticOnly = relationships.filter(r =>
      ['crush', 'lover'].includes(r.state)
    );
    const neglectedFriends = friends.filter(r =>
      r.daysSinceContact === null || r.daysSinceContact >= 7
    );

    // NPCs contacted today
    const todayWindow = buildActivityWindow(todayActivities);
    const npcsContactedToday = todayWindow.uniqueNpcIds;

    // Unique NPCs last 7 days
    const last7Window = buildActivityWindow(last7DaysActivities);
    const uniqueNpcsLast7Days = last7Window.uniqueNpcIds.size;

    // === Build Snapshot ===
    return {
      currentDay: player.currentDay,
      bedtimeMinutes,
      playerStats: player.stats,

      energy: {
        minToday: player.tracking.minEnergyToday,
        endingToday: player.tracking.endingEnergyToday,
        hitZero: hitZeroToday,
      },

      work: {
        workedToday,
        currentWorkStreak,
        currentRestStreak,
      },

      sleep: {
        sleptBeforeMidnight: isBeforeMidnight(bedtimeMinutes),
        sleptAfter2AM: sleptLate,
        lateNightStreak,
        burnoutStreak,
      },

      today: todayWindow,
      last3Days: buildActivityWindow(last3DaysActivities),
      last7Days: last7Window,

      social: {
        relationships,
        friends,
        romanticOnly,
        neglectedFriends,
        npcsContactedToday,
        uniqueNpcsLast7Days,
      },

      flags: {
        hadCatastrophicFailureToday: player.tracking.hadCatastrophicFailureToday,
        statsTrainedToday: new Set(player.tracking.statsTrainedToday),
      },
    };
  } finally {
    client.release();
  }
}
