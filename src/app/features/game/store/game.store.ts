/**
 * Game Store
 * Manages game state using @ngrx/signals
 * Handles NPCs, relationships, and activities
 */

import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { computed } from '@angular/core';
import { NPC, Relationship, Activity } from '../../../../../shared/types';

/**
 * Game State
 */
interface GameState {
  // NPCs
  npcs: NPC[];
  npcsLoading: boolean;
  npcsError: string | null;

  // Relationships
  relationships: Relationship[];
  relationshipsLoading: boolean;
  relationshipsError: string | null;

  // Currently viewed NPC (for detail view)
  selectedNPCId: string | null;

  // Activities
  activities: Activity[];
  activitiesLoading: boolean;
  activitiesError: string | null;

  // Interaction state
  interacting: boolean;
  interactionError: string | null;
}

/**
 * Initial state
 */
const initialState: GameState = {
  npcs: [],
  npcsLoading: false,
  npcsError: null,

  relationships: [],
  relationshipsLoading: false,
  relationshipsError: null,

  selectedNPCId: null,

  activities: [],
  activitiesLoading: false,
  activitiesError: null,

  interacting: false,
  interactionError: null
};

/**
 * Game Signal Store
 */
export const GameStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    /**
     * Get selected NPC
     */
    selectedNPC: computed(() => {
      const id = store.selectedNPCId();
      if (!id) return null;
      return store.npcs().find(npc => npc.id === id) ?? null;
    }),

    /**
     * Get relationship for selected NPC
     */
    selectedRelationship: computed(() => {
      const id = store.selectedNPCId();
      if (!id) return null;
      return store.relationships().find(rel => rel.npcId === id) ?? null;
    }),

    /**
     * Get NPCs with their relationships (for neighbor list)
     */
    npcsWithRelationships: computed(() => {
      const rels = store.relationships();
      return rels.map(rel => ({
        npc: rel.npc!,
        relationship: rel
      }));
    }),

    /**
     * Overall loading state
     */
    isLoading: computed(() => {
      return store.npcsLoading() || store.relationshipsLoading() ||
             store.activitiesLoading() || store.interacting();
    })
  })),
  withMethods((store) => ({
    // ===== NPC Methods =====

    setNPCsLoading(loading: boolean): void {
      patchState(store, { npcsLoading: loading, npcsError: null });
    },

    setNPCsError(error: string): void {
      patchState(store, { npcsError: error, npcsLoading: false });
    },

    setNPCs(npcs: NPC[]): void {
      patchState(store, { npcs, npcsLoading: false, npcsError: null });
    },

    addNPC(npc: NPC): void {
      patchState(store, { npcs: [...store.npcs(), npc] });
    },

    updateNPC(updated: NPC): void {
      const npcs = store.npcs().map(npc =>
        npc.id === updated.id ? updated : npc
      );
      patchState(store, { npcs });
    },

    // ===== Relationship Methods =====

    setRelationshipsLoading(loading: boolean): void {
      patchState(store, { relationshipsLoading: loading, relationshipsError: null });
    },

    setRelationshipsError(error: string): void {
      patchState(store, { relationshipsError: error, relationshipsLoading: false });
    },

    setRelationships(relationships: Relationship[]): void {
      patchState(store, { relationships, relationshipsLoading: false, relationshipsError: null });
    },

    updateRelationship(updated: Relationship): void {
      const relationships = store.relationships().map(rel =>
        rel.id === updated.id ? updated : rel
      );
      patchState(store, { relationships });
    },

    addRelationship(relationship: Relationship): void {
      patchState(store, { relationships: [...store.relationships(), relationship] });
    },

    // ===== Selection Methods =====

    selectNPC(npcId: string | null): void {
      patchState(store, { selectedNPCId: npcId });
    },

    // ===== Activity Methods =====

    setActivitiesLoading(loading: boolean): void {
      patchState(store, { activitiesLoading: loading, activitiesError: null });
    },

    setActivitiesError(error: string): void {
      patchState(store, { activitiesError: error, activitiesLoading: false });
    },

    setActivities(activities: Activity[]): void {
      patchState(store, { activities, activitiesLoading: false, activitiesError: null });
    },

    // ===== Interaction Methods =====

    setInteracting(interacting: boolean): void {
      patchState(store, { interacting, interactionError: null });
    },

    setInteractionError(error: string): void {
      patchState(store, { interactionError: error, interacting: false });
    },

    clearInteractionError(): void {
      patchState(store, { interactionError: null });
    },

    // ===== Reset Methods =====

    resetState(): void {
      patchState(store, initialState);
    }
  }))
);
