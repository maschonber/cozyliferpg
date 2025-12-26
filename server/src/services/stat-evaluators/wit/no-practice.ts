import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const PENALTY = -0.5;

export class NoPracticeEvaluator implements PatternEvaluator {
  readonly id = 'wit_no_practice';
  readonly stat = 'wit' as const;
  readonly name = 'No Practice Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const socialToday = snapshot.today.byType.get('social') || [];
    return socialToday.length === 0 ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Wit)',
      description: 'Wit needs practice',
      value,
      details: 'No social interaction today',
    };
  }
}
