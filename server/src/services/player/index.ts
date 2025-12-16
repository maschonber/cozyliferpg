/**
 * Player Character Service (Phase 2 + Phase 2.5)
 * Manages player character creation, retrieval, updates, and reset
 */

import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import {
  PlayerCharacter,
  PlayerArchetype,
  PlayerStats,
  StatTracking
} from '../../../../shared/types';
import { getStartingStats, getDefaultTracking } from '../stat';

/**
 * Map database row to PlayerCharacter object
 */
function mapRowToPlayerCharacter(row: any): PlayerCharacter {
  return {
    id: row.id,
    userId: row.user_id,
    currentEnergy: row.current_energy,
    maxEnergy: row.max_energy,
    money: row.money,
    currentDay: row.current_day,
    currentTime: row.time_of_day,
    lastSleptAt: row.last_slept_at,
    currentLocation: row.current_location || 'home',

    // Relationship preferences (Relationship Redesign)
    sexualPreference: row.sexual_preference || 'everyone',

    // Phase 2.5: Stats
    archetype: row.archetype || 'balanced',
    stats: {
      baseFitness: row.base_fitness ?? 15,
      baseVitality: row.base_vitality ?? 15,
      basePoise: row.base_poise ?? 15,
      baseKnowledge: row.base_knowledge ?? 15,
      baseCreativity: row.base_creativity ?? 15,
      baseAmbition: row.base_ambition ?? 15,
      baseConfidence: row.base_confidence ?? 15,
      baseWit: row.base_wit ?? 15,
      baseEmpathy: row.base_empathy ?? 15,
      currentFitness: row.current_fitness ?? 15,
      currentVitality: row.current_vitality ?? 15,
      currentPoise: row.current_poise ?? 15,
      currentKnowledge: row.current_knowledge ?? 15,
      currentCreativity: row.current_creativity ?? 15,
      currentAmbition: row.current_ambition ?? 15,
      currentConfidence: row.current_confidence ?? 15,
      currentWit: row.current_wit ?? 15,
      currentEmpathy: row.current_empathy ?? 15
    },
    tracking: {
      minEnergyToday: row.min_energy_today ?? 100,
      endingEnergyToday: row.ending_energy_today ?? 100,
      workStreak: row.work_streak ?? 0,
      restStreak: row.rest_streak ?? 0,
      burnoutStreak: row.burnout_streak ?? 0,
      lateNightStreak: row.late_night_streak ?? 0,
      workedToday: row.worked_today ?? false,
      hadCatastrophicFailureToday: row.had_catastrophic_failure_today ?? false,
      statsTrainedToday: row.stats_trained_today ?? []
    },

    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

/**
 * Get player character for a user (creates if doesn't exist)
 */
export async function getOrCreatePlayerCharacter(
  pool: Pool,
  userId: string,
  archetype: PlayerArchetype = 'balanced'
): Promise<PlayerCharacter> {
  const client = await pool.connect();

  try {
    // Check if player character exists
    const existing = await client.query(
      'SELECT * FROM player_characters WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      return mapRowToPlayerCharacter(existing.rows[0]);
    }

    // Create new player character with stats based on archetype
    const id = randomUUID();
    const now = new Date();
    const stats = getStartingStats(archetype);
    const tracking = getDefaultTracking();

    const result = await client.query(
      `
      INSERT INTO player_characters (
        id, user_id, current_energy, max_energy, money,
        current_day, time_of_day, last_slept_at,
        archetype,
        base_fitness, base_vitality, base_poise,
        base_knowledge, base_creativity, base_ambition,
        base_confidence, base_wit, base_empathy,
        current_fitness, current_vitality, current_poise,
        current_knowledge, current_creativity, current_ambition,
        current_confidence, current_wit, current_empathy,
        min_energy_today, ending_energy_today, work_streak, rest_streak,
        burnout_streak, late_night_streak,
        worked_today, had_catastrophic_failure_today,
        stats_trained_today,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32, $33, $34, $35, $36,
        $37, $38, $39
      )
      RETURNING *
      `,
      [
        id, userId, 100, 100, 200, 1, '06:00', '06:00',
        archetype,
        stats.baseFitness, stats.baseVitality, stats.basePoise,
        stats.baseKnowledge, stats.baseCreativity, stats.baseAmbition,
        stats.baseConfidence, stats.baseWit, stats.baseEmpathy,
        stats.currentFitness, stats.currentVitality, stats.currentPoise,
        stats.currentKnowledge, stats.currentCreativity, stats.currentAmbition,
        stats.currentConfidence, stats.currentWit, stats.currentEmpathy,
        tracking.minEnergyToday, tracking.endingEnergyToday, tracking.workStreak, tracking.restStreak,
        tracking.burnoutStreak, tracking.lateNightStreak,
        tracking.workedToday, tracking.hadCatastrophicFailureToday,
        tracking.statsTrainedToday,
        now, now
      ]
    );

    console.log(`✅ Created new player character for user ${userId} with archetype ${archetype}`);
    return mapRowToPlayerCharacter(result.rows[0]);
  } finally {
    client.release();
  }
}

/**
 * Update player character (including stats and tracking)
 */
export async function updatePlayerCharacter(
  pool: Pool,
  playerId: string,
  updates: Partial<Omit<PlayerCharacter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<PlayerCharacter> {
  const client = await pool.connect();

  try {
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Basic fields
    if (updates.currentEnergy !== undefined) {
      updateFields.push(`current_energy = $${paramCount++}`);
      values.push(updates.currentEnergy);
    }
    if (updates.maxEnergy !== undefined) {
      updateFields.push(`max_energy = $${paramCount++}`);
      values.push(updates.maxEnergy);
    }
    if (updates.money !== undefined) {
      updateFields.push(`money = $${paramCount++}`);
      values.push(updates.money);
    }
    if (updates.currentDay !== undefined) {
      updateFields.push(`current_day = $${paramCount++}`);
      values.push(updates.currentDay);
    }
    if (updates.currentTime !== undefined) {
      updateFields.push(`time_of_day = $${paramCount++}`);
      values.push(updates.currentTime);
    }
    if (updates.lastSleptAt !== undefined) {
      updateFields.push(`last_slept_at = $${paramCount++}`);
      values.push(updates.lastSleptAt);
    }
    if (updates.currentLocation !== undefined) {
      updateFields.push(`current_location = $${paramCount++}`);
      values.push(updates.currentLocation);
    }
    if (updates.archetype !== undefined) {
      updateFields.push(`archetype = $${paramCount++}`);
      values.push(updates.archetype);
    }

    // Stats (Phase 2.5)
    if (updates.stats) {
      const s = updates.stats;
      if (s.baseFitness !== undefined) { updateFields.push(`base_fitness = $${paramCount++}`); values.push(s.baseFitness); }
      if (s.baseVitality !== undefined) { updateFields.push(`base_vitality = $${paramCount++}`); values.push(s.baseVitality); }
      if (s.basePoise !== undefined) { updateFields.push(`base_poise = $${paramCount++}`); values.push(s.basePoise); }
      if (s.baseKnowledge !== undefined) { updateFields.push(`base_knowledge = $${paramCount++}`); values.push(s.baseKnowledge); }
      if (s.baseCreativity !== undefined) { updateFields.push(`base_creativity = $${paramCount++}`); values.push(s.baseCreativity); }
      if (s.baseAmbition !== undefined) { updateFields.push(`base_ambition = $${paramCount++}`); values.push(s.baseAmbition); }
      if (s.baseConfidence !== undefined) { updateFields.push(`base_confidence = $${paramCount++}`); values.push(s.baseConfidence); }
      if (s.baseWit !== undefined) { updateFields.push(`base_wit = $${paramCount++}`); values.push(s.baseWit); }
      if (s.baseEmpathy !== undefined) { updateFields.push(`base_empathy = $${paramCount++}`); values.push(s.baseEmpathy); }
      if (s.currentFitness !== undefined) { updateFields.push(`current_fitness = $${paramCount++}`); values.push(s.currentFitness); }
      if (s.currentVitality !== undefined) { updateFields.push(`current_vitality = $${paramCount++}`); values.push(s.currentVitality); }
      if (s.currentPoise !== undefined) { updateFields.push(`current_poise = $${paramCount++}`); values.push(s.currentPoise); }
      if (s.currentKnowledge !== undefined) { updateFields.push(`current_knowledge = $${paramCount++}`); values.push(s.currentKnowledge); }
      if (s.currentCreativity !== undefined) { updateFields.push(`current_creativity = $${paramCount++}`); values.push(s.currentCreativity); }
      if (s.currentAmbition !== undefined) { updateFields.push(`current_ambition = $${paramCount++}`); values.push(s.currentAmbition); }
      if (s.currentConfidence !== undefined) { updateFields.push(`current_confidence = $${paramCount++}`); values.push(s.currentConfidence); }
      if (s.currentWit !== undefined) { updateFields.push(`current_wit = $${paramCount++}`); values.push(s.currentWit); }
      if (s.currentEmpathy !== undefined) { updateFields.push(`current_empathy = $${paramCount++}`); values.push(s.currentEmpathy); }
    }

    // Tracking (Phase 2.5)
    if (updates.tracking) {
      const t = updates.tracking;
      if (t.minEnergyToday !== undefined) { updateFields.push(`min_energy_today = $${paramCount++}`); values.push(t.minEnergyToday); }
      if (t.endingEnergyToday !== undefined) { updateFields.push(`ending_energy_today = $${paramCount++}`); values.push(t.endingEnergyToday); }
      if (t.workStreak !== undefined) { updateFields.push(`work_streak = $${paramCount++}`); values.push(t.workStreak); }
      if (t.restStreak !== undefined) { updateFields.push(`rest_streak = $${paramCount++}`); values.push(t.restStreak); }
      if (t.burnoutStreak !== undefined) { updateFields.push(`burnout_streak = $${paramCount++}`); values.push(t.burnoutStreak); }
      if (t.lateNightStreak !== undefined) { updateFields.push(`late_night_streak = $${paramCount++}`); values.push(t.lateNightStreak); }
      if (t.workedToday !== undefined) { updateFields.push(`worked_today = $${paramCount++}`); values.push(t.workedToday); }
      if (t.hadCatastrophicFailureToday !== undefined) { updateFields.push(`had_catastrophic_failure_today = $${paramCount++}`); values.push(t.hadCatastrophicFailureToday); }
      if (t.statsTrainedToday !== undefined) { updateFields.push(`stats_trained_today = $${paramCount++}`); values.push(t.statsTrainedToday); }
    }

    // Always update updated_at
    updateFields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    // Add player ID as final parameter
    values.push(playerId);

    const result = await client.query(
      `
      UPDATE player_characters
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
      `,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Player character not found');
    }

    return mapRowToPlayerCharacter(result.rows[0]);
  } finally {
    client.release();
  }
}

/**
 * Reset player character to initial state and delete all NPCs
 * Resets archetype to 'balanced' so player can choose a new archetype
 */
export async function resetPlayerCharacter(
  pool: Pool,
  userId: string
): Promise<PlayerCharacter> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get player character ID
    const playerResult = await client.query(
      'SELECT id FROM player_characters WHERE user_id = $1',
      [userId]
    );

    if (playerResult.rows.length === 0) {
      // No player character exists, create new one
      await client.query('COMMIT');
      return await getOrCreatePlayerCharacter(pool, userId);
    }

    const playerId = playerResult.rows[0].id;
    // Always reset to balanced archetype so player can choose again
    const archetype: PlayerArchetype = 'balanced';

    // Delete all relationships (will cascade to interactions)
    await client.query('DELETE FROM relationships WHERE player_id = $1', [userId]);

    // Delete all NPCs
    await client.query('DELETE FROM npcs');

    // Delete all player activities (Phase 2.5.1)
    await client.query('DELETE FROM player_activities WHERE player_id = $1', [playerId]);

    // Get starting stats for archetype
    const stats = getStartingStats(archetype);
    const tracking = getDefaultTracking();

    // Reset player character to initial values with balanced archetype
    const now = new Date();
    const result = await client.query(
      `
      UPDATE player_characters
      SET current_energy = 100,
          max_energy = 100,
          money = 200,
          current_day = 1,
          time_of_day = '06:00',
          last_slept_at = '06:00',
          current_location = 'home',
          archetype = $1,
          base_fitness = $2, base_vitality = $3, base_poise = $4,
          base_knowledge = $5, base_creativity = $6, base_ambition = $7,
          base_confidence = $8, base_wit = $9, base_empathy = $10,
          current_fitness = $11, current_vitality = $12, current_poise = $13,
          current_knowledge = $14, current_creativity = $15, current_ambition = $16,
          current_confidence = $17, current_wit = $18, current_empathy = $19,
          min_energy_today = $20, ending_energy_today = $21, work_streak = $22, rest_streak = $23,
          burnout_streak = $24, late_night_streak = $25,
          worked_today = $26, had_catastrophic_failure_today = $27,
          stats_trained_today = $28,
          updated_at = $29
      WHERE id = $30
      RETURNING *
      `,
      [
        archetype,
        stats.baseFitness, stats.baseVitality, stats.basePoise,
        stats.baseKnowledge, stats.baseCreativity, stats.baseAmbition,
        stats.baseConfidence, stats.baseWit, stats.baseEmpathy,
        stats.currentFitness, stats.currentVitality, stats.currentPoise,
        stats.currentKnowledge, stats.currentCreativity, stats.currentAmbition,
        stats.currentConfidence, stats.currentWit, stats.currentEmpathy,
        tracking.minEnergyToday, tracking.endingEnergyToday, tracking.workStreak, tracking.restStreak,
        tracking.burnoutStreak, tracking.lateNightStreak,
        tracking.workedToday, tracking.hadCatastrophicFailureToday,
        tracking.statsTrainedToday,
        now, playerId
      ]
    );

    await client.query('COMMIT');

    console.log(`✅ Reset player character for user ${userId}`);
    return mapRowToPlayerCharacter(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update player archetype (and reset stats to match)
 * Use this when player wants to change their character build
 */
export async function updatePlayerArchetype(
  pool: Pool,
  playerId: string,
  newArchetype: PlayerArchetype
): Promise<PlayerCharacter> {
  const stats = getStartingStats(newArchetype);

  return updatePlayerCharacter(pool, playerId, {
    archetype: newArchetype,
    stats
  });
}
