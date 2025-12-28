/**
 * Trait Service
 *
 * Manages trait definitions, discovery mechanics, and bonus calculations.
 * Uses tag-based affinity matching instead of activity IDs.
 *
 * Architecture:
 * - Pure functions for calculations (testable, composable)
 * - Configuration-driven (see config.ts)
 * - Tag-based activity affinity
 */

import {
  NPCTrait,
  NPC,
  TraitContribution,
} from '../../../../shared/types';

import { ActivityTag } from '../../../../shared/types/activity.types';

import {
  TRAIT_DEFINITIONS,
  TRAIT_TAG_AFFINITY,
  CONFLICTING_TRAITS,
  ALL_TRAITS,
  AFFINITY,
  TraitDefinition,
} from './config';

// ===== Trait Information =====

/**
 * Get metadata for a trait
 */
export function getTraitDefinition(trait: NPCTrait): TraitDefinition {
  return TRAIT_DEFINITIONS[trait];
}

/**
 * Get all trait definitions
 */
export function getAllTraitDefinitions(): Record<NPCTrait, TraitDefinition> {
  return TRAIT_DEFINITIONS;
}

/**
 * Get all available traits
 */
export function getAllTraits(): NPCTrait[] {
  return ALL_TRAITS;
}

// ===== Trait-Activity Bonuses (Tag-Based) =====

/**
 * Calculate activity bonus from NPC traits using tag matching
 *
 * Sums bonuses for all traits that have affinity with any of the activity's tags.
 * Result is capped at AFFINITY.MIN to AFFINITY.MAX.
 *
 * @param npcTraits - All NPC traits (not just revealed)
 * @param activityTags - Tags on the activity
 * @returns Cumulative bonus/penalty from traits (capped)
 *
 * @example
 * getTraitActivityBonus(['coffee_lover', 'introverted'], ['coffee', 'calm'])
 * // Returns: 25 (15 from coffee_lover + 10 from introverted)
 */
export function getTraitActivityBonus(
  npcTraits: NPCTrait[],
  activityTags: ActivityTag[]
): number {
  let totalBonus = 0;

  for (const trait of npcTraits) {
    const tagAffinities = TRAIT_TAG_AFFINITY[trait];
    if (tagAffinities) {
      for (const tag of activityTags) {
        const bonus = tagAffinities[tag];
        if (bonus !== undefined) {
          totalBonus += bonus;
        }
      }
    }
  }

  // Cap the result
  return Math.max(AFFINITY.MIN, Math.min(AFFINITY.MAX, totalBonus));
}

/**
 * Get detailed breakdown of individual trait contributions to activity
 *
 * Returns each trait's individual contribution with metadata for transparency.
 *
 * @param npcTraits - NPC's traits
 * @param activityTags - Tags on the activity
 * @returns Array of individual trait contributions
 */
export function getTraitActivityBreakdown(
  npcTraits: NPCTrait[],
  activityTags: ActivityTag[]
): TraitContribution[] {
  const contributions: TraitContribution[] = [];

  for (const trait of npcTraits) {
    const tagAffinities = TRAIT_TAG_AFFINITY[trait];
    if (tagAffinities) {
      let traitBonus = 0;
      for (const tag of activityTags) {
        const bonus = tagAffinities[tag];
        if (bonus !== undefined) {
          traitBonus += bonus;
        }
      }
      if (traitBonus !== 0) {
        contributions.push({
          trait,
          traitName: TRAIT_DEFINITIONS[trait].name,
          bonus: traitBonus,
        });
      }
    }
  }

  return contributions;
}

// ===== Trait Discovery =====

/**
 * Find an unrevealed trait that contributed to this activity
 *
 * When an activity is performed, this function checks if any of the NPC's
 * unrevealed traits have affinity with the activity's tags. If so, it
 * returns that trait to be revealed to the player.
 *
 * @param npc - The NPC (with all traits and revealed traits)
 * @param activityTags - Tags on the activity being performed
 * @returns Object with discovered trait and isNew flag, or null if no discovery
 *
 * @example
 * const result = getContributingTrait(npc, ['coffee', 'calm']);
 * if (result && result.isNew) {
 *   console.log(`Discovered ${result.trait}!`);
 * }
 */
export function getContributingTrait(
  npc: Pick<NPC, 'traits' | 'revealedTraits'>,
  activityTags: ActivityTag[]
): { trait: NPCTrait; isNew: boolean } | null {
  // Only look at unrevealed traits
  for (const trait of npc.traits) {
    if (npc.revealedTraits.includes(trait)) {
      continue;
    }

    // Check if this trait has affinity with any activity tag
    const tagAffinities = TRAIT_TAG_AFFINITY[trait];
    if (!tagAffinities) {
      continue;
    }

    for (const tag of activityTags) {
      if (tagAffinities[tag] !== undefined) {
        return { trait, isNew: true };
      }
    }
  }

  return null;
}

// ===== Trait Validation =====

/**
 * Check if two traits conflict with each other
 */
export function traitsConflict(trait1: NPCTrait, trait2: NPCTrait): boolean {
  const conflicts = CONFLICTING_TRAITS[trait1] ?? [];
  return conflicts.includes(trait2);
}

/**
 * Validate that a set of traits has no conflicts
 */
export function validateTraits(traits: NPCTrait[]): {
  valid: boolean;
  conflicts: Array<[NPCTrait, NPCTrait]>;
} {
  const conflicts: Array<[NPCTrait, NPCTrait]> = [];

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

// ===== Trait Generation =====

/**
 * Select random traits for NPC generation
 *
 * Randomly selects traits from the full list, avoiding conflicts.
 *
 * @param count - Number of traits to select (1-3)
 * @returns Selected traits
 */
export function selectRandomTraits(count: number): NPCTrait[] {
  // Shuffle all traits
  const shuffled = [...ALL_TRAITS].sort(() => Math.random() - 0.5);

  const selected: NPCTrait[] = [];

  for (const trait of shuffled) {
    if (selected.length >= count) break;
    if (!selected.some((t) => traitsConflict(t, trait))) {
      selected.push(trait);
    }
  }

  return selected;
}
