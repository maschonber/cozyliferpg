/**
 * Game Models
 * Re-exports shared types and defines frontend-specific types
 */

// Re-export shared types
export type {
  NPC,
  NPCAppearance,
  Relationship,
  RelationshipState,
  EmotionalState,
  Interaction,
  Activity,
  PerformActivityRequest,
  PerformActivityResponse,
  ImageGenerationRequest,
  ImageGenerationResponse
} from '../../../../../shared/types';

/**
 * View Model for NPC with relationship data
 * Used in UI components
 */
export interface NPCWithRelationship {
  npc: import('../../../../../shared/types').NPC;
  relationship?: import('../../../../../shared/types').Relationship;
  imageUrl?: string;
  emotionalState?: import('../../../../../shared/types').EmotionalState;
}

/**
 * UI state for loading and errors
 */
export interface UIState {
  loading: boolean;
  error: string | null;
}
