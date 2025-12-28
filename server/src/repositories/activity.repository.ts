/**
 * Activity Repository
 * Data access layer for activity history
 */

import { Pool, PoolClient } from 'pg';
import { randomUUID } from 'crypto';
import {
  PlayerActivity,
  StatName,
  OutcomeTier,
  ActivityTypeValue
} from '../../../shared/types';
import { getActivityById } from '../activities';

type DBConnection = Pool | PoolClient;

/**
 * Database row structure for PlayerActivity
 */
interface PlayerActivityRow {
  id: string;
  player_id: string;
  activity_id: string;
  performed_at: Date;
  day_number: number;
  time_of_day: string;
  outcome_tier: string | null;
  roll: number | null;
  adjusted_roll: number | null;
  stat_bonus: number | null;
  difficulty_penalty: number | null;
  stat_effects: Record<string, number> | null;
  relationship_effects: { trust?: number; affection?: number; desire?: number } | null;
  energy_delta: number | null;
  money_delta: number | null;
  npc_id: string | null;
  created_at: Date;
}

/**
 * Map database row to PlayerActivity object
 */
function mapRowToPlayerActivity(row: PlayerActivityRow): PlayerActivity {
  const activityDef = getActivityById(row.activity_id);

  return {
    id: row.id,
    playerId: row.player_id,
    activityId: row.activity_id,
    performedAt: row.performed_at.toISOString(),
    dayNumber: row.day_number,
    timeOfDay: row.time_of_day,
    // Activity type from code definition
    type: activityDef?.type ?? 'leisure' as ActivityTypeValue,
    outcomeTier: row.outcome_tier as OutcomeTier | undefined,
    roll: row.roll ?? undefined,
    adjustedRoll: row.adjusted_roll ?? undefined,
    statBonus: row.stat_bonus ?? undefined,
    difficultyPenalty: row.difficulty_penalty ?? undefined,
    statEffects: row.stat_effects ?? undefined,
    relationshipEffects: row.relationship_effects ?? undefined,
    energyDelta: row.energy_delta ?? undefined,
    moneyDelta: row.money_delta ?? undefined,
    npcId: row.npc_id ?? undefined,
    createdAt: row.created_at.toISOString()
  };
}

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
export async function recordActivity(
  db: DBConnection,
  data: RecordActivityData
): Promise<PlayerActivity> {
  const id = randomUUID();
  const now = new Date();

  const result = await db.query(
    `
    INSERT INTO player_activities (
      id, player_id, activity_id,
      performed_at, day_number, time_of_day,
      outcome_tier, roll, adjusted_roll, stat_bonus, difficulty_penalty,
      stat_effects, relationship_effects, energy_delta, money_delta,
      npc_id,
      created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13, $14, $15, $16, $17
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
      data.outcomeTier || null,
      data.roll || null,
      data.adjustedRoll || null,
      data.statBonus || null,
      data.difficultyPenalty || null,
      data.statEffects ? JSON.stringify(data.statEffects) : null,
      data.relationshipEffects ? JSON.stringify(data.relationshipEffects) : null,
      data.energyDelta || null,
      data.moneyDelta || null,
      data.npcId || null,
      now
    ]
  );

  return mapRowToPlayerActivity(result.rows[0]);
}

/**
 * Get activities for a specific day
 */
export async function getActivitiesForDay(
  db: DBConnection,
  playerId: string,
  dayNumber: number
): Promise<PlayerActivity[]> {
  const result = await db.query(
    `
    SELECT * FROM player_activities
    WHERE player_id = $1 AND day_number = $2
    ORDER BY performed_at ASC
    `,
    [playerId, dayNumber]
  );

  return result.rows.map(mapRowToPlayerActivity);
}

/**
 * Get activities within a date range
 */
export async function getActivitiesInDateRange(
  db: DBConnection,
  playerId: string,
  startDate: Date,
  endDate: Date
): Promise<PlayerActivity[]> {
  const result = await db.query(
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
}

/**
 * Get activities for last N days
 */
export async function getActivitiesForLastNDays(
  db: DBConnection,
  playerId: string,
  days: number
): Promise<PlayerActivity[]> {
  const result = await db.query(
    `
    SELECT * FROM player_activities
    WHERE player_id = $1
      AND performed_at >= NOW() - INTERVAL '${days} days'
    ORDER BY performed_at ASC
    `,
    [playerId]
  );

  return result.rows.map(mapRowToPlayerActivity);
}

/**
 * Delete all activities for a player
 */
export async function deleteAllForPlayer(
  db: DBConnection,
  playerId: string
): Promise<void> {
  await db.query(
    'DELETE FROM player_activities WHERE player_id = $1',
    [playerId]
  );
}

/**
 * Get count of activities for a player
 */
export async function getCountForPlayer(
  db: DBConnection,
  playerId: string
): Promise<number> {
  const result = await db.query(
    'SELECT COUNT(*) as count FROM player_activities WHERE player_id = $1',
    [playerId]
  );

  return parseInt(result.rows[0].count, 10);
}
