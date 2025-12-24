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
export const HIGH_INTENSITY_THRESHOLD = 0.80;

/**
 * Threshold for medium intensity single emotion (Priority 3)
 * If a single emotion reaches this, it wins with medium intensity
 */
export const MEDIUM_INTENSITY_THRESHOLD = 0.50;

/**
 * Threshold for low intensity single emotion
 * If the highest emotion reaches this, it determines low intensity
 */
export const LOW_INTENSITY_THRESHOLD = 0.20;

/**
 * Proximity ratio for emotion grouping
 * Emotions must be at least this ratio of the previous emotion to be "in proximity"
 *
 * Examples:
 * - If leading emotion is 0.8, second must be >= 0.6 (0.8 * 0.75) for a dyad
 * - If second emotion is 0.6, third must be >= 0.45 (0.6 * 0.75) for mixed state
 */
export const DYAD_PROXIMITY_RATIO = 0.75;

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
  low: { noun: string; adjective: string; color: string };
  medium: { noun: string; adjective: string; color: string };
  high: { noun: string; adjective: string; color: string };
}

export const BASE_EMOTION_DESCRIPTORS: Record<BaseEmotion, EmotionDescriptors> = {
  joy: {
    low: { noun: 'contentment', adjective: 'pleased', color: '#FFF4CC' },
    medium: { noun: 'joy', adjective: 'joyful', color: '#FFE66D' },
    high: { noun: 'ecstasy', adjective: 'ecstatic', color: '#FFD700' },
  },
  sadness: {
    low: { noun: 'gloom', adjective: 'down', color: '#B8D8F5' },
    medium: { noun: 'sorrow', adjective: 'sad', color: '#6BB6FF' },
    high: { noun: 'grief', adjective: 'heartbroken', color: '#4A9EE0' },
  },
  acceptance: {
    low: { noun: 'tolerance', adjective: 'tolerant', color: '#B8E8C5' },
    medium: { noun: 'trust', adjective: 'accepting', color: '#7FD68A' },
    high: { noun: 'admiration', adjective: 'devoted', color: '#5CB86A' },
  },
  disgust: {
    low: { noun: 'aversion', adjective: 'averse', color: '#EDD6F5' },
    medium: { noun: 'disgust', adjective: 'disgusted', color: '#D9A5E8' },
    high: { noun: 'loathing', adjective: 'revolted', color: '#C47FDB' },
  },
  anger: {
    low: { noun: 'annoyance', adjective: 'irritated', color: '#FFCCCC' },
    medium: { noun: 'anger', adjective: 'angry', color: '#FF9999' },
    high: { noun: 'rage', adjective: 'furious', color: '#FF6B6B' },
  },
  fear: {
    low: { noun: 'apprehension', adjective: 'nervous', color: '#C8EDD4' },
    medium: { noun: 'fear', adjective: 'afraid', color: '#8FD9A8' },
    high: { noun: 'terror', adjective: 'terrified', color: '#66C287' },
  },
  anticipation: {
    low: { noun: 'interest', adjective: 'curious', color: '#FFD9B3' },
    medium: { noun: 'anticipation', adjective: 'eager', color: '#FFB86F' },
    high: { noun: 'vigilance', adjective: 'obsessed', color: '#FF9F3D' },
  },
  surprise: {
    low: { noun: 'distraction', adjective: 'distracted', color: '#D4EFFA' },
    medium: { noun: 'surprise', adjective: 'surprised', color: '#A0D8F1' },
    high: { noun: 'amazement', adjective: 'astonished', color: '#6FC3E8' },
  },
};

/**
 * Descriptors for emotion dyads
 */
export const DYAD_DESCRIPTORS: Record<EmotionDyad, { noun: string; adjective: string; color: string }> = {
  love: { noun: 'affection', adjective: 'affectionate', color: '#B8E994' },
  optimism: { noun: 'optimism', adjective: 'optimistic', color: '#FFD078' },
  submission: { noun: 'submission', adjective: 'submissive', color: '#87C9A0' },
  awe: { noun: 'awe', adjective: 'awestruck', color: '#98D3C7' },
  disappointment: { noun: 'disappointment', adjective: 'disappointed', color: '#8BC4D8' },
  remorse: { noun: 'remorse', adjective: 'remorseful', color: '#A098C8' },
  contempt: { noun: 'contempt', adjective: 'contemptuous', color: '#E89FC3' },
  aggression: { noun: 'aggression', adjective: 'aggressive', color: '#FFB080' },
  guilt: { noun: 'guilt', adjective: 'guilty', color: '#C1D888' },
  curiosity: { noun: 'curiosity', adjective: 'curious', color: '#8DCDB9' },
  despair: { noun: 'despair', adjective: 'hopeless', color: '#7AA8C9' },
  unbelief: { noun: 'disbelief', adjective: 'skeptical', color: '#B0AED1' },
  envy: { noun: 'envy', adjective: 'jealous', color: '#B89AC3' },
  cynicism: { noun: 'cynicism', adjective: 'cynical', color: '#D0A2B8' },
  pride: { noun: 'pride', adjective: 'proud', color: '#FFC285' },
  fatalism: { noun: 'fatalism', adjective: 'fatalistic', color: '#9AC48C' },
  delight: { noun: 'delight', adjective: 'delighted', color: '#F5D685' },
  sentimentality: { noun: 'nostalgia', adjective: 'nostalgic', color: '#93BBAE' },
  shame: { noun: 'shame', adjective: 'ashamed', color: '#AF9FBA' },
  outrage: { noun: 'outrage', adjective: 'outraged', color: '#D4A7B3' },
  pessimism: { noun: 'pessimism', adjective: 'pessimistic', color: '#9BACB8' },
  morbidness: { noun: 'morbidness', adjective: 'morbid', color: '#E3B5B8' },
  dominance: { noun: 'dominance', adjective: 'dominant', color: '#BA9EA5' },
  anxiety: { noun: 'anxiety', adjective: 'anxious', color: '#A3C6A8' },
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
): { noun: string; adjective: string; color: string } {
  return BASE_EMOTION_DESCRIPTORS[emotion][intensity];
}

/**
 * Get descriptors for a dyad
 */
export function getDyadDescriptors(dyad: EmotionDyad): { noun: string; adjective: string; color: string } {
  return DYAD_DESCRIPTORS[dyad];
}

/**
 * Get descriptors for special emotions
 */
export function getSpecialDescriptors(emotion: 'neutral' | 'mixed'): { noun: string; adjective: string } {
  return SPECIAL_EMOTION_DESCRIPTORS[emotion];
}
