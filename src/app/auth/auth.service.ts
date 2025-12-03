import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { LoginRequest, AuthResponse, User } from '../../../shared/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://cozyliferpg-production.up.railway.app/api';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  // Signals for reactive state management
  currentUser = signal<User | null>(this.getUserFromStorage());
  isAuthenticated = signal<boolean>(!!this.getToken());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Login with username and password
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.setToken(response.token);
          this.setUser(response.user);
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
        }
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return of({
          success: false,
          error: error.error?.error || 'Login failed'
        });
      })
    );
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  /**
   * Get the stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Store JWT token
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Store user data
   */
  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Get user from storage
   */
  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Verify if the current token is still valid
   */
  verifyToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/verify`, {}).pipe(
      tap(response => {
        if (!response.success) {
          this.logout();
        }
      }),
      catchError(() => {
        this.logout();
        return of({ success: false, error: 'Token verification failed' });
      })
    );
  }
}
