/**
 * Social Activity Service Tests
 *
 * Comprehensive unit tests for Task 6: Social Activity Integration
 *
 * Note: Emotion-based difficulty modifiers and emotion effects have been removed.
 * These will be re-implemented with the Plutchik emotion system in a future phase.
 */

import {
  calculateDynamicDifficulty,
  getStreakModifier,
  updateStreak,
  shouldResetStreak,
  scaleRelationshipEffects,
  getActivityEffects,
  getDifficultyBreakdown,
  InteractionStreak,
} from './index';
import { RelationshipAxes, DifficultyBreakdown } from '../../../../shared/types';

// ===== Test Data =====

const neutralAxes: RelationshipAxes = {
  trust: 0,
  affection: 0,
  desire: 0,
};

const goodAxes: RelationshipAxes = {
  trust: 40,
  affection: 50,
  desire: 30,
};

// ===== Dynamic Difficulty Calculation Tests =====

describe('Social Activity Service - Dynamic Difficulty', () => {
  describe('calculateDynamicDifficulty', () => {
    it('should combine all difficulty modifiers correctly', () => {
      const result = calculateDynamicDifficulty(
        50,              // base difficulty
        -8,              // relationship modifier (friend bonus)
        3,               // NPC trait bonus (positive in config = easier)
        2,               // archetype bonus (positive in config = easier)
        undefined        // no streak
      );

      expect(result.baseDifficulty).toBe(50);
      expect(result.relationshipModifier).toBe(-8);         // Friend bonus
      expect(result.traitBonus).toBe(-5);                  // Negated bonuses reduce difficulty
      expect(result.streakModifier).toBe(0);               // No streak
      expect(result.finalDifficulty).toBeLessThan(50);     // Overall easier
    });

    it('should increase difficulty with negative factors', () => {
      const result = calculateDynamicDifficulty(
        30,              // base difficulty
        15,              // relationship penalty (rival)
        -3,              // NPC trait penalty (negative in config = harder)
        -2,              // archetype penalty (negative in config = harder)
        undefined
      );

      expect(result.relationshipModifier).toBe(15);        // Rival penalty
      expect(result.traitBonus).toBe(5);                   // Negated negative bonuses increase difficulty
      expect(result.finalDifficulty).toBeGreaterThan(30);  // Overall harder
    });

    it('should never return negative difficulty', () => {
      const result = calculateDynamicDifficulty(
        10,              // low base
        -15,             // big relationship bonus
        12,              // big NPC trait bonus (config positive = easier, negated = reduces)
        8,               // big archetype bonus (config positive = easier, negated = reduces)
        { consecutivePositive: 20, consecutiveNegative: 0, lastInteraction: new Date().toISOString(), lastDay: 1 }
      );

      expect(result.finalDifficulty).toBeGreaterThanOrEqual(0);
    });

    it('should include streak modifier when provided', () => {
      const positiveStreak: InteractionStreak = {
        consecutivePositive: 4,
        consecutiveNegative: 0,
        lastInteraction: new Date().toISOString(),
        lastDay: 1,
      };

      const result = calculateDynamicDifficulty(
        40,
        0,               // relationship modifier
        0,               // NPC trait bonus
        0,               // archetype bonus
        positiveStreak
      );

      expect(result.streakModifier).toBeLessThan(0);  // Positive streak = easier
    });

    it('should include trait breakdown when provided', () => {
      const individualTraits = [
        { trait: 'coffee_lover' as const, traitName: 'Coffee Lover', bonus: 20 },
        { trait: 'outgoing' as const, traitName: 'Outgoing', bonus: 5 },
      ];
      const archetypeDetails = {
        playerArchetype: 'social_butterfly' as const,
        npcArchetype: 'Musician' as const,
        activityCategory: 'social' as const,
        matchBonus: 10,
        activityAffinityBonus: 10,
        totalBonus: 20,
      };

      const result = calculateDynamicDifficulty(
        40,
        0,
        25,  // combined NPC trait bonus
        20,  // combined archetype bonus
        undefined,
        individualTraits,
        archetypeDetails
      );

      expect(result.traitBreakdown).toBeDefined();
      expect(result.traitBreakdown?.individualTraits).toBeDefined();
      expect(result.traitBreakdown?.archetypeDetails).toBeDefined();
      // Trait breakdown should be negated for display
      expect(result.traitBreakdown?.npcTraitBonus).toBe(-25);
      expect(result.traitBreakdown?.archetypeBonus).toBe(-20);
    });
  });
});

// ===== Streak System Tests =====

describe('Social Activity Service - Streak System', () => {
  describe('getStreakModifier', () => {
    it('should return negative modifier for positive streak', () => {
      const streak: InteractionStreak = {
        consecutivePositive: 4,
        consecutiveNegative: 0,
        lastInteraction: new Date().toISOString(),
        lastDay: 1,
      };

      const modifier = getStreakModifier(streak);
      expect(modifier).toBeLessThan(0);  // Easier
      expect(modifier).toBe(-2);  // 4 / 2 = -2
    });

    it('should return positive modifier for negative streak', () => {
      const streak: InteractionStreak = {
        consecutivePositive: 0,
        consecutiveNegative: 6,
        lastInteraction: new Date().toISOString(),
        lastDay: 1,
      };

      const modifier = getStreakModifier(streak);
      expect(modifier).toBeGreaterThan(0);  // Harder
      expect(modifier).toBe(3);  // 6 / 2 = 3
    });

    it('should return zero for no streak', () => {
      const streak: InteractionStreak = {
        consecutivePositive: 0,
        consecutiveNegative: 0,
        lastInteraction: new Date().toISOString(),
        lastDay: 1,
      };

      const modifier = getStreakModifier(streak);
      expect(modifier).toBe(0);
    });

    it('should cap modifier at max values', () => {
      const hugePositiveStreak: InteractionStreak = {
        consecutivePositive: 100,
        consecutiveNegative: 0,
        lastInteraction: new Date().toISOString(),
        lastDay: 1,
      };

      const modifier = getStreakModifier(hugePositiveStreak);
      expect(modifier).toBeGreaterThanOrEqual(-10);  // Capped at -10
    });
  });

  describe('updateStreak', () => {
    it('should initialize streak on first interaction', () => {
      const streak = updateStreak(undefined, 'best', 1);

      expect(streak.consecutivePositive).toBe(1);
      expect(streak.consecutiveNegative).toBe(0);
      expect(streak.lastDay).toBe(1);
    });

    it('should increment positive streak on positive outcome', () => {
      const currentStreak: InteractionStreak = {
        consecutivePositive: 2,
        consecutiveNegative: 0,
        lastInteraction: new Date().toISOString(),
        lastDay: 1,
      };

      const updated = updateStreak(currentStreak, 'best', 1);

      expect(updated.consecutivePositive).toBe(3);
      expect(updated.consecutiveNegative).toBe(0);
    });

    it('should reset positive streak and start negative on bad outcome', () => {
      const currentStreak: InteractionStreak = {
        consecutivePositive: 4,
        consecutiveNegative: 0,
        lastInteraction: new Date().toISOString(),
        lastDay: 1,
      };

      const updated = updateStreak(currentStreak, 'catastrophic', 1);

      expect(updated.consecutivePositive).toBe(0);
      expect(updated.consecutiveNegative).toBe(1);
    });

    it('should reset streak on new day', () => {
      const currentStreak: InteractionStreak = {
        consecutivePositive: 5,
        consecutiveNegative: 0,
        lastInteraction: new Date().toISOString(),
        lastDay: 1,
      };

      const updated = updateStreak(currentStreak, 'best', 2);  // New day

      expect(updated.consecutivePositive).toBe(1);  // Reset and start new
      expect(updated.lastDay).toBe(2);
    });

    it('should cap streak at maximum', () => {
      const currentStreak: InteractionStreak = {
        consecutivePositive: 20,  // Already at max
        consecutiveNegative: 0,
        lastInteraction: new Date().toISOString(),
        lastDay: 1,
      };

      const updated = updateStreak(currentStreak, 'best', 1);

      expect(updated.consecutivePositive).toBe(20);  // Capped, doesn't increase
    });
  });

  describe('shouldResetStreak', () => {
    it('should reset on new day', () => {
      const streak: InteractionStreak = {
        consecutivePositive: 3,
        consecutiveNegative: 0,
        lastInteraction: new Date().toISOString(),
        lastDay: 1,
      };

      const shouldReset = shouldResetStreak(streak, 2);
      expect(shouldReset).toBe(true);
    });

    it('should not reset on same day with recent interaction', () => {
      const streak: InteractionStreak = {
        consecutivePositive: 3,
        consecutiveNegative: 0,
        lastInteraction: new Date().toISOString(),  // Just now
        lastDay: 1,
      };

      const shouldReset = shouldResetStreak(streak, 1);
      expect(shouldReset).toBe(false);
    });

    it('should reset if time gap is too large', () => {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 25);  // 25 hours ago

      const streak: InteractionStreak = {
        consecutivePositive: 3,
        consecutiveNegative: 0,
        lastInteraction: yesterday.toISOString(),
        lastDay: 1,
      };

      const shouldReset = shouldResetStreak(streak, 1);
      expect(shouldReset).toBe(true);
    });
  });
});

// ===== Activity Outcome Effects Tests =====

describe('Social Activity Service - Outcome Effects', () => {
  describe('scaleRelationshipEffects', () => {
    const baseEffects: Partial<RelationshipAxes> = {
      affection: 10,
      trust: 5,
      desire: 8,
    };

    it('should scale effects by 1.5x for best outcome', () => {
      const scaled = scaleRelationshipEffects(baseEffects, 'best');

      expect(scaled.affection).toBe(15);  // 10 * 1.5
      expect(scaled.trust).toBe(8);       // 5 * 1.5 = 7.5 → 8 (rounded)
      expect(scaled.desire).toBe(12);     // 8 * 1.5
    });

    it('should keep effects unchanged for okay outcome', () => {
      const scaled = scaleRelationshipEffects(baseEffects, 'okay');

      expect(scaled.affection).toBe(10);
      expect(scaled.trust).toBe(5);
      expect(scaled.desire).toBe(8);
    });

    it('should have no effect for mixed outcome (0.0x scaling)', () => {
      const scaled = scaleRelationshipEffects(baseEffects, 'mixed');

      expect(scaled.affection).toBe(0);  // 10 * 0.0
      expect(scaled.trust).toBe(0);      // 5 * 0.0
      expect(scaled.desire).toBe(0);     // 8 * 0.0
    });

    it('should reverse effects by -0.5x for catastrophic outcome', () => {
      const scaled = scaleRelationshipEffects(baseEffects, 'catastrophic');

      expect(scaled.affection).toBe(-5); // 10 * -0.5
      expect(scaled.trust).toBe(-2);      // 5 * -0.5 = -2.5 → -2 (rounded)
      expect(scaled.desire).toBe(-4);    // 8 * -0.5 = -4
    });

    it('should handle partial effects', () => {
      const partialEffects: Partial<RelationshipAxes> = {
        affection: 15,
        // trust and desire not specified
      };

      const scaled = scaleRelationshipEffects(partialEffects, 'best');

      expect(scaled.affection).toBe(23);  // 15 * 1.5 = 22.5 → 23
      expect(scaled.trust).toBeUndefined();
      expect(scaled.desire).toBeUndefined();
    });
  });

  describe('getActivityEffects', () => {
    it('should return relationship effects only (emotion effects removed)', () => {
      const baseRelEffects: Partial<RelationshipAxes> = {
        affection: 10,
        desire: 5,
      };

      const effects = getActivityEffects(baseRelEffects, 'best');

      expect(effects.relationshipEffects).toBeDefined();
      expect(effects.relationshipEffects.affection).toBe(15);  // 10 * 1.5
      expect(effects.relationshipEffects.desire).toBe(8);      // 5 * 1.5 = 7.5 → 8
    });
  });
});

// ===== Display Functions Tests =====

describe('Social Activity Service - Display Functions', () => {
  describe('getDifficultyBreakdown', () => {
    it('should return breakdown of all modifiers', () => {
      const calculation: DifficultyBreakdown = {
        baseDifficulty: 40,
        relationshipModifier: -10,
        traitBonus: 5,
        streakModifier: -2,
        finalDifficulty: 33,
      };

      const breakdown = getDifficultyBreakdown(calculation);

      expect(breakdown).toHaveLength(4);  // Base + relationship + traits + streak
      expect(breakdown[0].source).toBe('Base');
      expect(breakdown[0].modifier).toBe(40);
    });

    it('should only include non-zero modifiers', () => {
      const calculation: DifficultyBreakdown = {
        baseDifficulty: 30,
        relationshipModifier: -5,
        traitBonus: 0,
        streakModifier: 0,
        finalDifficulty: 25,
      };

      const breakdown = getDifficultyBreakdown(calculation);

      expect(breakdown).toHaveLength(2);  // Only base and relationship
      expect(breakdown.some(b => b.source === 'Traits')).toBe(false);
    });

    it('should include helpful descriptions', () => {
      const calculation: DifficultyBreakdown = {
        baseDifficulty: 40,
        relationshipModifier: -10,
        traitBonus: 5,
        streakModifier: -2,
        finalDifficulty: 33,
      };

      const breakdown = getDifficultyBreakdown(calculation);

      // Find relationship modifier
      const relMod = breakdown.find(b => b.source === 'Relationship');
      expect(relMod?.description).toContain('Good');  // Negative modifier = good relationship

      // Find streak modifier
      const streakMod = breakdown.find(b => b.source === 'Streak');
      expect(streakMod?.description).toContain('positive');  // Negative modifier = positive streak
    });
  });
});

// ===== Integration Tests =====

describe('Social Activity Service - Integration', () => {
  it('should handle complete activity flow', () => {
    // Setup: Good relationship, matching traits, positive streak
    const relationshipMod = -8;
    const npcTraitBonus = 3;
    const archetypeBonus = 2;
    const streak: InteractionStreak = {
      consecutivePositive: 4,
      consecutiveNegative: 0,
      lastInteraction: new Date().toISOString(),
      lastDay: 1,
    };

    // Calculate difficulty
    const difficulty = calculateDynamicDifficulty(
      40,
      relationshipMod,
      npcTraitBonus,
      archetypeBonus,
      streak
    );

    expect(difficulty.finalDifficulty).toBeLessThan(40);  // Should be easier

    // Apply outcome effects
    const baseEffects: Partial<RelationshipAxes> = {
      affection: 10,
      trust: 5,
    };

    const effects = getActivityEffects(baseEffects, 'best');

    expect(effects.relationshipEffects.affection).toBeGreaterThan(10);  // Scaled up

    // Update streak
    const newStreak = updateStreak(streak, 'best', 1);

    expect(newStreak.consecutivePositive).toBe(5);  // Continued streak
  });

  it('should handle difficult scenario with negative factors', () => {
    // Setup: Bad relationship, mismatched traits, negative streak
    const relationshipMod = 15;  // Penalty
    const npcTraitBonus = -3;    // Penalty (negative in config = harder)
    const archetypeBonus = -2;   // Penalty (negative in config = harder)
    const streak: InteractionStreak = {
      consecutivePositive: 0,
      consecutiveNegative: 6,
      lastInteraction: new Date().toISOString(),
      lastDay: 1,
    };

    // Calculate difficulty
    const difficulty = calculateDynamicDifficulty(
      30,
      relationshipMod,
      npcTraitBonus,
      archetypeBonus,
      streak
    );

    expect(difficulty.finalDifficulty).toBeGreaterThan(30);  // Much harder

    // Mixed outcome should have no relationship change (balanced update)
    const effects = getActivityEffects({ desire: 12 }, 'mixed');

    expect(effects.relationshipEffects.desire).toBe(0);  // No change for mixed outcome
  });
});
