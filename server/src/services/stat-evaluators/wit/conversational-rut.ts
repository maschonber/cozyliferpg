import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const PENALTY = -1.5;

export class ConversationalRutEvaluator implements PatternEvaluator {
  readonly id = 'wit_conversational_rut';
  readonly stat = 'wit' as const;
  readonly name = 'Conversational Rut Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const socialActivities = snapshot.last3Days.byType.get('social') || [];
    if (socialActivities.length === 0) return 0;

    const uniquePartners = new Set(socialActivities.filter(a => a.npcId).map(a => a.npcId!));

    return uniquePartners.size === 1 ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Wit)',
      description: 'Conversational rut',
      value,
      details: 'Only talked to 1 person in last 3 days',
    };
  }
}
