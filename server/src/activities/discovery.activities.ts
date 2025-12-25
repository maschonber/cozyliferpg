import { DiscoveryActivity } from '../../../shared/types/activity.types';
import { createDiscoveryActivity } from './factories';

export const DISCOVERY_ACTIVITIES: DiscoveryActivity[] = [
  createDiscoveryActivity({
    id: 'meet_someone',
    name: 'Meet Someone New',
    description: 'Explore the neighborhood and meet a new person',
    timeCost: 45,
    energyCost: -20,
    moneyCost: 0,
    difficulty: 50,
    relevantStats: ['confidence'],
    outcomeProfile: {
      mainStats: ['confidence'],
      mainStatGain: 2.5,
      secondaryStats: ['wit', 'poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence', 'poise'],
        statPenalty: 1,
        energyCost: 10,
        timeCost: 20
      }
    }
  })
];
