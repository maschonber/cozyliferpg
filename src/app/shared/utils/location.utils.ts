/**
 * Shared utilities for location-related functionality
 */

import { LocationId } from '../../../../shared/types';

/**
 * Get display name for location
 */
export function getLocationDisplayName(locationId: LocationId): string {
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
export function getLocationIcon(locationId: LocationId): string {
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
