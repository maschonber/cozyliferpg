import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';
import { getStatCategory } from '../../stats/definitions';
import { getActivityById } from '../../../activities';

const PENALTY = -2.0;

export class SedentaryEvaluator implements PatternEvaluator {
  readonly id = 'poise_sedentary';
  readonly stat = 'poise' as const;
  readonly name = 'Sedentary Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    if (snapshot.last3Days.activities.length === 0) return 0;

    // Check if there are NO physical activities in last 3 days
    const hasPhysical = snapshot.last3Days.activities.some(a => {
      const activityDef = getActivityById(a.activityId);
      if (!activityDef || !('relevantStats' in activityDef) || !activityDef.relevantStats) return false;
      return activityDef.relevantStats.some(stat => getStatCategory(stat) === 'physical');
    });

    return !hasPhysical ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Poise)',
      description: 'Body stagnation',
      value,
      details: 'No physical activities in last 3 days',
    };
  }
}
