import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const BASE_PENALTY = -2.5;
const STREAK_MULTIPLIER = 0.2;

export class BurnoutEvaluator implements PatternEvaluator {
  readonly id = 'vitality_burnout';
  readonly stat = 'vitality' as const;
  readonly name = 'Burnout Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    if (!snapshot.energy.hitZero) return 0;

    const streakFactor = 1 + (snapshot.sleep.burnoutStreak - 1) * STREAK_MULTIPLIER;
    return BASE_PENALTY * streakFactor;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const streak = snapshot.sleep.burnoutStreak;
    return {
      source: this.id,
      category: 'Lifestyle (Vitality)',
      description: 'Hit zero energy',
      value,
      details: streak > 1 ? `Burnout streak: ${streak} days` : undefined,
    };
  }
}
