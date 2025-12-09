/**
 * Location Service Tests (Phase 3)
 */

import { describe, test, expect } from '@jest/globals';
import {
  LOCATIONS,
  getLocation,
  getAllLocations,
  getLocationsByDistrict,
  calculateTravelTime,
  isLocationOpen,
} from './index';

describe('Location Service', () => {
  describe('getLocation', () => {
    test('returns correct location by ID', () => {
      const home = getLocation('home');
      expect(home.id).toBe('home');
      expect(home.name).toBe('Home');
      expect(home.district).toBe('residential');
    });

    test('returns all defined locations', () => {
      expect(getLocation('park').id).toBe('park');
      expect(getLocation('coffee_shop').id).toBe('coffee_shop');
      expect(getLocation('library').id).toBe('library');
      expect(getLocation('shopping_district').id).toBe('shopping_district');
      expect(getLocation('gym').id).toBe('gym');
      expect(getLocation('movie_theater').id).toBe('movie_theater');
      expect(getLocation('beach').id).toBe('beach');
      expect(getLocation('boardwalk').id).toBe('boardwalk');
      expect(getLocation('bar').id).toBe('bar');
    });
  });

  describe('getAllLocations', () => {
    test('returns array of all 10 locations', () => {
      const locations = getAllLocations();
      expect(locations).toHaveLength(10);
    });
  });

  describe('getLocationsByDistrict', () => {
    test('returns 3 locations in residential district', () => {
      const residential = getLocationsByDistrict('residential');
      expect(residential).toHaveLength(3);
      expect(residential.map(l => l.id)).toContain('home');
      expect(residential.map(l => l.id)).toContain('park');
      expect(residential.map(l => l.id)).toContain('coffee_shop');
    });

    test('returns 4 locations in downtown district', () => {
      const downtown = getLocationsByDistrict('downtown');
      expect(downtown).toHaveLength(4);
      expect(downtown.map(l => l.id)).toContain('library');
      expect(downtown.map(l => l.id)).toContain('shopping_district');
      expect(downtown.map(l => l.id)).toContain('gym');
      expect(downtown.map(l => l.id)).toContain('movie_theater');
    });

    test('returns 3 locations in waterfront district', () => {
      const waterfront = getLocationsByDistrict('waterfront');
      expect(waterfront).toHaveLength(3);
      expect(waterfront.map(l => l.id)).toContain('beach');
      expect(waterfront.map(l => l.id)).toContain('boardwalk');
      expect(waterfront.map(l => l.id)).toContain('bar');
    });
  });

  describe('calculateTravelTime', () => {
    test('returns 0 for same location', () => {
      expect(calculateTravelTime('home', 'home')).toBe(0);
      expect(calculateTravelTime('park', 'park')).toBe(0);
    });

    test('returns 5 minutes within same district (residential)', () => {
      expect(calculateTravelTime('home', 'park')).toBe(5);
      expect(calculateTravelTime('park', 'coffee_shop')).toBe(5);
      expect(calculateTravelTime('coffee_shop', 'home')).toBe(5);
    });

    test('returns 5 minutes within same district (downtown)', () => {
      expect(calculateTravelTime('library', 'gym')).toBe(5);
      expect(calculateTravelTime('shopping_district', 'movie_theater')).toBe(5);
    });

    test('returns 5 minutes within same district (waterfront)', () => {
      expect(calculateTravelTime('beach', 'boardwalk')).toBe(5);
      expect(calculateTravelTime('boardwalk', 'bar')).toBe(5);
    });

    test('returns 15 minutes between different districts', () => {
      // Residential to Downtown
      expect(calculateTravelTime('home', 'library')).toBe(15);
      expect(calculateTravelTime('park', 'gym')).toBe(15);

      // Residential to Waterfront
      expect(calculateTravelTime('home', 'beach')).toBe(15);
      expect(calculateTravelTime('coffee_shop', 'bar')).toBe(15);

      // Downtown to Waterfront
      expect(calculateTravelTime('library', 'beach')).toBe(15);
      expect(calculateTravelTime('gym', 'boardwalk')).toBe(15);
    });
  });

  describe('isLocationOpen', () => {
    test('24/7 locations are always open', () => {
      // Home, Park, Beach are always open
      expect(isLocationOpen('home', '03:00')).toBe(true);
      expect(isLocationOpen('park', '23:30')).toBe(true);
      expect(isLocationOpen('beach', '04:00')).toBe(true);
    });

    test('coffee shop (06:00-22:00) operating hours', () => {
      expect(isLocationOpen('coffee_shop', '05:59')).toBe(false);
      expect(isLocationOpen('coffee_shop', '06:00')).toBe(true);
      expect(isLocationOpen('coffee_shop', '12:00')).toBe(true);
      expect(isLocationOpen('coffee_shop', '21:59')).toBe(true);
      expect(isLocationOpen('coffee_shop', '22:00')).toBe(false);
      expect(isLocationOpen('coffee_shop', '23:00')).toBe(false);
    });

    test('library (08:00-20:00) operating hours', () => {
      expect(isLocationOpen('library', '07:59')).toBe(false);
      expect(isLocationOpen('library', '08:00')).toBe(true);
      expect(isLocationOpen('library', '14:00')).toBe(true);
      expect(isLocationOpen('library', '19:59')).toBe(true);
      expect(isLocationOpen('library', '20:00')).toBe(false);
    });

    test('bar (11:00-02:00) operates past midnight', () => {
      expect(isLocationOpen('bar', '10:59')).toBe(false);
      expect(isLocationOpen('bar', '11:00')).toBe(true);
      expect(isLocationOpen('bar', '18:00')).toBe(true);
      expect(isLocationOpen('bar', '23:30')).toBe(true);
      expect(isLocationOpen('bar', '00:30')).toBe(true); // After midnight
      expect(isLocationOpen('bar', '01:59')).toBe(true);
      expect(isLocationOpen('bar', '02:00')).toBe(false);
      expect(isLocationOpen('bar', '03:00')).toBe(false);
    });

    test('gym (05:00-23:00) early morning hours', () => {
      expect(isLocationOpen('gym', '04:59')).toBe(false);
      expect(isLocationOpen('gym', '05:00')).toBe(true);
      expect(isLocationOpen('gym', '06:00')).toBe(true);
      expect(isLocationOpen('gym', '22:59')).toBe(true);
      expect(isLocationOpen('gym', '23:00')).toBe(false);
    });

    test('movie theater (12:00-23:00) matinee and evening', () => {
      expect(isLocationOpen('movie_theater', '11:59')).toBe(false);
      expect(isLocationOpen('movie_theater', '12:00')).toBe(true);
      expect(isLocationOpen('movie_theater', '20:00')).toBe(true);
      expect(isLocationOpen('movie_theater', '22:59')).toBe(true);
      expect(isLocationOpen('movie_theater', '23:00')).toBe(false);
    });
  });
});
