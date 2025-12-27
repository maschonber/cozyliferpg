import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';
import { getActivityById } from '../../../activities';

const THRESHOLD = 60;  // Minutes
const BONUS = 1.0;

export class TonalAgilityEvaluator implements PatternEvaluator {
  readonly id = 'wit_tonal_agility';
  readonly stat = 'wit' as const;
  readonly name = 'Tonal Agility';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const socialActivities = snapshot.last3Days.byType.get('social') || [];

    const hasQuick = socialActivities.some(a => {
      const activityDef = getActivityById(a.activityId);
      return activityDef && activityDef.timeCost < THRESHOLD;
    });
    const hasLong = socialActivities.some(a => {
      const activityDef = getActivityById(a.activityId);
      return activityDef && activityDef.timeCost >= THRESHOLD;
    });

    return (hasQuick && hasLong) ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Wit)',
      description: 'Tonal agility',
      value,
      details: 'Mixed interaction types in last 3 days',
    };
  }
}
