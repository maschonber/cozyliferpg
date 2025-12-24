import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  color?: string;
  contributingEmotions?: BaseEmotion[];
}

@Component({
  selector: 'app-emotion-sandbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Decay time input (in minutes)
  decayTimeMinutes = signal(60);

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
   * Apply emotion decay over time
   */
  applyDecay(): void {
    this.loading.set(true);
    this.error.set(null);

    // Convert minutes to hours
    const hours = this.decayTimeMinutes() / 60;

    this.http.post<any>(
      `${this.apiUrl}/apply-decay`,
      {
        vector: this.currentVector(),
        hours: hours
      }
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentVector.set(response.output);
          this.currentInterpretation.set(response.interpretation);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error applying decay:', err);
        this.error.set('Failed to apply emotion decay');
        this.loading.set(false);
      }
    });
  }

  /**
   * Update decay time from input
   */
  updateDecayTime(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    if (!isNaN(value) && value >= 0) {
      this.decayTimeMinutes.set(value);
    }
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
   * Get color for an emotion axis.
   *
   * Uses the color from the interpretation if available, otherwise gray
   */
  getColorForAxis(axis: keyof EmotionVector): string {
    const interp = this.currentInterpretation();
    const contributing = interp?.contributingEmotions ?? [];

    // No interpretation or no contributing emotions → gray
    if (contributing.length === 0 || !interp?.color) {
      return '#94a3b8';
    }

    // Determine which emotion is active on this axis based on value sign
    const value = this.currentVector()[axis];
    const emotions = this.axisEmotions[axis];
    const activeEmotion = value >= 0 ? emotions.positive : emotions.negative;

    // If this emotion is not contributing to the result → gray
    if (!contributing.includes(activeEmotion)) {
      return '#94a3b8';
    }

    // This emotion IS contributing - use the interpretation color
    return interp.color;
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
