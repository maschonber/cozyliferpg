/**
 * Defensive Stats Configuration
 *
 * All thresholds, bonuses, and penalties for Vitality, Ambition, and Empathy.
 * Design: Configuration-driven for easy game balance tuning.
 *
 * Note: All bonuses use 5x multiplier compared to active stats
 * (e.g., 2.5 here vs 0.5 for active stats) to make defensive stats meaningful
 */

// ===== Bedtime Configuration =====

export const BEDTIME_HOURS = {
  earlyBedMin: 20,      // 8 PM - earliest healthy bedtime
  earlyBedMax: 24,      // Midnight - latest for "before midnight" bonus
  lateNightMin: 2,      // 2 AM - start of "too late" penalty
  lateNightMax: 6       // 6 AM - end of late night window
} as const;

// ===== Vitality Configuration =====

/**
 * Vitality rewards balanced energy management and healthy habits
 */
export const VITALITY_CONFIG = {
  // Positive factors
  bonuses: {
    minEnergy: {
      threshold: 30,
      value: 2.5
    },
    sleepSchedule: {
      value: 1.5  // Slept before midnight
    },
    energyBalance: {
      min: 20,
      max: 50,
      value: 1.5
    },
    noCatastrophe: {
      value: 1.0
    },
    restRecovery: {
      value: 2.0  // First rest day after work
    }
  },

  // Negative factors
  penalties: {
    burnout: {
      base: -2.5,
      streakMultiplier: 0.2  // Increases by 20% per day
    },
    lateNight: {
      base: -2.5,
      streakMultiplier: 0.2  // Increases by 20% per day
    },
    wastedEnergy: {
      threshold: 50,  // Ending energy > this
      value: -1.5
    },
    overwork: {
      threshold: 3,   // Work streak >= this
      base: -1.5      // Multiplied by (streak - 2)
    },
    slacking: {
      threshold: 3,   // Rest streak >= this
      base: -1.5      // Multiplied by (streak - 2)
    }
  }
} as const;

// ===== Ambition Configuration =====

/**
 * Ambition rewards pushing limits and work ethic
 */
export const AMBITION_CONFIG = {
  // Positive factors
  bonuses: {
    workedToday: {
      value: 2.0
    },
    workStreak: {
      threshold: 2,
      value: 1.5
    },
    longWorkStreak: {
      threshold: 5,
      value: 2.5
    },
    pushedLimits: {
      comfortGap: 20,      // Activity difficulty >= stat + this
      valuePerActivity: 2.0,
      maxActivitiesPerDay: 3
    },
    hardActivities: {
      difficultyThreshold: 50,
      valuePerActivity: 1.0,
      maxActivitiesPerDay: 3
    }
  },

  // Negative factors
  penalties: {
    noWork: {
      value: -1.0
    },
    restStreak: {
      threshold: 2,
      base: -1.5  // Multiplied by streak length
    },
    coasting: {
      minDifficulty: 20,        // Absolute minimum
      comfortGap: -20,          // stat - 20
      value: -1.5
    }
  }
} as const;

// ===== Empathy Configuration =====

/**
 * Empathy rewards genuine connections and diverse relationships
 */
export const EMPATHY_CONFIG = {
  // Relationship thresholds
  thresholds: {
    platonicFriend: {
      minFriendship: 30,
      maxRomance: 10
    },
    romanticInterest: {
      minRomance: 20
    },
    closeFriend: {
      minFriendship: 50
    },
    neglectedFriend: {
      minFriendship: 40,
      daysSinceContact: 7
    }
  },

  // Positive factors
  bonuses: {
    meaningfulConversation: {
      minDuration: 60,  // Minutes
      value: 1.5
    },
    platonicInteraction: {
      value: 2.5  // Spent time with platonic friend
    },
    friendCircle: {
      smallThreshold: 2,
      smallValue: 1.0,
      largeThreshold: 4,
      largeValue: 1.5
    },
    diversity: {
      threshold: 5,     // Unique NPCs in 7 days
      value: 1.0
    },
    maintainedFriendships: {
      value: 1.0  // Contacted all close friends this week
    }
  },

  // Negative factors
  penalties: {
    onlyRomantic: {
      value: -2.0  // Only romantic interactions today
    },
    romanceImbalance: {
      ratio: 2,    // Romantic > 2x platonic this week
      value: -1.5
    },
    neglectedFriend: {
      valuePerFriend: -1.5  // Per friend not contacted in 7+ days
    },
    negativeInteraction: {
      value: -2.5  // Was dismissive or rude
    }
  },

  // Time windows
  timeWindows: {
    recentInteractions: 7  // Days to check for patterns
  }
} as const;
