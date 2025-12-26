import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';
import { getActivityById } from '../../../activities';
import { getStatCategory } from '../../stats/definitions';

const VALUES = { low: 0.5, medium: 1.0, high: 1.5 };
const THRESHOLDS = { min: 2, medium: 3, high: 4 };

export class PhysicalVarietyEvaluator implements PatternEvaluator {
  readonly id = 'poise_physical_variety';
  readonly stat = 'poise' as const;
  readonly name = 'Physical Variety';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    // Get physical activities from last 3 days
    const physicalActivities = snapshot.last3Days.activities.filter(a => {
      const activityDef = getActivityById(a.activityId);
      if (!activityDef || !('relevantStats' in activityDef) || !activityDef.relevantStats) return false;
      return activityDef.relevantStats.some(stat => getStatCategory(stat) === 'physical');
    });

    const uniqueActivities = new Set(physicalActivities.map(a => a.activityId)).size;

    if (uniqueActivities >= THRESHOLDS.high) return VALUES.high;
    if (uniqueActivities >= THRESHOLDS.medium) return VALUES.medium;
    if (uniqueActivities >= THRESHOLDS.min) return VALUES.low;
    return 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const physicalActivities = snapshot.last3Days.activities.filter(a => {
      const activityDef = getActivityById(a.activityId);
      if (!activityDef || !('relevantStats' in activityDef) || !activityDef.relevantStats) return false;
      return activityDef.relevantStats.some(stat => getStatCategory(stat) === 'physical');
    });
    const uniqueCount = new Set(physicalActivities.map(a => a.activityId)).size;

    return {
      source: this.id,
      category: 'Lifestyle (Poise)',
      description: 'Physical activity variety',
      value,
      details: `${uniqueCount} different physical activities in last 3 days`,
    };
  }
}
