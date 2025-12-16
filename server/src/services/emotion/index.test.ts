/**
 * Unit tests for Emotion Service
 */

import {
  initializeEmotions,
  applyEmotionDelta,
  decayEmotions,
  getDominantEmotions,
  getEmotionDisplay,
  calculateHoursPassed,
  getEmotionBaseline,
  EMOTION_BASELINES,
  DECAY_RATES
} from './index';
import { PersonalityTrait, EmotionType } from '../../../../shared/types';

describe('Emotion Service', () => {
  describe('initializeEmotions', () => {
    it('should initialize with base baselines when no traits provided', () => {
      const state = initializeEmotions([]);

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

    it('should apply optimistic trait modifiers', () => {
      const state = initializeEmotions(['optimistic']);

      expect(state.joy).toBe(25); // 15 + 10
      expect(state.sadness).toBe(2); // 5 - 3
    });

    it('should apply melancholic trait modifiers', () => {
      const state = initializeEmotions(['melancholic']);

      expect(state.sadness).toBe(15); // 5 + 10
      expect(state.joy).toBe(10); // 15 - 5
    });

    it('should apply passionate trait modifiers', () => {
      const state = initializeEmotions(['passionate']);

      expect(state.excitement).toBe(13); // 5 + 8
      expect(state.romantic).toBe(15); // 10 + 5
      expect(state.calm).toBe(15); // 20 - 5
    });

    it('should apply stoic trait modifiers', () => {
      const state = initializeEmotions(['stoic']);

      expect(state.calm).toBe(30); // 20 + 10
      expect(state.anger).toBe(0); // 0 - 5, clamped to 0
      expect(state.anxiety).toBe(0); // 5 - 5
    });

    it('should apply multiple trait modifiers cumulatively', () => {
      const state = initializeEmotions(['optimistic', 'empathetic']);

      expect(state.joy).toBe(25); // 15 + 10 (optimistic)
      expect(state.affection).toBe(15); // 10 + 5 (empathetic)
      expect(state.anxiety).toBe(8); // 5 + 3 (empathetic)
    });

    it('should clamp values to 0-100 range', () => {
      // Create extreme case - multiple traits that could push over limits
      const state = initializeEmotions(['passionate', 'nurturing', 'empathetic']);

      // All values should be in valid range
      Object.keys(EMOTION_BASELINES).forEach(emotion => {
        expect(state[emotion as EmotionType]).toBeGreaterThanOrEqual(0);
        expect(state[emotion as EmotionType]).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('applyEmotionDelta', () => {
    it('should apply positive deltas correctly', () => {
      const state = initializeEmotions([]);
      const newState = applyEmotionDelta(state, {
        joy: 20,
        romantic: 15
      });

      expect(newState.joy).toBe(35); // 15 + 20
      expect(newState.romantic).toBe(25); // 10 + 15
      expect(newState.affection).toBe(10); // unchanged
    });

    it('should apply negative deltas correctly', () => {
      const state = initializeEmotions([]);
      const newState = applyEmotionDelta(state, {
        joy: -10,
        calm: -15
      });

      expect(newState.joy).toBe(5); // 15 - 10
      expect(newState.calm).toBe(5); // 20 - 15
    });

    it('should clamp values to 0-100 range', () => {
      const state = initializeEmotions([]);

      // Try to exceed upper limit
      const highState = applyEmotionDelta(state, { joy: 100 });
      expect(highState.joy).toBe(100);

      // Try to go below lower limit
      const lowState = applyEmotionDelta(state, { joy: -50 });
      expect(lowState.joy).toBe(0);
    });

    it('should update lastUpdated timestamp', () => {
      const state = initializeEmotions([], '2025-01-01T00:00:00.000Z');
      const newState = applyEmotionDelta(state, { joy: 10 });

      expect(newState.lastUpdated).not.toBe(state.lastUpdated);
    });
  });

  describe('decayEmotions', () => {
    it('should not decay when 0 hours passed', () => {
      const state = initializeEmotions([]);
      const decayed = decayEmotions(state, 0, 0, []);

      expect(decayed.joy).toBe(state.joy);
      expect(decayed.affection).toBe(state.affection);
    });

    it('should decay emotions toward baseline', () => {
      // Start with elevated joy
      const state = initializeEmotions([]);
      const elevated = applyEmotionDelta(state, { joy: 50 }); // joy = 65 (strong emotion)

      // Decay for 10 hours
      // joy is strong (65), so decay rate = 2 * 0.5 = 1/hour
      // 1 * 10 = 10 total decay
      const decayed = decayEmotions(elevated, 10, 0, []);

      // 65 - 10 = 55
      expect(decayed.joy).toBe(55);
    });

    it('should not decay below baseline', () => {
      const state = initializeEmotions([]);
      const elevated = applyEmotionDelta(state, { joy: 20 }); // joy = 35

      // Decay for 100 hours (way more than needed)
      const decayed = decayEmotions(elevated, 100, 0, []);

      // Should stop at baseline
      expect(decayed.joy).toBe(EMOTION_BASELINES.joy);
    });

    it('should decay upward when below baseline', () => {
      const state = initializeEmotions([]);
      const lowState = applyEmotionDelta(state, { joy: -10 }); // joy = 5

      // Decay for 5 hours (joy decay rate = 2/hour)
      const decayed = decayEmotions(lowState, 5, 0, []);

      // Should decay upward by 2 * 5 = 10 points toward baseline (15)
      // 5 + 10 = 15
      expect(decayed.joy).toBe(15);
    });

    it('should decay strong emotions (51+) at half rate', () => {
      const state = initializeEmotions([]);
      const strong = applyEmotionDelta(state, { joy: 70 }); // joy = 85 (strong)

      // Decay for 10 hours
      // Normal decay: 2 * 10 = 20
      // Strong emotion: 20 * 0.5 = 10
      const decayed = decayEmotions(strong, 10, 0, []);

      expect(decayed.joy).toBe(75); // 85 - 10
    });

    it('should decay romantic emotion slower with high trust', () => {
      const state = initializeEmotions([]);
      const romantic = applyEmotionDelta(state, { romantic: 50 }); // romantic = 60 (strong)

      // Decay with trust=100 for 10 hours
      // Base decay rate: 2/hour
      // Trust multiplier: 1 - (100/200) = 0.5
      // Strong emotion multiplier: 0.5
      // Actual rate: 2 * 0.5 * 0.5 = 0.5/hour
      // Total decay: 0.5 * 10 = 5
      const decayed = decayEmotions(romantic, 10, 100, []);

      expect(decayed.romantic).toBe(55); // 60 - 5
    });

    it('should decay romantic emotion faster with negative trust', () => {
      const state = initializeEmotions([]);
      const romantic = applyEmotionDelta(state, { romantic: 50 }); // romantic = 60 (strong)

      // Decay with trust=-100 for 10 hours
      // Base decay rate: 2/hour
      // Trust multiplier: 1 - (-100/200) = 1.5
      // Strong emotion multiplier: 0.5
      // Actual rate: 2 * 1.5 * 0.5 = 1.5/hour
      // Total decay: 1.5 * 10 = 15
      const decayed = decayEmotions(romantic, 10, -100, []);

      expect(decayed.romantic).toBe(45); // 60 - 15
    });

    it('should use trait-modified baselines for decay target', () => {
      // Optimistic trait: joy baseline = 25 (instead of 15)
      const state = initializeEmotions(['optimistic']);
      const elevated = applyEmotionDelta(state, { joy: 20 }); // joy = 45

      // Decay for 5 hours (decay rate = 2/hour = 10 total)
      const decayed = decayEmotions(elevated, 5, 0, ['optimistic']);

      // Should decay toward trait-modified baseline of 25
      expect(decayed.joy).toBe(35); // 45 - 10 = 35
    });

    it('should handle multiple fast-decaying emotions', () => {
      const state = initializeEmotions([]);
      const excited = applyEmotionDelta(state, {
        excitement: 50, // = 55 (strong)
        anger: 40       // = 40 (not strong)
      });

      // excitement: strong, fast decay = 3 * 0.5 = 1.5/hour, 10 hours = 15 decay
      // anger: not strong, fast decay = 3/hour, 10 hours = 30 decay
      const decayed = decayEmotions(excited, 10, 0, []);

      expect(decayed.excitement).toBe(40); // 55 - 15 = 40
      expect(decayed.anger).toBe(10); // 40 - 30 = 10
    });
  });

  describe('getDominantEmotions', () => {
    it('should return highest emotion as primary', () => {
      const state = initializeEmotions([]);
      const high = applyEmotionDelta(state, { joy: 50 }); // joy = 65

      const { primary } = getDominantEmotions(high);

      expect(primary.emotion).toBe('joy');
      expect(primary.value).toBe(65);
    });

    it('should return secondary emotion if within 10 points', () => {
      const state = initializeEmotions([]);
      const close = applyEmotionDelta(state, {
        joy: 50,      // = 65
        romantic: 48  // = 58 (within 10 points of 65)
      });

      const { primary, secondary } = getDominantEmotions(close);

      expect(primary.emotion).toBe('joy');
      expect(primary.value).toBe(65);
      expect(secondary).toBeDefined();
      expect(secondary!.emotion).toBe('romantic');
      expect(secondary!.value).toBe(58);
    });

    it('should not return secondary if more than 10 points away', () => {
      const state = initializeEmotions([]);
      const far = applyEmotionDelta(state, {
        joy: 50,      // = 65
        romantic: 30  // = 40 (more than 10 points away)
      });

      const { primary, secondary } = getDominantEmotions(far);

      expect(primary.emotion).toBe('joy');
      expect(secondary).toBeUndefined();
    });

    it('should handle tie for highest emotion', () => {
      const state = initializeEmotions([]);
      const tied = applyEmotionDelta(state, {
        joy: 30,     // = 45
        romantic: 35 // = 45 (exact tie)
      });

      const { primary, secondary } = getDominantEmotions(tied);

      // One should be primary, one secondary (order may vary)
      expect([primary.value, secondary?.value]).toContain(45);
      expect(secondary).toBeDefined();
    });
  });

  describe('getEmotionDisplay', () => {
    it('should map mild intensity (1-25)', () => {
      const display = getEmotionDisplay('joy', 20);

      expect(display.emotion).toBe('joy');
      expect(display.intensity).toBe('mild');
      expect(display.label).toBe('content');
      expect(display.value).toBe(20);
    });

    it('should map moderate intensity (26-50)', () => {
      const display = getEmotionDisplay('joy', 35);

      expect(display.intensity).toBe('moderate');
      expect(display.label).toBe('happy');
    });

    it('should map strong intensity (51-75)', () => {
      const display = getEmotionDisplay('joy', 60);

      expect(display.intensity).toBe('strong');
      expect(display.label).toBe('joyful');
    });

    it('should map intense intensity (76-100)', () => {
      const display = getEmotionDisplay('joy', 90);

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

    it('should have correct labels for all emotions', () => {
      // Test one from each emotion type
      expect(getEmotionDisplay('affection', 30).label).toBe('warm');
      expect(getEmotionDisplay('sadness', 60).label).toBe('upset');
      expect(getEmotionDisplay('anger', 80).label).toBe('furious');
      expect(getEmotionDisplay('romantic', 40).label).toBe('flirty');
    });
  });

  describe('calculateHoursPassed', () => {
    it('should calculate hours correctly', () => {
      const from = '2025-01-01T00:00:00.000Z';
      const to = '2025-01-01T05:00:00.000Z';

      const hours = calculateHoursPassed(from, to);

      expect(hours).toBe(5);
    });

    it('should handle fractional hours', () => {
      const from = '2025-01-01T00:00:00.000Z';
      const to = '2025-01-01T01:30:00.000Z';

      const hours = calculateHoursPassed(from, to);

      expect(hours).toBe(1.5);
    });

    it('should handle days', () => {
      const from = '2025-01-01T00:00:00.000Z';
      const to = '2025-01-02T00:00:00.000Z';

      const hours = calculateHoursPassed(from, to);

      expect(hours).toBe(24);
    });
  });

  describe('getEmotionBaseline', () => {
    it('should return base baseline with no traits', () => {
      const baseline = getEmotionBaseline('joy', []);

      expect(baseline).toBe(EMOTION_BASELINES.joy);
    });

    it('should return trait-modified baseline', () => {
      const baseline = getEmotionBaseline('joy', ['optimistic']);

      expect(baseline).toBe(25); // 15 + 10
    });

    it('should cumulate multiple trait modifiers', () => {
      const baseline = getEmotionBaseline('affection', ['empathetic', 'nurturing']);

      expect(baseline).toBe(23); // 10 + 5 (empathetic) + 8 (nurturing)
    });

    it('should clamp to valid range', () => {
      // Stoic reduces anger baseline
      const baseline = getEmotionBaseline('anger', ['stoic']);

      expect(baseline).toBe(0); // 0 - 5, clamped to 0
    });
  });

  describe('Integration: Full emotion lifecycle', () => {
    it('should handle typical interaction flow', () => {
      // 1. Initialize NPC with traits
      const state = initializeEmotions(['passionate', 'optimistic']);

      // Verify trait effects applied
      expect(state.joy).toBeGreaterThan(EMOTION_BASELINES.joy);
      expect(state.excitement).toBeGreaterThan(EMOTION_BASELINES.excitement);

      // 2. Apply interaction effects (positive date)
      const afterDate = applyEmotionDelta(state, {
        romantic: 30,
        excitement: 20,
        joy: 15
      });

      expect(afterDate.romantic).toBeGreaterThan(state.romantic);

      // 3. Get dominant emotion after date
      const { primary } = getDominantEmotions(afterDate);
      expect(primary.emotion).toBeTruthy();
      expect(primary.label).toBeTruthy();

      // 4. Decay over time (24 hours)
      const afterDay = decayEmotions(afterDate, 24, 50, ['passionate', 'optimistic']);

      // Romantic should have decayed but slower due to trust
      expect(afterDay.romantic).toBeLessThan(afterDate.romantic);
      expect(afterDay.romantic).toBeGreaterThanOrEqual(getEmotionBaseline('romantic', ['passionate', 'optimistic']));
    });

    it('should handle negative interaction and recovery', () => {
      // 1. Start neutral
      const state = initializeEmotions([]);

      // 2. Bad interaction
      const afterFight = applyEmotionDelta(state, {
        anger: 50,
        sadness: 30,
        joy: -10
      });

      expect(afterFight.anger).toBeGreaterThan(EMOTION_BASELINES.anger);

      // 3. Fast emotions should decay quickly
      const after6Hours = decayEmotions(afterFight, 6, 0, []);

      // Anger has fast decay (3/hour), so after 6 hours: 3 * 6 = 18 decay
      expect(after6Hours.anger).toBeLessThan(afterFight.anger);
    });
  });
});
