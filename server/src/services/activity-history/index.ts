/**
 * Activity History Service (Phase 2.5.1)
 * Manages player activity history for defensive stat calculations
 */

import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { PlayerActivity, StatName, OutcomeTier, ActivityCategory } from '../../../../shared/types';

/**
 * Map database row to PlayerActivity object
 */
function mapRowToPlayerActivity(row: any): PlayerActivity {
  return {
    id: row.id,
    playerId: row.player_id,
    activityId: row.activity_id,
    performedAt: row.performed_at.toISOString(),
    dayNumber: row.day_number,
    timeOfDay: row.time_of_day,
    activityName: row.activity_name,
    category: row.category as ActivityCategory,
    difficulty: row.difficulty,
    relevantStats: row.relevant_stats || [],
    timeCost: row.time_cost,
    energyCost: row.energy_cost,
    moneyCost: row.money_cost,
    outcomeTier: row.outcome_tier as OutcomeTier | undefined,
    roll: row.roll,
    adjustedRoll: row.adjusted_roll,
    statBonus: row.stat_bonus,
    difficultyPenalty: row.difficulty_penalty,
    statEffects: row.stat_effects || undefined,
    energyDelta: row.energy_delta,
    moneyDelta: row.money_delta,
    npcId: row.npc_id || undefined,
    interactionId: row.interaction_id || undefined,
    createdAt: row.created_at.toISOString()
  };
}

/**
 * Record a player activity
 */
export async function recordPlayerActivity(
  pool: Pool,
  data: {
    playerId: string;
    activityId: string;
    dayNumber: number;
    timeOfDay: string;
    activityName: string;
    category: ActivityCategory;
    difficulty?: number;
    relevantStats: StatName[];
    timeCost: number;
    energyCost: number;
    moneyCost: number;
    outcomeTier?: OutcomeTier;
    roll?: number;
    adjustedRoll?: number;
    statBonus?: number;
    difficultyPenalty?: number;
    statEffects?: Partial<Record<StatName, number>>;
    energyDelta?: number;
    moneyDelta?: number;
    npcId?: string;
    interactionId?: string;
  }
): Promise<PlayerActivity> {
  const client = await pool.connect();

  try {
    const id = randomUUID();
    const now = new Date();

    const result = await client.query(
      `
      INSERT INTO player_activities (
        id, player_id, activity_id,
        performed_at, day_number, time_of_day,
        activity_name, category, difficulty, relevant_stats,
        time_cost, energy_cost, money_cost,
        outcome_tier, roll, adjusted_roll, stat_bonus, difficulty_penalty,
        stat_effects, energy_delta, money_delta,
        npc_id, interaction_id,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24
      )
      RETURNING *
      `,
      [
        id,
        data.playerId,
        data.activityId,
        now,
        data.dayNumber,
        data.timeOfDay,
        data.activityName,
        data.category,
        data.difficulty || null,
        data.relevantStats,
        data.timeCost,
        data.energyCost,
        data.moneyCost,
        data.outcomeTier || null,
        data.roll || null,
        data.adjustedRoll || null,
        data.statBonus || null,
        data.difficultyPenalty || null,
        data.statEffects ? JSON.stringify(data.statEffects) : null,
        data.energyDelta || null,
        data.moneyDelta || null,
        data.npcId || null,
        data.interactionId || null,
        now
      ]
    );

    return mapRowToPlayerActivity(result.rows[0]);
  } finally {
    client.release();
  }
}

/**
 * Get activities for a specific day
 */
export async function getActivitiesForDay(
  pool: Pool,
  playerId: string,
  dayNumber: number
): Promise<PlayerActivity[]> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT * FROM player_activities
      WHERE player_id = $1 AND day_number = $2
      ORDER BY performed_at ASC
      `,
      [playerId, dayNumber]
    );

    return result.rows.map(mapRowToPlayerActivity);
  } finally {
    client.release();
  }
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
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT * FROM player_activities
      WHERE player_id = $1
        AND performed_at >= $2
        AND performed_at <= $3
      ORDER BY performed_at ASC
      `,
      [playerId, startDate, endDate]
    );

    return result.rows.map(mapRowToPlayerActivity);
  } finally {
    client.release();
  }
}

/**
 * Get activities for last N days
 */
export async function getActivitiesForLastNDays(
  pool: Pool,
  playerId: string,
  days: number
): Promise<PlayerActivity[]> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT * FROM player_activities
      WHERE player_id = $1
        AND performed_at >= NOW() - INTERVAL '${days} days'
      ORDER BY performed_at ASC
      `,[playerId]
    );

    return result.rows.map(mapRowToPlayerActivity);
  } finally {
    client.release();
  }
}

/**
 * Get count of activities by category for a day
 */
export async function getActivityCountsByCategory(
  pool: Pool,
  playerId: string,
  dayNumber: number
): Promise<Record<ActivityCategory, number>> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT category, COUNT(*) as count
      FROM player_activities
      WHERE player_id = $1 AND day_number = $2
      GROUP BY category
      `,
      [playerId, dayNumber]
    );

    const counts: Partial<Record<ActivityCategory, number>> = {};
    for (const row of result.rows) {
      counts[row.category as ActivityCategory] = parseInt(row.count);
    }

    return counts as Record<ActivityCategory, number>;
  } finally {
    client.release();
  }
}

/**
 * Delete all activities for a player (used during reset)
 */
export async function deletePlayerActivities(
  pool: Pool,
  playerId: string
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query(
      'DELETE FROM player_activities WHERE player_id = $1',
      [playerId]
    );
  } finally {
    client.release();
  }
}
