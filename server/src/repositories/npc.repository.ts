/**
 * Player NPC Repository
 * Data access layer for player-specific NPC data (merged NPC + relationship data)
 */

import { Pool, PoolClient } from 'pg';
import { randomUUID } from 'crypto';
import {
  NpcView,
  EmotionVector,
  NPCTrait,
  RelationshipState,
  LocationId,
  NEUTRAL_EMOTION_VECTOR
} from '../../../shared/types';
import { mapRowToNpcView } from './mappers/npc.mapper';

type DBConnection = Pool | PoolClient;

/**
 * SQL fragment for selecting player_npcs with template data
 */
const SELECT_WITH_TEMPLATE = `
  SELECT
    pn.id,
    pn.player_id,
    pn.npc_template_id,
    pn.trust,
    pn.affection,
    pn.desire,
    pn.current_state,
    pn.emotion_vector,
    pn.revealed_traits,
    pn.current_location,
    pn.first_met,
    pn.last_interaction,
    t.name as template_name,
    t.gender as template_gender,
    t.traits as template_traits,
    t.hair_color as template_hair_color,
    t.hair_style as template_hair_style,
    t.eye_color as template_eye_color,
    t.face_details as template_face_details,
    t.body_type as template_body_type,
    t.torso_size as template_torso_size,
    t.height as template_height,
    t.skin_tone as template_skin_tone,
    t.upper_trace as template_upper_trace,
    t.lower_trace as template_lower_trace,
    t.style as template_style,
    t.body_details as template_body_details,
    t.loras as template_loras
  FROM player_npcs pn
  JOIN npc_templates t ON pn.npc_template_id = t.id
`;

/**
 * Get player NPC by ID
 */
export async function getById(
  db: DBConnection,
  id: string
): Promise<NpcView | null> {
  const result = await db.query(
    `${SELECT_WITH_TEMPLATE} WHERE pn.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToNpcView(result.rows[0]);
}

/**
 * Get player NPC by player ID and template ID
 */
export async function getByPlayerAndTemplate(
  db: DBConnection,
  playerId: string,
  templateId: string
): Promise<NpcView | null> {
  const result = await db.query(
    `${SELECT_WITH_TEMPLATE} WHERE pn.player_id = $1 AND pn.npc_template_id = $2`,
    [playerId, templateId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToNpcView(result.rows[0]);
}

/**
 * Get all player NPCs for a player
 */
export async function getAllForPlayer(
  db: DBConnection,
  playerId: string
): Promise<NpcView[]> {
  const result = await db.query(
    `${SELECT_WITH_TEMPLATE} WHERE pn.player_id = $1 ORDER BY pn.last_interaction DESC`,
    [playerId]
  );

  return result.rows.map(row => mapRowToNpcView(row));
}

/**
 * Get all player NPCs at a specific location
 */
export async function getAllForPlayerAtLocation(
  db: DBConnection,
  playerId: string,
  locationId: LocationId
): Promise<NpcView[]> {
  const result = await db.query(
    `${SELECT_WITH_TEMPLATE} WHERE pn.player_id = $1 AND pn.current_location = $2 ORDER BY pn.last_interaction DESC`,
    [playerId, locationId]
  );

  return result.rows.map(row => mapRowToNpcView(row));
}

/**
 * Get count of player NPCs at a location
 */
export async function getCountByLocation(
  db: DBConnection,
  playerId: string,
  locationId: LocationId
): Promise<number> {
  const result = await db.query(
    'SELECT COUNT(*) as count FROM player_npcs WHERE player_id = $1 AND current_location = $2',
    [playerId, locationId]
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Data for creating a new player NPC
 */
export interface CreatePlayerNPCData {
  playerId: string;
  templateId: string;
  currentLocation: LocationId;
  firstMet: number;  // game time in minutes
}

/**
 * Create a new player NPC (when player meets an NPC)
 */
export async function create(
  db: DBConnection,
  data: CreatePlayerNPCData
): Promise<NpcView> {
  const id = randomUUID();
  const initialState: RelationshipState = 'stranger';

  const result = await db.query(
    `
    INSERT INTO player_npcs (
      id, player_id, npc_template_id,
      trust, affection, desire, current_state,
      emotion_vector, revealed_traits, current_location,
      first_met, last_interaction
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
    `,
    [
      id,
      data.playerId,
      data.templateId,
      0,  // trust
      0,  // affection
      0,  // desire
      initialState,
      JSON.stringify(NEUTRAL_EMOTION_VECTOR),
      [],  // revealed_traits
      data.currentLocation,
      data.firstMet,
      data.firstMet  // last_interaction = first_met initially
    ]
  );

  // Fetch with template data for complete PlayerNPCView
  return getById(db, result.rows[0].id) as Promise<NpcView>;
}

/**
 * Data for updating a player NPC
 */
export interface UpdatePlayerNPCData {
  trust?: number;
  affection?: number;
  desire?: number;
  currentState?: RelationshipState;
  emotionVector?: EmotionVector;
  revealedTraits?: NPCTrait[];
  currentLocation?: LocationId;
  lastInteraction?: number;  // game time in minutes
}

/**
 * Update a player NPC
 */
export async function update(
  db: DBConnection,
  id: string,
  data: UpdatePlayerNPCData
): Promise<NpcView> {
  const updateFields: string[] = [];
  const values: unknown[] = [];
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
  if (data.emotionVector !== undefined) {
    updateFields.push(`emotion_vector = $${paramCount++}`);
    values.push(JSON.stringify(data.emotionVector));
  }
  if (data.revealedTraits !== undefined) {
    updateFields.push(`revealed_traits = $${paramCount++}`);
    values.push(data.revealedTraits);
  }
  if (data.currentLocation !== undefined) {
    updateFields.push(`current_location = $${paramCount++}`);
    values.push(data.currentLocation);
  }
  if (data.lastInteraction !== undefined) {
    updateFields.push(`last_interaction = $${paramCount++}`);
    values.push(data.lastInteraction);
  }

  if (updateFields.length === 0) {
    // No updates, return current state
    const current = await getById(db, id);
    if (!current) {
      throw new Error('Player NPC not found');
    }
    return current;
  }

  values.push(id);

  await db.query(
    `UPDATE player_npcs SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
    values
  );

  const updated = await getById(db, id);
  if (!updated) {
    throw new Error('Player NPC not found after update');
  }
  return updated;
}

/**
 * Update emotion vector
 */
export async function updateEmotionVector(
  db: DBConnection,
  id: string,
  emotionVector: EmotionVector
): Promise<void> {
  await db.query(
    'UPDATE player_npcs SET emotion_vector = $1 WHERE id = $2',
    [JSON.stringify(emotionVector), id]
  );
}

/**
 * Append a trait to revealed traits
 */
export async function appendRevealedTrait(
  db: DBConnection,
  id: string,
  trait: NPCTrait
): Promise<void> {
  await db.query(
    'UPDATE player_npcs SET revealed_traits = array_append(revealed_traits, $1) WHERE id = $2',
    [trait, id]
  );
}

/**
 * Update location
 */
export async function updateLocation(
  db: DBConnection,
  id: string,
  locationId: LocationId
): Promise<void> {
  await db.query(
    'UPDATE player_npcs SET current_location = $1 WHERE id = $2',
    [locationId, id]
  );
}

/**
 * Delete player NPC by ID
 */
export async function deleteById(
  db: DBConnection,
  id: string
): Promise<boolean> {
  const result = await db.query(
    'DELETE FROM player_npcs WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rows.length > 0;
}

/**
 * Delete all player NPCs for a player
 */
export async function deleteAllForPlayer(
  db: DBConnection,
  playerId: string
): Promise<void> {
  await db.query(
    'DELETE FROM player_npcs WHERE player_id = $1',
    [playerId]
  );
}

/**
 * Delete all player NPCs for a template
 */
export async function deleteAllForTemplate(
  db: DBConnection,
  templateId: string
): Promise<void> {
  await db.query(
    'DELETE FROM player_npcs WHERE npc_template_id = $1',
    [templateId]
  );
}

/**
 * Check if player NPC exists
 */
export async function exists(
  db: DBConnection,
  playerId: string,
  templateId: string
): Promise<boolean> {
  const result = await db.query(
    'SELECT id FROM player_npcs WHERE player_id = $1 AND npc_template_id = $2',
    [playerId, templateId]
  );

  return result.rows.length > 0;
}

/**
 * Check if player NPC exists by ID
 */
export async function existsById(
  db: DBConnection,
  id: string
): Promise<boolean> {
  const result = await db.query(
    'SELECT id FROM player_npcs WHERE id = $1',
    [id]
  );

  return result.rows.length > 0;
}
