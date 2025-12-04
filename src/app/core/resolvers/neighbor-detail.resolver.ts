/**
 * Neighbor Detail Resolver
 * Ensures all required data is loaded before activating the neighbor detail route
 * Critical for deep links to work properly on page reload
 *
 * Data loading strategy:
 * - Activities: Should be loaded via APP_INITIALIZER, but we ensure they're available here as fallback
 * - NPC: Loaded specifically for this route
 * - Relationship: Loaded specifically for this route
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
  npcLoaded: boolean;
  relationshipLoaded: boolean;
  activitiesLoaded: boolean;
  error?: string;
}

/**
 * Resolver for neighbor detail route
 * Loads all required data before component activation
 */
export const neighborDetailResolver: ResolveFn<NeighborDetailData> = (route) => {
  const facade = inject(GameFacade);
  const npcId = route.paramMap.get('id');

  if (!npcId) {
    return of({
      npcLoaded: false,
      relationshipLoaded: false,
      activitiesLoaded: false,
      error: 'No NPC ID provided'
    });
  }

  // Load NPC, relationship, and ensure activities are available (all in parallel)
  return forkJoin({
    npc: facade.loadNPCById(npcId).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Failed to load NPC:', error);
        return of(false);
      })
    ),
    relationship: facade.getRelationship(npcId).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Failed to load relationship:', error);
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
    map(({ npc, relationship, activities }) => ({
      npcLoaded: npc,
      relationshipLoaded: relationship,
      activitiesLoaded: activities
    }))
  );
};
