/**
 * NPC Generator Service Tests
 *
 * Task 5 Implementation Tests:
 * - Archetype-weighted trait generation
 * - Conflict detection and validation
 *
 * Note: Emotion initialization tests removed - NPCs now start with neutral emotions
 * (Plutchik system). Emotion modification will be implemented in a future phase.
 */

import {
  generateNPC,
  createNPC,
  getArchetypes,
  getAllTraits,
} from './index';
import { validateTraits } from '../trait';
import { NPCArchetype, NPCTrait, NPC, NEUTRAL_EMOTION_VECTOR } from '../../../../shared/types';

// ===== NPC Generation Tests =====

describe('NPC Generation', () => {
  test('generateNPC creates NPC with all required fields', () => {
    const npc = generateNPC();

    expect(npc.name).toBeTruthy();
    expect(npc.archetype).toBeTruthy();
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

  test('getArchetypes returns all archetype options', () => {
    const archetypes = getArchetypes();

    expect(archetypes).toContain('Artist');
    expect(archetypes).toContain('Athlete');
    expect(archetypes).toContain('Bookworm');
    expect(archetypes).toContain('Musician');
    expect(archetypes).toContain('Scientist');
    expect(archetypes.length).toBe(5);
  });

  test('getAllTraits returns all trait options', () => {
    const traits = getAllTraits();

    expect(traits.length).toBe(32); // 16 personality + 8 romance + 8 interest
    expect(traits).toContain('optimistic');
    expect(traits).toContain('romantic');
    expect(traits).toContain('coffee_lover');
  });
});

// ===== Trait Generation Tests =====

describe('Trait Generation (Task 5)', () => {
  test('generated NPCs have correct number of traits', () => {
    const npc = generateNPC();

    // Should have 2-3 personality + 1-2 romance + 2-3 interest = 5-8 total
    expect(npc.traits.length).toBeGreaterThanOrEqual(5);
    expect(npc.traits.length).toBeLessThanOrEqual(8);
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

  test('Artist archetype favors creative traits', () => {
    // Generate multiple Artists and check for trait distribution
    const artistCount = 20;
    let creativeCount = 0;
    let passionateCount = 0;
    let intuitiveCount = 0;

    // Mock Math.random to ensure we generate Artists
    const originalRandom = Math.random;
    let callCount = 0;

    for (let i = 0; i < artistCount; i++) {
      // Force Artist archetype selection
      Math.random = () => {
        callCount++;
        if (callCount % 100 < 20) return 0; // Select 'Artist' from archetype array
        return originalRandom();
      };

      const npc = generateNPC();

      if (npc.archetype === 'Artist') {
        if (npc.traits.includes('creative')) creativeCount++;
        if (npc.traits.includes('passionate')) passionateCount++;
        if (npc.traits.includes('intuitive')) intuitiveCount++;
      }
    }

    Math.random = originalRandom;

    // Artists should have higher probability of these traits
    // At least some Artists should have these traits (probabilistic test)
    expect(creativeCount).toBeGreaterThan(0);
  });

  test('Athlete archetype favors competitive traits', () => {
    // Generate multiple Athletes
    const athleteCount = 20;
    let competitiveCount = 0;
    let adventurousCount = 0;

    const originalRandom = Math.random;
    let callCount = 0;

    for (let i = 0; i < athleteCount; i++) {
      // Force Athlete archetype
      Math.random = () => {
        callCount++;
        if (callCount % 100 < 20) return 0.21; // Select 'Athlete'
        return originalRandom();
      };

      const npc = generateNPC();

      if (npc.archetype === 'Athlete') {
        if (npc.traits.includes('competitive')) competitiveCount++;
        if (npc.traits.includes('adventurous')) adventurousCount++;
      }
    }

    Math.random = originalRandom;

    expect(competitiveCount).toBeGreaterThan(0);
  });

  test('Bookworm archetype favors logical and reserved traits', () => {
    const bookwormCount = 20;
    let logicalCount = 0;
    let reservedCount = 0;

    const originalRandom = Math.random;
    let callCount = 0;

    for (let i = 0; i < bookwormCount; i++) {
      Math.random = () => {
        callCount++;
        if (callCount % 100 < 20) return 0.41; // Select 'Bookworm'
        return originalRandom();
      };

      const npc = generateNPC();

      if (npc.archetype === 'Bookworm') {
        if (npc.traits.includes('logical')) logicalCount++;
        if (npc.traits.includes('reserved')) reservedCount++;
      }
    }

    Math.random = originalRandom;

    // At least one Bookworm should have logical OR reserved (both weighted at 2.5)
    expect(logicalCount + reservedCount).toBeGreaterThan(0);
  });

  test('traits do not include both outgoing and reserved', () => {
    // These are conflicting traits
    for (let i = 0; i < 50; i++) {
      const npc = generateNPC();

      const hasOutgoing = npc.traits.includes('outgoing');
      const hasReserved = npc.traits.includes('reserved');

      expect(hasOutgoing && hasReserved).toBe(false);
    }
  });

  test('traits do not include both optimistic and melancholic', () => {
    for (let i = 0; i < 50; i++) {
      const npc = generateNPC();

      const hasOptimistic = npc.traits.includes('optimistic');
      const hasMelancholic = npc.traits.includes('melancholic');

      expect(hasOptimistic && hasMelancholic).toBe(false);
    }
  });

  test('traits do not include both adventurous and cautious', () => {
    for (let i = 0; i < 50; i++) {
      const npc = generateNPC();

      const hasAdventurous = npc.traits.includes('adventurous');
      const hasCautious = npc.traits.includes('cautious');

      expect(hasAdventurous && hasCautious).toBe(false);
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
    expect(npc.archetype).toBeTruthy();
    expect(npc.gender).toBeTruthy();
    expect(npc.currentLocation).toBe('coffee_shop');
    expect(npc.createdAt).toBeTruthy();

    // Verify traits are valid
    expect(npc.traits.length).toBeGreaterThan(0);
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

  test('NPCs have varied archetypes', () => {
    const archetypes = new Set<NPCArchetype>();

    for (let i = 0; i < 20; i++) {
      const npc = generateNPC();
      archetypes.add(npc.archetype);
    }

    // Should have at least 3 different archetypes in 20 NPCs
    expect(archetypes.size).toBeGreaterThanOrEqual(3);
  });
});
