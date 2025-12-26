import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const BONUS = 1.0;

export class NoCatastropheEvaluator implements PatternEvaluator {
  readonly id = 'vitality_no_catastrophe';
  readonly stat = 'vitality' as const;
  readonly name = 'No Catastrophic Failures';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    return !snapshot.flags.hadCatastrophicFailureToday ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Vitality)',
      description: 'No catastrophic failures',
      value,
    };
  }
}
