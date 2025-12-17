/**
 * Mixed Stats Configuration
 *
 * All thresholds and bonuses for Poise, Creativity, and Wit.
 * Design: Configuration-driven for easy game balance tuning.
 *
 * Note: All bonuses use 3x multiplier compared to active stats
 * (e.g., 1.5 here vs 0.5 for active stats) to make mixed stats meaningful
 */

// ===== Time Windows =====

export const TIME_WINDOWS = {
  shortTerm: 3,   // Days for recent pattern analysis
  mediumTerm: 7,  // Days for weekly pattern analysis
  longTerm: 14    // Days for broader pattern analysis
} as const;

// ===== Poise Configuration =====

/**
 * Poise rewards grace, excellence, and physical variety
 * Focus: Execution quality and diverse physical experiences
 */
export const POISE_CONFIG = {
  // Positive factors
  bonuses: {
    physicalVariety: {
      lookbackDays: 3,  // Check last N days
      thresholds: {
        min: 2,         // Minimum activities for bonus
        low: 2,         // 2 activities
        medium: 3,      // 3 activities
        high: 4         // 4+ activities
      },
      values: {
        low: 0.5,
        medium: 1.0,
        high: 1.5
      }
    },
    bestOutcome: {
      value: 1.5  // Achieved "best" outcome today
    },
    socialBest: {
      lookbackDays: 7,
      value: 0.5  // Best outcome in social activity this week
    }
  },

  // Negative factors
  penalties: {
    sedentary: {
      lookbackDays: 3,
      value: -2.0  // No physical activities in last 3 days
    },
    multipleNaps: {
      threshold: 2,  // Naps >= this
      value: -1.0
    }
  }
} as const;

// ===== Creativity Configuration =====

/**
 * Creativity rewards spontaneity and cross-domain exploration
 * Focus: Breaking routines through diverse, novel experiences
 */
export const CREATIVITY_CONFIG = {
  // Positive factors
  bonuses: {
    dailyVariety: {
      value: 1.5  // Different leisure activities from yesterday
    },
    novelty: {
      lookbackDays: 7,  // Not done in last 7 days
      value: 1.5
    },
    crossDomain: {
      lookbackDays: 7,
      requiredCategories: 3,  // physical, mental, social
      value: 1.0
    }
  },

  // Negative factors
  penalties: {
    stuckInRut: {
      lookbackDays: 3,  // Same activity all 3 days
      value: -2.0
    },
    noLeisure: {
      value: -1.5  // No leisure activities today
    },
    repeatedNpcs: {
      valuePerNpc: -1.0  // Talked to same NPC(s) all 3 days
    }
  }
} as const;

// ===== Wit Configuration =====

/**
 * Wit rewards social agility and playful practice
 * Focus: Conversational breadth through quick, varied interactions
 */
export const WIT_CONFIG = {
  // Thresholds
  thresholds: {
    quickInteraction: 60,  // Minutes - interactions < this are "quick"
    longInteraction: 60    // Minutes - interactions >= this are "long"
  },

  // Positive factors
  bonuses: {
    conversationalRange: {
      lookbackDays: 3,
      minPartners: 3,  // Different NPCs
      value: 1.5
    },
    quickInteraction: {
      value: 1.0  // Had quick/playful interaction today
    },
    tonalAgility: {
      lookbackDays: 3,
      value: 1.0  // Mix of quick and long interactions
    }
  },

  // Negative factors
  penalties: {
    noPractice: {
      value: -0.5  // No social interaction today
    },
    conversationalRut: {
      lookbackDays: 3,
      singlePartner: true,
      value: -1.5  // Only talked to 1 person in last 3 days
    },
    noQuickThinking: {
      lookbackDays: 7,
      value: -1.0  // Only deep conversations, no quick interactions this week
    }
  }
} as const;
