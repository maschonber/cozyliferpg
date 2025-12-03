/**
 * Domain models for authentication feature
 * These are internal models used within the Angular application
 */

export interface User {
  id: string;
  username: string;
  createdAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
