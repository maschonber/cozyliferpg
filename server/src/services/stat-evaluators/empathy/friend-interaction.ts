import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const BONUS = 2.5;

export class FriendInteractionEvaluator implements PatternEvaluator {
  readonly id = 'empathy_friend_interaction';
  readonly stat = 'empathy' as const;
  readonly name = 'Friend Interaction';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    // Check if any NPC contacted today is a friend
    const contactedFriend = snapshot.social.friends.some(
      friend => snapshot.social.npcsContactedToday.has(friend.npcId)
    );

    return contactedFriend ? BONUS : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Empathy)',
      description: 'Spent time with friend',
      value,
    };
  }
}
