/**
 * Plutchik Emotion System - Interpretation Logic
 *
 * Interprets emotion vectors into human-readable emotion states.
 * Uses a priority-based system:
 *  1. High intensity single emotion (>= 75)
 *  2. Emotion dyad (two emotions >= 40)
 *  3. Medium intensity single emotion (>= 50)
 *  4. Low intensity single emotion (>= 25)
 *  5. Mixed (3+ emotions >= 40)
 *  6. Neutral (no emotions >= 25)
 */

import {
  BaseEmotion,
  EmotionVector,
  EmotionInterpretation,
  InterpretedIntensity,
} from './types';
import {
  HIGH_INTENSITY_THRESHOLD,
  MEDIUM_INTENSITY_THRESHOLD,
  LOW_INTENSITY_THRESHOLD,
  DYAD_THRESHOLD,
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
 * Priority system:
 *  1. High intensity single emotion (>= high threshold) → emotion at "high" intensity
 *  2. Emotion dyad (2 emotions >= dyad threshold) → dyad name
 *  3. Medium intensity single emotion (>= medium threshold) → emotion at "medium" intensity
 *  4. Low intensity single emotion (>= low threshold) → emotion at "low" intensity
 *  5. Mixed (3+ emotions >= dyad threshold) → "mixed"
 *  6. Neutral (no emotions >= low threshold) → "neutral"
 */
export function interpretEmotionVector(vector: EmotionVector): EmotionInterpretation {
  const allEmotions = getAllEmotionValues(vector);

  // Get emotions at various thresholds for priority checking
  const dyadEmotions = getEmotionsAboveThreshold(allEmotions, DYAD_THRESHOLD);
  const highEmotions = getEmotionsAboveThreshold(allEmotions, HIGH_INTENSITY_THRESHOLD);
  const mediumEmotions = getEmotionsAboveThreshold(allEmotions, MEDIUM_INTENSITY_THRESHOLD);

  // Priority 1: High intensity single emotion (only if exactly one high emotion)
  // But if there are 2 high emotions, check if they form a dyad first
  if (highEmotions.length === 1) {
    const strongest = highEmotions[0];
    const descriptors = getDescriptors(strongest.emotion, 'high');
    return {
      emotion: strongest.emotion,
      intensity: 'high',
      noun: descriptors.noun,
      adjective: descriptors.adjective,
      contributingEmotions: [strongest.emotion],
    };
  }

  // Priority 2: Emotion dyad (exactly 2 emotions above dyad threshold)
  // This includes the case where 2 emotions are both high
  if (dyadEmotions.length === 2) {
    const [first, second] = dyadEmotions;
    const dyadName = getDyadName(first.emotion, second.emotion);

    if (dyadName) {
      const descriptors = getDyadDescriptors(dyadName);
      // Dyad intensity based on average of the two emotions
      const avgValue = (first.value + second.value) / 2;
      let intensity: InterpretedIntensity;
      if (avgValue >= HIGH_INTENSITY_THRESHOLD) {
        intensity = 'high';
      } else if (avgValue >= MEDIUM_INTENSITY_THRESHOLD) {
        intensity = 'medium';
      } else {
        intensity = 'low';
      }

      return {
        emotion: dyadName,
        intensity,
        noun: descriptors.noun,
        adjective: descriptors.adjective,
        contributingEmotions: getDyadEmotions(dyadName),
      };
    }
  }

  // Priority 3: Medium intensity single emotion (only if exactly one medium+ emotion)
  if (mediumEmotions.length === 1) {
    const strongest = mediumEmotions[0];
    const descriptors = getDescriptors(strongest.emotion, 'medium');
    return {
      emotion: strongest.emotion,
      intensity: 'medium',
      noun: descriptors.noun,
      adjective: descriptors.adjective,
      contributingEmotions: [strongest.emotion],
    };
  }

  // Priority 4: Low intensity single emotion (only if not mixed)
  const lowEmotions = getEmotionsAboveThreshold(allEmotions, LOW_INTENSITY_THRESHOLD);

  // Check for mixed before returning single low emotion
  // Priority 5: Mixed (3+ emotions above dyad threshold)
  if (dyadEmotions.length >= 3) {
    const descriptors = getSpecialDescriptors('mixed');
    return {
      emotion: 'mixed',
      noun: descriptors.noun,
      adjective: descriptors.adjective,
    };
  }

  if (lowEmotions.length > 0) {
    const strongest = lowEmotions[0];
    const descriptors = getDescriptors(strongest.emotion, 'low');
    return {
      emotion: strongest.emotion,
      intensity: 'low',
      noun: descriptors.noun,
      adjective: descriptors.adjective,
      contributingEmotions: [strongest.emotion],
    };
  }

  // Priority 6: Neutral (no emotions above low threshold)
  const descriptors = getSpecialDescriptors('neutral');
  return {
    emotion: 'neutral',
    noun: descriptors.noun,
    adjective: descriptors.adjective,
  };
}
