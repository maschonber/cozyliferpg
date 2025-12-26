/**
 * Work Activities Tests
 * Tests for work-related activities
 */

import { WORK_ACTIVITIES } from './work.activities';
import { getActivityById } from './index';

describe('Work Activities', () => {
  it('should have 3 work activities', () => {
    expect(WORK_ACTIVITIES).toHaveLength(3);
  });

  it('should have outcome profiles with mainMoneyGain', () => {
    WORK_ACTIVITIES.forEach(activity => {
      expect(activity.outcomeProfile).toBeDefined();
      expect(activity.outcomeProfile?.mainMoneyGain).toBeGreaterThan(0);
    });
  });

  it('should have negative energy costs', () => {
    WORK_ACTIVITIES.forEach(activity => {
      expect(activity.energyCost).toBeLessThan(0);
    });
  });

  it('should have work_part_time activity', () => {
    const partTime = getActivityById('work_part_time', 'work');
    expect(partTime).toBeDefined();
    expect(partTime?.timeCost).toBe(240); // 4 hours
    expect(partTime?.energyCost).toBe(-30);
    expect(partTime?.moneyCost).toBe(0); // Money comes from outcome scaling
    expect(partTime?.outcomeProfile.mainMoneyGain).toBe(80); // Base money reward
    expect(partTime?.allowedTimeSlots).toEqual(['morning', 'afternoon']);
  });

  it('should have work_full_day activity', () => {
    const fullDay = getActivityById('work_full_day', 'work');
    expect(fullDay).toBeDefined();
    expect(fullDay?.timeCost).toBe(480); // 8 hours
    expect(fullDay?.energyCost).toBe(-50);
    expect(fullDay?.moneyCost).toBe(0); // Money comes from outcome scaling
    expect(fullDay?.outcomeProfile.mainMoneyGain).toBe(150); // Base money reward
    expect(fullDay?.allowedTimeSlots).toEqual(['morning']);
  });
});
