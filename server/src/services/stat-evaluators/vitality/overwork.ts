import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const THRESHOLD = 3;
const BASE_PENALTY = -1.5;

export class OverworkEvaluator implements PatternEvaluator {
  readonly id = 'vitality_overwork';
  readonly stat = 'vitality' as const;
  readonly name = 'Overwork Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const streak = snapshot.work.currentWorkStreak;
    if (streak < THRESHOLD) return 0;

    return BASE_PENALTY * (streak - 2);
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const streak = snapshot.work.currentWorkStreak;
    return {
      source: this.id,
      category: 'Lifestyle (Vitality)',
      description: 'Too many consecutive work days',
      value,
      details: `Work streak: ${streak} days`,
    };
  }
}
