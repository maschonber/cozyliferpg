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
import { Activity, SoloActivityResult, StatChange } from '../../../../../../shared/types';

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
    MatDividerModule
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

  onContinue(): void {
    this.dialogRef.close();
  }
}
