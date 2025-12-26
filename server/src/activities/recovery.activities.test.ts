/**
 * Recovery Activities Tests
 * Tests for self-care and recovery activities
 */

import { RECOVERY_ACTIVITIES } from './recovery.activities';
import { getActivityById } from './index';

describe('Recovery Activities', () => {
  it('should have 2 self-care activities', () => {
    expect(RECOVERY_ACTIVITIES).toHaveLength(2);
  });

  it('should have take_nap activity', () => {
    const nap = getActivityById('take_nap');
    expect(nap).toBeDefined();
    expect(nap?.timeCost).toBe(60);
    expect(nap?.energyCost).toBe(5); // Restores 5 energy
    // Note: take_nap doesn't have allowedTimeSlots restriction
  });

  it('should have go_to_sleep activity', () => {
    const sleep = getActivityById('go_to_sleep');
    expect(sleep).toBeDefined();
    expect(sleep?.timeCost).toBe(0); // Special: ends day
    expect(sleep?.energyCost).toBe(0); // Special: calculated
    expect(sleep?.allowedTimeSlots).toEqual(['evening', 'night']);
  });
});
