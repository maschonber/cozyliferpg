/**
 * Game Store
 * Manages game state using @ngrx/signals
 * Handles NPCs (unified NPC + relationship view) and activities
 */

import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { computed } from '@angular/core';
import { NpcView, Activity, PlayerCharacter, ActivityAvailability, LocationWithNPCCount } from '../../../../../shared/types';

/**
 * Game State
 */
interface GameState {
  // Player Character
  player: PlayerCharacter | null;
  playerLoading: boolean;
  playerError: string | null;

  // NPCs (unified NPC + relationship view)
  npcs: NpcView[];
  npcsLoading: boolean;
  npcsError: string | null;

  // Currently viewed NPC (for detail view)
  selectedNpcId: string | null;

  // Activities (includes availability)
  activities: Activity[];
  activityAvailability: ActivityAvailability[];
  activitiesLoading: boolean;
  activitiesError: string | null;

  // Interaction state
  interacting: boolean;
  interactionError: string | null;

  // Locations
  locations: LocationWithNPCCount[];
  locationsLoading: boolean;
  locationsError: string | null;
  traveling: boolean;
}

/**
 * Initial state
 */
const initialState: GameState = {
  player: null,
  playerLoading: false,
  playerError: null,

  npcs: [],
  npcsLoading: false,
  npcsError: null,

  selectedNpcId: null,

  activities: [],
  activityAvailability: [],
  activitiesLoading: false,
  activitiesError: null,

  interacting: false,
  interactionError: null,

  locations: [],
  locationsLoading: false,
  locationsError: null,
  traveling: false
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
    selectedNpc: computed(() => {
      const id = store.selectedNpcId();
      if (!id) return null;
      return store.npcs().find(npc => npc.id === id) ?? null;
    }),

    /**
     * Get NPCs at current location (for neighbor list)
     */
    npcsAtCurrentLocation: computed(() => {
      const npcs = store.npcs();
      const player = store.player();

      // If no player or no current location, return empty array
      if (!player?.currentLocation) {
        return [];
      }

      // Filter to only include NPCs at the player's current location
      return npcs.filter(npc => npc.currentLocation === player.currentLocation);
    }),

    /**
     * Overall loading state
     */
    isLoading: computed(() => {
      return store.npcsLoading() ||
             store.activitiesLoading() || store.interacting();
    })
  })),
  withMethods((store) => ({
    // ===== Player Character Methods =====

    setPlayerLoading(loading: boolean): void {
      patchState(store, { playerLoading: loading, playerError: null });
    },

    setPlayerError(error: string): void {
      patchState(store, { playerError: error, playerLoading: false });
    },

    setPlayer(player: PlayerCharacter): void {
      patchState(store, { player, playerLoading: false, playerError: null });
    },

    updatePlayer(player: PlayerCharacter): void {
      patchState(store, { player });
    },

    // ===== NPC Methods =====

    setNpcsLoading(loading: boolean): void {
      patchState(store, { npcsLoading: loading, npcsError: null });
    },

    setNpcsError(error: string): void {
      patchState(store, { npcsError: error, npcsLoading: false });
    },

    setNpcs(npcs: NpcView[]): void {
      patchState(store, { npcs, npcsLoading: false, npcsError: null });
    },

    addNpc(npc: NpcView): void {
      patchState(store, { npcs: [...store.npcs(), npc] });
    },

    updateNpc(updated: NpcView): void {
      const npcs = store.npcs().map(npc =>
        npc.id === updated.id ? updated : npc
      );
      patchState(store, { npcs });
    },

    removeNpc(id: string): void {
      const npcs = store.npcs().filter(npc => npc.id !== id);
      patchState(store, { npcs, selectedNpcId: null });
    },

    // ===== Selection Methods =====

    selectNpc(id: string | null): void {
      patchState(store, { selectedNpcId: id });
    },

    // ===== Activity Methods =====

    setActivitiesLoading(loading: boolean): void {
      patchState(store, { activitiesLoading: loading, activitiesError: null });
    },

    setActivitiesError(error: string): void {
      patchState(store, { activitiesError: error, activitiesLoading: false });
    },

    setActivities(activities: Activity[], availability?: ActivityAvailability[]): void {
      patchState(store, {
        activities,
        activityAvailability: availability || [],
        activitiesLoading: false,
        activitiesError: null
      });
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

    // ===== Location Methods =====

    setLocationsLoading(loading: boolean): void {
      patchState(store, { locationsLoading: loading, locationsError: null });
    },

    setLocationsError(error: string): void {
      patchState(store, { locationsError: error, locationsLoading: false });
    },

    setLocations(locations: LocationWithNPCCount[]): void {
      patchState(store, { locations, locationsLoading: false, locationsError: null });
    },

    setTraveling(traveling: boolean): void {
      patchState(store, { traveling });
    },

    // ===== Reset Methods =====

    resetState(): void {
      patchState(store, initialState);
    }
  }))
);
