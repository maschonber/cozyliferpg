/**
 * Plutchik Emotion System - Tests
 *
 * Comprehensive test suite for the emotion system.
 * Tests are organized by development phases.
 */

import {
  applyEmotionPulls,
  interpretEmotionVector,
  _testing,
} from './index';
import {
  EmotionVector,
  EmotionPull,
  NEUTRAL_EMOTION_VECTOR,
} from './types';

const { getAxisForEmotion, getEmotionDistance, getTotalEmotionalEnergy, clamp } = _testing;

// ===== Helper Functions Tests =====

describe('Plutchik Emotion System - Helpers', () => {
  describe('getAxisForEmotion', () => {
    it('maps joy to joySadness axis with positive direction', () => {
      const result = getAxisForEmotion('joy');
      expect(result).toEqual({ axis: 'joySadness', direction: 1 });
    });

    it('maps sadness to joySadness axis with negative direction', () => {
      const result = getAxisForEmotion('sadness');
      expect(result).toEqual({ axis: 'joySadness', direction: -1 });
    });

    it('maps all 8 emotions correctly', () => {
      expect(getAxisForEmotion('acceptance')).toEqual({ axis: 'acceptanceDisgust', direction: 1 });
      expect(getAxisForEmotion('disgust')).toEqual({ axis: 'acceptanceDisgust', direction: -1 });
      expect(getAxisForEmotion('anger')).toEqual({ axis: 'angerFear', direction: 1 });
      expect(getAxisForEmotion('fear')).toEqual({ axis: 'angerFear', direction: -1 });
      expect(getAxisForEmotion('anticipation')).toEqual({ axis: 'anticipationSurprise', direction: 1 });
      expect(getAxisForEmotion('surprise')).toEqual({ axis: 'anticipationSurprise', direction: -1 });
    });
  });

  describe('getEmotionDistance', () => {
    it('returns 0 for same emotion', () => {
      expect(getEmotionDistance('joy', 'joy')).toBe(0);
    });

    it('returns 1 for adjacent emotions', () => {
      expect(getEmotionDistance('joy', 'acceptance')).toBe(1);
      expect(getEmotionDistance('acceptance', 'fear')).toBe(1);
    });

    it('returns 4 for opposite emotions', () => {
      expect(getEmotionDistance('joy', 'sadness')).toBe(4);
      expect(getEmotionDistance('acceptance', 'disgust')).toBe(4);
      expect(getEmotionDistance('anger', 'fear')).toBe(4);
      expect(getEmotionDistance('anticipation', 'surprise')).toBe(4);
    });

    it('calculates shortest distance around the wheel', () => {
      // Joy to Surprise: clockwise = 3, counter = 5, should return 3
      expect(getEmotionDistance('joy', 'surprise')).toBe(3);

      // Joy to Anticipation: clockwise = 7, counter = 1, should return 1
      expect(getEmotionDistance('joy', 'anticipation')).toBe(1);
    });

    it('is symmetric (distance A→B equals B→A)', () => {
      expect(getEmotionDistance('joy', 'anger')).toBe(getEmotionDistance('anger', 'joy'));
      expect(getEmotionDistance('fear', 'surprise')).toBe(getEmotionDistance('surprise', 'fear'));
    });
  });

  describe('getTotalEmotionalEnergy', () => {
    it('returns 0 for neutral vector', () => {
      expect(getTotalEmotionalEnergy(NEUTRAL_EMOTION_VECTOR)).toBe(0);
    });

    it('calculates sum of absolute values across all axes', () => {
      const vector: EmotionVector = {
        joySadness: 0.5,
        acceptanceDisgust: -0.3,
        angerFear: 0.2,
        anticipationSurprise: -0.1,
      };
      // 0.5 + 0.3 + 0.2 + 0.1 = 1.1
      expect(getTotalEmotionalEnergy(vector)).toBeCloseTo(1.1);
    });

    it('treats negative values as positive (absolute value)', () => {
      const vector: EmotionVector = {
        joySadness: -0.8,
        acceptanceDisgust: -0.4,
        angerFear: -0.2,
        anticipationSurprise: -0.1,
      };
      // 0.8 + 0.4 + 0.2 + 0.1 = 1.5
      expect(getTotalEmotionalEnergy(vector)).toBeCloseTo(1.5);
    });
  });

  describe('clamp', () => {
    it('returns value as-is if within [-1, 1]', () => {
      expect(clamp(0)).toBe(0);
      expect(clamp(0.5)).toBe(0.5);
      expect(clamp(-0.5)).toBe(-0.5);
      expect(clamp(1)).toBe(1);
      expect(clamp(-1)).toBe(-1);
    });

    it('clamps values above 1 to 1', () => {
      expect(clamp(1.5)).toBe(1);
      expect(clamp(2.0)).toBe(1);
    });

    it('clamps values below -1 to -1', () => {
      expect(clamp(-1.5)).toBe(-1);
      expect(clamp(-2.0)).toBe(-1);
    });
  });
});

// ===== Phase 1: Basic Pull Tests =====

describe('Phase 1: Basic Single Pull on Neutral Vector', () => {
  it('increases joy axis when pulling joy(medium) from neutral', () => {
    const result = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
      { emotion: 'joy', intensity: 'medium' },
    ]);

    // Should increase joySadness toward positive (joy direction)
    expect(result.joySadness).toBeGreaterThan(0);
    // Medium pull should have noticeable effect (roughly 0.20-0.30 range)
    expect(result.joySadness).toBeGreaterThanOrEqual(0.15);
    expect(result.joySadness).toBeLessThanOrEqual(0.35);
  });

  it('increases different intensities by different amounts', () => {
    const tiny = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
      { emotion: 'joy', intensity: 'tiny' },
    ]);
    const small = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
      { emotion: 'joy', intensity: 'small' },
    ]);
    const medium = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
      { emotion: 'joy', intensity: 'medium' },
    ]);
    const large = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
      { emotion: 'joy', intensity: 'large' },
    ]);
    const huge = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
      { emotion: 'joy', intensity: 'huge' },
    ]);

    // Each size should be larger than the previous
    expect(tiny.joySadness).toBeLessThan(small.joySadness);
    expect(small.joySadness).toBeLessThan(medium.joySadness);
    expect(medium.joySadness).toBeLessThan(large.joySadness);
    expect(large.joySadness).toBeLessThan(huge.joySadness);
  });

  it('moves sadness axis toward negative when pulling sadness', () => {
    const result = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
      { emotion: 'sadness', intensity: 'medium' },
    ]);

    // Should decrease joySadness toward negative (sadness direction)
    expect(result.joySadness).toBeLessThan(0);
    expect(result.joySadness).toBeGreaterThanOrEqual(-0.35);
    expect(result.joySadness).toBeLessThanOrEqual(-0.15);
  });

  it('affects the correct axis for each emotion', () => {
    const joyResult = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
      { emotion: 'joy', intensity: 'small' },
    ]);
    expect(joyResult.joySadness).toBeGreaterThan(0);
    expect(joyResult.acceptanceDisgust).toBe(0);
    expect(joyResult.angerFear).toBe(0);
    expect(joyResult.anticipationSurprise).toBe(0);

    const angerResult = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
      { emotion: 'anger', intensity: 'small' },
    ]);
    expect(angerResult.joySadness).toBe(0);
    expect(angerResult.acceptanceDisgust).toBe(0);
    expect(angerResult.angerFear).toBeGreaterThan(0);
    expect(angerResult.anticipationSurprise).toBe(0);

    const acceptanceResult = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
      { emotion: 'acceptance', intensity: 'small' },
    ]);
    expect(acceptanceResult.joySadness).toBe(0);
    expect(acceptanceResult.acceptanceDisgust).toBeGreaterThan(0);
    expect(acceptanceResult.angerFear).toBe(0);
    expect(acceptanceResult.anticipationSurprise).toBe(0);
  });

  it('does not exceed [-1, 1] bounds', () => {
    // Even with huge pull, should stay within bounds
    const result = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
      { emotion: 'joy', intensity: 'huge' },
    ]);

    expect(result.joySadness).toBeGreaterThanOrEqual(-1);
    expect(result.joySadness).toBeLessThanOrEqual(1);
  });

  it('does not modify the original vector (pure function)', () => {
    const original = { ...NEUTRAL_EMOTION_VECTOR };
    applyEmotionPulls(original, [{ emotion: 'joy', intensity: 'medium' }]);

    // Original should be unchanged
    expect(original).toEqual(NEUTRAL_EMOTION_VECTOR);
  });
});

// ===== Phase 2: Resistance and Diminishing Returns =====

describe('Phase 2: Resistance and Diminishing Returns', () => {
  describe('Single emotion resistance (approaching extremes)', () => {
    it('has less effect when pulling toward already high value', () => {
      const highJoy: EmotionVector = {
        joySadness: 0.7,
        acceptanceDisgust: 0,
        angerFear: 0,
        anticipationSurprise: 0,
      };

      const fromNeutral = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
        { emotion: 'joy', intensity: 'medium' },
      ]);
      const fromHigh = applyEmotionPulls(highJoy, [
        { emotion: 'joy', intensity: 'medium' },
      ]);

      // The delta from high should be smaller than delta from neutral
      const deltaFromNeutral = fromNeutral.joySadness - 0;
      const deltaFromHigh = fromHigh.joySadness - 0.7;

      expect(deltaFromHigh).toBeLessThan(deltaFromNeutral);
      expect(deltaFromHigh).toBeGreaterThan(0); // Still some increase
    });

    it('becomes very hard to reach extreme values (near ±1)', () => {
      const veryHigh: EmotionVector = {
        joySadness: 0.9,
        acceptanceDisgust: 0,
        angerFear: 0,
        anticipationSurprise: 0,
      };

      const result = applyEmotionPulls(veryHigh, [
        { emotion: 'joy', intensity: 'large' },
      ]);

      // Should increase, but not by much
      expect(result.joySadness).toBeGreaterThan(0.9);
      expect(result.joySadness).toBeLessThan(0.98); // Hard to get very close to 1
    });

    it('applies resistance symmetrically (negative values too)', () => {
      const highSadness: EmotionVector = {
        joySadness: -0.7,
        acceptanceDisgust: 0,
        angerFear: 0,
        anticipationSurprise: 0,
      };

      const fromNeutral = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
        { emotion: 'sadness', intensity: 'medium' },
      ]);
      const fromHighSadness = applyEmotionPulls(highSadness, [
        { emotion: 'sadness', intensity: 'medium' },
      ]);

      const deltaFromNeutral = Math.abs(fromNeutral.joySadness - 0);
      const deltaFromHigh = Math.abs(fromHighSadness.joySadness - (-0.7));

      expect(deltaFromHigh).toBeLessThan(deltaFromNeutral);
    });
  });

  describe('Total emotional energy resistance', () => {
    it('makes pulls less effective when total energy is high', () => {
      const highEnergy: EmotionVector = {
        joySadness: 0.5,
        acceptanceDisgust: 0.4,
        angerFear: 0.3,
        anticipationSurprise: 0.2,
      };
      // Total energy = 1.4

      const neutralResult = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
        { emotion: 'joy', intensity: 'medium' },
      ]);
      const highEnergyResult = applyEmotionPulls(highEnergy, [
        { emotion: 'joy', intensity: 'medium' },
      ]);

      const deltaFromNeutral = neutralResult.joySadness - 0;
      const deltaFromHighEnergy = highEnergyResult.joySadness - 0.5;

      // High energy state should resist new pulls more
      expect(deltaFromHighEnergy).toBeLessThan(deltaFromNeutral);
    });

    it('prevents more than 2 strong emotions simultaneously', () => {
      const twoStrong: EmotionVector = {
        joySadness: 0.6,
        acceptanceDisgust: 0.5,
        angerFear: 0,
        anticipationSurprise: 0,
      };

      // Try to add a third strong emotion
      const result = applyEmotionPulls(twoStrong, [
        { emotion: 'anger', intensity: 'large' },
      ]);

      // Should have increased, but resistance should prevent it from getting too high
      expect(result.angerFear).toBeGreaterThan(0);
      // The high total energy should limit how high anger can go
      expect(result.angerFear).toBeLessThan(0.5);
    });
  });

  describe('Cumulative effect of multiple pulls', () => {
    it('allows same emotion to build up with multiple pulls', () => {
      let vector = NEUTRAL_EMOTION_VECTOR;

      // Apply multiple small pulls
      vector = applyEmotionPulls(vector, [{ emotion: 'joy', intensity: 'small' }]);
      vector = applyEmotionPulls(vector, [{ emotion: 'joy', intensity: 'small' }]);
      vector = applyEmotionPulls(vector, [{ emotion: 'joy', intensity: 'small' }]);

      // Should accumulate, but with resistance
      expect(vector.joySadness).toBeGreaterThan(0.3);
      // But resistance should prevent linear growth
      // Three small pulls (0.15 each) shouldn't = 0.45 due to resistance
      expect(vector.joySadness).toBeLessThan(0.45);
    });
  });
});

// ===== Phase 3: Emotion Suppression =====

describe('Phase 3: Emotion Suppression Based on Distance', () => {
  describe('Basic suppression', () => {
    it('reduces other elevated emotions when pulling a new emotion', () => {
      const withAcceptance: EmotionVector = {
        joySadness: 0,
        acceptanceDisgust: 0.5,
        angerFear: 0,
        anticipationSurprise: 0,
      };

      const result = applyEmotionPulls(withAcceptance, [
        { emotion: 'joy', intensity: 'medium' },
      ]);

      // Joy should increase
      expect(result.joySadness).toBeGreaterThan(0);
      // Acceptance should decrease (being suppressed)
      expect(result.acceptanceDisgust).toBeLessThan(0.5);
      expect(result.acceptanceDisgust).toBeGreaterThan(0); // But not go negative
    });

    it('does not push neutral emotions into negative territory', () => {
      const neutral: EmotionVector = {
        joySadness: 0,
        acceptanceDisgust: 0,
        angerFear: 0,
        anticipationSurprise: 0,
      };

      const result = applyEmotionPulls(neutral, [
        { emotion: 'joy', intensity: 'large' },
      ]);

      // Other axes should stay at 0, not go negative
      expect(result.acceptanceDisgust).toBeGreaterThanOrEqual(0);
      expect(result.angerFear).toBeGreaterThanOrEqual(0);
      expect(result.anticipationSurprise).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Distance-based suppression', () => {
    it('suppresses distant emotions more than adjacent ones', () => {
      // Set up: joy(0), acceptance(0.4), fear(0.3), surprise(0), sadness(0), disgust(0), anger(0.4), anticipation(0)
      const state: EmotionVector = {
        joySadness: 0,
        acceptanceDisgust: 0.4,
        angerFear: 0.4,
        anticipationSurprise: 0,
      };

      // Pull joy - adjacent emotions: acceptance(dist=1), anticipation(dist=1)
      //           - distant emotions: fear(dist=2), surprise(dist=3), anger(dist=3), etc
      const result = applyEmotionPulls(state, [
        { emotion: 'joy', intensity: 'medium' },
      ]);

      // Acceptance is adjacent to joy (distance=1), should be suppressed less
      const acceptanceReduction = 0.4 - result.acceptanceDisgust;

      // Anger is distant from joy (distance=3), should be suppressed more
      const angerReduction = 0.4 - result.angerFear;

      expect(angerReduction).toBeGreaterThan(acceptanceReduction);
    });

    it('opposite emotions (distance=4) are suppressed most strongly', () => {
      const withSadness: EmotionVector = {
        joySadness: -0.6, // Sadness
        acceptanceDisgust: 0,
        angerFear: 0,
        anticipationSurprise: 0,
      };

      // Pull joy (opposite of sadness)
      const result = applyEmotionPulls(withSadness, [
        { emotion: 'joy', intensity: 'large' },
      ]);

      // Should move significantly toward joy, suppressing sadness strongly
      expect(result.joySadness).toBeGreaterThan(-0.6);
      // The suppression should be substantial (dampened due to high existing emotion)
      const change = result.joySadness - (-0.6);
      expect(change).toBeGreaterThan(0.25);
    });
  });

  describe('Magnitude-based suppression', () => {
    it('suppresses higher-value emotions more than lower-value ones', () => {
      const state: EmotionVector = {
        joySadness: 0,
        acceptanceDisgust: 0.6, // High
        angerFear: 0.2,         // Low
        anticipationSurprise: 0,
      };

      const result = applyEmotionPulls(state, [
        { emotion: 'joy', intensity: 'medium' },
      ]);

      // Both should be suppressed, but acceptance (higher) should lose more
      const acceptanceReduction = 0.6 - result.acceptanceDisgust;
      const angerReduction = 0.2 - result.angerFear;

      expect(acceptanceReduction).toBeGreaterThan(angerReduction);
    });

    it('leaves very low emotions mostly untouched', () => {
      const state: EmotionVector = {
        joySadness: 0,
        acceptanceDisgust: 0.05, // Very low
        angerFear: 0,
        anticipationSurprise: 0,
      };

      const result = applyEmotionPulls(state, [
        { emotion: 'joy', intensity: 'medium' },
      ]);

      // Very low acceptance should barely be affected
      const acceptanceReduction = 0.05 - result.acceptanceDisgust;
      expect(acceptanceReduction).toBeLessThan(0.03);
    });
  });

  describe('Combined distance and magnitude', () => {
    it('applies strongest suppression to distant, high emotions', () => {
      const state: EmotionVector = {
        joySadness: 0,
        acceptanceDisgust: 0.3,  // Adjacent to joy, moderate value
        angerFear: 0.5,          // Distant from joy (dist=3), high value
        anticipationSurprise: 0,
      };

      const result = applyEmotionPulls(state, [
        { emotion: 'joy', intensity: 'medium' },
      ]);

      // Anger (distant + high) should be suppressed more than acceptance (adjacent + moderate)
      const acceptanceReduction = 0.3 - result.acceptanceDisgust;
      const angerReduction = 0.5 - result.angerFear;

      expect(angerReduction).toBeGreaterThan(acceptanceReduction);
    });
  });
});

// ===== Phase 4: Multi-Pull Scenarios =====

describe('Phase 4: Multi-Pull Scenarios', () => {
  describe('Two compatible pulls (adjacent emotions)', () => {
    it('applies both pulls successfully', () => {
      const result = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
        { emotion: 'joy', intensity: 'medium' },
        { emotion: 'acceptance', intensity: 'small' },
      ]);

      // Both should increase
      expect(result.joySadness).toBeGreaterThan(0);
      expect(result.acceptanceDisgust).toBeGreaterThan(0);
    });

    it('creates stronger combined effect for adjacent emotions', () => {
      const singleJoy = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
        { emotion: 'joy', intensity: 'medium' },
      ]);

      const combined = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
        { emotion: 'joy', intensity: 'medium' },
        { emotion: 'acceptance', intensity: 'small' },
      ]);

      // Joy should be higher in combined (less suppression from acceptance since it's also being pulled)
      expect(combined.joySadness).toBeGreaterThanOrEqual(singleJoy.joySadness);
    });
  });

  describe('Two opposing pulls (same axis)', () => {
    it('cancels out opposing pulls on same axis', () => {
      const result = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
        { emotion: 'joy', intensity: 'medium' },
        { emotion: 'sadness', intensity: 'medium' },
      ]);

      // Should largely cancel out
      expect(Math.abs(result.joySadness)).toBeLessThan(0.1);
    });

    it('applies net effect when pulls are different sizes', () => {
      const result = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
        { emotion: 'joy', intensity: 'large' },
        { emotion: 'sadness', intensity: 'small' },
      ]);

      // Should move toward joy (larger pull)
      expect(result.joySadness).toBeGreaterThan(0.1);
    });
  });

  describe('Two distant pulls', () => {
    it('applies both but with mutual suppression', () => {
      const result = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
        { emotion: 'joy', intensity: 'medium' },
        { emotion: 'anger', intensity: 'medium' },
      ]);

      // Both should increase, but less than if applied separately
      expect(result.joySadness).toBeGreaterThan(0);
      expect(result.angerFear).toBeGreaterThan(0);

      // Compare to single pulls
      const singleJoy = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
        { emotion: 'joy', intensity: 'medium' },
      ]);
      const singleAnger = applyEmotionPulls(NEUTRAL_EMOTION_VECTOR, [
        { emotion: 'anger', intensity: 'medium' },
      ]);

      // Multi-pull should be less effective (or equal) due to mutual suppression
      expect(result.joySadness).toBeLessThanOrEqual(singleJoy.joySadness);
      expect(result.angerFear).toBeLessThanOrEqual(singleAnger.angerFear);
    });
  });

  describe('Two pulls with existing emotions', () => {
    it('handles complex interactions correctly', () => {
      const state: EmotionVector = {
        joySadness: 0.3,
        acceptanceDisgust: 0,
        angerFear: 0.4,
        anticipationSurprise: 0.2,
      };

      const result = applyEmotionPulls(state, [
        { emotion: 'joy', intensity: 'medium' },
        { emotion: 'acceptance', intensity: 'small' },
      ]);

      // Joy and acceptance should increase
      expect(result.joySadness).toBeGreaterThan(0.3);
      expect(result.acceptanceDisgust).toBeGreaterThan(0);

      // Distant emotions (anger) should be suppressed
      expect(result.angerFear).toBeLessThan(0.4);
    });
  });
});

// ===== Emotion Interpretation Tests =====

describe('Emotion Interpretation', () => {
  describe('Priority 1: High intensity single emotion (>= 75)', () => {
    it('interprets high joy correctly', () => {
      const vector: EmotionVector = {
        joySadness: 0.8,
        acceptanceDisgust: 0,
        angerFear: 0,
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('joy');
      expect(result.intensity).toBe('high');
      expect(result.noun).toBe('ecstasy');
      expect(result.adjective).toBe('ecstatic');
    });

    it('interprets high fear correctly', () => {
      const vector: EmotionVector = {
        joySadness: 0,
        acceptanceDisgust: 0,
        angerFear: -0.9,
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('fear');
      expect(result.intensity).toBe('high');
      expect(result.noun).toBe('terror');
      expect(result.adjective).toBe('terrified');
    });
  });

  describe('Priority: Emotion dyads', () => {
    it('interprets love (joy + acceptance) correctly at medium intensity (proximity + average)', () => {
      const vector: EmotionVector = {
        joySadness: 0.60,  // Leading emotion
        acceptanceDisgust: 0.56,  // 0.56/0.60 = 0.933 >= 0.75 proximity, avg = 0.58 (medium)
        angerFear: 0,
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('love');
      expect(result.intensity).toBe('medium');
      expect(result.noun).toBe('affection');
      expect(result.adjective).toBe('affectionate');
    });

    it('interprets optimism (joy + anticipation) correctly at low intensity', () => {
      const vector: EmotionVector = {
        joySadness: 0.40,  // Leading emotion
        acceptanceDisgust: 0,
        angerFear: 0,
        anticipationSurprise: 0.35,  // 0.35/0.40 = 0.875 >= 0.75 proximity, avg = 0.375 (low)
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('optimism');
      expect(result.intensity).toBe('low');
      expect(result.noun).toBe('hopefulness');
      expect(result.adjective).toBe('hopeful');
    });

    it('high dyad requires proximity and high average', () => {
      const vector: EmotionVector = {
        joySadness: 0.85,  // Leading emotion
        acceptanceDisgust: 0.80,  // 0.80/0.85 = 0.941 >= 0.75 proximity, avg = 0.825 (high)
        angerFear: 0,
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('love');
      expect(result.intensity).toBe('high');
    });
  });

  describe('Priority 4: Medium intensity single emotion (>= 50)', () => {
    it('interprets medium sadness correctly', () => {
      const vector: EmotionVector = {
        joySadness: -0.6,
        acceptanceDisgust: 0,
        angerFear: 0,
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('sadness');
      expect(result.intensity).toBe('medium');
      expect(result.noun).toBe('sorrow');
      expect(result.adjective).toBe('sad');
    });
  });

  describe('Priority 6: Low intensity single emotion (>= 20)', () => {
    it('interprets low anger correctly', () => {
      const vector: EmotionVector = {
        joySadness: 0,
        acceptanceDisgust: 0,
        angerFear: 0.3,
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('anger');
      expect(result.intensity).toBe('low');
      expect(result.noun).toBe('annoyance');
      expect(result.adjective).toBe('annoyed');
    });
  });

  describe('Priority: Mixed (3+ emotions in proximity)', () => {
    it('interprets mixed emotions correctly (3 emotions in proximity)', () => {
      const vector: EmotionVector = {
        joySadness: 0.50,   // First emotion
        acceptanceDisgust: 0.40,  // 0.40/0.50 = 0.80 >= 0.75, in proximity with joy
        angerFear: 0.32,    // 0.32/0.40 = 0.80 >= 0.75, in proximity with acceptance
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('mixed');
      expect(result.intensity).toBeUndefined();
      expect(result.noun).toBe('confusion');
      expect(result.adjective).toBe('overwhelmed');
    });
  });

  describe('Priority 8: Neutral (no emotions >= 20)', () => {
    it('interprets neutral state correctly', () => {
      const vector: EmotionVector = {
        joySadness: 0,
        acceptanceDisgust: 0,
        angerFear: 0,
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('neutral');
      expect(result.intensity).toBeUndefined();
      expect(result.noun).toBe('neutrality');
      expect(result.adjective).toBe('calm');
    });

    it('interprets low emotional state as neutral', () => {
      const vector: EmotionVector = {
        joySadness: 0.1,
        acceptanceDisgust: 0.15,
        angerFear: 0.05,
        anticipationSurprise: 0.15,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('neutral');
    });
  });

  describe('Edge cases', () => {
    it('prioritizes high dyad over high single emotion (proximity + high average)', () => {
      const vector: EmotionVector = {
        joySadness: 0.85, // Leading emotion
        acceptanceDisgust: 0.80, // 0.80/0.85 = 0.941 >= 0.75, avg = 0.825 >= 0.80 (high dyad)
        angerFear: 0,
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('love');
      expect(result.intensity).toBe('high');
    });

    it('prioritizes high single over low dyad when second emotion not in proximity', () => {
      const vector: EmotionVector = {
        joySadness: 0.85, // high single
        acceptanceDisgust: 0.50, // 0.50/0.85 = 0.588 < 0.75, not in proximity
        angerFear: 0,
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('joy');
      expect(result.intensity).toBe('high');
    });

    it('prioritizes medium dyad over medium single emotion (proximity + medium average)', () => {
      const vector: EmotionVector = {
        joySadness: 0.65, // Leading emotion
        acceptanceDisgust: 0.60, // 0.60/0.65 = 0.923 >= 0.75, avg = 0.625 >= 0.55 (medium dyad)
        angerFear: 0,
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('love');
      expect(result.intensity).toBe('medium');
    });

    it('prioritizes medium single over low dyad when second emotion not in proximity', () => {
      const vector: EmotionVector = {
        joySadness: 0.60, // medium single
        acceptanceDisgust: 0,
        angerFear: 0.40, // 0.40/0.60 = 0.667 < 0.75, not in proximity
        anticipationSurprise: 0,
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('joy');
      expect(result.intensity).toBe('medium');
    });

    it('prioritizes low dyad over low single emotion (proximity + low average)', () => {
      const vector: EmotionVector = {
        joySadness: 0.40, // Leading emotion
        acceptanceDisgust: 0,
        angerFear: 0,
        anticipationSurprise: 0.35, // 0.35/0.40 = 0.875 >= 0.75, avg = 0.375 >= 0.20 (low dyad)
      };
      const result = interpretEmotionVector(vector);
      expect(result.emotion).toBe('optimism');
      expect(result.intensity).toBe('low');
    });
  });
});
