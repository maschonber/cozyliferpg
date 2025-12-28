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
    tags: ['coffee', 'calm'],
    relationshipEffects: { affection: 10 },
    difficulty: 10,
    relevantStats: ['confidence'],
    outcomeProfile: {
      mainStats: ['confidence'],
      mainStatGain: 1.2,
      secondaryStats: ['wit', 'poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 0.5,
        moneyCost: 5
      }
    },
    emotionProfile: {
      successEmotion: 'joy',
      failureEmotion: 'disgust'
    }
  }),

  createSocialActivity({
    id: 'quick_chat',
    name: 'Quick Chat',
    description: 'Have a brief conversation',
    timeCost: 30,
    energyCost: -5,
    moneyCost: 0,
    tags: ['calm'],
    relationshipEffects: { affection: 5 },
    difficulty: 5,
    relevantStats: ['confidence'],
    outcomeProfile: {
      mainStats: ['confidence'],
      mainStatGain: 0.8,
      secondaryStats: ['wit'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 0.3
      }
    },
    emotionProfile: {
      successEmotion: 'joy',
      failureEmotion: 'sadness'
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
    tags: ['romantic'],
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
    },
    emotionProfile: {
      successEmotion: 'anticipation',
      failureEmotion: 'fear'
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
    tags: ['intellectual', 'calm'],
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
    },
    emotionProfile: {
      successEmotion: 'acceptance',
      failureEmotion: 'sadness'
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
    tags: ['romantic'],
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
    },
    emotionProfile: {
      successEmotion: 'surprise',
      failureEmotion: 'disgust'
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
    tags: ['physical'],
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
    },
    emotionProfile: {
      successEmotion: 'joy',
      failureEmotion: 'anger'
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
    tags: ['food', 'romantic', 'creative'],
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
    },
    emotionProfile: {
      successEmotion: 'anticipation',
      failureEmotion: 'surprise'
    }
  }),

  createSocialActivity({
    id: 'flirt_playfully',
    name: 'Flirt Playfully',
    description: 'Engage in some lighthearted flirting',
    timeCost: 45,
    energyCost: -8,
    moneyCost: 0,
    tags: ['romantic'],
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
    },
    emotionProfile: {
      successEmotion: 'joy',
      failureEmotion: 'disgust'
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
    tags: ['outdoor', 'food', 'romantic'],
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
    },
    emotionProfile: {
      successEmotion: 'acceptance',
      failureEmotion: 'sadness'
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
    tags: ['competitive', 'gaming'],
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
    },
    emotionProfile: {
      successEmotion: 'joy',
      failureEmotion: 'anger'
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
    tags: ['outdoor', 'romantic'],
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
    },
    emotionProfile: {
      successEmotion: 'acceptance',
      failureEmotion: 'sadness'
    }
  }),

  // === General Activities (no location required) ===

  createSocialActivity({
    id: 'give_compliment',
    name: 'Give a Compliment',
    description: 'Say something genuine and kind about them',
    timeCost: 15,
    energyCost: -3,
    moneyCost: 0,
    tags: ['romantic', 'calm'],
    relationshipEffects: { affection: 8, desire: 5 },
    difficulty: 20,
    relevantStats: ['confidence', 'empathy'],
    outcomeProfile: {
      mainStats: ['confidence'],
      mainStatGain: 1.2,
      secondaryStats: ['empathy', 'wit'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 1,
        energyCost: 5
      }
    },
    emotionProfile: {
      successEmotion: 'acceptance',
      failureEmotion: 'anger'
    }
  }),

  createSocialActivity({
    id: 'tell_story',
    name: 'Tell a Story',
    description: 'Share an interesting anecdote from your life',
    timeCost: 30,
    energyCost: -6,
    moneyCost: 0,
    tags: ['creative', 'calm'],
    relationshipEffects: { affection: 8, trust: 5 },
    difficulty: 35,
    relevantStats: ['wit', 'creativity'],
    outcomeProfile: {
      mainStats: ['wit'],
      mainStatGain: 1,
      secondaryStats: ['creativity', 'confidence'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['wit', 'confidence'],
        statPenalty: 0.5,
        energyCost: 5
      }
    },
    emotionProfile: {
      successEmotion: 'surprise',
      failureEmotion: 'sadness'
    }
  }),

  createSocialActivity({
    id: 'ask_for_advice',
    name: 'Ask for Advice',
    description: 'Seek their opinion on something important to you',
    timeCost: 25,
    energyCost: -4,
    moneyCost: 0,
    tags: ['intellectual', 'calm'],
    relationshipEffects: { trust: 12, affection: 5 },
    difficulty: 15,
    relevantStats: ['empathy'],
    outcomeProfile: {
      mainStats: ['empathy'],
      mainStatGain: 0.8,
      secondaryStats: ['knowledge', 'wit'],
      secondaryStatGain: 0.4,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 0.5
      }
    },
    emotionProfile: {
      successEmotion: 'acceptance',
      failureEmotion: 'disgust'
    }
  }),

  // === Location-Specific Activities ===

  createSocialActivity({
    id: 'feed_ducks',
    name: 'Feed the Ducks',
    description: 'Toss breadcrumbs to the ducks at the pond - great bonding, though it leads to melancholy',
    location: 'park',
    timeCost: 45,
    energyCost: -4,
    moneyCost: -3,
    allowedTimeSlots: ['morning', 'afternoon'],
    tags: ['outdoor', 'calm'],
    relationshipEffects: { affection: 10, trust: 5 },
    difficulty: 5,
    relevantStats: ['empathy', 'vitality'],
    outcomeProfile: {
      mainStats: ['vitality'],
      mainStatGain: 0.5,
      secondaryStats: ['empathy'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        stats: ['poise'],
        statPenalty: 0.2,
        moneyCost: 2
      }
    },
    emotionProfile: {
      successEmotion: 'sadness',
      failureEmotion: 'disgust'
    }
  }),

  createSocialActivity({
    id: 'study_together',
    name: 'Study Together',
    description: 'Share quiet companionship while reading or working',
    location: 'library',
    timeCost: 90,
    energyCost: -8,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    tags: ['intellectual', 'calm'],
    relationshipEffects: { trust: 10, affection: 8 },
    difficulty: 20,
    relevantStats: ['knowledge', 'ambition'],
    outcomeProfile: {
      mainStats: ['knowledge'],
      mainStatGain: 1.5,
      secondaryStats: ['ambition', 'wit'],
      secondaryStatGain: 0.8,
      negativeEffects: {
        stats: ['ambition'],
        statPenalty: 0.5,
        energyCost: 5
      }
    },
    emotionProfile: {
      successEmotion: 'anticipation',
      failureEmotion: 'fear'
    }
  }),

  createSocialActivity({
    id: 'help_pick_outfit',
    name: 'Help Pick an Outfit',
    description: 'Give fashion advice while browsing stores together',
    location: 'shopping_district',
    timeCost: 60,
    energyCost: -8,
    moneyCost: -10,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    tags: ['creative'],
    relationshipEffects: { affection: 12, trust: 8 },
    difficulty: 25,
    relevantStats: ['creativity', 'empathy'],
    outcomeProfile: {
      mainStats: ['creativity'],
      mainStatGain: 1,
      secondaryStats: ['empathy', 'confidence'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 0.8,
        moneyCost: 10,
        timeCost: 20
      }
    },
    emotionProfile: {
      successEmotion: 'joy',
      failureEmotion: 'disgust'
    }
  })
];
