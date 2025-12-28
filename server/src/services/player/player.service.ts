/**
 * Player Character Service (Phase 2 + Phase 2.5)
 * Manages player character creation, retrieval, updates, and reset
 *
 * This service delegates to the player repository for data access
 * and provides higher-level operations like reset with cleanup.
 */

import { Pool, PoolClient } from 'pg';
import {
  PlayerCharacter,
  PlayerArchetype
} from '../../../../shared/types';
import {
  playerRepository,
  npcRepository,
  relationshipRepository,
  activityRepository
} from '../../repositories';

/**
 * Get player character for a user (creates if doesn't exist)
 */
export async function getOrCreatePlayerCharacter(
  pool: Pool,
  userId: string,
  archetype: PlayerArchetype = 'balanced'
): Promise<PlayerCharacter> {
  const existing = await playerRepository.getByUserId(pool, userId);
  if (existing) {
    return existing;
  }

  const player = await playerRepository.create(pool, userId, archetype);
  console.log(`✅ Created new player character for user ${userId} with archetype ${archetype}`);
  return player;
}

/**
 * Update player character (including stats and tracking)
 */
export async function updatePlayerCharacter(
  pool: Pool,
  playerId: string,
  updates: Partial<Omit<PlayerCharacter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<PlayerCharacter> {
  return playerRepository.update(pool, playerId, updates);
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
    const player = await playerRepository.getByUserId(client, userId);

    if (!player) {
      // No player character exists, create new one
      await client.query('COMMIT');
      return await getOrCreatePlayerCharacter(pool, userId);
    }

    // Always reset to balanced archetype so player can choose again
    const archetype: PlayerArchetype = 'balanced';

    // Delete all relationships
    await relationshipRepository.deleteAllForPlayer(client, userId);

    // Delete all NPCs
    await npcRepository.deleteAll(client);

    // Delete all player activities
    await activityRepository.deleteAllForPlayer(client, player.id);

    // Reset player character to initial values
    const resetPlayer = await playerRepository.resetToInitialState(client, player.id, archetype);

    await client.query('COMMIT');

    console.log(`✅ Reset player character for user ${userId}`);
    return resetPlayer;
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
  // Get starting stats for the new archetype
  const { getStartingStats } = await import('../stat');
  const stats = getStartingStats(newArchetype);

  return playerRepository.update(pool, playerId, {
    archetype: newArchetype,
    stats
  });
}
