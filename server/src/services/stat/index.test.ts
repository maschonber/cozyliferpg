/**
 * Stat Service Tests (Phase 2.5)
 */

import {
  ALL_STATS,
  ARCHETYPE_STATS,
  getStartingStats,
  getDefaultTracking,
  applyDiminishingReturns,
  capCurrentStat,
  calculateBaseGrowth,
  calculateCurrentDecay,
  getBaseStat,
  getCurrentStat,
  setBaseStat,
  setCurrentStat,
  applyActivityStatGain,
  applyStatEffects,
  processDailyStatChanges,
  BASE_STAT_CAP,
  MAX_CURRENT_GAP
} from './index';
import { PlayerArchetype, PlayerStats, StatName } from '../../../../shared/types';

describe('Stat Service', () => {
  describe('Constants', () => {
    it('should have 9 stats', () => {
      expect(ALL_STATS).toHaveLength(9);
    });

    it('should have all stat categories', () => {
      expect(ALL_STATS).toContain('fitness');
      expect(ALL_STATS).toContain('vitality');
      expect(ALL_STATS).toContain('poise');
      expect(ALL_STATS).toContain('knowledge');
      expect(ALL_STATS).toContain('creativity');
      expect(ALL_STATS).toContain('ambition');
      expect(ALL_STATS).toContain('confidence');
      expect(ALL_STATS).toContain('wit');
      expect(ALL_STATS).toContain('empathy');
    });

    it('should have 6 archetypes', () => {
      const archetypes = Object.keys(ARCHETYPE_STATS);
      expect(archetypes).toHaveLength(6);
      expect(archetypes).toContain('athlete');
      expect(archetypes).toContain('scholar');
      expect(archetypes).toContain('social_butterfly');
      expect(archetypes).toContain('artist');
      expect(archetypes).toContain('professional');
      expect(archetypes).toContain('balanced');
    });
  });

  describe('getStartingStats', () => {
    it('should return balanced stats for balanced archetype', () => {
      const stats = getStartingStats('balanced');
      expect(stats.baseFitness).toBe(15);
      expect(stats.baseVitality).toBe(15);
      expect(stats.basePoise).toBe(15);
      expect(stats.baseKnowledge).toBe(15);
      expect(stats.baseCreativity).toBe(15);
      expect(stats.baseAmbition).toBe(15);
      expect(stats.baseConfidence).toBe(15);
      expect(stats.baseWit).toBe(15);
      expect(stats.baseEmpathy).toBe(15);
    });

    it('should return high physical stats for athlete archetype', () => {
      const stats = getStartingStats('athlete');
      expect(stats.baseFitness).toBe(25);
      expect(stats.baseVitality).toBe(25);
      expect(stats.baseConfidence).toBe(15);
      expect(stats.baseKnowledge).toBe(5);
    });

    it('should have current stats equal to base stats on creation', () => {
      const stats = getStartingStats('balanced');
      expect(stats.currentFitness).toBe(stats.baseFitness);
      expect(stats.currentVitality).toBe(stats.baseVitality);
      expect(stats.currentPoise).toBe(stats.basePoise);
    });
  });

  describe('getDefaultTracking', () => {
    it('should return default tracking values', () => {
      const tracking = getDefaultTracking();
      expect(tracking.minEnergyToday).toBe(100);
      expect(tracking.workStreak).toBe(0);
      expect(tracking.restStreak).toBe(0);
      expect(tracking.burnoutStreak).toBe(0);
      expect(tracking.lateNightStreak).toBe(0);
      expect(tracking.workedToday).toBe(false);
      expect(tracking.hadCatastrophicFailureToday).toBe(false);
    });
  });

  describe('applyDiminishingReturns', () => {
    it('should give full gain at low stat values', () => {
      const result = applyDiminishingReturns(10, 0);
      expect(result).toBe(10);
    });

    it('should reduce gain at higher stat values', () => {
      const result = applyDiminishingReturns(10, 75);
      expect(result).toBe(5); // 10 * (1 - 75/150) = 10 * 0.5 = 5
    });

    it('should give zero gain at cap', () => {
      const result = applyDiminishingReturns(10, 150);
      expect(result).toBe(0);
    });

    it('should not give negative gain above cap', () => {
      const result = applyDiminishingReturns(10, 200);
      expect(result).toBe(0);
    });
  });

  describe('capCurrentStat', () => {
    it('should allow current up to base + MAX_CURRENT_GAP', () => {
      const result = capCurrentStat(50, 80);
      expect(result).toBe(80); // 50 + 30 = 80, allowed
    });

    it('should cap current at base + MAX_CURRENT_GAP', () => {
      const result = capCurrentStat(50, 100);
      expect(result).toBe(80); // 50 + 30 = 80, capped
    });

    it('should not allow current below 0', () => {
      const result = capCurrentStat(50, -10);
      expect(result).toBe(0);
    });

    it('should respect absolute max of BASE_STAT_CAP + MAX_CURRENT_GAP', () => {
      const result = capCurrentStat(100, 200);
      expect(result).toBe(130); // 100 + 30 = 130
    });
  });

  describe('calculateBaseGrowth', () => {
    it('should return 0 growth at base cap', () => {
      const result = calculateBaseGrowth(BASE_STAT_CAP, 120);
      expect(result).toBe(0);
    });

    it('should return 0 growth when gap < 10', () => {
      const result = calculateBaseGrowth(50, 55);
      expect(result).toBe(0);
    });

    it('should return 0.3 growth for gap 10-19', () => {
      const result = calculateBaseGrowth(50, 60);
      expect(result).toBe(0.3);
    });

    it('should return 0.5 growth for gap 20-29', () => {
      const result = calculateBaseGrowth(50, 70);
      expect(result).toBe(0.5);
    });

    it('should return 0.8 growth for gap >= 30', () => {
      const result = calculateBaseGrowth(50, 80);
      expect(result).toBe(0.8);
    });
  });

  describe('calculateCurrentDecay', () => {
    it('should return 0 decay if trained today', () => {
      const result = calculateCurrentDecay(50, 70, true);
      expect(result).toBe(0);
    });

    it('should return 0 decay if current <= base', () => {
      const result = calculateCurrentDecay(50, 50, false);
      expect(result).toBe(0);
    });

    it('should return 0.5 decay for small gaps', () => {
      const result = calculateCurrentDecay(50, 55, false);
      expect(result).toBe(0.5);
    });

    it('should return 1.0 decay for medium gaps', () => {
      const result = calculateCurrentDecay(50, 65, false);
      expect(result).toBe(1.0);
    });

    it('should return 1.5 decay for large gaps', () => {
      const result = calculateCurrentDecay(50, 75, false);
      expect(result).toBe(1.5);
    });
  });

  describe('Stat Accessors', () => {
    const testStats: PlayerStats = {
      baseFitness: 20, baseVitality: 25, basePoise: 15,
      baseKnowledge: 30, baseCreativity: 10, baseAmbition: 18,
      baseConfidence: 22, baseWit: 12, baseEmpathy: 28,
      currentFitness: 25, currentVitality: 30, currentPoise: 20,
      currentKnowledge: 35, currentCreativity: 15, currentAmbition: 23,
      currentConfidence: 27, currentWit: 17, currentEmpathy: 33
    };

    it('should get base stat by name', () => {
      expect(getBaseStat(testStats, 'fitness')).toBe(20);
      expect(getBaseStat(testStats, 'knowledge')).toBe(30);
      expect(getBaseStat(testStats, 'empathy')).toBe(28);
    });

    it('should get current stat by name', () => {
      expect(getCurrentStat(testStats, 'fitness')).toBe(25);
      expect(getCurrentStat(testStats, 'knowledge')).toBe(35);
      expect(getCurrentStat(testStats, 'empathy')).toBe(33);
    });

    it('should set base stat by name with cap', () => {
      const newStats = setBaseStat(testStats, 'fitness', 110);
      expect(newStats.baseFitness).toBe(100); // Capped at BASE_STAT_CAP
    });

    it('should set current stat by name with cap', () => {
      const newStats = setCurrentStat(testStats, 'fitness', 100);
      expect(newStats.currentFitness).toBe(50); // Capped at base + 30 = 20 + 30 = 50
    });
  });

  describe('applyActivityStatGain', () => {
    const baseStats: PlayerStats = {
      baseFitness: 50, baseVitality: 50, basePoise: 50,
      baseKnowledge: 50, baseCreativity: 50, baseAmbition: 50,
      baseConfidence: 50, baseWit: 50, baseEmpathy: 50,
      currentFitness: 50, currentVitality: 50, currentPoise: 50,
      currentKnowledge: 50, currentCreativity: 50, currentAmbition: 50,
      currentConfidence: 50, currentWit: 50, currentEmpathy: 50
    };

    it('should apply stat gain with diminishing returns', () => {
      const result = applyActivityStatGain(baseStats, 'fitness', 10);
      // currentFitness = 50, so diminishing = 10 * (1 - 50/150) = 10 * 0.67 = 6.7 rounded
      expect(result.actualGain).toBeCloseTo(6.67, 1);
      expect(result.newStats.currentFitness).toBeCloseTo(56.67, 1);
    });

    it('should cap at base + MAX_CURRENT_GAP', () => {
      const highCurrentStats = { ...baseStats, currentFitness: 75 };
      const result = applyActivityStatGain(highCurrentStats, 'fitness', 20);
      expect(result.newStats.currentFitness).toBe(80); // Capped at 50 + 30
    });
  });

  describe('applyStatEffects', () => {
    const baseStats: PlayerStats = {
      baseFitness: 50, baseVitality: 50, basePoise: 50,
      baseKnowledge: 50, baseCreativity: 50, baseAmbition: 50,
      baseConfidence: 50, baseWit: 50, baseEmpathy: 50,
      currentFitness: 50, currentVitality: 50, currentPoise: 50,
      currentKnowledge: 50, currentCreativity: 50, currentAmbition: 50,
      currentConfidence: 50, currentWit: 50, currentEmpathy: 50
    };

    it('should apply multiple positive stat effects', () => {
      const result = applyStatEffects(baseStats, { fitness: 5, knowledge: 3 });
      expect(result.newStats.currentFitness).toBeGreaterThan(50);
      expect(result.newStats.currentKnowledge).toBeGreaterThan(50);
    });

    it('should apply negative stat effects without diminishing returns', () => {
      const result = applyStatEffects(baseStats, { fitness: -5 });
      // Negative changes apply directly, but can't go below base
      expect(result.newStats.currentFitness).toBe(50); // Can't go below base
    });

    it('should allow negative effects to reduce current stat', () => {
      const highCurrentStats = { ...baseStats, currentFitness: 60 };
      const result = applyStatEffects(highCurrentStats, { fitness: -5 });
      expect(result.newStats.currentFitness).toBe(55);
    });
  });

  describe('processDailyStatChanges', () => {
    it('should grow base stat when current exceeds base by >= 10', () => {
      const stats: PlayerStats = {
        baseFitness: 50, baseVitality: 50, basePoise: 50,
        baseKnowledge: 50, baseCreativity: 50, baseAmbition: 50,
        baseConfidence: 50, baseWit: 50, baseEmpathy: 50,
        currentFitness: 65, currentVitality: 50, currentPoise: 50,
        currentKnowledge: 50, currentCreativity: 50, currentAmbition: 50,
        currentConfidence: 50, currentWit: 50, currentEmpathy: 50
      };

      const result = processDailyStatChanges(stats, new Set());

      // Fitness should grow (gap = 15)
      expect(result.newStats.baseFitness).toBeGreaterThan(50);

      // Should have recorded the change
      const fitnessChange = result.changes.find(c => c.stat === 'fitness');
      expect(fitnessChange).toBeDefined();
      expect(fitnessChange?.baseDelta).toBe(0.3);
    });

    it('should decay untrained stats toward base', () => {
      const stats: PlayerStats = {
        baseFitness: 50, baseVitality: 50, basePoise: 50,
        baseKnowledge: 50, baseCreativity: 50, baseAmbition: 50,
        baseConfidence: 50, baseWit: 50, baseEmpathy: 50,
        currentFitness: 55, currentVitality: 50, currentPoise: 50,
        currentKnowledge: 50, currentCreativity: 50, currentAmbition: 50,
        currentConfidence: 50, currentWit: 50, currentEmpathy: 50
      };

      const result = processDailyStatChanges(stats, new Set());

      // Fitness should decay (gap = 5, not trained)
      expect(result.newStats.currentFitness).toBeLessThan(55);
    });

    it('should not decay trained stats', () => {
      const stats: PlayerStats = {
        baseFitness: 50, baseVitality: 50, basePoise: 50,
        baseKnowledge: 50, baseCreativity: 50, baseAmbition: 50,
        baseConfidence: 50, baseWit: 50, baseEmpathy: 50,
        currentFitness: 55, currentVitality: 50, currentPoise: 50,
        currentKnowledge: 50, currentCreativity: 50, currentAmbition: 50,
        currentConfidence: 50, currentWit: 50, currentEmpathy: 50
      };

      const trainedStats = new Set<StatName>(['fitness']);
      const result = processDailyStatChanges(stats, trainedStats);

      // Fitness should not decay since it was trained
      // But it may still have base growth if gap >= 10
      const fitnessChange = result.changes.find(c => c.stat === 'fitness');
      // Gap is only 5, so no base growth
      expect(fitnessChange).toBeUndefined();
      expect(result.newStats.currentFitness).toBe(55);
    });
  });
});
