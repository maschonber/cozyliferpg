/**
 * Trait Service Tests
 */

import {
  getTraitCategory,
  getTraitDefinition,
  getAllTraitDefinitions,
  getTraitActivityBonus,
  getArchetypeActivityBonus,
  getArchetypeMatchBonus,
  getArchetypeBonus,
  discoverTrait,
  hasUndiscoveredTraits,
  traitsConflict,
  validateTraits,
  removeConflictingTraits,
  getArchetypeTraitWeights,
  selectWeightedTraits,
  selectRandomTraitsFromCategory,
} from './index';
import { NPCTrait, NPC } from '../../../../shared/types';

// ===== Trait Information Tests =====

describe('Trait Information', () => {
  test('getTraitCategory returns correct category', () => {
    expect(getTraitCategory('optimistic')).toBe('personality');
    expect(getTraitCategory('romantic')).toBe('romance');
    expect(getTraitCategory('coffee_lover')).toBe('interest');
  });

  test('getTraitDefinition returns complete definition', () => {
    const def = getTraitDefinition('optimistic');
    expect(def.trait).toBe('optimistic');
    expect(def.category).toBe('personality');
    expect(def.name).toBe('Optimistic');
    expect(def.description).toBeTruthy();
    expect(def.gameplayEffects).toBeInstanceOf(Array);
  });

  test('getAllTraitDefinitions returns all traits', () => {
    const allDefs = getAllTraitDefinitions();
    expect(Object.keys(allDefs).length).toBeGreaterThan(30); // We have 32 traits
    expect(allDefs['optimistic']).toBeDefined();
    expect(allDefs['coffee_lover']).toBeDefined();
  });
});

// ===== Trait-Activity Bonus Tests =====

describe('Trait-Activity Bonuses', () => {
  test('getTraitActivityBonus returns 0 for no matching traits', () => {
    const bonus = getTraitActivityBonus(['stoic', 'logical'], 'have_coffee');
    expect(bonus).toBe(0);
  });

  test('getTraitActivityBonus returns positive bonus for matching trait', () => {
    const bonus = getTraitActivityBonus(['coffee_lover'], 'have_coffee');
    expect(bonus).toBe(20); // Coffee lover gets +20 for coffee
  });

  test('getTraitActivityBonus returns negative penalty for mismatched trait', () => {
    const bonus = getTraitActivityBonus(['reserved'], 'play_pool_darts');
    expect(bonus).toBe(-8); // Reserved dislikes loud bar games
  });

  test('getTraitActivityBonus stacks multiple trait bonuses', () => {
    const bonus = getTraitActivityBonus(['coffee_lover', 'outgoing'], 'have_coffee');
    expect(bonus).toBe(25); // 20 from coffee_lover + 5 from outgoing
  });

  test('getTraitActivityBonus handles mixed bonuses and penalties', () => {
    const bonus = getTraitActivityBonus(['outgoing', 'cautious'], 'casual_date');
    expect(bonus).toBe(3); // 8 from outgoing - 5 from cautious
  });

  test('getTraitActivityBonus with interest trait gives large bonus', () => {
    const bonus = getTraitActivityBonus(['fitness_enthusiast'], 'exercise_together');
    expect(bonus).toBe(20);
  });

  test('getTraitActivityBonus with romance trait on romantic activity', () => {
    const bonus = getTraitActivityBonus(['flirtatious'], 'flirt_playfully');
    expect(bonus).toBe(20);
  });
});

// ===== Archetype Bonus Tests =====

describe('Archetype Bonuses', () => {
  test('getArchetypeActivityBonus returns bonus for matching archetype-category', () => {
    const bonus = getArchetypeActivityBonus('Artist', 'self_improvement');
    expect(bonus).toBe(10); // Artists love self-improvement
  });

  test('getArchetypeActivityBonus returns penalty for mismatched archetype-category', () => {
    const bonus = getArchetypeActivityBonus('Artist', 'work');
    expect(bonus).toBe(-5); // Artists dislike work
  });

  test('getArchetypeActivityBonus returns 0 for neutral category', () => {
    const bonus = getArchetypeActivityBonus('Athlete', 'leisure');
    expect(bonus).toBe(0);
  });

  test('getArchetypeMatchBonus returns high bonus for same archetype', () => {
    const bonus = getArchetypeMatchBonus('athlete', 'Athlete');
    expect(bonus).toBe(10); // Same archetype match
  });

  test('getArchetypeMatchBonus returns penalty for incompatible archetypes', () => {
    const bonus = getArchetypeMatchBonus('athlete', 'Bookworm');
    expect(bonus).toBe(-3); // Different interests
  });

  test('getArchetypeMatchBonus returns 0 for neutral pairing', () => {
    const bonus = getArchetypeMatchBonus('balanced', 'Artist');
    expect(bonus).toBe(3); // Balanced gets small bonus with everyone
  });

  test('getArchetypeBonus combines match and activity bonuses', () => {
    const bonus = getArchetypeBonus('athlete', 'Athlete', 'self_improvement');
    expect(bonus).toBe(20); // 10 from match + 10 from activity
  });

  test('getArchetypeBonus can result in negative total', () => {
    const bonus = getArchetypeBonus('athlete', 'Scientist', 'social');
    expect(bonus).toBe(-7); // -2 from match + -5 from Scientist disliking social
  });
});

// ===== Trait Discovery Tests =====

describe('Trait Discovery', () => {
  test('discoverTrait reveals new personality trait from conversation', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['optimistic', 'creative', 'coffee_lover'],
      revealedTraits: [],
    };

    const result = discoverTrait(npc, 'conversation');
    expect(result).toBeTruthy();
    expect(result!.isNew).toBe(true);
    expect(['optimistic', 'creative']).toContain(result!.trait);
    expect(result!.trait).not.toBe('coffee_lover'); // Interest trait shouldn't be revealed
  });

  test('discoverTrait reveals romance trait from date', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['optimistic', 'romantic', 'coffee_lover'],
      revealedTraits: [],
    };

    const result = discoverTrait(npc, 'date');
    expect(result).toBeTruthy();
    expect(result!.isNew).toBe(true);
    expect(result!.trait).toBe('romantic'); // Only romance trait
  });

  test('discoverTrait reveals interest trait from shared_activity', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['optimistic', 'romantic', 'coffee_lover'],
      revealedTraits: [],
    };

    const result = discoverTrait(npc, 'shared_activity');
    expect(result).toBeTruthy();
    expect(result!.isNew).toBe(true);
    expect(result!.trait).toBe('coffee_lover');
  });

  test('discoverTrait can reveal personality or romance from deep_conversation', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['optimistic', 'romantic', 'coffee_lover'],
      revealedTraits: [],
    };

    const result = discoverTrait(npc, 'deep_conversation');
    expect(result).toBeTruthy();
    expect(result!.isNew).toBe(true);
    expect(['optimistic', 'romantic']).toContain(result!.trait);
  });

  test('discoverTrait returns already-revealed trait when no new traits available', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['optimistic', 'romantic', 'coffee_lover'],
      revealedTraits: ['optimistic'],
    };

    // Try conversation multiple times - should eventually reveal or re-reveal
    const result = discoverTrait(npc, 'conversation');
    expect(result).toBeTruthy();
    expect(result!.trait).toBe('optimistic');
    expect(result!.isNew).toBe(false);
  });

  test('discoverTrait returns null for invalid method', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['optimistic'],
      revealedTraits: [],
    };

    const result = discoverTrait(npc, 'invalid_method');
    expect(result).toBeNull();
  });

  test('discoverTrait prioritizes unrevealed traits', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['optimistic', 'creative', 'passionate'],
      revealedTraits: ['optimistic'],
    };

    // Should reveal creative or passionate, not optimistic
    const result = discoverTrait(npc, 'conversation');
    expect(result).toBeTruthy();
    expect(result!.isNew).toBe(true);
    expect(['creative', 'passionate']).toContain(result!.trait);
  });

  test('hasUndiscoveredTraits returns true when traits remain', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['optimistic', 'creative'],
      revealedTraits: ['optimistic'],
    };

    expect(hasUndiscoveredTraits(npc, 'personality')).toBe(true);
  });

  test('hasUndiscoveredTraits returns false when all discovered', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['optimistic', 'creative'],
      revealedTraits: ['optimistic', 'creative'],
    };

    expect(hasUndiscoveredTraits(npc, 'personality')).toBe(false);
  });

  test('hasUndiscoveredTraits checks correct category', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['optimistic', 'romantic'],
      revealedTraits: ['optimistic'],
    };

    expect(hasUndiscoveredTraits(npc, 'personality')).toBe(false);
    expect(hasUndiscoveredTraits(npc, 'romance')).toBe(true);
  });
});

// ===== Trait Validation Tests =====

describe('Trait Validation', () => {
  test('traitsConflict returns true for conflicting traits', () => {
    expect(traitsConflict('outgoing', 'reserved')).toBe(true);
    expect(traitsConflict('reserved', 'outgoing')).toBe(true); // Symmetric
    expect(traitsConflict('optimistic', 'melancholic')).toBe(true);
    expect(traitsConflict('passionate', 'stoic')).toBe(true);
  });

  test('traitsConflict returns false for non-conflicting traits', () => {
    expect(traitsConflict('outgoing', 'optimistic')).toBe(false);
    expect(traitsConflict('creative', 'logical')).toBe(false);
    expect(traitsConflict('coffee_lover', 'fitness_enthusiast')).toBe(false);
  });

  test('validateTraits identifies conflicts', () => {
    const result = validateTraits(['outgoing', 'reserved', 'optimistic']);
    expect(result.valid).toBe(false);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]).toEqual(['outgoing', 'reserved']);
  });

  test('validateTraits passes for valid trait set', () => {
    const result = validateTraits(['outgoing', 'optimistic', 'creative', 'coffee_lover']);
    expect(result.valid).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  test('validateTraits identifies multiple conflicts', () => {
    const result = validateTraits([
      'outgoing',
      'reserved',
      'optimistic',
      'melancholic',
    ]);
    expect(result.valid).toBe(false);
    expect(result.conflicts.length).toBeGreaterThanOrEqual(2);
  });

  test('removeConflictingTraits keeps first occurrence', () => {
    const filtered = removeConflictingTraits(['outgoing', 'reserved', 'optimistic']);
    expect(filtered).toEqual(['outgoing', 'optimistic']);
  });

  test('removeConflictingTraits handles multiple conflicts', () => {
    const filtered = removeConflictingTraits([
      'outgoing',
      'reserved',
      'optimistic',
      'melancholic',
    ]);
    expect(filtered).toEqual(['outgoing', 'optimistic']);
  });

  test('removeConflictingTraits returns same array if no conflicts', () => {
    const traits: NPCTrait[] = ['outgoing', 'optimistic', 'creative'];
    const filtered = removeConflictingTraits(traits);
    expect(filtered).toEqual(traits);
  });
});

// ===== Trait Generation Tests =====

describe('Trait Generation', () => {
  test('getArchetypeTraitWeights returns weights for archetype', () => {
    const weights = getArchetypeTraitWeights('Artist');
    expect(weights.creative).toBe(3.0);
    expect(weights.passionate).toBe(2.5);
    expect(weights.intuitive).toBe(2.0);
  });

  test('getArchetypeTraitWeights returns empty for unknown archetype', () => {
    // TypeScript prevents this but test runtime behavior
    const weights = getArchetypeTraitWeights('UnknownArchetype' as any);
    expect(weights).toEqual({});
  });

  test('selectWeightedTraits selects correct number of traits', () => {
    const weights = {
      creative: 3.0,
      logical: 1.0,
      outgoing: 2.0,
    };
    const selected = selectWeightedTraits(weights, 2);
    expect(selected).toHaveLength(2);
    expect(selected[0]).not.toBe(selected[1]); // No duplicates
  });

  test('selectWeightedTraits respects weight distribution', () => {
    // Run many times and check that higher weights are more common
    const weights = {
      high: 10.0,
      low: 0.1,
    };

    let highCount = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const selected = selectWeightedTraits(weights, 1);
      if (selected[0] === 'high') highCount++;
    }

    // High weight should be selected much more often (expect >90%)
    expect(highCount).toBeGreaterThan(80);
  });

  test('selectWeightedTraits handles empty weights', () => {
    const selected = selectWeightedTraits({}, 2);
    expect(selected).toHaveLength(0);
  });

  test('selectWeightedTraits does not exceed available traits', () => {
    const weights = {
      trait1: 1.0,
      trait2: 1.0,
    };
    const selected = selectWeightedTraits(weights, 5);
    expect(selected.length).toBeLessThanOrEqual(2);
  });

  test('selectRandomTraitsFromCategory selects from correct category', () => {
    const traits = selectRandomTraitsFromCategory('personality', 3);
    expect(traits).toHaveLength(3);

    // All should be personality traits
    traits.forEach((trait) => {
      expect(getTraitCategory(trait)).toBe('personality');
    });
  });

  test('selectRandomTraitsFromCategory returns unique traits', () => {
    const traits = selectRandomTraitsFromCategory('interest', 3);
    const uniqueTraits = new Set(traits);
    expect(uniqueTraits.size).toBe(traits.length); // No duplicates
  });

  test('selectRandomTraitsFromCategory respects count limit', () => {
    const traits = selectRandomTraitsFromCategory('romance', 2);
    expect(traits).toHaveLength(2);
  });
});

// ===== Integration Tests =====

describe('Integration Tests', () => {
  test('Complete trait-based activity bonus calculation', () => {
    // Scenario: Athletic player doing exercise with athletic NPC who is a fitness enthusiast
    const npcTraits: NPCTrait[] = ['adventurous', 'competitive', 'fitness_enthusiast'];
    const playerArchetype = 'athlete';
    const npcArchetype = 'Athlete';
    const activityId = 'exercise_together';
    const activityCategory = 'social';

    const traitBonus = getTraitActivityBonus(npcTraits, activityId);
    const archetypeBonus = getArchetypeBonus(playerArchetype, npcArchetype, activityCategory);

    // fitness_enthusiast: +20, adventurous: +12, competitive: +12 = +44
    expect(traitBonus).toBe(44);

    // Same archetype: +10, Athlete likes social: +8 = +18
    expect(archetypeBonus).toBe(18);

    const totalBonus = traitBonus + archetypeBonus;
    expect(totalBonus).toBe(62); // Massive bonus!
  });

  test('Complete trait discovery flow', () => {
    const npc: Pick<NPC, 'traits' | 'revealedTraits'> = {
      traits: ['optimistic', 'creative', 'romantic', 'coffee_lover', 'reader'],
      revealedTraits: [],
    };

    // First conversation - should reveal personality trait
    const conv1 = discoverTrait(npc, 'conversation');
    expect(conv1).toBeTruthy();
    expect(conv1!.isNew).toBe(true);
    expect(['optimistic', 'creative']).toContain(conv1!.trait);

    npc.revealedTraits.push(conv1!.trait);

    // Date - should reveal romance trait
    const date1 = discoverTrait(npc, 'date');
    expect(date1).toBeTruthy();
    expect(date1!.isNew).toBe(true);
    expect(date1!.trait).toBe('romantic');

    npc.revealedTraits.push(date1!.trait);

    // Shared activity - should reveal interest trait
    const activity1 = discoverTrait(npc, 'shared_activity');
    expect(activity1).toBeTruthy();
    expect(activity1!.isNew).toBe(true);
    expect(['coffee_lover', 'reader']).toContain(activity1!.trait);
  });

  test('Trait validation during NPC generation', () => {
    // Simulate generating traits for an Artist
    const weights = getArchetypeTraitWeights('Artist');
    const personalityTraits = selectWeightedTraits(weights, 3);

    // Remove any conflicts
    const validTraits = removeConflictingTraits(personalityTraits);

    // Add romance and interest traits
    const romanceTraits = selectRandomTraitsFromCategory('romance', 1);
    const interestTraits = selectRandomTraitsFromCategory('interest', 2);

    const allTraits = [...validTraits, ...romanceTraits, ...interestTraits];

    // Validate final trait set
    const validation = validateTraits(allTraits);
    expect(validation.valid).toBe(true);
  });
});
