import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';
import { formatGameTime } from '../../time/game-time.service';

const BASE_PENALTY = -2.5;
const STREAK_MULTIPLIER = 0.2;

export class LateNightEvaluator implements PatternEvaluator {
  readonly id = 'vitality_late_night';
  readonly stat = 'vitality' as const;
  readonly name = 'Late Night Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    if (!snapshot.sleep.sleptAfter2AM) return 0;

    const streakFactor = 1 + (snapshot.sleep.lateNightStreak - 1) * STREAK_MULTIPLIER;
    return BASE_PENALTY * streakFactor;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const streak = snapshot.sleep.lateNightStreak;
    const bedtimeStr = formatGameTime(snapshot.bedtimeMinutes).time;
    return {
      source: this.id,
      category: 'Lifestyle (Vitality)',
      description: 'Slept after 2 AM',
      value,
      details: streak > 1
        ? `Late night streak: ${streak} days`
        : `Bedtime: ${bedtimeStr}`,
    };
  }
}
