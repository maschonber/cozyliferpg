/**
 * Trait System Configuration
 *
 * Simplified trait system using activity tags for affinity matching.
 * Traits are quirks that provide bonuses/penalties to activities with matching tags.
 */

import { NPCTrait } from '../../../../shared/types';

import { ActivityTag } from '../../../../shared/types/activity.types';

// ===== Affinity Constants =====

/**
 * Standard affinity values for trait-tag matching
 */
export const AFFINITY = {
  STRONG_LIKE: 15,
  LIKE: 10,
  SLIGHT_LIKE: 5,
  SLIGHT_DISLIKE: -5,
  DISLIKE: -10,
  MAX: 20,
  MIN: -20,
} as const;

// ===== Trait Metadata =====

/**
 * Metadata for a single trait
 */
export interface TraitDefinition {
  trait: NPCTrait;
  name: string;
  description: string;
  gameplayEffects: string[];
}

/**
 * All trait definitions with metadata
 */
export const TRAIT_DEFINITIONS: Record<NPCTrait, TraitDefinition> = {
  // Interest-based traits
  coffee_lover: {
    trait: 'coffee_lover',
    name: 'Coffee Lover',
    description: 'Passionate about coffee culture',
    gameplayEffects: ['Large bonus to coffee-related activities'],
  },
  athletic: {
    trait: 'athletic',
    name: 'Athletic',
    description: 'Dedicated to physical fitness and activity',
    gameplayEffects: ['Large bonus to physical activities'],
  },
  bookworm: {
    trait: 'bookworm',
    name: 'Bookworm',
    description: 'Loves reading and intellectual pursuits',
    gameplayEffects: [
      'Large bonus to intellectual activities',
      'Bonus to calm activities',
    ],
  },
  foodie: {
    trait: 'foodie',
    name: 'Foodie',
    description: 'Passionate about food and culinary experiences',
    gameplayEffects: [
      'Large bonus to food-related activities',
      'Bonus to romantic dining',
    ],
  },
  gamer: {
    trait: 'gamer',
    name: 'Gamer',
    description: 'Enthusiastic about video games and gaming culture',
    gameplayEffects: [
      'Large bonus to gaming activities',
      'Bonus to competitive activities',
    ],
  },
  nature_lover: {
    trait: 'nature_lover',
    name: 'Nature Lover',
    description: 'Finds peace and joy in natural settings',
    gameplayEffects: ['Large bonus to outdoor activities'],
  },
  creative_soul: {
    trait: 'creative_soul',
    name: 'Creative Soul',
    description: 'Drawn to artistic and creative expression',
    gameplayEffects: ['Large bonus to creative activities'],
  },

  // Personality-based traits
  competitive: {
    trait: 'competitive',
    name: 'Competitive',
    description: 'Driven to win and prove themselves',
    gameplayEffects: ['Large bonus to competitive activities'],
  },
  romantic: {
    trait: 'romantic',
    name: 'Romantic',
    description: 'Values romance and emotional connection',
    gameplayEffects: ['Large bonus to romantic activities'],
  },
  intellectual: {
    trait: 'intellectual',
    name: 'Intellectual',
    description: 'Attracted to mental stimulation and deep conversation',
    gameplayEffects: ['Large bonus to intellectual activities'],
  },
  adventurous: {
    trait: 'adventurous',
    name: 'Adventurous',
    description: 'Seeks excitement and new experiences',
    gameplayEffects: [
      'Bonus to outdoor activities',
      'Bonus to physical activities',
      'Penalty to calm activities',
    ],
  },
  introverted: {
    trait: 'introverted',
    name: 'Introverted',
    description: 'Prefers quieter, more intimate interactions',
    gameplayEffects: [
      'Bonus to calm activities',
      'Penalty to competitive activities',
    ],
  },
};

// ===== Trait-Tag Affinity Matrix =====

/**
 * Maps traits to activity tags with affinity values
 * Positive = bonus (easier/better), Negative = penalty (harder/worse)
 * Total bonus is capped at AFFINITY.MIN to AFFINITY.MAX
 */
export const TRAIT_TAG_AFFINITY: Record<NPCTrait, Partial<Record<ActivityTag, number>>> = {
  // Interest-based traits
  coffee_lover: {
    coffee: AFFINITY.STRONG_LIKE,
  },
  athletic: {
    physical: AFFINITY.STRONG_LIKE,
  },
  bookworm: {
    intellectual: AFFINITY.STRONG_LIKE,
    calm: AFFINITY.LIKE,
  },
  foodie: {
    food: AFFINITY.STRONG_LIKE,
    romantic: AFFINITY.LIKE,
  },
  gamer: {
    gaming: AFFINITY.STRONG_LIKE,
    competitive: AFFINITY.LIKE,
  },
  nature_lover: {
    outdoor: AFFINITY.STRONG_LIKE,
  },
  creative_soul: {
    creative: AFFINITY.STRONG_LIKE,
  },

  // Personality-based traits
  competitive: {
    competitive: AFFINITY.STRONG_LIKE,
  },
  romantic: {
    romantic: AFFINITY.STRONG_LIKE,
  },
  intellectual: {
    intellectual: AFFINITY.STRONG_LIKE,
  },
  adventurous: {
    outdoor: AFFINITY.LIKE,
    physical: AFFINITY.SLIGHT_LIKE,
    calm: AFFINITY.SLIGHT_DISLIKE,
  },
  introverted: {
    calm: AFFINITY.LIKE,
    competitive: AFFINITY.SLIGHT_DISLIKE,
  },
};

/**
 * All available traits as an array
 */
export const ALL_TRAITS: NPCTrait[] = [
  'coffee_lover',
  'athletic',
  'bookworm',
  'foodie',
  'gamer',
  'nature_lover',
  'creative_soul',
  'competitive',
  'romantic',
  'intellectual',
  'adventurous',
  'introverted',
];

// ===== Trait Conflicts =====

/**
 * Traits that cannot exist together on the same NPC
 */
export const CONFLICTING_TRAITS: Record<NPCTrait, NPCTrait[]> = {
  // Adventurous and introverted are opposites
  adventurous: ['introverted'],
  introverted: ['adventurous'],

  // All other traits can coexist
  coffee_lover: [],
  athletic: [],
  bookworm: [],
  foodie: [],
  gamer: [],
  nature_lover: [],
  creative_soul: [],
  competitive: [],
  romantic: [],
  intellectual: [],
};
