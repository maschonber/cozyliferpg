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
