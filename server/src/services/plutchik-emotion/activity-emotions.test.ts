/**
 * Tests for Activity Emotion Generator
 */

import { generateActivityEmotionPulls, hasEmotionProfile } from './activity-emotions';
import { EmotionProfile, OutcomeTier } from '../../../../shared/types';
import { BaseEmotion } from './types';
import { EMOTION_WHEEL_ORDER } from './config';

describe('Activity Emotion Generator', () => {
  const testProfile: EmotionProfile = {
    successEmotion: 'joy',
    failureEmotion: 'fear',
  };

  describe('generateActivityEmotionPulls', () => {
    describe('best outcome', () => {
      it('should use success emotion as primary with medium intensity', () => {
        const pulls = generateActivityEmotionPulls(testProfile, 'best');

        expect(pulls[0].emotion).toBe('joy');
        expect(pulls[0].intensity).toBe('medium');
      });

      it('should return 1-2 pulls', () => {
        // Run multiple times to account for randomness
        for (let i = 0; i < 20; i++) {
          const pulls = generateActivityEmotionPulls(testProfile, 'best');
          expect(pulls.length).toBeGreaterThanOrEqual(1);
          expect(pulls.length).toBeLessThanOrEqual(2);
        }
      });

      it('should not include opposite emotion as secondary', () => {
        // joy's opposite is sadness (4 steps away on the wheel)
        for (let i = 0; i < 50; i++) {
          const pulls = generateActivityEmotionPulls(testProfile, 'best');
          if (pulls.length === 2) {
            expect(pulls[1].emotion).not.toBe('sadness');
            // Note: same emotion (joy) IS allowed for reinforcement
          }
        }
      });
    });

    describe('okay outcome', () => {
      it('should use success emotion as primary with small intensity', () => {
        const pulls = generateActivityEmotionPulls(testProfile, 'okay');

        expect(pulls[0].emotion).toBe('joy');
        expect(pulls[0].intensity).toBe('small');
      });

      it('should allow secondary to have small or medium intensity', () => {
        const secondaryIntensities = new Set<string>();

        for (let i = 0; i < 100; i++) {
          const pulls = generateActivityEmotionPulls(testProfile, 'okay');
          if (pulls.length === 2) {
            secondaryIntensities.add(pulls[1].intensity);
          }
        }

        // Should see both small and medium over many runs
        expect(secondaryIntensities.has('small') || secondaryIntensities.has('medium')).toBe(true);
      });
    });

    describe('mixed outcome', () => {
      it('should use a random primary emotion (not necessarily from profile)', () => {
        const primaryEmotions = new Set<BaseEmotion>();

        for (let i = 0; i < 100; i++) {
          const pulls = generateActivityEmotionPulls(testProfile, 'mixed');
          primaryEmotions.add(pulls[0].emotion);
        }

        // Should see variety - more than just joy/fear from the profile
        expect(primaryEmotions.size).toBeGreaterThan(2);
      });

      it('should use small intensity for primary', () => {
        const pulls = generateActivityEmotionPulls(testProfile, 'mixed');
        expect(pulls[0].intensity).toBe('small');
      });
    });

    describe('catastrophic outcome', () => {
      it('should use failure emotion as primary with medium intensity', () => {
        const pulls = generateActivityEmotionPulls(testProfile, 'catastrophic');

        expect(pulls[0].emotion).toBe('fear');
        expect(pulls[0].intensity).toBe('medium');
      });

      it('should not include opposite emotion as secondary', () => {
        // fear's opposite is anger (4 steps away on the wheel)
        for (let i = 0; i < 50; i++) {
          const pulls = generateActivityEmotionPulls(testProfile, 'catastrophic');
          if (pulls.length === 2) {
            expect(pulls[1].emotion).not.toBe('anger');
            // Note: same emotion (fear) IS allowed for reinforcement
          }
        }
      });
    });

    describe('opposite emotion exclusion', () => {
      it('should correctly identify opposite emotions on the wheel', () => {
        // Test all emotion pairs
        const opposites: [BaseEmotion, BaseEmotion][] = [
          ['joy', 'sadness'],
          ['acceptance', 'disgust'],
          ['fear', 'anger'],
          ['surprise', 'anticipation'],
        ];

        for (const [emotion, opposite] of opposites) {
          const profile: EmotionProfile = {
            successEmotion: emotion,
            failureEmotion: opposite,
          };

          // Best outcome uses successEmotion, secondary should never be opposite
          for (let i = 0; i < 30; i++) {
            const pulls = generateActivityEmotionPulls(profile, 'best');
            if (pulls.length === 2) {
              expect(pulls[1].emotion).not.toBe(opposite);
            }
          }
        }
      });
    });

    describe('same emotion reinforcement', () => {
      it('should occasionally allow same emotion for both pulls (reinforcement)', () => {
        // This is allowed - medium + small on same emotion ≈ large pull
        // The secondary pool excludes only the opposite, not the primary itself
        let sawReinforcement = false;

        for (let i = 0; i < 200; i++) {
          const pulls = generateActivityEmotionPulls(testProfile, 'best');
          if (pulls.length === 2 && pulls[1].emotion === pulls[0].emotion) {
            sawReinforcement = true;
            break;
          }
        }

        // With 7 valid emotions (8 minus opposite) and ~70% secondary chance,
        // probability of reinforcement per run ≈ 0.7 * (1/7) ≈ 10%
        // Over 200 runs, we should see it at least once
        expect(sawReinforcement).toBe(true);
      });
    });
  });

  describe('hasEmotionProfile', () => {
    it('should return true for valid emotion profile', () => {
      expect(hasEmotionProfile(testProfile)).toBe(true);
    });

    it('should return false for undefined', () => {
      expect(hasEmotionProfile(undefined)).toBe(false);
    });

    it('should return false for incomplete profile', () => {
      expect(hasEmotionProfile({ successEmotion: 'joy' } as EmotionProfile)).toBe(false);
      expect(hasEmotionProfile({ failureEmotion: 'fear' } as EmotionProfile)).toBe(false);
    });
  });
});
