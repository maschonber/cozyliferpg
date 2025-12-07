import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Activity, ActivityAvailability } from '../../../../../shared/types';

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
}
