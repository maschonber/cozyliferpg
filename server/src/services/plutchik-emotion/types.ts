/**
 * Plutchik Emotion System - Type Definitions
 *
 * Based on Plutchik's Wheel of Emotions with 4 bipolar axes.
 * All values normalized to -1 to +1 range.
 */

/**
 * The 8 base emotions from Plutchik's wheel
 */
export type BaseEmotion =
  | 'joy' | 'sadness'
  | 'acceptance' | 'disgust'
  | 'anger' | 'fear'
  | 'anticipation' | 'surprise';

/**
 * Intensity levels for emotion pulls (t-shirt sizing)
 */
export type EmotionIntensity = 'tiny' | 'small' | 'medium' | 'large' | 'huge';

/**
 * Four-dimensional emotion vector
 * Each axis represents two opposing emotions
 * Values range from -1 to +1
 */
export interface EmotionVector {
  joySadness: number;           // -1 (sadness) to +1 (joy)
  acceptanceDisgust: number;    // -1 (disgust) to +1 (acceptance)
  angerFear: number;            // -1 (fear) to +1 (anger)
  anticipationSurprise: number; // -1 (surprise) to +1 (anticipation)
}

/**
 * A request to pull emotions in a specific direction
 */
export interface EmotionPull {
  emotion: BaseEmotion;
  intensity: EmotionIntensity;
}

/**
 * Intensity levels for interpreted emotions (Plutchik's three levels)
 */
export type InterpretedIntensity = 'low' | 'medium' | 'high';

/**
 * Special emotion states
 */
export type SpecialEmotion = 'neutral' | 'mixed';

/**
 * Emotion dyad names (combinations of two primary emotions)
 */
export type EmotionDyad =
  | 'love' | 'guilt' | 'delight' | 'pride'
  | 'submission' | 'curiosity' | 'sentimentality'
  | 'despair' | 'shame' | 'awe'
  | 'disappointment' | 'unbelief'
  | 'envy' | 'pessimism'
  | 'remorse' | 'contempt' | 'cynicism' | 'morbidness'
  | 'dominance' | 'aggression' | 'outrage'
  | 'optimism' | 'anxiety' | 'fatalism';

/**
 * All possible interpreted emotion names
 */
export type InterpretedEmotion =
  | BaseEmotion
  | EmotionDyad
  | SpecialEmotion;

/**
 * Result of interpreting an emotion vector (full response with descriptors)
 * @deprecated Use EmotionInterpretationResult with config lookup instead
 */
export interface EmotionInterpretation {
  /** The interpreted emotion name */
  emotion: InterpretedEmotion;

  /** Intensity level (only for single emotions and dyads, not for special emotions) */
  intensity?: InterpretedIntensity;

  /** Descriptive noun associated with this emotion (e.g., "ecstasy", "grief") */
  noun?: string;

  /** Descriptive adjective associated with this emotion (e.g., "joyful", "sad") */
  adjective?: string;

  /** RGB hex color code for this emotion */
  color?: string;

  /** The base emotions contributing to this interpretation (1 for main emotions, 2 for dyads) */
  contributingEmotions?: BaseEmotion[];
}

/**
 * Slim result of interpreting an emotion vector
 * Descriptive data (noun, adjective, color) should be looked up from config
 */
export interface EmotionInterpretationResult {
  /** The interpreted emotion name - use this as key to look up descriptors from config */
  emotion: InterpretedEmotion;

  /** Intensity level (only for single emotions and dyads, not for special emotions) */
  intensity?: InterpretedIntensity;

  /** The base emotions contributing to this interpretation (1 for main emotions, 2 for dyads) */
  contributingEmotions?: BaseEmotion[];
}

/**
 * Neutral emotion vector (all axes at 0)
 */
export const NEUTRAL_EMOTION_VECTOR: EmotionVector = {
  joySadness: 0,
  acceptanceDisgust: 0,
  angerFear: 0,
  anticipationSurprise: 0,
};
