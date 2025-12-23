/**
 * Plutchik Emotion System - Interpretation Configuration
 *
 * Defines thresholds, emotion names, dyads, and descriptive language
 * for interpreting emotion vectors into human-readable states.
 *
 * ## Dyad Mapping Coverage
 *
 * All 24 valid emotion pairs have dyad mappings. The 4 "opposite" pairs
 * (joy+sadness, acceptance+disgust, anger+fear, anticipation+surprise)
 * are NOT mapped because they share the same axis and cannot both be
 * elevated simultaneously.
 *
 * Dyads are grouped by wheel distance:
 * - Primary (1 step): 8 dyads - strongest combinations
 * - Secondary (2 steps): 8 dyads - moderate combinations
 * - Tertiary (3 steps): 8 dyads - distant combinations
 */

import { BaseEmotion, EmotionDyad, InterpretedIntensity } from './types';

// ===== Interpretation Thresholds =====

/**
 * Threshold for high intensity single emotion (Priority 1)
 * If a single emotion reaches this, it wins with high intensity
 */
export const HIGH_INTENSITY_THRESHOLD = 0.75;

/**
 * Threshold for medium intensity single emotion (Priority 3)
 * If a single emotion reaches this, it wins with medium intensity
 */
export const MEDIUM_INTENSITY_THRESHOLD = 0.50;

/**
 * Threshold for low intensity single emotion (Priority 4)
 * If a single emotion reaches this, it wins with low intensity
 */
export const LOW_INTENSITY_THRESHOLD = 0.20;
/**
 * Threshold for emotion dyads (Priority 2)
 * Two emotions reaching this threshold form a dyad
 */
export const DYAD_THRESHOLD = 0.35;

/**
 * Threshold for 'mixed' emotion state
 * If 3+ emotions reach dyad threshold, state is 'mixed'
 */
export const MIXED_THRESHOLD = DYAD_THRESHOLD;

// ===== Emotion Dyad Mappings =====

/**
 * Map of emotion pairs to their dyad names
 * Based on Plutchik's wheel - dyads form between adjacent emotions
 * Keys use alphabetically sorted emotion pairs to avoid duplication
 */
export const EMOTION_DYAD_MAP: Record<string, EmotionDyad> = {
  // Primary dyads (adjacent emotions - 1 step apart)
  'acceptance+joy': 'love',
  'acceptance+fear': 'submission',
  'fear+surprise': 'awe',
  'sadness+surprise': 'disappointment',
  'disgust+sadness': 'remorse',
  'anger+disgust': 'contempt',
  'anger+anticipation': 'aggression',
  'anticipation+joy': 'optimism',

  // Secondary dyads (emotions 2 steps apart)
  'fear+joy': 'guilt',
  'acceptance+surprise': 'curiosity',
  'fear+sadness': 'despair',
  'disgust+surprise': 'unbelief',
  'anger+sadness': 'envy',
  'anticipation+disgust': 'cynicism',
  'anger+joy': 'pride',
  'acceptance+anticipation': 'fatalism',

  // Tertiary dyads (emotions 3 steps apart)
  'joy+surprise': 'delight',
  'acceptance+sadness': 'sentimentality',
  'disgust+fear': 'shame',
  'anger+surprise': 'outrage',
  'anticipation+sadness': 'pessimism',
  'disgust+joy': 'morbidness',
  'acceptance+anger': 'dominance',
  'anticipation+fear': 'anxiety',
};

/**
 * Get dyad name for two emotions
 * Automatically sorts emotions alphabetically to ensure consistent lookup
 */
export function getDyadName(emotion1: BaseEmotion, emotion2: BaseEmotion): EmotionDyad | null {
  // Sort emotions alphabetically to ensure consistent key
  const [first, second] = [emotion1, emotion2].sort();
  const key = `${first}+${second}`;
  return EMOTION_DYAD_MAP[key] || null;
}

/**
 * Reverse mapping from dyad name to contributing base emotions
 */
const DYAD_TO_EMOTIONS_MAP: Record<EmotionDyad, [BaseEmotion, BaseEmotion]> = Object.entries(
  EMOTION_DYAD_MAP
).reduce(
  (acc, [key, dyad]) => {
    const [emotion1, emotion2] = key.split('+') as [BaseEmotion, BaseEmotion];
    acc[dyad] = [emotion1, emotion2];
    return acc;
  },
  {} as Record<EmotionDyad, [BaseEmotion, BaseEmotion]>
);

/**
 * Get the two base emotions that form a dyad
 */
export function getDyadEmotions(dyad: EmotionDyad): [BaseEmotion, BaseEmotion] {
  return DYAD_TO_EMOTIONS_MAP[dyad];
}

// ===== Emotion Descriptors =====

/**
 * Nouns and adjectives for each base emotion at different intensities
 */
interface EmotionDescriptors {
  low: { noun: string; adjective: string };
  medium: { noun: string; adjective: string };
  high: { noun: string; adjective: string };
}

export const BASE_EMOTION_DESCRIPTORS: Record<BaseEmotion, EmotionDescriptors> = {
  joy: {
    low: { noun: 'contentment', adjective: 'pleased' },
    medium: { noun: 'joy', adjective: 'joyful' },
    high: { noun: 'ecstasy', adjective: 'ecstatic' },
  },
  sadness: {
    low: { noun: 'gloom', adjective: 'down' },
    medium: { noun: 'sorrow', adjective: 'sad' },
    high: { noun: 'grief', adjective: 'heartbroken' },
  },
  acceptance: {
    low: { noun: 'tolerance', adjective: 'tolerant' },
    medium: { noun: 'trust', adjective: 'accepting' },
    high: { noun: 'admiration', adjective: 'devoted' },
  },
  disgust: {
    low: { noun: 'aversion', adjective: 'averse' },
    medium: { noun: 'disgust', adjective: 'disgusted' },
    high: { noun: 'loathing', adjective: 'revolted' },
  },
  anger: {
    low: { noun: 'annoyance', adjective: 'irritated' },
    medium: { noun: 'anger', adjective: 'angry' },
    high: { noun: 'rage', adjective: 'furious' },
  },
  fear: {
    low: { noun: 'apprehension', adjective: 'nervous' },
    medium: { noun: 'fear', adjective: 'afraid' },
    high: { noun: 'terror', adjective: 'terrified' },
  },
  anticipation: {
    low: { noun: 'interest', adjective: 'curious' },
    medium: { noun: 'anticipation', adjective: 'eager' },
    high: { noun: 'vigilance', adjective: 'obsessed' },
  },
  surprise: {
    low: { noun: 'distraction', adjective: 'distracted' },
    medium: { noun: 'surprise', adjective: 'surprised' },
    high: { noun: 'amazement', adjective: 'astonished' },
  },
};

/**
 * Descriptors for emotion dyads
 */
export const DYAD_DESCRIPTORS: Record<EmotionDyad, { noun: string; adjective: string }> = {
  love: { noun: 'affection', adjective: 'affectionate' },
  optimism: { noun: 'optimism', adjective: 'optimistic' },
  guilt: { noun: 'guilt', adjective: 'guilty' },
  delight: { noun: 'delight', adjective: 'delighted' },
  pride: { noun: 'pride', adjective: 'proud' },
  submission: { noun: 'submission', adjective: 'submissive' },
  curiosity: { noun: 'curiosity', adjective: 'curious' },
  sentimentality: { noun: 'nostalgia', adjective: 'nostalgic' },
  awe: { noun: 'awe', adjective: 'awestruck' },
  despair: { noun: 'despair', adjective: 'hopeless' },
  shame: { noun: 'shame', adjective: 'ashamed' },
  disappointment: { noun: 'disappointment', adjective: 'disappointed' },
  unbelief: { noun: 'disbelief', adjective: 'skeptical' },
  envy: { noun: 'envy', adjective: 'jealous' },
  pessimism: { noun: 'pessimism', adjective: 'pessimistic' },
  remorse: { noun: 'remorse', adjective: 'remorseful' },
  contempt: { noun: 'contempt', adjective: 'contemptuous' },
  cynicism: { noun: 'cynicism', adjective: 'cynical' },
  morbidness: { noun: 'morbidness', adjective: 'morbid' },
  dominance: { noun: 'dominance', adjective: 'dominant' },
  aggression: { noun: 'aggression', adjective: 'aggressive' },
  outrage: {noun: 'outrage', adjective: 'outraged'},
  anxiety: { noun: 'anxiety', adjective: 'anxious' },
  fatalism: { noun: 'fatalism', adjective: 'fatalistic' },
};

/**
 * Descriptors for special emotion states
 */
export const SPECIAL_EMOTION_DESCRIPTORS = {
  neutral: { noun: 'neutrality', adjective: 'calm' },
  mixed: { noun: 'confusion', adjective: 'overwhelmed' },
};

/**
 * Get descriptors for an emotion at a specific intensity
 */
export function getDescriptors(
  emotion: BaseEmotion,
  intensity: InterpretedIntensity
): { noun: string; adjective: string } {
  return BASE_EMOTION_DESCRIPTORS[emotion][intensity];
}

/**
 * Get descriptors for a dyad
 */
export function getDyadDescriptors(dyad: EmotionDyad): { noun: string; adjective: string } {
  return DYAD_DESCRIPTORS[dyad];
}

/**
 * Get descriptors for special emotions
 */
export function getSpecialDescriptors(emotion: 'neutral' | 'mixed'): { noun: string; adjective: string } {
  return SPECIAL_EMOTION_DESCRIPTORS[emotion];
}
