/**
 * Emotion Display Component
 * Renders an emotion interpretation with Plutchik-style colored display
 *
 * Input: EmotionInterpretationResult (slim, from API)
 * Output: Enriched display with adjective, color, details
 */

import { Component, input, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmotionInterpretationResult } from '../../../../../shared/types';
import { EmotionConfigService, EnrichedEmotion } from '../../services/emotion-config.service';

@Component({
  selector: 'app-emotion-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (enriched(); as e) {
      <div
        class="emotion-interpretation"
        [style.background-color]="e.color || '#94a3b8'">
        <div class="interpretation-adjective">{{ e.adjective || e.emotion }}</div>
        <div class="interpretation-details">
          {{ e.emotion }}@if (e.intensity) { ({{ e.intensity }})}@if (contributorText(); as contributors) { · {{ contributors }}}
        </div>
      </div>
    }
  `,
  styles: [`
    .emotion-interpretation {
      padding: 1.25rem;
      border-radius: 0.75rem;
      color: black;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .interpretation-adjective {
      font-size: 1.75rem;
      font-weight: 700;
      text-transform: capitalize;
      margin-bottom: 0.25rem;
    }

    .interpretation-details {
      font-size: 0.8rem;
      opacity: 0.75;
      text-transform: capitalize;
    }
  `]
})
export class EmotionDisplayComponent implements OnInit {
  private configService = inject(EmotionConfigService);

  /** The emotion interpretation to display */
  emotion = input<EmotionInterpretationResult | null | undefined>(null);

  /** Enriched emotion with adjective, color, etc. */
  enriched = computed<EnrichedEmotion | null>(() => {
    return this.configService.enrich(this.emotion());
  });

  /** Text showing contributing emotions for dyads */
  contributorText = computed<string | null>(() => {
    const e = this.emotion();
    if (!e?.contributingEmotions || e.contributingEmotions.length <= 1) {
      return null;
    }
    return e.contributingEmotions.join(' + ');
  });

  ngOnInit(): void {
    // Ensure config is loaded
    this.configService.ensureLoaded();
  }
}
