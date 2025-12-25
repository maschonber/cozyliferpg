import { RecoveryActivity } from '../../../shared/types/activity.types';
import { createRecoveryActivity } from './factories';

export const RECOVERY_ACTIVITIES: RecoveryActivity[] = [
  createRecoveryActivity({
    id: 'take_nap',
    name: 'Take a Nap',
    description: 'Get some quick rest to recharge',
    location: 'home',
    timeCost: 60,
    energyCost: 5,
    moneyCost: 0,
    tags: ['recovery']
  }),

  createRecoveryActivity({
    id: 'go_to_sleep',
    name: 'Go to Sleep',
    description: 'Go to bed and end the day',
    timeCost: 0,
    energyCost: 0,
    moneyCost: 0,
    allowedTimeSlots: ['evening', 'night'],
    tags: ['recovery']
  })
];
