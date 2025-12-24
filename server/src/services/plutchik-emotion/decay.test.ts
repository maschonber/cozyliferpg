/**
 * Tests for Emotion Decay Service
 */

import { applyEmotionDecay, _testing } from './decay';
import { EmotionVector, NEUTRAL_EMOTION_VECTOR } from './types';

const { decayComponent } = _testing;

describe('Emotion Decay Service', () => {
  describe('decayComponent', () => {
    describe('edge cases', () => {
      it('should return same value when time is zero', () => {
        expect(decayComponent(0.5, 0)).toBe(0.5);
        expect(decayComponent(-0.5, 0)).toBe(-0.5);
      });

      it('should return same value when time is negative', () => {
        expect(decayComponent(0.5, -1)).toBe(0.5);
        expect(decayComponent(-0.5, -5)).toBe(-0.5);
      });

      it('should return zero when value is already zero', () => {
        expect(decayComponent(0, 10)).toBe(0);
      });

      it('should decay very small values to zero', () => {
        expect(decayComponent(0.0001, 0.1)).toBe(0);
        expect(decayComponent(-0.0001, 0.1)).toBe(0);
      });
    });

    describe('decay rates by quartile', () => {
      it('should decay from 0.25 to near-zero in approximately 4 hours', () => {
        const result = decayComponent(0.25, 4);
        // Should be very close to zero (within tolerance for exponential decay)
        expect(result).toBeLessThan(0.01);
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it('should decay from 0.5 to approximately 0.25 in 8 hours', () => {
        const result = decayComponent(0.5, 8);
        // Should be close to 0.25 (within reasonable tolerance)
        expect(result).toBeGreaterThan(0.20);
        expect(result).toBeLessThan(0.30);
      });

      it('should decay from 0.75 to approximately 0.5 in 16 hours', () => {
        const result = decayComponent(0.75, 16);
        // Should be close to 0.5
        expect(result).toBeGreaterThan(0.45);
        expect(result).toBeLessThan(0.55);
      });

      it('should decay from 1.0 to approximately 0.75 in 32 hours', () => {
        const result = decayComponent(1.0, 32);
        // Should be close to 0.75
        expect(result).toBeGreaterThan(0.70);
        expect(result).toBeLessThan(0.80);
      });
    });

    describe('symmetry for negative values', () => {
      it('should decay negative values symmetrically', () => {
        const positiveDecay = decayComponent(0.5, 8);
        const negativeDecay = decayComponent(-0.5, 8);

        expect(negativeDecay).toBeCloseTo(-positiveDecay, 10);
      });

      it('should decay from -0.75 to approximately -0.5 in 16 hours', () => {
        const result = decayComponent(-0.75, 16);
        expect(result).toBeLessThan(-0.45);
        expect(result).toBeGreaterThan(-0.55);
      });
    });

    describe('small time increments', () => {
      it('should handle 0.1 hour increments (6 minutes)', () => {
        const initial = 0.5;
        const result = decayComponent(initial, 0.1);

        // Should decay slightly but not much
        expect(result).toBeLessThan(initial);
        expect(result).toBeGreaterThan(initial - 0.05);
      });

      it('should handle 0.5 hour increments (30 minutes)', () => {
        const initial = 0.3;
        const result = decayComponent(initial, 0.5);

        expect(result).toBeLessThan(initial);
        expect(result).toBeGreaterThan(initial * 0.85); // Should retain most of value
      });

      it('should be consistent when applied incrementally', () => {
        // Applying decay in small steps should approximately equal one large step
        let value = 0.6;

        // Apply 10 times 1 hour
        for (let i = 0; i < 10; i++) {
          value = decayComponent(value, 1);
        }

        // Compare with single 10-hour decay
        const directDecay = decayComponent(0.6, 10);

        // Should be close (some numerical error is acceptable)
        expect(value).toBeCloseTo(directDecay, 2);
      });
    });

    describe('monotonic decay', () => {
      it('should never increase value magnitude', () => {
        const values = [0.1, 0.3, 0.5, 0.7, 0.9];
        const times = [0.5, 1, 2, 5, 10];

        for (const value of values) {
          for (const time of times) {
            const result = decayComponent(value, time);
            expect(Math.abs(result)).toBeLessThanOrEqual(Math.abs(value));
          }
        }
      });

      it('should approach zero asymptotically', () => {
        let value = 0.8;

        // Apply decay repeatedly
        for (let i = 0; i < 20; i++) {
          const newValue = decayComponent(value, 5);

          // Should always decrease (or stay at zero once reached)
          expect(Math.abs(newValue)).toBeLessThanOrEqual(Math.abs(value));
          value = newValue;
        }

        // After 100 hours, should be very close to zero
        expect(Math.abs(value)).toBeLessThanOrEqual(0.01);
      });
    });

    describe('no sign flipping', () => {
      it('should never flip positive to negative', () => {
        const values = [0.1, 0.3, 0.5, 0.7, 0.9];
        const times = [1, 10, 50, 100];

        for (const value of values) {
          for (const time of times) {
            const result = decayComponent(value, time);
            expect(result).toBeGreaterThanOrEqual(0);
          }
        }
      });

      it('should never flip negative to positive', () => {
        const values = [-0.1, -0.3, -0.5, -0.7, -0.9];
        const times = [1, 10, 50, 100];

        for (const value of values) {
          for (const time of times) {
            const result = decayComponent(value, time);
            expect(result).toBeLessThanOrEqual(0);
          }
        }
      });
    });
  });

  describe('applyEmotionDecay', () => {
    describe('edge cases', () => {
      it('should return copy of vector when time is zero', () => {
        const vector: EmotionVector = {
          joySadness: 0.5,
          acceptanceDisgust: -0.3,
          angerFear: 0.7,
          anticipationSurprise: 0,
        };

        const result = applyEmotionDecay(vector, 0);

        expect(result).toEqual(vector);
        expect(result).not.toBe(vector); // Should be a new object
      });

      it('should return copy of vector when time is negative', () => {
        const vector: EmotionVector = {
          joySadness: 0.5,
          acceptanceDisgust: -0.3,
          angerFear: 0.7,
          anticipationSurprise: 0,
        };

        const result = applyEmotionDecay(vector, -5);

        expect(result).toEqual(vector);
        expect(result).not.toBe(vector);
      });

      it('should handle neutral vector', () => {
        const result = applyEmotionDecay(NEUTRAL_EMOTION_VECTOR, 10);
        expect(result).toEqual(NEUTRAL_EMOTION_VECTOR);
      });
    });

    describe('component-wise decay', () => {
      it('should decay all axes independently', () => {
        const vector: EmotionVector = {
          joySadness: 0.6,
          acceptanceDisgust: 0.4,
          angerFear: 0.8,
          anticipationSurprise: 0.2,
        };

        const result = applyEmotionDecay(vector, 10);

        // All should decay but maintain relationships
        expect(result.joySadness).toBeLessThan(vector.joySadness);
        expect(result.acceptanceDisgust).toBeLessThan(vector.acceptanceDisgust);
        expect(result.angerFear).toBeLessThan(vector.angerFear);
        expect(result.anticipationSurprise).toBeLessThan(vector.anticipationSurprise);

        // Higher values should still be higher (they decay slower in absolute terms)
        expect(result.angerFear).toBeGreaterThan(result.joySadness);
        expect(result.joySadness).toBeGreaterThan(result.acceptanceDisgust);
      });

      it('should handle mixed positive and negative values', () => {
        const vector: EmotionVector = {
          joySadness: 0.5,
          acceptanceDisgust: -0.5,
          angerFear: 0.3,
          anticipationSurprise: -0.3,
        };

        const result = applyEmotionDecay(vector, 8);

        // Positive values should decay toward zero (decrease)
        expect(result.joySadness).toBeLessThan(vector.joySadness);
        expect(result.joySadness).toBeGreaterThanOrEqual(0);

        expect(result.angerFear).toBeLessThan(vector.angerFear);
        expect(result.angerFear).toBeGreaterThanOrEqual(0);

        // Negative values should decay toward zero (increase/become less negative)
        expect(result.acceptanceDisgust).toBeGreaterThan(vector.acceptanceDisgust);
        expect(result.acceptanceDisgust).toBeLessThanOrEqual(0);

        expect(result.anticipationSurprise).toBeGreaterThan(vector.anticipationSurprise);
        expect(result.anticipationSurprise).toBeLessThanOrEqual(0);
      });
    });

    describe('realistic scenarios', () => {
      it('should decay strong joy over time', () => {
        const initial: EmotionVector = {
          joySadness: 0.9,
          acceptanceDisgust: 0,
          angerFear: 0,
          anticipationSurprise: 0,
        };

        // Starting from 0.9:
        // - First 12.8h to reach 0.75 (0.15 / 0.0078125 = 19.2h)
        // Wait, let me recalculate:
        // 0.9 is in quartile 4 [0.75-1.0], rate = 0.0078125/h
        // Time to go from 0.9 to 0.75 = 0.15 / 0.0078125 = 19.2h
        // Remaining time after reaching 0.75: 32 - 19.2 = 12.8h
        // Then in quartile 3 [0.5-0.75], rate = 0.015625/h
        // Decay in 12.8h = 0.015625 * 12.8 = 0.2
        // So final value = 0.75 - 0.2 = 0.55
        const after32h = applyEmotionDecay(initial, 32);
        expect(after32h.joySadness).toBeGreaterThan(0.50);
        expect(after32h.joySadness).toBeLessThan(0.60);

        // After 64 hours total from 0.9, should be very low or zero
        // (64h is enough to fully decay from most starting points)
        const after64h = applyEmotionDecay(initial, 64);
        expect(after64h.joySadness).toBeGreaterThanOrEqual(0);
        expect(after64h.joySadness).toBeLessThan(0.20);
      });

      it('should decay multiple emotions independently', () => {
        const initial: EmotionVector = {
          joySadness: 0.8,      // Strong joy
          acceptanceDisgust: 0.3, // Mild acceptance
          angerFear: -0.2,      // Slight fear
          anticipationSurprise: 0,
        };

        const result = applyEmotionDecay(initial, 10);

        // Strong joy (0.8) after 10h:
        // - In quartile 4 [0.75-1.0], takes 6.4h to reach 0.75 (0.05/0.0078125)
        // - Remaining 3.6h in quartile 3, decays by 0.05625 (0.015625 * 3.6)
        // - Final: 0.75 - 0.05625 = 0.69375
        expect(result.joySadness).toBeGreaterThan(0.65);
        expect(result.joySadness).toBeLessThan(0.75);

        // Mild acceptance (0.3) after 10h:
        // - In quartile 2 [0.25-0.50], rate 0.03125/h
        // - Decays by 0.3125 in 10h, but only 0.05 to reach 0.25
        // - Takes 1.6h to reach 0.25, then 8.4h in quartile 1
        // - Decays by 0.525 (0.0625 * 8.4) from 0.25
        // - Goes to 0 since 0.525 > 0.25
        expect(result.acceptanceDisgust).toBeGreaterThanOrEqual(0);
        expect(result.acceptanceDisgust).toBeLessThan(0.1);

        // Slight fear should decay toward zero
        expect(result.angerFear).toBeGreaterThan(-0.2);
        expect(result.angerFear).toBeLessThanOrEqual(0);
      });

      it('should eventually bring all emotions to near-zero', () => {
        const initial: EmotionVector = {
          joySadness: 0.7,
          acceptanceDisgust: -0.5,
          angerFear: 0.6,
          anticipationSurprise: -0.4,
        };

        // After 100 hours, all should be very close to zero
        const result = applyEmotionDecay(initial, 100);

        expect(Math.abs(result.joySadness)).toBeLessThan(0.1);
        expect(Math.abs(result.acceptanceDisgust)).toBeLessThan(0.1);
        expect(Math.abs(result.angerFear)).toBeLessThan(0.1);
        expect(Math.abs(result.anticipationSurprise)).toBeLessThan(0.1);
      });
    });

    describe('immutability', () => {
      it('should not modify the input vector', () => {
        const original: EmotionVector = {
          joySadness: 0.5,
          acceptanceDisgust: 0.3,
          angerFear: 0.7,
          anticipationSurprise: -0.2,
        };

        const copy = { ...original };
        applyEmotionDecay(original, 10);

        expect(original).toEqual(copy);
      });
    });

    describe('small time increments', () => {
      it('should handle 5-minute intervals (0.083 hours)', () => {
        const vector: EmotionVector = {
          joySadness: 0.4,
          acceptanceDisgust: 0.3,
          angerFear: 0,
          anticipationSurprise: 0,
        };

        const result = applyEmotionDecay(vector, 0.083);

        // Should decay slightly
        expect(result.joySadness).toBeLessThan(vector.joySadness);
        expect(result.joySadness).toBeGreaterThan(vector.joySadness - 0.02);
      });

      it('should accumulate correctly over multiple small steps', () => {
        let vector: EmotionVector = {
          joySadness: 0.5,
          acceptanceDisgust: 0,
          angerFear: 0,
          anticipationSurprise: 0,
        };

        // Apply 40 steps of 0.1 hours (= 4 hours total)
        for (let i = 0; i < 40; i++) {
          vector = applyEmotionDecay(vector, 0.1);
        }

        // Compare with single 4-hour decay
        const directDecay = applyEmotionDecay(
          { joySadness: 0.5, acceptanceDisgust: 0, angerFear: 0, anticipationSurprise: 0 },
          4
        );

        // Should be close (some numerical error acceptable)
        expect(vector.joySadness).toBeCloseTo(directDecay.joySadness, 2);
      });
    });
  });
});
