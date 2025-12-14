/**
 * Tests for Defensive Stats Service
 * Validates fixes for work/rest streak timing and negative interaction filtering
 */

import { Pool } from 'pg';
import {
  calculateVitalityChange,
  calculateAmbitionChange,
  calculateEmpathyChange
} from './index';
import { PlayerCharacter, StatTracking } from '../../../../shared/types';
import { getStartingStats } from '../stat';

// Mock pool for database operations
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
  on: jest.fn()
} as unknown as Pool;

// Helper to create a test player
function createTestPlayer(trackingOverrides: Partial<StatTracking> = {}): PlayerCharacter {
  return {
    id: 'test-player-id',
    userId: 'test-user-id',
    currentDay: 1,
    currentTime: '12:00',
    currentEnergy: 50,
    maxEnergy: 100,
    currentLocation: 'home',
    money: 100,
    lastSleptAt: '23:00',
    archetype: 'balanced',
    stats: getStartingStats('balanced'),
    tracking: {
      minEnergyToday: 50,
      endingEnergyToday: 50,
      workStreak: 0,
      restStreak: 0,
      burnoutStreak: 0,
      lateNightStreak: 0,
      workedToday: false,
      hadCatastrophicFailureToday: false,
      statsTrainedToday: [],
      ...trackingOverrides
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

describe('Defensive Stats - Bug Fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bug #1 & #2: Work/Rest Streak Timing', () => {
    describe('Vitality - Rest Day After Work', () => {
      it('should give bonus on first rest day after working (restStreak=1, workStreak=0)', async () => {
        const player = createTestPlayer({
          workedToday: false,  // Resting today
          workStreak: 0,       // Just reset (worked yesterday)
          restStreak: 1        // First rest day
        });

        const result = await calculateVitalityChange(player, '23:00');

        const restBonus = result.components.find(c => c.source === 'vitality_rest_recovery');
        expect(restBonus).toBeDefined();
        expect(restBonus?.value).toBe(2.0);
      });

      it('should NOT give bonus when still working (workStreak > 0)', async () => {
        const player = createTestPlayer({
          workedToday: true,   // Still working
          workStreak: 2,       // Work streak
          restStreak: 0
        });

        const result = await calculateVitalityChange(player, '23:00');

        const restBonus = result.components.find(c => c.source === 'vitality_rest_recovery');
        expect(restBonus).toBeUndefined();
      });

      it('should NOT give bonus on second+ rest day (restStreak > 1)', async () => {
        const player = createTestPlayer({
          workedToday: false,  // Resting
          workStreak: 0,
          restStreak: 2        // Second rest day
        });

        const result = await calculateVitalityChange(player, '23:00');

        const restBonus = result.components.find(c => c.source === 'vitality_rest_recovery');
        expect(restBonus).toBeUndefined();
      });
    });

    describe('Vitality - Consecutive Work/Rest Penalties', () => {
      it('should penalize consecutive work days when workStreak >= 3', async () => {
        const player = createTestPlayer({
          workedToday: true,
          workStreak: 3  // Including today
        });

        const result = await calculateVitalityChange(player, '23:00');

        const penalty = result.components.find(c => c.source === 'vitality_overwork');
        expect(penalty).toBeDefined();
        expect(penalty?.value).toBe(-1.5); // -1.5 * (3 - 2) = -1.5
      });

      it('should NOT penalize work streak on first rest day after working', async () => {
        const player = createTestPlayer({
          workedToday: false,  // Resting today
          workStreak: 0,       // Reset (worked 3 days before)
          restStreak: 1        // First rest day
        });

        const result = await calculateVitalityChange(player, '23:00');

        const penalty = result.components.find(c => c.source === 'vitality_overwork');
        expect(penalty).toBeUndefined();
      });

      it('should penalize consecutive rest days when restStreak >= 3', async () => {
        const player = createTestPlayer({
          workedToday: false,
          restStreak: 3  // Including today
        });

        const result = await calculateVitalityChange(player, '23:00');

        const penalty = result.components.find(c => c.source === 'vitality_slacking');
        expect(penalty).toBeDefined();
        expect(penalty?.value).toBe(-1.5); // -1.5 * (3 - 2) = -1.5
      });

      it('should NOT penalize rest streak on first work day after resting', async () => {
        const player = createTestPlayer({
          workedToday: true,   // Working today
          workStreak: 1,       // First work day
          restStreak: 0        // Reset (rested 3 days before)
        });

        const result = await calculateVitalityChange(player, '23:00');

        const penalty = result.components.find(c => c.source === 'vitality_slacking');
        expect(penalty).toBeUndefined();
      });
    });

    describe('Ambition - Work Streak Bonuses', () => {
      beforeEach(() => {
        // Mock database connection for getActivitiesForDay
        const mockClient = {
          query: jest.fn().mockResolvedValue({ rows: [] }),
          release: jest.fn()
        };
        mockPool.connect = jest.fn().mockResolvedValue(mockClient);
      });

      it('should give work streak bonus when workStreak >= 2', async () => {
        const player = createTestPlayer({
          workedToday: true,
          workStreak: 2  // Including today
        });

        const result = await calculateAmbitionChange(mockPool, player);

        const bonus = result.components.find(c => c.source === 'ambition_work_streak');
        expect(bonus).toBeDefined();
        expect(bonus?.value).toBe(1.5);
      });

      it('should NOT give work streak bonus on first work day', async () => {
        const player = createTestPlayer({
          workedToday: true,
          workStreak: 1  // First day
        });

        const result = await calculateAmbitionChange(mockPool, player);

        const bonus = result.components.find(c => c.source === 'ambition_work_streak');
        expect(bonus).toBeUndefined();
      });

      it('should NOT give work streak bonus on first rest day after working', async () => {
        const player = createTestPlayer({
          workedToday: false,  // Resting
          workStreak: 0,       // Reset
          restStreak: 1
        });

        const result = await calculateAmbitionChange(mockPool, player);

        const bonus = result.components.find(c => c.source === 'ambition_work_streak');
        expect(bonus).toBeUndefined();
      });

      it('should penalize rest streak when restStreak >= 2', async () => {
        const player = createTestPlayer({
          workedToday: false,
          restStreak: 2
        });

        const result = await calculateAmbitionChange(mockPool, player);

        const penalty = result.components.find(c => c.source === 'ambition_rest_streak');
        expect(penalty).toBeDefined();
        expect(penalty?.value).toBe(-3.0); // -1.5 * 2
      });

      it('should NOT penalize rest streak on first work day after resting', async () => {
        const player = createTestPlayer({
          workedToday: true,   // Working again
          workStreak: 1,
          restStreak: 0        // Reset
        });

        const result = await calculateAmbitionChange(mockPool, player);

        const penalty = result.components.find(c => c.source === 'ambition_rest_streak');
        expect(penalty).toBeUndefined();
      });
    });

    describe('Ambition - Challenging Activity Threshold & Cap', () => {
      beforeEach(() => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({ rows: [] }),
          release: jest.fn()
        };
        mockPool.connect = jest.fn().mockResolvedValue(mockClient);
      });

      it('should NOT give bonus for activities just above stat (< 20 above)', async () => {
        // Mock activities with difficulty just above stat (not enough to trigger)
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [{
              player_id: 'test-player-id',
              activity_id: 'test-activity',
              performed_at: new Date(),
              day_number: 1,
              time_of_day: '12:00',
              activity_name: 'Code',
              category: 'work',
              difficulty: 30,  // Stat is 15 (balanced start), +15 is not enough
              relevant_stats: ['knowledge'],
              created_at: new Date()
            }]
          }),
          release: jest.fn()
        };
        mockPool.connect = jest.fn().mockResolvedValue(mockClient);

        const player = createTestPlayer({ workedToday: true });
        const result = await calculateAmbitionChange(mockPool, player);

        const bonus = result.components.find(c => c.source === 'ambition_pushed_limits');
        expect(bonus).toBeUndefined();
      });

      it('should give bonus for activities 20+ above stat', async () => {
        // Mock activities with difficulty 20+ above stat
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [{
              player_id: 'test-player-id',
              activity_id: 'test-activity',
              performed_at: new Date(),
              day_number: 1,
              time_of_day: '12:00',
              activity_name: 'Code',
              category: 'work',
              difficulty: 35,  // Stat is 15, +20 triggers
              relevant_stats: ['knowledge'],
              created_at: new Date()
            }]
          }),
          release: jest.fn()
        };
        mockPool.connect = jest.fn().mockResolvedValue(mockClient);

        const player = createTestPlayer({ workedToday: true });
        const result = await calculateAmbitionChange(mockPool, player);

        const bonus = result.components.find(c => c.source === 'ambition_pushed_limits');
        expect(bonus).toBeDefined();
        expect(bonus?.value).toBe(2.0);
      });

      it('should cap challenging activities bonus to max 3 activities', async () => {
        // Mock 5 challenging activities (should cap to 3)
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: Array(5).fill(null).map((_, i) => ({
              player_id: 'test-player-id',
              activity_id: `test-activity-${i}`,
              performed_at: new Date(),
              day_number: 1,
              time_of_day: '12:00',
              activity_name: 'Code',
              category: 'work',
              difficulty: 35,  // 20+ above stat
              relevant_stats: ['knowledge'],
              created_at: new Date()
            }))
          }),
          release: jest.fn()
        };
        mockPool.connect = jest.fn().mockResolvedValue(mockClient);

        const player = createTestPlayer({ workedToday: true });
        const result = await calculateAmbitionChange(mockPool, player);

        const bonus = result.components.find(c => c.source === 'ambition_pushed_limits');
        expect(bonus).toBeDefined();
        expect(bonus?.value).toBe(6.0); // 2.0 * 3 (capped)
        expect(bonus?.details).toContain('capped from 5');
      });

      it('should cap hard activities bonus to max 3 activities', async () => {
        // Mock 4 hard activities (difficulty >= 50)
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: Array(4).fill(null).map((_, i) => ({
              player_id: 'test-player-id',
              activity_id: `test-activity-${i}`,
              performed_at: new Date(),
              day_number: 1,
              time_of_day: '12:00',
              activity_name: 'Advanced Code',
              category: 'work',
              difficulty: 50,
              relevant_stats: ['knowledge'],
              created_at: new Date()
            }))
          }),
          release: jest.fn()
        };
        mockPool.connect = jest.fn().mockResolvedValue(mockClient);

        const player = createTestPlayer({ workedToday: true });
        const result = await calculateAmbitionChange(mockPool, player);

        const bonus = result.components.find(c => c.source === 'ambition_hard_activities');
        expect(bonus).toBeDefined();
        expect(bonus?.value).toBe(3.0); // 1.0 * 3 (capped)
        expect(bonus?.details).toContain('capped from 4');
      });
    });
  });

  describe('Vitality - Sleep Schedule Bonus', () => {
    it('should give bonus for sleeping at 8pm-11:59pm', async () => {
      const player = createTestPlayer();
      const result = await calculateVitalityChange(player, '22:00');

      const bonus = result.components.find(c => c.source === 'vitality_sleep_schedule');
      expect(bonus).toBeDefined();
      expect(bonus?.value).toBe(1.5);
    });

    it('should give bonus for sleeping at exactly 8pm (20:00)', async () => {
      const player = createTestPlayer();
      const result = await calculateVitalityChange(player, '20:00');

      const bonus = result.components.find(c => c.source === 'vitality_sleep_schedule');
      expect(bonus).toBeDefined();
      expect(bonus?.value).toBe(1.5);
    });

    it('should give bonus for sleeping just before midnight (23:59)', async () => {
      const player = createTestPlayer();
      const result = await calculateVitalityChange(player, '23:30');

      const bonus = result.components.find(c => c.source === 'vitality_sleep_schedule');
      expect(bonus).toBeDefined();
      expect(bonus?.value).toBe(1.5);
    });

    it('should NOT give bonus for sleeping before 8pm', async () => {
      const player = createTestPlayer();
      const result = await calculateVitalityChange(player, '19:30');

      const bonus = result.components.find(c => c.source === 'vitality_sleep_schedule');
      expect(bonus).toBeUndefined();
    });

    it('should NOT give bonus for sleeping at 7pm', async () => {
      const player = createTestPlayer();
      const result = await calculateVitalityChange(player, '19:00');

      const bonus = result.components.find(c => c.source === 'vitality_sleep_schedule');
      expect(bonus).toBeUndefined();
    });

    it('should NOT give bonus for sleeping after midnight', async () => {
      const player = createTestPlayer();
      const result = await calculateVitalityChange(player, '01:00');

      const bonus = result.components.find(c => c.source === 'vitality_sleep_schedule');
      expect(bonus).toBeUndefined();
    });
  });

  describe('Bug #3: Catastrophic Failure Detection', () => {
    it('should give bonus when hadCatastrophicFailureToday is false', async () => {
      const player = createTestPlayer({
        hadCatastrophicFailureToday: false
      });

      const result = await calculateVitalityChange(player, '23:00');

      const bonus = result.components.find(c => c.source === 'vitality_no_catastrophe');
      expect(bonus).toBeDefined();
      expect(bonus?.value).toBe(1.0);
    });

    it('should NOT give bonus when hadCatastrophicFailureToday is true', async () => {
      const player = createTestPlayer({
        hadCatastrophicFailureToday: true
      });

      const result = await calculateVitalityChange(player, '23:00');

      const bonus = result.components.find(c => c.source === 'vitality_no_catastrophe');
      expect(bonus).toBeUndefined();
    });
  });

  describe('Bug #4: Negative Social Interaction Filtering', () => {
    beforeEach(() => {
      // Mock empty database queries for empathy calculations
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })  // relationships query
          .mockResolvedValueOnce({ rows: [] })  // recent interactions query
          .mockResolvedValueOnce({ rows: [] })  // friends query
          .mockResolvedValueOnce({ rows: [] })  // week interactions query
          .mockResolvedValueOnce({ rows: [] }), // neglected friends query
        release: jest.fn()
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);
    });

    it('should penalize negative social interactions from social activities', async () => {
      // Mock activities with negative social interaction
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({
            rows: [{
              player_id: 'test-player-id',
              activity_id: 'test-activity',
              performed_at: new Date(),
              day_number: 1,
              time_of_day: '12:00',
              activity_name: 'Chat',
              category: 'social',
              stat_effects: { empathy: -2 },  // Negative empathy
              created_at: new Date()
            }]
          })
          .mockResolvedValue({ rows: [] }),  // Other queries
        release: jest.fn()
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const player = createTestPlayer();
      const result = await calculateEmpathyChange(mockPool, player);

      const penalty = result.components.find(c => c.source === 'empathy_negative_interaction');
      expect(penalty).toBeDefined();
      expect(penalty?.value).toBe(-2.5);
    });

    it('should NOT penalize negative stats from non-social activities', async () => {
      // Mock activities with negative stats from work activity
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({
            rows: [{
              player_id: 'test-player-id',
              activity_id: 'test-activity',
              performed_at: new Date(),
              day_number: 1,
              time_of_day: '12:00',
              activity_name: 'Code',
              category: 'work',  // Not social
              stat_effects: { fitness: -2, knowledge: -1 },  // Negative non-social stats
              created_at: new Date()
            }]
          })
          .mockResolvedValue({ rows: [] }),
        release: jest.fn()
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const player = createTestPlayer();
      const result = await calculateEmpathyChange(mockPool, player);

      const penalty = result.components.find(c => c.source === 'empathy_negative_interaction');
      expect(penalty).toBeUndefined();
    });

    it('should NOT penalize social activities with only positive stats', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({
            rows: [{
              player_id: 'test-player-id',
              activity_id: 'test-activity',
              performed_at: new Date(),
              day_number: 1,
              time_of_day: '12:00',
              activity_name: 'Chat',
              category: 'social',
              stat_effects: { empathy: 2, confidence: 1 },  // All positive
              created_at: new Date()
            }]
          })
          .mockResolvedValue({ rows: [] }),
        release: jest.fn()
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const player = createTestPlayer();
      const result = await calculateEmpathyChange(mockPool, player);

      const penalty = result.components.find(c => c.source === 'empathy_negative_interaction');
      expect(penalty).toBeUndefined();
    });

    it('should penalize social activities with negative confidence', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({
            rows: [{
              player_id: 'test-player-id',
              activity_id: 'test-activity',
              performed_at: new Date(),
              day_number: 1,
              time_of_day: '12:00',
              activity_name: 'Chat',
              category: 'social',
              stat_effects: { confidence: -2 },  // Negative confidence
              created_at: new Date()
            }]
          })
          .mockResolvedValue({ rows: [] }),
        release: jest.fn()
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const player = createTestPlayer();
      const result = await calculateEmpathyChange(mockPool, player);

      const penalty = result.components.find(c => c.source === 'empathy_negative_interaction');
      expect(penalty).toBeDefined();
      expect(penalty?.value).toBe(-2.5);
    });
  });
});
