import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const PENALTY = -1.0;

export class NoWorkEvaluator implements PatternEvaluator {
  readonly id = 'ambition_no_work';
  readonly stat = 'ambition' as const;
  readonly name = 'No Work Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    return !snapshot.work.workedToday ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Ambition)',
      description: 'No work activity today',
      value,
    };
  }
}
