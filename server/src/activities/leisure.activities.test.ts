/**
 * Leisure Activities Tests
 * Tests for leisure and relaxation activities
 */

import { LEISURE_ACTIVITIES } from './leisure.activities';
import { getActivityById } from './index';

describe('Leisure Activities', () => {
  it('should have 9 leisure activities', () => {
    expect(LEISURE_ACTIVITIES).toHaveLength(9);  // Added 2 wit training activities
  });

  it('should have low or positive energy costs (relaxing)', () => {
    LEISURE_ACTIVITIES.forEach(activity => {
      expect(activity.energyCost).toBeLessThanOrEqual(10);
    });
  });

  it('should verify specific activities exist', () => {
    const expectedIds = ['stroll_park', 'play_video_games', 'watch_tv', 'listen_music'];
    expectedIds.forEach(id => {
      const activity = getActivityById(id);
      expect(activity).toBeDefined();
      expect(activity!.type).toBe('leisure');
    });
  });

  it('should not restore energy (only self-care activities do)', () => {
    // Leisure activities don't restore energy, they just have low cost
    // Self-care activities like take_nap are the ones that restore energy
    const restorative = LEISURE_ACTIVITIES.filter(a => a.energyCost > 0);
    expect(restorative.length).toBe(0);
  });
});
