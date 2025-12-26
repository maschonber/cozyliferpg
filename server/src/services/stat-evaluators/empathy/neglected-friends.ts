import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const VALUE_PER_FRIEND = -1.5;
const DAYS_THRESHOLD = 7;

export class NeglectedFriendsEvaluator implements PatternEvaluator {
  readonly id = 'empathy_neglected_friends';
  readonly stat = 'empathy' as const;
  readonly name = 'Neglected Friends Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    const neglectedCount = snapshot.social.neglectedFriends.length;
    return neglectedCount > 0 ? VALUE_PER_FRIEND * neglectedCount : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const neglectedCount = snapshot.social.neglectedFriends.length;
    return {
      source: this.id,
      category: 'Lifestyle (Empathy)',
      description: 'Neglected friends',
      value,
      details: `${neglectedCount} ${neglectedCount === 1 ? 'friend' : 'friends'} not contacted in ${DAYS_THRESHOLD}+ days`,
    };
  }
}
