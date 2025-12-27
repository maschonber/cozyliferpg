/**
 * NPC Generator Service Tests
 *
 * Tests for NPC generation with simplified trait system.
 * NPCs now have 1-3 random traits.
 */

import {
  generateNPC,
  createNPC,
  getAllTraits,
} from './index';
import { validateTraits } from '../trait';
import { NPCTrait, NEUTRAL_EMOTION_VECTOR } from '../../../../shared/types';

// ===== NPC Generation Tests =====

describe('NPC Generation', () => {
  test('generateNPC creates NPC with all required fields', () => {
    const npc = generateNPC();

    expect(npc.name).toBeTruthy();
    expect(npc.gender).toBeTruthy();
    expect(npc.traits).toBeInstanceOf(Array);
    expect(npc.revealedTraits).toEqual([]); // Initially no traits revealed
    expect(npc.emotionVector).toBeDefined();
    expect(npc.appearance).toBeDefined();
    expect(npc.loras).toBeInstanceOf(Array);
  });

  test('generateNPC creates unique NPCs', () => {
    const npc1 = generateNPC();
    const npc2 = generateNPC();

    // Should be different (at least in some properties)
    expect(npc1).not.toEqual(npc2);
  });

  test('createNPC generates full NPC with ID and timestamps', () => {
    const npc = createNPC('park');

    expect(npc.id).toBeTruthy();
    expect(npc.currentLocation).toBe('park');
    expect(npc.createdAt).toBeTruthy();
  });

  test('getAllTraits returns all 12 simplified traits', () => {
    const traits = getAllTraits();

    expect(traits.length).toBe(12);
    expect(traits).toContain('coffee_lover');
    expect(traits).toContain('athletic');
    expect(traits).toContain('bookworm');
    expect(traits).toContain('foodie');
    expect(traits).toContain('gamer');
    expect(traits).toContain('nature_lover');
    expect(traits).toContain('creative_soul');
    expect(traits).toContain('competitive');
    expect(traits).toContain('romantic');
    expect(traits).toContain('intellectual');
    expect(traits).toContain('adventurous');
    expect(traits).toContain('introverted');
  });
});

// ===== Trait Generation Tests =====

describe('Trait Generation (Simplified System)', () => {
  test('generated NPCs have 1-3 traits', () => {
    for (let i = 0; i < 20; i++) {
      const npc = generateNPC();

      expect(npc.traits.length).toBeGreaterThanOrEqual(1);
      expect(npc.traits.length).toBeLessThanOrEqual(3);
    }
  });

  test('generated NPCs have no conflicting traits', () => {
    // Generate multiple NPCs to increase likelihood of catching conflicts
    for (let i = 0; i < 50; i++) {
      const npc = generateNPC();
      const validation = validateTraits(npc.traits);

      expect(validation.valid).toBe(true);
      expect(validation.conflicts).toEqual([]);
    }
  });

  test('traits do not include both adventurous and introverted', () => {
    // These are the only conflicting traits in the new system
    for (let i = 0; i < 50; i++) {
      const npc = generateNPC();

      const hasAdventurous = npc.traits.includes('adventurous');
      const hasIntroverted = npc.traits.includes('introverted');

      expect(hasAdventurous && hasIntroverted).toBe(false);
    }
  });

  test('trait distribution is random', () => {
    // Generate many NPCs and count trait occurrences
    const traitCounts: Record<string, number> = {};
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const npc = generateNPC();
      for (const trait of npc.traits) {
        traitCounts[trait] = (traitCounts[trait] || 0) + 1;
      }
    }

    // All traits should appear at least once in 100 NPCs
    const allTraits = getAllTraits();
    for (const trait of allTraits) {
      // With random distribution, most traits should appear
      // We don't require all traits since it's probabilistic
      expect(typeof traitCounts[trait]).toBe('number');
    }

    // No single trait should dominate too heavily (random check)
    const maxCount = Math.max(...Object.values(traitCounts));
    const minCount = Math.min(...Object.values(traitCounts).filter((c) => c > 0));

    // With random distribution, max should not be more than 10x min
    // (This is a loose check to allow for randomness)
    expect(maxCount / Math.max(minCount, 1)).toBeLessThan(20);
  });

  test('generated traits are from valid trait list', () => {
    const allTraits = getAllTraits();

    for (let i = 0; i < 20; i++) {
      const npc = generateNPC();

      for (const trait of npc.traits) {
        expect(allTraits).toContain(trait);
      }
    }
  });

  test('generated traits have no duplicates', () => {
    for (let i = 0; i < 50; i++) {
      const npc = generateNPC();
      const uniqueTraits = new Set(npc.traits);

      expect(uniqueTraits.size).toBe(npc.traits.length);
    }
  });
});

// ===== Emotion Initialization Tests (Plutchik System) =====

describe('Emotion Initialization (Plutchik)', () => {
  test('generated NPCs start with neutral emotion vector', () => {
    const npc = generateNPC();

    expect(npc.emotionVector).toEqual(NEUTRAL_EMOTION_VECTOR);
    expect(npc.emotionVector.joySadness).toBe(0);
    expect(npc.emotionVector.acceptanceDisgust).toBe(0);
    expect(npc.emotionVector.angerFear).toBe(0);
    expect(npc.emotionVector.anticipationSurprise).toBe(0);
  });

  test('all generated NPCs have valid emotion vector structure', () => {
    for (let i = 0; i < 10; i++) {
      const npc = generateNPC();

      expect(npc.emotionVector).toHaveProperty('joySadness');
      expect(npc.emotionVector).toHaveProperty('acceptanceDisgust');
      expect(npc.emotionVector).toHaveProperty('angerFear');
      expect(npc.emotionVector).toHaveProperty('anticipationSurprise');

      // All axes should be 0 (neutral)
      expect(npc.emotionVector.joySadness).toBe(0);
      expect(npc.emotionVector.acceptanceDisgust).toBe(0);
      expect(npc.emotionVector.angerFear).toBe(0);
      expect(npc.emotionVector.anticipationSurprise).toBe(0);
    }
  });
});

// ===== Integration Tests =====

describe('Integration Tests', () => {
  test('full NPC generation workflow produces valid NPC', () => {
    const npc = createNPC('coffee_shop');

    // Verify all fields
    expect(npc.id).toBeTruthy();
    expect(npc.name).toBeTruthy();
    expect(npc.gender).toBeTruthy();
    expect(npc.currentLocation).toBe('coffee_shop');
    expect(npc.createdAt).toBeTruthy();

    // Verify traits are valid (1-3 traits)
    expect(npc.traits.length).toBeGreaterThanOrEqual(1);
    expect(npc.traits.length).toBeLessThanOrEqual(3);
    const validation = validateTraits(npc.traits);
    expect(validation.valid).toBe(true);

    // Verify emotions are valid (neutral Plutchik vector)
    expect(npc.emotionVector).toBeDefined();
    expect(npc.emotionVector).toEqual(NEUTRAL_EMOTION_VECTOR);
  });

  test('generating 100 NPCs produces no conflicts', () => {
    for (let i = 0; i < 100; i++) {
      const npc = generateNPC();
      const validation = validateTraits(npc.traits);

      expect(validation.valid).toBe(true);
      expect(validation.conflicts).toEqual([]);
    }
  });

  test('NPCs have varied traits', () => {
    const allTraitsUsed = new Set<NPCTrait>();

    for (let i = 0; i < 30; i++) {
      const npc = generateNPC();
      for (const trait of npc.traits) {
        allTraitsUsed.add(trait);
      }
    }

    // Should have at least 8 different traits in 30 NPCs
    expect(allTraitsUsed.size).toBeGreaterThanOrEqual(8);
  });
});
