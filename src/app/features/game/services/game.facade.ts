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
import { PlayerNPCView, PlayerCharacter, SleepResult, ActivityResult } from '../../../../../shared/types';

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

  playerNPCs = this.store.playerNPCs;
  playerNPCsLoading = this.store.playerNPCsLoading;
  playerNPCsError = this.store.playerNPCsError;

  selectedPlayerNPC = this.store.selectedPlayerNPC;
  selectedPlayerNPCId = this.store.selectedPlayerNPCId;

  playerNPCsAtCurrentLocation = this.store.playerNPCsAtCurrentLocation;

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
   * Loads player, player NPCs, activities, and locations
   */
  initialize(): void {
    this.loadPlayer();
    this.loadPlayerNPCs();
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

  // ===== Player NPC Operations =====

  /**
   * Generate and create a new NPC (Meet Someone New)
   */
  createPlayerNPC(): Observable<PlayerNPCView> {
    this.store.setPlayerNPCsLoading(true);

    return this.repository.createPlayerNPC().pipe(
      switchMap((playerNPC) => {
        this.store.addPlayerNPC(playerNPC);
        this.store.setPlayerNPCsLoading(false);
        console.log('✅ Created NPC:', playerNPC.name);

        // Reload locations to update NPC counts
        return this.repository.getLocations(true).pipe(
          tap((locations) => this.store.setLocations(locations)),
          map(() => playerNPC)
        );
      }),
      catchError((error) => {
        const errorMessage = error.message || 'Failed to create NPC';
        this.store.setPlayerNPCsError(errorMessage);
        console.error('❌ Error creating NPC:', error);
        throw error;
      })
    );
  }

  /**
   * Load all player NPCs
   */
  loadPlayerNPCs(): void {
    this.store.setPlayerNPCsLoading(true);

    this.repository.getPlayerNPCs().subscribe({
      next: (playerNPCs) => {
        this.store.setPlayerNPCs(playerNPCs);
        console.log(`✅ Loaded ${playerNPCs.length} player NPCs`);
      },
      error: (error) => {
        const errorMessage = error.message || 'Failed to load player NPCs';
        this.store.setPlayerNPCsError(errorMessage);
        console.error('❌ Error loading player NPCs:', error);
      }
    });
  }

  /**
   * Load a specific player NPC by ID
   * Useful for deep links when NPC is not yet in store
   */
  loadPlayerNPCById(id: string): Observable<PlayerNPCView> {
    this.store.setPlayerNPCsLoading(true);

    return this.repository.getPlayerNPCById(id).pipe(
      tap({
        next: (playerNPC) => {
          // Check if player NPC already exists in store
          const existing = this.store.playerNPCs().find(pnpc => pnpc.id === playerNPC.id);
          if (existing) {
            this.store.updatePlayerNPC(playerNPC);
          } else {
            this.store.addPlayerNPC(playerNPC);
          }
          this.store.setPlayerNPCsLoading(false);
          console.log('✅ Loaded player NPC:', playerNPC.name);
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to load player NPC';
          this.store.setPlayerNPCsError(errorMessage);
          console.error('❌ Error loading player NPC:', error);
        }
      })
    );
  }

  /**
   * Delete a player NPC by ID
   */
  deletePlayerNPC(id: string): Observable<void> {
    this.store.setPlayerNPCsLoading(true);

    return this.repository.deletePlayerNPC(id).pipe(
      tap({
        next: () => {
          this.store.removePlayerNPC(id);
          this.store.setPlayerNPCsLoading(false);
          console.log('✅ Deleted player NPC:', id);
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to delete player NPC';
          this.store.setPlayerNPCsError(errorMessage);
          console.error('❌ Error deleting player NPC:', error);
        }
      })
    );
  }

  /**
   * Perform an activity (solo or social)
   * Unified method for all activity types
   * For social activities, provide npcId (player_npc ID)
   */
  performActivity(activityId: string, npcId?: string): Observable<ActivityResult> {
    this.store.setInteracting(true);

    return this.repository.performActivity(activityId, npcId).pipe(
      switchMap((result) => {
        // Update player NPC in store if this was a social activity
        // The result contains NPC/relationship data that we need to convert
        if (npcId && result.npc) {
          // Find and update the player NPC with new data from result
          const existingPlayerNPC = this.store.playerNPCs().find(pnpc => pnpc.id === npcId);
          if (existingPlayerNPC && result.relationship) {
            const updatedPlayerNPC: PlayerNPCView = {
              ...existingPlayerNPC,
              trust: result.relationship.trust,
              affection: result.relationship.affection,
              desire: result.relationship.desire,
              currentState: result.relationship.currentState,
              emotionVector: result.npc.emotionVector,
              emotionInterpretation: result.npc.emotionInterpretation,
              revealedTraits: result.npc.revealedTraits
            };
            this.store.updatePlayerNPC(updatedPlayerNPC);
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
        // Also reset player NPCs since they're deleted
        this.store.setPlayerNPCs([]);
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
   * Select a player NPC to view details
   */
  selectPlayerNPC(id: string | null): void {
    this.store.selectPlayerNPC(id);
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
