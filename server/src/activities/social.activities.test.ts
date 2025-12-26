/**
 * Social Activities Tests
 * Tests for social interaction activities
 */

import { SOCIAL_ACTIVITIES } from './social.activities';
import { getActivityById } from './index';

describe('Social Activities', () => {
  it('should have 11 social activities', () => {
    expect(SOCIAL_ACTIVITIES).toHaveLength(11);
  });

  it('should have trust, affection, or desire effects', () => {
    SOCIAL_ACTIVITIES.forEach(activity => {
      const hasTrust = activity.relationshipEffects.trust !== undefined;
      const hasAffection = activity.relationshipEffects.affection !== undefined;
      const hasDesire = activity.relationshipEffects.desire !== undefined;
      expect(hasTrust || hasAffection || hasDesire).toBe(true);
    });
  });

  it('should verify specific social activities exist', () => {
    const expectedIds = [
      'have_coffee',
      'quick_chat',
      'casual_date',
      'deep_conversation',
      'go_to_movies',
      'exercise_together',
      'cook_dinner',
      'flirt_playfully'
    ];

    expectedIds.forEach(id => {
      const activity = getActivityById(id);
      expect(activity).toBeDefined();
      expect(activity!.type).toBe('social');
    });
  });
});
