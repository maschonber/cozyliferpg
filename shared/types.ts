/**
 * Shared TypeScript types for CozyLife RPG
 * Used by both frontend (Angular) and backend (Node.js)
 */

export interface GameFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'healthy';
  timestamp: string;
  version: string;
}

export interface GameItem {
  id: string;
  name: string;
  icon: string;
  category: 'furniture' | 'crop' | 'tool' | 'fish';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
}

export interface Player {
  id: string;
  username: string;
  level: number;
  gold: number;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

// ===== CozyLife RPG - Game Data Types =====

/**
 * NPC Appearance for AI image generation and visualization API
 */
export interface NPCAppearance {
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  faceDetails: string[];
  bodyType: string;
  torsoSize: string;
  height: string;
  skinTone: string;
  upperTrace: string;
  lowerTrace: string;
  style?: string;
  bodyDetails: string[];
}

/**
 * Gender type
 */
export type Gender = 'female' | 'male' | 'other';

/**
 * NPC (Non-Player Character)
 */
export interface NPC {
  id: string;
  name: string;
  archetype: string;  // Artist, Athlete, Bookworm, Musician, Scientist
  traits: string[];   // Array of personality traits
  gender: Gender;

  // Appearance (for AI image generation)
  appearance: NPCAppearance;

  // LoRAs for AI model
  loras: string[];

  createdAt: string;
}

/**
 * Relationship state based on friendship/romance values
 */
export type RelationshipState =
  // Combined states (both dimensions matter)
  | 'close_romantic_partner'
  | 'romantic_partner'
  | 'bitter_ex'
  | 'complicated'
  | 'rival'
  | 'unrequited'
  // Friendship-based states
  | 'enemy'
  | 'dislike'
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  // Romance-based states
  | 'repulsed'
  | 'uncomfortable'
  | 'attracted'
  | 'romantic_interest'
  | 'in_love';

/**
 * Emotional state for image generation
 */
export type EmotionalState = 'neutral' | 'happy' | 'sad' | 'flirty' | 'angry';

/**
 * Interaction record in relationship history
 */
export interface Interaction {
  id: string;
  relationshipId: string;
  activityType: string;
  friendshipDelta: number;
  romanceDelta: number;
  emotionalState?: EmotionalState;
  notes?: string;
  createdAt: string;
}

/**
 * Relationship between player and NPC
 */
export interface Relationship {
  id: string;
  playerId: string;
  npcId: string;

  // Multi-dimensional values (-100 to +100)
  friendship: number;
  romance: number;

  // State tracking
  currentState: RelationshipState;
  unlockedStates: string[];

  // Timestamps
  firstMet: string;
  lastInteraction: string;

  // Populated data (not in DB, joined on fetch)
  npc?: NPC;
  interactions?: Interaction[];
}

/**
 * Activity that player can perform with an NPC
 */
export interface Activity {
  id: string;
  name: string;
  description: string;
  effects: {
    friendship?: number;
    romance?: number;
  };
}

/**
 * Request to perform an activity with an NPC
 */
export interface PerformActivityRequest {
  activityId: string;
}

/**
 * Response after performing an activity
 */
export interface PerformActivityResponse {
  success: boolean;
  relationship?: Relationship;
  interaction?: Interaction;
  stateChanged?: boolean;
  previousState?: RelationshipState;
  newState?: RelationshipState;
  emotionalState?: EmotionalState;
  error?: string;
}

/**
 * Image generation request for AI service
 */
export interface ImageGenerationRequest {
  characterId: string;
  emotionalState: EmotionalState;
  location?: string;
  clothing?: string;
  context?: string;
}

/**
 * Image generation response
 */
export interface ImageGenerationResponse {
  imageUrl: string;
  cached: boolean;
  generationTime?: number;
}
