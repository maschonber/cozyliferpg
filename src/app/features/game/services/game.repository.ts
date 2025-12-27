/**
 * Game Repository
 * Handles HTTP communication with the game API (NPCs, Relationships, Activities)
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  NPC,
  Relationship,
  Activity,
  PerformActivityRequest,
  ApiResponse,
  PlayerCharacter,
  SleepResultWithStats,
  ActivityResult,
  ActivityAvailability,
  LocationWithNPCCount,
  TravelRequest,
  TravelResult
} from '../../../../../shared/types';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameRepository {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ===== NPC Operations =====

  /**
   * Generate and create a new NPC
   */
  createNPC(): Observable<NPC> {
    return this.http.post<ApiResponse<NPC>>(`${this.API_URL}/npcs`, {}).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to create NPC');
        }
        return response.data;
      })
    );
  }

  /**
   * Get all NPCs
   */
  getNPCs(): Observable<NPC[]> {
    return this.http.get<ApiResponse<NPC[]>>(`${this.API_URL}/npcs`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch NPCs');
        }
        return response.data;
      })
    );
  }

  /**
   * Get NPC by ID
   */
  getNPCById(npcId: string): Observable<NPC> {
    return this.http.get<ApiResponse<NPC>>(`${this.API_URL}/npcs/${npcId}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch NPC');
        }
        return response.data;
      })
    );
  }

  /**
   * Delete an NPC by ID
   */
  deleteNPC(npcId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/npcs/${npcId}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete NPC');
        }
        return;
      })
    );
  }

  // ===== Relationship Operations =====

  /**
   * Get all relationships for the authenticated user
   */
  getRelationships(): Observable<Relationship[]> {
    return this.http.get<ApiResponse<Relationship[]>>(`${this.API_URL}/relationships`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch relationships');
        }
        return response.data;
      })
    );
  }

  /**
   * Get or create relationship with specific NPC
   */
  getRelationship(npcId: string): Observable<Relationship> {
    return this.http.get<ApiResponse<Relationship>>(`${this.API_URL}/relationships/${npcId}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch relationship');
        }
        return response.data;
      })
    );
  }

  /**
   * Perform an activity (solo or social)
   * Unified endpoint for all activity types
   * For social activities, npcId is required
   */
  performActivity(activityId: string, npcId?: string): Observable<ActivityResult> {
    const request: PerformActivityRequest = { activityId, npcId };

    return this.http.post<ApiResponse<ActivityResult>>(
      `${this.API_URL}/activities/perform`,
      request
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to perform activity');
        }
        return response.data;
      })
    );
  }

  // ===== Activity Operations =====

  /**
   * Get all available activities with availability status (Phase 2)
   */
  getActivities(): Observable<{ activities: Activity[], availability: ActivityAvailability[] }> {
    return this.http.get<ApiResponse<{ activities: Activity[], availability: ActivityAvailability[] }>>(
      `${this.API_URL}/activities`
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch activities');
        }
        return response.data;
      })
    );
  }

  // ===== Player Character Operations (Phase 2) =====

  /**
   * Get current player character
   */
  getPlayer(): Observable<PlayerCharacter> {
    return this.http.get<ApiResponse<PlayerCharacter>>(`${this.API_URL}/player`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch player');
        }
        return response.data;
      })
    );
  }

  /**
   * Set player archetype and reset stats to match
   * (Phase 2.5: Character creation/customization)
   */
  setPlayerArchetype(archetype: string): Observable<PlayerCharacter> {
    return this.http.post<ApiResponse<PlayerCharacter>>(`${this.API_URL}/player/archetype`, { archetype }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to set archetype');
        }
        return response.data;
      })
    );
  }

  /**
   * Reset player character to initial state
   */
  resetPlayer(): Observable<PlayerCharacter> {
    return this.http.post<ApiResponse<PlayerCharacter>>(`${this.API_URL}/player/reset`, {}).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to reset player');
        }
        return response.data;
      })
    );
  }

  /**
   * Go to sleep and advance to next day
   * Phase 2.5: Returns stat changes (base growth, current decay)
   */
  sleep(): Observable<SleepResultWithStats> {
    return this.http.post<ApiResponse<SleepResultWithStats>>(`${this.API_URL}/player/sleep`, {}).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to process sleep');
        }
        return response.data;
      })
    );
  }

  // ===== Location Operations (Phase 3) =====

  /**
   * Get all locations, optionally with NPC counts
   */
  getLocations(includeNPCCounts: boolean = true): Observable<LocationWithNPCCount[]> {
    const options = includeNPCCounts
      ? { params: { includeNPCCounts: 'true' } }
      : {};
    return this.http.get<ApiResponse<LocationWithNPCCount[]>>(
      `${this.API_URL}/locations`,
      options
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch locations');
        }
        return response.data;
      })
    );
  }

  /**
   * Travel to a specific location
   */
  travel(destinationId: string): Observable<TravelResult> {
    const request: TravelRequest = { destinationId: destinationId as any };
    return this.http.post<ApiResponse<TravelResult>>(
      `${this.API_URL}/locations/travel`,
      request
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to travel');
        }
        return response.data;
      })
    );
  }

  /**
   * Quick travel home
   */
  goHome(): Observable<TravelResult> {
    return this.http.post<ApiResponse<TravelResult>>(
      `${this.API_URL}/locations/go-home`,
      {}
    ).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to go home');
        }
        return response.data;
      })
    );
  }
}
