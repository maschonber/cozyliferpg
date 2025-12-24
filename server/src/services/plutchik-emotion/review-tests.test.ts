/**
 * Plutchik Emotion System - Design Validation Tests
 *
 * These tests validate the intentional design decisions and edge cases
 * of the emotion system. They ensure the documented behavior remains stable.
 */

import {
  applyEmotionPulls,
  interpretEmotionVector,
  _testing,
} from './index';
import {
  EmotionVector,
  BaseEmotion,
  NEUTRAL_EMOTION_VECTOR,
} from './types';
import { getDyadName } from './interpretation-config';

const { getEmotionDistance } = _testing;

// ===== Multi-Pull Design Tests =====

describe('Multi-Pull Design: Cumulative Suppression', () => {
  /**
   * Multi-pulls apply suppression for each pull independently.
   * This is intentional to facilitate dyad formation while still
   * suppressing unrelated emotions.
   */
  it('suppresses non-pulled emotions more strongly with multiple pulls', () => {
    const withAnger: EmotionVector = {
      joySadness: 0,
      acceptanceDisgust: 0,
      angerFear: 0.6,
      anticipationSurprise: 0,
    };

    const multiPull = applyEmotionPulls(withAnger, [
      { emotion: 'joy', intensity: 'medium' },
      { emotion: 'acceptance', intensity: 'medium' },
    ]);

    const singleJoy = applyEmotionPulls(withAnger, [
      { emotion: 'joy', intensity: 'medium' },
    ]);

    // Multi-pull should suppress anger more than single pull
    expect(multiPull.angerFear).toBeLessThan(singleJoy.angerFear);
    // Both should still have reduced anger
    expect(multiPull.angerFear).toBeLessThan(0.6);
    expect(singleJoy.angerFear).toBeLessThan(0.6);
  });

  it('does not suppress emotions that are being pulled', () => {
    const withAnger: EmotionVector = {
      joySadness: 0,
      acceptanceDisgust: 0,
      angerFear: 0.6,
      anticipationSurprise: 0,
    };

    // Pull joy and anger - anger should NOT be suppressed by joy
    const result = applyEmotionPulls(withAnger, [
      { emotion: 'joy', intensity: 'medium' },
      { emotion: 'anger', intensity: 'small' },
    ]);

    // Anger should increase (it's being pulled), not decrease
    expect(result.angerFear).toBeGreaterThan(0.6);
  });
});

describe('Multi-Pull Design: Energy Resistance Timing', () => {
  /**
   * Energy resistance is calculated once from the initial state.
   * This treats all pulls as simultaneous, not sequential.
   */
  it('calculates energy resistance from initial state only', () => {
    const neutral = NEUTRAL_EMOTION_VECTOR;

    // Simultaneous pulls - both use initial energy (0)
    const simultaneous = applyEmotionPulls(neutral, [
      { emotion: 'joy', intensity: 'huge' },
      { emotion: 'acceptance', intensity: 'huge' },
    ]);

    // Sequential pulls - second faces higher energy resistance
    let sequential = applyEmotionPulls(neutral, [
      { emotion: 'joy', intensity: 'huge' },
    ]);
    sequential = applyEmotionPulls(sequential, [
      { emotion: 'acceptance', intensity: 'huge' },
    ]);

    // Simultaneous should have higher total energy
    const simEnergy = Math.abs(simultaneous.joySadness) + Math.abs(simultaneous.acceptanceDisgust);
    const seqEnergy = Math.abs(sequential.joySadness) + Math.abs(sequential.acceptanceDisgust);
    expect(simEnergy).toBeGreaterThan(seqEnergy);

    // Both joy values should be equal (first pull, same resistance)
    // But acceptance differs because sequential faced more energy resistance
    expect(simultaneous.acceptanceDisgust).toBeGreaterThanOrEqual(sequential.acceptanceDisgust);
  });
});

// ===== Axis Resistance Design Tests =====

describe('Axis Resistance Design: Emotional Momentum', () => {
  /**
   * Extreme emotions resist change in both directions.
   * This creates "emotional momentum" - calming down takes effort.
   */
  it('resists pulling toward zero from extreme values', () => {
    const highJoy: EmotionVector = {
      joySadness: 0.8,
      acceptanceDisgust: 0,
      angerFear: 0,
      anticipationSurprise: 0,
    };

    const result = applyEmotionPulls(highJoy, [
      { emotion: 'sadness', intensity: 'large' },
    ]);

    // Should reduce joy, but resistance limits the effect
    expect(result.joySadness).toBeLessThan(0.8);
    // Large pull (0.40) with resistance (0.36) = ~0.144 effect
    // Plus suppression of existing joy
    expect(result.joySadness).toBeGreaterThan(0);
  });

  it('resists equally when pushing further from zero', () => {
    const highJoy: EmotionVector = {
      joySadness: 0.8,
      acceptanceDisgust: 0,
      angerFear: 0,
      anticipationSurprise: 0,
    };

    const result = applyEmotionPulls(highJoy, [
      { emotion: 'joy', intensity: 'large' },
    ]);

    // Should increase joy, but resistance limits the effect
    const delta = result.joySadness - 0.8;
    // At 0.8, resistance = 1 - 0.64 = 0.36
    // Large pull (0.40) * 0.36 = 0.144 maximum
    expect(delta).toBeLessThan(0.15);
    expect(delta).toBeGreaterThan(0);
  });
});

// ===== Dyad Mapping Completeness Tests =====

describe('Dyad Mapping: Complete Coverage', () => {
  const allEmotions: BaseEmotion[] = [
    'joy', 'sadness', 'acceptance', 'disgust',
    'anger', 'fear', 'anticipation', 'surprise'
  ];

  it('has exactly 24 valid dyad mappings (all non-opposite pairs)', () => {
    let mappedCount = 0;
    const unmapped: string[] = [];

    for (let i = 0; i < allEmotions.length; i++) {
      for (let j = i + 1; j < allEmotions.length; j++) {
        const e1 = allEmotions[i];
        const e2 = allEmotions[j];
        const dyad = getDyadName(e1, e2);
        if (dyad) {
          mappedCount++;
        } else {
          unmapped.push(`${e1}+${e2}`);
        }
      }
    }

    // 8 emotions, C(8,2) = 28 pairs, minus 4 opposite pairs = 24
    expect(mappedCount).toBe(24);
    expect(unmapped.length).toBe(4);
  });

  it('has no dyads for opposite emotion pairs (same axis)', () => {
    const opposites: [BaseEmotion, BaseEmotion][] = [
      ['joy', 'sadness'],
      ['acceptance', 'disgust'],
      ['anger', 'fear'],
      ['anticipation', 'surprise'],
    ];

    for (const [e1, e2] of opposites) {
      const dyad = getDyadName(e1, e2);
      expect(dyad).toBeNull();
    }
  });

  it('maps each dyad name to exactly one emotion pair', () => {
    const dyadToEmotions = new Map<string, string[]>();

    for (let i = 0; i < allEmotions.length; i++) {
      for (let j = i + 1; j < allEmotions.length; j++) {
        const e1 = allEmotions[i];
        const e2 = allEmotions[j];
        const dyad = getDyadName(e1, e2);
        if (dyad) {
          const existing = dyadToEmotions.get(dyad) || [];
          existing.push(`${e1}+${e2}`);
          dyadToEmotions.set(dyad, existing);
        }
      }
    }

    // Each dyad should map to exactly one pair
    for (const [, pairs] of dyadToEmotions) {
      expect(pairs.length).toBe(1);
    }
  });
});

// ===== Interpretation Priority Tests =====

describe('Interpretation: Priority System', () => {
  it('interprets two high emotions as a dyad (proximity + high average)', () => {
    const vector: EmotionVector = {
      joySadness: 0,
      acceptanceDisgust: 0,
      angerFear: 0.85,  // anger: 0.85
      anticipationSurprise: -0.80,  // surprise: 0.80, ratio: 0.80/0.85 = 0.941 >= 0.75, avg = 0.825
    };

    const result = interpretEmotionVector(vector);

    // anger + surprise = outrage (now mapped)
    expect(result.emotion).toBe('outrage');
    expect(result.intensity).toBe('high');
  });

  it('interprets two medium emotions as a dyad (proximity + medium average)', () => {
    const vector: EmotionVector = {
      joySadness: 0.65,  // joy: 0.65
      acceptanceDisgust: 0,
      angerFear: -0.60,  // fear: 0.60, ratio: 0.60/0.65 = 0.923 >= 0.75, avg = 0.625
      anticipationSurprise: 0,
    };

    const result = interpretEmotionVector(vector);

    // joy + fear = guilt
    expect(result.emotion).toBe('guilt');
    expect(result.intensity).toBe('medium');
  });

  it('interprets emotions not in proximity as single emotion', () => {
    const vector: EmotionVector = {
      joySadness: 0.30,  // joy: 0.30
      acceptanceDisgust: 0.20,  // acceptance: 0.20, ratio: 0.20/0.30 = 0.667 < 0.75, not in proximity
      angerFear: 0,
      anticipationSurprise: 0,
    };

    const result = interpretEmotionVector(vector);

    // Not in proximity (ratio < 0.75), so strongest wins
    expect(result.emotion).toBe('joy');
    expect(result.intensity).toBe('low');
  });
});

// ===== Edge Case Tests =====

describe('Edge Cases', () => {
  it('handles empty pulls array without modification', () => {
    const vector: EmotionVector = {
      joySadness: 0.5,
      acceptanceDisgust: 0.3,
      angerFear: 0,
      anticipationSurprise: 0,
    };

    const result = applyEmotionPulls(vector, []);

    expect(result).toEqual(vector);
  });

  it('handles pulling opposite emotions on same axis', () => {
    const neutral = NEUTRAL_EMOTION_VECTOR;

    const result = applyEmotionPulls(neutral, [
      { emotion: 'joy', intensity: 'large' },
      { emotion: 'sadness', intensity: 'tiny' },
    ]);

    // Net effect should favor joy (larger pull)
    expect(result.joySadness).toBeGreaterThan(0);
  });

  it('suppression reduces existing opposite emotion toward zero', () => {
    const withSadness: EmotionVector = {
      joySadness: -0.5,
      acceptanceDisgust: 0,
      angerFear: 0,
      anticipationSurprise: 0,
    };

    const result = applyEmotionPulls(withSadness, [
      { emotion: 'joy', intensity: 'medium' },
    ]);

    // Joy pull + suppression of sadness (distance=4) should move strongly toward joy
    expect(result.joySadness).toBeGreaterThan(-0.5);
    // Should have moved significantly (dampened due to existing emotion at -0.5)
    expect(result.joySadness).toBeGreaterThan(-0.35);
  });
});

// ===== Wheel Distance Tests =====

describe('Emotion Wheel: Distance Calculation', () => {
  it('calculates correct distances for all pairs', () => {
    // Adjacent (distance 1)
    expect(getEmotionDistance('joy', 'acceptance')).toBe(1);
    expect(getEmotionDistance('joy', 'anticipation')).toBe(1);

    // Two steps apart (distance 2)
    expect(getEmotionDistance('joy', 'fear')).toBe(2);
    expect(getEmotionDistance('joy', 'surprise')).toBe(3);

    // Opposite (distance 4)
    expect(getEmotionDistance('joy', 'sadness')).toBe(4);
    expect(getEmotionDistance('anger', 'fear')).toBe(4);
  });

  it('is symmetric (A to B equals B to A)', () => {
    const allEmotions: BaseEmotion[] = [
      'joy', 'sadness', 'acceptance', 'disgust',
      'anger', 'fear', 'anticipation', 'surprise'
    ];

    for (const e1 of allEmotions) {
      for (const e2 of allEmotions) {
        expect(getEmotionDistance(e1, e2)).toBe(getEmotionDistance(e2, e1));
      }
    }
  });
});
