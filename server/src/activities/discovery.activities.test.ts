/**
 * Discovery Activities Tests
 * Tests for discovery and exploration activities
 */

import { DISCOVERY_ACTIVITIES } from './discovery.activities';
import { getActivityById } from './index';

describe('Discovery Activities', () => {
  it('should have 1 discovery activity', () => {
    expect(DISCOVERY_ACTIVITIES).toHaveLength(1);
  });

  it('should have meet_someone activity', () => {
    const meetSomeone = getActivityById('meet_someone');
    expect(meetSomeone).toBeDefined();
    expect(meetSomeone?.name).toBe('Meet Someone New');
    expect(meetSomeone?.timeCost).toBe(45);
    expect(meetSomeone?.energyCost).toBe(-20);
    expect(meetSomeone?.moneyCost).toBe(0);
  });
});
