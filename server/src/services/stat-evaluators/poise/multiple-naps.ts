import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';
import { getActivityById } from '../../../activities';

const THRESHOLD = 2;
const PENALTY = -1.0;

export class MultipleNapsEvaluator implements PatternEvaluator {
  readonly id = 'poise_multiple_naps';
  readonly stat = 'poise' as const;
  readonly name = 'Multiple Naps Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const recoveryActivities = snapshot.today.byType.get('recovery') || [];
    const napCount = recoveryActivities.filter(a => {
      const activityDef = getActivityById(a.activityId);
      return activityDef?.name.toLowerCase().includes('nap');
    }).length;

    return napCount >= THRESHOLD ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const recoveryActivities = snapshot.today.byType.get('recovery') || [];
    const napCount = recoveryActivities.filter(a => {
      const activityDef = getActivityById(a.activityId);
      return activityDef?.name.toLowerCase().includes('nap');
    }).length;

    return {
      source: this.id,
      category: 'Lifestyle (Poise)',
      description: 'Excessive napping',
      value,
      details: `${napCount} naps today`,
    };
  }
}
