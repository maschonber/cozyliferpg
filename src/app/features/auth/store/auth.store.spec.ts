import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';
import { User } from '../models/auth.model';

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthStore]
    });
    store = TestBed.inject(AuthStore);
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(store.user()).toBeNull();
      expect(store.token()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.username()).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      store.setLoading(true);
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
    });

    it('should set loading state to false', () => {
      store.setLoading(true);
      store.setLoading(false);
      expect(store.loading()).toBe(false);
    });

    it('should clear error when setting loading', () => {
      store.setError('Test error');
      store.setLoading(true);
      expect(store.error()).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Login failed';
      store.setError(errorMessage);
      expect(store.error()).toBe(errorMessage);
      expect(store.loading()).toBe(false);
    });

    it('should set loading to false when setting error', () => {
      store.setLoading(true);
      store.setError('Error occurred');
      expect(store.loading()).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      store.setError('Test error');
      store.clearError();
      expect(store.error()).toBeNull();
    });
  });

  describe('setAuthenticated', () => {
    it('should set user and authentication state', () => {
      const user: User = {
        id: '123',
        username: 'testuser',
        createdAt: new Date('2024-01-01')
      };
      const token = 'test-token';

      store.setAuthenticated(user, token);

      expect(store.user()).toEqual(user);
      expect(store.token()).toBe(token);
      expect(store.isAuthenticated()).toBe(true);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.username()).toBe('testuser');
    });

    it('should clear loading and error when setting authenticated', () => {
      store.setLoading(true);
      store.setError('Previous error');

      const user: User = {
        id: '123',
        username: 'testuser',
        createdAt: new Date()
      };
      store.setAuthenticated(user, 'token');

      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });
  });

  describe('clearAuthentication', () => {
    it('should clear all authentication state', () => {
      const user: User = {
        id: '123',
        username: 'testuser',
        createdAt: new Date()
      };
      store.setAuthenticated(user, 'token');
      store.clearAuthentication();

      expect(store.user()).toBeNull();
      expect(store.token()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.username()).toBeNull();
    });
  });

  describe('restoreSession', () => {
    it('should restore user and token from storage', () => {
      const user: User = {
        id: '456',
        username: 'restoreduser',
        createdAt: new Date('2024-02-01')
      };
      const token = 'restored-token';

      store.restoreSession(user, token);

      expect(store.user()).toEqual(user);
      expect(store.token()).toBe(token);
      expect(store.isAuthenticated()).toBe(true);
      expect(store.username()).toBe('restoreduser');
    });
  });

  describe('Computed Signals', () => {
    it('should compute username from user', () => {
      const user: User = {
        id: '789',
        username: 'computeduser',
        createdAt: new Date()
      };

      expect(store.username()).toBeNull();

      store.setAuthenticated(user, 'token');
      expect(store.username()).toBe('computeduser');

      store.clearAuthentication();
      expect(store.username()).toBeNull();
    });
  });
});
