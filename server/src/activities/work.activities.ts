import { WorkActivity } from '../../../shared/types/activity.types';
import { createWorkActivity } from './factories';

export const WORK_ACTIVITIES: WorkActivity[] = [
  createWorkActivity({
    id: 'work_part_time',
    name: 'Work Part-Time Job',
    description: 'Work a 4-hour shift at your part-time job',
    location: 'shopping_district',
    timeCost: 240,
    energyCost: -30,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon'],
    difficulty: 30,
    relevantStats: ['ambition'],
    outcomeProfile: {
      mainStats: [],
      mainStatGain: 0,
      mainMoneyGain: 80,
      secondaryStats: ['confidence', 'poise', 'wit'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence', 'ambition'],
        statPenalty: 1,
        energyCost: 10,
        timeCost: 30
      }
    }
  }),

  createWorkActivity({
    id: 'work_full_day',
    name: 'Work Full Day',
    description: 'Work a full 8-hour shift for maximum pay',
    location: 'shopping_district',
    timeCost: 480,
    energyCost: -50,
    moneyCost: 0,
    allowedTimeSlots: ['morning'],
    difficulty: 40,
    relevantStats: ['ambition', 'vitality'],
    statRequirements: { ambition: 20 },
    outcomeProfile: {
      mainStats: [],
      mainStatGain: 0,
      mainMoneyGain: 150,
      secondaryStats: ['ambition', 'vitality', 'confidence'],
      secondaryStatGain: 1,
      negativeEffects: {
        stats: ['confidence', 'ambition'],
        statPenalty: 1.5,
        energyCost: 15,
        timeCost: 60
      }
    }
  }),

  createWorkActivity({
    id: 'work_barista',
    name: 'Work as Barista',
    description: 'Serve coffee and pastries at the cafe',
    location: 'coffee_shop',
    timeCost: 240,
    energyCost: -35,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon'],
    difficulty: 35,
    relevantStats: ['confidence'],
    outcomeProfile: {
      mainStats: [],
      mainStatGain: 0,
      mainMoneyGain: 70,
      secondaryStats: ['confidence', 'wit', 'poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence', 'poise'],
        statPenalty: 1,
        energyCost: 10,
        moneyCost: 5,
        timeCost: 30
      }
    }
  })
];
