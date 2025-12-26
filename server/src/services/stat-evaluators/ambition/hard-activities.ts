import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';
import { getActivityById } from '../../../activities';

const DIFFICULTY_THRESHOLD = 50;
const VALUE_PER_ACTIVITY = 1.0;
const MAX_ACTIVITIES_PER_DAY = 3;

export class HardActivitiesEvaluator implements PatternEvaluator {
  readonly id = 'ambition_hard_activities';
  readonly stat = 'ambition' as const;
  readonly name = 'Hard Activities';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    let hardCount = 0;

    for (const activity of snapshot.today.activities) {
      const activityDef = getActivityById(activity.activityId);
      if (activityDef && 'difficulty' in activityDef && activityDef.difficulty && activityDef.difficulty >= DIFFICULTY_THRESHOLD) {
        hardCount++;
      }
    }

    if (hardCount === 0) return 0;

    const cappedCount = Math.min(hardCount, MAX_ACTIVITIES_PER_DAY);
    return VALUE_PER_ACTIVITY * cappedCount;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    let hardCount = 0;

    for (const activity of snapshot.today.activities) {
      const activityDef = getActivityById(activity.activityId);
      if (activityDef && 'difficulty' in activityDef && activityDef.difficulty && activityDef.difficulty >= DIFFICULTY_THRESHOLD) {
        hardCount++;
      }
    }

    const cappedCount = Math.min(hardCount, MAX_ACTIVITIES_PER_DAY);

    return {
      source: this.id,
      category: 'Lifestyle (Ambition)',
      description: 'Attempted hard activities',
      value,
      details: hardCount > MAX_ACTIVITIES_PER_DAY
        ? `${cappedCount} ${cappedCount === 1 ? 'activity' : 'activities'} with difficulty ≥${DIFFICULTY_THRESHOLD} (capped from ${hardCount})`
        : `${cappedCount} ${cappedCount === 1 ? 'activity' : 'activities'} with difficulty ≥${DIFFICULTY_THRESHOLD}`,
    };
  }
}
