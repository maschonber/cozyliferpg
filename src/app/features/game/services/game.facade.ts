/**
 * Game Facade
 * Provides a clean API for game operations
 * Orchestrates between store, repository, and business logic
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GameStore } from '../store/game.store';
import { GameRepository } from './game.repository';
import { NPC, Relationship, Activity, PerformActivityResponse } from '../../../../../shared/types';

@Injectable({
  providedIn: 'root'
})
export class GameFacade {
  private store = inject(GameStore);
  private repository = inject(GameRepository);

  // Expose signals from store for components
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
  activitiesLoading = this.store.activitiesLoading;
  activitiesError = this.store.activitiesError;

  interacting = this.store.interacting;
  interactionError = this.store.interactionError;
  isLoading = this.store.isLoading;

  // ===== Initialization =====

  /**
   * Initialize game data on startup
   * Loads relationships and activities
   */
  initialize(): void {
    this.loadRelationships();
    this.loadActivities();
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
   * Perform an activity with an NPC
   */
  performActivity(npcId: string, activityId: string): Observable<PerformActivityResponse> {
    this.store.setInteracting(true);

    return this.repository.performActivity(npcId, activityId).pipe(
      tap({
        next: (response) => {
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
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to perform activity';
          this.store.setInteractionError(errorMessage);
          console.error('❌ Error performing activity:', error);
        }
      })
    );
  }

  // ===== Activity Operations =====

  /**
   * Load all available activities
   */
  loadActivities(): void {
    this.store.setActivitiesLoading(true);

    this.repository.getActivities().subscribe({
      next: (activities) => {
        this.store.setActivities(activities);
        console.log(`✅ Loaded ${activities.length} activities`);
      },
      error: (error) => {
        const errorMessage = error.message || 'Failed to load activities';
        this.store.setActivitiesError(errorMessage);
        console.error('❌ Error loading activities:', error);
      }
    });
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
