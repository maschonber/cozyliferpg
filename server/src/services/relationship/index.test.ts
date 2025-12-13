/**
 * Relationship Service Unit Tests
 * Tests for Phase 2 activities and relationship logic
 */

import { ACTIVITIES, getActivityById } from './index';

describe('Phase 2 Activities', () => {
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
        expect(activity).toHaveProperty('category');
        expect(activity).toHaveProperty('timeCost');
        expect(activity).toHaveProperty('energyCost');
        expect(activity).toHaveProperty('moneyCost');
        expect(activity).toHaveProperty('effects');

        // Validate types
        expect(typeof activity.id).toBe('string');
        expect(typeof activity.name).toBe('string');
        expect(typeof activity.description).toBe('string');
        expect(typeof activity.category).toBe('string');
        expect(typeof activity.timeCost).toBe('number');
        expect(typeof activity.energyCost).toBe('number');
        expect(typeof activity.moneyCost).toBe('number');
        expect(typeof activity.effects).toBe('object');
      });
    });

    it('should have unique IDs for all activities', () => {
      const ids = ACTIVITIES.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ACTIVITIES.length);
    });

    it('should have valid categories', () => {
      const validCategories = ['work', 'social', 'self_improvement', 'leisure', 'self_care', 'discovery'];
      ACTIVITIES.forEach(activity => {
        expect(validCategories).toContain(activity.category);
      });
    });
  });

  describe('Work Activities', () => {
    const workActivities = ACTIVITIES.filter(a => a.category === 'work');

    it('should have 3 work activities', () => {
      expect(workActivities).toHaveLength(3);
    });

    it('should have positive money rewards', () => {
      workActivities.forEach(activity => {
        expect(activity.moneyCost).toBeGreaterThan(0);
      });
    });

    it('should have negative energy costs', () => {
      workActivities.forEach(activity => {
        expect(activity.energyCost).toBeLessThan(0);
      });
    });

    it('should have work_part_time activity', () => {
      const partTime = getActivityById('work_part_time');
      expect(partTime).toBeDefined();
      expect(partTime?.timeCost).toBe(240); // 4 hours
      expect(partTime?.energyCost).toBe(-30);
      expect(partTime?.moneyCost).toBe(80);
      expect(partTime?.allowedTimeSlots).toEqual(['morning', 'afternoon']);
    });

    it('should have work_full_day activity', () => {
      const fullDay = getActivityById('work_full_day');
      expect(fullDay).toBeDefined();
      expect(fullDay?.timeCost).toBe(480); // 8 hours
      expect(fullDay?.energyCost).toBe(-50);
      expect(fullDay?.moneyCost).toBe(150);
      expect(fullDay?.allowedTimeSlots).toEqual(['morning']);
    });
  });

  describe('Social Activities', () => {
    const socialActivities = ACTIVITIES.filter(a => a.category === 'social');

    it('should have 11 social activities', () => {
      expect(socialActivities).toHaveLength(11);
    });

    it('should have friendship or romance effects', () => {
      socialActivities.forEach(activity => {
        const hasFriendship = activity.effects.friendship !== undefined;
        const hasRomance = activity.effects.romance !== undefined;
        expect(hasFriendship || hasRomance).toBe(true);
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
        expect(activity?.category).toBe('social');
      });
    });
  });

  describe('Self-Improvement Activities', () => {
    const selfImprovementActivities = ACTIVITIES.filter(a => a.category === 'self_improvement');

    it('should have 11 self-improvement activities', () => {
      expect(selfImprovementActivities).toHaveLength(11);  // Added 5 mixed stat training activities
    });

    it('should have zero or negative energy costs (effort required or restorative)', () => {
      selfImprovementActivities.forEach(activity => {
        expect(activity.energyCost).toBeLessThanOrEqual(0);  // Allow 0 for meditation
      });
    });

    it('should verify specific activities exist', () => {
      const expectedIds = ['study_library', 'work_out_gym', 'read_book', 'creative_hobby'];
      expectedIds.forEach(id => {
        const activity = getActivityById(id);
        expect(activity).toBeDefined();
        expect(activity?.category).toBe('self_improvement');
      });
    });
  });

  describe('Leisure Activities', () => {
    const leisureActivities = ACTIVITIES.filter(a => a.category === 'leisure');

    it('should have 9 leisure activities', () => {
      expect(leisureActivities).toHaveLength(9);  // Added 2 wit training activities
    });

    it('should have low or positive energy costs (relaxing)', () => {
      leisureActivities.forEach(activity => {
        expect(activity.energyCost).toBeLessThanOrEqual(10);
      });
    });

    it('should verify specific activities exist', () => {
      const expectedIds = ['stroll_park', 'play_video_games', 'watch_tv', 'listen_music'];
      expectedIds.forEach(id => {
        const activity = getActivityById(id);
        expect(activity).toBeDefined();
        expect(activity?.category).toBe('leisure');
      });
    });

    it('should not restore energy (only self-care activities do)', () => {
      // Leisure activities don't restore energy, they just have low cost
      // Self-care activities like take_nap are the ones that restore energy
      const restorative = leisureActivities.filter(a => a.energyCost > 0);
      expect(restorative.length).toBe(0);
    });
  });

  describe('Self-Care Activities', () => {
    const selfCareActivities = ACTIVITIES.filter(a => a.category === 'self_care');

    it('should have 2 self-care activities', () => {
      expect(selfCareActivities).toHaveLength(2);
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

  describe('Discovery Activities', () => {
    const discoveryActivities = ACTIVITIES.filter(a => a.category === 'discovery');

    it('should have 1 discovery activity', () => {
      expect(discoveryActivities).toHaveLength(1);
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
