/**
 * NPC Template Mapper
 * Pure functions for converting database rows to NPCTemplate domain objects
 */

import { NPCTemplate, NPCTrait, Gender } from '../../../../shared/types';

/**
 * Database row structure for NPC Template
 */
export interface NPCTemplateRow {
  id: string;
  name: string;
  gender: string;
  traits: string[];
  hair_color: string;
  hair_style: string;
  eye_color: string;
  face_details: string[];
  body_type: string;
  torso_size: string;
  height: string;
  skin_tone: string;
  upper_trace: string;
  lower_trace: string;
  style: string | null;
  body_details: string[];
  loras: string[];
  created_at: Date;
}

/**
 * Map database row to NPCTemplate domain object
 */
export function mapRowToNPCTemplate(row: NPCTemplateRow): NPCTemplate {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender as Gender,
    appearance: {
      hairColor: row.hair_color,
      hairStyle: row.hair_style,
      eyeColor: row.eye_color,
      faceDetails: row.face_details || [],
      bodyType: row.body_type,
      torsoSize: row.torso_size,
      height: row.height,
      skinTone: row.skin_tone,
      upperTrace: row.upper_trace,
      lowerTrace: row.lower_trace,
      style: row.style || undefined,
      bodyDetails: row.body_details || []
    },
    loras: row.loras || [],
    traits: (row.traits || []) as NPCTrait[],
    createdAt: row.created_at.toISOString()
  };
}
