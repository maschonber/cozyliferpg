import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const THRESHOLD = 5;
const BONUS = 1.0;

export class SocialDiversityEvaluator implements PatternEvaluator {
  readonly id = 'empathy_social_diversity';
  readonly stat = 'empathy' as const;
  readonly name = 'Social Diversity';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    return snapshot.social.uniqueNpcsLast7Days >= THRESHOLD ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Empathy)',
      description: 'Diverse social interactions',
      value,
      details: `Interacted with ${snapshot.social.uniqueNpcsLast7Days} different NPCs this week`,
    };
  }
}
