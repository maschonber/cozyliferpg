/**
 * Game Time Service Tests
 *
 * Epoch is Day 1, 00:00 (midnight) = 0 minutes
 * Player typically starts at 360 minutes (06:00)
 */

import {
  formatGameTime,
  parseGameTime,
  addGameMinutes,
  calculateDelta,
  minutesToHours,
  formatForDisplay,
  getHour,
  getMinute,
  getDay,
  getTimeString,
  isSameDay,
  daysBetween,
  getTimeSlot,
  PLAYER_START_TIME
} from './game-time.service';

describe('Game Time Service', () => {
  // ===== Constants Tests =====
  describe('Constants', () => {
    it('should have PLAYER_START_TIME at 360 (06:00)', () => {
      expect(PLAYER_START_TIME).toBe(360);
      expect(formatGameTime(PLAYER_START_TIME)).toEqual({ day: 1, time: '06:00' });
    });
  });

  // ===== formatGameTime Tests =====
  describe('formatGameTime', () => {
    it('should format epoch (0 minutes) as Day 1, 00:00', () => {
      const result = formatGameTime(0);
      expect(result).toEqual({ day: 1, time: '00:00' });
    });

    it('should format 360 minutes as Day 1, 06:00 (player start)', () => {
      const result = formatGameTime(360);
      expect(result).toEqual({ day: 1, time: '06:00' });
    });

    it('should format 450 minutes as Day 1, 07:30', () => {
      const result = formatGameTime(450);
      expect(result).toEqual({ day: 1, time: '07:30' });
    });

    it('should format 1440 minutes as Day 2, 00:00', () => {
      const result = formatGameTime(1440);
      expect(result).toEqual({ day: 2, time: '00:00' });
    });

    it('should format 1800 minutes as Day 2, 06:00', () => {
      const result = formatGameTime(1800);
      expect(result).toEqual({ day: 2, time: '06:00' });
    });

    it('should format end of first day (Day 1, 23:59)', () => {
      const result = formatGameTime(1439);
      expect(result).toEqual({ day: 1, time: '23:59' });
    });

    it('should format Day 5, 14:30', () => {
      // Day 5, 14:30 = (4 days * 1440) + (14 * 60 + 30) = 5760 + 870 = 6630
      const result = formatGameTime(6630);
      expect(result).toEqual({ day: 5, time: '14:30' });
    });

    it('should pad single-digit hours and minutes', () => {
      // Day 1, 08:05 = 8 * 60 + 5 = 485
      const result = formatGameTime(485);
      expect(result.time).toBe('08:05');
    });
  });

  // ===== parseGameTime Tests =====
  describe('parseGameTime', () => {
    it('should parse Day 1, 00:00 as 0 minutes', () => {
      const result = parseGameTime(1, '00:00');
      expect(result).toBe(0);
    });

    it('should parse Day 1, 06:00 as 360 minutes', () => {
      const result = parseGameTime(1, '06:00');
      expect(result).toBe(360);
    });

    it('should parse Day 1, 07:30 as 450 minutes', () => {
      const result = parseGameTime(1, '07:30');
      expect(result).toBe(450);
    });

    it('should parse Day 2, 00:00 as 1440 minutes', () => {
      const result = parseGameTime(2, '00:00');
      expect(result).toBe(1440);
    });

    it('should parse Day 2, 06:00 as 1800 minutes', () => {
      const result = parseGameTime(2, '06:00');
      expect(result).toBe(1800);
    });

    it('should parse Day 1, 23:59 as 1439 minutes', () => {
      const result = parseGameTime(1, '23:59');
      expect(result).toBe(1439);
    });

    it('should parse Day 5, 14:30 as 6630 minutes', () => {
      const result = parseGameTime(5, '14:30');
      expect(result).toBe(6630);
    });

    it('should be inverse of formatGameTime', () => {
      const testCases = [0, 360, 450, 1440, 1800, 6630, 1439];
      testCases.forEach(minutes => {
        const formatted = formatGameTime(minutes);
        const parsed = parseGameTime(formatted.day, formatted.time);
        expect(parsed).toBe(minutes);
      });
    });
  });

  // ===== addGameMinutes Tests =====
  describe('addGameMinutes', () => {
    it('should add 90 minutes to player start', () => {
      const result = addGameMinutes(360, 90);
      expect(result).toBe(450);
      expect(formatGameTime(result)).toEqual({ day: 1, time: '07:30' });
    });

    it('should add 120 minutes to Day 1, 23:00 and cross day boundary', () => {
      const day1_23_00 = parseGameTime(1, '23:00');
      const result = addGameMinutes(day1_23_00, 120);
      expect(formatGameTime(result)).toEqual({ day: 2, time: '01:00' });
    });

    it('should handle adding 0 minutes', () => {
      const result = addGameMinutes(100, 0);
      expect(result).toBe(100);
    });

    it('should handle negative minutes (going back in time)', () => {
      const result = addGameMinutes(100, -50);
      expect(result).toBe(50);
    });
  });

  // ===== calculateDelta Tests =====
  describe('calculateDelta', () => {
    it('should calculate positive delta', () => {
      const result = calculateDelta(0, 90);
      expect(result).toBe(90);
    });

    it('should calculate negative delta', () => {
      const result = calculateDelta(100, 50);
      expect(result).toBe(-50);
    });

    it('should return 0 for same time', () => {
      const result = calculateDelta(100, 100);
      expect(result).toBe(0);
    });

    it('should calculate delta across day boundary', () => {
      const day1_start = parseGameTime(1, '00:00');
      const day2_start = parseGameTime(2, '00:00');
      const result = calculateDelta(day1_start, day2_start);
      expect(result).toBe(1440);
    });
  });

  // ===== minutesToHours Tests =====
  describe('minutesToHours', () => {
    it('should convert 60 minutes to 1 hour', () => {
      expect(minutesToHours(60)).toBe(1);
    });

    it('should convert 90 minutes to 1.5 hours', () => {
      expect(minutesToHours(90)).toBe(1.5);
    });

    it('should convert 45 minutes to 0.75 hours', () => {
      expect(minutesToHours(45)).toBe(0.75);
    });

    it('should convert 0 minutes to 0 hours', () => {
      expect(minutesToHours(0)).toBe(0);
    });

    it('should handle fractional hours', () => {
      expect(minutesToHours(100)).toBeCloseTo(1.667, 3);
    });
  });

  // ===== formatForDisplay Tests =====
  describe('formatForDisplay', () => {
    it('should format epoch as "Day 1, 00:00"', () => {
      expect(formatForDisplay(0)).toBe('Day 1, 00:00');
    });

    it('should format player start as "Day 1, 06:00"', () => {
      expect(formatForDisplay(360)).toBe('Day 1, 06:00');
    });

    it('should format Day 5, 14:30', () => {
      expect(formatForDisplay(6630)).toBe('Day 5, 14:30');
    });

    it('should format Day 2, 00:00', () => {
      expect(formatForDisplay(1440)).toBe('Day 2, 00:00');
    });
  });

  // ===== getHour Tests =====
  describe('getHour', () => {
    it('should return 0 for epoch (00:00)', () => {
      expect(getHour(0)).toBe(0);
    });

    it('should return 6 for player start (06:00)', () => {
      expect(getHour(360)).toBe(6);
    });

    it('should return 7 for 07:30', () => {
      expect(getHour(450)).toBe(7);
    });

    it('should return 14 for Day 5, 14:30', () => {
      expect(getHour(6630)).toBe(14);
    });

    it('should return 23 for 23:00', () => {
      const time23 = parseGameTime(1, '23:00');
      expect(getHour(time23)).toBe(23);
    });

    it('should return 0 for Day 2, 00:00', () => {
      expect(getHour(1440)).toBe(0);
    });
  });

  // ===== getMinute Tests =====
  describe('getMinute', () => {
    it('should return 0 for 00:00', () => {
      expect(getMinute(0)).toBe(0);
    });

    it('should return 0 for 06:00', () => {
      expect(getMinute(360)).toBe(0);
    });

    it('should return 30 for 07:30', () => {
      expect(getMinute(450)).toBe(30);
    });

    it('should return 45 for X:45', () => {
      const time = parseGameTime(1, '08:45');
      expect(getMinute(time)).toBe(45);
    });
  });

  // ===== getDay Tests =====
  describe('getDay', () => {
    it('should return 1 for epoch', () => {
      expect(getDay(0)).toBe(1);
    });

    it('should return 1 for player start', () => {
      expect(getDay(360)).toBe(1);
    });

    it('should return 1 for any time on day 1', () => {
      expect(getDay(100)).toBe(1);
      expect(getDay(1000)).toBe(1);
      expect(getDay(1439)).toBe(1); // 23:59
    });

    it('should return 2 for day 2 start', () => {
      expect(getDay(1440)).toBe(2);
    });

    it('should return 5 for day 5', () => {
      expect(getDay(6630)).toBe(5);
    });
  });

  // ===== getTimeString Tests =====
  describe('getTimeString', () => {
    it('should return "00:00" for epoch', () => {
      expect(getTimeString(0)).toBe('00:00');
    });

    it('should return "06:00" for player start', () => {
      expect(getTimeString(360)).toBe('06:00');
    });

    it('should return "07:30" for 450 minutes', () => {
      expect(getTimeString(450)).toBe('07:30');
    });

    it('should return "14:30" for Day 5, 14:30', () => {
      expect(getTimeString(6630)).toBe('14:30');
    });
  });

  // ===== isSameDay Tests =====
  describe('isSameDay', () => {
    it('should return true for times on same day', () => {
      const morning = parseGameTime(1, '06:00');
      const evening = parseGameTime(1, '23:00');
      expect(isSameDay(morning, evening)).toBe(true);
    });

    it('should return false for times on different days', () => {
      const day1 = parseGameTime(1, '12:00');
      const day2 = parseGameTime(2, '12:00');
      expect(isSameDay(day1, day2)).toBe(false);
    });

    it('should return true for same time', () => {
      expect(isSameDay(100, 100)).toBe(true);
    });
  });

  // ===== getTimeSlot Tests =====
  describe('getTimeSlot', () => {
    it('should return night for 00:00-05:59', () => {
      expect(getTimeSlot(0)).toBe('night'); // 00:00
      expect(getTimeSlot(180)).toBe('night'); // 03:00
      expect(getTimeSlot(359)).toBe('night'); // 05:59
    });

    it('should return morning for 06:00-11:59', () => {
      expect(getTimeSlot(360)).toBe('morning'); // 06:00
      expect(getTimeSlot(540)).toBe('morning'); // 09:00
      expect(getTimeSlot(719)).toBe('morning'); // 11:59
    });

    it('should return afternoon for 12:00-17:59', () => {
      expect(getTimeSlot(720)).toBe('afternoon'); // 12:00
      expect(getTimeSlot(900)).toBe('afternoon'); // 15:00
      expect(getTimeSlot(1079)).toBe('afternoon'); // 17:59
    });

    it('should return evening for 18:00-23:59', () => {
      expect(getTimeSlot(1080)).toBe('evening'); // 18:00
      expect(getTimeSlot(1260)).toBe('evening'); // 21:00
      expect(getTimeSlot(1439)).toBe('evening'); // 23:59
    });

    it('should work correctly across days', () => {
      // Day 2, 06:00 = 1800
      expect(getTimeSlot(1800)).toBe('morning');
      // Day 2, 14:00 = 2280
      expect(getTimeSlot(2280)).toBe('afternoon');
      // Day 3, 20:00 = 4080
      expect(getTimeSlot(4080)).toBe('evening');
    });
  });

  // ===== daysBetween Tests =====
  describe('daysBetween', () => {
    it('should return 0 for same day', () => {
      const morning = parseGameTime(1, '06:00');
      const evening = parseGameTime(1, '23:00');
      expect(daysBetween(morning, evening)).toBe(0);
    });

    it('should return 1 for consecutive days', () => {
      const day1 = parseGameTime(1, '12:00');
      const day2 = parseGameTime(2, '12:00');
      expect(daysBetween(day1, day2)).toBe(1);
    });

    it('should return 4 for day 1 to day 5', () => {
      const day1 = parseGameTime(1, '06:00');
      const day5 = parseGameTime(5, '06:00');
      expect(daysBetween(day1, day5)).toBe(4);
    });

    it('should return negative for going backwards', () => {
      const day5 = parseGameTime(5, '06:00');
      const day1 = parseGameTime(1, '06:00');
      expect(daysBetween(day5, day1)).toBe(-4);
    });
  });

  // ===== Integration Tests =====
  describe('Integration Tests', () => {
    it('should correctly handle a full day cycle', () => {
      let time = parseGameTime(1, '06:00'); // Player start
      expect(formatGameTime(time)).toEqual({ day: 1, time: '06:00' });

      time = addGameMinutes(time, 180); // +3 hours
      expect(formatGameTime(time)).toEqual({ day: 1, time: '09:00' });

      time = addGameMinutes(time, 300); // +5 hours
      expect(formatGameTime(time)).toEqual({ day: 1, time: '14:00' });

      time = addGameMinutes(time, 600); // +10 hours
      expect(formatGameTime(time)).toEqual({ day: 2, time: '00:00' });
    });

    it('should handle sleep scenario', () => {
      // Go to bed at 23:00
      const bedtime = parseGameTime(1, '23:00');

      // Sleep 8 hours
      const wakeTime = addGameMinutes(bedtime, 8 * 60);

      expect(formatGameTime(wakeTime)).toEqual({ day: 2, time: '07:00' });
      expect(getDay(bedtime)).toBe(1);
      expect(getDay(wakeTime)).toBe(2);
      expect(daysBetween(bedtime, wakeTime)).toBe(1);
    });

    it('should handle activity execution scenario', () => {
      // Start at 14:30
      const startTime = parseGameTime(3, '14:30');

      // Activity takes 90 minutes
      const endTime = addGameMinutes(startTime, 90);

      expect(formatGameTime(endTime)).toEqual({ day: 3, time: '16:00' });

      const elapsed = calculateDelta(startTime, endTime);
      expect(elapsed).toBe(90);
      expect(minutesToHours(elapsed)).toBe(1.5);
    });

    it('should handle emotion decay calculation', () => {
      // Last interaction: Day 1, 10:00
      const lastInteraction = parseGameTime(1, '10:00');

      // Current time: Day 2, 14:00
      const currentTime = parseGameTime(2, '14:00');

      // Calculate elapsed time
      const elapsedMinutes = calculateDelta(lastInteraction, currentTime);
      const elapsedHours = minutesToHours(elapsedMinutes);

      // Should be 28 hours (14 hours remaining on day 1 + 14 hours on day 2)
      expect(elapsedMinutes).toBe(1680); // 28 * 60
      expect(elapsedHours).toBe(28);
    });

    it('should handle crossing midnight', () => {
      const time = parseGameTime(1, '23:30');
      const after = addGameMinutes(time, 60);

      expect(formatGameTime(after)).toEqual({ day: 2, time: '00:30' });
      expect(isSameDay(time, after)).toBe(false);
      expect(daysBetween(time, after)).toBe(1);
    });
  });

  // ===== Edge Cases =====
  describe('Edge Cases', () => {
    it('should handle very large day numbers', () => {
      const day100 = parseGameTime(100, '15:00');
      expect(getDay(day100)).toBe(100);

      const formatted = formatGameTime(day100);
      expect(formatted.day).toBe(100);
      expect(formatted.time).toBe('15:00');
    });

    it('should handle zero elapsed time', () => {
      const time = 100;
      const delta = calculateDelta(time, time);
      expect(delta).toBe(0);
      expect(minutesToHours(delta)).toBe(0);
    });

    it('should handle midnight boundary', () => {
      // Just before midnight
      const beforeMidnight = parseGameTime(1, '23:59');
      expect(beforeMidnight).toBe(1439);
      expect(getDay(beforeMidnight)).toBe(1);

      // Exactly at midnight (start of day 2)
      const atMidnight = parseGameTime(2, '00:00');
      expect(atMidnight).toBe(1440);
      expect(getDay(atMidnight)).toBe(2);
    });
  });
});
