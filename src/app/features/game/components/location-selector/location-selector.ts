/**
 * Location Selector Modal (Phase 3)
 * Allows player to view all locations and travel between them
 */

import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { GameFacade } from '../../services/game.facade';
import { LocationWithNPCCount, District } from '../../../../../../shared/types';

@Component({
  selector: 'app-location-selector',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  templateUrl: './location-selector.html',
  styleUrl: './location-selector.css',
})
export class LocationSelector {
  private dialogRef = inject(MatDialogRef<LocationSelector>);
  private facade = inject(GameFacade);

  // Expose facade signals
  locations = this.facade.locations;
  locationsLoading = this.facade.locationsLoading;
  player = this.facade.player;
  traveling = this.facade.traveling;

  // Districts array for template iteration
  readonly districts: District[] = ['residential', 'downtown', 'waterfront'];

  // Group locations by district
  locationsByDistrict = computed(() => {
    const locs = this.locations();
    const districts: Record<District, LocationWithNPCCount[]> = {
      residential: [],
      downtown: [],
      waterfront: []
    };

    locs.forEach(loc => {
      districts[loc.district].push(loc);
    });

    return districts;
  });

  /**
   * Get display name for district
   */
  getDistrictName(district: District): string {
    const names: Record<District, string> = {
      'residential': 'Residential',
      'downtown': 'Downtown',
      'waterfront': 'Waterfront'
    };
    return names[district];
  }

  /**
   * Get icon for location
   */
  getLocationIcon(locationId: string): string {
    const icons: Record<string, string> = {
      'home': 'home',
      'park': 'park',
      'coffee_shop': 'local_cafe',
      'library': 'local_library',
      'shopping_district': 'shopping_bag',
      'gym': 'fitness_center',
      'movie_theater': 'movie',
      'beach': 'beach_access',
      'boardwalk': 'deck',
      'bar': 'local_bar'
    };
    return icons[locationId] || 'place';
  }

  /**
   * Check if location is current location
   */
  isCurrentLocation(locationId: string): boolean {
    const player = this.player();
    return player?.currentLocation === locationId;
  }

  /**
   * Travel to selected location
   */
  onTravelTo(locationId: string): void {
    if (this.isCurrentLocation(locationId)) {
      // Already at this location
      return;
    }

    this.facade.travel(locationId).subscribe({
      next: () => {
        console.log(`Traveled to ${locationId}`);
        // Modal stays open to show updated NPC counts
      },
      error: (error) => {
        console.error('Failed to travel:', error);
        alert('Failed to travel. Please try again.');
      }
    });
  }

  /**
   * Quick travel home
   */
  onGoHome(): void {
    if (this.isCurrentLocation('home')) {
      // Already at home
      return;
    }

    this.facade.goHome().subscribe({
      next: () => {
        console.log('Traveled home');
        // Modal stays open to show updated state
      },
      error: (error) => {
        console.error('Failed to go home:', error);
        alert('Failed to go home. Please try again.');
      }
    });
  }

  /**
   * Close modal
   */
  onClose(): void {
    this.dialogRef.close();
  }
}
