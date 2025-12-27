import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';
import { getActivityById } from '../../../activities';

const MIN_DURATION = 60;  // Minutes
const BONUS = 1.5;

export class MeaningfulConversationEvaluator implements PatternEvaluator {
  readonly id = 'empathy_meaningful_conversation';
  readonly stat = 'empathy' as const;
  readonly name = 'Meaningful Conversation';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const socialActivities = snapshot.today.byType.get('social') || [];
    const hadMeaningful = socialActivities.some(a => {
      const activityDef = getActivityById(a.activityId);
      return activityDef && activityDef.timeCost >= MIN_DURATION;
    });
    return hadMeaningful ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Empathy)',
      description: 'Had meaningful conversation',
      value,
      details: `Social activity ≥${MIN_DURATION} minutes`,
    };
  }
}
