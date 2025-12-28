/**
 * Relationship Repository
 * Data access layer for player-NPC relationships
 */

import { Pool, PoolClient } from 'pg';
import { randomUUID } from 'crypto';
import { Relationship, NPC, RelationshipState } from '../../../shared/types';
import { mapRowToRelationship } from './mappers/relationship.mapper';
import { mapRowToNPC } from './mappers/npc.mapper';

type DBConnection = Pool | PoolClient;

/**
 * Get relationship by player and NPC IDs
 */
export async function getByPlayerAndNpc(
  db: DBConnection,
  playerId: string,
  npcId: string
): Promise<Relationship | null> {
  const result = await db.query(
    'SELECT * FROM relationships WHERE player_id = $1 AND npc_id = $2',
    [playerId, npcId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToRelationship(result.rows[0]);
}

/**
 * Get all relationships for a player
 */
export async function getAllForPlayer(
  db: DBConnection,
  playerId: string
): Promise<Relationship[]> {
  const result = await db.query(
    'SELECT * FROM relationships WHERE player_id = $1 ORDER BY last_interaction DESC',
    [playerId]
  );

  return result.rows.map(row => mapRowToRelationship(row));
}

/**
 * Get all relationships for a player with NPC data joined
 */
export async function getAllForPlayerWithNPC(
  db: DBConnection,
  playerId: string
): Promise<Relationship[]> {
  const result = await db.query(
    `
    SELECT
      r.*,
      n.id as npc_id,
      n.name as npc_name,
      n.traits as npc_traits,
      n.revealed_traits as npc_revealed_traits,
      n.gender as npc_gender,
      n.emotion_vector as npc_emotion_vector,
      n.hair_color, n.hair_style, n.eye_color, n.face_details,
      n.body_type, n.torso_size, n.height, n.skin_tone,
      n.upper_trace, n.lower_trace, n.style, n.body_details,
      n.loras as npc_loras,
      n.current_location,
      n.created_at as npc_created_at
    FROM relationships r
    JOIN npcs n ON r.npc_id = n.id
    WHERE r.player_id = $1
    ORDER BY r.last_interaction DESC
    `,
    [playerId]
  );

  return result.rows.map(row => {
    // Build NPC from joined columns
    const npc = mapRowToNPC({
      id: row.npc_id,
      name: row.npc_name,
      traits: row.npc_traits,
      revealed_traits: row.npc_revealed_traits,
      gender: row.npc_gender,
      emotion_vector: row.npc_emotion_vector,
      hair_color: row.hair_color,
      hair_style: row.hair_style,
      eye_color: row.eye_color,
      face_details: row.face_details,
      body_type: row.body_type,
      torso_size: row.torso_size,
      height: row.height,
      skin_tone: row.skin_tone,
      upper_trace: row.upper_trace,
      lower_trace: row.lower_trace,
      style: row.style,
      body_details: row.body_details,
      loras: row.npc_loras,
      current_location: row.current_location,
      created_at: row.npc_created_at
    });

    return mapRowToRelationship(row, npc);
  });
}

/**
 * Data for creating a new relationship
 */
export interface CreateRelationshipData {
  playerId: string;
  npcId: string;
  desireCap?: number;
}

/**
 * Create a new relationship
 */
export async function create(
  db: DBConnection,
  data: CreateRelationshipData
): Promise<Relationship> {
  const id = randomUUID();
  const now = new Date();
  const initialState: RelationshipState = 'stranger';

  const result = await db.query(
    `
    INSERT INTO relationships (
      id, player_id, npc_id, trust, affection, desire, desire_cap,
      current_state, unlocked_states, first_met, last_interaction
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
    `,
    [id, data.playerId, data.npcId, 0, 0, 0, data.desireCap ?? null, initialState, [initialState], now, now]
  );

  return mapRowToRelationship(result.rows[0]);
}

/**
 * Update relationship axes and state
 */
export interface UpdateRelationshipData {
  trust?: number;
  affection?: number;
  desire?: number;
  currentState?: RelationshipState;
  unlockedStates?: RelationshipState[];
}

/**
 * Update a relationship
 */
export async function update(
  db: DBConnection,
  relationshipId: string,
  data: UpdateRelationshipData
): Promise<Relationship> {
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.trust !== undefined) {
    updateFields.push(`trust = $${paramCount++}`);
    values.push(data.trust);
  }
  if (data.affection !== undefined) {
    updateFields.push(`affection = $${paramCount++}`);
    values.push(data.affection);
  }
  if (data.desire !== undefined) {
    updateFields.push(`desire = $${paramCount++}`);
    values.push(data.desire);
  }
  if (data.currentState !== undefined) {
    updateFields.push(`current_state = $${paramCount++}`);
    values.push(data.currentState);
  }
  if (data.unlockedStates !== undefined) {
    updateFields.push(`unlocked_states = $${paramCount++}`);
    values.push(data.unlockedStates);
  }

  // Always update last_interaction
  updateFields.push(`last_interaction = $${paramCount++}`);
  values.push(new Date());

  values.push(relationshipId);

  const result = await db.query(
    `
    UPDATE relationships
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
    `,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Relationship not found');
  }

  return mapRowToRelationship(result.rows[0]);
}

/**
 * Delete relationship by ID
 */
export async function deleteById(
  db: DBConnection,
  id: string
): Promise<boolean> {
  const result = await db.query(
    'DELETE FROM relationships WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rows.length > 0;
}

/**
 * Delete all relationships for a player
 */
export async function deleteAllForPlayer(
  db: DBConnection,
  playerId: string
): Promise<void> {
  await db.query(
    'DELETE FROM relationships WHERE player_id = $1',
    [playerId]
  );
}

/**
 * Delete all relationships for an NPC
 */
export async function deleteAllForNpc(
  db: DBConnection,
  npcId: string
): Promise<void> {
  await db.query(
    'DELETE FROM relationships WHERE npc_id = $1',
    [npcId]
  );
}

/**
 * Check if relationship exists
 */
export async function exists(
  db: DBConnection,
  playerId: string,
  npcId: string
): Promise<boolean> {
  const result = await db.query(
    'SELECT id FROM relationships WHERE player_id = $1 AND npc_id = $2',
    [playerId, npcId]
  );

  return result.rows.length > 0;
}
