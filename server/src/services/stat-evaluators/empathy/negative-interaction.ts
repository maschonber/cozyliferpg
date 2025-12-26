import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const PENALTY = -2.5;

export class NegativeInteractionEvaluator implements PatternEvaluator {
  readonly id = 'empathy_negative_interaction';
  readonly stat = 'empathy' as const;
  readonly name = 'Negative Interaction Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const socialActivities = snapshot.today.byType.get('social') || [];

    // Check if any social activity had negative stat effects
    const hadNegative = socialActivities.some(a => {
      if (!a.statEffects) return false;
      return (a.statEffects.empathy !== undefined && a.statEffects.empathy < 0) ||
             (a.statEffects.confidence !== undefined && a.statEffects.confidence < 0);
    });

    return hadNegative ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Empathy)',
      description: 'Was dismissive or rude',
      value,
      details: 'Had negative social interaction',
    };
  }
}
