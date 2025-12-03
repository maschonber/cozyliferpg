import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { computed } from '@angular/core';
import { User } from '../models/auth.model';

/**
 * Auth State
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Initial state
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

/**
 * Auth Signal Store
 * Manages authentication state using @ngrx/signals
 */
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user }) => ({
    username: computed(() => user()?.username ?? null)
  })),
  withMethods((store) => ({
    /**
     * Set loading state
     */
    setLoading(loading: boolean): void {
      patchState(store, { loading, error: null });
    },

    /**
     * Set error state
     */
    setError(error: string): void {
      patchState(store, { error, loading: false });
    },

    /**
     * Clear error state
     */
    clearError(): void {
      patchState(store, { error: null });
    },

    /**
     * Set authenticated user and token
     */
    setAuthenticated(user: User, token: string): void {
      patchState(store, {
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null
      });
    },

    /**
     * Clear authentication (logout)
     */
    clearAuthentication(): void {
      patchState(store, {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
    },

    /**
     * Restore session from storage
     */
    restoreSession(user: User, token: string): void {
      patchState(store, {
        user,
        token,
        isAuthenticated: true
      });
    }
  }))
);
