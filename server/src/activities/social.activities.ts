import { SocialActivity } from '../../../shared/types/activity.types';
import { createSocialActivity } from './factories';

export const SOCIAL_ACTIVITIES: SocialActivity[] = [
  createSocialActivity({
    id: 'have_coffee',
    name: 'Have Coffee Together',
    description: 'Grab a casual coffee and catch up',
    location: 'coffee_shop',
    timeCost: 60,
    energyCost: -8,
    moneyCost: -5,
    relationshipEffects: { affection: 10 },
    difficulty: 10,
    relevantStats: ['confidence'],
    outcomeProfile: {
      mainStats: ['confidence'],
      mainStatGain: 0.5,
      secondaryStats: ['wit', 'poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 0.5,
        moneyCost: 5
      }
    }
  }),

  createSocialActivity({
    id: 'quick_chat',
    name: 'Quick Chat',
    description: 'Have a brief conversation',
    timeCost: 30,
    energyCost: -5,
    moneyCost: 0,
    relationshipEffects: { affection: 5 },
    difficulty: 5,
    relevantStats: ['confidence'],
    outcomeProfile: {
      mainStats: ['confidence'],
      mainStatGain: 0.3,
      secondaryStats: ['wit'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 0.3
      }
    }
  }),

  createSocialActivity({
    id: 'casual_date',
    name: 'Go on Casual Date',
    description: 'Go out for dinner or drinks together',
    location: 'bar',
    timeCost: 120,
    energyCost: -10,
    moneyCost: -30,
    allowedTimeSlots: ['evening', 'night'],
    relationshipEffects: { desire: 15 },
    difficulty: 25,
    relevantStats: ['confidence', 'wit'],
    outcomeProfile: {
      mainStats: ['confidence'],
      mainStatGain: 1,
      secondaryStats: ['wit', 'poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 1,
        moneyCost: 15
      }
    }
  }),

  createSocialActivity({
    id: 'deep_conversation',
    name: 'Have Deep Conversation',
    description: 'Share meaningful thoughts and feelings',
    timeCost: 90,
    energyCost: -12,
    moneyCost: 0,
    minRelationship: 'friend',
    relationshipEffects: { affection: 20, trust: 10 },
    difficulty: 50,
    relevantStats: ['wit', 'knowledge'],
    statRequirements: { empathy: 25 },
    outcomeProfile: {
      mainStats: ['wit'],
      mainStatGain: 1.5,
      secondaryStats: ['knowledge', 'poise'],
      secondaryStatGain: 1,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 1,
        energyCost: 10
      }
    }
  }),

  createSocialActivity({
    id: 'go_to_movies',
    name: 'Go to Movies',
    description: 'Watch a film together at the cinema',
    location: 'movie_theater',
    timeCost: 150,
    energyCost: -8,
    moneyCost: -20,
    allowedTimeSlots: ['evening', 'night'],
    relationshipEffects: { affection: 10, desire: 5 },
    difficulty: 5,
    relevantStats: [],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 0.5,
      secondaryStats: [],
      negativeEffects: {
        moneyCost: 10
      }
    }
  }),

  createSocialActivity({
    id: 'exercise_together',
    name: 'Exercise Together',
    description: 'Work out or play sports together',
    location: 'gym',
    timeCost: 90,
    energyCost: -15,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    relationshipEffects: { affection: 10, trust: 5 },
    difficulty: 25,
    relevantStats: ['fitness'],
    outcomeProfile: {
      mainStats: ['fitness'],
      mainStatGain: 1.5,
      secondaryStats: ['poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 0.5,
        energyCost: 10
      }
    }
  }),

  createSocialActivity({
    id: 'cook_dinner',
    name: 'Cook Dinner Together',
    description: 'Prepare and share a homemade meal',
    location: 'home',
    timeCost: 120,
    energyCost: -10,
    moneyCost: -15,
    allowedTimeSlots: ['evening', 'night'],
    relationshipEffects: { affection: 12, desire: 8 },
    difficulty: 30,
    relevantStats: ['creativity'],
    outcomeProfile: {
      mainStats: ['creativity'],
      mainStatGain: 1.5,
      secondaryStats: ['poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 1,
        moneyCost: 10,
        timeCost: 30
      }
    }
  }),

  createSocialActivity({
    id: 'flirt_playfully',
    name: 'Flirt Playfully',
    description: 'Engage in some lighthearted flirting',
    timeCost: 45,
    energyCost: -8,
    moneyCost: 0,
    relationshipEffects: { desire: 12 },
    difficulty: 30,
    relevantStats: ['confidence', 'wit'],
    outcomeProfile: {
      mainStats: ['wit'],
      mainStatGain: 1.5,
      secondaryStats: ['confidence', 'poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 1.5,
        energyCost: 8
      }
    }
  }),

  createSocialActivity({
    id: 'beach_picnic',
    name: 'Beach Picnic',
    description: 'Share food and relaxation by the ocean',
    location: 'beach',
    timeCost: 90,
    energyCost: -10,
    moneyCost: -15,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    relationshipEffects: { affection: 15, desire: 8 },
    difficulty: 15,
    relevantStats: ['poise', 'confidence'],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 0.8,
      secondaryStats: ['confidence', 'wit'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        stats: ['confidence', 'poise'],
        statPenalty: 0.5,
        moneyCost: 5,
        timeCost: 15
      }
    }
  }),

  createSocialActivity({
    id: 'play_pool_darts',
    name: 'Play Pool/Darts',
    description: 'Friendly competition over bar games',
    location: 'bar',
    timeCost: 60,
    energyCost: -8,
    moneyCost: -10,
    allowedTimeSlots: ['evening', 'night'],
    relationshipEffects: { affection: 10, trust: 5 },
    difficulty: 20,
    relevantStats: ['poise', 'confidence'],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 1,
      secondaryStats: ['confidence', 'wit'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence', 'poise'],
        statPenalty: 0.5,
        moneyCost: 5,
        energyCost: 5
      }
    }
  }),

  createSocialActivity({
    id: 'boardwalk_stroll',
    name: 'Boardwalk Stroll',
    description: 'Take a romantic walk along the pier',
    location: 'boardwalk',
    timeCost: 75,
    energyCost: -5,
    moneyCost: -5,
    allowedTimeSlots: ['evening', 'night'],
    relationshipEffects: { affection: 8, desire: 10 },
    difficulty: 5,
    relevantStats: ['poise', 'confidence'],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 0.5,
      secondaryStats: ['confidence'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 0.3,
        moneyCost: 3,
        timeCost: 10
      }
    }
  })
];
