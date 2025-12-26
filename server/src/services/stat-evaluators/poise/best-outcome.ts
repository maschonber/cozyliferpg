import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const BONUS = 1.5;

export class BestOutcomeEvaluator implements PatternEvaluator {
  readonly id = 'poise_best_outcome';
  readonly stat = 'poise' as const;
  readonly name = 'Best Outcome';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    return snapshot.today.bestOutcomeCount > 0 ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Poise)',
      description: 'Achieved best outcome',
      value,
      details: 'Graceful execution today',
    };
  }
}
