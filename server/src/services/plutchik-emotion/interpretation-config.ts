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
export interface EmotionDescriptors {
  low: { noun: string; adjective: string; color: string };
  medium: { noun: string; adjective: string; color: string };
  high: { noun: string; adjective: string; color: string };
}

export const BASE_EMOTION_DESCRIPTORS: Record<BaseEmotion, EmotionDescriptors> = {
  joy: {
    low: { noun: 'cheeriness', adjective: 'cheery', color: '#FFF4CC' },
    medium: { noun: 'joy', adjective: 'joyful', color: '#FFE66D' },
    high: { noun: 'ecstasy', adjective: 'ecstatic', color: '#FFD700' },
  },
  sadness: {
    low: { noun: 'gloom', adjective: 'down', color: '#B8D8F5' },
    medium: { noun: 'sorrow', adjective: 'sad', color: '#6BB6FF' },
    high: { noun: 'grief', adjective: 'heartbroken', color: '#4A9EE0' },
  },
  acceptance: {
    low: { noun: 'openness', adjective: 'open', color: '#B8E8C5' },
    medium: { noun: 'acceptance', adjective: 'accepting', color: '#7FD68A' },
    high: { noun: 'admiration', adjective: 'admiring', color: '#5CB86A' },
  },
  disgust: {
    low: { noun: 'boredom', adjective: 'bored', color: '#EDD6F5' },
    medium: { noun: 'disgust', adjective: 'disgusted', color: '#D9A5E8' },
    high: { noun: 'loathing', adjective: 'loathing', color: '#C47FDB' },
  },
  anger: {
    low: { noun: 'annoyance', adjective: 'annoyed', color: '#FFCCCC' },
    medium: { noun: 'anger', adjective: 'angry', color: '#FF9999' },
    high: { noun: 'fury', adjective: 'furious', color: '#FF6B6B' },
  },
  fear: {
    low: { noun: 'nervosity', adjective: 'nervous', color: '#C8EDD4' },
    medium: { noun: 'fear', adjective: 'afraid', color: '#8FD9A8' },
    high: { noun: 'terror', adjective: 'terrified', color: '#66C287' },
  },
  anticipation: {
    low: { noun: 'interest', adjective: 'interested', color: '#FFD9B3' },
    medium: { noun: 'focus', adjective: 'focused', color: '#FFB86F' },
    high: { noun: 'vigilance', adjective: 'vigilant', color: '#FF9F3D' },
  },
  surprise: {
    low: { noun: 'distraction', adjective: 'distracted', color: '#D4EFFA' },
    medium: { noun: 'surprise', adjective: 'surprised', color: '#A0D8F1' },
    high: { noun: 'amazement', adjective: 'amazed', color: '#6FC3E8' },
  },
};

/**
 * Descriptors for emotion dyads at different intensities
 * Low = mild form, Medium = standard dyad, High = intense form
 */
export const DYAD_DESCRIPTORS: Record<EmotionDyad, EmotionDescriptors> = {
  // Primary dyads (adjacent emotions - 1 step apart)
  love: {
    low: { noun: 'care', adjective: 'caring', color: '#D4F4C4' },
    medium: { noun: 'affection', adjective: 'affectionate', color: '#B8E994' },
    high: { noun: 'adoration', adjective: 'adoring', color: '#8FD964' },
  },
  optimism: {
    low: { noun: 'hopefulness', adjective: 'hopeful', color: '#FFE4A8' },
    medium: { noun: 'optimism', adjective: 'optimistic', color: '#FFD078' },
    high: { noun: 'exuberance', adjective: 'exuberant', color: '#FFBC48' },
  },
  submission: {
    low: { noun: 'compliance', adjective: 'compliant', color: '#B3DCC0' },
    medium: { noun: 'submission', adjective: 'submissive', color: '#87C9A0' },
    high: { noun: 'servility', adjective: 'servile', color: '#5BB680' },
  },
  awe: {
    low: { noun: 'wonder', adjective: 'wondering', color: '#C4E4DD' },
    medium: { noun: 'awe', adjective: 'awestruck', color: '#98D3C7' },
    high: { noun: 'reverence', adjective: 'reverent', color: '#6CC2B1' },
  },
  disappointment: {
    low: { noun: 'letdown', adjective: 'let down', color: '#B7D8E8' },
    medium: { noun: 'disappointment', adjective: 'disappointed', color: '#8BC4D8' },
    high: { noun: 'dismay', adjective: 'dismayed', color: '#5FB0C8' },
  },
  remorse: {
    low: { noun: 'regret', adjective: 'regretful', color: '#C8BFD8' },
    medium: { noun: 'remorse', adjective: 'remorseful', color: '#A098C8' },
    high: { noun: 'penitence', adjective: 'penitent', color: '#7871B8' },
  },
  contempt: {
    low: { noun: 'disdain', adjective: 'disdainful', color: '#F4C7DB' },
    medium: { noun: 'contempt', adjective: 'contemptuous', color: '#E89FC3' },
    high: { noun: 'scorn', adjective: 'scornful', color: '#DC77AB' },
  },
  aggression: {
    low: { noun: 'assertiveness', adjective: 'assertive', color: '#FFD0B0' },
    medium: { noun: 'aggression', adjective: 'aggressive', color: '#FFB080' },
    high: { noun: 'hostility', adjective: 'hostile', color: '#FF9050' },
  },

  // Secondary dyads (emotions 2 steps apart)
  guilt: {
    low: { noun: 'unease', adjective: 'uneasy', color: '#D8E8B0' },
    medium: { noun: 'guilt', adjective: 'guilty', color: '#C1D888' },
    high: { noun: 'torment', adjective: 'tormented', color: '#AAC860' },
  },
  curiosity: {
    low: { noun: 'intrigue', adjective: 'intrigued', color: '#B9DED1' },
    medium: { noun: 'curiosity', adjective: 'curious', color: '#8DCDB9' },
    high: { noun: 'fascination', adjective: 'fascinated', color: '#61BCA1' },
  },
  despair: {
    low: { noun: 'discouragement', adjective: 'discouraged', color: '#A8C4D9' },
    medium: { noun: 'despair', adjective: 'despairing', color: '#7AA8C9' },
    high: { noun: 'anguish', adjective: 'anguished', color: '#4C8CB9' },
  },
  unbelief: {
    low: { noun: 'doubt', adjective: 'doubtful', color: '#CCC9E1' },
    medium: { noun: 'disbelief', adjective: 'skeptical', color: '#B0AED1' },
    high: { noun: 'incredulity', adjective: 'incredulous', color: '#9493C1' },
  },
  envy: {
    low: { noun: 'bitterness', adjective: 'bitter', color: '#D4BBD3' },
    medium: { noun: 'envy', adjective: 'envious', color: '#B89AC3' },
    high: { noun: 'spite', adjective: 'spiteful', color: '#9C79B3' },
  },
  cynicism: {
    low: { noun: 'wariness', adjective: 'wary', color: '#E0C2D0' },
    medium: { noun: 'cynicism', adjective: 'cynical', color: '#D0A2B8' },
    high: { noun: 'misanthropy', adjective: 'misanthropic', color: '#C082A0' },
  },
  pride: {
    low: { noun: 'smugness', adjective: 'smug', color: '#FFD8AD' },
    medium: { noun: 'pride', adjective: 'proud', color: '#FFC285' },
    high: { noun: 'triumph', adjective: 'triumphant', color: '#FFAC5D' },
  },
  fatalism: {
    low: { noun: 'resignation', adjective: 'resigned', color: '#BED8AE' },
    medium: { noun: 'fatalism', adjective: 'fatalistic', color: '#9AC48C' },
    high: { noun: 'doom', adjective: 'doomed', color: '#76B06A' },
  },

  // Tertiary dyads (emotions 3 steps apart)
  delight: {
    low: { noun: 'pleasure', adjective: 'pleased', color: '#FAE6AD' },
    medium: { noun: 'delight', adjective: 'delighted', color: '#F5D685' },
    high: { noun: 'elation', adjective: 'elated', color: '#F0C65D' },
  },
  sentimentality: {
    low: { noun: 'wistfulness', adjective: 'wistful', color: '#B9D0C6' },
    medium: { noun: 'nostalgia', adjective: 'nostalgic', color: '#93BBAE' },
    high: { noun: 'longing', adjective: 'longing', color: '#6DA696' },
  },
  shame: {
    low: { noun: 'embarrassment', adjective: 'embarrassed', color: '#CBBFD2' },
    medium: { noun: 'shame', adjective: 'ashamed', color: '#AF9FBA' },
    high: { noun: 'humiliation', adjective: 'humiliated', color: '#937FA2' },
  },
  outrage: {
    low: { noun: 'indignation', adjective: 'indignant', color: '#E4C3CB' },
    medium: { noun: 'outrage', adjective: 'outraged', color: '#D4A7B3' },
    high: { noun: 'fury', adjective: 'furious', color: '#C48B9B' },
  },
  pessimism: {
    low: { noun: 'uncertainty', adjective: 'uncertain', color: '#BBC8D0' },
    medium: { noun: 'pessimism', adjective: 'pessimistic', color: '#9BACB8' },
    high: { noun: 'hopelessness', adjective: 'hopeless', color: '#7B90A0' },
  },
  morbidness: {
    low: { noun: 'wryness', adjective: 'wry', color: '#EED0D2' },
    medium: { noun: 'morbidness', adjective: 'morbid', color: '#E3B5B8' },
    high: { noun: 'macabreness', adjective: 'macabre', color: '#D89A9E' },
  },
  dominance: {
    low: { noun: 'authority', adjective: 'authoritative', color: '#D0BBBF' },
    medium: { noun: 'dominance', adjective: 'dominant', color: '#BA9EA5' },
    high: { noun: 'tyranny', adjective: 'tyrannical', color: '#A4818B' },
  },
  anxiety: {
    low: { noun: 'uneasiness', adjective: 'uneasy', color: '#C3D8C6' },
    medium: { noun: 'anxiety', adjective: 'anxious', color: '#A3C6A8' },
    high: { noun: 'dread', adjective: 'dreadful', color: '#83B48A' },
  },
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
 * Get descriptors for a dyad at a specific intensity
 */
export function getDyadDescriptors(
  dyad: EmotionDyad,
  intensity: InterpretedIntensity = 'medium'
): { noun: string; adjective: string; color: string } {
  return DYAD_DESCRIPTORS[dyad][intensity];
}

/**
 * Get descriptors for special emotions
 */
export function getSpecialDescriptors(emotion: 'neutral' | 'mixed'): { noun: string; adjective: string } {
  return SPECIAL_EMOTION_DESCRIPTORS[emotion];
}
