import { LeisureActivity } from '../../../shared/types/activity.types';
import { createLeisureActivity } from './factories';

export const LEISURE_ACTIVITIES: LeisureActivity[] = [
  createLeisureActivity({
    id: 'stroll_park',
    name: 'Stroll in the Park',
    description: 'Take a peaceful walk outdoors',
    location: 'park',
    timeCost: 60,
    energyCost: -3,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening']
  }),

  createLeisureActivity({
    id: 'play_video_games',
    name: 'Play Video Games',
    description: 'Unwind with some gaming',
    location: 'home',
    timeCost: 120,
    energyCost: -5,
    moneyCost: 0
  }),

  createLeisureActivity({
    id: 'watch_tv',
    name: 'Watch TV',
    description: 'Relax and watch your favorite shows',
    location: 'home',
    timeCost: 90,
    energyCost: 0,
    moneyCost: 0
  }),

  createLeisureActivity({
    id: 'listen_music',
    name: 'Listen to Music',
    description: 'Put on some tunes and chill',
    location: 'home',
    timeCost: 30,
    energyCost: 0,
    moneyCost: 0
  }),

  createLeisureActivity({
    id: 'word_games',
    name: 'Bar Trivia Night',
    description: 'Test your knowledge and wit at the local trivia competition',
    location: 'bar',
    timeCost: 90,
    energyCost: -10,
    moneyCost: -5,
    allowedTimeSlots: ['evening', 'night']
  }),

  createLeisureActivity({
    id: 'comedy_show',
    name: 'Watch Comedy Show',
    description: 'Enjoy standup comedy and sharpen your sense of humor',
    location: 'home',
    timeCost: 60,
    energyCost: 0,
    moneyCost: 0
  }),

  createLeisureActivity({
    id: 'beach_walk',
    name: 'Beach Walk',
    description: 'Take a peaceful walk along the shoreline',
    location: 'beach',
    timeCost: 45,
    energyCost: -3,
    moneyCost: 0
  }),

  createLeisureActivity({
    id: 'window_shopping',
    name: 'Window Shopping',
    description: 'Browse shops without buying anything',
    location: 'shopping_district',
    timeCost: 60,
    energyCost: -5,
    moneyCost: 0
  }),

  createLeisureActivity({
    id: 'play_arcade',
    name: 'Play Arcade Games',
    description: 'Have fun with retro arcade games',
    location: 'boardwalk',
    timeCost: 90,
    energyCost: -8,
    moneyCost: -10
  })
];
