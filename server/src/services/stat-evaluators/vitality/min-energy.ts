import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const THRESHOLD = 30;
const BONUS = 2.5;

export class MinEnergyEvaluator implements PatternEvaluator {
  readonly id = 'vitality_min_energy';
  readonly stat = 'vitality' as const;
  readonly name = 'Minimum Energy Maintained';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    return snapshot.energy.minToday >= THRESHOLD ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Vitality)',
      description: `Maintained energy above ${THRESHOLD}`,
      value,
      details: `Min energy: ${snapshot.energy.minToday}`,
    };
  }
}
