/**
 * Location Selector View (Phase 3)
 * Full-screen view for traveling between locations
 */

import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GameFacade } from '../../services/game.facade';
import { LocationWithNPCCount, District } from '../../../../../../shared/types';

@Component({
  selector: 'app-location-selector',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './location-selector.html',
  styleUrl: './location-selector.css',
})
export class LocationSelector implements OnInit {
  private router = inject(Router);
  private facade = inject(GameFacade);

  // Expose facade signals
  locations = this.facade.locations;
  locationsLoading = this.facade.locationsLoading;
  player = this.facade.player;
  traveling = this.facade.traveling;

  // Districts array for template iteration
  readonly districts: District[] = ['residential', 'downtown', 'waterfront'];

  ngOnInit(): void {
    // Ensure locations are loaded when view is opened
    if (this.locations().length === 0) {
      this.facade.loadLocations();
    }
  }

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
      'residential': 'Residential Quarter',
      'downtown': 'Town Center',
      'waterfront': 'Waterfront'
    };
    return names[district];
  }

  /**
   * Get icon for district
   */
  getDistrictIcon(district: District): string {
    const icons: Record<District, string> = {
      'residential': 'home_work',
      'downtown': 'location_city',
      'waterfront': 'waves'
    };
    return icons[district];
  }

  /**
   * Get display name for location
   */
  getLocationDisplayName(locationId: string): string {
    const names: Record<string, string> = {
      'home': 'Home',
      'park': 'Neighborhood Park',
      'coffee_shop': 'Corner Coffee Shop',
      'library': 'Public Library',
      'shopping_district': 'Shopping District',
      'gym': 'Fitness Center',
      'movie_theater': 'Movie Theater',
      'beach': 'Beach',
      'boardwalk': 'Boardwalk',
      'bar': 'Seaside Bar & Grill'
    };
    return names[locationId] || locationId;
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
        // Navigate back to game home after traveling
        this.router.navigate(['/game']);
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
        // Navigate back to game home after traveling
        this.router.navigate(['/game']);
      },
      error: (error) => {
        console.error('Failed to go home:', error);
        alert('Failed to go home. Please try again.');
      }
    });
  }

  /**
   * Navigate back to game home
   */
  onBack(): void {
    this.router.navigate(['/game']);
  }
}
