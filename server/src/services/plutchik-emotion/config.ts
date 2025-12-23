/**
 * Plutchik Emotion System - Configuration
 *
 * Defines the emotional wheel structure and intensity mappings.
 */

import { BaseEmotion, EmotionIntensity } from './types';

/**
 * The Plutchik wheel order (clockwise)
 * Used to calculate emotional distance between emotions
 *
 * Adjacent emotions are 1 step apart
 * Opposite emotions are 4 steps apart (halfway around the wheel)
 */
export const EMOTION_WHEEL_ORDER: BaseEmotion[] = [
  'joy',
  'acceptance',
  'fear',
  'surprise',
  'sadness',
  'disgust',
  'anger',
  'anticipation',
  // (then back to joy)
];

/**
 * Base intensity values (before resistance calculations)
 * These are starting points - actual effect depends on current state
 */
export const BASE_INTENSITY_VALUES: Record<EmotionIntensity, number> = {
  tiny: 0.05,
  small: 0.15,
  medium: 0.25,
  large: 0.40,
  huge: 0.60,
};
