import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';
import { getActivityById } from '../../../activities';

const THRESHOLD = 60;  // Minutes
const PENALTY = -1.0;

export class NoQuickThinkingEvaluator implements PatternEvaluator {
  readonly id = 'wit_no_quick_thinking';
  readonly stat = 'wit' as const;
  readonly name = 'No Quick Thinking Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const socialActivities = snapshot.last7Days.byType.get('social') || [];
    if (socialActivities.length === 0) return 0;

    // Check if ALL interactions were long (none were quick)
    const allLong = socialActivities.every(a => {
      const activityDef = getActivityById(a.activityId);
      return activityDef && activityDef.timeCost >= THRESHOLD;
    });

    return allLong ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Wit)',
      description: 'Lost quick-thinking edge',
      value,
      details: 'Only deep conversations, no quick interactions in last 7 days',
    };
  }
}
