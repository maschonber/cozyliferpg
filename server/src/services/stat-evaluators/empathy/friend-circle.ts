import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const SMALL_THRESHOLD = 2;
const SMALL_VALUE = 1.0;
const LARGE_THRESHOLD = 4;
const LARGE_VALUE = 1.5;

export class FriendCircleEvaluator implements PatternEvaluator {
  readonly id = 'empathy_friend_circle';
  readonly stat = 'empathy' as const;
  readonly name = 'Friend Circle';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const friendCount = snapshot.social.friends.length;

    if (friendCount >= LARGE_THRESHOLD) {
      return SMALL_VALUE + LARGE_VALUE;  // Both bonuses
    }
    if (friendCount >= SMALL_THRESHOLD) {
      return SMALL_VALUE;
    }
    return 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const friendCount = snapshot.social.friends.length;
    const isLarge = friendCount >= LARGE_THRESHOLD;

    return {
      source: this.id,
      category: 'Lifestyle (Empathy)',
      description: isLarge ? 'Have large friend circle' : 'Have multiple friends',
      value,
      details: `${friendCount} friends`,
    };
  }
}
