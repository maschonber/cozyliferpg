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
  calculateSurplusConversion,
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
      expect(tracking.statsTrainedToday).toEqual([]);
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

  describe('calculateSurplusConversion', () => {
    it('should return 0 for no surplus (current = base)', () => {
      const result = calculateSurplusConversion(50, 50);
      expect(result.baseGrowth).toBe(0);
      expect(result.currentDecay).toBe(0);
    });

    it('should return 0 for negative surplus (current < base)', () => {
      const result = calculateSurplusConversion(50, 45);
      expect(result.baseGrowth).toBe(0);
      expect(result.currentDecay).toBe(0);
    });

    it('should convert 25% to base and 50% to decay (30/46 → 34/38)', () => {
      const result = calculateSurplusConversion(30, 46);
      // surplus = 16
      // baseGrowth = 16 * 0.25 = 4
      // currentDecay = 16 * 0.5 = 8
      expect(result.baseGrowth).toBe(4);
      expect(result.currentDecay).toBe(8);
    });

    it('should convert 25% to base and 50% to decay (20/28 → 22/24)', () => {
      const result = calculateSurplusConversion(20, 28);
      // surplus = 8
      // baseGrowth = 8 * 0.25 = 2
      // currentDecay = 8 * 0.5 = 4
      expect(result.baseGrowth).toBe(2);
      expect(result.currentDecay).toBe(4);
    });

    it('should convert 25% to base and 50% to decay (4/5 → 4.25/4.5)', () => {
      const result = calculateSurplusConversion(4, 5);
      // surplus = 1
      // baseGrowth = 1 * 0.25 = 0.25
      // currentDecay = 1 * 0.5 = 0.5
      expect(result.baseGrowth).toBe(0.25);
      expect(result.currentDecay).toBe(0.5);
    });

    it('should respect base stat cap', () => {
      const result = calculateSurplusConversion(98, 118);
      // surplus = 20
      // baseGrowth would be 5, but capped at (100 - 98) = 2
      expect(result.baseGrowth).toBe(2);
      expect(result.currentDecay).toBe(10); // Decay still applies full 50%
    });

    it('should return 0 growth when base is at cap', () => {
      const result = calculateSurplusConversion(BASE_STAT_CAP, 120);
      expect(result.baseGrowth).toBe(0);
      expect(result.currentDecay).toBe(10); // 20 * 0.5, decay still happens
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
    it('should apply surplus conversion (30/46 → 34/38)', () => {
      const stats: PlayerStats = {
        baseFitness: 30, baseVitality: 50, basePoise: 50,
        baseKnowledge: 50, baseCreativity: 50, baseAmbition: 50,
        baseConfidence: 50, baseWit: 50, baseEmpathy: 50,
        currentFitness: 46, currentVitality: 50, currentPoise: 50,
        currentKnowledge: 50, currentCreativity: 50, currentAmbition: 50,
        currentConfidence: 50, currentWit: 50, currentEmpathy: 50
      };

      const result = processDailyStatChanges(stats, new Set());

      // Fitness: 30/46 → 34/38
      expect(result.newStats.baseFitness).toBe(34);
      expect(result.newStats.currentFitness).toBe(38);

      // Should have recorded the change
      const fitnessChange = result.changes.find(c => c.stat === 'fitness');
      expect(fitnessChange).toBeDefined();
      expect(fitnessChange?.baseDelta).toBe(4);
      expect(fitnessChange?.currentDelta).toBe(-8);
    });

    it('should apply surplus conversion (20/28 → 22/24)', () => {
      const stats: PlayerStats = {
        baseFitness: 20, baseVitality: 50, basePoise: 50,
        baseKnowledge: 50, baseCreativity: 50, baseAmbition: 50,
        baseConfidence: 50, baseWit: 50, baseEmpathy: 50,
        currentFitness: 28, currentVitality: 50, currentPoise: 50,
        currentKnowledge: 50, currentCreativity: 50, currentAmbition: 50,
        currentConfidence: 50, currentWit: 50, currentEmpathy: 50
      };

      const result = processDailyStatChanges(stats, new Set());

      // Fitness: 20/28 → 22/24
      expect(result.newStats.baseFitness).toBe(22);
      expect(result.newStats.currentFitness).toBe(24);
    });

    it('should apply surplus conversion (4/5 → 4.25/4.5)', () => {
      const stats: PlayerStats = {
        baseFitness: 4, baseVitality: 50, basePoise: 50,
        baseKnowledge: 50, baseCreativity: 50, baseAmbition: 50,
        baseConfidence: 50, baseWit: 50, baseEmpathy: 50,
        currentFitness: 5, currentVitality: 50, currentPoise: 50,
        currentKnowledge: 50, currentCreativity: 50, currentAmbition: 50,
        currentConfidence: 50, currentWit: 50, currentEmpathy: 50
      };

      const result = processDailyStatChanges(stats, new Set());

      // Fitness: 4/5 → 4.25/4.5
      expect(result.newStats.baseFitness).toBe(4.25);
      expect(result.newStats.currentFitness).toBe(4.5);
    });

    it('should do nothing when current = base', () => {
      const stats: PlayerStats = {
        baseFitness: 50, baseVitality: 50, basePoise: 50,
        baseKnowledge: 50, baseCreativity: 50, baseAmbition: 50,
        baseConfidence: 50, baseWit: 50, baseEmpathy: 50,
        currentFitness: 50, currentVitality: 50, currentPoise: 50,
        currentKnowledge: 50, currentCreativity: 50, currentAmbition: 50,
        currentConfidence: 50, currentWit: 50, currentEmpathy: 50
      };

      const result = processDailyStatChanges(stats, new Set());

      // No changes should occur
      expect(result.changes).toHaveLength(0);
      expect(result.newStats.baseFitness).toBe(50);
      expect(result.newStats.currentFitness).toBe(50);
    });

    it('should apply to all stats with surplus equally', () => {
      const stats: PlayerStats = {
        baseFitness: 30, baseVitality: 20, basePoise: 50,
        baseKnowledge: 50, baseCreativity: 50, baseAmbition: 50,
        baseConfidence: 50, baseWit: 50, baseEmpathy: 50,
        currentFitness: 46, currentVitality: 28, currentPoise: 50,
        currentKnowledge: 50, currentCreativity: 50, currentAmbition: 50,
        currentConfidence: 50, currentWit: 50, currentEmpathy: 50
      };

      const result = processDailyStatChanges(stats, new Set());

      // Both fitness and vitality should convert
      expect(result.newStats.baseFitness).toBe(34);
      expect(result.newStats.currentFitness).toBe(38);
      expect(result.newStats.baseVitality).toBe(22);
      expect(result.newStats.currentVitality).toBe(24);
      expect(result.changes).toHaveLength(2);
    });

    it('should work with defensive stats (trained flag is ignored)', () => {
      const stats: PlayerStats = {
        baseFitness: 50, baseVitality: 30, basePoise: 50,
        baseKnowledge: 50, baseCreativity: 50, baseAmbition: 20,
        baseConfidence: 50, baseWit: 50, baseEmpathy: 4,
        currentFitness: 50, currentVitality: 46, currentPoise: 50,
        currentKnowledge: 50, currentCreativity: 50, currentAmbition: 28,
        currentConfidence: 50, currentWit: 50, currentEmpathy: 5
      };

      // Even though we mark them as "trained", surplus conversion happens
      const trainedStats = new Set<StatName>(['vitality', 'ambition', 'empathy']);
      const result = processDailyStatChanges(stats, trainedStats);

      // All defensive stats should convert
      expect(result.newStats.baseVitality).toBe(34);
      expect(result.newStats.currentVitality).toBe(38);
      expect(result.newStats.baseAmbition).toBe(22);
      expect(result.newStats.currentAmbition).toBe(24);
      expect(result.newStats.baseEmpathy).toBe(4.25);
      expect(result.newStats.currentEmpathy).toBe(4.5);
      expect(result.changes).toHaveLength(3);
    });

    it('should include stat change components', () => {
      const stats: PlayerStats = {
        baseFitness: 30, baseVitality: 50, basePoise: 50,
        baseKnowledge: 50, baseCreativity: 50, baseAmbition: 50,
        baseConfidence: 50, baseWit: 50, baseEmpathy: 50,
        currentFitness: 46, currentVitality: 50, currentPoise: 50,
        currentKnowledge: 50, currentCreativity: 50, currentAmbition: 50,
        currentConfidence: 50, currentWit: 50, currentEmpathy: 50
      };

      const result = processDailyStatChanges(stats, new Set());

      // Should have components for fitness
      const fitnessComponents = result.components.get('fitness');
      expect(fitnessComponents).toBeDefined();
      expect(fitnessComponents).toHaveLength(2);
      expect(fitnessComponents![0].source).toBe('surplus_to_base');
      expect(fitnessComponents![1].source).toBe('surplus_decay');
    });
  });
});
