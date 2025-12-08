/**
 * Time Service Unit Tests
 * Tests for Phase 2 time management functions
 */

import {
  getTimeSlot,
  addMinutes,
  checkActivityEndTime,
  calculateSleepResults,
  canPerformActivity
} from './index';
import { Activity, PlayerCharacter } from '../../../../shared/types';

describe('Time Service', () => {
  // ===== getTimeSlot Tests =====
  describe('getTimeSlot', () => {
    it('should return morning for 6:00', () => {
      expect(getTimeSlot('06:00')).toBe('morning');
    });

    it('should return morning for 11:59', () => {
      expect(getTimeSlot('11:59')).toBe('morning');
    });

    it('should return afternoon for 12:00', () => {
      expect(getTimeSlot('12:00')).toBe('afternoon');
    });

    it('should return afternoon for 17:59', () => {
      expect(getTimeSlot('17:59')).toBe('afternoon');
    });

    it('should return evening for 18:00', () => {
      expect(getTimeSlot('18:00')).toBe('evening');
    });

    it('should return evening for 23:59', () => {
      expect(getTimeSlot('23:59')).toBe('evening');
    });

    it('should return night for 00:00', () => {
      expect(getTimeSlot('00:00')).toBe('night');
    });

    it('should return night for 05:59', () => {
      expect(getTimeSlot('05:59')).toBe('night');
    });
  });

  // ===== addMinutes Tests =====
  describe('addMinutes', () => {
    it('should add minutes within the same hour', () => {
      expect(addMinutes('10:00', 30)).toBe('10:30');
    });

    it('should handle hour rollover', () => {
      expect(addMinutes('10:45', 30)).toBe('11:15');
    });

    it('should handle day rollover (midnight wrap)', () => {
      expect(addMinutes('23:30', 45)).toBe('00:15');
    });

    it('should handle multiple hour rollovers', () => {
      expect(addMinutes('10:00', 150)).toBe('12:30');
    });

    it('should handle exactly 24 hours (full day)', () => {
      expect(addMinutes('10:00', 1440)).toBe('10:00');
    });

    it('should pad single digit hours and minutes with zero', () => {
      expect(addMinutes('09:05', 5)).toBe('09:10');
      expect(addMinutes('08:55', 10)).toBe('09:05');
    });
  });

  // ===== checkActivityEndTime Tests =====
  describe('checkActivityEndTime', () => {
    it('should not flag activity ending during day', () => {
      const result = checkActivityEndTime('10:00', 120);
      expect(result.after4am).toBe(false);
      expect(result.afterMidnight).toBe(false);
    });

    it('should not flag activity ending before midnight', () => {
      const result = checkActivityEndTime('22:00', 90);
      expect(result.after4am).toBe(false);
      expect(result.afterMidnight).toBe(false);
    });

    it('should flag activity ending after midnight but before 4 AM', () => {
      const result = checkActivityEndTime('23:30', 60);
      expect(result.after4am).toBe(false);
      expect(result.afterMidnight).toBe(true);
    });

    it('should flag activity ending after 4 AM', () => {
      const result = checkActivityEndTime('03:00', 120);
      expect(result.after4am).toBe(true);
      expect(result.afterMidnight).toBe(false);
    });

    it('should flag activity ending at exactly 4 AM', () => {
      const result = checkActivityEndTime('02:00', 120);
      expect(result.after4am).toBe(true);
      expect(result.afterMidnight).toBe(false);
    });

    it('should not flag activity ending at 23:59', () => {
      const result = checkActivityEndTime('22:00', 119);
      expect(result.after4am).toBe(false);
      expect(result.afterMidnight).toBe(false);
    });
  });

  // ===== calculateSleepResults Tests =====
  describe('calculateSleepResults', () => {
    it('should wake at 6 AM and restore 80 energy when sleeping before 10 PM', () => {
      const result = calculateSleepResults('21:00');
      expect(result.wakeTime).toBe('06:00');
      expect(result.hoursSlept).toBe(8);
      expect(result.energyRestored).toBe(80);
    });

    it('should wake at 6 AM and restore 80 energy when sleeping at 6 AM', () => {
      const result = calculateSleepResults('06:00');
      expect(result.wakeTime).toBe('06:00');
      expect(result.hoursSlept).toBe(8);
      expect(result.energyRestored).toBe(80);
    });

    it('should sleep 8 hours when going to bed at 10 PM', () => {
      const result = calculateSleepResults('22:00');
      expect(result.wakeTime).toBe('06:00');
      expect(result.hoursSlept).toBe(8);
      expect(result.energyRestored).toBe(80);
    });

    it('should sleep 8 hours when going to bed at 11 PM', () => {
      const result = calculateSleepResults('23:00');
      expect(result.wakeTime).toBe('07:00');
      expect(result.hoursSlept).toBe(8);
      expect(result.energyRestored).toBe(80);
    });

    it('should sleep 8 hours when going to bed at midnight', () => {
      const result = calculateSleepResults('00:00');
      expect(result.wakeTime).toBe('08:00');
      expect(result.hoursSlept).toBe(8);
      expect(result.energyRestored).toBe(80);
    });

    it('should sleep 7 hours when going to bed at 1 AM', () => {
      const result = calculateSleepResults('01:00');
      expect(result.wakeTime).toBe('08:00');
      expect(result.hoursSlept).toBe(7);
      expect(result.energyRestored).toBe(70);
    });

    it('should sleep 6 hours when going to bed at 2 AM', () => {
      const result = calculateSleepResults('02:00');
      expect(result.wakeTime).toBe('08:00');
      expect(result.hoursSlept).toBe(6);
      expect(result.energyRestored).toBe(60);
    });

    it('should sleep 5 hours when going to bed at 3 AM', () => {
      const result = calculateSleepResults('03:00');
      expect(result.wakeTime).toBe('08:00');
      expect(result.hoursSlept).toBe(5);
      expect(result.energyRestored).toBe(50);
    });

    it('should sleep 4 hours when going to bed at 4 AM', () => {
      const result = calculateSleepResults('04:00');
      expect(result.wakeTime).toBe('08:00');
      expect(result.hoursSlept).toBe(4);
      expect(result.energyRestored).toBe(40);
    });

    it('should handle bedtime with minutes (22:30)', () => {
      const result = calculateSleepResults('22:30');
      expect(result.wakeTime).toBe('06:30');
      expect(result.hoursSlept).toBe(8);
      expect(result.energyRestored).toBe(80);
    });
  });

  // ===== canPerformActivity Tests =====
  describe('canPerformActivity', () => {
    const mockPlayer: PlayerCharacter = {
      id: 'player1',
      userId: 'user1',
      currentEnergy: 50,
      maxEnergy: 100,
      money: 100,
      currentDay: 1,
      currentTime: '14:00',
      lastSleptAt: '06:00',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    const mockActivity: Activity = {
      id: 'test_activity',
      name: 'Test Activity',
      description: 'A test activity',
      category: 'leisure',
      timeCost: 60,
      energyCost: -20,
      moneyCost: -10,
      effects: {}
    };

    it('should allow activity when all conditions are met', () => {
      const result = canPerformActivity(mockActivity, mockPlayer);
      expect(result.available).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should block activity when insufficient energy', () => {
      const activity = { ...mockActivity, energyCost: -60 };
      const result = canPerformActivity(activity, mockPlayer);
      expect(result.available).toBe(false);
      expect(result.reason).toBe('Not enough energy');
    });

    it('should block activity when insufficient money', () => {
      const activity = { ...mockActivity, moneyCost: -150 };
      const result = canPerformActivity(activity, mockPlayer);
      expect(result.available).toBe(false);
      expect(result.reason).toBe('Not enough money');
    });

    it('should block activity when wrong time slot', () => {
      const activity = { ...mockActivity, allowedTimeSlots: ['morning' as const] };
      const player = { ...mockPlayer, currentTime: '14:00' }; // Afternoon
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(false);
      expect(result.reason).toBe('Not available at this time');
    });

    it('should allow activity when correct time slot', () => {
      const activity = { ...mockActivity, allowedTimeSlots: ['afternoon' as const] };
      const player = { ...mockPlayer, currentTime: '14:00' }; // Afternoon
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(true);
    });

    it('should block activity ending after 4 AM', () => {
      const activity = { ...mockActivity, timeCost: 120 };
      const player = { ...mockPlayer, currentTime: '03:00' };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(false);
      expect(result.reason).toBe('Would end too late (after 4 AM)');
    });

    it('should warn but allow activity ending after midnight', () => {
      const activity = { ...mockActivity, timeCost: 60 };
      const player = { ...mockPlayer, currentTime: '23:30' };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(true);
      expect(result.endsAfterMidnight).toBe(true);
    });

    it('should allow activity with positive energy cost (restoration)', () => {
      const activity = { ...mockActivity, energyCost: 25 };
      const player = { ...mockPlayer, currentEnergy: 10 };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(true);
    });

    it('should allow activity with positive money cost (earning)', () => {
      const activity = { ...mockActivity, moneyCost: 80 };
      const player = { ...mockPlayer, money: 10 };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(true);
    });

    it('should allow activity with zero energy even with high cost', () => {
      const activity = { ...mockActivity, energyCost: -50 };
      const player = { ...mockPlayer, currentEnergy: 50 };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(true);
    });

    it('should block activity when exact energy match would go negative', () => {
      const activity = { ...mockActivity, energyCost: -51 };
      const player = { ...mockPlayer, currentEnergy: 50 };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(false);
      expect(result.reason).toBe('Not enough energy');
    });

    // ===== Phase 3: Location Tests =====
    it('should block activity when player is not at required location', () => {
      const activity = { ...mockActivity, location: 'gym' as const };
      const player = { ...mockPlayer, currentLocation: 'home' as const };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(false);
      expect(result.reason).toContain('Must be at');
    });

    it('should allow activity when player is at required location', () => {
      const activity = { ...mockActivity, location: 'gym' as const };
      const player = { ...mockPlayer, currentLocation: 'gym' as const };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(true);
    });

    it('should allow activity with no location requirement anywhere', () => {
      const activity = { ...mockActivity }; // No location field
      const player = { ...mockPlayer, currentLocation: 'beach' as const };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(true);
    });

    it('should block social activity when NPC is at different location', () => {
      const activity = { ...mockActivity, requiresNPC: true };
      const player = { ...mockPlayer, currentLocation: 'coffee_shop' as const };
      const npcLocation = 'beach';
      const result = canPerformActivity(activity, player, npcLocation);
      expect(result.available).toBe(false);
      expect(result.reason).toBe('Must be at same location as NPC');
    });

    it('should allow social activity when NPC is at same location', () => {
      const activity = { ...mockActivity, requiresNPC: true };
      const player = { ...mockPlayer, currentLocation: 'coffee_shop' as const };
      const npcLocation = 'coffee_shop';
      const result = canPerformActivity(activity, player, npcLocation);
      expect(result.available).toBe(true);
    });

    it('should block "Meet Someone New" at home', () => {
      const activity = { ...mockActivity, id: 'meet_someone' };
      const player = { ...mockPlayer, currentLocation: 'home' as const };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(false);
      expect(result.reason).toBe('Cannot meet new people at home');
    });

    it('should allow "Meet Someone New" at other locations', () => {
      const activity = { ...mockActivity, id: 'meet_someone' };
      const player = { ...mockPlayer, currentLocation: 'park' as const };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(true);
    });

    it('should check location before other constraints', () => {
      const activity = { ...mockActivity, location: 'gym' as const, energyCost: -100 };
      const player = { ...mockPlayer, currentLocation: 'home' as const, currentEnergy: 50 };
      const result = canPerformActivity(activity, player);
      expect(result.available).toBe(false);
      expect(result.reason).toContain('Must be at'); // Location check fails first
    });
  });
});
