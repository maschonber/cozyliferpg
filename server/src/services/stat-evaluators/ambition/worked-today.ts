import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const BONUS = 2.0;

export class WorkedTodayEvaluator implements PatternEvaluator {
  readonly id = 'ambition_worked_today';
  readonly stat = 'ambition' as const;
  readonly name = 'Worked Today';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    return snapshot.work.workedToday ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Ambition)',
      description: 'Completed work activity',
      value,
    };
  }
}
