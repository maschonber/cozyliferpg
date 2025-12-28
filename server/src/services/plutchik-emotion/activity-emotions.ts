/**
 * Activity Emotion Generator
 *
 * Generates emotion pulls based on activity outcome and emotion profile.
 * Creates varied emotional responses with deterministic primary emotions
 * and random secondary emotions for texture.
 *
 * ## Outcome Derivation Rules
 *
 * | Outcome      | Primary                    | Secondary                           |
 * |--------------|----------------------------|-------------------------------------|
 * | Best         | success @ medium/large     | 70%: random @ small                 |
 * | Okay         | success @ small            | 50%: random @ small/medium          |
 * | Mixed        | random @ small/medium      | 50%: another random @ small         |
 * | Catastrophic | failure @ medium/large     | 70%: random @ small                 |
 *
 * Secondary emotions exclude opposites of the primary to avoid cancellation.
 */

import { EmotionPull, BaseEmotion, EmotionIntensity } from './types';
import { EMOTION_WHEEL_ORDER } from './config';
import { EmotionProfile, OutcomeTier } from '../../../../shared/types';

// ===== Configuration =====

/**
 * Probability of adding a secondary emotion for each outcome tier
 */
const SECONDARY_EMOTION_CHANCE: Record<OutcomeTier, number> = {
  best: 0.7,
  okay: 0.5,
  mixed: 0.5,
  catastrophic: 0.7,
};

/**
 * Intensity for primary emotion by outcome tier
 *
 * TODO: Future enhancement - derive intensity from activity properties
 * (difficulty, timeCost) for more nuanced emotional impact scaling.
 * See: getBaseIntensity() concept in design discussion.
 */
const PRIMARY_INTENSITY: Record<OutcomeTier, EmotionIntensity> = {
  best: 'medium',
  okay: 'small',
  mixed: 'small',
  catastrophic: 'medium',
};

/**
 * Possible intensities for secondary emotions by outcome tier
 * Random selection from this array adds variety
 */
const SECONDARY_INTENSITY_OPTIONS: Record<OutcomeTier, EmotionIntensity[]> = {
  best: ['small'],
  okay: ['small', 'medium'],  // Can overshadow primary ("yes, but...")
  mixed: ['small'],
  catastrophic: ['small'],
};

// ===== Helper Functions =====

/**
 * Get the opposite emotion on Plutchik's wheel
 * Opposites are 4 steps apart (halfway around the 8-emotion wheel)
 */
function getOppositeEmotion(emotion: BaseEmotion): BaseEmotion {
  const index = EMOTION_WHEEL_ORDER.indexOf(emotion);
  const oppositeIndex = (index + 4) % 8;
  return EMOTION_WHEEL_ORDER[oppositeIndex];
}

/**
 * Get all base emotions except the opposite of the given one
 * Used to build the random pool for secondary emotions
 *
 * Note: The primary emotion IS included in the pool. When the same
 * emotion is selected twice (e.g., medium joy + small joy), it creates
 * a reinforced pull approximately equal to a large pull.
 */
function getValidSecondaryEmotions(primary: BaseEmotion): BaseEmotion[] {
  const opposite = getOppositeEmotion(primary);
  return EMOTION_WHEEL_ORDER.filter(e => e !== opposite);
}

/**
 * Pick a random element from an array
 */
function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Returns true with the given probability (0-1)
 */
function chance(probability: number): boolean {
  return Math.random() < probability;
}

// ===== Core Functions =====

/**
 * Generate emotion pulls for an activity based on outcome
 *
 * @param profile - The activity's emotion profile (success/failure emotions)
 * @param outcome - The outcome tier (best/okay/mixed/catastrophic)
 * @returns Array of 1-2 emotion pulls to apply to the NPC
 */
export function generateActivityEmotionPulls(
  profile: EmotionProfile,
  outcome: OutcomeTier
): EmotionPull[] {
  const pulls: EmotionPull[] = [];

  // Determine primary emotion based on outcome
  let primaryEmotion: BaseEmotion;

  switch (outcome) {
    case 'best':
    case 'okay':
      primaryEmotion = profile.successEmotion;
      break;
    case 'catastrophic':
      primaryEmotion = profile.failureEmotion;
      break;
    case 'mixed':
      // Mixed outcomes are wild - pick any random emotion
      primaryEmotion = randomPick(EMOTION_WHEEL_ORDER);
      break;
  }

  // Add primary emotion pull
  pulls.push({
    emotion: primaryEmotion,
    intensity: PRIMARY_INTENSITY[outcome],
  });

  // Maybe add a secondary emotion for variety
  if (chance(SECONDARY_EMOTION_CHANCE[outcome])) {
    const validSecondaries = getValidSecondaryEmotions(primaryEmotion);
    const secondaryEmotion = randomPick(validSecondaries);
    const secondaryIntensity = randomPick(SECONDARY_INTENSITY_OPTIONS[outcome]);

    pulls.push({
      emotion: secondaryEmotion,
      intensity: secondaryIntensity,
    });
  }

  return pulls;
}

/**
 * Check if an activity has an emotion profile defined
 */
export function hasEmotionProfile(profile: EmotionProfile | undefined): profile is EmotionProfile {
  return profile !== undefined &&
         typeof profile.successEmotion === 'string' &&
         typeof profile.failureEmotion === 'string';
}
