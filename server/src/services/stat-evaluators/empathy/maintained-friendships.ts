import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const BONUS = 1.0;
const DAYS_THRESHOLD = 7;

export class MaintainedFriendshipsEvaluator implements PatternEvaluator {
  readonly id = 'empathy_maintained_friendships';
  readonly stat = 'empathy' as const;
  readonly name = 'Maintained Friendships';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    if (snapshot.social.friends.length === 0) return 0;

    // All friends contacted within the last 7 days
    const allMaintained = snapshot.social.friends.every(
      friend => friend.daysSinceContact !== null && friend.daysSinceContact < DAYS_THRESHOLD
    );

    return allMaintained ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Empathy)',
      description: 'Maintained all friendships',
      value,
      details: `Contacted all ${snapshot.social.friends.length} friends this week`,
    };
  }
}
