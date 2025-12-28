/**
 * NPC Repository
 * Data access layer for NPCs
 */

import { Pool, PoolClient } from 'pg';
import { randomUUID } from 'crypto';
import { NPC, EmotionVector, NPCTrait } from '../../../shared/types';
import { mapRowToNPC, MapNPCOptions } from './mappers/npc.mapper';

type DBConnection = Pool | PoolClient;

/**
 * Get NPC by ID
 */
export async function getById(
  db: DBConnection,
  id: string,
  options: MapNPCOptions = {}
): Promise<NPC | null> {
  const result = await db.query(
    'SELECT * FROM npcs WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToNPC(result.rows[0], options);
}

/**
 * Get all NPCs
 */
export async function getAll(
  db: DBConnection,
  options: MapNPCOptions = {}
): Promise<NPC[]> {
  const result = await db.query(
    'SELECT * FROM npcs ORDER BY created_at DESC'
  );

  return result.rows.map(row => mapRowToNPC(row, options));
}

/**
 * Get NPCs by location
 */
export async function getByLocation(
  db: DBConnection,
  locationId: string,
  options: MapNPCOptions = {}
): Promise<NPC[]> {
  const result = await db.query(
    'SELECT * FROM npcs WHERE current_location = $1 ORDER BY created_at DESC',
    [locationId]
  );

  return result.rows.map(row => mapRowToNPC(row, options));
}

/**
 * Get count of NPCs by location
 */
export async function getCountByLocation(
  db: DBConnection,
  locationId: string
): Promise<number> {
  const result = await db.query(
    'SELECT COUNT(*) as count FROM npcs WHERE current_location = $1',
    [locationId]
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Data for creating a new NPC
 */
export interface CreateNPCData {
  name: string;
  gender: NPC['gender'];
  traits: NPCTrait[];
  revealedTraits: NPCTrait[];
  emotionVector: EmotionVector;
  appearance: NPC['appearance'];
  loras: string[];
  currentLocation: NPC['currentLocation'];
}

/**
 * Create a new NPC
 */
export async function create(
  db: DBConnection,
  data: CreateNPCData
): Promise<NPC> {
  const id = randomUUID();
  const createdAt = new Date();

  const result = await db.query(
    `
    INSERT INTO npcs (
      id, name, traits, gender,
      hair_color, hair_style, eye_color, face_details,
      body_type, torso_size, height, skin_tone,
      upper_trace, lower_trace, style, body_details,
      loras, current_location, revealed_traits, emotion_vector, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    RETURNING *
    `,
    [
      id,
      data.name,
      data.traits,
      data.gender,
      data.appearance.hairColor,
      data.appearance.hairStyle,
      data.appearance.eyeColor,
      data.appearance.faceDetails,
      data.appearance.bodyType,
      data.appearance.torsoSize,
      data.appearance.height,
      data.appearance.skinTone,
      data.appearance.upperTrace,
      data.appearance.lowerTrace,
      data.appearance.style,
      data.appearance.bodyDetails,
      data.loras,
      data.currentLocation,
      data.revealedTraits,
      JSON.stringify(data.emotionVector),
      createdAt
    ]
  );

  return mapRowToNPC(result.rows[0], { showAllTraits: true });
}

/**
 * Delete NPC by ID
 */
export async function deleteById(
  db: DBConnection,
  id: string
): Promise<boolean> {
  const result = await db.query(
    'DELETE FROM npcs WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rows.length > 0;
}

/**
 * Delete all NPCs
 */
export async function deleteAll(
  db: DBConnection
): Promise<void> {
  await db.query('DELETE FROM npcs');
}

/**
 * Update NPC emotion vector
 */
export async function updateEmotionVector(
  db: DBConnection,
  id: string,
  emotionVector: EmotionVector
): Promise<void> {
  await db.query(
    'UPDATE npcs SET emotion_vector = $1 WHERE id = $2',
    [JSON.stringify(emotionVector), id]
  );
}

/**
 * Append a trait to NPC's revealed traits
 */
export async function appendRevealedTrait(
  db: DBConnection,
  id: string,
  trait: NPCTrait
): Promise<void> {
  await db.query(
    'UPDATE npcs SET revealed_traits = array_append(revealed_traits, $1) WHERE id = $2',
    [trait, id]
  );
}

/**
 * Update NPC location
 */
export async function updateLocation(
  db: DBConnection,
  id: string,
  locationId: string
): Promise<void> {
  await db.query(
    'UPDATE npcs SET current_location = $1 WHERE id = $2',
    [locationId, id]
  );
}

/**
 * Check if NPC exists
 */
export async function exists(
  db: DBConnection,
  id: string
): Promise<boolean> {
  const result = await db.query(
    'SELECT id FROM npcs WHERE id = $1',
    [id]
  );

  return result.rows.length > 0;
}

/**
 * Get NPC gender by ID (lightweight query for desire cap calculation)
 */
export async function getGender(
  db: DBConnection,
  id: string
): Promise<NPC['gender'] | null> {
  const result = await db.query(
    'SELECT gender FROM npcs WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].gender;
}
