import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const THRESHOLD = 2;
const BASE_PENALTY = -1.5;

export class RestStreakEvaluator implements PatternEvaluator {
  readonly id = 'ambition_rest_streak';
  readonly stat = 'ambition' as const;
  readonly name = 'Rest Streak Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const streak = snapshot.work.currentRestStreak;
    if (streak < THRESHOLD) return 0;

    return BASE_PENALTY * streak;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const streak = snapshot.work.currentRestStreak;
    return {
      source: this.id,
      category: 'Lifestyle (Ambition)',
      description: 'Extended rest period',
      value,
      details: `${streak} consecutive rest days`,
    };
  }
}
