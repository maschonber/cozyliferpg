/**
 * Social Activities Tests
 * Tests for social interaction activities
 */

import { SOCIAL_ACTIVITIES } from './social.activities';
import { getActivityById } from './index';

describe('Social Activities', () => {
  it('should have at least one social activity', () => {
    expect(SOCIAL_ACTIVITIES.length).toBeGreaterThan(0);
  });

  it('should have trust, affection, or desire effects', () => {
    SOCIAL_ACTIVITIES.forEach(activity => {
      const hasTrust = activity.relationshipEffects.trust !== undefined;
      const hasAffection = activity.relationshipEffects.affection !== undefined;
      const hasDesire = activity.relationshipEffects.desire !== undefined;
      expect(hasTrust || hasAffection || hasDesire).toBe(true);
    });
  });

  it('should have valid difficulty values (0-100)', () => {
    SOCIAL_ACTIVITIES.forEach(activity => {
      expect(activity.difficulty).toBeGreaterThanOrEqual(0);
      expect(activity.difficulty).toBeLessThanOrEqual(100);
    });
  });

  it('should have location-specific activities use valid locations', () => {
    const validLocations = [
      'home', 'park', 'coffee_shop', 'library',
      'shopping_district', 'gym', 'movie_theater', 'beach', 'boardwalk', 'bar'
    ];

    SOCIAL_ACTIVITIES.forEach(activity => {
      if (activity.location) {
        expect(validLocations).toContain(activity.location);
      }
    });
  });

  it('should have both general and location-specific activities', () => {
    const generalActivities = SOCIAL_ACTIVITIES.filter(a => !a.location);
    const locationActivities = SOCIAL_ACTIVITIES.filter(a => a.location);

    expect(generalActivities.length).toBeGreaterThan(0);
    expect(locationActivities.length).toBeGreaterThan(0);
  });

  it('should be retrievable by ID through getActivityById', () => {
    SOCIAL_ACTIVITIES.forEach(activity => {
      const found = getActivityById(activity.id);
      expect(found).toBeDefined();
      expect(found!.type).toBe('social');
    });
  });
});
