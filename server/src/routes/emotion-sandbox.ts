import { Router, Request, Response } from 'express';
import {
  applyEmotionPulls,
  interpretEmotionVector,
} from '../services/plutchik-emotion';
import {
  EmotionVector,
  EmotionPull,
  BaseEmotion,
  EmotionIntensity,
  NEUTRAL_EMOTION_VECTOR,
} from '../services/plutchik-emotion/types';
import {
  HIGH_INTENSITY_THRESHOLD,
  MEDIUM_INTENSITY_THRESHOLD,
  LOW_INTENSITY_THRESHOLD,
  DYAD_THRESHOLD,
} from '../services/plutchik-emotion/interpretation-config';

const router = Router();

/**
 * Emotion Sandbox API
 *
 * Simple API for testing the Plutchik emotion system.
 * No authentication required - this is a development/testing endpoint.
 */

/**
 * POST /api/emotion-sandbox/apply-pulls
 *
 * Apply emotion pull(s) to a vector and return the result
 *
 * Request body:
 * {
 *   vector?: EmotionVector,  // Optional, defaults to neutral
 *   pulls: EmotionPull[]      // 1-2 emotion pulls
 * }
 *
 * Response:
 * {
 *   input: EmotionVector,
 *   output: EmotionVector,
 *   pulls: EmotionPull[],
 *   interpretation: EmotionInterpretation
 * }
 */
router.post('/apply-pulls', (req: Request, res: Response) => {
  try {
    const { vector, pulls } = req.body;

    // Validate pulls
    if (!pulls || !Array.isArray(pulls) || pulls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'pulls array is required and must contain at least one pull',
      });
    }

    if (pulls.length > 2) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 2 pulls allowed',
      });
    }

    // Validate each pull
    const validEmotions: BaseEmotion[] = [
      'joy',
      'sadness',
      'acceptance',
      'disgust',
      'anger',
      'fear',
      'anticipation',
      'surprise',
    ];
    const validIntensities: EmotionIntensity[] = [
      'tiny',
      'small',
      'medium',
      'large',
      'huge',
    ];

    for (const pull of pulls) {
      if (!pull.emotion || !validEmotions.includes(pull.emotion)) {
        return res.status(400).json({
          success: false,
          error: `Invalid emotion: ${pull.emotion}. Must be one of: ${validEmotions.join(', ')}`,
        });
      }
      if (!pull.intensity || !validIntensities.includes(pull.intensity)) {
        return res.status(400).json({
          success: false,
          error: `Invalid intensity: ${pull.intensity}. Must be one of: ${validIntensities.join(', ')}`,
        });
      }
    }

    // Use provided vector or default to neutral
    const inputVector: EmotionVector = vector || NEUTRAL_EMOTION_VECTOR;

    // Apply the pulls
    const outputVector = applyEmotionPulls(inputVector, pulls);

    // Interpret the result
    const interpretation = interpretEmotionVector(outputVector);

    return res.json({
      success: true,
      input: inputVector,
      output: outputVector,
      pulls,
      interpretation,
    });
  } catch (error) {
    console.error('Emotion sandbox error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to apply emotion pulls',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/emotion-sandbox/reset
 *
 * Returns a neutral emotion vector
 *
 * Response:
 * {
 *   vector: EmotionVector
 * }
 */
router.get('/reset', (req: Request, res: Response) => {
  return res.json({
    success: true,
    vector: NEUTRAL_EMOTION_VECTOR,
  });
});

/**
 * GET /api/emotion-sandbox/config
 *
 * Returns interpretation configuration (thresholds)
 *
 * Response:
 * {
 *   thresholds: {
 *     high: number,
 *     medium: number,
 *     low: number,
 *     dyad: number
 *   }
 * }
 */
router.get('/config', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    thresholds: {
      high: HIGH_INTENSITY_THRESHOLD,
      medium: MEDIUM_INTENSITY_THRESHOLD,
      low: LOW_INTENSITY_THRESHOLD,
      dyad: DYAD_THRESHOLD,
    },
  });
});

export default router;
