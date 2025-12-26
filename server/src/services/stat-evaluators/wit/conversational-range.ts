import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const MIN_PARTNERS = 3;
const BONUS = 1.5;

export class ConversationalRangeEvaluator implements PatternEvaluator {
  readonly id = 'wit_conversational_range';
  readonly stat = 'wit' as const;
  readonly name = 'Conversational Range';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const socialActivities = snapshot.last3Days.byType.get('social') || [];
    const uniquePartners = new Set(socialActivities.filter(a => a.npcId).map(a => a.npcId!));

    return uniquePartners.size >= MIN_PARTNERS ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const socialActivities = snapshot.last3Days.byType.get('social') || [];
    const uniquePartners = new Set(socialActivities.filter(a => a.npcId).map(a => a.npcId!));

    return {
      source: this.id,
      category: 'Lifestyle (Wit)',
      description: 'Conversational range',
      value,
      details: `Interacted with ${uniquePartners.size} different people in last 3 days`,
    };
  }
}
