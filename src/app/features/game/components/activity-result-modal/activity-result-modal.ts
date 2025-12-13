/**
 * Activity Result Modal (Phase 2.5)
 * Shows outcome of performing an activity with stat changes
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { Activity, SoloActivityResult, StatChange, OutcomeTier } from '../../../../../../shared/types';

export interface ActivityResultModalData {
  activity: Activity;
  result: SoloActivityResult;
}

@Component({
  selector: 'app-activity-result-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule
  ],
  templateUrl: './activity-result-modal.html',
  styleUrl: './activity-result-modal.css'
})
export class ActivityResultModal {
  private dialogRef = inject(MatDialogRef<ActivityResultModal>);
  data = inject<ActivityResultModalData>(MAT_DIALOG_DATA);

  /**
   * Get display info for outcome tier
   */
  getTierInfo(tier: string): { label: string; icon: string; color: string; description: string } {
    switch (tier) {
      case 'best':
        return {
          label: 'Best Outcome',
          icon: 'stars',
          color: '#ffd700',
          description: 'Everything went perfectly!'
        };
      case 'okay':
        return {
          label: 'Good Outcome',
          icon: 'thumb_up',
          color: '#4caf50',
          description: 'Things went well.'
        };
      case 'mixed':
        return {
          label: 'Mixed Results',
          icon: 'swap_horiz',
          color: '#ff9800',
          description: 'Some good, some not so good.'
        };
      case 'catastrophic':
        return {
          label: 'Catastrophic',
          icon: 'error',
          color: '#f44336',
          description: 'Things went wrong...'
        };
      default:
        return {
          label: 'Unknown',
          icon: 'help',
          color: '#9e9e9e',
          description: ''
        };
    }
  }

  /**
   * Get icon for stat name
   */
  getStatIcon(stat: string): string {
    const icons: Record<string, string> = {
      fitness: 'fitness_center',
      vitality: 'favorite',
      poise: 'self_improvement',
      knowledge: 'school',
      creativity: 'palette',
      ambition: 'trending_up',
      confidence: 'record_voice_over',
      wit: 'lightbulb',
      empathy: 'volunteer_activism'
    };
    return icons[stat] || 'star';
  }

  /**
   * Format stat name for display
   */
  formatStatName(stat: string): string {
    return stat.charAt(0).toUpperCase() + stat.slice(1);
  }

  /**
   * Get stat changes that increased current
   */
  get positiveChanges(): StatChange[] {
    return (this.data.result.statChanges || []).filter(c => c.currentDelta > 0);
  }

  /**
   * Get stat changes that decreased current
   */
  get negativeChanges(): StatChange[] {
    return (this.data.result.statChanges || []).filter(c => c.currentDelta < 0);
  }

  /**
   * Check if activity had a roll outcome
   */
  get hasOutcome(): boolean {
    return !!this.data.result.outcome;
  }

  /**
   * Check if there are any stat changes
   */
  get hasStatChanges(): boolean {
    return (this.data.result.statChanges?.length || 0) > 0;
  }

  /**
   * Get actual energy cost (including outcome effects)
   */
  get actualEnergyCost(): number {
    return this.data.result.actualEnergyCost ?? this.data.activity.energyCost;
  }

  /**
   * Get actual money cost (including outcome effects)
   */
  get actualMoneyCost(): number {
    return this.data.result.actualMoneyCost ?? this.data.activity.moneyCost;
  }

  /**
   * Get actual time cost (including outcome effects)
   */
  get actualTimeCost(): number {
    return this.data.result.actualTimeCost ?? this.data.activity.timeCost;
  }

  /**
   * Check if energy cost was increased by outcome
   */
  get hasAdditionalEnergyCost(): boolean {
    return this.actualEnergyCost < this.data.activity.energyCost;
  }

  /**
   * Check if money cost was increased by outcome
   */
  get hasAdditionalMoneyCost(): boolean {
    return this.actualMoneyCost < this.data.activity.moneyCost;
  }

  /**
   * Check if time cost was increased by outcome
   */
  get hasAdditionalTimeCost(): boolean {
    return this.actualTimeCost > this.data.activity.timeCost;
  }

  /**
   * Check if outcome was a critical success
   */
  get isCritSuccess(): boolean {
    const outcome = this.data.result.outcome;
    if (!outcome || !('isCritSuccess' in outcome)) return false;
    return (outcome as any).isCritSuccess;
  }

  /**
   * Check if outcome was a critical failure
   */
  get isCritFail(): boolean {
    const outcome = this.data.result.outcome;
    if (!outcome || !('isCritFail' in outcome)) return false;
    return (outcome as any).isCritFail;
  }

  /**
   * Get DC value for display
   */
  get dc(): number {
    const outcome = this.data.result.outcome;
    if (!outcome || !('dc' in outcome)) {
      // Fallback to old calculation for backwards compatibility
      return 100 + (this.data.activity.difficulty || 0);
    }
    return (outcome as any).dc;
  }

  /**
   * Calculate outcome probabilities based on current stat and difficulty
   * Replicates backend logic for client-side display
   */
  calculateProbabilities(): Record<OutcomeTier, number> {
    const statValue = this.data.result.outcome?.statBonus || 0;
    const difficulty = this.data.activity.difficulty || 0;
    const dc = 100 + difficulty;

    const BASE_DC = 100;
    const OUTCOME_OFFSETS = { catastrophic: -50, best: 50 };
    const CRIT_RANGES = {
      fail: { min: 2, max: 50 },
      success: { min: 152, max: 200 }
    };

    const counts: Record<OutcomeTier, number> = {
      catastrophic: 0,
      mixed: 0,
      okay: 0,
      best: 0
    };

    let totalCombinations = 0;

    // Simulate all 2d100 rolls
    for (let die1 = 1; die1 <= 100; die1++) {
      for (let die2 = 1; die2 <= 100; die2++) {
        const diceRoll = die1 + die2;
        const total = diceRoll + statValue;

        // Check crits
        const isCritFail = diceRoll >= CRIT_RANGES.fail.min && diceRoll <= CRIT_RANGES.fail.max;
        const isCritSuccess = diceRoll >= CRIT_RANGES.success.min && diceRoll <= CRIT_RANGES.success.max;

        // Determine base tier
        let baseTier: OutcomeTier;
        if (total <= dc + OUTCOME_OFFSETS.catastrophic) baseTier = 'catastrophic';
        else if (total < dc) baseTier = 'mixed';
        else if (total >= dc + OUTCOME_OFFSETS.best) baseTier = 'best';
        else baseTier = 'okay';

        // Apply crit shifts
        let finalTier = baseTier;
        if (isCritSuccess) {
          if (baseTier === 'catastrophic') finalTier = 'mixed';
          else if (baseTier === 'mixed') finalTier = 'okay';
          else if (baseTier === 'okay') finalTier = 'best';
        } else if (isCritFail) {
          if (baseTier === 'best') finalTier = 'okay';
          else if (baseTier === 'okay') finalTier = 'mixed';
          else if (baseTier === 'mixed') finalTier = 'catastrophic';
        }

        counts[finalTier]++;
        totalCombinations++;
      }
    }

    return {
      catastrophic: Math.round((counts.catastrophic / totalCombinations) * 1000) / 10,
      mixed: Math.round((counts.mixed / totalCombinations) * 1000) / 10,
      okay: Math.round((counts.okay / totalCombinations) * 1000) / 10,
      best: Math.round((counts.best / totalCombinations) * 1000) / 10
    };
  }

  /**
   * Get outcome probabilities (memoized for performance)
   */
  private _probabilities?: Record<OutcomeTier, number>;
  get outcomeProbabilities(): Record<OutcomeTier, number> {
    if (!this._probabilities && this.hasOutcome) {
      this._probabilities = this.calculateProbabilities();
    }
    return this._probabilities || { catastrophic: 0, mixed: 0, okay: 0, best: 0 };
  }

  onContinue(): void {
    this.dialogRef.close();
  }
}
