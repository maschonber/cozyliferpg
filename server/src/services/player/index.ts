/**
 * Player Character Service (Phase 2)
 * Manages player character creation, retrieval, updates, and reset
 */

import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { PlayerCharacter } from '../../../../shared/types';

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
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

/**
 * Get player character for a user (creates if doesn't exist)
 */
export async function getOrCreatePlayerCharacter(
  pool: Pool,
  userId: string
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

    // Create new player character with default values
    const id = randomUUID();
    const now = new Date();

    const result = await client.query(
      `
      INSERT INTO player_characters (
        id, user_id, current_energy, max_energy, money,
        current_day, time_of_day, last_slept_at,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [id, userId, 100, 100, 200, 1, '06:00', '06:00', now, now]
    );

    console.log(`✅ Created new player character for user ${userId}`);
    return mapRowToPlayerCharacter(result.rows[0]);
  } finally {
    client.release();
  }
}

/**
 * Update player character
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

    // Delete all relationships (will cascade to interactions)
    await client.query('DELETE FROM relationships WHERE player_id = $1', [userId]);

    // Delete all NPCs (note: this deletes ALL npcs, assuming single-player game)
    // In a multi-player game, we'd need to track NPC ownership
    await client.query('DELETE FROM npcs');

    // Reset player character to initial values
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
          updated_at = $1
      WHERE id = $2
      RETURNING *
      `,
      [now, playerId]
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
