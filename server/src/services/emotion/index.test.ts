/**
 * Emotion Service Unit Tests
 *
 * Comprehensive test coverage for all emotion service functions.
 * Tests cover:
 * - Emotion initialization with trait modifiers
 * - Delta application and clamping
 * - Decay calculations (including trust-based romantic decay)
 * - Dominant emotion selection
 * - Display string mapping
 */

import {
  initializeEmotions,
  applyEmotionDelta,
  decayEmotions,
  getDominantEmotions,
  getEmotionDisplay,
  getHoursSinceUpdate,
} from './index';
import { NPCTrait, EmotionType } from '../../../../shared/types';

describe('Emotion Service', () => {
  describe('initializeEmotions', () => {
    it('should initialize emotions with default baselines', () => {
      const state = initializeEmotions('npc_1', []);

      expect(state.joy).toBe(15);
      expect(state.affection).toBe(10);
      expect(state.excitement).toBe(5);
      expect(state.calm).toBe(20);
      expect(state.sadness).toBe(5);
      expect(state.anger).toBe(0);
      expect(state.anxiety).toBe(5);
      expect(state.romantic).toBe(10);
      expect(state.lastUpdated).toBeDefined();
    });

    it('should apply optimistic trait modifier', () => {
      const state = initializeEmotions('npc_1', ['optimistic']);

      expect(state.joy).toBe(25); // 15 + 10
      expect(state.sadness).toBe(2); // 5 - 3
    });

    it('should apply melancholic trait modifier', () => {
      const state = initializeEmotions('npc_1', ['melancholic']);

      expect(state.sadness).toBe(15); // 5 + 10
      expect(state.joy).toBe(10); // 15 - 5
    });

    it('should apply passionate trait modifier', () => {
      const state = initializeEmotions('npc_1', ['passionate']);

      expect(state.excitement).toBe(15); // 5 + 10
      expect(state.romantic).toBe(20); // 10 + 10
    });

    it('should apply stoic trait modifier', () => {
      const state = initializeEmotions('npc_1', ['stoic']);

      expect(state.calm).toBe(35); // 20 + 15
      expect(state.excitement).toBe(2); // 5 - 3
      expect(state.anger).toBe(0); // 0 - 5, clamped to 0
    });

    it('should stack multiple trait modifiers', () => {
      const state = initializeEmotions('npc_1', ['optimistic', 'adventurous']);

      expect(state.joy).toBe(25); // 15 + 10 (optimistic)
      expect(state.excitement).toBe(10); // 5 + 5 (adventurous)
      expect(state.anxiety).toBe(3); // 5 - 2 (adventurous), optimistic has no anxiety modifier
    });

    it('should clamp values to 0-100 range', () => {
      // Use traits that would push values out of range
      const state = initializeEmotions('npc_1', [
        'optimistic',
        'outgoing',
        'romantic',
        'flirtatious',
        'intense',
      ]);

      expect(state.romantic).toBeLessThanOrEqual(100);
      expect(state.romantic).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyEmotionDelta', () => {
    const baseState = initializeEmotions('npc_1', []);

    it('should apply positive deltas', () => {
      const newState = applyEmotionDelta(baseState, {
        joy: 20,
        affection: 15,
      });

      expect(newState.joy).toBe(35); // 15 + 20
      expect(newState.affection).toBe(25); // 10 + 15
      expect(newState.excitement).toBe(5); // unchanged
    });

    it('should apply negative deltas', () => {
      const newState = applyEmotionDelta(baseState, {
        joy: -10,
        anxiety: -5,
      });

      expect(newState.joy).toBe(5); // 15 - 10
      expect(newState.anxiety).toBe(0); // 5 - 5
    });

    it('should clamp values at upper bound (100)', () => {
      const newState = applyEmotionDelta(baseState, {
        joy: 90, // Would be 15 + 90 = 105
      });

      expect(newState.joy).toBe(100);
    });

    it('should clamp values at lower bound (0)', () => {
      const newState = applyEmotionDelta(baseState, {
        anger: -50, // Would be 0 - 50 = -50
      });

      expect(newState.anger).toBe(0);
    });

    it('should not modify unchanged emotions', () => {
      const newState = applyEmotionDelta(baseState, {
        joy: 10,
      });

      expect(newState.affection).toBe(baseState.affection);
      expect(newState.excitement).toBe(baseState.excitement);
      expect(newState.calm).toBe(baseState.calm);
    });

    it('should update lastUpdated timestamp', () => {
      const oldTimestamp = baseState.lastUpdated;
      // Wait a tiny bit to ensure timestamp changes
      const newState = applyEmotionDelta(baseState, { joy: 5 });

      expect(newState.lastUpdated).toBeDefined();
      expect(newState.lastUpdated).not.toBe(oldTimestamp);
    });
  });

  describe('decayEmotions', () => {
    it('should decay emotion above baseline downward', () => {
      const state = initializeEmotions('npc_1', []);
      const elevated = applyEmotionDelta(state, { joy: 50 }); // joy now 65

      const decayed = decayEmotions(elevated, 1, 0, []); // 1 hour, trust=0

      expect(decayed.joy).toBeLessThan(65); // Should have decayed
      expect(decayed.joy).toBeGreaterThan(15); // But not below baseline yet
    });

    it('should decay emotion below baseline upward', () => {
      const state = initializeEmotions('npc_1', []);
      const depressed = applyEmotionDelta(state, { joy: -10 }); // joy now 5

      const decayed = decayEmotions(depressed, 1, 0, []); // 1 hour, trust=0

      expect(decayed.joy).toBeGreaterThan(5); // Should have increased
      expect(decayed.joy).toBeLessThanOrEqual(15); // But not above baseline
    });

    it('should not overshoot baseline', () => {
      const state = initializeEmotions('npc_1', []);
      const elevated = applyEmotionDelta(state, { joy: 18 }); // joy now 33, baseline 15

      // Decay for a very long time
      const decayed = decayEmotions(elevated, 100, 0, []); // 100 hours

      expect(decayed.joy).toBe(15); // Should stop at baseline, not go below
    });

    it('should handle zero hours elapsed', () => {
      const state = initializeEmotions('npc_1', []);
      const elevated = applyEmotionDelta(state, { joy: 50 });

      const decayed = decayEmotions(elevated, 0, 0, []); // No time passed

      expect(decayed.joy).toBe(elevated.joy); // No change
    });

    it('should decay faster emotions more quickly', () => {
      const state = initializeEmotions('npc_1', []);
      // Elevate both anger (fast decay: 3.0) and affection (slow decay: 0.8)
      const elevated = applyEmotionDelta(state, {
        anger: 50,
        affection: 50,
      });

      const decayed = decayEmotions(elevated, 1, 0, []); // 1 hour

      const angerDecay = elevated.anger - decayed.anger;
      const affectionDecay = elevated.affection - decayed.affection;

      expect(angerDecay).toBeGreaterThan(affectionDecay); // Anger decays faster
    });

    it('should slow decay for strong emotions (51-75)', () => {
      const state = initializeEmotions('npc_1', []);
      const moderate = applyEmotionDelta(state, { joy: 35 }); // joy=50 (moderate)
      const strong = applyEmotionDelta(state, { joy: 50 }); // joy=65 (strong)

      const moderateDecayed = decayEmotions(moderate, 1, 0, []);
      const strongDecayed = decayEmotions(strong, 1, 0, []);

      const moderateDecayAmount = moderate.joy - moderateDecayed.joy;
      const strongDecayAmount = strong.joy - strongDecayed.joy;

      // Strong emotion should decay less (75% of normal rate)
      expect(strongDecayAmount).toBeLessThan(moderateDecayAmount);
    });

    it('should slow decay even more for intense emotions (76-100)', () => {
      const state = initializeEmotions('npc_1', []);
      const strong = applyEmotionDelta(state, { joy: 60 }); // joy=75 (strong)
      const intense = applyEmotionDelta(state, { joy: 70 }); // joy=85 (intense)

      const strongDecayed = decayEmotions(strong, 1, 0, []);
      const intenseDecayed = decayEmotions(intense, 1, 0, []);

      const strongDecayAmount = strong.joy - strongDecayed.joy;
      const intenseDecayAmount = intense.joy - intenseDecayed.joy;

      // Intense emotion should decay less than strong (50% vs 75% of normal)
      expect(intenseDecayAmount).toBeLessThan(strongDecayAmount);
    });

    it('should reduce romantic decay when trust is high', () => {
      const state = initializeEmotions('npc_1', []);
      const romantic = applyEmotionDelta(state, { romantic: 50 }); // romantic=60

      const lowTrustDecay = decayEmotions(romantic, 1, 0, []); // trust=0
      const highTrustDecay = decayEmotions(romantic, 1, 100, []); // trust=100

      const lowTrustAmount = romantic.romantic - lowTrustDecay.romantic;
      const highTrustAmount = romantic.romantic - highTrustDecay.romantic;

      // High trust should result in less romantic decay
      expect(highTrustAmount).toBeLessThan(lowTrustAmount);
    });

    it('should decay romantic emotion at half rate with trust=100', () => {
      const state = initializeEmotions('npc_1', []);
      const romantic = applyEmotionDelta(state, { romantic: 50 }); // romantic=60

      const noTrustDecay = decayEmotions(romantic, 1, 0, []); // trust=0
      const maxTrustDecay = decayEmotions(romantic, 1, 100, []); // trust=100

      const noTrustAmount = romantic.romantic - noTrustDecay.romantic;
      const maxTrustAmount = romantic.romantic - maxTrustDecay.romantic;

      // With trust=100, romantic decay should be approximately half
      // Formula: baseRate * (1 - 100/200) = baseRate * 0.5
      expect(maxTrustAmount).toBeCloseTo(noTrustAmount * 0.5, 1);
    });

    it('should use trait-adjusted baselines for decay targets', () => {
      const optimistic: NPCTrait[] = ['optimistic']; // joy baseline: 25 instead of 15
      const state = initializeEmotions('npc_1', optimistic);
      const elevated = applyEmotionDelta(state, { joy: 20 }); // joy=45

      const decayed = decayEmotions(elevated, 100, 0, optimistic); // Long decay

      expect(decayed.joy).toBe(25); // Should decay to trait-adjusted baseline, not default 15
    });
  });

  describe('getEmotionDisplay', () => {
    it('should map mild intensity (1-25)', () => {
      const display = getEmotionDisplay('joy', 20);

      expect(display.emotion).toBe('joy');
      expect(display.intensity).toBe('mild');
      expect(display.value).toBe(20);
      expect(display.label).toBe('content');
    });

    it('should map moderate intensity (26-50)', () => {
      const display = getEmotionDisplay('joy', 40);

      expect(display.intensity).toBe('moderate');
      expect(display.label).toBe('happy');
    });

    it('should map strong intensity (51-75)', () => {
      const display = getEmotionDisplay('joy', 65);

      expect(display.intensity).toBe('strong');
      expect(display.label).toBe('joyful');
    });

    it('should map intense intensity (76-100)', () => {
      const display = getEmotionDisplay('joy', 85);

      expect(display.intensity).toBe('intense');
      expect(display.label).toBe('ecstatic');
    });

    it('should handle boundary values correctly', () => {
      expect(getEmotionDisplay('joy', 25).intensity).toBe('mild');
      expect(getEmotionDisplay('joy', 26).intensity).toBe('moderate');
      expect(getEmotionDisplay('joy', 50).intensity).toBe('moderate');
      expect(getEmotionDisplay('joy', 51).intensity).toBe('strong');
      expect(getEmotionDisplay('joy', 75).intensity).toBe('strong');
      expect(getEmotionDisplay('joy', 76).intensity).toBe('intense');
    });

    it('should map all emotion types correctly', () => {
      expect(getEmotionDisplay('affection', 30).label).toBe('warm');
      expect(getEmotionDisplay('excitement', 60).label).toBe('excited');
      expect(getEmotionDisplay('calm', 80).label).toBe('blissful');
      expect(getEmotionDisplay('sadness', 45).label).toBe('sad');
      expect(getEmotionDisplay('anger', 70).label).toBe('angry');
      expect(getEmotionDisplay('anxiety', 90).label).toBe('distressed');
      expect(getEmotionDisplay('romantic', 55).label).toBe('romantic');
    });
  });

  describe('getDominantEmotions', () => {
    it('should return highest value emotion as primary', () => {
      const state = initializeEmotions('npc_1', []);
      const elevated = applyEmotionDelta(state, { joy: 50 }); // joy=65

      const dominant = getDominantEmotions(elevated);

      expect(dominant.primary.emotion).toBe('joy');
      expect(dominant.primary.value).toBe(65);
    });

    it('should include secondary emotion when within threshold', () => {
      const state = initializeEmotions('npc_1', []);
      const mixed = applyEmotionDelta(state, {
        joy: 50, // 65
        excitement: 52, // 57 (8 points away from joy, within 10 point threshold)
      });

      const dominant = getDominantEmotions(mixed);

      expect(dominant.primary.emotion).toBe('joy');
      expect(dominant.secondary).toBeDefined();
      expect(dominant.secondary?.emotion).toBe('excitement');
    });

    it('should not include secondary when beyond threshold', () => {
      const state = initializeEmotions('npc_1', []);
      const clear = applyEmotionDelta(state, {
        joy: 50, // 65
        excitement: 30, // 35 (more than 10 points away)
      });

      const dominant = getDominantEmotions(clear);

      expect(dominant.primary.emotion).toBe('joy');
      expect(dominant.secondary).toBeUndefined();
    });

    it('should handle tied emotions correctly', () => {
      const state = initializeEmotions('npc_1', []);
      const tied = applyEmotionDelta(state, {
        joy: 50, // 65
        excitement: 50, // 55
        affection: 50, // 60
      });

      const dominant = getDominantEmotions(tied);

      expect(dominant.primary).toBeDefined();
      expect(dominant.primary.value).toBeGreaterThanOrEqual(60);
    });

    it('should detect mixed state with 3+ close emotions', () => {
      const state = initializeEmotions('npc_1', []);
      const mixed = applyEmotionDelta(state, {
        joy: 40, // 55
        excitement: 40, // 45
        affection: 40, // 50
      });

      const dominant = getDominantEmotions(mixed);

      // With 3+ emotions within 15 points, should include secondary
      expect(dominant.primary).toBeDefined();
      expect(dominant.secondary).toBeDefined();
    });

    it('should work with default emotion state', () => {
      const state = initializeEmotions('npc_1', []);

      const dominant = getDominantEmotions(state);

      // Default: calm is highest at 20
      expect(dominant.primary.emotion).toBe('calm');
      expect(dominant.primary.label).toBe('neutral'); // 20 = mild intensity
    });
  });

  describe('getHoursSinceUpdate', () => {
    it('should calculate hours correctly', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const hours = getHoursSinceUpdate(twoHoursAgo);

      expect(hours).toBeCloseTo(2, 0); // Within 1 hour accuracy
    });

    it('should handle fractional hours', () => {
      const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString();
      const hours = getHoursSinceUpdate(ninetyMinutesAgo);

      expect(hours).toBeCloseTo(1.5, 1); // 90 minutes = 1.5 hours
    });

    it('should handle very recent updates', () => {
      const justNow = new Date().toISOString();
      const hours = getHoursSinceUpdate(justNow);

      expect(hours).toBeLessThan(0.1); // Less than 6 minutes
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full emotion lifecycle: init -> delta -> decay', () => {
      // Initialize with traits
      const state = initializeEmotions('npc_1', ['optimistic', 'romantic']);

      // Apply deltas from a successful date
      const afterDate = applyEmotionDelta(state, {
        romantic: 30,
        excitement: 20,
        joy: 15,
      });

      expect(afterDate.romantic).toBeGreaterThan(state.romantic);
      expect(afterDate.excitement).toBeGreaterThan(state.excitement);

      // Decay after 6 hours
      const afterDecay = decayEmotions(afterDate, 6, 50, ['optimistic', 'romantic']);

      // Emotions should have decayed toward baselines
      expect(afterDecay.romantic).toBeLessThan(afterDate.romantic);
      expect(afterDecay.excitement).toBeLessThan(afterDate.excitement);
    });

    it('should maintain emotional state consistency through multiple operations', () => {
      let state = initializeEmotions('npc_1', ['melancholic']);

      // Multiple interactions
      state = applyEmotionDelta(state, { sadness: 20 });
      state = decayEmotions(state, 2, 0, ['melancholic']);
      state = applyEmotionDelta(state, { joy: 30 });

      // All values should still be in valid range
      const emotions: EmotionType[] = [
        'joy',
        'affection',
        'excitement',
        'calm',
        'sadness',
        'anger',
        'anxiety',
        'romantic',
      ];

      for (const emotion of emotions) {
        expect(state[emotion]).toBeGreaterThanOrEqual(0);
        expect(state[emotion]).toBeLessThanOrEqual(100);
      }
    });
  });
});
