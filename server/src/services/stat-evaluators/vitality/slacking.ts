import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const THRESHOLD = 3;
const BASE_PENALTY = -1.5;

export class SlackingEvaluator implements PatternEvaluator {
  readonly id = 'vitality_slacking';
  readonly stat = 'vitality' as const;
  readonly name = 'Slacking Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const streak = snapshot.work.currentRestStreak;
    if (streak < THRESHOLD) return 0;

    return BASE_PENALTY * (streak - 2);
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const streak = snapshot.work.currentRestStreak;
    return {
      source: this.id,
      category: 'Lifestyle (Vitality)',
      description: 'Too many consecutive rest days',
      value,
      details: `Rest streak: ${streak} days`,
    };
  }
}
