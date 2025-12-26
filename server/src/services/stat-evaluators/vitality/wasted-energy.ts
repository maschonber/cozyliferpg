import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const THRESHOLD = 50;
const PENALTY = -1.5;
const OPTIMAL_MIN = 20;
const OPTIMAL_MAX = 50;

export class WastedEnergyEvaluator implements PatternEvaluator {
  readonly id = 'vitality_wasted_energy';
  readonly stat = 'vitality' as const;
  readonly name = 'Wasted Energy';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    return snapshot.energy.endingToday > THRESHOLD ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Vitality)',
      description: 'Ended day with excess energy',
      value,
      details: `Energy: ${snapshot.energy.endingToday} (optimal: ${OPTIMAL_MIN}-${OPTIMAL_MAX})`,
    };
  }
}
