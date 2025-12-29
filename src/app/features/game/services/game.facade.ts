/**
 * Game Facade
 * Provides a clean API for game operations
 * Orchestrates between store, repository, and business logic
 */

import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, map, catchError, switchMap } from 'rxjs/operators';
import { GameStore } from '../store/game.store';
import { GameRepository } from './game.repository';
import { NpcView, PlayerCharacter, SleepResult, ActivityResult } from '../../../../../shared/types';

@Injectable({
  providedIn: 'root'
})
export class GameFacade {
  private store = inject(GameStore);
  private repository = inject(GameRepository);

  // Expose signals from store for components
  player = this.store.player;
  playerLoading = this.store.playerLoading;
  playerError = this.store.playerError;

  npcs = this.store.npcs;
  npcsLoading = this.store.npcsLoading;
  npcsError = this.store.npcsError;

  selectedNpc = this.store.selectedNpc;
  selectedNpcId = this.store.selectedNpcId;

  npcsAtCurrentLocation = this.store.npcsAtCurrentLocation;

  activities = this.store.activities;
  activityAvailability = this.store.activityAvailability;
  activitiesLoading = this.store.activitiesLoading;
  activitiesError = this.store.activitiesError;

  interacting = this.store.interacting;
  interactionError = this.store.interactionError;
  isLoading = this.store.isLoading;

  locations = this.store.locations;
  locationsLoading = this.store.locationsLoading;
  locationsError = this.store.locationsError;
  traveling = this.store.traveling;

  // ===== Initialization =====

  /**
   * Initialize game data on startup
   * Loads player, NPCs, activities, and locations
   */
  initialize(): void {
    this.loadPlayer();
    this.loadNpcs();
    this.loadActivities();
    this.loadLocations();
  }

  /**
   * Ensure activities are loaded (for use in resolvers/components)
   * Returns immediately if already loaded, otherwise loads and waits
   */
  ensureActivitiesLoaded(): Observable<boolean> {
    // If activities are already loaded, return immediately
    if (this.store.activities().length > 0) {
      return of(true);
    }

    // Otherwise, load them
    this.store.setActivitiesLoading(true);

    return this.repository.getActivities().pipe(
      tap((data) => {
        this.store.setActivities(data.activities, data.availability);
        console.log(`✅ Loaded ${data.activities.length} activities`);
      }),
      map(() => true),
      catchError((error) => {
        const errorMessage = error.message || 'Failed to load activities';
        this.store.setActivitiesError(errorMessage);
        console.error('❌ Failed to load activities:', error);
        return of(false);
      })
    );
  }

  // ===== NPC Operations =====

  /**
   * Generate and create a new NPC (Meet Someone New)
   */
  createNpc(): Observable<NpcView> {
    this.store.setNpcsLoading(true);

    return this.repository.createNpcForPlayer().pipe(
      switchMap((npc) => {
        this.store.addNpc(npc);
        this.store.setNpcsLoading(false);
        console.log('✅ Created NPC:', npc.name);

        // Reload locations to update NPC counts
        return this.repository.getLocations(true).pipe(
          tap((locations) => this.store.setLocations(locations)),
          map(() => npc)
        );
      }),
      catchError((error) => {
        const errorMessage = error.message || 'Failed to create NPC';
        this.store.setNpcsError(errorMessage);
        console.error('❌ Error creating NPC:', error);
        throw error;
      })
    );
  }

  /**
   * Load all NPCs
   */
  loadNpcs(): void {
    this.store.setNpcsLoading(true);

    this.repository.getNpcsForPlayer().subscribe({
      next: (npcs) => {
        this.store.setNpcs(npcs);
        console.log(`✅ Loaded ${npcs.length} NPCs`);
      },
      error: (error) => {
        const errorMessage = error.message || 'Failed to load NPCs';
        this.store.setNpcsError(errorMessage);
        console.error('❌ Error loading NPCs:', error);
      }
    });
  }

  /**
   * Load a specific NPC by ID
   * Useful for deep links when NPC is not yet in store
   */
  loadNpcById(id: string): Observable<NpcView> {
    this.store.setNpcsLoading(true);

    return this.repository.getNpcById(id).pipe(
      tap({
        next: (npc) => {
          // Check if NPC already exists in store
          const existing = this.store.npcs().find(n => n.id === npc.id);
          if (existing) {
            this.store.updateNpc(npc);
          } else {
            this.store.addNpc(npc);
          }
          this.store.setNpcsLoading(false);
          console.log('✅ Loaded NPC:', npc.name);
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to load NPC';
          this.store.setNpcsError(errorMessage);
          console.error('❌ Error loading NPC:', error);
        }
      })
    );
  }

  /**
   * Delete an NPC by ID
   */
  deleteNpc(id: string): Observable<void> {
    this.store.setNpcsLoading(true);

    return this.repository.deleteNpcForPlayer(id).pipe(
      tap({
        next: () => {
          this.store.removeNpc(id);
          this.store.setNpcsLoading(false);
          console.log('✅ Deleted NPC:', id);
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to delete NPC';
          this.store.setNpcsError(errorMessage);
          console.error('❌ Error deleting NPC:', error);
        }
      })
    );
  }

  /**
   * Perform an activity (solo or social)
   * Unified method for all activity types
   * For social activities, provide npcId
   */
  performActivity(activityId: string, npcId?: string): Observable<ActivityResult> {
    this.store.setInteracting(true);

    return this.repository.performActivity(activityId, npcId).pipe(
      switchMap((result) => {
        // Update NPC in store if this was a social activity
        // The result contains NPC/relationship data that we need to convert
        if (npcId && result.npc) {
          // Find and update the NPC with new data from result
          const existingNpc = this.store.npcs().find(n => n.id === npcId);
          if (existingNpc && result.relationship) {
            const updatedNpc: NpcView = {
              ...existingNpc,
              trust: result.relationship.trust,
              affection: result.relationship.affection,
              desire: result.relationship.desire,
              currentState: result.relationship.currentState,
              emotionVector: result.npc.emotionVector,
              emotionInterpretation: result.npc.emotionInterpretation,
              revealedTraits: result.npc.revealedTraits
            };
            this.store.updateNpc(updatedNpc);
          }
        }

        this.store.setInteracting(false);

        // Log activity result
        const activity = this.store.activities().find(a => a.id === activityId);
        const outcomeText = result.outcome ? ` (${result.outcome.tier})` : '';
        const npcText = result.npc ? ` with ${result.npc.name}` : '';
        const stateText = result.stateChanged ? ` [State: ${result.previousState} → ${result.newState}]` : '';
        console.log(`✅ Activity "${activity?.name}" completed${outcomeText}${npcText}${stateText}`);

        // Reload player to get updated resources and reload activities to get updated availability
        return this.repository.getPlayer().pipe(
          tap((player) => this.store.setPlayer(player)),
          switchMap(() => this.repository.getActivities().pipe(
            tap((data) => this.store.setActivities(data.activities, data.availability))
          )),
          map(() => result)
        );
      }),
      catchError((error) => {
        const errorMessage = error.message || 'Failed to perform activity';
        this.store.setInteractionError(errorMessage);
        console.error('❌ Error performing activity:', error);
        throw error;
      })
    );
  }

  // ===== Activity Operations =====

  /**
   * Load all available activities with availability
   */
  loadActivities(): void {
    this.store.setActivitiesLoading(true);

    this.repository.getActivities().subscribe({
      next: (data) => {
        this.store.setActivities(data.activities, data.availability);
        console.log(`✅ Loaded ${data.activities.length} activities`);
      },
      error: (error) => {
        const errorMessage = error.message || 'Failed to load activities';
        this.store.setActivitiesError(errorMessage);
        console.error('❌ Error loading activities:', error);
      }
    });
  }

  // ===== Player Character Operations =====

  /**
   * Load player character
   */
  loadPlayer(): void {
    this.store.setPlayerLoading(true);

    this.repository.getPlayer().subscribe({
      next: (player) => {
        this.store.setPlayer(player);
        console.log(`✅ Loaded player - Day ${player.currentDay}, ${player.currentTime}`);
      },
      error: (error) => {
        const errorMessage = error.message || 'Failed to load player';
        this.store.setPlayerError(errorMessage);
        console.error('❌ Error loading player:', error);
      }
    });
  }

  /**
   * Set player archetype and reset stats to match
   */
  setPlayerArchetype(archetype: string): Observable<PlayerCharacter> {
    this.store.setPlayerLoading(true);

    return this.repository.setPlayerArchetype(archetype).pipe(
      tap({
        next: (player) => {
          this.store.setPlayer(player);
          // Reload activities to reflect new stat requirements
          this.loadActivities();
          console.log(`✅ Player archetype set to ${archetype}`);
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to set archetype';
          this.store.setPlayerError(errorMessage);
          console.error('❌ Error setting archetype:', error);
        }
      })
    );
  }

  /**
   * Reset player character to initial state
   */
  resetPlayer(): Observable<PlayerCharacter> {
    this.store.setPlayerLoading(true);

    return this.repository.resetPlayer().pipe(
      switchMap((player) => {
        this.store.setPlayer(player);
        // Also reset NPCs since they're deleted
        this.store.setNpcs([]);
        console.log('✅ Player reset to initial state');

        // Reload locations to update NPC counts (should all be 0 now)
        return this.repository.getLocations(true).pipe(
          tap((locations) => this.store.setLocations(locations)),
          map(() => player)
        );
      }),
      catchError((error) => {
        const errorMessage = error.message || 'Failed to reset player';
        this.store.setPlayerError(errorMessage);
        console.error('❌ Error resetting player:', error);
        throw error;
      })
    );
  }

  /**
   * Go to sleep and advance to next day
   */
  sleep(): Observable<SleepResult> {
    this.store.setPlayerLoading(true);

    return this.repository.sleep().pipe(
      switchMap((result) => {
        // Reload player to get updated state
        return this.repository.getPlayer().pipe(
          tap((player) => this.store.setPlayer(player)),
          switchMap(() => this.repository.getActivities().pipe(
            tap((data) => this.store.setActivities(data.activities, data.availability))
          )),
          map(() => result)
        );
      }),
      catchError((error) => {
        const errorMessage = error.message || 'Failed to process sleep';
        this.store.setPlayerError(errorMessage);
        console.error('❌ Error processing sleep:', error);
        throw error;
      })
    );
  }

  // ===== Selection Operations =====

  /**
   * Select an NPC to view details
   */
  selectNpc(id: string | null): void {
    this.store.selectNpc(id);
  }

  // ===== Location Operations =====

  /**
   * Load all locations with NPC counts
   */
  loadLocations(): void {
    this.store.setLocationsLoading(true);

    this.repository.getLocations(true).subscribe({
      next: (locations) => {
        this.store.setLocations(locations);
        console.log(`✅ Loaded ${locations.length} locations`);
      },
      error: (error) => {
        const errorMessage = error.message || 'Failed to load locations';
        this.store.setLocationsError(errorMessage);
        console.error('❌ Error loading locations:', error);
      }
    });
  }

  /**
   * Travel to a specific location
   */
  travel(destinationId: string): Observable<unknown> {
    this.store.setTraveling(true);

    return this.repository.travel(destinationId).pipe(
      switchMap((result) => {
        console.log(`✅ Traveled to ${result.newLocation} (${result.travelTime} minutes)`);
        this.store.setTraveling(false);

        // Reload player to get updated location and time
        return this.repository.getPlayer().pipe(
          tap((player) => this.store.setPlayer(player)),
          // Reload locations to update NPC counts
          switchMap(() => this.repository.getLocations(true).pipe(
            tap((locations) => this.store.setLocations(locations))
          )),
          // Reload activities to update availability
          switchMap(() => this.repository.getActivities().pipe(
            tap((data) => this.store.setActivities(data.activities, data.availability))
          )),
          map(() => result)
        );
      }),
      catchError((error) => {
        const errorMessage = error.message || 'Failed to travel';
        this.store.setLocationsError(errorMessage);
        this.store.setTraveling(false);
        console.error('❌ Error traveling:', error);
        throw error;
      })
    );
  }

  /**
   * Quick travel home
   */
  goHome(): Observable<unknown> {
    this.store.setTraveling(true);

    return this.repository.goHome().pipe(
      switchMap((result) => {
        console.log(`✅ Traveled home (${result.travelTime} minutes)`);
        this.store.setTraveling(false);

        // Reload player to get updated location and time
        return this.repository.getPlayer().pipe(
          tap((player) => this.store.setPlayer(player)),
          // Reload locations to update NPC counts
          switchMap(() => this.repository.getLocations(true).pipe(
            tap((locations) => this.store.setLocations(locations))
          )),
          // Reload activities to update availability
          switchMap(() => this.repository.getActivities().pipe(
            tap((data) => this.store.setActivities(data.activities, data.availability))
          )),
          map(() => result)
        );
      }),
      catchError((error) => {
        const errorMessage = error.message || 'Failed to go home';
        this.store.setLocationsError(errorMessage);
        this.store.setTraveling(false);
        console.error('❌ Error going home:', error);
        throw error;
      })
    );
  }

  // ===== Error Management =====

  /**
   * Clear interaction error
   */
  clearInteractionError(): void {
    this.store.clearInteractionError();
  }

  // ===== Reset =====

  /**
   * Reset all game state
   */
  reset(): void {
    this.store.resetState();
  }
}
