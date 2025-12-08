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
  PerformActivityResponse,
  ApiResponse,
  PlayerCharacter,
  SleepResult,
  ActivityAvailability,
  Location,
  LocationWithNPCCount,
  TravelRequest,
  TravelResult
} from '../../../../../shared/types';

@Injectable({
  providedIn: 'root'
})
export class GameRepository {
  private readonly API_URL = 'https://cozyliferpg-production.up.railway.app/api';

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
   * Perform an activity with an NPC
   */
  performActivity(npcId: string, activityId: string): Observable<PerformActivityResponse> {
    const request: PerformActivityRequest = { activityId };

    return this.http.post<PerformActivityResponse>(
      `${this.API_URL}/relationships/${npcId}/interact`,
      request
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to perform activity');
        }
        return response;
      })
    );
  }

  /**
   * Perform a solo activity (no NPC required)
   */
  performSoloActivity(activityId: string): Observable<any> {
    const request: PerformActivityRequest = { activityId };

    return this.http.post<ApiResponse<{ player: any }>>(
      `${this.API_URL}/activities/perform`,
      request
    ).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to perform solo activity');
        }
        return response;
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
   */
  sleep(): Observable<SleepResult> {
    return this.http.post<ApiResponse<SleepResult>>(`${this.API_URL}/player/sleep`, {}).pipe(
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
    const params = includeNPCCounts ? { includeNPCCounts: 'true' } : {};
    return this.http.get<ApiResponse<LocationWithNPCCount[]>>(
      `${this.API_URL}/locations`,
      { params }
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
    const request: TravelRequest = { destinationId };
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
