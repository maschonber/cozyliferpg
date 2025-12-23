import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface EmotionVector {
  joySadness: number;
  acceptanceDisgust: number;
  angerFear: number;
  anticipationSurprise: number;
}

type BaseEmotion =
  | 'joy' | 'sadness'
  | 'acceptance' | 'disgust'
  | 'anger' | 'fear'
  | 'anticipation' | 'surprise';

type EmotionIntensity = 'tiny' | 'small' | 'medium' | 'large' | 'huge';

interface EmotionPull {
  emotion: BaseEmotion;
  intensity: EmotionIntensity;
}

type InterpretedIntensity = 'low' | 'medium' | 'high';

type EmotionDyad =
  | 'love' | 'guilt' | 'delight' | 'pride'
  | 'submission' | 'curiosity' | 'sentimentality'
  | 'despair' | 'shame' | 'awe'
  | 'disappointment' | 'unbelief'
  | 'envy' | 'pessimism'
  | 'remorse' | 'contempt' | 'cynicism'
  | 'dominance' | 'aggression'
  | 'optimism' | 'anxiety' | 'fatalism';

type SpecialEmotion = 'neutral' | 'mixed';

type InterpretedEmotion = BaseEmotion | EmotionDyad | SpecialEmotion;

interface EmotionInterpretation {
  emotion: InterpretedEmotion;
  intensity?: InterpretedIntensity;
  noun?: string;
  adjective?: string;
  contributingEmotions?: BaseEmotion[];
}

@Component({
  selector: 'app-emotion-sandbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './emotion-sandbox.component.html',
  styleUrls: ['./emotion-sandbox.component.css']
})
export class EmotionSandboxComponent {
  private apiUrl = `${environment.apiUrl}/emotion-sandbox`;

  // Current emotion vector
  currentVector = signal<EmotionVector>({
    joySadness: 0,
    acceptanceDisgust: 0,
    angerFear: 0,
    anticipationSurprise: 0,
  });

  // Current emotion interpretation
  currentInterpretation = signal<EmotionInterpretation | null>(null);

  // Available options
  emotions: BaseEmotion[] = [
    'joy', 'sadness',
    'acceptance', 'disgust',
    'anger', 'fear',
    'anticipation', 'surprise'
  ];

  intensities: EmotionIntensity[] = ['tiny', 'small', 'medium', 'large', 'huge'];

  // Loading state
  loading = signal(false);
  error = signal<string | null>(null);

  // Secondary pull selection (optional)
  secondaryPull = signal<EmotionPull | null>(null);

  // Expose Math for template
  Math = Math;

  constructor(private http: HttpClient) {}

  /**
   * Apply primary pull (and secondary if selected)
   */
  applyPrimaryPull(emotion: BaseEmotion, intensity: EmotionIntensity): void {
    this.loading.set(true);
    this.error.set(null);

    const pulls: EmotionPull[] = [{ emotion, intensity }];
    const secondary = this.secondaryPull();
    if (secondary) {
      pulls.push(secondary);
    }

    this.http.post<any>(
      `${this.apiUrl}/apply-pulls`,
      {
        vector: this.currentVector(),
        pulls: pulls
      }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentVector.set(response.output);
          this.currentInterpretation.set(response.interpretation);
          this.secondaryPull.set(null); // Clear secondary after applying
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error applying pulls:', err);
        this.error.set('Failed to apply emotion pulls');
        this.loading.set(false);
      }
    });
  }

  /**
   * Toggle secondary pull selection
   */
  toggleSecondaryPull(emotion: BaseEmotion, intensity: EmotionIntensity): void {
    const current = this.secondaryPull();

    // If clicking the same one, deselect it
    if (current && current.emotion === emotion && current.intensity === intensity) {
      this.secondaryPull.set(null);
    } else {
      // Otherwise, select this one
      this.secondaryPull.set({ emotion, intensity });
    }
  }

  /**
   * Check if this is the selected secondary pull
   */
  isSecondaryPull(emotion: BaseEmotion, intensity: EmotionIntensity): boolean {
    const secondary = this.secondaryPull();
    return secondary !== null && secondary.emotion === emotion && secondary.intensity === intensity;
  }

  /**
   * Clear secondary pull selection
   */
  clearSecondary(): void {
    this.secondaryPull.set(null);
  }

  /**
   * Reset to neutral state
   */
  reset(): void {
    this.currentVector.set({
      joySadness: 0,
      acceptanceDisgust: 0,
      angerFear: 0,
      anticipationSurprise: 0,
    });
    this.currentInterpretation.set(null);
    this.error.set(null);
  }

  /**
   * Get emotion label for display
   */
  getEmotionLabel(axis: keyof EmotionVector): string {
    const labels: Record<keyof EmotionVector, string> = {
      joySadness: 'Joy ↔ Sadness',
      acceptanceDisgust: 'Acceptance ↔ Disgust',
      angerFear: 'Anger ↔ Fear',
      anticipationSurprise: 'Anticipation ↔ Surprise'
    };
    return labels[axis];
  }

  /**
   * Map from axis key to the emotions on each side (positive, negative)
   */
  private readonly axisEmotions: Record<keyof EmotionVector, { positive: BaseEmotion; negative: BaseEmotion }> = {
    joySadness: { positive: 'joy', negative: 'sadness' },
    acceptanceDisgust: { positive: 'acceptance', negative: 'disgust' },
    angerFear: { positive: 'anger', negative: 'fear' },
    anticipationSurprise: { positive: 'anticipation', negative: 'surprise' },
  };

  /**
   * Color constants
   */
  private readonly colors = {
    gray: '#94a3b8',           // Non-contributing emotions
    dyad: '#8b5cf6',           // Dyad contributing emotions (violet)
    intensityLow: '#86efac',   // Single emotion - low intensity (green-300)
    intensityMedium: '#22c55e', // Single emotion - medium intensity (green-500)
    intensityHigh: '#15803d',  // Single emotion - high intensity (green-700)
  };

  /**
   * Get color for an emotion axis.
   *
   * Coloring logic:
   * - If the axis's active emotion is NOT in contributingEmotions → gray
   * - If it IS contributing and there are 2 contributors (dyad) → dyad color
   * - If it IS contributing and there is 1 contributor → intensity-based color
   */
  getColorForAxis(axis: keyof EmotionVector): string {
    const interp = this.currentInterpretation();
    const contributing = interp?.contributingEmotions ?? [];

    // No interpretation or no contributing emotions → gray
    if (contributing.length === 0) {
      return this.colors.gray;
    }

    // Determine which emotion is active on this axis based on value sign
    const value = this.currentVector()[axis];
    const emotions = this.axisEmotions[axis];
    const activeEmotion = value >= 0 ? emotions.positive : emotions.negative;

    // If this emotion is not contributing to the result → gray
    if (!contributing.includes(activeEmotion)) {
      return this.colors.gray;
    }

    // This emotion IS contributing
    if (contributing.length === 2) {
      // Dyad: two emotions contributed
      return this.colors.dyad;
    }

    // Single emotion: color by intensity
    const intensity = interp?.intensity;
    if (intensity === 'high') {
      return this.colors.intensityHigh;
    } else if (intensity === 'medium') {
      return this.colors.intensityMedium;
    } else {
      return this.colors.intensityLow;
    }
  }

  /**
   * Format number for display
   */
  formatValue(value: number): string {
    return value.toFixed(2);
  }

  /**
   * Get all axis keys for iteration
   */
  get axisKeys(): (keyof EmotionVector)[] {
    return ['joySadness', 'acceptanceDisgust', 'angerFear', 'anticipationSurprise'];
  }

  /**
   * Get axis value
   */
  getAxisValue(axis: keyof EmotionVector): number {
    return this.currentVector()[axis];
  }

  /**
   * Get absolute axis value for bar width
   */
  getAbsoluteAxisValue(axis: keyof EmotionVector): number {
    return Math.abs(this.currentVector()[axis]);
  }

  /**
   * Check if axis value is negative (for bar alignment)
   */
  isAxisNegative(axis: keyof EmotionVector): boolean {
    return this.currentVector()[axis] < 0;
  }
}
