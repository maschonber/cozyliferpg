/**
 * Neighbor Detail Resolver
 * Ensures NPC and relationship data is loaded before activating the neighbor detail route
 * Critical for deep links to work properly on page reload
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
  error?: string;
}

/**
 * Resolver for neighbor detail route
 * Loads NPC and relationship data before component activation
 */
export const neighborDetailResolver: ResolveFn<NeighborDetailData> = (route) => {
  const facade = inject(GameFacade);
  const npcId = route.paramMap.get('id');

  if (!npcId) {
    return of({
      npcLoaded: false,
      relationshipLoaded: false,
      error: 'No NPC ID provided'
    });
  }

  // Load both NPC and relationship in parallel
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
    )
  }).pipe(
    map(({ npc, relationship }) => ({
      npcLoaded: npc,
      relationshipLoaded: relationship
    }))
  );
};
