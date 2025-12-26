import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const PENALTY = -2.0;

export class ShallowRomanceEvaluator implements PatternEvaluator {
  readonly id = 'empathy_shallow_romance';
  readonly stat = 'empathy' as const;
  readonly name = 'Shallow Romance Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    // Only applies if player interacted with someone today
    if (snapshot.social.npcsContactedToday.size === 0) return 0;

    // Check if ALL interactions today were with shallow romance (crushes/lovers)
    const onlyShallowToday = Array.from(snapshot.social.npcsContactedToday).every(npcId =>
      snapshot.social.romanticOnly.some(r => r.npcId === npcId)
    );

    // Only penalize if there are romantic relationships AND only interacted with them
    return (onlyShallowToday && snapshot.social.romanticOnly.length > 0) ? PENALTY : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    return {
      source: this.id,
      category: 'Lifestyle (Empathy)',
      description: 'Only interacted with crushes/lovers',
      value,
      details: 'No meaningful friend interactions today',
    };
  }
}
