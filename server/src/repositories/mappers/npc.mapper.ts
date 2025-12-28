/**
 * NPC Mapper
 * Pure functions for converting database rows to NPC domain objects
 */

import { NPC, NEUTRAL_EMOTION_VECTOR, EmotionVector, NPCTrait } from '../../../../shared/types';
import { interpretEmotionVectorSlim } from '../../services/plutchik-emotion';

/**
 * Database row structure for NPC
 */
export interface NPCRow {
  id: string;
  name: string;
  gender: string;
  traits: string[];
  revealed_traits: string[] | null;
  emotion_vector: string | EmotionVector | null;
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
  style: string;
  body_details: string[];
  loras: string[];
  current_location: string;
  created_at: Date;
}

export interface MapNPCOptions {
  /** If true, shows all traits. If false, only shows revealed traits. */
  showAllTraits?: boolean;
}

/**
 * Map database row to NPC domain object
 *
 * @param row - Database row from npcs table
 * @param options - Mapping options (showAllTraits for debug/admin)
 * @returns NPC domain object
 */
export function mapRowToNPC(row: NPCRow, options: MapNPCOptions = {}): NPC {
  const { showAllTraits = false } = options;

  // Parse emotion vector (handles both string and object formats)
  const emotionVector: EmotionVector = typeof row.emotion_vector === 'string'
    ? JSON.parse(row.emotion_vector)
    : (row.emotion_vector || NEUTRAL_EMOTION_VECTOR);

  // Get emotion interpretation for display
  const emotionInterpretation = interpretEmotionVectorSlim(emotionVector);

  return {
    id: row.id,
    name: row.name,
    gender: row.gender as NPC['gender'],
    // Filter traits: only show revealed traits unless showAllTraits is true
    traits: (showAllTraits ? row.traits : (row.revealed_traits || [])) as NPCTrait[],
    revealedTraits: (row.revealed_traits || []) as NPCTrait[],
    emotionVector,
    emotionInterpretation,
    appearance: {
      hairColor: row.hair_color,
      hairStyle: row.hair_style,
      eyeColor: row.eye_color,
      faceDetails: row.face_details,
      bodyType: row.body_type,
      torsoSize: row.torso_size,
      height: row.height,
      skinTone: row.skin_tone,
      upperTrace: row.upper_trace,
      lowerTrace: row.lower_trace,
      style: row.style,
      bodyDetails: row.body_details
    },
    loras: row.loras,
    currentLocation: row.current_location as NPC['currentLocation'],
    createdAt: row.created_at.toISOString()
  };
}
