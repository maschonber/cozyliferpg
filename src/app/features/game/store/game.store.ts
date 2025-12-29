/**
 * Game Store
 * Manages game state using @ngrx/signals
 * Handles player NPCs (unified NPC + relationship view) and activities
 */

import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { computed } from '@angular/core';
import { PlayerNPCView, Activity, PlayerCharacter, ActivityAvailability, LocationWithNPCCount } from '../../../../../shared/types';

/**
 * Game State
 */
interface GameState {
  // Player Character
  player: PlayerCharacter | null;
  playerLoading: boolean;
  playerError: string | null;

  // Player NPCs (unified NPC + relationship view)
  playerNPCs: PlayerNPCView[];
  playerNPCsLoading: boolean;
  playerNPCsError: string | null;

  // Currently viewed player NPC (for detail view)
  selectedPlayerNPCId: string | null;

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

  playerNPCs: [],
  playerNPCsLoading: false,
  playerNPCsError: null,

  selectedPlayerNPCId: null,

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
     * Get selected player NPC
     */
    selectedPlayerNPC: computed(() => {
      const id = store.selectedPlayerNPCId();
      if (!id) return null;
      return store.playerNPCs().find(pnpc => pnpc.id === id) ?? null;
    }),

    /**
     * Get player NPCs at current location (for neighbor list)
     */
    playerNPCsAtCurrentLocation: computed(() => {
      const playerNPCs = store.playerNPCs();
      const player = store.player();

      // If no player or no current location, return empty array
      if (!player?.currentLocation) {
        return [];
      }

      // Filter to only include NPCs at the player's current location
      return playerNPCs.filter(pnpc => pnpc.currentLocation === player.currentLocation);
    }),

    /**
     * Overall loading state
     */
    isLoading: computed(() => {
      return store.playerNPCsLoading() ||
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

    // ===== Player NPC Methods =====

    setPlayerNPCsLoading(loading: boolean): void {
      patchState(store, { playerNPCsLoading: loading, playerNPCsError: null });
    },

    setPlayerNPCsError(error: string): void {
      patchState(store, { playerNPCsError: error, playerNPCsLoading: false });
    },

    setPlayerNPCs(playerNPCs: PlayerNPCView[]): void {
      patchState(store, { playerNPCs, playerNPCsLoading: false, playerNPCsError: null });
    },

    addPlayerNPC(playerNPC: PlayerNPCView): void {
      patchState(store, { playerNPCs: [...store.playerNPCs(), playerNPC] });
    },

    updatePlayerNPC(updated: PlayerNPCView): void {
      const playerNPCs = store.playerNPCs().map(pnpc =>
        pnpc.id === updated.id ? updated : pnpc
      );
      patchState(store, { playerNPCs });
    },

    removePlayerNPC(id: string): void {
      const playerNPCs = store.playerNPCs().filter(pnpc => pnpc.id !== id);
      patchState(store, { playerNPCs, selectedPlayerNPCId: null });
    },

    // ===== Selection Methods =====

    selectPlayerNPC(id: string | null): void {
      patchState(store, { selectedPlayerNPCId: id });
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
