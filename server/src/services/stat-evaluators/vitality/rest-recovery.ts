import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const BONUS = 2.0;

export class RestRecoveryEvaluator implements PatternEvaluator {
  readonly id = 'vitality_rest_recovery';
  readonly stat = 'vitality' as const;
  readonly name = 'Rest Recovery';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    // First rest day after work
    const isFirstRestAfterWork = snapshot.work.currentRestStreak === 1
                               && !snapshot.work.workedToday;
    return isFirstRestAfterWork ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Vitality)',
      description: 'Rest day after work',
      value,
      details: 'Good recovery pattern',
    };
  }
}
