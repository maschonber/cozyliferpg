/**
 * Activity System Tests
 * Tests for general activity structure, balance, and utility functions
 */

import { ACTIVITIES, getActivityById } from './index';
import { isSocialActivity } from '../../../shared/types';

describe('Activity System', () => {
  describe('Activity Count', () => {
    it('should have exactly 37 activities', () => {
      expect(ACTIVITIES).toHaveLength(37);  // Added 7 mixed stat training activities
    });
  });

  describe('Activity Structure', () => {
    it('should have all required fields for each activity', () => {
      ACTIVITIES.forEach(activity => {
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('name');
        expect(activity).toHaveProperty('description');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('timeCost');
        expect(activity).toHaveProperty('energyCost');
        expect(activity).toHaveProperty('moneyCost');

        // Validate types
        expect(typeof activity.id).toBe('string');
        expect(typeof activity.name).toBe('string');
        expect(typeof activity.description).toBe('string');
        expect(typeof activity.type).toBe('string');
        expect(typeof activity.timeCost).toBe('number');
        expect(typeof activity.energyCost).toBe('number');
        expect(typeof activity.moneyCost).toBe('number');

        // Social activities have relationshipEffects
        if (isSocialActivity(activity)) {
          expect(activity).toHaveProperty('relationshipEffects');
          expect(typeof activity.relationshipEffects).toBe('object');
        }
      });
    });

    it('should have unique IDs for all activities', () => {
      const ids = ACTIVITIES.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ACTIVITIES.length);
    });

    it('should have valid types', () => {
      const validTypes = ['work', 'social', 'training', 'leisure', 'recovery', 'discovery'];
      ACTIVITIES.forEach(activity => {
        expect(validTypes).toContain(activity.type);
      });
    });
  });

  describe('Activity Balance', () => {
    it('should have reasonable time costs (0-480 minutes)', () => {
      ACTIVITIES.forEach(activity => {
        expect(activity.timeCost).toBeGreaterThanOrEqual(0);
        expect(activity.timeCost).toBeLessThanOrEqual(480);
      });
    });

    it('should have reasonable energy costs (-50 to +25)', () => {
      ACTIVITIES.forEach(activity => {
        expect(activity.energyCost).toBeGreaterThanOrEqual(-50);
        expect(activity.energyCost).toBeLessThanOrEqual(25);
      });
    });

    it('should have reasonable money values (-30 to +150)', () => {
      ACTIVITIES.forEach(activity => {
        expect(activity.moneyCost).toBeGreaterThanOrEqual(-30);
        expect(activity.moneyCost).toBeLessThanOrEqual(150);
      });
    });
  });

  describe('getActivityById', () => {
    it('should find activity by ID', () => {
      const activity = getActivityById('have_coffee');
      expect(activity).toBeDefined();
      expect(activity?.name).toBe('Have Coffee Together');
    });

    it('should return undefined for non-existent activity', () => {
      const activity = getActivityById('non_existent');
      expect(activity).toBeUndefined();
    });
  });
});
