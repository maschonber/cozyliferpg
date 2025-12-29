/**
 * Neighbor Detail Resolver
 * Ensures all required data is loaded before activating the neighbor detail route
 * Critical for deep links to work properly on page reload
 *
 * Data loading strategy:
 * - Activities: Should be loaded via APP_INITIALIZER, but we ensure they're available here as fallback
 * - PlayerNPC: Unified NPC + relationship data loaded specifically for this route
 */

import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GameFacade } from '../../features/game/services/game.facade';

/**
 * Result of neighbor detail resolution
 */
export interface NeighborDetailData {
  playerNPCLoaded: boolean;
  activitiesLoaded: boolean;
  error?: string;
}

/**
 * Resolver for neighbor detail route
 * Loads all required data before component activation
 */
export const neighborDetailResolver: ResolveFn<NeighborDetailData> = (route) => {
  const facade = inject(GameFacade);
  const playerNPCId = route.paramMap.get('id');

  if (!playerNPCId) {
    return of({
      playerNPCLoaded: false,
      activitiesLoaded: false,
      error: 'No player NPC ID provided'
    });
  }

  // Load player NPC and ensure activities are available (both in parallel)
  return forkJoin({
    playerNPC: facade.loadPlayerNPCById(playerNPCId).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Failed to load player NPC:', error);
        return of(false);
      })
    ),
    // Ensure activities are loaded (this is a fallback - they should already be loaded via APP_INITIALIZER)
    activities: facade.ensureActivitiesLoaded().pipe(
      catchError((error) => {
        console.error('Failed to ensure activities loaded:', error);
        return of(false);
      })
    )
  }).pipe(
    map(({ playerNPC, activities }) => ({
      playerNPCLoaded: playerNPC,
      activitiesLoaded: activities
    }))
  );
};
