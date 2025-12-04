/**
 * NPC Generator Service
 * Generates random NPCs with appearance, personality, and traits
 *
 * ARCHITECTURE NOTE: This service is isolated to make it easy to replace
 * random generation with rule-based or AI-powered generation in the future.
 */

import { NPC, NPCAppearance } from '../../../../shared/types';
import { randomUUID } from 'crypto';

// ===== Generation Data Pools =====

const FIRST_NAMES = [
  // Gender-neutral names
  'Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Avery', 'Quinn',
  'Sam', 'Jamie', 'Sage', 'Dakota', 'River', 'Phoenix', 'Rowan', 'Skylar',
  // Traditional names
  'Emma', 'Olivia', 'Sophia', 'Liam', 'Noah', 'Ethan', 'Ava', 'Isabella',
  'Mia', 'Mason', 'Lucas', 'Logan', 'Harper', 'Ella', 'Grace', 'Jack'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'
];

const ARCHETYPES = [
  'Artist',
  'Athlete',
  'Bookworm',
  'Musician',
  'Scientist'
];

const PERSONALITY_TRAITS = [
  'outgoing',
  'introverted',
  'creative',
  'logical',
  'adventurous',
  'cautious',
  'optimistic',
  'pessimistic',
  'empathetic',
  'analytical',
  'spontaneous',
  'organized'
];

const INTEREST_TRAITS = [
  'coffee_lover',
  'fitness_enthusiast',
  'music_fan',
  'art_appreciator',
  'tech_savvy',
  'nature_lover',
  'foodie',
  'reader',
  'gamer',
  'traveler'
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

const BUILDS = [
  'slim', 'athletic', 'average', 'stocky', 'muscular', 'petite', 'curvy'
];

const HEIGHTS = [
  'short', 'average', 'tall', 'very tall'
];

const SKIN_TONES = [
  'pale', 'fair', 'light', 'medium', 'tan', 'olive', 'brown', 'dark brown', 'deep'
];

const DISTINCTIVE_FEATURES = [
  'glasses', 'freckles', 'dimples', 'mole', 'scar', 'tattoo', 'piercing',
  'birthmark', 'strong jawline', 'high cheekbones', 'full lips', 'bright smile'
];

const STYLES = [
  'casual', 'formal', 'sporty', 'alternative', 'bohemian', 'preppy',
  'minimalist', 'vintage', 'streetwear', 'elegant'
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
 * Generate a random name
 */
function generateName(): string {
  const firstName = randomChoice(FIRST_NAMES);
  const lastName = randomChoice(LAST_NAMES);
  return `${firstName} ${lastName}`;
}

/**
 * Generate random appearance
 */
function generateAppearance(): NPCAppearance {
  // Randomly decide if they have distinctive features (50% chance, 1-2 features)
  const hasDistinctiveFeatures = Math.random() > 0.5;
  const distinctiveFeatures = hasDistinctiveFeatures
    ? randomChoices(DISTINCTIVE_FEATURES, randomInt(1, 2))
    : undefined;

  return {
    hairColor: randomChoice(HAIR_COLORS),
    hairStyle: randomChoice(HAIR_STYLES),
    eyeColor: randomChoice(EYE_COLORS),
    build: randomChoice(BUILDS),
    height: randomChoice(HEIGHTS),
    skinTone: randomChoice(SKIN_TONES),
    distinctiveFeatures,
    style: randomChoice(STYLES)
  };
}

/**
 * Generate random archetype
 */
function generateArchetype(): string {
  return randomChoice(ARCHETYPES);
}

/**
 * Generate random traits (2-3 personality + 2-3 interests)
 */
function generateTraits(): string[] {
  const personalityCount = randomInt(2, 3);
  const interestCount = randomInt(2, 3);

  const personality = randomChoices(PERSONALITY_TRAITS, personalityCount);
  const interests = randomChoices(INTEREST_TRAITS, interestCount);

  return [...personality, ...interests];
}

// ===== Main Generator =====

/**
 * Generate a random NPC
 *
 * FUTURE: Replace this with rule-based or AI-powered generation
 * - Archetype should influence traits and appearance
 * - Traits should be coherent (not conflicting)
 * - Consider player's existing NPCs to ensure variety
 */
export function generateNPC(): Omit<NPC, 'id' | 'createdAt'> {
  return {
    name: generateName(),
    archetype: generateArchetype(),
    traits: generateTraits(),
    appearance: generateAppearance()
  };
}

/**
 * Create a full NPC object with ID and timestamp
 */
export function createNPC(): NPC {
  const npcData = generateNPC();

  return {
    ...npcData,
    id: randomUUID(),
    createdAt: new Date().toISOString()
  };
}

/**
 * Get all available archetypes
 */
export function getArchetypes(): string[] {
  return [...ARCHETYPES];
}

/**
 * Get all available traits
 */
export function getAllTraits(): string[] {
  return [...PERSONALITY_TRAITS, ...INTEREST_TRAITS];
}
