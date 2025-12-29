/**
 * Player NPC Mapper
 * Pure functions for converting database rows to PlayerNPCView domain objects
 */

import {
  PlayerNPCView,
  EmotionVector,
  NEUTRAL_EMOTION_VECTOR,
  NPCTrait,
  Gender,
  RelationshipState,
  LocationId
} from '../../../../shared/types';
import { interpretEmotionVectorSlim } from '../../services/plutchik-emotion';

/**
 * Database row structure for Player NPC (joined with npc_templates)
 */
export interface PlayerNPCRow {
  // player_npcs columns
  id: string;
  player_id: string;
  npc_template_id: string;
  trust: number;
  affection: number;
  desire: number;
  current_state: string;
  emotion_vector: string | EmotionVector | null;
  revealed_traits: string[] | null;
  current_location: string;
  first_met: number;
  last_interaction: number;

  // npc_templates columns (from JOIN)
  template_name: string;
  template_gender: string;
  template_traits: string[];
  template_hair_color: string;
  template_hair_style: string;
  template_eye_color: string;
  template_face_details: string[];
  template_body_type: string;
  template_torso_size: string;
  template_height: string;
  template_skin_tone: string;
  template_upper_trace: string;
  template_lower_trace: string;
  template_style: string | null;
  template_body_details: string[];
  template_loras: string[];
}

/**
 * Map database row (joined with template) to PlayerNPCView domain object
 */
export function mapRowToPlayerNPCView(row: PlayerNPCRow): PlayerNPCView {
  // Parse emotion vector (handles both string and object formats)
  const emotionVector: EmotionVector = typeof row.emotion_vector === 'string'
    ? JSON.parse(row.emotion_vector)
    : (row.emotion_vector || NEUTRAL_EMOTION_VECTOR);

  // Get emotion interpretation for display
  const emotionInterpretation = interpretEmotionVectorSlim(emotionVector);

  return {
    id: row.id,
    templateId: row.npc_template_id,

    // From template
    name: row.template_name,
    gender: row.template_gender as Gender,
    appearance: {
      hairColor: row.template_hair_color,
      hairStyle: row.template_hair_style,
      eyeColor: row.template_eye_color,
      faceDetails: row.template_face_details || [],
      bodyType: row.template_body_type,
      torsoSize: row.template_torso_size,
      height: row.template_height,
      skinTone: row.template_skin_tone,
      upperTrace: row.template_upper_trace,
      lowerTrace: row.template_lower_trace,
      style: row.template_style || undefined,
      bodyDetails: row.template_body_details || []
    },

    // Player-specific mutable data
    revealedTraits: (row.revealed_traits || []) as NPCTrait[],
    emotionVector,
    emotionInterpretation,
    currentLocation: row.current_location as LocationId,

    // Relationship axes
    trust: row.trust ?? 0,
    affection: row.affection ?? 0,
    desire: row.desire ?? 0,
    currentState: row.current_state as RelationshipState
  };
}
