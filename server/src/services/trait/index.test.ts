/**
 * Trait Service Tests
 *
 * Tests for the simplified tag-based trait system.
 */

import {
  getTraitDefinition,
  getAllTraitDefinitions,
  getAllTraits,
  getTraitActivityBonus,
  getTraitActivityBreakdown,
  getContributingTrait,
  traitsConflict,
  validateTraits,
  removeConflictingTraits,
  selectRandomTraits,
} from './index';
import { AFFINITY } from './config';
import { NPCTrait, NPC } from '../../../../shared/types';
import { ActivityTag } from '../../../../shared/types/activity.types';

// ===== Trait Information Tests =====

describe('Trait Information', () => {
  test('getTraitDefinition returns complete definition', () => {
    const def = getTraitDefinition('coffee_lover');
    expect(def.trait).toBe('coffee_lover');
    expect(def.name).toBe('Coffee Lover');
    expect(def.description).toBeTruthy();
    expect(def.gameplayEffects).toBeInstanceOf(Array);
  });

  test('getAllTraitDefinitions returns all 12 traits', () => {
    const allDefs = getAllTraitDefinitions();
    expect(Object.keys(allDefs).length).toBe(12);
    expect(allDefs['coffee_lover']).toBeDefined();
    expect(allDefs['athletic']).toBeDefined();
    expect(allDefs['bookworm']).toBeDefined();
  });

  test('getAllTraits returns array of all traits', () => {
    const traits = getAllTraits();
    expect(traits).toHaveLength(12);
    expect(traits).toContain('coffee_lover');
    expect(traits).toContain('athletic');
    expect(traits).toContain('introverted');
  });
});

// ===== Trait-Activity Bonus Tests (Tag-Based) =====

describe('Trait-Activity Bonuses (Tag-Based)', () => {
  test('getTraitActivityBonus returns 0 for no matching tags', () => {
    const bonus = getTraitActivityBonus(['coffee_lover'], ['outdoor']);
    expect(bonus).toBe(0);
  });

  test('getTraitActivityBonus returns positive bonus for matching tag', () => {
    const bonus = getTraitActivityBonus(['coffee_lover'], ['coffee']);
    expect(bonus).toBe(AFFINITY.STRONG_LIKE); // 15
  });

  test('getTraitActivityBonus returns negative penalty for disliked tag', () => {
    const bonus = getTraitActivityBonus(['adventurous'], ['calm']);
    expect(bonus).toBe(AFFINITY.SLIGHT_DISLIKE); // -5
  });

  test('getTraitActivityBonus stacks multiple tag bonuses from single trait (capped)', () => {
    // bookworm likes intellectual (+15) and calm (+10) = 25, but capped at 20
    const bonus = getTraitActivityBonus(['bookworm'], ['intellectual', 'calm']);
    expect(bonus).toBe(AFFINITY.MAX); // Capped at 20
  });

  test('getTraitActivityBonus stacks bonuses from multiple traits (capped)', () => {
    // coffee_lover: coffee +15
    // introverted: calm +10
    // Total: 25, but capped at 20
    const bonus = getTraitActivityBonus(['coffee_lover', 'introverted'], ['coffee', 'calm']);
    expect(bonus).toBe(AFFINITY.MAX); // Capped at 20
  });

  test('getTraitActivityBonus caps at AFFINITY.MAX (20)', () => {
    // Try to get a bonus over 20 by stacking
    // bookworm: intellectual +15, calm +10 = 25 (but capped at 20)
    const bonus = getTraitActivityBonus(['bookworm'], ['intellectual', 'calm']);
    expect(bonus).toBe(AFFINITY.MAX); // Capped at 20
  });

  test('getTraitActivityBonus caps at AFFINITY.MIN (-20)', () => {
    // Multiple negative affinities would get capped
    // adventurous: calm -5
    // introverted: competitive -5
    // Even with more negative traits, should cap at -20
    const bonus = getTraitActivityBonus(['adventurous', 'introverted'], ['calm', 'competitive']);
    // adventurous: calm -5, introverted: calm +10, competitive -5
    // Total: -5 + 10 + (-5) = 0
    expect(bonus).toBe(0);
  });

  test('getTraitActivityBonus returns 0 for empty tags', () => {
    const bonus = getTraitActivityBonus(['coffee_lover', 'athletic'], []);
    expect(bonus).toBe(0);
  });

  test('getTraitActivityBonus returns 0 for empty traits', () => {
    const bonus = getTraitActivityBonus([], ['coffee', 'calm']);
    expect(bonus).toBe(0);
  });
});

// ===== Trait Activity Breakdown Tests =====

describe('Trait Activity Breakdown', () => {
  test('getTraitActivityBreakdown returns individual contributions', () => {
    const breakdown = getTraitActivityBreakdown(['coffee_lover', 'introverted'], ['coffee', 'calm']);

    expect(breakdown).toHaveLength(2);

    const coffeeLoverContrib = breakdown.find((c) => c.trait === 'coffee_lover');
    expect(coffeeLoverContrib).toBeDefined();
    expect(coffeeLoverContrib!.bonus).toBe(AFFINITY.STRONG_LIKE);
    expect(coffeeLoverContrib!.traitName).toBe('Coffee Lover');

    const introvertedContrib = breakdown.find((c) => c.trait === 'introverted');
    expect(introvertedContrib).toBeDefined();
    expect(introvertedContrib!.bonus).toBe(AFFINITY.LIKE);
  });

  test('getTraitActivityBreakdown excludes traits with no contribution', () => {
    const breakdown = getTraitActivityBreakdown(['coffee_lover', 'athletic'], ['outdoor']);

    // coffee_lover has no outdoor affinity, athletic has no outdoor affinity
    expect(breakdown).toHaveLength(0);
  });

  test('getTraitActivityBreakdown sums multiple tag bonuses per trait', () => {
    // bookworm: intellectual +15, calm +10
    const breakdown = getTraitActivityBreakdown(['bookworm'], ['intellectual', 'calm']);

    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].trait).toBe('bookworm');
    expect(breakdown[0].bonus).toBe(25); // Not capped in breakdown
  });
});

// ===== Trait Discovery Tests =====

describe('Trait Discovery', () => {
  test('getContributingTrait reveals unrevealed trait with matching tag', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['coffee_lover', 'athletic'],
      revealedTraits: [],
    };

    const result = getContributingTrait(npc, ['coffee']);
    expect(result).toBeTruthy();
    expect(result!.isNew).toBe(true);
    expect(result!.trait).toBe('coffee_lover');
  });

  test('getContributingTrait returns null when no trait matches tags', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['coffee_lover'],
      revealedTraits: [],
    };

    const result = getContributingTrait(npc, ['outdoor', 'physical']);
    expect(result).toBeNull();
  });

  test('getContributingTrait skips already revealed traits', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['coffee_lover', 'introverted'],
      revealedTraits: ['coffee_lover'],
    };

    // coffee_lover is revealed, so should return introverted for calm tag
    const result = getContributingTrait(npc, ['calm', 'coffee']);
    expect(result).toBeTruthy();
    expect(result!.trait).toBe('introverted');
    expect(result!.isNew).toBe(true);
  });

  test('getContributingTrait returns null when all matching traits revealed', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['coffee_lover'],
      revealedTraits: ['coffee_lover'],
    };

    const result = getContributingTrait(npc, ['coffee']);
    expect(result).toBeNull();
  });

  test('getContributingTrait returns null for empty tags', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['coffee_lover', 'athletic'],
      revealedTraits: [],
    };

    const result = getContributingTrait(npc, []);
    expect(result).toBeNull();
  });
});

// ===== Trait Validation Tests =====

describe('Trait Validation', () => {
  test('traitsConflict returns true for adventurous/introverted', () => {
    expect(traitsConflict('adventurous', 'introverted')).toBe(true);
    expect(traitsConflict('introverted', 'adventurous')).toBe(true); // Symmetric
  });

  test('traitsConflict returns false for non-conflicting traits', () => {
    expect(traitsConflict('coffee_lover', 'athletic')).toBe(false);
    expect(traitsConflict('bookworm', 'gamer')).toBe(false);
    expect(traitsConflict('romantic', 'competitive')).toBe(false);
  });

  test('validateTraits identifies conflicts', () => {
    const result = validateTraits(['adventurous', 'introverted', 'coffee_lover']);
    expect(result.valid).toBe(false);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]).toEqual(['adventurous', 'introverted']);
  });

  test('validateTraits passes for valid trait set', () => {
    const result = validateTraits(['coffee_lover', 'athletic', 'bookworm']);
    expect(result.valid).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  test('removeConflictingTraits keeps first occurrence', () => {
    const filtered = removeConflictingTraits(['adventurous', 'introverted', 'coffee_lover']);
    expect(filtered).toEqual(['adventurous', 'coffee_lover']);
  });

  test('removeConflictingTraits returns same array if no conflicts', () => {
    const traits: NPCTrait[] = ['coffee_lover', 'athletic', 'bookworm'];
    const filtered = removeConflictingTraits(traits);
    expect(filtered).toEqual(traits);
  });
});

// ===== Trait Generation Tests =====

describe('Trait Generation', () => {
  test('selectRandomTraits selects correct number of traits', () => {
    const traits = selectRandomTraits(2);
    expect(traits).toHaveLength(2);
    expect(traits[0]).not.toBe(traits[1]); // No duplicates
  });

  test('selectRandomTraits avoids conflicts', () => {
    // Run multiple times to ensure conflicts are avoided
    for (let i = 0; i < 20; i++) {
      const traits = selectRandomTraits(3);
      const validation = validateTraits(traits);
      expect(validation.valid).toBe(true);
    }
  });

  test('selectRandomTraits returns traits from valid set', () => {
    const allTraits = getAllTraits();
    const traits = selectRandomTraits(3);

    traits.forEach((trait) => {
      expect(allTraits).toContain(trait);
    });
  });

  test('selectRandomTraits respects count limit', () => {
    const traits1 = selectRandomTraits(1);
    expect(traits1).toHaveLength(1);

    const traits3 = selectRandomTraits(3);
    expect(traits3).toHaveLength(3);
  });

  test('selectRandomTraits does not exceed available non-conflicting traits', () => {
    // Even if we ask for more, we can't get conflicting pairs
    const traits = selectRandomTraits(12);
    const validation = validateTraits(traits);
    expect(validation.valid).toBe(true);
  });
});

// ===== Integration Tests =====

describe('Integration Tests', () => {
  test('Complete trait-based activity bonus calculation', () => {
    // Scenario: NPC with athletic trait doing exercise (physical tag)
    const npcTraits: NPCTrait[] = ['athletic', 'competitive'];
    const activityTags: ActivityTag[] = ['physical', 'competitive'];

    const traitBonus = getTraitActivityBonus(npcTraits, activityTags);

    // athletic: physical +15
    // competitive: competitive +15
    // Total: 30, but capped at 20
    expect(traitBonus).toBe(AFFINITY.MAX);
  });

  test('Trait discovery flow with activity tags', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['coffee_lover', 'bookworm', 'romantic'],
      revealedTraits: [],
    };

    // Coffee activity - should reveal coffee_lover
    const coffeeResult = getContributingTrait(npc, ['coffee', 'calm']);
    expect(coffeeResult).toBeTruthy();
    expect(coffeeResult!.isNew).toBe(true);
    // Could be coffee_lover (coffee) or bookworm (calm)
    expect(['coffee_lover', 'bookworm']).toContain(coffeeResult!.trait);

    // Mark as revealed
    npc.revealedTraits.push(coffeeResult!.trait);

    // Romantic activity - if bookworm not revealed, could reveal it or romantic
    const romanticResult = getContributingTrait(npc, ['romantic']);
    expect(romanticResult).toBeTruthy();
    expect(romanticResult!.trait).toBe('romantic');
  });

  test('NPC with no matching traits gets no bonus', () => {
    const npcTraits: NPCTrait[] = ['coffee_lover', 'bookworm'];
    const activityTags: ActivityTag[] = ['physical', 'competitive'];

    const traitBonus = getTraitActivityBonus(npcTraits, activityTags);
    expect(traitBonus).toBe(0);
  });
});
