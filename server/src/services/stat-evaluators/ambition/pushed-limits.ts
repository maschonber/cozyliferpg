import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent, StatName } from '../../../../../shared/types';
import { getCurrentStat } from '../../stat';
import { getActivityById } from '../../../activities';

const COMFORT_GAP = 20;  // Activity difficulty >= stat + 20
const VALUE_PER_ACTIVITY = 2.0;
const MAX_ACTIVITIES_PER_DAY = 3;

/**
 * Get the highest current stat value from all stats used in activities
 */
function getHighestRelevantStatValue(snapshot: PlayerPatternSnapshot): number {
  let highestValue = -1;

  for (const activity of snapshot.today.activities) {
    const activityDef = getActivityById(activity.activityId);
    if (!activityDef || !('relevantStats' in activityDef) || !activityDef.relevantStats) continue;

    for (const statName of activityDef.relevantStats) {
      const value = getCurrentStat(snapshot.playerStats, statName as StatName);
      if (value > highestValue) {
        highestValue = value;
      }
    }
  }

  return highestValue;
}

export class PushedLimitsEvaluator implements PatternEvaluator {
  readonly id = 'ambition_pushed_limits';
  readonly stat = 'ambition' as const;
  readonly name = 'Pushed Limits';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const highestStatValue = getHighestRelevantStatValue(snapshot);
    if (highestStatValue === -1) return 0;

    let pushedCount = 0;

    for (const activity of snapshot.today.activities) {
      const activityDef = getActivityById(activity.activityId);
      if (activityDef && 'difficulty' in activityDef && activityDef.difficulty && activityDef.difficulty >= highestStatValue + COMFORT_GAP) {
        pushedCount++;
      }
    }

    if (pushedCount === 0) return 0;

    const cappedCount = Math.min(pushedCount, MAX_ACTIVITIES_PER_DAY);
    return VALUE_PER_ACTIVITY * cappedCount;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const highestStatValue = getHighestRelevantStatValue(snapshot);
    let pushedCount = 0;

    for (const activity of snapshot.today.activities) {
      const activityDef = getActivityById(activity.activityId);
      if (activityDef && 'difficulty' in activityDef && activityDef.difficulty && activityDef.difficulty >= highestStatValue + COMFORT_GAP) {
        pushedCount++;
      }
    }

    const cappedCount = Math.min(pushedCount, MAX_ACTIVITIES_PER_DAY);

    return {
      source: this.id,
      category: 'Lifestyle (Ambition)',
      description: 'Pushed beyond comfort level',
      value,
      details: pushedCount > MAX_ACTIVITIES_PER_DAY
        ? `${cappedCount} challenging ${cappedCount === 1 ? 'activity' : 'activities'} (capped from ${pushedCount})`
        : `${cappedCount} challenging ${cappedCount === 1 ? 'activity' : 'activities'}`,
    };
  }
}
