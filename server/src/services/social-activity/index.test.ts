/**
 * Social Activity Service Tests
 *
 * Comprehensive unit tests for Task 6: Social Activity Integration
 *
 * Note: Emotion-based difficulty modifiers and emotion effects have been removed.
 * These will be re-implemented with the Plutchik emotion system in a future phase.
 *
 * Note: Streak system has been removed as it was never properly implemented.
 */

import {
  calculateDynamicDifficulty,
  scaleRelationshipEffects,
  getActivityEffects,
  getDifficultyBreakdown,
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
        5                // NPC trait bonus (positive in config = easier)
      );

      expect(result.baseDifficulty).toBe(50);
      expect(result.relationshipModifier).toBe(-8);         // Friend bonus
      expect(result.traitBonus).toBe(-5);                  // Negated bonus reduces difficulty
      expect(result.finalDifficulty).toBeLessThan(50);     // Overall easier
    });

    it('should increase difficulty with negative factors', () => {
      const result = calculateDynamicDifficulty(
        30,              // base difficulty
        15,              // relationship penalty (rival)
        -5               // NPC trait penalty (negative in config = harder)
      );

      expect(result.relationshipModifier).toBe(15);        // Rival penalty
      expect(result.traitBonus).toBe(5);                   // Negated negative bonus increases difficulty
      expect(result.finalDifficulty).toBeGreaterThan(30);  // Overall harder
    });

    it('should allow negative difficulty for very easy activities', () => {
      const result = calculateDynamicDifficulty(
        10,              // low base
        -15,             // big relationship bonus
        20               // big NPC trait bonus (config positive = easier, negated = reduces)
      );

      // Difficulty can go negative, resulting in DC below 100
      // 10 base + (-15) relationship + (-20) trait = -25
      expect(result.finalDifficulty).toBeLessThan(0);
    });

    it('should include trait breakdown when provided', () => {
      const individualTraits = [
        { trait: 'coffee_lover' as const, traitName: 'Coffee Lover', bonus: 20 },
        { trait: 'bookworm' as const, traitName: 'Bookworm', bonus: 5 },
      ];

      const result = calculateDynamicDifficulty(
        40,
        0,
        25,  // combined NPC trait bonus
        individualTraits
      );

      expect(result.traitBreakdown).toBeDefined();
      expect(result.traitBreakdown?.individualTraits).toBeDefined();
      // Trait breakdown should be negated for display
      expect(result.traitBreakdown?.npcTraitBonus).toBe(-25);
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
        finalDifficulty: 35,
      };

      const breakdown = getDifficultyBreakdown(calculation);

      expect(breakdown).toHaveLength(3);  // Base + relationship + traits
      expect(breakdown[0].source).toBe('Base');
      expect(breakdown[0].modifier).toBe(40);
    });

    it('should only include non-zero modifiers', () => {
      const calculation: DifficultyBreakdown = {
        baseDifficulty: 30,
        relationshipModifier: -5,
        traitBonus: 0,
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
        finalDifficulty: 35,
      };

      const breakdown = getDifficultyBreakdown(calculation);

      // Find relationship modifier
      const relMod = breakdown.find(b => b.source === 'Relationship');
      expect(relMod?.description).toContain('Good');  // Negative modifier = good relationship

      // Find traits modifier
      const traitMod = breakdown.find(b => b.source === 'Traits');
      expect(traitMod?.description).toContain('harder');  // Positive modifier = harder
    });
  });
});

// ===== Integration Tests =====

describe('Social Activity Service - Integration', () => {
  it('should handle complete activity flow', () => {
    // Setup: Good relationship, matching traits
    const relationshipMod = -8;
    const npcTraitBonus = 5;

    // Calculate difficulty
    const difficulty = calculateDynamicDifficulty(
      40,
      relationshipMod,
      npcTraitBonus
    );

    expect(difficulty.finalDifficulty).toBeLessThan(40);  // Should be easier

    // Apply outcome effects
    const baseEffects: Partial<RelationshipAxes> = {
      affection: 10,
      trust: 5,
    };

    const effects = getActivityEffects(baseEffects, 'best');

    expect(effects.relationshipEffects.affection).toBeGreaterThan(10);  // Scaled up
  });

  it('should handle difficult scenario with negative factors', () => {
    // Setup: Bad relationship, mismatched traits
    const relationshipMod = 15;  // Penalty
    const npcTraitBonus = -5;    // Penalty (negative in config = harder)

    // Calculate difficulty
    const difficulty = calculateDynamicDifficulty(
      30,
      relationshipMod,
      npcTraitBonus
    );

    expect(difficulty.finalDifficulty).toBeGreaterThan(30);  // Much harder

    // Mixed outcome should have no relationship change (balanced update)
    const effects = getActivityEffects({ desire: 12 }, 'mixed');

    expect(effects.relationshipEffects.desire).toBe(0);  // No change for mixed outcome
  });
});
