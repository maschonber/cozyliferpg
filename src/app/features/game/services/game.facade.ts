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
import { NPC, Relationship, Activity, PerformActivityResponse, PlayerCharacter, SleepResult, SleepResultWithStats, SoloActivityResult } from '../../../../../shared/types';

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

  relationships = this.store.relationships;
  relationshipsLoading = this.store.relationshipsLoading;
  relationshipsError = this.store.relationshipsError;

  selectedNPC = this.store.selectedNPC;
  selectedNPCId = this.store.selectedNPCId;
  selectedRelationship = this.store.selectedRelationship;

  npcsWithRelationships = this.store.npcsWithRelationships;

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
   * Loads player, NPCs, relationships, activities, and locations (Phase 3)
   */
  initialize(): void {
    this.loadPlayer();
    this.loadNPCs();
    this.loadRelationships();
    this.loadActivities();
    this.loadLocations();
  }

  /**
   * Ensure activities are loaded (for use in resolvers/components)
   * Returns immediately if already loaded, otherwise loads and waits
   * (Phase 2: Now includes availability information)
   *
   * Note: Activities are context-dependent (based on player state, time, etc.),
   * so they should be reloaded when player state changes significantly.
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
  createNPC(): Observable<NPC> {
    this.store.setNPCsLoading(true);

    return this.repository.createNPC().pipe(
      tap({
        next: (npc) => {
          this.store.addNPC(npc);
          this.store.setNPCsLoading(false);
          console.log('✅ Created NPC:', npc.name);
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to create NPC';
          this.store.setNPCsError(errorMessage);
          console.error('❌ Error creating NPC:', error);
        }
      })
    );
  }

  /**
   * Load all NPCs
   */
  loadNPCs(): void {
    this.store.setNPCsLoading(true);

    this.repository.getNPCs().subscribe({
      next: (npcs) => {
        this.store.setNPCs(npcs);
        console.log(`✅ Loaded ${npcs.length} NPCs`);
      },
      error: (error) => {
        const errorMessage = error.message || 'Failed to load NPCs';
        this.store.setNPCsError(errorMessage);
        console.error('❌ Error loading NPCs:', error);
      }
    });
  }

  /**
   * Load a specific NPC by ID
   * Useful for deep links when NPC is not yet in store
   */
  loadNPCById(npcId: string): Observable<NPC> {
    this.store.setNPCsLoading(true);

    return this.repository.getNPCById(npcId).pipe(
      tap({
        next: (npc) => {
          // Check if NPC already exists in store
          const existing = this.store.npcs().find(n => n.id === npc.id);
          if (existing) {
            this.store.updateNPC(npc);
          } else {
            this.store.addNPC(npc);
          }
          this.store.setNPCsLoading(false);
          console.log('✅ Loaded NPC:', npc.name);
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to load NPC';
          this.store.setNPCsError(errorMessage);
          console.error('❌ Error loading NPC:', error);
        }
      })
    );
  }

  /**
   * Delete an NPC by ID
   */
  deleteNPC(npcId: string): Observable<void> {
    this.store.setNPCsLoading(true);

    return this.repository.deleteNPC(npcId).pipe(
      tap({
        next: () => {
          this.store.removeNPC(npcId);
          this.store.setNPCsLoading(false);
          console.log('✅ Deleted NPC:', npcId);
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to delete NPC';
          this.store.setNPCsError(errorMessage);
          console.error('❌ Error deleting NPC:', error);
        }
      })
    );
  }

  // ===== Relationship Operations =====

  /**
   * Load all relationships
   */
  loadRelationships(): void {
    this.store.setRelationshipsLoading(true);

    this.repository.getRelationships().subscribe({
      next: (relationships) => {
        this.store.setRelationships(relationships);
        console.log(`✅ Loaded ${relationships.length} relationships`);
      },
      error: (error) => {
        const errorMessage = error.message || 'Failed to load relationships';
        this.store.setRelationshipsError(errorMessage);
        console.error('❌ Error loading relationships:', error);
      }
    });
  }

  /**
   * Get or create relationship with a specific NPC
   */
  getRelationship(npcId: string): Observable<Relationship> {
    this.store.setRelationshipsLoading(true);

    return this.repository.getRelationship(npcId).pipe(
      tap({
        next: (relationship) => {
          // Check if relationship already exists in store
          const existing = this.store.relationships().find(r => r.id === relationship.id);
          if (existing) {
            this.store.updateRelationship(relationship);
          } else {
            this.store.addRelationship(relationship);
          }
          this.store.setRelationshipsLoading(false);
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to get relationship';
          this.store.setRelationshipsError(errorMessage);
          console.error('❌ Error getting relationship:', error);
        }
      })
    );
  }

  /**
   * Perform an activity with an NPC (Phase 2: updates player resources)
   */
  performActivity(npcId: string, activityId: string): Observable<PerformActivityResponse> {
    this.store.setInteracting(true);

    return this.repository.performActivity(npcId, activityId).pipe(
      switchMap((response) => {
        // Update relationship in store
        if (response.relationship) {
          this.store.updateRelationship(response.relationship);
        }

        this.store.setInteracting(false);

        // Log activity result
        const activity = this.store.activities().find(a => a.id === activityId);
        console.log(
          `✅ Activity "${activity?.name}" completed`,
          response.stateChanged ? `State changed: ${response.previousState} → ${response.newState}` : ''
        );

        // Reload player to get updated resources and reload activities to get updated availability
        return this.repository.getPlayer().pipe(
          tap((player) => this.store.setPlayer(player)),
          switchMap(() => this.repository.getActivities().pipe(
            tap((data) => this.store.setActivities(data.activities, data.availability))
          )),
          map(() => response)
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

  /**
   * Perform a solo activity (no NPC required)
   * Phase 2.5: Returns stat changes and outcome info
   */
  performSoloActivity(activityId: string): Observable<SoloActivityResult> {
    this.store.setInteracting(true);

    return this.repository.performSoloActivity(activityId).pipe(
      switchMap((result) => {
        this.store.setInteracting(false);

        // Log activity result with outcome
        const activity = this.store.activities().find(a => a.id === activityId);
        const outcomeText = result.outcome ? ` (${result.outcome.tier})` : '';
        console.log(`✅ Solo activity "${activity?.name}" completed${outcomeText}`);

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
        console.error('❌ Error performing solo activity:', error);
        throw error;
      })
    );
  }

  // ===== Activity Operations =====

  /**
   * Load all available activities with availability (Phase 2)
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

  // ===== Player Character Operations (Phase 2) =====

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
   * (Phase 2.5: Character creation/customization)
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
      tap({
        next: (player) => {
          this.store.setPlayer(player);
          // Also reset NPCs and relationships since they're deleted
          this.store.setNPCs([]);
          this.store.setRelationships([]);
          console.log('✅ Player reset to initial state');
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to reset player';
          this.store.setPlayerError(errorMessage);
          console.error('❌ Error resetting player:', error);
        }
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
        console.log(`✅ Slept ${result.hoursSlept} hours, gained ${result.energyRestored} energy`);
        console.log(`🌅 Day ${result.newDay} begins at ${result.wakeTime}`);

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
  selectNPC(npcId: string | null): void {
    this.store.selectNPC(npcId);

    // Load relationship if not already loaded
    if (npcId && !this.store.relationships().find(r => r.npcId === npcId)) {
      this.getRelationship(npcId).subscribe();
    }
  }

  // ===== Location Operations (Phase 3) =====

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
  travel(destinationId: string): Observable<any> {
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
  goHome(): Observable<any> {
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
