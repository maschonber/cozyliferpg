import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const BONUS = 1.5;

export class ActivityVarietyEvaluator implements PatternEvaluator {
  readonly id = 'creativity_activity_variety';
  readonly stat = 'creativity' as const;
  readonly name = 'Activity Variety';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const todayLeisure = snapshot.today.byType.get('leisure') || [];
    const yesterdayLeisure = snapshot.last3Days.activities.filter(a =>
      a.dayNumber === snapshot.currentDay - 1 &&
      a.type === 'leisure'
    );

    if (todayLeisure.length === 0) return 0;

    const todayIds = new Set(todayLeisure.map(a => a.activityId));
    const yesterdayIds = new Set(yesterdayLeisure.map(a => a.activityId));

    // Check if any activity today is different from yesterday
    const hasNew = Array.from(todayIds).some(id => !yesterdayIds.has(id));
    return hasNew ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Creativity)',
      description: 'Daily spontaneity',
      value,
      details: 'Different activities from yesterday',
    };
  }
}
