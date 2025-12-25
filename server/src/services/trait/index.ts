/**
 * Trait Service
 *
 * Manages trait definitions, discovery mechanics, and bonus calculations.
 * All functions are pure (no side effects) for easy testing and predictability.
 *
 * Architecture:
 * - Pure functions for calculations (testable, composable)
 * - Configuration-driven (see config.ts)
 * - Data-driven design for trait effects
 */

import {
  NPCTrait,
  PersonalityTrait,
  RomanceTrait,
  InterestTrait,
  NPC,
  NPCArchetype,
  PlayerArchetype,
  ActivityCategory,
  TraitContribution,
  ArchetypeContribution,
} from '../../../../shared/types';
import {
  TRAIT_DEFINITIONS,
  TRAIT_ACTIVITY_AFFINITY,
  NPC_ARCHETYPE_ACTIVITY_AFFINITY,
  PLAYER_NPC_ARCHETYPE_AFFINITY,
  DISCOVERY_METHODS,
  CONFLICTING_TRAITS,
  ARCHETYPE_TRAIT_WEIGHTS,
  TraitCategory,
  TraitDefinition,
} from './config';

// ===== Helper Functions =====

/**
 * Get the category of a trait
 */
export function getTraitCategory(trait: NPCTrait): TraitCategory {
  return TRAIT_DEFINITIONS[trait].category;
}

/**
 * Check if a trait is a personality trait
 */
function isPersonalityTrait(trait: NPCTrait): trait is PersonalityTrait {
  return getTraitCategory(trait) === 'personality';
}

/**
 * Check if a trait is a romance trait
 */
function isRomanceTrait(trait: NPCTrait): trait is RomanceTrait {
  return getTraitCategory(trait) === 'romance';
}

/**
 * Check if a trait is an interest trait
 */
function isInterestTrait(trait: NPCTrait): trait is InterestTrait {
  return getTraitCategory(trait) === 'interest';
}

/**
 * Filter traits by category
 */
function filterTraitsByCategory(traits: NPCTrait[], category: TraitCategory): NPCTrait[] {
  return traits.filter((trait) => getTraitCategory(trait) === category);
}

// ===== Trait Information =====

/**
 * Get metadata for a trait
 *
 * Returns full trait definition including name, description, and gameplay effects.
 *
 * @param trait - The trait to look up
 * @returns Trait definition with metadata
 *
 * @example
 * const def = getTraitDefinition('optimistic');
 * console.log(def.description); // "Sees the bright side..."
 */
export function getTraitDefinition(trait: NPCTrait): TraitDefinition {
  return TRAIT_DEFINITIONS[trait];
}

/**
 * Get all trait definitions
 *
 * @returns All trait definitions indexed by trait
 */
export function getAllTraitDefinitions(): Record<NPCTrait, TraitDefinition> {
  return TRAIT_DEFINITIONS;
}

// ===== Trait-Activity Bonuses =====

/**
 * Calculate activity bonus from NPC traits
 *
 * Combines bonuses from all traits that have affinity with the activity.
 * Bonuses are cumulative (traits stack).
 *
 * @param npcTraits - NPC's traits (only considers revealed traits in real gameplay)
 * @param activityId - The activity being performed
 * @returns Cumulative bonus/penalty from traits
 *
 * @example
 * getTraitActivityBonus(['coffee_lover', 'outgoing'], 'have_coffee')
 * // Returns: 25 (20 from coffee_lover + 5 from outgoing)
 */
export function getTraitActivityBonus(
  npcTraits: NPCTrait[],
  activityId: string
): number {
  let totalBonus = 0;

  for (const trait of npcTraits) {
    const traitAffinities = TRAIT_ACTIVITY_AFFINITY[trait];
    if (traitAffinities) {
      const bonus = traitAffinities[activityId];
      if (bonus !== undefined) {
        totalBonus += bonus;
      }
    }
  }

  return totalBonus;
}

/**
 * Get detailed breakdown of individual trait contributions to activity
 *
 * Returns each trait's individual contribution with metadata for transparency.
 *
 * @param npcTraits - NPC's traits
 * @param activityId - The activity being performed
 * @returns Array of individual trait contributions
 *
 * @example
 * getTraitActivityBreakdown(['coffee_lover', 'outgoing'], 'have_coffee')
 * // Returns: [
 * //   { trait: 'coffee_lover', traitName: 'Coffee Lover', bonus: 20 },
 * //   { trait: 'outgoing', traitName: 'Outgoing', bonus: 5 }
 * // ]
 */
export function getTraitActivityBreakdown(
  npcTraits: NPCTrait[],
  activityId: string
): TraitContribution[] {
  const contributions: TraitContribution[] = [];

  for (const trait of npcTraits) {
    const traitAffinities = TRAIT_ACTIVITY_AFFINITY[trait];
    if (traitAffinities) {
      const bonus = traitAffinities[activityId];
      if (bonus !== undefined && bonus !== 0) {
        contributions.push({
          trait,
          traitName: TRAIT_DEFINITIONS[trait].name,
          bonus,
        });
      }
    }
  }

  return contributions;
}

// ===== Archetype Bonuses =====

/**
 * Calculate bonus from NPC archetype affinity with activity category
 *
 * Different NPC archetypes enjoy different types of activities.
 * For example, Athletes enjoy self-improvement activities more than work.
 *
 * @param npcArchetype - NPC's archetype
 * @param activityCategory - Category of the activity
 * @returns Bonus/penalty for this archetype-category combination
 *
 * @example
 * getArchetypeActivityBonus('Artist', 'self_improvement')
 * // Returns: 10 (Artists love self-improvement)
 */
export function getArchetypeActivityBonus(
  npcArchetype: NPCArchetype,
  activityCategory: ActivityCategory
): number {
  const archetypeAffinities = NPC_ARCHETYPE_ACTIVITY_AFFINITY[npcArchetype];
  return archetypeAffinities?.[activityCategory] ?? 0;
}

/**
 * Calculate bonus from player-NPC archetype matching
 *
 * Some archetype combinations naturally get along better.
 * For example, two Athletes bond easily, while Athletes and Bookworms might clash.
 *
 * This is a general relationship modifier, not activity-specific.
 *
 * @param playerArchetype - Player's chosen archetype
 * @param npcArchetype - NPC's archetype
 * @returns Bonus/penalty for this archetype pairing
 *
 * @example
 * getArchetypeMatchBonus('athlete', 'Athlete')
 * // Returns: 10 (same archetype - strong bond)
 *
 * getArchetypeMatchBonus('athlete', 'Bookworm')
 * // Returns: -3 (different interests)
 */
export function getArchetypeMatchBonus(
  playerArchetype: PlayerArchetype,
  npcArchetype: NPCArchetype
): number {
  const playerAffinities = PLAYER_NPC_ARCHETYPE_AFFINITY[playerArchetype];
  return playerAffinities?.[npcArchetype] ?? 0;
}

/**
 * Calculate combined archetype bonus for an activity
 *
 * Combines both the NPC's enjoyment of the activity category
 * and the player-NPC archetype compatibility.
 *
 * @param playerArchetype - Player's archetype
 * @param npcArchetype - NPC's archetype
 * @param activityCategory - Category of activity
 * @returns Combined archetype bonus
 *
 * @example
 * getArchetypeBonus('athlete', 'Athlete', 'self_improvement')
 * // Returns: 20 (10 from archetype match + 10 from activity preference)
 */
export function getArchetypeBonus(
  playerArchetype: PlayerArchetype,
  npcArchetype: NPCArchetype,
  activityCategory: ActivityCategory
): number {
  const matchBonus = getArchetypeMatchBonus(playerArchetype, npcArchetype);
  const activityBonus = getArchetypeActivityBonus(npcArchetype, activityCategory);
  return matchBonus + activityBonus;
}

/**
 * Get detailed breakdown of archetype contributions to activity
 *
 * Returns separated components: player-NPC match bonus and NPC activity affinity bonus.
 * This provides full transparency into how archetypes affect difficulty.
 *
 * @param playerArchetype - Player's archetype
 * @param npcArchetype - NPC's archetype
 * @param activityCategory - Category of activity
 * @returns Detailed archetype contribution breakdown
 *
 * @example
 * getArchetypeBreakdown('athlete', 'Athlete', 'self_improvement')
 * // Returns: {
 * //   playerArchetype: 'athlete',
 * //   npcArchetype: 'Athlete',
 * //   activityCategory: 'self_improvement',
 * //   matchBonus: 10,           // Same archetype bonus
 * //   activityAffinityBonus: 10, // Athlete loves self-improvement
 * //   totalBonus: 20
 * // }
 */
export function getArchetypeBreakdown(
  playerArchetype: PlayerArchetype,
  npcArchetype: NPCArchetype,
  activityCategory: ActivityCategory
): ArchetypeContribution {
  const matchBonus = getArchetypeMatchBonus(playerArchetype, npcArchetype);
  const activityAffinityBonus = getArchetypeActivityBonus(npcArchetype, activityCategory);

  return {
    playerArchetype,
    npcArchetype,
    activityCategory,
    matchBonus,
    activityAffinityBonus,
    totalBonus: matchBonus + activityAffinityBonus,
  };
}

// ===== Trait Discovery =====

/**
 * Discover a trait through an interaction method
 *
 * Different interaction types reveal different categories of traits:
 * - 'conversation': reveals personality traits
 * - 'date': reveals romance traits
 * - 'shared_activity': reveals interest traits
 * - 'deep_conversation': reveals personality AND romance traits
 *
 * Prioritizes unrevealed traits matching the method's categories.
 * Returns null if all matching traits are already revealed.
 *
 * @param npc - The NPC (with all traits and revealed traits)
 * @param method - Discovery method used
 * @returns Object with discovered trait and whether it's new, or null
 *
 * @example
 * const result = discoverTrait(npc, 'conversation');
 * if (result && result.isNew) {
 *   console.log(`Discovered ${result.trait}!`);
 * }
 */
export function discoverTrait(
  npc: Pick<NPC, 'traits' | 'revealedTraits'>,
  method: string
): { trait: NPCTrait; isNew: boolean } | null {
  // Get valid categories for this method
  const validCategories = DISCOVERY_METHODS[method] ?? [];
  if (validCategories.length === 0) {
    return null;
  }

  // Find unrevealed traits matching the categories
  const unrevealedMatchingTraits = npc.traits.filter((trait) => {
    const isRevealed = npc.revealedTraits.includes(trait);
    const matchesCategory = validCategories.includes(getTraitCategory(trait));
    return !isRevealed && matchesCategory;
  });

  // If there are unrevealed matching traits, pick one randomly
  if (unrevealedMatchingTraits.length > 0) {
    const randomIndex = Math.floor(Math.random() * unrevealedMatchingTraits.length);
    return {
      trait: unrevealedMatchingTraits[randomIndex],
      isNew: true,
    };
  }

  // Otherwise, check if there are any revealed matching traits to return
  const revealedMatchingTraits = npc.traits.filter((trait) => {
    const isRevealed = npc.revealedTraits.includes(trait);
    const matchesCategory = validCategories.includes(getTraitCategory(trait));
    return isRevealed && matchesCategory;
  });

  if (revealedMatchingTraits.length > 0) {
    const randomIndex = Math.floor(Math.random() * revealedMatchingTraits.length);
    return {
      trait: revealedMatchingTraits[randomIndex],
      isNew: false,
    };
  }

  // No matching traits at all
  return null;
}

/**
 * Check if an NPC has any undiscovered traits in a category
 *
 * @param npc - The NPC
 * @param category - Trait category to check
 * @returns True if there are undiscovered traits in this category
 */
export function hasUndiscoveredTraits(
  npc: Pick<NPC, 'traits' | 'revealedTraits'>,
  category: TraitCategory
): boolean {
  const categoryTraits = filterTraitsByCategory(npc.traits, category);
  const revealedCategoryTraits = filterTraitsByCategory(npc.revealedTraits, category);
  return categoryTraits.length > revealedCategoryTraits.length;
}

// ===== Trait Validation =====

/**
 * Check if two traits conflict with each other
 *
 * Some traits are mutually exclusive (e.g., outgoing/reserved, optimistic/melancholic).
 * This is used during NPC generation to ensure valid trait combinations.
 *
 * @param trait1 - First trait
 * @param trait2 - Second trait
 * @returns True if traits conflict
 *
 * @example
 * traitsConflict('outgoing', 'reserved') // Returns: true
 * traitsConflict('outgoing', 'optimistic') // Returns: false
 */
export function traitsConflict(trait1: NPCTrait, trait2: NPCTrait): boolean {
  const conflicts = CONFLICTING_TRAITS[trait1] ?? [];
  return conflicts.includes(trait2);
}

/**
 * Validate that a set of traits has no conflicts
 *
 * @param traits - Traits to validate
 * @returns Object with validation result and conflicting pairs if any
 *
 * @example
 * const result = validateTraits(['outgoing', 'reserved', 'optimistic']);
 * if (!result.valid) {
 *   console.log('Conflicts:', result.conflicts);
 *   // [['outgoing', 'reserved']]
 * }
 */
export function validateTraits(traits: NPCTrait[]): {
  valid: boolean;
  conflicts: Array<[NPCTrait, NPCTrait]>;
} {
  const conflicts: Array<[NPCTrait, NPCTrait]> = [];

  // Check all pairs
  for (let i = 0; i < traits.length; i++) {
    for (let j = i + 1; j < traits.length; j++) {
      if (traitsConflict(traits[i], traits[j])) {
        conflicts.push([traits[i], traits[j]]);
      }
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Filter out conflicting traits from a list
 *
 * Given a list of traits, removes any that conflict with previously accepted traits.
 * Processes in order, keeping first occurrence.
 *
 * @param traits - Traits to filter
 * @returns Filtered list with no conflicts
 *
 * @example
 * removeConflictingTraits(['outgoing', 'reserved', 'optimistic'])
 * // Returns: ['outgoing', 'optimistic'] (reserved removed due to conflict)
 */
export function removeConflictingTraits(traits: NPCTrait[]): NPCTrait[] {
  const result: NPCTrait[] = [];

  for (const trait of traits) {
    const hasConflict = result.some((existing) => traitsConflict(trait, existing));
    if (!hasConflict) {
      result.push(trait);
    }
  }

  return result;
}

// ===== Trait Generation Helpers =====

/**
 * Get weighted personality traits for an NPC archetype
 *
 * Returns traits with their probability weights for random generation.
 * Higher weight = more likely to be selected.
 *
 * @param archetype - NPC archetype
 * @returns Object mapping traits to weights
 *
 * @example
 * const weights = getArchetypeTraitWeights('Artist');
 * // { creative: 3.0, intuitive: 2.0, passionate: 2.5, ... }
 */
export function getArchetypeTraitWeights(
  archetype: NPCArchetype
): Partial<Record<PersonalityTrait, number>> {
  return ARCHETYPE_TRAIT_WEIGHTS[archetype] ?? {};
}

/**
 * Select random traits based on weights
 *
 * Weighted random selection from available traits.
 * Used during NPC generation.
 *
 * @param weights - Trait weights
 * @param count - Number of traits to select
 * @returns Selected traits
 *
 * @example
 * const traits = selectWeightedTraits({ creative: 3.0, logical: 1.0, outgoing: 2.0 }, 2);
 * // Might return: ['creative', 'outgoing'] (higher weights more likely)
 */
export function selectWeightedTraits<T extends string>(
  weights: Partial<Record<T, number>>,
  count: number
): T[] {
  const traits = Object.keys(weights) as T[];
  if (traits.length === 0) return [];

  const selected: T[] = [];
  const availableTraits = [...traits];

  for (let i = 0; i < count && availableTraits.length > 0; i++) {
    // Calculate total weight of remaining traits
    const totalWeight = availableTraits.reduce((sum, trait) => {
      return sum + (weights[trait] ?? 1);
    }, 0);

    // Random selection based on weight
    let random = Math.random() * totalWeight;
    let selectedTrait: T | null = null;

    for (const trait of availableTraits) {
      random -= weights[trait] ?? 1;
      if (random <= 0) {
        selectedTrait = trait;
        break;
      }
    }

    // Fallback to last trait if rounding issues
    if (!selectedTrait) {
      selectedTrait = availableTraits[availableTraits.length - 1];
    }

    selected.push(selectedTrait);

    // Remove selected trait from available pool
    const index = availableTraits.indexOf(selectedTrait);
    if (index > -1) {
      availableTraits.splice(index, 1);
    }
  }

  return selected;
}

/**
 * Select random traits from a category
 *
 * @param category - Trait category
 * @param count - Number to select
 * @returns Random traits from category
 */
export function selectRandomTraitsFromCategory(
  category: TraitCategory,
  count: number
): NPCTrait[] {
  const allTraits = Object.keys(TRAIT_DEFINITIONS) as NPCTrait[];
  const categoryTraits = allTraits.filter(
    (trait) => TRAIT_DEFINITIONS[trait].category === category
  );

  // Shuffle and take first N
  const shuffled = [...categoryTraits].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
