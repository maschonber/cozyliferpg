import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const BONUS = 1.5;

export class NoveltyEvaluator implements PatternEvaluator {
  readonly id = 'creativity_novelty';
  readonly stat = 'creativity' as const;
  readonly name = 'Novelty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const todayLeisure = snapshot.today.byType.get('leisure') || [];
    if (todayLeisure.length === 0) return 0;

    const last7DaysLeisure = snapshot.last7Days.byType.get('leisure') || [];

    // Get activities from past (not including today)
    const pastLeisure = last7DaysLeisure.filter(a => a.dayNumber < snapshot.currentDay);
    const pastIds = new Set(pastLeisure.map(a => a.activityId));

    // Check if any activity today wasn't done in the past week
    const hasNovel = todayLeisure.some(a => !pastIds.has(a.activityId));
    return hasNovel ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Creativity)',
      description: 'Seeking novelty',
      value,
      details: 'Tried activity not done recently',
    };
  }
}
