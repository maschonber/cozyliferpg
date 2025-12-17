/**
 * Activity Definitions
 *
 * All activity data for the game, organized by category.
 * This file contains ONLY data - no business logic.
 *
 * Design: Configuration-driven game content
 * - Easy to find and modify specific activities
 * - Game designers can update without touching logic
 * - Clear separation between data and behavior
 */

import { Activity } from '../../../../shared/types';

/**
 * All activities available in the game
 * Organized by category for easier navigation
 */
export const ACTIVITIES: Activity[] = [
  // ===== WORK ACTIVITIES =====
  // Solo activities where money is the primary reward

  {
    id: 'work_part_time',
    name: 'Work Part-Time Job',
    description: 'Work a 4-hour shift at your part-time job',
    category: 'work',
    requiresNPC: false,
    location: 'shopping_district',
    timeCost: 240,
    energyCost: -30,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon'],
    effects: {},
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
    },
    tags: ['work']
  },

  {
    id: 'work_full_day',
    name: 'Work Full Day',
    description: 'Work a full 8-hour shift for maximum pay',
    category: 'work',
    requiresNPC: false,
    location: 'shopping_district',
    timeCost: 480,
    energyCost: -50,
    moneyCost: 0,
    allowedTimeSlots: ['morning'],
    effects: {},
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
    },
    tags: ['work']
  },

  {
    id: 'work_barista',
    name: 'Work as Barista',
    description: 'Serve coffee and pastries at the cafe',
    category: 'work',
    requiresNPC: false,
    location: 'coffee_shop',
    timeCost: 240,
    energyCost: -35,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon'],
    effects: {},
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
    },
    tags: ['work']
  },

  // ===== SOCIAL ACTIVITIES =====
  // Requires NPC, relationship building is primary benefit

  {
    id: 'have_coffee',
    name: 'Have Coffee Together',
    description: 'Grab a casual coffee and catch up',
    category: 'social',
    requiresNPC: true,
    location: 'coffee_shop',
    timeCost: 60,
    energyCost: -8,
    moneyCost: -5,
    effects: { affection: 10 },
    difficulty: 20,
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
  },

  {
    id: 'quick_chat',
    name: 'Quick Chat',
    description: 'Have a brief conversation',
    category: 'social',
    requiresNPC: true,
    timeCost: 30,
    energyCost: -5,
    moneyCost: 0,
    effects: { affection: 5 },
    difficulty: 15,
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
  },

  {
    id: 'casual_date',
    name: 'Go on Casual Date',
    description: 'Go out for dinner or drinks together',
    category: 'social',
    requiresNPC: true,
    location: 'bar',
    timeCost: 120,
    energyCost: -10,
    moneyCost: -30,
    allowedTimeSlots: ['evening', 'night'],
    effects: { desire: 15 },
    difficulty: 40,
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
  },

  {
    id: 'deep_conversation',
    name: 'Have Deep Conversation',
    description: 'Share meaningful thoughts and feelings',
    category: 'social',
    requiresNPC: true,
    timeCost: 90,
    energyCost: -12,
    moneyCost: 0,
    minRelationship: 'friend',
    effects: { affection: 20, trust: 10 },
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
  },

  {
    id: 'go_to_movies',
    name: 'Go to Movies',
    description: 'Watch a film together at the cinema',
    category: 'social',
    requiresNPC: true,
    location: 'movie_theater',
    timeCost: 150,
    energyCost: -8,
    moneyCost: -20,
    allowedTimeSlots: ['evening', 'night'],
    effects: { affection: 10, desire: 5 },
    difficulty: 15,
    relevantStats: [],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 0.5,
      secondaryStats: [],
      negativeEffects: {
        moneyCost: 10
      }
    }
  },

  {
    id: 'exercise_together',
    name: 'Exercise Together',
    description: 'Work out or play sports together',
    category: 'social',
    requiresNPC: true,
    location: 'gym',
    timeCost: 90,
    energyCost: -15,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    effects: { affection: 10, trust: 5 },
    difficulty: 35,
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
  },

  {
    id: 'cook_dinner',
    name: 'Cook Dinner Together',
    description: 'Prepare and share a homemade meal',
    category: 'social',
    requiresNPC: true,
    location: 'home',
    timeCost: 120,
    energyCost: -10,
    moneyCost: -15,
    allowedTimeSlots: ['evening', 'night'],
    effects: { affection: 12, desire: 8 },
    difficulty: 40,
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
  },

  {
    id: 'flirt_playfully',
    name: 'Flirt Playfully',
    description: 'Engage in some lighthearted flirting',
    category: 'social',
    requiresNPC: true,
    timeCost: 45,
    energyCost: -8,
    moneyCost: 0,
    effects: { desire: 12 },
    difficulty: 45,
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
  },

  {
    id: 'beach_picnic',
    name: 'Beach Picnic',
    description: 'Share food and relaxation by the ocean',
    category: 'social',
    requiresNPC: true,
    location: 'beach',
    timeCost: 90,
    energyCost: -10,
    moneyCost: -15,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    effects: { affection: 15, desire: 8 },
    difficulty: 25,
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
  },

  {
    id: 'play_pool_darts',
    name: 'Play Pool/Darts',
    description: 'Friendly competition over bar games',
    category: 'social',
    requiresNPC: true,
    location: 'bar',
    timeCost: 60,
    energyCost: -8,
    moneyCost: -10,
    allowedTimeSlots: ['evening', 'night'],
    effects: { affection: 10, trust: 5 },
    difficulty: 30,
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
  },

  {
    id: 'boardwalk_stroll',
    name: 'Boardwalk Stroll',
    description: 'Take a romantic walk along the pier',
    category: 'social',
    requiresNPC: true,
    location: 'boardwalk',
    timeCost: 75,
    energyCost: -5,
    moneyCost: -5,
    allowedTimeSlots: ['evening', 'night'],
    effects: { affection: 8, desire: 10 },
    difficulty: 15,
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
  },

  // ===== SELF-IMPROVEMENT ACTIVITIES =====
  // Solo stat training activities

  {
    id: 'study_library',
    name: 'Study at Library',
    description: 'Hit the books and expand your knowledge',
    category: 'self_improvement',
    requiresNPC: false,
    location: 'library',
    timeCost: 120,
    energyCost: -12,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    effects: {},
    difficulty: 45,
    relevantStats: ['knowledge'],
    statRequirements: { knowledge: 10 },
    outcomeProfile: {
      mainStats: ['knowledge'],
      mainStatGain: 2.5,
      secondaryStats: ['creativity', 'poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 0.5,
        energyCost: 8
      }
    }
  },

  {
    id: 'work_out_gym',
    name: 'Work Out at Gym',
    description: 'Get a solid workout in at the gym',
    category: 'self_improvement',
    requiresNPC: false,
    location: 'gym',
    timeCost: 90,
    energyCost: -15,
    moneyCost: -10,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    effects: {},
    difficulty: 40,
    relevantStats: ['fitness'],
    outcomeProfile: {
      mainStats: ['fitness'],
      mainStatGain: 3,
      secondaryStats: ['poise', 'confidence'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 1,
        energyCost: 10,
        timeCost: 15
      }
    }
  },

  {
    id: 'read_book',
    name: 'Read a Book',
    description: 'Read for pleasure and relaxation',
    category: 'self_improvement',
    requiresNPC: false,
    location: 'home',
    timeCost: 90,
    energyCost: -5,
    moneyCost: 0,
    effects: {},
    difficulty: 25,
    relevantStats: ['knowledge'],
    outcomeProfile: {
      mainStats: ['knowledge'],
      mainStatGain: 2,
      secondaryStats: ['creativity'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness'],
        statPenalty: 0.5,
        timeCost: 15
      }
    }
  },

  {
    id: 'creative_hobby',
    name: 'Practice Creative Hobby',
    description: 'Work on art, music, or creative projects',
    category: 'self_improvement',
    requiresNPC: false,
    location: 'home',
    timeCost: 120,
    energyCost: -10,
    moneyCost: 0,
    effects: {},
    difficulty: 45,
    relevantStats: ['creativity'],
    outcomeProfile: {
      mainStats: ['creativity'],
      mainStatGain: 1.5,
      secondaryStats: ['knowledge', 'poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness', 'confidence'],
        statPenalty: 0.5,
        moneyCost: 5,
        timeCost: 20
      }
    }
  },

  {
    id: 'yoga_practice',
    name: 'Yoga Class',
    description: 'Attend a yoga class to work on flexibility, balance, and mindful movement',
    category: 'self_improvement',
    requiresNPC: false,
    location: 'gym',
    timeCost: 60,
    energyCost: -12,
    moneyCost: -10,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    effects: {},
    difficulty: 35,
    relevantStats: ['poise', 'fitness'],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 1.5,
      secondaryStats: ['fitness', 'vitality'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['poise'],
        statPenalty: 0.5,
        energyCost: 5,
        timeCost: 15
      }
    }
  },

  {
    id: 'meditation',
    name: 'Meditate',
    description: 'Practice mindfulness and mental composure',
    category: 'self_improvement',
    requiresNPC: false,
    location: 'home',
    timeCost: 45,
    energyCost: 0,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening', 'night'],
    effects: {},
    difficulty: 25,
    relevantStats: ['poise'],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 1.0,
      secondaryStats: ['vitality'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        timeCost: 15
      }
    }
  },

  {
    id: 'stretching',
    name: 'Stretching Routine',
    description: 'Improve flexibility and body awareness',
    category: 'self_improvement',
    requiresNPC: false,
    location: 'home',
    timeCost: 30,
    energyCost: -5,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    effects: {},
    difficulty: 20,
    relevantStats: ['poise', 'fitness'],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 1.0,
      secondaryStats: ['fitness'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        stats: ['fitness'],
        statPenalty: 0.3,
        energyCost: 3
      }
    }
  },

  {
    id: 'journaling',
    name: 'Write in Journal',
    description: 'Express thoughts and ideas through writing',
    category: 'self_improvement',
    requiresNPC: false,
    location: 'home',
    timeCost: 60,
    energyCost: -8,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening', 'night'],
    effects: {},
    difficulty: 30,
    relevantStats: ['creativity'],
    outcomeProfile: {
      mainStats: ['creativity'],
      mainStatGain: 1.0,
      secondaryStats: ['knowledge', 'wit'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        energyCost: 5,
        timeCost: 20
      }
    }
  },

  {
    id: 'sketching',
    name: 'Sketch/Draw',
    description: 'Practice visual art and creative observation',
    category: 'self_improvement',
    requiresNPC: false,
    location: 'park',
    timeCost: 75,
    energyCost: -8,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    effects: {},
    difficulty: 35,
    relevantStats: ['creativity'],
    outcomeProfile: {
      mainStats: ['creativity'],
      mainStatGain: 1.2,
      secondaryStats: ['poise', 'knowledge'],
      secondaryStatGain: 0.4,
      negativeEffects: {
        stats: ['creativity'],
        statPenalty: 0.5,
        energyCost: 5,
        timeCost: 15
      }
    }
  },

  {
    id: 'morning_jog',
    name: 'Morning Jog',
    description: 'Go for an energizing run outdoors',
    category: 'self_improvement',
    requiresNPC: false,
    location: 'park',
    timeCost: 45,
    energyCost: -10,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon'],
    effects: {},
    difficulty: 30,
    relevantStats: ['fitness'],
    outcomeProfile: {
      mainStats: ['fitness'],
      mainStatGain: 3,
      secondaryStats: ['poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness'],
        statPenalty: 0.5,
        energyCost: 5,
        timeCost: 10
      }
    }
  },

  {
    id: 'swim_beach',
    name: 'Swim at Beach',
    description: 'Take a refreshing swim in the ocean',
    category: 'self_improvement',
    requiresNPC: false,
    location: 'beach',
    timeCost: 60,
    energyCost: -12,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    effects: {},
    difficulty: 40,
    relevantStats: ['fitness'],
    outcomeProfile: {
      mainStats: ['fitness'],
      mainStatGain: 3,
      secondaryStats: ['poise', 'confidence'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness'],
        statPenalty: 0.5,
        energyCost: 8,
        timeCost: 15
      }
    }
  },

  // ===== LEISURE ACTIVITIES =====
  // Light activities for relaxation

  {
    id: 'stroll_park',
    name: 'Stroll in the Park',
    description: 'Take a peaceful walk outdoors',
    category: 'leisure',
    requiresNPC: false,
    location: 'park',
    timeCost: 60,
    energyCost: -3,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    effects: {},
    statEffects: { poise: 1 }
  },

  {
    id: 'play_video_games',
    name: 'Play Video Games',
    description: 'Unwind with some gaming',
    category: 'leisure',
    requiresNPC: false,
    location: 'home',
    timeCost: 120,
    energyCost: -5,
    moneyCost: 0,
    effects: {}
  },

  {
    id: 'watch_tv',
    name: 'Watch TV',
    description: 'Relax and watch your favorite shows',
    category: 'leisure',
    requiresNPC: false,
    location: 'home',
    timeCost: 90,
    energyCost: 0,
    moneyCost: 0,
    effects: {}
  },

  {
    id: 'listen_music',
    name: 'Listen to Music',
    description: 'Put on some tunes and chill',
    category: 'leisure',
    requiresNPC: false,
    location: 'home',
    timeCost: 30,
    energyCost: 0,
    moneyCost: 0,
    effects: {},
    difficulty: 10,
    relevantStats: ['poise'],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 1,
      secondaryStats: ['creativity'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        timeCost: 10
      }
    }
  },

  {
    id: 'word_games',
    name: 'Bar Trivia Night',
    description: 'Test your knowledge and wit at the local trivia competition',
    category: 'leisure',
    requiresNPC: false,
    location: 'bar',
    timeCost: 90,
    energyCost: -10,
    moneyCost: -5,
    allowedTimeSlots: ['evening', 'night'],
    effects: {},
    difficulty: 30,
    relevantStats: ['wit', 'knowledge'],
    outcomeProfile: {
      mainStats: ['wit'],
      mainStatGain: 1.0,
      secondaryStats: ['knowledge'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        energyCost: 5,
        moneyCost: 5,
        timeCost: 20
      }
    }
  },

  {
    id: 'comedy_show',
    name: 'Watch Comedy Show',
    description: 'Enjoy standup comedy and sharpen your sense of humor',
    category: 'leisure',
    requiresNPC: false,
    location: 'home',
    timeCost: 60,
    energyCost: 0,
    moneyCost: 0,
    effects: {},
    difficulty: 15,
    relevantStats: ['wit'],
    outcomeProfile: {
      mainStats: ['wit'],
      mainStatGain: 0.8,
      secondaryStats: ['creativity'],
      secondaryStatGain: 0.2,
      negativeEffects: {
        timeCost: 20
      }
    }
  },

  {
    id: 'beach_walk',
    name: 'Beach Walk',
    description: 'Take a peaceful walk along the shoreline',
    category: 'leisure',
    requiresNPC: false,
    location: 'beach',
    timeCost: 45,
    energyCost: -3,
    moneyCost: 0,
    effects: {},
    statEffects: { poise: 1 }
  },

  {
    id: 'window_shopping',
    name: 'Window Shopping',
    description: 'Browse shops without buying anything',
    category: 'leisure',
    requiresNPC: false,
    location: 'shopping_district',
    timeCost: 60,
    energyCost: -5,
    moneyCost: 0,
    effects: {}
  },

  {
    id: 'play_arcade',
    name: 'Play Arcade Games',
    description: 'Have fun with retro arcade games',
    category: 'leisure',
    requiresNPC: false,
    location: 'boardwalk',
    timeCost: 90,
    energyCost: -8,
    moneyCost: -10,
    effects: {},
    difficulty: 15,
    relevantStats: ['wit'],
    outcomeProfile: {
      mainStats: ['wit'],
      mainStatGain: 1.5,
      secondaryStats: ['poise'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        moneyCost: 5,
        timeCost: 20
      }
    }
  },

  // ===== SELF-CARE ACTIVITIES =====
  // Recovery and rest activities

  {
    id: 'take_nap',
    name: 'Take a Nap',
    description: 'Get some quick rest to recharge',
    category: 'self_care',
    requiresNPC: false,
    location: 'home',
    timeCost: 60,
    energyCost: 5,
    moneyCost: 0,
    effects: {},
    tags: ['recovery']
  },

  {
    id: 'go_to_sleep',
    name: 'Go to Sleep',
    description: 'Go to bed and end the day',
    category: 'self_care',
    requiresNPC: false,
    timeCost: 0,
    energyCost: 0,
    moneyCost: 0,
    allowedTimeSlots: ['evening', 'night'],
    effects: {},
    tags: ['recovery']
  },

  // ===== DISCOVERY ACTIVITIES =====
  // Special activities for meeting new NPCs

  {
    id: 'meet_someone',
    name: 'Meet Someone New',
    description: 'Explore the neighborhood and meet a new person',
    category: 'discovery',
    requiresNPC: false,
    timeCost: 45,
    energyCost: -20,
    moneyCost: 0,
    effects: {},
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
  }
];
