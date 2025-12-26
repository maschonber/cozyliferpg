import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const PENALTY = -1.5;

export class NoLeisureEvaluator implements PatternEvaluator {
  readonly id = 'creativity_no_leisure';
  readonly stat = 'creativity' as const;
  readonly name = 'No Leisure Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const leisureToday = snapshot.today.byType.get('leisure') || [];
    return leisureToday.length === 0 ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Creativity)',
      description: 'No leisure',
      value,
      details: 'No leisure activities today',
    };
  }
}
