import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent, StatName } from '../../../../../shared/types';
import { getCurrentStat } from '../../stat';
import { getActivityById } from '../../../activities';

const MIN_DIFFICULTY = 20;
const COMFORT_GAP = -20;  // stat - 20
const PENALTY = -1.5;

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

export class CoastingEvaluator implements PatternEvaluator {
  readonly id = 'ambition_coasting';
  readonly stat = 'ambition' as const;
  readonly name = 'Coasting Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    if (snapshot.today.activities.length === 0) return 0;

    const highestStatValue = getHighestRelevantStatValue(snapshot);
    if (highestStatValue === -1) return 0;

    const easyThreshold = Math.max(MIN_DIFFICULTY, highestStatValue + COMFORT_GAP);

    // Check if ALL activities were too easy
    const allEasy = snapshot.today.activities.every(a => {
      const activityDef = getActivityById(a.activityId);
      if (!activityDef || !('difficulty' in activityDef)) return true;
      return !activityDef.difficulty || activityDef.difficulty < easyThreshold;
    });

    return allEasy ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const highestStatValue = getHighestRelevantStatValue(snapshot);
    const easyThreshold = Math.max(MIN_DIFFICULTY, highestStatValue + COMFORT_GAP);

    return {
      source: this.id,
      category: 'Lifestyle (Ambition)',
      description: 'All activities were too easy',
      value,
      details: `Threshold: ${easyThreshold}`,
    };
  }
}
