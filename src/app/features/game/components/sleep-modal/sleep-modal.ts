import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { SleepResultWithStats, StatChange, StatChangeBreakdown, StatChangeComponent, TimeOfDay } from '../../../../../../shared/types';

export interface SleepModalData {
  sleepResult: SleepResultWithStats;
  previousDay: number;
}

@Component({
  selector: 'app-sleep-modal',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule
  ],
  templateUrl: './sleep-modal.html',
  styleUrl: './sleep-modal.css',
})
export class SleepModal {
  private dialogRef = inject(MatDialogRef<SleepModal>);
  data = inject<SleepModalData>(MAT_DIALOG_DATA);

  /**
   * Check if there are any stat changes
   */
  get hasStatChanges(): boolean {
    return (this.data.sleepResult.statChangeBreakdowns?.length || 0) > 0;
  }

  /**
   * Get stat change breakdowns, creating all stats even if no changes
   */
  get statBreakdowns(): StatChangeBreakdown[] {
    return this.data.sleepResult.statChangeBreakdowns || [];
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
   * Get summary text for a stat change
   */
  getStatSummary(breakdown: StatChangeBreakdown): string {
    const parts: string[] = [];

    if (breakdown.baseChange !== 0) {
      const sign = breakdown.baseChange > 0 ? '+' : '';
      parts.push(`Base ${sign}${breakdown.baseChange.toFixed(1)}`);
    }

    if (breakdown.currentChange !== 0) {
      const sign = breakdown.currentChange > 0 ? '+' : '';
      parts.push(`Current ${sign}${breakdown.currentChange.toFixed(1)}`);
    }

    return parts.join(', ');
  }

  /**
   * Get total change for display
   */
  getTotalChange(breakdown: StatChangeBreakdown): number {
    // Show base change if any, otherwise current change
    return breakdown.baseChange !== 0 ? breakdown.baseChange : breakdown.currentChange;
  }

  /**
   * Check if change is positive
   */
  isPositiveChange(value: number): boolean {
    return value > 0;
  }

  /**
   * Format TimeOfDay to display string (HH:MM)
   */
  formatTimeOfDay(time: TimeOfDay): string {
    const hours = String(time.hours).padStart(2, '0');
    const minutes = String(time.minutes ?? 0).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onContinue(): void {
    this.dialogRef.close();
  }
}
