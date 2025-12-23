import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, LoginCredentials } from '../models/auth.model';
import { LoginRequest, AuthResponse } from '../../../../../shared/types';
import { environment } from '../../../../environments/environment';

/**
 * Auth Repository
 * Responsible for HTTP communication with the auth API
 * Transforms DTOs to domain models
 */
@Injectable({
  providedIn: 'root'
})
export class AuthRepository {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Authenticate user with credentials
   */
  login(credentials: LoginCredentials): Observable<{ token: string; user: User }> {
    const request: LoginRequest = {
      username: credentials.username,
      password: credentials.password
    };

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, request).pipe(
      map(response => {
        if (!response.success || !response.token || !response.user) {
          throw new Error(response.error || 'Login failed');
        }
        return {
          token: response.token,
          user: this.transformUserDto(response.user)
        };
      })
    );
  }

  /**
   * Verify the current JWT token
   */
  verifyToken(): Observable<boolean> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/verify`, {}).pipe(
      map(response => response.success)
    );
  }

  /**
   * Transform API User DTO to domain User model
   */
  private transformUserDto(dto: { id: string; username: string; createdAt: string }): User {
    return {
      id: dto.id,
      username: dto.username,
      createdAt: new Date(dto.createdAt)
    };
  }
}
