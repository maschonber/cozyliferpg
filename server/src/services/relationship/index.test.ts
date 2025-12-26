/**
 * Relationship Service Unit Tests
 * Tests for Phase 2 activities and relationship logic
 * Task 3: Relationship Axis System tests
 */

import {
  ACTIVITIES,
  getActivityById,
  calculateRelationshipState,
  applyRelationshipDelta,
  getRelationshipDifficultyModifier,
  getRepairDifficulty,
  calculateDesireCap
} from './index';
import { isSocialActivity } from '../../../../shared/types';

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

  describe('Work Activities', () => {
    const workActivities = ACTIVITIES.filter(a => a.type === 'work');

    it('should have 3 work activities', () => {
      expect(workActivities).toHaveLength(3);
    });

    it('should have outcome profiles with mainMoneyGain', () => {
      workActivities.forEach(activity => {
        expect(activity.outcomeProfile).toBeDefined();
        expect(activity.outcomeProfile?.mainMoneyGain).toBeGreaterThan(0);
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
      expect(partTime?.moneyCost).toBe(0); // Money comes from outcome scaling
      expect(partTime?.outcomeProfile?.mainMoneyGain).toBe(80); // Base money reward
      expect(partTime?.allowedTimeSlots).toEqual(['morning', 'afternoon']);
    });

    it('should have work_full_day activity', () => {
      const fullDay = getActivityById('work_full_day');
      expect(fullDay).toBeDefined();
      expect(fullDay?.timeCost).toBe(480); // 8 hours
      expect(fullDay?.energyCost).toBe(-50);
      expect(fullDay?.moneyCost).toBe(0); // Money comes from outcome scaling
      expect(fullDay?.outcomeProfile?.mainMoneyGain).toBe(150); // Base money reward
      expect(fullDay?.allowedTimeSlots).toEqual(['morning']);
    });
  });

  describe('Social Activities', () => {
    const socialActivities = ACTIVITIES.filter(a => a.type === 'social');

    it('should have 11 social activities', () => {
      expect(socialActivities).toHaveLength(11);
    });

    it('should have trust, affection, or desire effects', () => {
      socialActivities.forEach(activity => {
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

  describe('Self-Improvement Activities', () => {
    const selfImprovementActivities = ACTIVITIES.filter(a => a.type === 'training');

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
        expect(activity!.type).toBe('training');
      });
    });
  });

  describe('Leisure Activities', () => {
    const leisureActivities = ACTIVITIES.filter(a => a.type === 'leisure');

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
        expect(activity!.type).toBe('leisure');
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
    const selfCareActivities = ACTIVITIES.filter(a => a.type === 'recovery');

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
    const discoveryActivities = ACTIVITIES.filter(a => a.type === 'discovery');

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

// ===== Task 3: Relationship Axis System Tests =====

describe('Task 3: Relationship Axis System', () => {
  describe('calculateRelationshipState', () => {
    describe('Positive Combined States', () => {
      it('should return "partner" for high trust, affection, and desire', () => {
        expect(calculateRelationshipState(70, 80, 60)).toBe('partner');
        expect(calculateRelationshipState(60, 60, 50)).toBe('partner'); // Exact thresholds
      });

      it('should return "lover" for high desire and affection but low trust', () => {
        expect(calculateRelationshipState(30, 50, 70)).toBe('lover');
        expect(calculateRelationshipState(50, 40, 60)).toBe('lover'); // Below trust threshold
      });

      it('should return "close_friend" for high affection and trust but low desire', () => {
        expect(calculateRelationshipState(50, 70, 20)).toBe('close_friend');
        expect(calculateRelationshipState(40, 60, 25)).toBe('close_friend'); // Below desire threshold
      });

      it('should return "friend" for moderate affection and trust', () => {
        expect(calculateRelationshipState(30, 40, 10)).toBe('friend');
        expect(calculateRelationshipState(20, 30, 0)).toBe('friend'); // Exact thresholds
      });

      it('should return "crush" for high desire but low affection', () => {
        expect(calculateRelationshipState(10, 20, 50)).toBe('crush');
        expect(calculateRelationshipState(0, 25, 40)).toBe('crush'); // Below affection threshold
      });

      it('should return "acquaintance" for any positive axis', () => {
        expect(calculateRelationshipState(15, 5, 0)).toBe('acquaintance');
        expect(calculateRelationshipState(0, 12, 5)).toBe('acquaintance');
        expect(calculateRelationshipState(5, 0, 11)).toBe('acquaintance');
      });
    });

    describe('Negative States', () => {
      it('should return "enemy" for very negative trust AND affection', () => {
        expect(calculateRelationshipState(-60, -60, 0)).toBe('enemy');
        expect(calculateRelationshipState(-51, -51, 10)).toBe('enemy'); // Just below threshold
      });

      it('should return "rival" for negative trust OR affection (but not both below enemy threshold)', () => {
        expect(calculateRelationshipState(-40, 10, 0)).toBe('rival');
        expect(calculateRelationshipState(10, -40, 5)).toBe('rival');
        expect(calculateRelationshipState(-31, 5, 0)).toBe('rival'); // Just below threshold
      });

      it('should not return enemy/rival at exact threshold values', () => {
        // At exactly -50, should be complicated or another state (not enemy)
        expect(calculateRelationshipState(-50, -50, 0)).not.toBe('enemy');
        // At exactly -30, should be complicated or another state (not rival)
        expect(calculateRelationshipState(-30, 5, 0)).not.toBe('rival');
      });
    });

    describe('Mixed/Complex States', () => {
      it('should return "complicated" for mixed positive and negative axes', () => {
        expect(calculateRelationshipState(30, -25, 10)).toBe('complicated');
        expect(calculateRelationshipState(-25, 40, -15)).toBe('complicated');
        expect(calculateRelationshipState(25, -30, 35)).toBe('complicated');
      });
    });

    describe('Neutral State', () => {
      it('should return "stranger" for all axes near 0', () => {
        expect(calculateRelationshipState(0, 0, 0)).toBe('stranger');
        expect(calculateRelationshipState(5, -5, 3)).toBe('stranger');
        expect(calculateRelationshipState(-8, 7, -2)).toBe('stranger');
      });
    });

    describe('Edge Cases', () => {
      it('should handle boundary values correctly', () => {
        // Partner threshold boundaries (>= for positive states)
        expect(calculateRelationshipState(59, 80, 60)).not.toBe('partner');
        expect(calculateRelationshipState(60, 59, 60)).not.toBe('partner');
        expect(calculateRelationshipState(60, 60, 49)).not.toBe('partner');

        // Enemy threshold boundaries (< for negative states, not <=)
        // At exactly -50, should NOT be enemy (need to be below -50)
        expect(calculateRelationshipState(-50, -60, 0)).not.toBe('enemy');
        expect(calculateRelationshipState(-60, -50, 0)).not.toBe('enemy');
        // Just below -50 should be enemy
        expect(calculateRelationshipState(-51, -51, 0)).toBe('enemy');
      });

      it('should prioritize partner over close_friend when all axes are high', () => {
        expect(calculateRelationshipState(70, 70, 70)).toBe('partner');
      });

      it('should prioritize enemy over rival for very negative values', () => {
        expect(calculateRelationshipState(-70, -70, 0)).toBe('enemy');
      });
    });
  });

  describe('applyRelationshipDelta', () => {
    describe('Basic Delta Application', () => {
      it('should apply positive deltas correctly', () => {
        const result = applyRelationshipDelta(
          { trust: 30, affection: 40, desire: 20 },
          { trust: 10, affection: 15, desire: 5 }
        );
        expect(result).toEqual({ trust: 40, affection: 55, desire: 25 });
      });

      it('should apply negative deltas correctly', () => {
        const result = applyRelationshipDelta(
          { trust: 50, affection: 60, desire: 40 },
          { trust: -20, affection: -10, desire: -15 }
        );
        expect(result).toEqual({ trust: 30, affection: 50, desire: 25 });
      });

      it('should handle partial deltas (only some axes changed)', () => {
        const result = applyRelationshipDelta(
          { trust: 30, affection: 40, desire: 20 },
          { affection: 15 } // Only affection changes
        );
        expect(result).toEqual({ trust: 30, affection: 55, desire: 20 });
      });

      it('should handle empty deltas', () => {
        const result = applyRelationshipDelta(
          { trust: 30, affection: 40, desire: 20 },
          {}
        );
        expect(result).toEqual({ trust: 30, affection: 40, desire: 20 });
      });
    });

    describe('Clamping Behavior', () => {
      it('should clamp values to maximum of 100', () => {
        const result = applyRelationshipDelta(
          { trust: 90, affection: 95, desire: 85 },
          { trust: 20, affection: 15, desire: 30 }
        );
        expect(result).toEqual({ trust: 100, affection: 100, desire: 100 });
      });

      it('should clamp values to minimum of -100', () => {
        const result = applyRelationshipDelta(
          { trust: -90, affection: -85, desire: -80 },
          { trust: -20, affection: -25, desire: -30 }
        );
        expect(result).toEqual({ trust: -100, affection: -100, desire: -100 });
      });

      it('should clamp individual axes independently', () => {
        const result = applyRelationshipDelta(
          { trust: 95, affection: -95, desire: 50 },
          { trust: 10, affection: -10, desire: -5 }
        );
        expect(result).toEqual({ trust: 100, affection: -100, desire: 45 });
      });
    });

    describe('Desire Cap Behavior', () => {
      it('should apply desire cap when desire exceeds cap', () => {
        const result = applyRelationshipDelta(
          { trust: 30, affection: 40, desire: 20 },
          { desire: 15 },
          25 // Desire cap
        );
        expect(result).toEqual({ trust: 30, affection: 40, desire: 25 });
      });

      it('should not affect desire when below cap', () => {
        const result = applyRelationshipDelta(
          { trust: 30, affection: 40, desire: 15 },
          { desire: 5 },
          25 // Desire cap
        );
        expect(result).toEqual({ trust: 30, affection: 40, desire: 20 });
      });

      it('should cap desire at specified value even with large delta', () => {
        const result = applyRelationshipDelta(
          { trust: 30, affection: 40, desire: 10 },
          { desire: 50 },
          25 // Desire cap
        );
        expect(result).toEqual({ trust: 30, affection: 40, desire: 25 });
      });

      it('should not affect desire when no cap is specified', () => {
        const result = applyRelationshipDelta(
          { trust: 30, affection: 40, desire: 80 },
          { desire: 15 }
        );
        expect(result).toEqual({ trust: 30, affection: 40, desire: 95 });
      });

      it('should handle zero desire cap (aromantic/asexual)', () => {
        const result = applyRelationshipDelta(
          { trust: 30, affection: 40, desire: 0 },
          { desire: 20 },
          0 // Zero cap
        );
        expect(result).toEqual({ trust: 30, affection: 40, desire: 0 });
      });
    });
  });

  describe('getRelationshipDifficultyModifier', () => {
    describe('Positive Relationship States', () => {
      it('should return -15 for partner (easiest)', () => {
        const modifier = getRelationshipDifficultyModifier(
          { trust: 70, affection: 80, desire: 60 },
          'partner'
        );
        expect(modifier).toBe(-15);
      });

      it('should return -12 for lover', () => {
        const modifier = getRelationshipDifficultyModifier(
          { trust: 30, affection: 50, desire: 70 },
          'lover'
        );
        expect(modifier).toBe(-12);
      });

      it('should return -12 for close_friend', () => {
        const modifier = getRelationshipDifficultyModifier(
          { trust: 50, affection: 70, desire: 20 },
          'close_friend'
        );
        expect(modifier).toBe(-12);
      });

      it('should return -8 for friend', () => {
        const modifier = getRelationshipDifficultyModifier(
          { trust: 30, affection: 40, desire: 10 },
          'friend'
        );
        expect(modifier).toBe(-8);
      });

      it('should return -5 for crush', () => {
        const modifier = getRelationshipDifficultyModifier(
          { trust: 10, affection: 20, desire: 50 },
          'crush'
        );
        expect(modifier).toBe(-5);
      });

      it('should return -3 for acquaintance', () => {
        const modifier = getRelationshipDifficultyModifier(
          { trust: 15, affection: 5, desire: 0 },
          'acquaintance'
        );
        expect(modifier).toBe(-3);
      });
    });

    describe('Negative Relationship States', () => {
      it('should return 30 for enemy (hardest)', () => {
        const modifier = getRelationshipDifficultyModifier(
          { trust: -60, affection: -60, desire: 0 },
          'enemy'
        );
        expect(modifier).toBe(30);
      });

      it('should return 15 for rival', () => {
        const modifier = getRelationshipDifficultyModifier(
          { trust: -40, affection: 10, desire: 0 },
          'rival'
        );
        expect(modifier).toBe(15);
      });
    });

    describe('Mixed/Neutral States', () => {
      it('should return 10 for complicated', () => {
        const modifier = getRelationshipDifficultyModifier(
          { trust: 30, affection: -25, desire: 10 },
          'complicated'
        );
        expect(modifier).toBe(10);
      });

      it('should return 0 for stranger (neutral)', () => {
        const modifier = getRelationshipDifficultyModifier(
          { trust: 0, affection: 0, desire: 0 },
          'stranger'
        );
        expect(modifier).toBe(0);
      });
    });
  });

  describe('getRepairDifficulty', () => {
    describe('Negative Value Scaling', () => {
      it('should scale difficulty for moderately negative values', () => {
        const difficulty = getRepairDifficulty(-40, 50);
        // Formula: 50 * (1 + 40/50) = 50 * 1.8 = 90
        expect(difficulty).toBe(90);
      });

      it('should scale difficulty higher for very negative values', () => {
        const difficulty = getRepairDifficulty(-80, 50);
        // Formula: 50 * (1 + 80/50) = 50 * 2.6 = 130
        expect(difficulty).toBe(130);
      });

      it('should scale difficulty for slightly negative values', () => {
        const difficulty = getRepairDifficulty(-25, 50);
        // Formula: 50 * (1 + 25/50) = 50 * 1.5 = 75
        expect(difficulty).toBe(75);
      });

      it('should demonstrate linear scaling (deeper negatives increase difficulty)', () => {
        const diff20 = getRepairDifficulty(-20, 50);
        const diff40 = getRepairDifficulty(-40, 50);
        const diff80 = getRepairDifficulty(-80, 50);

        // Verify the scaling increases with deeper negatives
        expect(diff40).toBeGreaterThan(diff20);
        expect(diff80).toBeGreaterThan(diff40);

        // The increases should be linear based on the formula
        // diff20 = 50 * 1.4 = 70, diff40 = 50 * 1.8 = 90, diff80 = 50 * 2.6 = 130
        // So diff40 - diff20 = 20, and diff80 - diff40 = 40 (not equal, but proportional)
        expect(diff40 - diff20).toBeGreaterThan(0);
        expect(diff80 - diff40).toBeGreaterThan(diff40 - diff20);
      });
    });

    describe('Positive Value Behavior', () => {
      it('should return base difficulty for positive values', () => {
        const difficulty = getRepairDifficulty(20, 50);
        expect(difficulty).toBe(50);
      });

      it('should return base difficulty for zero', () => {
        const difficulty = getRepairDifficulty(0, 50);
        expect(difficulty).toBe(50);
      });

      it('should return base difficulty for high positive values', () => {
        const difficulty = getRepairDifficulty(80, 50);
        expect(difficulty).toBe(50);
      });
    });

    describe('Custom Base Difficulty', () => {
      it('should work with custom base difficulty values', () => {
        const difficulty = getRepairDifficulty(-50, 100);
        // Formula: 100 * (1 + 50/50) = 100 * 2 = 200
        expect(difficulty).toBe(200);
      });

      it('should use default base difficulty of 50 when not specified', () => {
        const difficulty = getRepairDifficulty(-50);
        // Formula: 50 * (1 + 50/50) = 50 * 2 = 100
        expect(difficulty).toBe(100);
      });
    });

    describe('Edge Cases', () => {
      it('should handle -100 (maximum negative)', () => {
        const difficulty = getRepairDifficulty(-100, 50);
        // Formula: 50 * (1 + 100/50) = 50 * 3 = 150
        expect(difficulty).toBe(150);
      });

      it('should round results to nearest integer', () => {
        const difficulty = getRepairDifficulty(-33, 50);
        // Formula: 50 * (1 + 33/50) = 50 * 1.66 = 83
        expect(difficulty).toBe(83);
      });
    });
  });

  describe('calculateDesireCap', () => {
    describe('Matching Preferences', () => {
      it('should return 100 for women preferring female NPCs', () => {
        expect(calculateDesireCap('women', 'female')).toBe(100);
      });

      it('should return 100 for men preferring male NPCs', () => {
        expect(calculateDesireCap('men', 'male')).toBe(100);
      });

      it('should return 100 for everyone preference with any gender', () => {
        expect(calculateDesireCap('everyone', 'female')).toBe(100);
        expect(calculateDesireCap('everyone', 'male')).toBe(100);
        expect(calculateDesireCap('everyone', 'other')).toBe(100);
      });
    });

    describe('Non-Matching Preferences', () => {
      it('should return 25 for women preferring male NPCs', () => {
        expect(calculateDesireCap('women', 'male')).toBe(25);
      });

      it('should return 25 for men preferring female NPCs', () => {
        expect(calculateDesireCap('men', 'female')).toBe(25);
      });

      it('should return 25 for gendered preference with "other" gender', () => {
        expect(calculateDesireCap('women', 'other')).toBe(25);
        expect(calculateDesireCap('men', 'other')).toBe(25);
      });
    });

    describe('No Romantic Interest', () => {
      it('should return 0 for no_one preference with any gender', () => {
        expect(calculateDesireCap('no_one', 'female')).toBe(0);
        expect(calculateDesireCap('no_one', 'male')).toBe(0);
        expect(calculateDesireCap('no_one', 'other')).toBe(0);
      });
    });

    describe('Comprehensive Preference Matrix', () => {
      it('should handle all preference-gender combinations correctly', () => {
        // Women preference
        expect(calculateDesireCap('women', 'female')).toBe(100);
        expect(calculateDesireCap('women', 'male')).toBe(25);
        expect(calculateDesireCap('women', 'other')).toBe(25);

        // Men preference
        expect(calculateDesireCap('men', 'female')).toBe(25);
        expect(calculateDesireCap('men', 'male')).toBe(100);
        expect(calculateDesireCap('men', 'other')).toBe(25);

        // Everyone preference
        expect(calculateDesireCap('everyone', 'female')).toBe(100);
        expect(calculateDesireCap('everyone', 'male')).toBe(100);
        expect(calculateDesireCap('everyone', 'other')).toBe(100);

        // No one preference
        expect(calculateDesireCap('no_one', 'female')).toBe(0);
        expect(calculateDesireCap('no_one', 'male')).toBe(0);
        expect(calculateDesireCap('no_one', 'other')).toBe(0);
      });
    });
  });
});
