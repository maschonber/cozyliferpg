/**
 * Emotion Config Service
 * Fetches and caches emotion configuration, enriches emotion interpretations
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  EmotionInterpretationResult,
  BaseEmotion,
  EmotionDyad,
  InterpretedIntensity
} from '../../../../shared/types';

/** Enriched emotion interpretation with descriptors */
export interface EnrichedEmotion extends EmotionInterpretationResult {
  noun?: string;
  adjective?: string;
  color?: string;
}

/** Emotion descriptor from config */
interface EmotionDescriptor {
  noun: string;
  adjective: string;
  color: string;
}

/** Config response from the API */
interface EmotionConfig {
  emotions: {
    base: {
      [key in BaseEmotion]: {
        low: EmotionDescriptor;
        medium: EmotionDescriptor;
        high: EmotionDescriptor;
      };
    };
    dyads: {
      [key in EmotionDyad]: {
        low: EmotionDescriptor;
        medium: EmotionDescriptor;
        high: EmotionDescriptor;
      };
    };
    special: {
      neutral: { noun: string; adjective: string };
      mixed: { noun: string; adjective: string };
    };
  };
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmotionConfigService {
  private http = inject(HttpClient);

  private config = signal<EmotionConfig | null>(null);
  private loading = signal(false);
  private loaded = signal(false);

  /** Whether config has been loaded */
  isLoaded = computed(() => this.loaded());

  /**
   * Ensure config is loaded (call once on app init or when needed)
   */
  ensureLoaded(): void {
    if (this.loaded() || this.loading()) return;

    this.loading.set(true);
    this.http.get<{ success: boolean } & EmotionConfig>(
      `${environment.apiUrl}/emotion-sandbox/config`
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.config.set(response);
          this.loaded.set(true);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching emotion config:', err);
        this.loading.set(false);
      }
    });
  }

  /**
   * Enrich a slim interpretation result with config descriptors
   */
  enrich(result: EmotionInterpretationResult | null | undefined): EnrichedEmotion | null {
    if (!result) return null;

    const cfg = this.config();
    if (!cfg) {
      // Config not loaded yet - return without descriptors
      return result;
    }

    const { emotion, intensity } = result;

    // Handle special emotions (neutral, mixed) - no color
    if (emotion === 'neutral' || emotion === 'mixed') {
      const special = cfg.emotions.special[emotion as 'neutral' | 'mixed'];
      return {
        ...result,
        noun: special.noun,
        adjective: special.adjective
      };
    }

    // For base emotions and dyads, we need an intensity level
    const level: InterpretedIntensity = intensity || 'medium';

    // Check if it's a base emotion
    if (emotion in cfg.emotions.base) {
      const baseEmotions = cfg.emotions.base as Record<BaseEmotion, Record<InterpretedIntensity, EmotionDescriptor>>;
      const descriptors = baseEmotions[emotion as BaseEmotion][level];
      return {
        ...result,
        noun: descriptors.noun,
        adjective: descriptors.adjective,
        color: descriptors.color
      };
    }

    // Must be a dyad
    if (emotion in cfg.emotions.dyads) {
      const dyadEmotions = cfg.emotions.dyads as Record<EmotionDyad, Record<InterpretedIntensity, EmotionDescriptor>>;
      const descriptors = dyadEmotions[emotion as EmotionDyad][level];
      return {
        ...result,
        noun: descriptors.noun,
        adjective: descriptors.adjective,
        color: descriptors.color
      };
    }

    // Fallback - return as-is
    return result;
  }
}
