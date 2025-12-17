/**
 * Trait System Configuration
 *
 * This file contains all configuration data for the trait system:
 * - Trait metadata and descriptions
 * - Trait-activity affinity bonuses/penalties
 * - NPC archetype-activity affinity
 * - Player archetype-NPC archetype affinity
 * - Trait-based emotion modifiers (exported from emotion service)
 *
 * Design: Data-driven configuration allows easy tweaking without code changes
 */

import {
  NPCTrait,
  PersonalityTrait,
  RomanceTrait,
  InterestTrait,
  NPCArchetype,
  PlayerArchetype,
  ActivityCategory,
  EmotionType,
} from '../../../../shared/types';

// ===== Trait Metadata =====

/**
 * Trait category for classification
 */
export type TraitCategory = 'personality' | 'romance' | 'interest';

/**
 * Metadata for a single trait
 */
export interface TraitDefinition {
  trait: NPCTrait;
  category: TraitCategory;
  name: string;
  description: string;
  gameplayEffects: string[];
}

/**
 * All trait definitions with metadata
 * Used for documentation, UI display, and validation
 */
export const TRAIT_DEFINITIONS: Record<NPCTrait, TraitDefinition> = {
  // ===== Personality Traits =====

  // Social energy
  outgoing: {
    trait: 'outgoing',
    category: 'personality',
    name: 'Outgoing',
    description: 'Energized by social interaction and group activities',
    gameplayEffects: [
      'Bonus to social activities',
      'Higher baseline joy and excitement',
      'Lower baseline anxiety',
    ],
  },
  reserved: {
    trait: 'reserved',
    category: 'personality',
    name: 'Reserved',
    description: 'Prefers quieter, more intimate interactions',
    gameplayEffects: [
      'Bonus to calm activities',
      'Penalty to large group activities',
      'Higher baseline calm and anxiety',
    ],
  },

  // Thinking style
  logical: {
    trait: 'logical',
    category: 'personality',
    name: 'Logical',
    description: 'Values reason, structure, and analytical thinking',
    gameplayEffects: [
      'Bonus to intellectual activities',
      'Bonus to study and work activities',
    ],
  },
  creative: {
    trait: 'creative',
    category: 'personality',
    name: 'Creative',
    description: 'Imaginative and artistic in approach to life',
    gameplayEffects: [
      'Bonus to creative and artistic activities',
      'Bonus to activities involving art or music',
    ],
  },
  intuitive: {
    trait: 'intuitive',
    category: 'personality',
    name: 'Intuitive',
    description: 'Follows gut feelings and reads between the lines',
    gameplayEffects: [
      'Bonus to deep conversations',
      'Better at revealing personality traits',
    ],
  },

  // Risk attitude
  adventurous: {
    trait: 'adventurous',
    category: 'personality',
    name: 'Adventurous',
    description: 'Seeks excitement and new experiences',
    gameplayEffects: [
      'Bonus to active and outdoor activities',
      'Higher baseline excitement',
      'Lower baseline anxiety',
    ],
  },
  cautious: {
    trait: 'cautious',
    category: 'personality',
    name: 'Cautious',
    description: 'Prefers safety and careful planning',
    gameplayEffects: [
      'Penalty to risky activities',
      'Bonus to calm, structured activities',
      'Higher baseline anxiety',
    ],
  },
  spontaneous: {
    trait: 'spontaneous',
    category: 'personality',
    name: 'Spontaneous',
    description: 'Acts on impulse and embraces unpredictability',
    gameplayEffects: [
      'Bonus to unplanned activities',
      'Higher baseline excitement',
      'Lower baseline calm',
    ],
  },

  // Emotional style
  optimistic: {
    trait: 'optimistic',
    category: 'personality',
    name: 'Optimistic',
    description: 'Sees the bright side and maintains positive outlook',
    gameplayEffects: [
      'Higher baseline joy',
      'Lower baseline sadness',
      'Recovers from negative emotions faster',
    ],
  },
  melancholic: {
    trait: 'melancholic',
    category: 'personality',
    name: 'Melancholic',
    description: 'Reflective and prone to introspection',
    gameplayEffects: [
      'Higher baseline sadness',
      'Lower baseline joy',
      'Bonus to deep, meaningful activities',
    ],
  },
  passionate: {
    trait: 'passionate',
    category: 'personality',
    name: 'Passionate',
    description: 'Feels emotions intensely and expressively',
    gameplayEffects: [
      'Higher baseline excitement and romantic emotion',
      'Stronger emotional reactions',
      'Faster emotion changes',
    ],
  },
  stoic: {
    trait: 'stoic',
    category: 'personality',
    name: 'Stoic',
    description: 'Even-tempered and emotionally composed',
    gameplayEffects: [
      'Higher baseline calm',
      'Lower baseline anger and excitement',
      'Slower emotion changes',
    ],
  },

  // Interpersonal
  empathetic: {
    trait: 'empathetic',
    category: 'personality',
    name: 'Empathetic',
    description: 'Deeply attuned to others\' feelings',
    gameplayEffects: [
      'Higher baseline affection',
      'Bonus to emotional and supportive activities',
    ],
  },
  independent: {
    trait: 'independent',
    category: 'personality',
    name: 'Independent',
    description: 'Self-reliant and values autonomy',
    gameplayEffects: [
      'Slower trust building',
      'Requires more space in relationships',
    ],
  },
  nurturing: {
    trait: 'nurturing',
    category: 'personality',
    name: 'Nurturing',
    description: 'Caring and supportive toward others',
    gameplayEffects: [
      'Higher baseline affection and calm',
      'Bonus to caring and supportive activities',
    ],
  },
  competitive: {
    trait: 'competitive',
    category: 'personality',
    name: 'Competitive',
    description: 'Driven to win and prove themselves',
    gameplayEffects: [
      'Bonus to competitive activities',
      'Enjoys challenges and games',
    ],
  },

  // ===== Romance Traits =====

  flirtatious: {
    trait: 'flirtatious',
    category: 'romance',
    name: 'Flirtatious',
    description: 'Playful and comfortable with romantic attention',
    gameplayEffects: [
      'Higher baseline romantic emotion and excitement',
      'Bonus to flirting activities',
      'Faster desire building',
    ],
  },
  romantic: {
    trait: 'romantic',
    category: 'romance',
    name: 'Romantic',
    description: 'Values traditional romance and emotional connection',
    gameplayEffects: [
      'Higher baseline romantic emotion and affection',
      'Bonus to romantic activities',
      'Slower romantic emotion decay',
    ],
  },
  physical: {
    trait: 'physical',
    category: 'romance',
    name: 'Physical',
    description: 'Values physical closeness and touch',
    gameplayEffects: [
      'Bonus to physical activities',
      'Faster desire building',
    ],
  },
  intellectual: {
    trait: 'intellectual',
    category: 'romance',
    name: 'Intellectual',
    description: 'Attracted to mental stimulation and deep conversation',
    gameplayEffects: [
      'Bonus to intellectual activities',
      'Deep conversations build desire',
    ],
  },
  slow_burn: {
    trait: 'slow_burn',
    category: 'romance',
    name: 'Slow Burn',
    description: 'Takes time to develop romantic feelings',
    gameplayEffects: [
      'Lower baseline romantic emotion',
      'Slower desire building',
      'Higher baseline calm',
    ],
  },
  intense: {
    trait: 'intense',
    category: 'romance',
    name: 'Intense',
    description: 'Falls hard and fast with strong emotions',
    gameplayEffects: [
      'Higher baseline romantic emotion and excitement',
      'Faster desire building',
      'Stronger emotional reactions',
    ],
  },
  commitment_seeking: {
    trait: 'commitment_seeking',
    category: 'romance',
    name: 'Commitment-Seeking',
    description: 'Looking for a serious, long-term relationship',
    gameplayEffects: [
      'Trust building is very important',
      'Bonus when relationship state advances',
    ],
  },
  free_spirit: {
    trait: 'free_spirit',
    category: 'romance',
    name: 'Free Spirit',
    description: 'Values freedom and spontaneity in relationships',
    gameplayEffects: [
      'Desire can build without trust',
      'Penalty to commitment-focused activities',
    ],
  },

  // ===== Interest Traits =====

  coffee_lover: {
    trait: 'coffee_lover',
    category: 'interest',
    name: 'Coffee Lover',
    description: 'Passionate about coffee culture',
    gameplayEffects: [
      'Large bonus to coffee-related activities',
    ],
  },
  fitness_enthusiast: {
    trait: 'fitness_enthusiast',
    category: 'interest',
    name: 'Fitness Enthusiast',
    description: 'Dedicated to health and physical fitness',
    gameplayEffects: [
      'Large bonus to exercise and sports activities',
    ],
  },
  music_fan: {
    trait: 'music_fan',
    category: 'interest',
    name: 'Music Fan',
    description: 'Loves music and live performances',
    gameplayEffects: [
      'Bonus to music-related activities',
    ],
  },
  art_appreciator: {
    trait: 'art_appreciator',
    category: 'interest',
    name: 'Art Appreciator',
    description: 'Enjoys visual arts and creative expression',
    gameplayEffects: [
      'Bonus to art and creative activities',
    ],
  },
  foodie: {
    trait: 'foodie',
    category: 'interest',
    name: 'Foodie',
    description: 'Passionate about food and culinary experiences',
    gameplayEffects: [
      'Large bonus to food-related activities',
    ],
  },
  reader: {
    trait: 'reader',
    category: 'interest',
    name: 'Reader',
    description: 'Loves books and reading',
    gameplayEffects: [
      'Large bonus to reading and library activities',
    ],
  },
  gamer: {
    trait: 'gamer',
    category: 'interest',
    name: 'Gamer',
    description: 'Enthusiastic about video games and gaming culture',
    gameplayEffects: [
      'Large bonus to gaming activities',
    ],
  },
  nature_lover: {
    trait: 'nature_lover',
    category: 'interest',
    name: 'Nature Lover',
    description: 'Finds peace and joy in natural settings',
    gameplayEffects: [
      'Large bonus to outdoor activities',
    ],
  },
};

// ===== Trait-Activity Affinity Matrix =====

/**
 * Bonuses/penalties for trait-activity combinations
 * Positive values = easier/better outcomes
 * Negative values = harder/worse outcomes
 *
 * Range: -15 to +20
 * - Strong match (interest trait + relevant activity): +15 to +20
 * - Good match (personality/romance trait alignment): +8 to +12
 * - Slight match: +3 to +5
 * - Slight mismatch: -3 to -5
 * - Strong mismatch: -8 to -12
 */
export const TRAIT_ACTIVITY_AFFINITY: Partial<Record<NPCTrait, Partial<Record<string, number>>>> = {
  // ===== Personality Trait Affinities =====

  outgoing: {
    // Enjoys social group activities
    have_coffee: 5,
    quick_chat: 5,
    casual_date: 8,
    play_pool_darts: 10,
    beach_picnic: 8,
    boardwalk_stroll: 5,
    // Dislikes quiet solo-feeling activities
    deep_conversation: -3,
    read_book: -5,
    meditation: -5,
  },

  reserved: {
    // Prefers intimate, quiet activities
    deep_conversation: 10,
    read_book: 8,
    have_coffee: 5,
    meditation: 8,
    quick_chat: 3,
    // Dislikes loud, crowded activities
    casual_date: -5,
    play_pool_darts: -8,
    beach_picnic: -3,
  },

  logical: {
    // Enjoys intellectual activities
    deep_conversation: 12,
    study_library: 10,
    read_book: 8,
    work_part_time: 5,
    work_full_day: 5,
    // Less interested in purely physical activities
    exercise_together: -3,
    flirt_playfully: -5,
  },

  creative: {
    // Loves creative and artistic activities
    creative_hobby: 15,
    cook_dinner: 12,
    sketching: 15,
    journaling: 10,
    listen_music: 8,
    // Less interested in routine work
    work_full_day: -5,
  },

  intuitive: {
    // Good at reading emotions and connecting
    deep_conversation: 10,
    have_coffee: 5,
    cook_dinner: 8,
  },

  adventurous: {
    // Loves active and exciting activities
    exercise_together: 12,
    beach_picnic: 10,
    swim_beach: 12,
    morning_jog: 10,
    casual_date: 8,
    boardwalk_stroll: 5,
    // Dislikes sedentary activities
    read_book: -5,
    watch_tv: -8,
    meditation: -5,
  },

  cautious: {
    // Prefers safe, structured activities
    have_coffee: 8,
    study_library: 8,
    read_book: 8,
    work_part_time: 5,
    meditation: 5,
    // Avoids risky or unpredictable activities
    casual_date: -5,
    flirt_playfully: -8,
    exercise_together: -3,
  },

  spontaneous: {
    // Enjoys unpredictable, fun activities
    casual_date: 10,
    flirt_playfully: 12,
    beach_picnic: 8,
    boardwalk_stroll: 8,
    play_pool_darts: 8,
    // Dislikes structured, routine activities
    work_full_day: -8,
    study_library: -5,
    meditation: -8,
  },

  optimistic: {
    // Generally positive about most activities
    have_coffee: 3,
    quick_chat: 3,
    beach_picnic: 5,
    exercise_together: 3,
  },

  melancholic: {
    // Prefers deep, meaningful activities
    deep_conversation: 12,
    read_book: 8,
    creative_hobby: 8,
    journaling: 10,
    // Less interested in superficial fun
    quick_chat: -5,
    play_pool_darts: -5,
  },

  passionate: {
    // Intense about everything
    flirt_playfully: 15,
    casual_date: 12,
    deep_conversation: 10,
    cook_dinner: 10,
    exercise_together: 8,
  },

  stoic: {
    // Prefers calm, controlled activities
    meditation: 12,
    yoga_practice: 10,
    study_library: 8,
    work_full_day: 5,
    // Less interested in emotional activities
    flirt_playfully: -8,
    deep_conversation: -5,
  },

  empathetic: {
    // Connects well in emotional contexts
    deep_conversation: 12,
    have_coffee: 8,
    cook_dinner: 10,
    quick_chat: 5,
  },

  independent: {
    // Prefers activities that maintain autonomy
    work_full_day: 5,
    study_library: 5,
    creative_hobby: 5,
    // Resists vulnerability
    deep_conversation: -5,
    cook_dinner: -3,
  },

  nurturing: {
    // Enjoys caring and supportive activities
    cook_dinner: 15,
    have_coffee: 8,
    deep_conversation: 10,
    beach_picnic: 8,
  },

  competitive: {
    // Loves games and challenges
    play_pool_darts: 15,
    exercise_together: 12,
    flirt_playfully: 8,
    work_full_day: 5,
    // Less interested in non-competitive activities
    meditation: -5,
    boardwalk_stroll: -3,
  },

  // ===== Romance Trait Affinities =====

  flirtatious: {
    flirt_playfully: 20,
    casual_date: 15,
    boardwalk_stroll: 10,
    beach_picnic: 12,
    cook_dinner: 10,
  },

  romantic: {
    casual_date: 15,
    cook_dinner: 15,
    boardwalk_stroll: 15,
    beach_picnic: 12,
    deep_conversation: 10,
    go_to_movies: 10,
  },

  physical: {
    exercise_together: 15,
    flirt_playfully: 12,
    casual_date: 10,
    beach_picnic: 10,
  },

  intellectual: {
    deep_conversation: 20,
    have_coffee: 12,
    study_library: 10,
    read_book: 8,
  },

  slow_burn: {
    have_coffee: 8,
    quick_chat: 8,
    deep_conversation: 10,
    // Uncomfortable with fast romance
    flirt_playfully: -10,
    casual_date: -5,
  },

  intense: {
    flirt_playfully: 15,
    casual_date: 15,
    deep_conversation: 15,
    cook_dinner: 12,
  },

  commitment_seeking: {
    deep_conversation: 12,
    cook_dinner: 12,
    have_coffee: 8,
    // Less interested in casual interactions
    flirt_playfully: -5,
    quick_chat: -3,
  },

  free_spirit: {
    casual_date: 10,
    beach_picnic: 12,
    boardwalk_stroll: 10,
    flirt_playfully: 8,
    // Avoids heavy commitment vibes
    deep_conversation: -5,
    cook_dinner: -3,
  },

  // ===== Interest Trait Affinities =====

  coffee_lover: {
    have_coffee: 20,
    work_barista: 15,
    quick_chat: 5, // Coffee shops are good for chats
  },

  fitness_enthusiast: {
    exercise_together: 20,
    work_out_gym: 15,
    yoga_practice: 15,
    morning_jog: 15,
    swim_beach: 15,
    stretching: 10,
  },

  music_fan: {
    listen_music: 20,
    casual_date: 8, // Often involves music/entertainment
    boardwalk_stroll: 5, // Boardwalks often have music
  },

  art_appreciator: {
    creative_hobby: 20,
    sketching: 20,
    journaling: 10,
    read_book: 8,
  },

  foodie: {
    cook_dinner: 20,
    casual_date: 15, // Dinner dates
    have_coffee: 10, // Coffee shops often have pastries
    beach_picnic: 12,
  },

  reader: {
    read_book: 20,
    study_library: 15,
    deep_conversation: 10,
    journaling: 10,
  },

  gamer: {
    play_video_games: 20,
    play_arcade: 20,
    play_pool_darts: 8,
  },

  nature_lover: {
    beach_picnic: 20,
    boardwalk_stroll: 15,
    stroll_park: 15,
    morning_jog: 12,
    swim_beach: 15,
    beach_walk: 15,
    sketching: 10, // Park sketching
  },
};

// ===== Archetype Affinity Matrices =====

/**
 * NPC archetype affinity with activity categories
 * How much each archetype enjoys different types of activities
 * Range: -10 to +10
 */
export const NPC_ARCHETYPE_ACTIVITY_AFFINITY: Record<NPCArchetype, Partial<Record<ActivityCategory, number>>> = {
  Artist: {
    self_improvement: 10,
    leisure: 8,
    social: 5,
    work: -5,
  },
  Athlete: {
    self_improvement: 10,
    social: 8,
    work: 3,
    leisure: 0,
  },
  Bookworm: {
    self_improvement: 10,
    leisure: 5,
    social: -3,
    work: 5,
  },
  Musician: {
    self_improvement: 8,
    social: 10,
    leisure: 8,
    work: -3,
  },
  Scientist: {
    self_improvement: 10,
    work: 8,
    social: -5,
    leisure: 0,
  },
};

/**
 * Player archetype to NPC archetype affinity
 * How well different archetypes naturally get along
 * Range: -5 to +10
 */
export const PLAYER_NPC_ARCHETYPE_AFFINITY: Record<PlayerArchetype, Partial<Record<NPCArchetype, number>>> = {
  athlete: {
    Athlete: 10,      // Same archetype - strong bond
    Artist: 0,        // Neutral
    Bookworm: -3,     // Different interests
    Musician: 5,      // Some overlap (performance, energy)
    Scientist: -2,    // Different focus
  },
  scholar: {
    Athlete: -3,
    Artist: 3,
    Bookworm: 10,     // Same archetype
    Musician: 5,      // Appreciation for art
    Scientist: 8,     // Intellectual kinship
  },
  social_butterfly: {
    Athlete: 5,
    Artist: 8,
    Bookworm: 0,
    Musician: 10,     // Love of social performance
    Scientist: 0,
  },
  artist: {
    Athlete: 0,
    Artist: 10,       // Same archetype
    Bookworm: 5,      // Appreciation for depth
    Musician: 8,      // Creative kinship
    Scientist: 3,     // Some creative overlap
  },
  professional: {
    Athlete: 3,       // Respects dedication
    Artist: 0,
    Bookworm: 5,      // Respects knowledge
    Musician: 0,
    Scientist: 8,     // Respects expertise
  },
  balanced: {
    Athlete: 3,
    Artist: 3,
    Bookworm: 3,
    Musician: 3,
    Scientist: 3,
  },
};

// ===== Discovery Methods =====

/**
 * Which trait categories can be discovered through different interaction types
 */
export const DISCOVERY_METHODS: Record<string, TraitCategory[]> = {
  conversation: ['personality'],
  date: ['romance'],
  shared_activity: ['interest'],
  deep_conversation: ['personality', 'romance'],  // Can reveal both
};

// ===== Trait Conflicts =====

/**
 * Traits that cannot exist together on the same NPC
 * Used for validation during NPC generation
 */
export const CONFLICTING_TRAITS: Record<NPCTrait, NPCTrait[]> = {
  // Social energy conflicts
  outgoing: ['reserved'],
  reserved: ['outgoing'],

  // Risk attitude conflicts
  adventurous: ['cautious'],
  cautious: ['adventurous', 'spontaneous'],
  spontaneous: ['cautious'],

  // Emotional style conflicts
  optimistic: ['melancholic'],
  melancholic: ['optimistic'],
  passionate: ['stoic'],
  stoic: ['passionate'],

  // Interpersonal conflicts
  independent: ['nurturing'],
  nurturing: ['independent'],

  // Romance conflicts
  slow_burn: ['intense', 'flirtatious'],
  intense: ['slow_burn'],
  flirtatious: ['slow_burn'],
  commitment_seeking: ['free_spirit'],
  free_spirit: ['commitment_seeking'],

  // Other traits have no conflicts
  logical: [],
  creative: [],
  intuitive: [],
  empathetic: [],
  competitive: [],
  romantic: [],
  physical: [],
  intellectual: [],
  coffee_lover: [],
  fitness_enthusiast: [],
  music_fan: [],
  art_appreciator: [],
  foodie: [],
  reader: [],
  gamer: [],
  nature_lover: [],
};

// ===== Archetype Trait Weights =====

/**
 * Probability weights for personality traits per NPC archetype
 * Higher weight = more likely to be generated for that archetype
 * Range: 0.1 (rare) to 3.0 (very common)
 */
export const ARCHETYPE_TRAIT_WEIGHTS: Record<NPCArchetype, Partial<Record<PersonalityTrait, number>>> = {
  Artist: {
    creative: 3.0,
    intuitive: 2.0,
    passionate: 2.5,
    melancholic: 1.5,
    empathetic: 2.0,
    independent: 1.5,
    spontaneous: 1.5,
    reserved: 1.2,
  },
  Athlete: {
    adventurous: 2.5,
    competitive: 3.0,
    outgoing: 2.0,
    optimistic: 2.0,
    spontaneous: 1.5,
    independent: 1.3,
  },
  Bookworm: {
    logical: 2.5,
    reserved: 2.5,
    cautious: 1.8,
    intuitive: 2.0,
    creative: 1.5,
    melancholic: 1.3,
    independent: 1.5,
  },
  Musician: {
    creative: 2.5,
    passionate: 3.0,
    outgoing: 2.0,
    spontaneous: 2.0,
    empathetic: 2.0,
    intuitive: 1.5,
  },
  Scientist: {
    logical: 3.0,
    cautious: 2.0,
    reserved: 1.8,
    independent: 2.0,
    intuitive: 1.5,
    stoic: 1.5,
  },
};
