/**
 * NPC Template Repository
 * Data access layer for NPC templates (static, shareable NPC data)
 */

import { Pool, PoolClient } from 'pg';
import { randomUUID } from 'crypto';
import { NPCTemplate, NPCTrait, NPCAppearance, Gender } from '../../../shared/types';
import { mapRowToNPCTemplate } from './mappers/npc-template.mapper';

type DBConnection = Pool | PoolClient;

/**
 * Get NPC template by ID
 */
export async function getById(
  db: DBConnection,
  id: string
): Promise<NPCTemplate | null> {
  const result = await db.query(
    'SELECT * FROM npc_templates WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToNPCTemplate(result.rows[0]);
}

/**
 * Get all NPC templates
 */
export async function getAll(db: DBConnection): Promise<NPCTemplate[]> {
  const result = await db.query(
    'SELECT * FROM npc_templates ORDER BY created_at DESC'
  );

  return result.rows.map(row => mapRowToNPCTemplate(row));
}

/**
 * Data for creating a new NPC template
 */
export interface CreateNPCTemplateData {
  name: string;
  gender: Gender;
  traits: NPCTrait[];
  appearance: NPCAppearance;
  loras: string[];
}

/**
 * Create a new NPC template
 */
export async function create(
  db: DBConnection,
  data: CreateNPCTemplateData
): Promise<NPCTemplate> {
  const id = randomUUID();
  const createdAt = new Date();

  const result = await db.query(
    `
    INSERT INTO npc_templates (
      id, name, gender, traits,
      hair_color, hair_style, eye_color, face_details,
      body_type, torso_size, height, skin_tone,
      upper_trace, lower_trace, style, body_details,
      loras, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *
    `,
    [
      id,
      data.name,
      data.gender,
      data.traits,
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
      data.appearance.style || null,
      data.appearance.bodyDetails,
      data.loras,
      createdAt
    ]
  );

  return mapRowToNPCTemplate(result.rows[0]);
}

/**
 * Delete NPC template by ID
 */
export async function deleteById(
  db: DBConnection,
  id: string
): Promise<boolean> {
  const result = await db.query(
    'DELETE FROM npc_templates WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rows.length > 0;
}

/**
 * Check if NPC template exists
 */
export async function exists(
  db: DBConnection,
  id: string
): Promise<boolean> {
  const result = await db.query(
    'SELECT id FROM npc_templates WHERE id = $1',
    [id]
  );

  return result.rows.length > 0;
}

/**
 * Get NPC template gender by ID (lightweight query for desire cap calculation)
 */
export async function getGender(
  db: DBConnection,
  id: string
): Promise<Gender | null> {
  const result = await db.query(
    'SELECT gender FROM npc_templates WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].gender as Gender;
}
