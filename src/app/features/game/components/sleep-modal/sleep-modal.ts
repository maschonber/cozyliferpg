import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { SleepResultWithStats, StatChange } from '../../../../../../shared/types';

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
    MatDividerModule
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
    return (this.data.sleepResult.baseGrowth?.length || 0) > 0 ||
           (this.data.sleepResult.currentDecay?.length || 0) > 0;
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

  onContinue(): void {
    this.dialogRef.close();
  }
}
