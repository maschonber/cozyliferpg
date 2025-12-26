/**
 * Relationship Service Configuration
 *
 * Constants and configuration for relationship system logic.
 * Design: Configuration-driven to enable easy tuning and extension.
 */

import { RelationshipState } from '../../../../shared/types';

/**
 * Relationship state thresholds
 *
 * Used by calculateRelationshipState() to determine state from axis values.
 * Organized by state category for clarity.
 */
export const RELATIONSHIP_THRESHOLDS = {
  // Positive combined states
  partner: {
    trust: 60,
    affection: 60,
    desire: 50
  },
  lover: {
    trust: 60, // Must be BELOW this
    affection: 40,
    desire: 60
  },
  close_friend: {
    trust: 40,
    affection: 60,
    desire: 30 // Must be BELOW this
  },
  friend: {
    trust: 20,
    affection: 30
  },
  crush: {
    affection: 30, // Must be BELOW this
    desire: 40
  },

  // Negative states
  enemy: {
    trust: -50,
    affection: -50
  },
  rival: {
    trust: -30,
    affection: -30
  },

  // Mixed/complex states
  complicated: {
    positiveThreshold: 20,
    negativeThreshold: -20
  },

  // Neutral states
  acquaintance: {
    positive: 10,
    negative: -10
  }
} as const;

/**
 * Relationship state descriptions for UI display
 */
export const STATE_DESCRIPTIONS: Record<RelationshipState, string> = {
  // Positive combined states
  partner: 'Deeply committed romantic partner with trust and love',
  lover: 'Passionate romantic connection, still building trust',
  close_friend: 'Best friends with deep trust and affection',
  friend: 'Good friends who enjoy spending time together',
  crush: 'Strong attraction, but not yet emotionally connected',
  acquaintance: 'Friendly but still getting to know each other',
  stranger: 'Just met, neutral feelings',

  // Mixed states
  complicated: 'Mixed feelings, complex relationship dynamics',

  // Negative states
  rival: 'Tension and animosity, on bad terms',
  enemy: 'Strong mutual dislike, actively hostile'
};
