/**
 * Plutchik Emotion System - Interpretation Logic
 *
 * Interprets emotion vectors into human-readable emotion states.
 *
 * Intensity is determined by the HIGHEST emotion value:
 *  - High: >= 80
 *  - Medium: >= 55
 *  - Low: >= 20
 *  - Neutral: < 20
 *
 * Emotion type is determined by proximity (75% rule):
 *  - Single: Only one significant emotion
 *  - Dyad: 2 emotions in close proximity (second >= 75% of highest)
 *  - Mixed: 3+ emotions in close proximity (third >= 75% of second)
 */

import {
  BaseEmotion,
  EmotionVector,
  EmotionInterpretation,
  EmotionInterpretationResult,
  InterpretedIntensity,
} from './types';
import {
  HIGH_INTENSITY_THRESHOLD,
  MEDIUM_INTENSITY_THRESHOLD,
  LOW_INTENSITY_THRESHOLD,
  DYAD_PROXIMITY_RATIO,
  getDyadName,
  getDyadEmotions,
  getDescriptors,
  getDyadDescriptors,
  getSpecialDescriptors,
} from './interpretation-config';

/**
 * Extract all 8 base emotions from a vector with their absolute values
 */
function getAllEmotionValues(vector: EmotionVector): Array<{ emotion: BaseEmotion; value: number }> {
  return [
    { emotion: 'joy', value: Math.max(0, vector.joySadness) },
    { emotion: 'sadness', value: Math.max(0, -vector.joySadness) },
    { emotion: 'acceptance', value: Math.max(0, vector.acceptanceDisgust) },
    { emotion: 'disgust', value: Math.max(0, -vector.acceptanceDisgust) },
    { emotion: 'anger', value: Math.max(0, vector.angerFear) },
    { emotion: 'fear', value: Math.max(0, -vector.angerFear) },
    { emotion: 'anticipation', value: Math.max(0, vector.anticipationSurprise) },
    { emotion: 'surprise', value: Math.max(0, -vector.anticipationSurprise) },
  ];
}

/**
 * Find the emotion with the highest value
 */
function getStrongestEmotion(
  emotions: Array<{ emotion: BaseEmotion; value: number }>
): { emotion: BaseEmotion; value: number } | null {
  if (emotions.length === 0) return null;

  return emotions.reduce((strongest, current) =>
    current.value > strongest.value ? current : strongest
  );
}

/**
 * Find emotions that meet a threshold, sorted by value (descending)
 */
function getEmotionsAboveThreshold(
  emotions: Array<{ emotion: BaseEmotion; value: number }>,
  threshold: number
): Array<{ emotion: BaseEmotion; value: number }> {
  return emotions
    .filter(e => e.value >= threshold)
    .sort((a, b) => b.value - a.value);
}

/**
 * Interpret an emotion vector into a human-readable emotion state
 *
 * Algorithm:
 *  1. Find the highest emotion value
 *  2. Determine intensity based on highest value (high/medium/low/neutral)
 *  3. Count emotions in proximity using 75% rule
 *  4. Return single/dyad/mixed based on proximity count
 */
export function interpretEmotionVector(vector: EmotionVector): EmotionInterpretation {
  const allEmotions = getAllEmotionValues(vector);

  // Sort all emotions by value (descending)
  const sortedEmotions = [...allEmotions].sort((a, b) => b.value - a.value);
  const [first, second, third] = sortedEmotions;

  // Determine intensity based on highest emotion
  let intensity: InterpretedIntensity | null = null;
  if (first.value >= HIGH_INTENSITY_THRESHOLD) {
    intensity = 'high';
  } else if (first.value >= MEDIUM_INTENSITY_THRESHOLD) {
    intensity = 'medium';
  } else if (first.value >= LOW_INTENSITY_THRESHOLD) {
    intensity = 'low';
  }

  // If no emotions reach low threshold, return neutral
  if (!intensity) {
    const descriptors = getSpecialDescriptors('neutral');
    return {
      emotion: 'neutral',
      noun: descriptors.noun,
      adjective: descriptors.adjective,
    };
  }

  // Count emotions in proximity using 75% rule
  let emotionsInProximity = 1; // Always have at least the first emotion

  if (second && second.value >= first.value * DYAD_PROXIMITY_RATIO && second.value >= LOW_INTENSITY_THRESHOLD) {
    emotionsInProximity = 2;

    // Check if third emotion is also in proximity (75% of second)
    if (third && third.value >= second.value * DYAD_PROXIMITY_RATIO && third.value >= LOW_INTENSITY_THRESHOLD) {
      emotionsInProximity = 3;
    }
  }

  // If 3+ emotions in proximity, return mixed
  if (emotionsInProximity >= 3) {
    const descriptors = getSpecialDescriptors('mixed');
    return {
      emotion: 'mixed',
      noun: descriptors.noun,
      adjective: descriptors.adjective,
    };
  }

  // If 2 emotions in proximity, try to form a dyad
  if (emotionsInProximity === 2) {
    const dyadName = getDyadName(first.emotion, second.emotion);
    if (dyadName) {
      const descriptors = getDyadDescriptors(dyadName, intensity);
      return {
        emotion: dyadName,
        intensity,
        noun: descriptors.noun,
        adjective: descriptors.adjective,
        color: descriptors.color,
        contributingEmotions: getDyadEmotions(dyadName),
      };
    }
  }

  // Single emotion
  const descriptors = getDescriptors(first.emotion, intensity);
  return {
    emotion: first.emotion,
    intensity,
    noun: descriptors.noun,
    adjective: descriptors.adjective,
    color: descriptors.color,
    contributingEmotions: [first.emotion],
  };
}

/**
 * Interpret an emotion vector into a slim result (without descriptor data)
 * Use this with the config endpoint for efficient API responses
 */
export function interpretEmotionVectorSlim(vector: EmotionVector): EmotionInterpretationResult {
  const allEmotions = getAllEmotionValues(vector);

  // Sort all emotions by value (descending)
  const sortedEmotions = [...allEmotions].sort((a, b) => b.value - a.value);
  const [first, second, third] = sortedEmotions;

  // Determine intensity based on highest emotion
  let intensity: InterpretedIntensity | null = null;
  if (first.value >= HIGH_INTENSITY_THRESHOLD) {
    intensity = 'high';
  } else if (first.value >= MEDIUM_INTENSITY_THRESHOLD) {
    intensity = 'medium';
  } else if (first.value >= LOW_INTENSITY_THRESHOLD) {
    intensity = 'low';
  }

  // If no emotions reach low threshold, return neutral
  if (!intensity) {
    return { emotion: 'neutral' };
  }

  // Count emotions in proximity using 75% rule
  let emotionsInProximity = 1;

  if (second && second.value >= first.value * DYAD_PROXIMITY_RATIO && second.value >= LOW_INTENSITY_THRESHOLD) {
    emotionsInProximity = 2;

    if (third && third.value >= second.value * DYAD_PROXIMITY_RATIO && third.value >= LOW_INTENSITY_THRESHOLD) {
      emotionsInProximity = 3;
    }
  }

  // If 3+ emotions in proximity, return mixed
  if (emotionsInProximity >= 3) {
    return { emotion: 'mixed' };
  }

  // If 2 emotions in proximity, try to form a dyad
  if (emotionsInProximity === 2) {
    const dyadName = getDyadName(first.emotion, second.emotion);
    if (dyadName) {
      return {
        emotion: dyadName,
        intensity,
        contributingEmotions: getDyadEmotions(dyadName),
      };
    }
  }

  // Single emotion
  return {
    emotion: first.emotion,
    intensity,
    contributingEmotions: [first.emotion],
  };
}
