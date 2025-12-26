import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const MIN_BALANCE = 20;
const MAX_BALANCE = 50;
const BONUS = 1.5;

export class EnergyBalanceEvaluator implements PatternEvaluator {
  readonly id = 'vitality_energy_balance';
  readonly stat = 'vitality' as const;
  readonly name = 'Energy Balance';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const ending = snapshot.energy.endingToday;
    return (ending >= MIN_BALANCE && ending <= MAX_BALANCE) ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Vitality)',
      description: 'Balanced energy usage',
      value,
      details: `Ending energy: ${snapshot.energy.endingToday} (optimal: ${MIN_BALANCE}-${MAX_BALANCE})`,
    };
  }
}
