/**
 * Relationship Service
 * Manages relationship state calculations, activity effects, and emotional state mapping
 *
 * ARCHITECTURE NOTE: This service encapsulates all relationship logic
 * to make it easy to expand with additional dimensions and complex rules.
 */

import { RelationshipState, EmotionalState, StatName } from '../../../../shared/types';

// ===== Constants =====

/**
 * Phase 2+3 Activities
 */
export const ACTIVITIES = [
  // Work Activities (solo) - Train: Ambition
  {
    id: 'work_part_time',
    name: 'Work Part-Time Job',
    description: 'Work a 4-hour shift at your part-time job',
    category: 'work' as const,
    requiresNPC: false,
    location: 'shopping_district' as const,
    timeCost: 240,
    energyCost: -30,
    moneyCost: 80,  // Main benefit is money (Ambition grows defensively)
    allowedTimeSlots: ['morning' as const, 'afternoon' as const],
    effects: {},
    // Phase 2.5: Stats
    difficulty: 30,
    relevantStats: ['ambition'] as StatName[],
    statEffects: { ambition: 2 }  // Legacy - no outcome profile (work is for money, not stats)
  },
  {
    id: 'work_full_day',
    name: 'Work Full Day',
    description: 'Work a full 8-hour shift for maximum pay',
    category: 'work' as const,
    requiresNPC: false,
    location: 'shopping_district' as const,
    timeCost: 480,
    energyCost: -50,
    moneyCost: 150,  // Main benefit is money (Ambition grows defensively)
    allowedTimeSlots: ['morning' as const],
    effects: {},
    // Phase 2.5: Stats - Requires commitment
    difficulty: 40,
    relevantStats: ['ambition', 'vitality'] as StatName[],
    statEffects: { ambition: 4 },  // Legacy - no outcome profile
    statRequirements: { ambition: 20 }
  },

  // Social Activities (with NPCs) - Train: Confidence, Wit, Empathy
  {
    id: 'have_coffee',
    name: 'Have Coffee Together',
    description: 'Grab a casual coffee and catch up',
    category: 'social' as const,
    requiresNPC: true,
    location: 'coffee_shop' as const,
    timeCost: 60,
    energyCost: -8,
    moneyCost: -5,
    effects: { friendship: 10 },  // Main benefit (auto-scales by outcome)
    // Phase 2.5: Stats
    difficulty: 20,
    relevantStats: ['confidence'] as StatName[],
    // Phase 2.5.3: Outcome Profile - minimal stat training, relationship is main benefit
    outcomeProfile: {
      mainStats: ['confidence'] as StatName[],
      mainStatGain: 0.5,  // Small stat gain
      secondaryStats: ['wit', 'poise'] as StatName[],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'] as StatName[],
        statPenalty: 0.5,
        moneyCost: 5  // Had to pay for them too
      }
    }
  },
  {
    id: 'quick_chat',
    name: 'Quick Chat',
    description: 'Have a brief conversation',
    category: 'social' as const,
    requiresNPC: true,
    // No location - available anywhere with NPC
    timeCost: 30,
    energyCost: -5,
    moneyCost: 0,
    effects: { friendship: 5 },  // Main benefit
    // Phase 2.5: Stats
    difficulty: 15,
    relevantStats: ['confidence'] as StatName[],
    // Phase 2.5.3: Outcome Profile
    outcomeProfile: {
      mainStats: ['confidence'] as StatName[],
      mainStatGain: 0.3,  // Very small
      secondaryStats: ['wit'] as StatName[],
      secondaryStatGain: 0.3,
      negativeEffects: {
        stats: ['confidence'] as StatName[],
        statPenalty: 0.3
      }
    }
  },
  {
    id: 'casual_date',
    name: 'Go on Casual Date',
    description: 'Go out for dinner or drinks together',
    category: 'social' as const,
    requiresNPC: true,
    location: 'bar' as const,
    timeCost: 120,
    energyCost: -10,
    moneyCost: -30,
    allowedTimeSlots: ['evening' as const, 'night' as const],
    effects: { romance: 15 },  // Main benefit
    // Phase 2.5: Stats
    difficulty: 40,
    relevantStats: ['confidence', 'wit'] as StatName[],
    // Phase 2.5.3: Outcome Profile
    outcomeProfile: {
      mainStats: ['confidence'] as StatName[],
      mainStatGain: 1,
      secondaryStats: ['wit', 'poise'] as StatName[],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'] as StatName[],
        statPenalty: 1,
        moneyCost: 15  // They didn't offer to split
      }
    }
  },
  {
    id: 'deep_conversation',
    name: 'Have Deep Conversation',
    description: 'Share meaningful thoughts and feelings',
    category: 'social' as const,
    requiresNPC: true,
    // No location - available anywhere with NPC
    timeCost: 90,
    energyCost: -12,
    moneyCost: 0,
    minRelationship: 'friend',
    effects: { friendship: 20 },  // Main benefit
    // Phase 2.5: Stats - Requires emotional depth
    difficulty: 50,
    relevantStats: ['wit', 'knowledge'] as StatName[],  // Changed from empathy (defensive)
    statRequirements: { empathy: 25 },  // Still requires empathy as gate
    // Phase 2.5.3: Outcome Profile
    outcomeProfile: {
      mainStats: ['wit'] as StatName[],  // Mixed stat as main (deep conversations train wit)
      mainStatGain: 2,
      secondaryStats: ['knowledge', 'poise'] as StatName[],
      secondaryStatGain: 1,
      negativeEffects: {
        stats: ['confidence'] as StatName[],
        statPenalty: 1,
        energyCost: 10  // Emotionally draining
      }
    }
  },
  {
    id: 'go_to_movies',
    name: 'Go to Movies',
    description: 'Watch a film together at the cinema',
    category: 'social' as const,
    requiresNPC: true,
    location: 'movie_theater' as const,
    timeCost: 150,
    energyCost: -8,
    moneyCost: -20,
    allowedTimeSlots: ['evening' as const, 'night' as const],
    effects: { friendship: 10, romance: 5 },  // Main benefit
    // Phase 2.5: Stats - Low difficulty passive activity
    difficulty: 15,
    relevantStats: [] as StatName[],
    // Phase 2.5.3: Outcome Profile - passive activity, minimal gains
    outcomeProfile: {
      mainStats: ['poise'] as StatName[],  // Mixed stat, relaxing together
      mainStatGain: 0.5,
      secondaryStats: [] as StatName[],
      negativeEffects: {
        moneyCost: 10  // Bought extra snacks
      }
    }
  },
  {
    id: 'exercise_together',
    name: 'Exercise Together',
    description: 'Work out or play sports together',
    category: 'social' as const,
    requiresNPC: true,
    location: 'gym' as const,
    timeCost: 90,
    energyCost: -15,
    moneyCost: 0,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const, 'evening' as const],
    effects: { friendship: 10 },  // Main benefit
    // Phase 2.5: Stats
    difficulty: 35,
    relevantStats: ['fitness'] as StatName[],
    // Phase 2.5.3: Outcome Profile
    outcomeProfile: {
      mainStats: ['fitness'] as StatName[],
      mainStatGain: 1.5,  // Social fitness is less effective than solo
      secondaryStats: ['poise'] as StatName[],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'] as StatName[],
        statPenalty: 0.5,
        energyCost: 10  // Injured or embarrassed
      }
    }
  },
  {
    id: 'cook_dinner',
    name: 'Cook Dinner Together',
    description: 'Prepare and share a homemade meal',
    category: 'social' as const,
    requiresNPC: true,
    location: 'home' as const,
    timeCost: 120,
    energyCost: -10,
    moneyCost: -15,
    allowedTimeSlots: ['evening' as const, 'night' as const],
    effects: { friendship: 12, romance: 8 },  // Main benefit
    // Phase 2.5: Stats
    difficulty: 40,
    relevantStats: ['creativity'] as StatName[],
    // Phase 2.5.3: Outcome Profile
    outcomeProfile: {
      mainStats: ['creativity'] as StatName[],  // Mixed stat as main
      mainStatGain: 1.5,
      secondaryStats: ['poise'] as StatName[],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'] as StatName[],
        statPenalty: 1,
        moneyCost: 10,  // Burned the food, ordered pizza
        timeCost: 30
      }
    }
  },
  {
    id: 'flirt_playfully',
    name: 'Flirt Playfully',
    description: 'Engage in some lighthearted flirting',
    category: 'social' as const,
    requiresNPC: true,
    // No location - available anywhere with NPC
    timeCost: 45,
    energyCost: -8,
    moneyCost: 0,
    effects: { romance: 12 },  // Main benefit
    // Phase 2.5: Stats
    difficulty: 45,
    relevantStats: ['confidence', 'wit'] as StatName[],
    // Phase 2.5.3: Outcome Profile
    outcomeProfile: {
      mainStats: ['wit'] as StatName[],  // Mixed stat as main
      mainStatGain: 1.5,
      secondaryStats: ['confidence', 'poise'] as StatName[],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'] as StatName[],
        statPenalty: 1.5,  // They didn't find it funny
        energyCost: 8
      }
    }
  },

  // Self-Improvement Activities (solo) - Primary stat training
  {
    id: 'study_library',
    name: 'Study at Library',
    description: 'Hit the books and expand your knowledge',
    category: 'self_improvement' as const,
    requiresNPC: false,
    location: 'library' as const,
    timeCost: 120,
    energyCost: -12,
    moneyCost: 0,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const, 'evening' as const],
    effects: {},
    // Phase 2.5: Stats - Train Knowledge (requires basic learning skills)
    difficulty: 45,
    relevantStats: ['knowledge'] as StatName[],
    statEffects: { knowledge: 5 },  // Deprecated - use outcomeProfile
    statRequirements: { knowledge: 10 },
    // Phase 2.5.3: Outcome Profile
    outcomeProfile: {
      mainStats: ['knowledge'] as StatName[],  // Active stat
      mainStatGain: 2.5,  // Reduced from 5
      secondaryStats: ['creativity', 'poise'] as StatName[],  // Removed defensive stat (ambition)
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'] as StatName[],
        statPenalty: 0.5,
        energyCost: 8  // Mental exhaustion/frustration
      }
    }
  },
  {
    id: 'work_out_gym',
    name: 'Work Out at Gym',
    description: 'Get a solid workout in at the gym',
    category: 'self_improvement' as const,
    requiresNPC: false,
    location: 'gym' as const,
    timeCost: 90,
    energyCost: -15,
    moneyCost: -10,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const, 'evening' as const],
    effects: {},
    // Phase 2.5: Stats - Train Fitness
    difficulty: 40,
    relevantStats: ['fitness'] as StatName[],
    // Phase 2.5.3: Outcome Profile
    outcomeProfile: {
      mainStats: ['fitness'] as StatName[],  // Active stat
      mainStatGain: 3,  // Reduced from 5
      secondaryStats: ['poise', 'confidence'] as StatName[],  // Removed defensive stat (vitality)
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'] as StatName[],
        statPenalty: 1,
        energyCost: 10,  // Injury or strain
        timeCost: 15  // Waited for equipment
      }
    }
  },
  {
    id: 'read_book',
    name: 'Read a Book',
    description: 'Read for pleasure and relaxation',
    category: 'self_improvement' as const,
    requiresNPC: false,
    location: 'home' as const,
    timeCost: 90,
    energyCost: -5,
    moneyCost: 0,
    effects: {},
    // Phase 2.5.3: Outcome profile
    difficulty: 25,
    relevantStats: ['knowledge'] as StatName[],
    outcomeProfile: {
      mainStats: ['knowledge'] as StatName[],
      mainStatGain: 2,
      secondaryStats: ['creativity'] as StatName[],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness'] as StatName[],
        statPenalty: 0.5,
        timeCost: 15
      }
    }
  },
  {
    id: 'creative_hobby',
    name: 'Practice Creative Hobby',
    description: 'Work on art, music, or creative projects',
    category: 'self_improvement' as const,
    requiresNPC: false,
    location: 'home' as const,
    timeCost: 120,
    energyCost: -10,
    moneyCost: 0,
    effects: {},
    // Phase 2.5.3: Outcome profile (Creativity is mixed stat, can be primary)
    difficulty: 45,
    relevantStats: ['creativity'] as StatName[],
    outcomeProfile: {
      mainStats: ['creativity'] as StatName[],
      mainStatGain: 2.5,
      secondaryStats: ['knowledge', 'poise'] as StatName[],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness', 'confidence'] as StatName[],
        statPenalty: 0.5,
        moneyCost: 5,  // Materials used up
        timeCost: 20  // Lost in flow state
      }
    }
  },

  // Leisure/Relaxation Activities (solo) - No rolls, minor stat gains
  {
    id: 'stroll_park',
    name: 'Stroll in the Park',
    description: 'Take a peaceful walk outdoors',
    category: 'leisure' as const,
    requiresNPC: false,
    location: 'park' as const,
    timeCost: 60,
    energyCost: -3,
    moneyCost: 0,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const, 'evening' as const],
    effects: {},
    // Phase 2.5: No roll (auto-success), minor poise gain
    // Note: Vitality grows from healthy patterns (defensive stat), not direct training
    statEffects: { poise: 1 }
  },
  {
    id: 'play_video_games',
    name: 'Play Video Games',
    description: 'Unwind with some gaming',
    category: 'leisure' as const,
    requiresNPC: false,
    location: 'home' as const,
    timeCost: 120,
    energyCost: -5,
    moneyCost: 0,
    effects: {}
    // Phase 2.5: Pure leisure, no stat gains
  },
  {
    id: 'watch_tv',
    name: 'Watch TV',
    description: 'Relax and watch your favorite shows',
    category: 'leisure' as const,
    requiresNPC: false,
    location: 'home' as const,
    timeCost: 90,
    energyCost: 0,
    moneyCost: 0,
    effects: {}
    // Phase 2.5: Pure leisure, no stat gains
  },
  {
    id: 'listen_music',
    name: 'Listen to Music',
    description: 'Put on some tunes and chill',
    category: 'leisure' as const,
    requiresNPC: false,
    location: 'home' as const,
    timeCost: 30,
    energyCost: 0,
    moneyCost: 0,
    effects: {},
    // Phase 2.5.3: Light leisure activity with minor poise training
    difficulty: 10,
    relevantStats: ['poise'] as StatName[],
    outcomeProfile: {
      mainStats: ['poise'] as StatName[],
      mainStatGain: 1,
      secondaryStats: ['creativity'] as StatName[],
      secondaryStatGain: 0.3,
      negativeEffects: {
        timeCost: 10  // Time flies when enjoying music
      }
    }
  },

  // Self-Care Activities (solo) - Support defensive stats through healthy patterns
  {
    id: 'take_nap',
    name: 'Take a Nap',
    description: 'Get some quick rest to recharge',
    category: 'self_care' as const,
    requiresNPC: false,
    location: 'home' as const,
    timeCost: 60,
    energyCost: 5,
    moneyCost: 0,
    effects: {}
    // Phase 2.5: Supports Vitality through energy management (defensive stat calc)
    // No direct stat training - Vitality grows from sustainable patterns
  },
  {
    id: 'go_to_sleep',
    name: 'Go to Sleep',
    description: 'Go to bed and end the day',
    category: 'self_care' as const,
    requiresNPC: false,
    // No location - works everywhere (special handling to travel home)
    timeCost: 0, // Special: ends day
    energyCost: 0, // Special: calculated based on sleep duration
    moneyCost: 0,
    allowedTimeSlots: ['evening' as const, 'night' as const],
    effects: {}
    // Phase 2.5: Special handling - stat processing happens in sleep endpoint
  },

  // Discovery Activity (solo)
  {
    id: 'meet_someone',
    name: 'Meet Someone New',
    description: 'Explore the neighborhood and meet a new person',
    category: 'discovery' as const,
    requiresNPC: false,
    // No location - available everywhere except home (handled in logic)
    timeCost: 45,
    energyCost: -20,
    moneyCost: 0,
    effects: {},
    // Phase 2.5.3: Outcome profile - challenging social discovery
    difficulty: 50,
    relevantStats: ['confidence'] as StatName[],
    outcomeProfile: {
      mainStats: ['confidence'] as StatName[],
      mainStatGain: 2.5,
      secondaryStats: ['wit', 'poise'] as StatName[],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence', 'poise'] as StatName[],
        statPenalty: 1,
        energyCost: 10,  // Social anxiety
        timeCost: 20  // Awkward conversation
      }
    }
  },

  // ===== PHASE 3 NEW ACTIVITIES =====

  // New Solo Activities
  {
    id: 'beach_walk',
    name: 'Beach Walk',
    description: 'Take a peaceful walk along the shoreline',
    category: 'leisure' as const,
    requiresNPC: false,
    location: 'beach' as const,
    timeCost: 45,
    energyCost: -3,
    moneyCost: 0,
    effects: {},
    // Phase 2.5: No roll, minor poise gain
    // Note: Vitality grows from healthy patterns (defensive stat), not direct training
    statEffects: { poise: 1 }
  },
  {
    id: 'window_shopping',
    name: 'Window Shopping',
    description: 'Browse shops without buying anything',
    category: 'leisure' as const,
    requiresNPC: false,
    location: 'shopping_district' as const,
    timeCost: 60,
    energyCost: -5,
    moneyCost: 0,
    effects: {}
    // Phase 2.5: Pure leisure, no stat gains
  },
  {
    id: 'morning_jog',
    name: 'Morning Jog',
    description: 'Go for an energizing run outdoors',
    category: 'self_improvement' as const,
    requiresNPC: false,
    location: 'park' as const,
    timeCost: 45,
    energyCost: -10,
    moneyCost: 0,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const],
    effects: {},
    // Phase 2.5.3: Outcome profile - outdoor fitness training
    difficulty: 30,
    relevantStats: ['fitness'] as StatName[],
    outcomeProfile: {
      mainStats: ['fitness'] as StatName[],
      mainStatGain: 3,
      secondaryStats: ['poise'] as StatName[],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness'] as StatName[],
        statPenalty: 0.5,
        energyCost: 5,  // Overexertion
        timeCost: 10  // Got lost/distracted
      }
    }
  },
  {
    id: 'swim_beach',
    name: 'Swim at Beach',
    description: 'Take a refreshing swim in the ocean',
    category: 'self_improvement' as const,
    requiresNPC: false,
    location: 'beach' as const,
    timeCost: 60,
    energyCost: -12,
    moneyCost: 0,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const, 'evening' as const],
    effects: {},
    // Phase 2.5.3: Outcome profile - swimming fitness training
    difficulty: 40,
    relevantStats: ['fitness'] as StatName[],
    outcomeProfile: {
      mainStats: ['fitness'] as StatName[],
      mainStatGain: 3,
      secondaryStats: ['poise', 'confidence'] as StatName[],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness'] as StatName[],
        statPenalty: 0.5,
        energyCost: 8,  // Water too cold/rough
        timeCost: 15  // Had to rest
      }
    }
  },
  {
    id: 'play_arcade',
    name: 'Play Arcade Games',
    description: 'Have fun with retro arcade games',
    category: 'leisure' as const,
    requiresNPC: false,
    location: 'boardwalk' as const,
    timeCost: 90,
    energyCost: -8,
    moneyCost: -10,
    effects: {},
    // Phase 2.5.3: Light leisure with minor wit training (mixed stat)
    difficulty: 15,
    relevantStats: ['wit'] as StatName[],
    outcomeProfile: {
      mainStats: ['wit'] as StatName[],
      mainStatGain: 1.5,
      secondaryStats: ['poise'] as StatName[],
      secondaryStatGain: 0.3,
      negativeEffects: {
        moneyCost: 5,  // Spent more tokens
        timeCost: 20  // Got too into it
      }
    }
  },

  // New Social Activities
  {
    id: 'beach_picnic',
    name: 'Beach Picnic',
    description: 'Share food and relaxation by the ocean',
    category: 'social' as const,
    requiresNPC: true,
    location: 'beach' as const,
    timeCost: 90,
    energyCost: -10,
    moneyCost: -15,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const, 'evening' as const],
    effects: { friendship: 15, romance: 8 },
    // Phase 2.5.3: Social activity - relationship is main outcome, minimal stat gains
    difficulty: 25,
    relevantStats: ['poise', 'confidence'] as StatName[],
    outcomeProfile: {
      mainStats: ['poise'] as StatName[],
      mainStatGain: 0.8,
      secondaryStats: ['confidence', 'wit'] as StatName[],
      secondaryStatGain: 0.3,
      negativeEffects: {
        stats: ['confidence', 'poise'] as StatName[],
        statPenalty: 0.5,
        moneyCost: 5,  // Food cost more
        timeCost: 15  // Awkward silences
      }
    }
  },
  {
    id: 'play_pool_darts',
    name: 'Play Pool/Darts',
    description: 'Friendly competition over bar games',
    category: 'social' as const,
    requiresNPC: true,
    location: 'bar' as const,
    timeCost: 60,
    energyCost: -8,
    moneyCost: -10,
    allowedTimeSlots: ['evening' as const, 'night' as const],
    effects: { friendship: 10 },
    // Phase 2.5.3: Social activity - relationship is main outcome, minimal stat gains
    difficulty: 30,
    relevantStats: ['poise', 'confidence'] as StatName[],
    outcomeProfile: {
      mainStats: ['poise'] as StatName[],
      mainStatGain: 1,
      secondaryStats: ['confidence', 'wit'] as StatName[],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence', 'poise'] as StatName[],
        statPenalty: 0.5,
        moneyCost: 5,  // Bought extra drinks
        energyCost: 5  // Stayed too late
      }
    }
  },
  {
    id: 'boardwalk_stroll',
    name: 'Boardwalk Stroll',
    description: 'Take a romantic walk along the pier',
    category: 'social' as const,
    requiresNPC: true,
    location: 'boardwalk' as const,
    timeCost: 75,
    energyCost: -5,
    moneyCost: -5,
    allowedTimeSlots: ['evening' as const, 'night' as const],
    effects: { friendship: 8, romance: 10 },
    // Phase 2.5.3: Social activity - easy romantic, minimal stat gains
    difficulty: 15,
    relevantStats: ['poise', 'confidence'] as StatName[],
    outcomeProfile: {
      mainStats: ['poise'] as StatName[],
      mainStatGain: 0.5,
      secondaryStats: ['confidence'] as StatName[],
      secondaryStatGain: 0.3,
      negativeEffects: {
        stats: ['confidence'] as StatName[],
        statPenalty: 0.3,
        moneyCost: 3,  // Bought snacks
        timeCost: 10  // Lost track of time
      }
    }
  },

  // New Work Activity
  {
    id: 'work_barista',
    name: 'Work as Barista',
    description: 'Serve coffee and pastries at the cafe',
    category: 'work' as const,
    requiresNPC: false,
    location: 'coffee_shop' as const,
    timeCost: 240,
    energyCost: -35,
    moneyCost: 70,
    allowedTimeSlots: ['morning' as const, 'afternoon' as const],
    effects: {},
    // Phase 2.5: Work activity - money is main benefit
    // Ambition grows from work patterns (defensive stat), Confidence trains organically
    difficulty: 35,
    relevantStats: ['confidence'] as StatName[],
    statEffects: { confidence: 1 }
  }
];

/**
 * Map relationship states to default emotional states
 */
const STATE_EMOTION_MAP: Record<RelationshipState, EmotionalState> = {
  // Combined states
  'close_romantic_partner': 'happy',
  'romantic_partner': 'flirty',
  'bitter_ex': 'sad',
  'complicated': 'sad',
  'rival': 'angry',
  'unrequited': 'sad',

  // Friendship-based
  'enemy': 'angry',
  'dislike': 'neutral',
  'stranger': 'neutral',
  'acquaintance': 'neutral',
  'friend': 'happy',
  'close_friend': 'happy',

  // Romance-based
  'repulsed': 'angry',
  'uncomfortable': 'neutral',
  'attracted': 'flirty',
  'romantic_interest': 'flirty',
  'in_love': 'happy'
};

// ===== Utility Functions =====

/**
 * Clamp a value to the range [-100, 100]
 */
function clamp(value: number): number {
  return Math.max(-100, Math.min(100, value));
}

// ===== State Calculation =====

/**
 * Determine relationship state based on friendship and romance values
 *
 * Priority:
 * 1. Combined states (both dimensions matter)
 * 2. Romance states (if romance has stronger magnitude)
 * 3. Friendship states (default)
 */
export function calculateRelationshipState(
  friendship: number,
  romance: number
): RelationshipState {
  // Combined states (highest priority)
  if (friendship >= 80 && romance >= 80) return 'close_romantic_partner';
  if (friendship >= 50 && romance >= 60) return 'romantic_partner';
  if (friendship <= -30 && romance <= -50) return 'bitter_ex';
  if (friendship >= 50 && romance <= -30) return 'complicated';
  if (friendship <= -50 && romance >= -19) return 'rival';
  if (friendship <= 30 && romance >= 60) return 'unrequited';

  // Single dimension states
  // Use romance if it has stronger magnitude
  if (Math.abs(romance) > Math.abs(friendship)) {
    if (romance >= 80) return 'in_love';
    if (romance >= 50) return 'romantic_interest';
    if (romance >= 20) return 'attracted';
    if (romance <= -50) return 'repulsed';
    if (romance <= -20) return 'uncomfortable';
  }

  // Default to friendship dimension
  if (friendship >= 80) return 'close_friend';
  if (friendship >= 50) return 'friend';
  if (friendship >= 20) return 'acquaintance';
  if (friendship <= -50) return 'enemy';
  if (friendship <= -20) return 'dislike';

  // Complete neutral
  return 'stranger';
}

/**
 * Apply activity effects to relationship values
 *
 * @returns New friendship and romance values (clamped to -100/+100)
 */
export function applyActivityEffects(
  currentFriendship: number,
  currentRomance: number,
  friendshipDelta: number,
  romanceDelta: number
): { friendship: number; romance: number } {
  return {
    friendship: clamp(currentFriendship + friendshipDelta),
    romance: clamp(currentRomance + romanceDelta)
  };
}

/**
 * Get default emotional state for a relationship state
 */
export function getEmotionalStateForRelationship(state: RelationshipState): EmotionalState {
  return STATE_EMOTION_MAP[state];
}

/**
 * Get contextual emotional state after an activity
 *
 * Overrides default emotion based on activity type:
 * - Positive friendship activity → happy
 * - Positive romance activity → flirty
 * - Negative friendship activity → sad or angry (based on severity)
 * - Negative romance activity → sad
 */
export function getContextualEmotionalState(
  friendshipDelta: number,
  romanceDelta: number,
  newState: RelationshipState
): EmotionalState {
  // Strong negative effects → angry
  if (friendshipDelta <= -15 || romanceDelta <= -15) {
    return 'angry';
  }

  // Mild negative effects → sad
  if (friendshipDelta < 0 || romanceDelta < 0) {
    return 'sad';
  }

  // Positive romance activity → flirty
  if (romanceDelta > 0) {
    return 'flirty';
  }

  // Positive friendship activity → happy
  if (friendshipDelta > 0) {
    return 'happy';
  }

  // Default: use relationship state emotion
  return getEmotionalStateForRelationship(newState);
}

/**
 * Update unlocked states list
 *
 * Adds new state if not already unlocked
 */
export function updateUnlockedStates(
  currentUnlocked: string[],
  newState: RelationshipState
): string[] {
  if (currentUnlocked.includes(newState)) {
    return currentUnlocked;
  }

  return [...currentUnlocked, newState];
}

/**
 * Get all activities available at current relationship state
 *
 * FUTURE: Filter based on requirements (min friendship, min romance, etc.)
 */
export function getAvailableActivities(): typeof ACTIVITIES {
  // Phase 1: All activities always available (debug mode)
  return ACTIVITIES;
}

/**
 * Find activity by ID
 */
export function getActivityById(activityId: string): typeof ACTIVITIES[0] | undefined {
  return ACTIVITIES.find((a) => a.id === activityId);
}

// ===== Relationship State Info =====

/**
 * Get human-readable description of relationship state
 */
export function getStateDescription(state: RelationshipState): string {
  const descriptions: Record<RelationshipState, string> = {
    // Combined
    'close_romantic_partner': 'Deeply in love and best friends',
    'romantic_partner': 'In a romantic relationship',
    'bitter_ex': 'Former romantic partner, now hostile',
    'complicated': 'Good friends but romantic tension',
    'rival': 'Strong animosity and competition',
    'unrequited': 'One-sided romantic feelings',

    // Friendship
    'enemy': 'Strong dislike, actively hostile',
    'dislike': 'Mild negative feelings',
    'stranger': 'Just met, neutral feelings',
    'acquaintance': 'Friendly but not close',
    'friend': 'Good relationship, enjoys spending time',
    'close_friend': 'Best friends, deep trust',

    // Romance
    'repulsed': 'Strong romantic aversion',
    'uncomfortable': 'Mild romantic discomfort',
    'attracted': 'Starting to develop feelings',
    'romantic_interest': 'Clear romantic feelings',
    'in_love': 'Strong romantic attachment'
  };

  return descriptions[state];
}

/**
 * Get display name for relationship state (for UI)
 */
export function getStateDisplayName(state: RelationshipState): string {
  // Convert snake_case to Title Case
  return state
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
