/**
 * Social Activity Service Tests
 *
 * Comprehensive unit tests for Task 6: Social Activity Integration
 */

import {
  getEmotionDifficultyModifier,
  calculateDynamicDifficulty,
  getStreakModifier,
  updateStreak,
  shouldResetStreak,
  scaleRelationshipEffects,
  calculateEmotionEffects,
  getActivityEffects,
  getDifficultyBreakdown,
  InteractionStreak,
} from './index';
import { NPCEmotionState, RelationshipAxes, OutcomeTier } from '../../../../shared/types';

// ===== Test Data =====

const neutralEmotions: NPCEmotionState = {
  joy: 15,
  affection: 10,
  excitement: 5,
  calm: 20,
  sadness: 5,
  anger: 0,
  anxiety: 5,
  romantic: 10,
  lastUpdated: new Date().toISOString(),
};

const happyEmotions: NPCEmotionState = {
  joy: 75,          // Strong joy (dominant)
  affection: 30,
  excitement: 25,
  calm: 40,
  sadness: 2,
  anger: 0,
  anxiety: 3,
  romantic: 15,
  lastUpdated: new Date().toISOString(),
};

const angryEmotions: NPCEmotionState = {
  joy: 5,
  affection: 10,
  excitement: 0,
  calm: 5,
  sadness: 20,
  anger: 80,        // Intense anger (dominant)
  anxiety: 15,
  romantic: 0,
  lastUpdated: new Date().toISOString(),
};

const anxiousEmotions: NPCEmotionState = {
  joy: 10,
  affection: 15,
  excitement: 5,
  calm: 8,
  sadness: 20,
  anger: 5,
  anxiety: 60,      // Strong anxiety (dominant)
  romantic: 5,
  lastUpdated: new Date().toISOString(),
};

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

// ===== Emotion-Based Difficulty Modifier Tests =====

describe('Social Activity Service - Emotion Difficulty Modifiers', () => {
  describe('getEmotionDifficultyModifier', () => {
    it('should return negative modifier for positive emotions (easier)', () => {
      const modifier = getEmotionDifficultyModifier(happyEmotions);
      expect(modifier).toBeLessThan(0);
      expect(modifier).toBeGreaterThanOrEqual(-20);
    });

    it('should return positive modifier for negative emotions (harder)', () => {
      const modifier = getEmotionDifficultyModifier(angryEmotions);
      expect(modifier).toBeGreaterThan(0);
      expect(modifier).toBeLessThanOrEqual(30);
    });

    it('should scale modifier by emotion intensity', () => {
      // Create mildly happy emotions
      const mildlyHappy: NPCEmotionState = {
        ...neutralEmotions,
        joy: 20,  // Mild intensity
      };

      // Create intensely happy emotions
      const intenselyHappy: NPCEmotionState = {
        ...neutralEmotions,
        joy: 85,  // Intense
      };

      const mildModifier = Math.abs(getEmotionDifficultyModifier(mildlyHappy));
      const intenseModifier = Math.abs(getEmotionDifficultyModifier(intenselyHappy));

      // Intense emotions should have larger effect
      expect(intenseModifier).toBeGreaterThan(mildModifier);
    });

    it('should handle anxious emotions appropriately', () => {
      const modifier = getEmotionDifficultyModifier(anxiousEmotions);
      expect(modifier).toBeGreaterThan(0);  // Anxiety makes things harder
      expect(modifier).toBeLessThanOrEqual(30);
    });

    it('should clamp modifier to range [-20, 30]', () => {
      const modifier = getEmotionDifficultyModifier(angryEmotions);
      expect(modifier).toBeGreaterThanOrEqual(-20);
      expect(modifier).toBeLessThanOrEqual(30);
    });
  });
});

// ===== Dynamic Difficulty Calculation Tests =====

describe('Social Activity Service - Dynamic Difficulty', () => {
  describe('calculateDynamicDifficulty', () => {
    it('should combine all difficulty modifiers correctly', () => {
      const result = calculateDynamicDifficulty(
        50,              // base difficulty
        happyEmotions,   // positive emotion modifier
        goodAxes,
        'friend',
        -8,              // relationship modifier (friend bonus)
        -3,              // NPC trait bonus
        -2,              // archetype bonus
        undefined        // no streak
      );

      expect(result.baseDifficulty).toBe(50);
      expect(result.emotionModifier).toBeLessThan(0);      // Happy = easier
      expect(result.relationshipModifier).toBe(-8);         // Friend bonus
      expect(result.traitBonus).toBe(-5);                  // Matching traits (combined)
      expect(result.streakModifier).toBe(0);               // No streak
      expect(result.finalDifficulty).toBeLessThan(50);     // Overall easier
    });

    it('should increase difficulty with negative factors', () => {
      const result = calculateDynamicDifficulty(
        30,              // base difficulty
        angryEmotions,   // negative emotion modifier
        { trust: -40, affection: -30, desire: 0 },
        'rival',
        15,              // relationship penalty (rival)
        3,               // NPC trait penalty
        2,               // archetype penalty
        undefined
      );

      expect(result.emotionModifier).toBeGreaterThan(0);   // Angry = harder
      expect(result.relationshipModifier).toBe(15);        // Rival penalty
      expect(result.traitBonus).toBe(5);                   // Trait penalty (combined)
      expect(result.finalDifficulty).toBeGreaterThan(30);  // Overall harder
    });

    it('should never return negative difficulty', () => {
      const result = calculateDynamicDifficulty(
        10,              // low base
        happyEmotions,   // big negative modifier
        goodAxes,
        'partner',
        -15,             // big relationship bonus
        -12,             // big NPC trait bonus
        -8,              // big archetype bonus
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
        neutralEmotions,
        neutralAxes,
        'stranger',
        0,               // relationship modifier
        0,               // NPC trait bonus
        0,               // archetype bonus
        positiveStreak
      );

      expect(result.streakModifier).toBeLessThan(0);  // Positive streak = easier
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

    it('should reverse effects by -0.4x for mixed outcome', () => {
      const scaled = scaleRelationshipEffects(baseEffects, 'mixed');

      expect(scaled.affection).toBe(-4);  // 10 * -0.4
      expect(scaled.trust).toBe(-2);      // 5 * -0.4 = -2
      expect(scaled.desire).toBe(-3);     // 8 * -0.4 = -3.2 → -3 (rounded)
    });

    it('should reverse effects by -1.2x for catastrophic outcome', () => {
      const scaled = scaleRelationshipEffects(baseEffects, 'catastrophic');

      expect(scaled.affection).toBe(-12); // 10 * -1.2
      expect(scaled.trust).toBe(-6);      // 5 * -1.2
      expect(scaled.desire).toBe(-10);    // 8 * -1.2 = -9.6 → -10 (rounded)
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

  describe('calculateEmotionEffects', () => {
    it('should combine activity and outcome emotion effects', () => {
      const effects = calculateEmotionEffects('flirt_playfully', 'best');

      // Should have both flirt effects (romantic, excitement, joy, anxiety)
      // AND best outcome effects (joy, affection, etc.)
      expect(effects.romantic).toBeGreaterThan(0);
      expect(effects.excitement).toBeGreaterThan(0);
      expect(effects.joy).toBeGreaterThan(0);
    });

    it('should return only outcome effects for unknown activity', () => {
      const effects = calculateEmotionEffects('unknown_activity', 'best');

      // Should still have outcome effects
      expect(effects.joy).toBeGreaterThan(0);
      expect(effects.affection).toBeGreaterThan(0);
    });

    it('should handle catastrophic outcome appropriately', () => {
      const effects = calculateEmotionEffects('deep_conversation', 'catastrophic');

      // Catastrophic outcome should create negative emotions
      expect(effects.sadness).toBeGreaterThan(0);
      expect(effects.anger).toBeGreaterThan(0);
      expect(effects.anxiety).toBeGreaterThan(0);
    });

    it('should scale activity effects by outcome tier', () => {
      const bestEffects = calculateEmotionEffects('have_coffee', 'best');
      const mixedEffects = calculateEmotionEffects('have_coffee', 'mixed');

      // Best outcome should have positive effects
      expect(bestEffects.joy).toBeGreaterThan(0);

      // Mixed outcome should have negative effects
      if (mixedEffects.anxiety) {
        expect(mixedEffects.anxiety).toBeGreaterThan(0);
      }
      if (mixedEffects.sadness) {
        expect(mixedEffects.sadness).toBeGreaterThan(0);
      }
    });
  });

  describe('getActivityEffects', () => {
    it('should return both relationship and emotion effects', () => {
      const baseRelEffects: Partial<RelationshipAxes> = {
        affection: 10,
        desire: 5,
      };

      const effects = getActivityEffects('casual_date', baseRelEffects, 'best');

      expect(effects.relationshipEffects).toBeDefined();
      expect(effects.emotionEffects).toBeDefined();
      expect(effects.relationshipEffects.affection).toBe(15);  // 10 * 1.5
    });
  });
});

// ===== Display Functions Tests =====

describe('Social Activity Service - Display Functions', () => {
  describe('getDifficultyBreakdown', () => {
    it('should return breakdown of all modifiers', () => {
      const calculation = {
        baseDifficulty: 40,
        emotionModifier: -8,
        relationshipModifier: -10,
        traitBonus: 5,
        streakModifier: -2,
        finalDifficulty: 25,
      };

      const breakdown = getDifficultyBreakdown(calculation);

      expect(breakdown).toHaveLength(5);  // All modifiers present
      expect(breakdown[0].source).toBe('Base');
      expect(breakdown[0].modifier).toBe(40);
    });

    it('should only include non-zero modifiers', () => {
      const calculation = {
        baseDifficulty: 30,
        emotionModifier: 0,
        relationshipModifier: -5,
        traitBonus: 0,
        streakModifier: 0,
        finalDifficulty: 25,
      };

      const breakdown = getDifficultyBreakdown(calculation);

      expect(breakdown).toHaveLength(2);  // Only base and relationship
      expect(breakdown.some(b => b.source === 'Emotion')).toBe(false);
    });

    it('should include helpful descriptions', () => {
      const calculation = {
        baseDifficulty: 40,
        emotionModifier: -8,
        relationshipModifier: -10,
        traitBonus: 5,
        streakModifier: -2,
        finalDifficulty: 25,
      };

      const breakdown = getDifficultyBreakdown(calculation);

      expect(breakdown[1].description).toContain('positive');  // Emotion is negative modifier = positive state
      expect(breakdown[2].description).toContain('Good');      // Relationship is negative modifier = good
    });
  });
});

// ===== Integration Tests =====

describe('Social Activity Service - Integration', () => {
  it('should handle complete activity flow', () => {
    // Setup: Happy NPC, good relationship, matching traits, positive streak
    const emotionState = happyEmotions;
    const axes = goodAxes;
    const state = 'friend';
    const relationshipMod = -8;
    const npcTraitBonus = -3;
    const archetypeBonus = -2;
    const streak: InteractionStreak = {
      consecutivePositive: 4,
      consecutiveNegative: 0,
      lastInteraction: new Date().toISOString(),
      lastDay: 1,
    };

    // Calculate difficulty
    const difficulty = calculateDynamicDifficulty(
      40,
      emotionState,
      axes,
      state,
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

    const effects = getActivityEffects('have_coffee', baseEffects, 'best');

    expect(effects.relationshipEffects.affection).toBeGreaterThan(10);  // Scaled up
    expect(effects.emotionEffects.joy).toBeGreaterThan(0);              // Positive emotions

    // Update streak
    const newStreak = updateStreak(streak, 'best', 1);

    expect(newStreak.consecutivePositive).toBe(5);  // Continued streak
  });

  it('should handle difficult scenario with negative factors', () => {
    // Setup: Angry NPC, bad relationship, mismatched traits, negative streak
    const emotionState = angryEmotions;
    const axes = { trust: -40, affection: -30, desire: 0 };
    const state = 'rival';
    const relationshipMod = 15;  // Penalty
    const npcTraitBonus = 3;     // Penalty
    const archetypeBonus = 2;    // Penalty
    const streak: InteractionStreak = {
      consecutivePositive: 0,
      consecutiveNegative: 6,
      lastInteraction: new Date().toISOString(),
      lastDay: 1,
    };

    // Calculate difficulty
    const difficulty = calculateDynamicDifficulty(
      30,
      emotionState,
      axes,
      state,
      relationshipMod,
      npcTraitBonus,
      archetypeBonus,
      streak
    );

    expect(difficulty.finalDifficulty).toBeGreaterThan(30);  // Much harder

    // Mixed outcome should damage the relationship
    const effects = getActivityEffects('flirt_playfully', { desire: 12 }, 'mixed');

    expect(effects.relationshipEffects.desire).toBeLessThan(0);  // Negative for mixed outcome
  });
});
