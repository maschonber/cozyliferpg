/**
 * Training Activities Tests
 * Tests for self-improvement and training activities
 */

import { TRAINING_ACTIVITIES } from './training.activities';
import { getActivityById } from './index';

describe('Training Activities', () => {
  it('should have 11 self-improvement activities', () => {
    expect(TRAINING_ACTIVITIES).toHaveLength(11);  // Added 5 mixed stat training activities
  });

  it('should have zero or negative energy costs (effort required or restorative)', () => {
    TRAINING_ACTIVITIES.forEach(activity => {
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
