/**
 * Game Time Domain Service
 *
 * Handles conversion and calculations for game time stored as total minutes.
 * All storage uses INTEGER minutes, conversions only happen at boundaries.
 *
 * ## Time Representation
 * Game time is stored as total minutes elapsed since Day 1, 00:00 (midnight):
 * - Day 1, 00:00 = 0 minutes (epoch)
 * - Day 1, 06:00 = 360 minutes (typical game start)
 * - Day 1, 07:30 = 450 minutes
 * - Day 2, 00:00 = 1440 minutes (24 * 60)
 * - Day 5, 14:30 = 6630 minutes
 *
 * ## Design Principles
 * - All calculations work with minutes (INTEGER)
 * - No "GameTime" intermediate type (just numbers)
 * - Conversions only at display/boundary layers
 * - Pure functions (no side effects)
 * - Epoch is midnight-based (player starting time is added on top for game start and sleep)
 */

import { TimeSlot, TimeOfDay } from '../../../../shared/types';

/**
 * Constants
 */
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * 60; // 1440

/** Default starting time for new players (Day 1, 06:00) */
export const PLAYER_START_TIME = 6 * MINUTES_PER_HOUR; // 360

// ===== Human-Readable Time Types =====

/**
 * Human-readable duration for game data definitions.
 * Used by designers to define times in a readable format,
 * converted to minutes internally for calculations.
 *
 * @example
 * // Opening hours
 * { hours: 6 }              // 06:00 (360 minutes into day)
 * { hours: 22, minutes: 30 } // 22:30 (1350 minutes into day)
 *
 * // Activity durations
 * { hours: 1, minutes: 30 } // 90 minutes
 * { hours: 2 }              // 120 minutes
 *
 * // Multi-day spans
 * { days: 1, hours: 6 }     // 1 day + 6 hours (1800 minutes)
 */
export interface GameDuration {
  days?: number;
  hours: number;
  minutes?: number;
}

// TimeOfDay is imported from shared/types

/**
 * Convert GameDuration to total minutes.
 * Use for absolute game times (including days).
 *
 * @example
 * toMinutes({ hours: 6 }) // 360
 * toMinutes({ hours: 1, minutes: 30 }) // 90
 * toMinutes({ days: 1, hours: 6 }) // 1800 (1440 + 360)
 */
export function toMinutes(duration: GameDuration): number {
  const days = duration.days ?? 0;
  const hours = duration.hours;
  const minutes = duration.minutes ?? 0;

  return days * MINUTES_PER_DAY + hours * MINUTES_PER_HOUR + minutes;
}

/**
 * Convert TimeOfDay to minutes within a day (0-1439).
 * Use for daily schedules like operating hours.
 *
 * @example
 * toMinutesOfDay({ hours: 6 }) // 360
 * toMinutesOfDay({ hours: 22, minutes: 30 }) // 1350
 */
export function toMinutesOfDay(time: TimeOfDay): number {
  const hours = time.hours;
  const minutes = time.minutes ?? 0;

  return hours * MINUTES_PER_HOUR + minutes;
}

/**
 * Get minutes within current day from absolute game time.
 * Useful for comparing against daily schedules.
 *
 * @example
 * getMinutesOfDay(360) // 360 (Day 1, 06:00)
 * getMinutesOfDay(1800) // 360 (Day 2, 06:00)
 */
export function getMinutesOfDay(totalMinutes: number): number {
  return totalMinutes % MINUTES_PER_DAY;
}

/**
 * Convert total minutes to day number and time string
 *
 * @param totalMinutes - Minutes since epoch (Day 1, 00:00 = 0)
 * @returns Object with day (1-based) and time ("HH:MM")
 *
 * @example
 * formatGameTime(0) // { day: 1, time: "00:00" }
 * formatGameTime(360) // { day: 1, time: "06:00" }
 * formatGameTime(450) // { day: 1, time: "07:30" }
 * formatGameTime(1440) // { day: 2, time: "00:00" }
 */
export function formatGameTime(totalMinutes: number): { day: number; time: string } {
  // Calculate day (1-based)
  const day = Math.floor(totalMinutes / MINUTES_PER_DAY) + 1;

  // Calculate time within day
  const minutesInDay = totalMinutes % MINUTES_PER_DAY;
  const hours = Math.floor(minutesInDay / MINUTES_PER_HOUR);
  const minutes = minutesInDay % MINUTES_PER_HOUR;

  // Format as HH:MM
  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return { day, time };
}

/**
 * Convert day number and time string to total minutes
 *
 * @param day - Day number (1, 2, 3...)
 * @param time - Time string in "HH:MM" format
 * @returns Total minutes since epoch
 *
 * @example
 * parseGameTime(1, "00:00") // 0
 * parseGameTime(1, "06:00") // 360
 * parseGameTime(1, "07:30") // 450
 * parseGameTime(2, "00:00") // 1440
 */
export function parseGameTime(day: number, time: string): number {
  const [hours, minutes] = time.split(':').map(Number);

  // Calculate total minutes from day and time
  const minutesFromDays = (day - 1) * MINUTES_PER_DAY;
  const minutesInDay = hours * MINUTES_PER_HOUR + minutes;

  return minutesFromDays + minutesInDay;
}

/**
 * Add minutes to current game time
 *
 * @param current - Current game time in minutes
 * @param add - Minutes to add
 * @returns New game time in minutes
 *
 * @example
 * addGameMinutes(0, 90) // 90 (00:00 + 1.5 hours = 01:30)
 * addGameMinutes(1380, 120) // 1500 (Day 1, 23:00 + 2 hours = Day 2, 01:00)
 */
export function addGameMinutes(current: number, add: number): number {
  return current + add;
}

/**
 * Calculate time difference in minutes
 *
 * @param from - Start time in minutes
 * @param to - End time in minutes
 * @returns Elapsed minutes (positive if to > from)
 *
 * @example
 * calculateDelta(0, 90) // 90
 * calculateDelta(100, 50) // -50
 */
export function calculateDelta(from: number, to: number): number {
  return to - from;
}

/**
 * Convert minutes to hours (for decay calculations, etc.)
 *
 * @param minutes - Minutes to convert
 * @returns Hours as decimal number
 *
 * @example
 * minutesToHours(60) // 1
 * minutesToHours(90) // 1.5
 * minutesToHours(45) // 0.75
 */
export function minutesToHours(minutes: number): number {
  return minutes / MINUTES_PER_HOUR;
}

/**
 * Format game time for display
 *
 * @param totalMinutes - Game time in minutes
 * @returns Formatted string "Day X, HH:MM"
 *
 * @example
 * formatForDisplay(0) // "Day 1, 06:00"
 * formatForDisplay(90) // "Day 1, 07:30"
 * formatForDisplay(1440) // "Day 2, 06:00"
 */
export function formatForDisplay(totalMinutes: number): string {
  const { day, time } = formatGameTime(totalMinutes);
  return `Day ${day}, ${time}`;
}

/**
 * Extract hour from game time (for sleep calculations, time slot logic)
 *
 * @param totalMinutes - Game time in minutes
 * @returns Hour (0-23)
 *
 * @example
 * getHour(0) // 0 (00:00)
 * getHour(360) // 6 (06:00)
 * getHour(450) // 7 (07:30)
 * getHour(1440) // 0 (Day 2, 00:00)
 */
export function getHour(totalMinutes: number): number {
  const minutesInDay = totalMinutes % MINUTES_PER_DAY;
  return Math.floor(minutesInDay / MINUTES_PER_HOUR);
}

/**
 * Extract minutes within current hour
 *
 * @param totalMinutes - Game time in minutes
 * @returns Minutes (0-59)
 *
 * @example
 * getMinute(0) // 0 (00:00)
 * getMinute(450) // 30 (07:30)
 */
export function getMinute(totalMinutes: number): number {
  const minutesInDay = totalMinutes % MINUTES_PER_DAY;
  return minutesInDay % MINUTES_PER_HOUR;
}

/**
 * Get day number from game time
 *
 * @param totalMinutes - Game time in minutes
 * @returns Day number (1, 2, 3...)
 *
 * @example
 * getDay(0) // 1
 * getDay(360) // 1 (06:00 still day 1)
 * getDay(1440) // 2
 */
export function getDay(totalMinutes: number): number {
  return Math.floor(totalMinutes / MINUTES_PER_DAY) + 1;
}

/**
 * Get time string from game time
 *
 * @param totalMinutes - Game time in minutes
 * @returns Time string "HH:MM"
 *
 * @example
 * getTimeString(0) // "00:00"
 * getTimeString(360) // "06:00"
 * getTimeString(450) // "07:30"
 */
export function getTimeString(totalMinutes: number): string {
  return formatGameTime(totalMinutes).time;
}

/**
 * Check if two game times are on the same day
 *
 * @param time1 - First game time in minutes
 * @param time2 - Second game time in minutes
 * @returns True if both times are on the same day
 */
export function isSameDay(time1: number, time2: number): boolean {
  return getDay(time1) === getDay(time2);
}

/**
 * Calculate how many days have passed between two game times
 *
 * @param from - Start time in minutes
 * @param to - End time in minutes
 * @returns Number of days elapsed
 */
export function daysBetween(from: number, to: number): number {
  return getDay(to) - getDay(from);
}

/**
 * Get time slot from game time
 *
 * @param totalMinutes - Game time in minutes
 * @returns Time slot (morning/afternoon/evening/night)
 *
 * @example
 * getTimeSlot(360) // 'morning' (06:00)
 * getTimeSlot(720) // 'afternoon' (12:00)
 * getTimeSlot(1080) // 'evening' (18:00)
 * getTimeSlot(0) // 'night' (00:00)
 */
export function getTimeSlot(totalMinutes: number): TimeSlot {
  const hour = getHour(totalMinutes);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night'; // 0-6
}

// ===== Activity End Time Validation =====

/**
 * Check if an activity would end after midnight (warning) or after 4 AM (forbidden).
 *
 * @param currentTimeMinutes - Current game time in total minutes
 * @param activityDurationMinutes - Duration of activity in minutes
 * @returns Object with after4am (forbidden) and afterMidnight (warning) flags
 *
 * @example
 * checkActivityEndTime(1410, 60) // 23:30 + 60min = 00:30 (warning)
 * checkActivityEndTime(180, 120)  // 03:00 + 120min = 05:00 (forbidden)
 */
export function checkActivityEndTime(
  currentTimeMinutes: number,
  activityDurationMinutes: number
): { after4am: boolean; afterMidnight: boolean } {
  const currentHour = getHour(currentTimeMinutes);
  const endTimeMinutes = currentTimeMinutes + activityDurationMinutes;
  const endHour = getHour(endTimeMinutes);

  const crossedMidnight = getDay(endTimeMinutes) > getDay(currentTimeMinutes);

  const after4am =
    (crossedMidnight && endHour >= 4 && endHour < 6) ||
    (!crossedMidnight && currentHour < 6 && endHour >= 4 && endHour < 6);

  const afterMidnight = crossedMidnight && endHour >= 0 && endHour < 4;

  return { after4am, afterMidnight };
}

// ===== Sleep Calculations =====

export interface SleepCalculation {
  wakeTimeMinutes: number;
  hoursSlept: number;
  energyRestored: number;
}

/**
 * Calculate sleep results based on bedtime (minutes within day).
 *
 * Sleep rules:
 * - Before 10 PM (6-21:59): Wake at 6 AM, 8 hours credit
 * - 10 PM to midnight (22-23:59): Sleep 8 hours
 * - Midnight to 4 AM (0-3:59): Wake at 8 AM, declining sleep
 * - 4-6 AM (4-5:59): Wake at 8 AM, minimal sleep
 *
 * @param bedtimeMinutesOfDay - Bedtime as minutes within day (0-1439)
 */
export function calculateSleep(bedtimeMinutesOfDay: number): SleepCalculation {
  const bedHour = Math.floor(bedtimeMinutesOfDay / MINUTES_PER_HOUR);

  let wakeTimeMinutes: number;
  let hoursSlept: number;

  if (bedHour >= 6 && bedHour < 22) {
    wakeTimeMinutes = 6 * MINUTES_PER_HOUR; // 06:00
    hoursSlept = 8;
  } else if (bedHour >= 22) {
    hoursSlept = 8;
    wakeTimeMinutes = (bedtimeMinutesOfDay + 8 * MINUTES_PER_HOUR) % MINUTES_PER_DAY;
  } else if (bedHour >= 0 && bedHour < 4) {
    wakeTimeMinutes = 8 * MINUTES_PER_HOUR; // 08:00
    hoursSlept = (8 * MINUTES_PER_HOUR - bedtimeMinutesOfDay) / MINUTES_PER_HOUR;
  } else {
    wakeTimeMinutes = 8 * MINUTES_PER_HOUR; // 08:00
    hoursSlept = (8 * MINUTES_PER_HOUR - bedtimeMinutesOfDay) / MINUTES_PER_HOUR;
  }

  const energyRestored = Math.min(80, Math.floor(hoursSlept * 10));

  return { wakeTimeMinutes, hoursSlept, energyRestored };
}

// ===== Bedtime Pattern Helpers =====

/**
 * Check if bedtime is before midnight (good sleep hygiene).
 * "Before midnight" means 20:00-23:59.
 */
export function isBeforeMidnight(bedtimeMinutesOfDay: number): boolean {
  const hour = Math.floor(bedtimeMinutesOfDay / MINUTES_PER_HOUR);
  return hour >= 20 && hour < 24;
}

/**
 * Check if bedtime is after 2 AM (poor sleep hygiene).
 * "After 2 AM" means 02:00-05:59.
 */
export function isAfter2AM(bedtimeMinutesOfDay: number): boolean {
  const hour = Math.floor(bedtimeMinutesOfDay / MINUTES_PER_HOUR);
  return hour >= 2 && hour < 6;
}

// ===== Location Operating Hours =====

/**
 * Check if a time falls within operating hours.
 * Handles venues that close after midnight (e.g., bar 11:00-02:00).
 *
 * @param timeMinutes - Time to check (minutes within day, 0-1439)
 * @param openMinutes - Opening time (minutes within day)
 * @param closeMinutes - Closing time (minutes within day)
 */
export function isWithinOperatingHours(
  timeMinutes: number,
  openMinutes: number,
  closeMinutes: number
): boolean {
  if (closeMinutes < openMinutes) {
    return timeMinutes >= openMinutes || timeMinutes < closeMinutes;
  }
  return timeMinutes >= openMinutes && timeMinutes < closeMinutes;
}
