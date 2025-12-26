import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const BONUS = 0.5;

export class SocialGraceEvaluator implements PatternEvaluator {
  readonly id = 'poise_social_grace';
  readonly stat = 'poise' as const;
  readonly name = 'Social Grace';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const socialActivities = snapshot.last7Days.byType.get('social') || [];
    const hadBestSocial = socialActivities.some(a => a.outcomeTier === 'best');
    return hadBestSocial ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Poise)',
      description: 'Social grace demonstrated',
      value,
      details: 'Best outcome in social activity in last 7 days',
    };
  }
}
