/**
 * Shared utilities for location-related functionality
 */

import { LocationId, District } from '../../../../shared/types';

/**
 * District color schemes for visual differentiation
 */
export interface DistrictColors {
  primary: string;
  light: string;
  gradient: string;
}

/**
 * Get color scheme for a district
 */
export function getDistrictColors(district: District): DistrictColors {
  const colors: Record<District, DistrictColors> = {
    'residential': {
      primary: '#7b1fa2',  // Purple - cozy, home-like
      light: 'rgba(123, 31, 162, 0.08)',
      gradient: 'linear-gradient(135deg, rgba(123, 31, 162, 0.08) 0%, rgba(123, 31, 162, 0.04) 100%)'
    },
    'downtown': {
      primary: '#1976d2',  // Blue - professional, urban
      light: 'rgba(25, 118, 210, 0.08)',
      gradient: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.04) 100%)'
    },
    'waterfront': {
      primary: '#0097a7',  // Cyan - water, coastal
      light: 'rgba(0, 151, 167, 0.08)',
      gradient: 'linear-gradient(135deg, rgba(0, 151, 167, 0.08) 0%, rgba(0, 151, 167, 0.04) 100%)'
    }
  };
  return colors[district];
}

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
