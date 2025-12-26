import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const SHORT_STREAK_THRESHOLD = 2;
const SHORT_STREAK_BONUS = 1.5;
const LONG_STREAK_THRESHOLD = 5;
const LONG_STREAK_BONUS = 2.5;

export class WorkStreakEvaluator implements PatternEvaluator {
  readonly id = 'ambition_work_streak';
  readonly stat = 'ambition' as const;
  readonly name = 'Work Streak Bonus';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const streak = snapshot.work.currentWorkStreak;

    // Long streak includes short streak bonus
    if (streak >= LONG_STREAK_THRESHOLD) {
      return SHORT_STREAK_BONUS + LONG_STREAK_BONUS;
    }
    if (streak >= SHORT_STREAK_THRESHOLD) {
      return SHORT_STREAK_BONUS;
    }
    return 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const streak = snapshot.work.currentWorkStreak;
    const isLong = streak >= LONG_STREAK_THRESHOLD;

    return {
      source: this.id,
      category: 'Lifestyle (Ambition)',
      description: isLong ? 'Long work streak' : 'Work streak',
      value,
      details: `${streak} consecutive work days`,
    };
  }
}
