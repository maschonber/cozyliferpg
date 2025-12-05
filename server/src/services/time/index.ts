/**
 * Time Service (Phase 2)
 * Helper functions for time management, sleep calculations, and activity validation
 */

import { TimeSlot, Activity, PlayerCharacter, ActivityAvailability, SleepResult } from '../../../../shared/types';

/**
 * Get time slot from time string (HH:MM)
 */
export function getTimeSlot(time: string): TimeSlot {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night'; // 0-6
}

/**
 * Add minutes to a time string
 * @param time - Time in "HH:MM" format
 * @param minutes - Minutes to add
 * @returns New time in "HH:MM" format
 */
export function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;

  // Handle day overflow (wrap around at 24 hours)
  const newTotalMinutes = totalMinutes % (24 * 60);
  const newHours = Math.floor(newTotalMinutes / 60);
  const newMins = newTotalMinutes % 60;

  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

/**
 * Check if an activity would end after midnight (warning) or after 4 AM (forbidden)
 * @returns { after4am: boolean, afterMidnight: boolean }
 */
export function checkActivityEndTime(currentTime: string, activityDurationMinutes: number): {
  after4am: boolean;
  afterMidnight: boolean;
} {
  const endTime = addMinutes(currentTime, activityDurationMinutes);
  const [currentHour] = currentTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);

  // Check if we crossed midnight (hour wrapped around)
  // This happens when end hour < current hour (e.g., 23:00 -> 01:00)
  const crossedMidnight = endHour < currentHour;

  // Activity ends after 4 AM (4-5:59) - forbidden
  // This includes both: activities that cross midnight AND end at 4-5:59,
  // or activities that start after midnight and end at 4-5:59
  const after4am = (crossedMidnight && endHour >= 4 && endHour < 6) ||
                   (!crossedMidnight && currentHour < 6 && endHour >= 4 && endHour < 6);

  // Activity ends after midnight but before 4 AM - warning
  // Only applies to activities that actually cross midnight
  const afterMidnight = crossedMidnight && endHour >= 0 && endHour < 4;

  return { after4am, afterMidnight };
}

/**
 * Calculate sleep results based on bedtime
 * @param bedtime - Time going to sleep in "HH:MM" format
 * @returns Sleep results with wake time, energy restored, and hours slept
 */
export function calculateSleepResults(bedtime: string): SleepResult {
  const bedHour = parseInt(bedtime.split(':')[0]);
  const bedMinute = parseInt(bedtime.split(':')[1]);

  let wakeTime: string;
  let hoursSlept: number;

  // Case 1: Before 10 PM (6 AM - 9:59 PM)
  // Wake at 6 AM, but only get energy for 8 hours max
  if (bedHour >= 6 && bedHour < 22) {
    wakeTime = "06:00";
    hoursSlept = 8; // Capped at 8 hours for energy purposes
  }
  // Case 2: Between 10 PM and midnight (22:00 - 23:59)
  // Sleep exactly 8 hours, wake 8 hours after bedtime
  else if (bedHour >= 22) {
    hoursSlept = 8;
    const bedTimeInMinutes = bedHour * 60 + bedMinute;
    const wakeMinutes = bedTimeInMinutes + (8 * 60);
    const wakeHour = Math.floor(wakeMinutes / 60) % 24;
    const wakeMin = wakeMinutes % 60;
    wakeTime = `${String(wakeHour).padStart(2, '0')}:${String(wakeMin).padStart(2, '0')}`;
  }
  // Case 3: After midnight, before 4 AM (0:00 - 3:59)
  // Wake at 8 AM, sleep time gradually declines
  else if (bedHour >= 0 && bedHour < 4) {
    wakeTime = "08:00";
    const bedTimeInMinutes = bedHour * 60 + bedMinute;
    const wakeTimeInMinutes = 8 * 60; // 8 AM
    hoursSlept = (wakeTimeInMinutes - bedTimeInMinutes) / 60;
    // At midnight: 8 hours
    // At 1 AM: 7 hours
    // At 2 AM: 6 hours
    // At 3 AM: 5 hours
  }
  // Case 4: Between 4 AM and 6 AM (4:00 - 5:59)
  // Edge case: wake at 8 AM
  else {
    wakeTime = "08:00";
    const bedTimeInMinutes = bedHour * 60 + bedMinute;
    const wakeTimeInMinutes = 8 * 60;
    hoursSlept = (wakeTimeInMinutes - bedTimeInMinutes) / 60;
  }

  // Calculate energy restoration (hours × 10, max 80)
  const energyRestored = Math.min(80, Math.floor(hoursSlept * 10));

  return {
    wakeTime,
    energyRestored,
    hoursSlept,
    newDay: 0 // Will be set by caller
  };
}

/**
 * Check if an activity can be performed based on player state
 * @param activity - The activity to check
 * @param player - Current player state
 * @returns Availability result with reason if not available
 */
export function canPerformActivity(
  activity: Activity,
  player: PlayerCharacter
): ActivityAvailability {
  // Check energy
  if (player.currentEnergy + activity.energyCost < 0) {
    return {
      activityId: activity.id,
      available: false,
      reason: "Not enough energy"
    };
  }

  // Check money
  if (player.money + activity.moneyCost < 0) {
    return {
      activityId: activity.id,
      available: false,
      reason: "Not enough money"
    };
  }

  // Check time slot restriction
  if (activity.allowedTimeSlots) {
    const currentSlot = getTimeSlot(player.currentTime);
    if (!activity.allowedTimeSlots.includes(currentSlot)) {
      return {
        activityId: activity.id,
        available: false,
        reason: "Not available at this time"
      };
    }
  }

  // Check if activity would end after 4 AM (forbidden)
  const { after4am, afterMidnight } = checkActivityEndTime(player.currentTime, activity.timeCost);

  if (after4am) {
    return {
      activityId: activity.id,
      available: false,
      reason: "Would end too late (after 4 AM)"
    };
  }

  return {
    activityId: activity.id,
    available: true,
    endsAfterMidnight: afterMidnight
  };
}
