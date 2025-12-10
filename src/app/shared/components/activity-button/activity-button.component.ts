import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Activity, ActivityAvailability, StatName, PlayerStats } from '../../../../../shared/types';

/**
 * Stat requirement display info
 */
interface StatRequirementDisplay {
  stat: StatName;
  label: string;
  required: number;
  current: number;
  met: boolean;
}

@Component({
  selector: 'app-activity-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './activity-button.component.html',
  styleUrl: './activity-button.component.css'
})
export class ActivityButtonComponent {
  // Input: Activity data
  @Input({ required: true }) activity!: Activity;

  // Input: Availability information
  @Input() availability?: ActivityAvailability;

  // Input: Whether interaction is in progress
  @Input() disabled = false;

  // Input: Optional effects to display (for social activities)
  @Input() effects?: { friendship?: number; romance?: number };

  // Input: Visual variant (for positive/negative coloring)
  @Input() variant: 'default' | 'positive' | 'negative' = 'default';

  // Input: Player stats for checking stat requirements (Phase 2.5)
  @Input() playerStats?: PlayerStats;

  // Output: Click event
  @Output() activityClick = new EventEmitter<string>();

  // Expose Math for template
  Math = Math;

  onClick() {
    if (!this.disabled && this.isAvailable()) {
      this.activityClick.emit(this.activity.id);
    }
  }

  isAvailable(): boolean {
    return this.availability?.available ?? true;
  }

  getTooltip(): string {
    if (!this.availability || this.availability.available) {
      return '';
    }
    return this.availability.reason || 'Activity not available';
  }

  formatTimeCost(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  /**
   * Check if activity has stat requirements
   */
  hasStatRequirements(): boolean {
    return !!(this.activity.statRequirements &&
              Object.keys(this.activity.statRequirements).length > 0);
  }

  /**
   * Get stat requirement display info
   */
  getStatRequirements(): StatRequirementDisplay[] {
    if (!this.activity.statRequirements) return [];

    const statLabels: Record<StatName, string> = {
      fitness: 'FIT',
      vitality: 'VIT',
      poise: 'POI',
      knowledge: 'KNO',
      creativity: 'CRE',
      ambition: 'AMB',
      confidence: 'CON',
      wit: 'WIT',
      empathy: 'EMP'
    };

    return Object.entries(this.activity.statRequirements).map(([stat, required]) => {
      const statName = stat as StatName;
      const current = this.playerStats ? this.getBaseStat(statName) : 0;
      return {
        stat: statName,
        label: statLabels[statName] || stat.toUpperCase().substring(0, 3),
        required: required as number,
        current,
        met: current >= (required as number)
      };
    });
  }

  /**
   * Get base stat from player stats
   */
  private getBaseStat(stat: StatName): number {
    if (!this.playerStats) return 0;
    const key = `base${stat.charAt(0).toUpperCase()}${stat.slice(1)}` as keyof PlayerStats;
    return this.playerStats[key] as number;
  }

  /**
   * Get icon for stat
   */
  getStatIcon(stat: StatName): string {
    const icons: Record<StatName, string> = {
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
}
