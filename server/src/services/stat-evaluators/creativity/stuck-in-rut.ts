import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const PENALTY = -2.0;

export class StuckInRutEvaluator implements PatternEvaluator {
  readonly id = 'creativity_stuck_in_rut';
  readonly stat = 'creativity' as const;
  readonly name = 'Stuck in Rut Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    // Get leisure activities for last 3 days (day-2, day-1, today)
    const day1Leisure = snapshot.today.byType.get('leisure') || [];
    const day2Leisure = snapshot.last3Days.activities.filter(a =>
      a.dayNumber === snapshot.currentDay - 1 && a.type === 'leisure'
    );
    const day3Leisure = snapshot.last3Days.activities.filter(a =>
      a.dayNumber === snapshot.currentDay - 2 && a.type === 'leisure'
    );

    if (day1Leisure.length === 0 || day2Leisure.length === 0 || day3Leisure.length === 0) {
      return 0;
    }

    const day1Ids = new Set(day1Leisure.map(a => a.activityId));
    const day2Ids = new Set(day2Leisure.map(a => a.activityId));
    const day3Ids = new Set(day3Leisure.map(a => a.activityId));

    // Check if any activity appears in all 3 days
    const repeatedAll3Days = Array.from(day1Ids).filter(id =>
      day2Ids.has(id) && day3Ids.has(id)
    );

    return repeatedAll3Days.length > 0 ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Creativity)',
      description: 'Stuck in rut',
      value,
      details: 'Same activity 3 days in a row',
    };
  }
}
