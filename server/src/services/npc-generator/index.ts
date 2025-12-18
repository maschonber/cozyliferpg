/**
 * NPC Generator Service
 * Generates random NPCs with appearance, personality, and traits
 *
 * ARCHITECTURE NOTE: This service is isolated to make it easy to replace
 * random generation with rule-based or AI-powered generation in the future.
 */

import {
  NPC,
  NPCAppearance,
  Gender,
  NPCArchetype,
  NPCTrait,
  PersonalityTrait,
  RomanceTrait,
  InterestTrait,
  NPCEmotionState,
  TimeSlot,
  EmotionValues
} from '../../../../shared/types';
import { randomUUID } from 'crypto';
import { initializeEmotions, applyEmotionDelta } from '../emotion';
import {
  getArchetypeTraitWeights,
  selectWeightedTraits,
  selectRandomTraitsFromCategory,
  removeConflictingTraits,
  validateTraits
} from '../trait';

// ===== Generation Data Pools =====

const GENDERS: Gender[] = ['female', 'male', 'other'];

// Gender-specific first names
const FEMALE_NAMES = [
  'Emma', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Mia', 'Charlotte', 'Amelia',
  'Harper', 'Ella', 'Grace', 'Lily', 'Chloe', 'Zoe', 'Emily', 'Madison',
  'Abigail', 'Scarlett', 'Victoria', 'Aria', 'Luna', 'Layla', 'Hazel', 'Nora',
  'Violet', 'Aurora', 'Savannah', 'Brooklyn', 'Bella', 'Claire', 'Sophie',
  'Ruby', 'Alice', 'Eva', 'Stella', 'Maya', 'Natalie', 'Lucy', 'Audrey'
];

const MALE_NAMES = [
  'Liam', 'Noah', 'Ethan', 'Mason', 'Lucas', 'Logan', 'Oliver', 'James',
  'Benjamin', 'Elijah', 'Alexander', 'William', 'Michael', 'Daniel', 'Henry',
  'Jackson', 'Sebastian', 'Jack', 'Owen', 'Samuel', 'Matthew', 'Joseph',
  'David', 'Carter', 'Wyatt', 'John', 'Dylan', 'Luke', 'Gabriel', 'Isaac',
  'Julian', 'Levi', 'Nathan', 'Caleb', 'Ryan', 'Christian', 'Hunter', 'Adrian'
];

const NEUTRAL_NAMES = [
  'Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Avery', 'Quinn',
  'Sam', 'Jamie', 'Sage', 'Dakota', 'River', 'Phoenix', 'Rowan', 'Skylar',
  'Charlie', 'Finley', 'Reese', 'Emerson', 'Parker', 'Hayden', 'Peyton',
  'Cameron', 'Blake', 'Drew', 'Ash', 'Kai', 'Rory', 'Jesse'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
  'Mitchell', 'Carter', 'Roberts', 'Turner', 'Phillips', 'Evans', 'Parker',
  'Collins', 'Edwards', 'Stewart', 'Morris', 'Murphy', 'Cook', 'Rogers'
];

const ARCHETYPES: NPCArchetype[] = [
  'Artist',
  'Athlete',
  'Bookworm',
  'Musician',
  'Scientist'
];

const PERSONALITY_TRAITS: PersonalityTrait[] = [
  'outgoing',
  'reserved',
  'logical',
  'creative',
  'intuitive',
  'adventurous',
  'cautious',
  'spontaneous',
  'optimistic',
  'melancholic',
  'passionate',
  'stoic',
  'empathetic',
  'independent',
  'nurturing',
  'competitive'
];

const ROMANCE_TRAITS: RomanceTrait[] = [
  'flirtatious',
  'romantic',
  'physical',
  'intellectual',
  'slow_burn',
  'intense',
  'commitment_seeking',
  'free_spirit'
];

const INTEREST_TRAITS: InterestTrait[] = [
  'coffee_lover',
  'fitness_enthusiast',
  'music_fan',
  'art_appreciator',
  'foodie',
  'reader',
  'gamer',
  'nature_lover'
];

const HAIR_COLORS = [
  'black', 'dark brown', 'brown', 'light brown', 'blonde', 'platinum blonde',
  'auburn', 'red', 'ginger', 'gray', 'white', 'silver'
];

const HAIR_STYLES = [
  'short', 'long', 'shoulder-length', 'pixie cut', 'bob', 'curly', 'wavy',
  'straight', 'braided', 'ponytail', 'bun', 'messy', 'slicked back', 'spiky'
];

const EYE_COLORS = [
  'brown', 'dark brown', 'hazel', 'green', 'blue', 'gray', 'amber'
];

const BODY_TYPES = [
  'slim', 'athletic', 'average', 'stocky', 'muscular', 'petite', 'curvy'
];

const TORSO_SIZES = [
  'small', 'medium', 'large', 'petite', 'broad'
];

const HEIGHTS = [
  'short', 'average', 'tall', 'very tall'
];

const SKIN_TONES = [
  'pale', 'fair', 'light', 'medium', 'tan', 'olive', 'brown', 'dark brown', 'deep'
];

const UPPER_TRACE = [
  't-shirt', 'blouse', 'sweater', 'hoodie', 'tank top', 'dress shirt', 'jacket',
  'cardigan', 'polo shirt', 'crop top'
];

const LOWER_TRACE = [
  'jeans', 'slacks', 'skirt', 'shorts', 'leggings', 'dress pants', 'joggers',
  'cargo pants', 'sweatpants', 'pencil skirt'
];

const FACE_DETAILS = [
  'glasses', 'freckles', 'dimples', 'mole', 'scar', 'piercing',
  'birthmark', 'strong jawline', 'high cheekbones', 'full lips', 'bright smile'
];

const BODY_DETAILS = [
  'tattoo on arm', 'tattoo on back', 'freckles on shoulders', 'birthmark',
  'scar on hand', 'muscular arms', 'toned legs', 'lean build', 'broad shoulders'
];

const STYLES = [
  'casual', 'formal', 'sporty', 'alternative', 'bohemian', 'preppy',
  'minimalist', 'vintage', 'streetwear', 'elegant'
];

const LORAS = [
  // Placeholder for future LoRA models
  'default', 'anime_style', 'realistic', 'portrait'
];

// ===== Helper Functions =====

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ===== Generation Functions =====

/**
 * Generate a random name based on gender
 */
function generateName(gender: Gender): string {
  let firstName: string;

  // Select first name based on gender
  if (gender === 'female') {
    firstName = randomChoice(FEMALE_NAMES);
  } else if (gender === 'male') {
    firstName = randomChoice(MALE_NAMES);
  } else {
    // For 'other' gender, use neutral names
    firstName = randomChoice(NEUTRAL_NAMES);
  }

  const lastName = randomChoice(LAST_NAMES);
  return `${firstName} ${lastName}`;
}

/**
 * Generate random gender
 */
function generateGender(): Gender {
  // Weight distribution: 75% female, 20% male, 5% other
  // (Based on demo player preferences: heterosexual male)
  const rand = Math.random();
  if (rand < 0.75) return 'female';
  if (rand < 0.95) return 'male';
  return 'other';
}

/**
 * Generate random appearance
 */
function generateAppearance(): NPCAppearance {
  // Randomly decide face details (50% chance, 1-2 features)
  const hasFaceDetails = Math.random() > 0.5;
  const faceDetails = hasFaceDetails
    ? randomChoices(FACE_DETAILS, randomInt(1, 2))
    : [];

  // Randomly decide body details (30% chance, 1-2 features)
  const hasBodyDetails = Math.random() > 0.7;
  const bodyDetails = hasBodyDetails
    ? randomChoices(BODY_DETAILS, randomInt(1, 2))
    : [];

  return {
    hairColor: randomChoice(HAIR_COLORS),
    hairStyle: randomChoice(HAIR_STYLES),
    eyeColor: randomChoice(EYE_COLORS),
    faceDetails,
    bodyType: randomChoice(BODY_TYPES),
    torsoSize: randomChoice(TORSO_SIZES),
    height: randomChoice(HEIGHTS),
    skinTone: randomChoice(SKIN_TONES),
    upperTrace: randomChoice(UPPER_TRACE),
    lowerTrace: randomChoice(LOWER_TRACE),
    style: randomChoice(STYLES),
    bodyDetails
  };
}

/**
 * Generate LoRAs (currently just returns default)
 */
function generateLoras(): string[] {
  // For now, always use default LoRA
  // In the future, this could be based on archetype, style, or other factors
  return ['default'];
}

/**
 * Generate random archetype
 */
function generateArchetype(): NPCArchetype {
  return randomChoice(ARCHETYPES);
}

/**
 * Generate random traits based on archetype (2-3 personality + 1-2 romance + 2-3 interests)
 *
 * Task 5 Implementation:
 * - Uses archetype-based weighting for personality traits
 * - Ensures no conflicting traits (e.g., not both 'outgoing' and 'reserved')
 * - Romance and interest traits are random (not archetype-specific)
 *
 * @param archetype - NPC archetype (affects personality trait weights)
 * @returns Array of traits with no conflicts
 */
function generateTraits(archetype: NPCArchetype): NPCTrait[] {
  const personalityCount = randomInt(2, 3);
  const romanceCount = randomInt(1, 2);
  const interestCount = randomInt(2, 3);

  // Get archetype-weighted personality traits
  const archetypeWeights = getArchetypeTraitWeights(archetype);

  // Select personality traits using weighted selection
  let personality: NPCTrait[];
  if (Object.keys(archetypeWeights).length > 0) {
    // Use weighted selection based on archetype
    personality = selectWeightedTraits(archetypeWeights, personalityCount);
  } else {
    // Fallback to random if no weights defined (shouldn't happen)
    personality = randomChoices(PERSONALITY_TRAITS, personalityCount);
  }

  // Select random romance traits (not archetype-specific)
  const romance = randomChoices(ROMANCE_TRAITS, romanceCount) as NPCTrait[];

  // Select random interest traits (not archetype-specific)
  const interests = randomChoices(INTEREST_TRAITS, interestCount) as NPCTrait[];

  // Combine all traits
  const allTraits = [...personality, ...romance, ...interests];

  // Remove any conflicting traits (safety check)
  const validTraits = removeConflictingTraits(allTraits);

  // Validate final result (should always pass, but check for safety)
  const validation = validateTraits(validTraits);
  if (!validation.valid) {
    console.warn('Trait generation produced conflicts:', validation.conflicts);
    // This shouldn't happen, but log it if it does
  }

  return validTraits;
}

/**
 * Generate default emotion state for a new NPC
 * Delegated to emotion service for consistent emotion initialization
 *
 * Note: We use a placeholder npcId since the actual ID will be assigned
 * by the database. The emotion service doesn't use the npcId parameter.
 */
function generateEmotionState(traits: NPCTrait[]): NPCEmotionState {
  return initializeEmotions('temp_id', traits);
}

/**
 * Initialize daily emotion state for an NPC based on time of day
 *
 * Task 5 Implementation:
 * Creates varied starting emotions for daily NPC encounters based on:
 * - Time of day (morning = calmer, evening = more varied)
 * - NPC traits (affect baseline emotions)
 * - Relationship level (optional - friends start happier)
 *
 * This should be called when:
 * - A new day starts (reset NPC emotions)
 * - First encounter with NPC on a given day
 * - Loading saved NPC state for a new gameplay session
 *
 * @param npc - The NPC (or just traits if initializing)
 * @param timeOfDay - Current time slot
 * @param relationshipLevel - Optional relationship state (affects starting disposition)
 * @returns New emotion state for the day
 *
 * @example
 * // Morning encounter with a friend
 * const emotions = initializeDailyEmotion(npc, 'morning', 'friend');
 * // Result: Higher calm, positive emotions, lower anxiety
 *
 * // Evening encounter with a stranger
 * const emotions = initializeDailyEmotion(npc, 'evening');
 * // Result: More varied emotions, higher excitement potential
 */
export function initializeDailyEmotion(
  npc: Pick<NPC, 'traits'> | NPCTrait[],
  timeOfDay: TimeSlot,
  relationshipLevel?: string
): NPCEmotionState {
  // Extract traits array
  const traits = Array.isArray(npc) ? npc : npc.traits;

  // Start with trait-based baseline emotions
  const baseEmotions = initializeEmotions('temp_id', traits);

  // Time-of-day modifiers
  const timeModifiers: Partial<EmotionValues> = {};

  switch (timeOfDay) {
    case 'morning':
      // Morning: calmer, more neutral, lower extremes
      timeModifiers.calm = randomInt(5, 15);      // Boost calm
      timeModifiers.joy = randomInt(-5, 10);      // Slight joy variance
      timeModifiers.excitement = randomInt(-10, 0); // Lower excitement
      timeModifiers.anxiety = randomInt(-5, 0);    // Lower anxiety
      break;

    case 'afternoon':
      // Afternoon: moderate variance, generally balanced
      timeModifiers.joy = randomInt(-5, 10);
      timeModifiers.calm = randomInt(-5, 5);
      timeModifiers.excitement = randomInt(-5, 10);
      break;

    case 'evening':
      // Evening: more varied, higher excitement potential
      timeModifiers.excitement = randomInt(0, 15); // Higher excitement
      timeModifiers.joy = randomInt(-5, 15);       // More joy variance
      timeModifiers.calm = randomInt(-10, 5);      // Lower calm
      timeModifiers.romantic = randomInt(0, 10);   // Slight romantic boost
      break;

    case 'night':
      // Night: calmer but can be more romantic/intimate
      timeModifiers.calm = randomInt(0, 10);
      timeModifiers.excitement = randomInt(-10, 5);
      timeModifiers.romantic = randomInt(0, 15);   // Higher romantic potential
      timeModifiers.anxiety = randomInt(-5, 10);   // Slight anxiety variance
      break;
  }

  // Relationship-based modifiers
  if (relationshipLevel) {
    const relationshipModifiers: Partial<EmotionValues> = {};

    switch (relationshipLevel) {
      case 'partner':
      case 'lover':
        // Very positive, romantic
        relationshipModifiers.joy = randomInt(10, 20);
        relationshipModifiers.affection = randomInt(10, 20);
        relationshipModifiers.romantic = randomInt(15, 25);
        relationshipModifiers.anxiety = randomInt(-15, -5);
        relationshipModifiers.sadness = randomInt(-10, -5);
        break;

      case 'close_friend':
        // Very positive, comfortable
        relationshipModifiers.joy = randomInt(10, 15);
        relationshipModifiers.affection = randomInt(10, 15);
        relationshipModifiers.calm = randomInt(5, 10);
        relationshipModifiers.anxiety = randomInt(-10, -5);
        break;

      case 'friend':
        // Positive, friendly
        relationshipModifiers.joy = randomInt(5, 15);
        relationshipModifiers.affection = randomInt(5, 10);
        relationshipModifiers.anxiety = randomInt(-5, 0);
        break;

      case 'crush':
        // Excited, nervous, romantic
        relationshipModifiers.excitement = randomInt(10, 15);
        relationshipModifiers.romantic = randomInt(10, 20);
        relationshipModifiers.anxiety = randomInt(5, 15);
        relationshipModifiers.joy = randomInt(5, 10);
        break;

      case 'acquaintance':
        // Slightly positive
        relationshipModifiers.joy = randomInt(0, 10);
        relationshipModifiers.calm = randomInt(0, 5);
        break;

      case 'rival':
        // Negative, competitive
        relationshipModifiers.anger = randomInt(6, 15);
        relationshipModifiers.anxiety = randomInt(5, 10);
        relationshipModifiers.joy = randomInt(-10, -5);
        break;

      case 'enemy':
        // Very negative
        relationshipModifiers.anger = randomInt(16, 26);
        relationshipModifiers.sadness = randomInt(5, 15);
        relationshipModifiers.joy = randomInt(-35, -26);
        relationshipModifiers.affection = randomInt(-20, -10);
        break;

      case 'complicated':
        // Mixed emotions, high variance
        relationshipModifiers.anxiety = randomInt(5, 15);
        relationshipModifiers.joy = randomInt(-10, 10);
        relationshipModifiers.romantic = randomInt(-5, 15);
        break;

      case 'stranger':
      default:
        // Neutral with slight variance
        relationshipModifiers.anxiety = randomInt(0, 5);
        relationshipModifiers.calm = randomInt(0, 5);
        break;
    }

    // Apply relationship modifiers
    Object.assign(timeModifiers, {
      joy: (timeModifiers.joy ?? 0) + (relationshipModifiers.joy ?? 0),
      affection: (timeModifiers.affection ?? 0) + (relationshipModifiers.affection ?? 0),
      excitement: (timeModifiers.excitement ?? 0) + (relationshipModifiers.excitement ?? 0),
      calm: (timeModifiers.calm ?? 0) + (relationshipModifiers.calm ?? 0),
      sadness: (timeModifiers.sadness ?? 0) + (relationshipModifiers.sadness ?? 0),
      anger: (timeModifiers.anger ?? 0) + (relationshipModifiers.anger ?? 0),
      anxiety: (timeModifiers.anxiety ?? 0) + (relationshipModifiers.anxiety ?? 0),
      romantic: (timeModifiers.romantic ?? 0) + (relationshipModifiers.romantic ?? 0),
    });
  }

  // Apply all modifiers to base emotions
  return applyEmotionDelta(baseEmotions, timeModifiers);
}

// ===== Main Generator =====

/**
 * Generate a random NPC
 *
 * Note: currentLocation is set by the route based on player location (Phase 3)
 *
 * Task 5 Implementation:
 * - Archetype influences personality trait selection (weighted probabilities)
 * - Traits are validated for conflicts before assignment
 * - Emotion state initialized based on traits
 */
export function generateNPC(): Omit<NPC, 'id' | 'createdAt' | 'currentLocation'> {
  // Generate archetype first (it influences trait selection)
  const archetype = generateArchetype();

  // Generate gender for name selection
  const gender = generateGender();

  // Generate traits based on archetype (with conflict detection)
  const traits = generateTraits(archetype);

  return {
    name: generateName(gender),
    archetype,
    traits,
    revealedTraits: [],  // No traits revealed initially
    gender,
    emotionState: generateEmotionState(traits),
    appearance: generateAppearance(),
    loras: generateLoras()
  };
}

/**
 * Create a full NPC object with ID and timestamp
 * @param currentLocation - The location where the NPC is created (Phase 3)
 */
export function createNPC(currentLocation: string = 'park'): NPC {
  const npcData = generateNPC();

  return {
    ...npcData,
    id: randomUUID(),
    currentLocation: currentLocation as any,  // LocationId
    createdAt: new Date().toISOString()
  };
}

/**
 * Get all available archetypes
 */
export function getArchetypes(): NPCArchetype[] {
  return [...ARCHETYPES];
}

/**
 * Get all available traits
 */
export function getAllTraits(): NPCTrait[] {
  return [...PERSONALITY_TRAITS, ...ROMANCE_TRAITS, ...INTEREST_TRAITS];
}
