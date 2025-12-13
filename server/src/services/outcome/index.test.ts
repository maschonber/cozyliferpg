/**
 * Outcome Service Tests (Phase 2.5 - Updated for 2d100 system)
 */

import {
  BASE_DC,
  OUTCOME_OFFSETS,
  CRIT_RANGES,
  calculateStatBonus,
  calculateDC,
  determineOutcomeTier,
  applyCritShift,
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

  describe('Constants', () => {
    it('should have correct BASE_DC', () => {
      expect(BASE_DC).toBe(100);
    });

    it('should have correct OUTCOME_OFFSETS', () => {
      expect(OUTCOME_OFFSETS.catastrophic).toBe(-50);
      expect(OUTCOME_OFFSETS.best).toBe(50);
    });

    it('should have correct CRIT_RANGES', () => {
      expect(CRIT_RANGES.fail).toEqual({ min: 2, max: 50 });
      expect(CRIT_RANGES.success).toEqual({ min: 152, max: 200 });
    });
  });

  describe('calculateStatBonus', () => {
    it('should return 0 for no relevant stats', () => {
      const bonus = calculateStatBonus(testStats, []);
      expect(bonus).toBe(0);
    });

    it('should calculate bonus from single stat (full value)', () => {
      // currentFitness = 45, bonus = 45 (no division)
      const bonus = calculateStatBonus(testStats, ['fitness']);
      expect(bonus).toBe(45);
    });

    it('should calculate average bonus from multiple stats', () => {
      // currentFitness = 45, currentKnowledge = 60
      // average = (45 + 60) / 2 = 52.5 rounded = 53
      const bonus = calculateStatBonus(testStats, ['fitness', 'knowledge']);
      expect(bonus).toBe(53);
    });
  });

  describe('calculateDC', () => {
    it('should calculate DC as BASE_DC + difficulty', () => {
      expect(calculateDC(50)).toBe(150);
      expect(calculateDC(30)).toBe(130);
      expect(calculateDC(0)).toBe(100);
    });
  });

  describe('determineOutcomeTier', () => {
    const dc = 150; // Base test DC

    it('should return catastrophic for total <= DC - 50', () => {
      expect(determineOutcomeTier(100, dc)).toBe('catastrophic'); // 150 - 50 = 100
      expect(determineOutcomeTier(50, dc)).toBe('catastrophic');
      expect(determineOutcomeTier(0, dc)).toBe('catastrophic');
    });

    it('should return mixed for total < DC but > DC - 50', () => {
      expect(determineOutcomeTier(101, dc)).toBe('mixed');
      expect(determineOutcomeTier(125, dc)).toBe('mixed');
      expect(determineOutcomeTier(149, dc)).toBe('mixed');
    });

    it('should return okay for total >= DC but < DC + 50', () => {
      expect(determineOutcomeTier(150, dc)).toBe('okay');
      expect(determineOutcomeTier(175, dc)).toBe('okay');
      expect(determineOutcomeTier(199, dc)).toBe('okay');
    });

    it('should return best for total >= DC + 50', () => {
      expect(determineOutcomeTier(200, dc)).toBe('best'); // 150 + 50 = 200
      expect(determineOutcomeTier(250, dc)).toBe('best');
      expect(determineOutcomeTier(300, dc)).toBe('best');
    });
  });

  describe('applyCritShift', () => {
    it('should improve tier on crit success', () => {
      expect(applyCritShift('catastrophic', true, false)).toBe('mixed');
      expect(applyCritShift('mixed', true, false)).toBe('okay');
      expect(applyCritShift('okay', true, false)).toBe('best');
      expect(applyCritShift('best', true, false)).toBe('best'); // Can't improve
    });

    it('should worsen tier on crit fail', () => {
      expect(applyCritShift('best', false, true)).toBe('okay');
      expect(applyCritShift('okay', false, true)).toBe('mixed');
      expect(applyCritShift('mixed', false, true)).toBe('catastrophic');
      expect(applyCritShift('catastrophic', false, true)).toBe('catastrophic'); // Can't worsen
    });

    it('should not change tier if no crit', () => {
      expect(applyCritShift('catastrophic', false, false)).toBe('catastrophic');
      expect(applyCritShift('mixed', false, false)).toBe('mixed');
      expect(applyCritShift('okay', false, false)).toBe('okay');
      expect(applyCritShift('best', false, false)).toBe('best');
    });
  });

  describe('rollOutcome', () => {
    it('should use provided 2d100 value for deterministic testing', () => {
      const result = rollOutcome(testStats, ['fitness'], 50, 100);
      expect(result.roll).toBe(100);
    });

    it('should calculate total correctly with 2d100 system', () => {
      // 2d100 roll = 100, fitness bonus = 45 (full stat), DC = 150 (100 + 50)
      // Total = 100 + 45 = 145
      // 145 < 150 (DC) but > 100 (DC - 50), so Mixed
      const result = rollOutcome(testStats, ['fitness'], 50, 100);
      expect(result.statBonus).toBe(45);
      expect(result.dc).toBe(150);
      expect(result.adjustedRoll).toBe(145);
      expect(result.tier).toBe('mixed');
    });

    it('should return catastrophic for low total', () => {
      // 2d100 roll = 20, no bonus, DC = 150 (100 + 50)
      // Total = 20 + 0 = 20
      // 20 <= 100 (DC - 50), so Catastrophic
      const result = rollOutcome(testStats, [], 50, 20);
      expect(result.tier).toBe('catastrophic');
    });

    it('should return best for high total', () => {
      // 2d100 roll = 180, knowledge bonus = 60, DC = 130 (100 + 30)
      // Total = 180 + 60 = 240
      // 240 >= 180 (DC + 50), so Best
      const result = rollOutcome(testStats, ['knowledge'], 30, 180);
      expect(result.tier).toBe('best');
    });

    it('should detect crit failure', () => {
      // Roll = 30 (within crit fail range 2-50)
      const result = rollOutcome(testStats, ['fitness'], 50, 30);
      expect(result.isCritFail).toBe(true);
      expect(result.isCritSuccess).toBe(false);
    });

    it('should detect crit success', () => {
      // Roll = 160 (within crit success range 152-200)
      const result = rollOutcome(testStats, ['fitness'], 50, 160);
      expect(result.isCritSuccess).toBe(true);
      expect(result.isCritFail).toBe(false);
    });

    it('should generate random 2d100 roll if not provided', () => {
      const result = rollOutcome(testStats, ['fitness'], 50);
      expect(result.roll).toBeGreaterThanOrEqual(2);
      expect(result.roll).toBeLessThanOrEqual(200);
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
    it('should return probabilities that sum to approximately 100', () => {
      const probs = calculateOutcomeProbabilities(50, 50);
      const total = probs.catastrophic + probs.mixed + probs.okay + probs.best;
      // Allow for rounding errors
      expect(total).toBeGreaterThanOrEqual(99.9);
      expect(total).toBeLessThanOrEqual(100.1);
    });

    it('should have higher best probability with high stats and low difficulty', () => {
      const highProbs = calculateOutcomeProbabilities(90, 20); // Easy for skilled
      const lowProbs = calculateOutcomeProbabilities(20, 80);   // Hard for unskilled
      expect(highProbs.best).toBeGreaterThan(lowProbs.best);
    });

    it('should have higher catastrophic probability with low stats and high difficulty', () => {
      const hardProbs = calculateOutcomeProbabilities(10, 90);  // Very hard for unskilled
      const easyProbs = calculateOutcomeProbabilities(90, 10);  // Easy for skilled
      expect(hardProbs.catastrophic).toBeGreaterThan(easyProbs.catastrophic);
    });

    it('should show meaningful spread for balanced scenario', () => {
      // Stat 45, difficulty 45 = balanced (DC 145, total avg ~146)
      const probs = calculateOutcomeProbabilities(45, 45);
      expect(probs.catastrophic).toBeGreaterThan(0);
      expect(probs.mixed).toBeGreaterThan(0);
      expect(probs.okay).toBeGreaterThan(0);
      expect(probs.best).toBeGreaterThan(0);
      // Mixed + Okay should be dominant in balanced scenario
      expect(probs.mixed + probs.okay).toBeGreaterThan(50);
    });

    it('should show bell curve effect (extremes less likely)', () => {
      // Medium stat vs medium difficulty should have low extremes
      const probs = calculateOutcomeProbabilities(50, 50);
      // Catastrophic and Best should be relatively rare
      expect(probs.catastrophic + probs.best).toBeLessThan(probs.mixed + probs.okay);
    });
  });

  describe('meetsStatRequirements', () => {
    const requirements: Partial<Record<StatName, number>> = {
      fitness: 25,
      knowledge: 25  // Changed from 40 to match testStats base values
    };

    it('should pass when current stats meet requirements', () => {
      const result = meetsStatRequirements(testStats, requirements);
      expect(result.meets).toBe(true);
      expect(result.unmet).toHaveLength(0);
    });

    it('should fail when current stats are too low', () => {
      const lowStats: PlayerStats = {
        ...testStats,
        currentFitness: 20,  // Below required 25
        currentKnowledge: 20 // Below required 25
      };
      const result = meetsStatRequirements(lowStats, requirements);
      expect(result.meets).toBe(false);
      expect(result.unmet).toHaveLength(2);
      expect(result.unmet).toContainEqual({ stat: 'fitness', required: 25, actual: 20 });
      expect(result.unmet).toContainEqual({ stat: 'knowledge', required: 25, actual: 20 });
    });

    it('should check CURRENT stat not base stat', () => {
      // testStats has baseFitness=30 but currentFitness=45
      // Requirement is 35, so current meets it even though base doesn't
      const result = meetsStatRequirements(testStats, { fitness: 35 });
      expect(result.meets).toBe(true);
      expect(result.unmet).toHaveLength(0);
    });

    it('should fail when current stat is below requirement even with high base', () => {
      // Test the opposite: high base but low current
      const testStatsLowCurrent: PlayerStats = {
        ...testStats,
        baseFitness: 50,    // High base
        currentFitness: 20  // Low current
      };
      const result = meetsStatRequirements(testStatsLowCurrent, { fitness: 35 });
      expect(result.meets).toBe(false);
      expect(result.unmet[0].actual).toBe(20); // Uses current, not base
    });

    it('should handle empty requirements', () => {
      const result = meetsStatRequirements(testStats, {});
      expect(result.meets).toBe(true);
      expect(result.unmet).toHaveLength(0);
    });
  });
});
