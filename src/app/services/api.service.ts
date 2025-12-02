import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameItem, ApiResponse } from '../../../shared/types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Use Railway production URL in production, localhost in development
  private readonly apiUrl = 'https://cozyliferpg-production.up.railway.app/api';

  constructor(private http: HttpClient) {}

  /**
   * Get all items from the database
   */
  getItems(): Observable<ApiResponse<GameItem[]>> {
    return this.http.get<ApiResponse<GameItem[]>>(`${this.apiUrl}/items`);
  }

  /**
   * Get a single item by ID
   */
  getItem(id: string): Observable<ApiResponse<GameItem>> {
    return this.http.get<ApiResponse<GameItem>>(`${this.apiUrl}/items/${id}`);
  }

  /**
   * Get database statistics
   */
  getDatabaseStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/db/status`);
  }

  /**
   * Health check
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
