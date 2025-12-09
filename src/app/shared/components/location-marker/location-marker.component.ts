/**
 * Shared Location Marker Component
 * Displays a location with icon, name, and optional description
 * Reusable across game-home and location-selector views
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LocationId } from '../../../../../shared/types';
import { getLocationIcon } from '../../utils/location.utils';

@Component({
  selector: 'app-location-marker',
  imports: [CommonModule, MatIconModule],
  templateUrl: './location-marker.component.html',
  styleUrl: './location-marker.component.css',
})
export class LocationMarkerComponent {
  /**
   * Location ID to display
   */
  @Input({ required: true }) locationId!: LocationId;

  /**
   * Location name to display
   */
  @Input({ required: true }) locationName!: string;

  /**
   * Optional description text
   */
  @Input() description?: string;

  /**
   * Whether the marker is clickable
   */
  @Input() clickable: boolean = false;

  /**
   * Whether this is the current location
   */
  @Input() isCurrent: boolean = false;

  /**
   * Optional CSS class for custom styling variants
   */
  @Input() variant: 'default' | 'compact' = 'default';

  /**
   * Click event emitter
   */
  @Output() markerClick = new EventEmitter<void>();

  /**
   * Get the icon for the location
   */
  get locationIcon(): string {
    return getLocationIcon(this.locationId);
  }

  /**
   * Handle click event
   */
  onClick(): void {
    if (this.clickable) {
      this.markerClick.emit();
    }
  }
}
