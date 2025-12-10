/**
 * Outcome Service Tests (Phase 2.5)
 */

import {
  OUTCOME_THRESHOLDS,
  calculateStatBonus,
  calculateDifficultyPenalty,
  determineOutcomeTier,
  rollOutcome,
  scaleEffectByTier,
  calculateOutcomeProbabilities,
  meetsStatRequirements
} from './index';
import { PlayerStats, StatName } from '../../../../shared/types';

describe('Outcome Service', () => {
  const testStats: PlayerStats = {
    baseFitness: 30, baseVitality: 30, basePoise: 30,
    baseKnowledge: 30, baseCreativity: 30, baseAmbition: 30,
    baseConfidence: 30, baseWit: 30, baseEmpathy: 30,
    currentFitness: 45, currentVitality: 30, currentPoise: 30,
    currentKnowledge: 60, currentCreativity: 30, currentAmbition: 30,
    currentConfidence: 30, currentWit: 30, currentEmpathy: 30
  };

  describe('OUTCOME_THRESHOLDS', () => {
    it('should have correct threshold values', () => {
      expect(OUTCOME_THRESHOLDS.catastrophic).toBe(20);
      expect(OUTCOME_THRESHOLDS.mixed).toBe(45);
      expect(OUTCOME_THRESHOLDS.okay).toBe(80);
      expect(OUTCOME_THRESHOLDS.best).toBe(80);
    });
  });

  describe('calculateStatBonus', () => {
    it('should return 0 for no relevant stats', () => {
      const bonus = calculateStatBonus(testStats, []);
      expect(bonus).toBe(0);
    });

    it('should calculate bonus from single stat', () => {
      // currentFitness = 45, bonus = 45/3 = 15
      const bonus = calculateStatBonus(testStats, ['fitness']);
      expect(bonus).toBe(15);
    });

    it('should calculate average bonus from multiple stats', () => {
      // currentFitness = 45, currentKnowledge = 60
      // average = (45 + 60) / 2 = 52.5
      // bonus = 52.5 / 3 = 17.5 rounded = 18
      const bonus = calculateStatBonus(testStats, ['fitness', 'knowledge']);
      expect(bonus).toBe(18);
    });
  });

  describe('calculateDifficultyPenalty', () => {
    it('should calculate penalty as half of difficulty', () => {
      expect(calculateDifficultyPenalty(50)).toBe(25);
      expect(calculateDifficultyPenalty(30)).toBe(15);
      expect(calculateDifficultyPenalty(75)).toBe(38);
    });

    it('should round to nearest integer', () => {
      expect(calculateDifficultyPenalty(25)).toBe(13); // 12.5 rounded
    });
  });

  describe('determineOutcomeTier', () => {
    it('should return catastrophic for rolls below 20', () => {
      expect(determineOutcomeTier(0)).toBe('catastrophic');
      expect(determineOutcomeTier(10)).toBe('catastrophic');
      expect(determineOutcomeTier(19)).toBe('catastrophic');
    });

    it('should return mixed for rolls 20-44', () => {
      expect(determineOutcomeTier(20)).toBe('mixed');
      expect(determineOutcomeTier(30)).toBe('mixed');
      expect(determineOutcomeTier(44)).toBe('mixed');
    });

    it('should return okay for rolls 45-79', () => {
      expect(determineOutcomeTier(45)).toBe('okay');
      expect(determineOutcomeTier(60)).toBe('okay');
      expect(determineOutcomeTier(79)).toBe('okay');
    });

    it('should return best for rolls 80+', () => {
      expect(determineOutcomeTier(80)).toBe('best');
      expect(determineOutcomeTier(100)).toBe('best');
      expect(determineOutcomeTier(150)).toBe('best');
    });
  });

  describe('rollOutcome', () => {
    it('should use provided roll value for deterministic testing', () => {
      const result = rollOutcome(testStats, ['fitness'], 50, 50);
      expect(result.roll).toBe(50);
    });

    it('should calculate adjusted roll correctly', () => {
      // Roll 50, fitness bonus = 15, difficulty 50 penalty = 25
      // Adjusted = 50 + 15 - 25 = 40
      const result = rollOutcome(testStats, ['fitness'], 50, 50);
      expect(result.statBonus).toBe(15);
      expect(result.difficultyPenalty).toBe(25);
      expect(result.adjustedRoll).toBe(40);
      expect(result.tier).toBe('mixed');
    });

    it('should return catastrophic for low adjusted roll', () => {
      // Roll 10, no bonus, difficulty 50 penalty = 25
      // Adjusted = 10 + 0 - 25 = -15
      const result = rollOutcome(testStats, [], 50, 10);
      expect(result.tier).toBe('catastrophic');
    });

    it('should return best for high adjusted roll', () => {
      // Roll 90, knowledge bonus = 20, difficulty 30 penalty = 15
      // Adjusted = 90 + 20 - 15 = 95
      const result = rollOutcome(testStats, ['knowledge'], 30, 90);
      expect(result.tier).toBe('best');
    });

    it('should generate random roll if not provided', () => {
      const result = rollOutcome(testStats, ['fitness'], 50);
      expect(result.roll).toBeGreaterThanOrEqual(1);
      expect(result.roll).toBeLessThanOrEqual(100);
    });
  });

  describe('scaleEffectByTier', () => {
    describe('positive effects', () => {
      it('should scale to 150% for best tier', () => {
        const result = scaleEffectByTier(10, 'best', true);
        expect(result).toBe(15);
      });

      it('should not change for okay tier', () => {
        const result = scaleEffectByTier(10, 'okay', true);
        expect(result).toBe(10);
      });

      it('should scale to 50% for mixed tier', () => {
        const result = scaleEffectByTier(10, 'mixed', true);
        expect(result).toBe(5);
      });

      it('should flip to negative 30% for catastrophic tier', () => {
        const result = scaleEffectByTier(10, 'catastrophic', true);
        expect(result).toBe(-3);
      });
    });

    describe('negative effects', () => {
      it('should not change negative effect for best tier', () => {
        const result = scaleEffectByTier(-10, 'best', false);
        expect(result).toBe(-10);
      });

      it('should not change negative effect for okay tier', () => {
        const result = scaleEffectByTier(-10, 'okay', false);
        expect(result).toBe(-10);
      });

      it('should not change negative effect for mixed tier', () => {
        const result = scaleEffectByTier(-10, 'mixed', false);
        expect(result).toBe(-10);
      });

      it('should amplify negative effect for catastrophic tier', () => {
        const result = scaleEffectByTier(-10, 'catastrophic', false);
        expect(result).toBe(-15);
      });
    });
  });

  describe('calculateOutcomeProbabilities', () => {
    it('should return probabilities that sum to 100', () => {
      const probs = calculateOutcomeProbabilities(50, 50);
      const total = probs.catastrophic + probs.mixed + probs.okay + probs.best;
      expect(total).toBe(100);
    });

    it('should have higher best probability with high stats and low difficulty', () => {
      const highProbs = calculateOutcomeProbabilities(90, 20);
      const lowProbs = calculateOutcomeProbabilities(20, 80);
      expect(highProbs.best).toBeGreaterThan(lowProbs.best);
    });

    it('should have higher catastrophic probability with low stats and high difficulty', () => {
      const hardProbs = calculateOutcomeProbabilities(10, 90);
      const easyProbs = calculateOutcomeProbabilities(90, 10);
      expect(hardProbs.catastrophic).toBeGreaterThan(easyProbs.catastrophic);
    });

    it('should show meaningful spread for balanced scenario', () => {
      // Stat 45, difficulty 50
      // bonus = 45/3 = 15, penalty = 50/2 = 25, modifier = -10
      const probs = calculateOutcomeProbabilities(45, 50);
      // With -10 modifier, need to roll 30 for catastrophic (adjusted 20)
      // catastrophic: rolls 1-29 (29%)
      // mixed: rolls 30-54 (25%)
      // okay: rolls 55-89 (35%)
      // best: rolls 90-100 (11%)
      expect(probs.catastrophic).toBeGreaterThan(0);
      expect(probs.mixed).toBeGreaterThan(0);
      expect(probs.okay).toBeGreaterThan(0);
      expect(probs.best).toBeGreaterThan(0);
    });
  });

  describe('meetsStatRequirements', () => {
    const requirements: Partial<Record<StatName, number>> = {
      fitness: 25,
      knowledge: 25  // Changed from 40 to match testStats base values
    };

    it('should pass when base stats meet requirements', () => {
      const result = meetsStatRequirements(testStats, requirements);
      expect(result.meets).toBe(true);
      expect(result.unmet).toHaveLength(0);
    });

    it('should fail when base stats are too low', () => {
      const lowStats: PlayerStats = {
        ...testStats,
        baseFitness: 20,  // Below required 25
        baseKnowledge: 20 // Below required 25
      };
      const result = meetsStatRequirements(lowStats, requirements);
      expect(result.meets).toBe(false);
      expect(result.unmet).toHaveLength(2);
      expect(result.unmet).toContainEqual({ stat: 'fitness', required: 25, actual: 20 });
      expect(result.unmet).toContainEqual({ stat: 'knowledge', required: 25, actual: 20 });
    });

    it('should check BASE stat not current stat', () => {
      // testStats has baseFitness=30 but currentFitness=45
      // Requirement is 35, so base doesn't meet it even though current does
      const result = meetsStatRequirements(testStats, { fitness: 35 });
      expect(result.meets).toBe(false);
      expect(result.unmet[0].actual).toBe(30); // Uses base, not current
    });

    it('should handle empty requirements', () => {
      const result = meetsStatRequirements(testStats, {});
      expect(result.meets).toBe(true);
      expect(result.unmet).toHaveLength(0);
    });
  });
});
