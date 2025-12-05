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
  ApiResponse
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

  // ===== Activity Operations =====

  /**
   * Get all available activities
   */
  getActivities(): Observable<Activity[]> {
    return this.http.get<ApiResponse<Activity[]>>(`${this.API_URL}/relationships/activities/list`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch activities');
        }
        return response.data;
      })
    );
  }
}
