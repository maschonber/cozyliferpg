import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';
import { getActivityById } from '../../../activities';
import { getStatCategory } from '../../stats/definitions';

const BONUS = 1.0;

export class CrossDomainEvaluator implements PatternEvaluator {
  readonly id = 'creativity_cross_domain';
  readonly stat = 'creativity' as const;
  readonly name = 'Cross Domain';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const leisureActivities = snapshot.last7Days.byType.get('leisure') || [];

    const categories = new Set(
      leisureActivities
        .flatMap(a => {
          const activityDef = getActivityById(a.activityId);
          if (activityDef && 'relevantStats' in activityDef) {
            return activityDef.relevantStats;
          }
          return [];
        })
        .filter((stat): stat is NonNullable<typeof stat> => stat !== undefined)
        .map(stat => getStatCategory(stat))
    );

    // Need all 3 categories: physical, mental, social
    return categories.size === 3 ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Creativity)',
      description: 'Holistic exploration',
      value,
      details: 'Activities span physical, mental, and social domains',
    };
  }
}
