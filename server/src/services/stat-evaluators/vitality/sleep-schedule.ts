import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';
import { formatGameTime } from '../../time/game-time.service';

const BONUS = 1.5;

export class SleepScheduleEvaluator implements PatternEvaluator {
  readonly id = 'vitality_sleep_schedule';
  readonly stat = 'vitality' as const;
  readonly name = 'Sleep Schedule';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    return snapshot.sleep.sleptBeforeMidnight ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const bedtimeStr = formatGameTime(snapshot.bedtimeMinutes).time;
    return {
      source: this.id,
      category: 'Lifestyle (Vitality)',
      description: 'Slept before midnight',
      value,
      details: `Bedtime: ${bedtimeStr}`,
    };
  }
}
