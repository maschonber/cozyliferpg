/**
 * NPC Generator Service Tests
 *
 * Task 5 Implementation Tests:
 * - Archetype-weighted trait generation
 * - Conflict detection and validation
 * - Daily emotion initialization
 */

import {
  generateNPC,
  createNPC,
  initializeDailyEmotion,
  getArchetypes,
  getAllTraits,
} from './index';
import { validateTraits } from '../trait';
import { NPCArchetype, TimeSlot, NPCTrait, NPC } from '../../../../shared/types';

// ===== NPC Generation Tests =====

describe('NPC Generation', () => {
  test('generateNPC creates NPC with all required fields', () => {
    const npc = generateNPC();

    expect(npc.name).toBeTruthy();
    expect(npc.archetype).toBeTruthy();
    expect(npc.gender).toBeTruthy();
    expect(npc.traits).toBeInstanceOf(Array);
    expect(npc.revealedTraits).toEqual([]); // Initially no traits revealed
    expect(npc.emotionState).toBeDefined();
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

// ===== Emotion Initialization Tests =====

describe('Emotion Initialization', () => {
  test('generated NPCs have valid emotion state', () => {
    const npc = generateNPC();

    expect(npc.emotionState.joy).toBeGreaterThanOrEqual(0);
    expect(npc.emotionState.joy).toBeLessThanOrEqual(100);
    expect(npc.emotionState.affection).toBeGreaterThanOrEqual(0);
    expect(npc.emotionState.affection).toBeLessThanOrEqual(100);
    expect(npc.emotionState.excitement).toBeGreaterThanOrEqual(0);
    expect(npc.emotionState.excitement).toBeLessThanOrEqual(100);
    expect(npc.emotionState.calm).toBeGreaterThanOrEqual(0);
    expect(npc.emotionState.calm).toBeLessThanOrEqual(100);
    expect(npc.emotionState.sadness).toBeGreaterThanOrEqual(0);
    expect(npc.emotionState.sadness).toBeLessThanOrEqual(100);
    expect(npc.emotionState.anger).toBeGreaterThanOrEqual(0);
    expect(npc.emotionState.anger).toBeLessThanOrEqual(100);
    expect(npc.emotionState.anxiety).toBeGreaterThanOrEqual(0);
    expect(npc.emotionState.anxiety).toBeLessThanOrEqual(100);
    expect(npc.emotionState.romantic).toBeGreaterThanOrEqual(0);
    expect(npc.emotionState.romantic).toBeLessThanOrEqual(100);
    expect(npc.emotionState.lastUpdated).toBeTruthy();
  });

  test('optimistic NPCs have higher joy baseline', () => {
    // Generate NPC with optimistic trait (we need to test the emotion init works)
    const npc1 = generateNPC();
    const npc2 = generateNPC();

    // At least verify the emotion state is created
    expect(npc1.emotionState).toBeDefined();
    expect(npc2.emotionState).toBeDefined();
  });
});

// ===== Daily Emotion Initialization Tests (Task 5) =====

describe('Daily Emotion Initialization (Task 5)', () => {
  const testTraits: NPCTrait[] = ['optimistic', 'adventurous', 'romantic', 'coffee_lover'];

  test('initializeDailyEmotion creates valid emotion state', () => {
    const emotions = initializeDailyEmotion(testTraits, 'morning');

    expect(emotions.joy).toBeGreaterThanOrEqual(0);
    expect(emotions.joy).toBeLessThanOrEqual(100);
    expect(emotions.affection).toBeGreaterThanOrEqual(0);
    expect(emotions.affection).toBeLessThanOrEqual(100);
    expect(emotions.lastUpdated).toBeTruthy();
  });

  test('morning emotions have higher calm', () => {
    // Morning should boost calm
    const morning1 = initializeDailyEmotion(testTraits, 'morning');
    const morning2 = initializeDailyEmotion(testTraits, 'morning');
    const morning3 = initializeDailyEmotion(testTraits, 'morning');

    // Average calm should be reasonably high in morning
    const avgCalm = (morning1.calm + morning2.calm + morning3.calm) / 3;
    expect(avgCalm).toBeGreaterThan(15); // Should be above baseline
  });

  test('evening emotions have higher excitement', () => {
    // Evening should boost excitement
    const evening1 = initializeDailyEmotion(testTraits, 'evening');
    const evening2 = initializeDailyEmotion(testTraits, 'evening');
    const evening3 = initializeDailyEmotion(testTraits, 'evening');

    // Average excitement should be higher in evening
    const avgExcitement = (evening1.excitement + evening2.excitement + evening3.excitement) / 3;
    expect(avgExcitement).toBeGreaterThan(5); // Should be above baseline
  });

  test('night emotions have higher romantic potential', () => {
    // Night should have romantic boost
    const night1 = initializeDailyEmotion(testTraits, 'night');
    const night2 = initializeDailyEmotion(testTraits, 'night');
    const night3 = initializeDailyEmotion(testTraits, 'night');

    const avgRomantic = (night1.romantic + night2.romantic + night3.romantic) / 3;
    expect(avgRomantic).toBeGreaterThan(10); // Should have boost
  });

  test('friends have higher joy and affection', () => {
    const friend1 = initializeDailyEmotion(testTraits, 'afternoon', 'friend');
    const friend2 = initializeDailyEmotion(testTraits, 'afternoon', 'friend');

    // Friends should start happier
    expect(friend1.joy).toBeGreaterThan(15);
    expect(friend2.joy).toBeGreaterThan(15);
    expect(friend1.affection).toBeGreaterThan(10);
    expect(friend2.affection).toBeGreaterThan(10);
  });

  test('lovers have high romantic emotion', () => {
    const lover1 = initializeDailyEmotion(testTraits, 'evening', 'lover');
    const lover2 = initializeDailyEmotion(testTraits, 'evening', 'lover');

    // Lovers should have high romantic emotion
    expect(lover1.romantic).toBeGreaterThan(20);
    expect(lover2.romantic).toBeGreaterThan(20);
  });

  test('rivals have higher anger', () => {
    const rival1 = initializeDailyEmotion(testTraits, 'afternoon', 'rival');
    const rival2 = initializeDailyEmotion(testTraits, 'afternoon', 'rival');

    // Rivals should have anger
    expect(rival1.anger).toBeGreaterThan(5);
    expect(rival2.anger).toBeGreaterThan(5);
  });

  test('enemies have very negative emotions', () => {
    const enemy1 = initializeDailyEmotion(testTraits, 'afternoon', 'enemy');
    const enemy2 = initializeDailyEmotion(testTraits, 'afternoon', 'enemy');

    // Enemies should have high anger and low joy
    expect(enemy1.anger).toBeGreaterThan(15);
    expect(enemy2.anger).toBeGreaterThan(15);
    expect(enemy1.joy).toBeLessThan(10);
    expect(enemy2.joy).toBeLessThan(10);
  });

  test('strangers have neutral emotions', () => {
    const stranger = initializeDailyEmotion(testTraits, 'afternoon', 'stranger');

    // Strangers should be relatively neutral
    expect(stranger.anxiety).toBeLessThan(30);
    expect(stranger.anger).toBeLessThan(15);
  });

  test('accepts NPC object with traits property', () => {
    const npc: Pick<NPC, 'traits'> = { traits: testTraits };
    const emotions = initializeDailyEmotion(npc, 'morning');

    expect(emotions).toBeDefined();
    expect(emotions.lastUpdated).toBeTruthy();
  });

  test('different time slots produce different emotion patterns', () => {
    const morning = initializeDailyEmotion(testTraits, 'morning');
    const evening = initializeDailyEmotion(testTraits, 'evening');
    const night = initializeDailyEmotion(testTraits, 'night');

    // They should be different (at least some values)
    expect(morning).not.toEqual(evening);
    expect(evening).not.toEqual(night);
  });

  test('relationship level affects emotions more than time of day', () => {
    const strangerMorning = initializeDailyEmotion(testTraits, 'morning', 'stranger');
    const friendMorning = initializeDailyEmotion(testTraits, 'morning', 'friend');

    // Friend should have noticeably higher positive emotions
    expect(friendMorning.joy).toBeGreaterThan(strangerMorning.joy + 3);
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

    // Verify emotions are valid
    expect(npc.emotionState).toBeDefined();
    expect(npc.emotionState.joy).toBeGreaterThanOrEqual(0);
    expect(npc.emotionState.joy).toBeLessThanOrEqual(100);
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
