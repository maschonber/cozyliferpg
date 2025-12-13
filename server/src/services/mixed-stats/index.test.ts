/**
 * Tests for Mixed Stats Service (Creativity penalty for repeated activities)
 */

import { Pool } from 'pg';
import { calculateCreativityChange } from './index';
import { PlayerCharacter } from '../../../../shared/types';
import { getStartingStats } from '../stat';

// Mock pool for database operations
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
  on: jest.fn()
} as unknown as Pool;

// Helper to create a test player
function createTestPlayer(): PlayerCharacter {
  return {
    id: 'test-player-id',
    userId: 'test-user-id',
    currentDay: 5,
    currentTime: '12:00',
    currentEnergy: 50,
    currentLocation: 'home',
    money: 100,
    lastSleptAt: '23:00',
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
      statsTrainedToday: []
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

describe('Mixed Stats - Creativity', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock client
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    };
    mockPool.connect = jest.fn().mockResolvedValue(mockClient);
  });

  describe('Repeated Activities Penalty', () => {
    it('should NOT penalize when each activity is done once', async () => {
      // Mock today's activities - all different
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              player_id: 'test-player-id',
              activity_id: 'activity-1',
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '09:00',
              activity_name: 'Exercise',
              category: 'leisure',
              created_at: new Date()
            },
            {
              player_id: 'test-player-id',
              activity_id: 'activity-2',
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '12:00',
              activity_name: 'Read',
              category: 'leisure',
              created_at: new Date()
            }
          ]
        }),
        release: jest.fn()
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const player = createTestPlayer();
      const result = await calculateCreativityChange(mockPool, player);

      const penalty = result.components.find(c => c.source === 'creativity_repetitive_day');
      expect(penalty).toBeUndefined();
    });

    it('should penalize -1.0 for one activity repeated twice', async () => {
      // Mock today's activities - one activity done twice
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              player_id: 'test-player-id',
              activity_id: 'activity-1',
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '09:00',
              activity_name: 'Exercise',
              category: 'leisure',
              created_at: new Date()
            },
            {
              player_id: 'test-player-id',
              activity_id: 'activity-1',  // Same activity
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '15:00',
              activity_name: 'Exercise',
              category: 'leisure',
              created_at: new Date()
            }
          ]
        }),
        release: jest.fn()
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const player = createTestPlayer();
      const result = await calculateCreativityChange(mockPool, player);

      const penalty = result.components.find(c => c.source === 'creativity_repetitive_day');
      expect(penalty).toBeDefined();
      expect(penalty?.value).toBe(-1.0);
      expect(penalty?.details).toContain('1 activity repeated');
      expect(penalty?.details).toContain('2 total repetitions');
    });

    it('should penalize -1.0 for one activity repeated three times', async () => {
      // Mock today's activities - one activity done 3 times
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              player_id: 'test-player-id',
              activity_id: 'activity-1',
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '09:00',
              activity_name: 'Exercise',
              category: 'leisure',
              created_at: new Date()
            },
            {
              player_id: 'test-player-id',
              activity_id: 'activity-1',  // Same activity
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '12:00',
              activity_name: 'Exercise',
              category: 'leisure',
              created_at: new Date()
            },
            {
              player_id: 'test-player-id',
              activity_id: 'activity-1',  // Same activity again
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '15:00',
              activity_name: 'Exercise',
              category: 'leisure',
              created_at: new Date()
            }
          ]
        }),
        release: jest.fn()
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const player = createTestPlayer();
      const result = await calculateCreativityChange(mockPool, player);

      const penalty = result.components.find(c => c.source === 'creativity_repetitive_day');
      expect(penalty).toBeDefined();
      expect(penalty?.value).toBe(-1.0);
      expect(penalty?.details).toContain('1 activity repeated');
      expect(penalty?.details).toContain('3 total repetitions');
    });

    it('should penalize -2.0 for two different activities repeated', async () => {
      // Mock today's activities - two activities each done twice
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              player_id: 'test-player-id',
              activity_id: 'activity-1',
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '09:00',
              activity_name: 'Exercise',
              category: 'leisure',
              created_at: new Date()
            },
            {
              player_id: 'test-player-id',
              activity_id: 'activity-1',  // Repeat
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '11:00',
              activity_name: 'Exercise',
              category: 'leisure',
              created_at: new Date()
            },
            {
              player_id: 'test-player-id',
              activity_id: 'activity-2',
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '13:00',
              activity_name: 'Read',
              category: 'leisure',
              created_at: new Date()
            },
            {
              player_id: 'test-player-id',
              activity_id: 'activity-2',  // Repeat
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '15:00',
              activity_name: 'Read',
              category: 'leisure',
              created_at: new Date()
            }
          ]
        }),
        release: jest.fn()
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const player = createTestPlayer();
      const result = await calculateCreativityChange(mockPool, player);

      const penalty = result.components.find(c => c.source === 'creativity_repetitive_day');
      expect(penalty).toBeDefined();
      expect(penalty?.value).toBe(-2.0);
      expect(penalty?.details).toContain('2 activities repeated');
      expect(penalty?.details).toContain('4 total repetitions');
    });

    it('should count all activity types including work and social', async () => {
      // Mock today's activities - work activity repeated
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              player_id: 'test-player-id',
              activity_id: 'work-1',
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '09:00',
              activity_name: 'Code',
              category: 'work',
              created_at: new Date()
            },
            {
              player_id: 'test-player-id',
              activity_id: 'work-1',  // Same work activity
              performed_at: new Date(),
              day_number: 5,
              time_of_day: '14:00',
              activity_name: 'Code',
              category: 'work',
              created_at: new Date()
            }
          ]
        }),
        release: jest.fn()
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const player = createTestPlayer();
      const result = await calculateCreativityChange(mockPool, player);

      const penalty = result.components.find(c => c.source === 'creativity_repetitive_day');
      expect(penalty).toBeDefined();
      expect(penalty?.value).toBe(-1.0);
    });
  });
});
