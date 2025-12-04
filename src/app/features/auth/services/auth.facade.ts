import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthStore } from '../store/auth.store';
import { AuthRepository } from './auth.repository';
import { LoginCredentials, User } from '../models/auth.model';

/**
 * Auth Facade
 * Provides a clean API for authentication operations
 * Orchestrates between store, repository, and business logic
 */
@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  private store = inject(AuthStore);
  private repository = inject(AuthRepository);
  private router = inject(Router);

  // Expose signals from store
  user = this.store.user;
  token = this.store.token;
  isAuthenticated = this.store.isAuthenticated;
  loading = this.store.loading;
  error = this.store.error;
  username = this.store.username;

  /**
   * Initialize auth state on app startup
   * Restores session from localStorage if available
   * Returns a Promise that resolves when initialization is complete
   * This is used by APP_INITIALIZER to ensure auth is ready before routing
   */
  initialize(): Promise<void> {
    return new Promise((resolve) => {
      const token = this.getStoredToken();
      const user = this.getStoredUser();

      if (token && user) {
        this.store.restoreSession(user, token);
        console.log('✅ Auth restored from localStorage:', user.username);
      } else {
        console.log('ℹ️ No stored auth session found');
      }

      // Resolve immediately as localStorage operations are synchronous
      // This ensures store signals are updated before routing begins
      resolve();
    });
  }

  /**
   * Login with credentials
   */
  login(credentials: LoginCredentials): Observable<void> {
    this.store.setLoading(true);

    return new Observable(observer => {
      this.repository.login(credentials).subscribe({
        next: ({ token, user }) => {
          this.storeToken(token);
          this.storeUser(user);
          this.store.setAuthenticated(user, token);
          this.router.navigate(['/main']);
          observer.next();
          observer.complete();
        },
        error: (error) => {
          const errorMessage = error.message || 'Login failed';
          this.store.setError(errorMessage);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.clearStoredToken();
    this.clearStoredUser();
    this.store.clearAuthentication();
    this.router.navigate(['/login']);
  }

  /**
   * Verify if the current token is still valid
   */
  verifyToken(): Observable<boolean> {
    return this.repository.verifyToken();
  }

  /**
   * Get the current JWT token
   */
  getToken(): string | null {
    return this.store.token();
  }

  /**
   * Clear any error messages
   */
  clearError(): void {
    this.store.clearError();
  }

  // Private methods for localStorage management

  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt.toISOString()
    }));
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      const parsed = JSON.parse(userStr);
      return {
        id: parsed.id,
        username: parsed.username,
        createdAt: new Date(parsed.createdAt)
      };
    } catch {
      return null;
    }
  }

  private clearStoredToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private clearStoredUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }
}
