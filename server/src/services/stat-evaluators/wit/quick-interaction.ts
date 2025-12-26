import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const QUICK_THRESHOLD = 60;  // Minutes
const BONUS = 1.0;

export class QuickInteractionEvaluator implements PatternEvaluator {
  readonly id = 'wit_quick_interaction';
  readonly stat = 'wit' as const;
  readonly name = 'Quick Interaction';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const socialActivities = snapshot.today.byType.get('social') || [];
    const hadQuick = socialActivities.some(a => a.timeCost < QUICK_THRESHOLD);

    return hadQuick ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Wit)',
      description: 'Quick thinking practiced',
      value,
      details: 'Quick interaction today',
    };
  }
}
