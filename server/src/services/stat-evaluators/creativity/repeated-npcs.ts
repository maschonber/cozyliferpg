import { PatternEvaluator } from '../types';
import { PlayerPatternSnapshot } from '../../player-patterns/types';
import { StatChangeComponent } from '../../../../../shared/types';

const VALUE_PER_NPC = -1.0;

export class RepeatedNpcsEvaluator implements PatternEvaluator {
  readonly id = 'creativity_repeated_npcs';
  readonly stat = 'creativity' as const;
  readonly name = 'Repeated NPCs Penalty';

  evaluate(snapshot: PlayerPatternSnapshot): number {
    // Get NPCs from each of last 3 days
    const day1Npcs = snapshot.today.uniqueNpcIds;
    const day2Npcs = new Set(
      snapshot.last3Days.activities
        .filter(a => a.dayNumber === snapshot.currentDay - 1 && a.npcId)
        .map(a => a.npcId!)
    );
    const day3Npcs = new Set(
      snapshot.last3Days.activities
        .filter(a => a.dayNumber === snapshot.currentDay - 2 && a.npcId)
        .map(a => a.npcId!)
    );

    if (day1Npcs.size === 0 || day2Npcs.size === 0 || day3Npcs.size === 0) {
      return 0;
    }

    // Find NPCs that appear in all 3 days
    const repeatedNpcs = Array.from(day1Npcs).filter(id =>
      day2Npcs.has(id) && day3Npcs.has(id)
    );

    return repeatedNpcs.length > 0 ? VALUE_PER_NPC * repeatedNpcs.length : 0;
  }

  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent {
    const day1Npcs = snapshot.today.uniqueNpcIds;
    const day2Npcs = new Set(
      snapshot.last3Days.activities
        .filter(a => a.dayNumber === snapshot.currentDay - 1 && a.npcId)
        .map(a => a.npcId!)
    );
    const day3Npcs = new Set(
      snapshot.last3Days.activities
        .filter(a => a.dayNumber === snapshot.currentDay - 2 && a.npcId)
        .map(a => a.npcId!)
    );

    const repeatedNpcs = Array.from(day1Npcs).filter(id =>
      day2Npcs.has(id) && day3Npcs.has(id)
    );

    return {
      source: this.id,
      category: 'Lifestyle (Creativity)',
      description: 'Social routine',
      value,
      details: `Talked to same ${repeatedNpcs.length} ${repeatedNpcs.length === 1 ? 'person' : 'people'} all 3 days`,
    };
  }
}
