import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthFacade } from './auth.facade';
import { AuthRepository } from './auth.repository';
import { AuthStore } from '../store/auth.store';
import { User } from '../models/auth.model';

describe('AuthFacade', () => {
  let facade: AuthFacade;
  let mockRepository: jest.Mocked<AuthRepository>;
  let mockRouter: jest.Mocked<Router>;
  let store: InstanceType<typeof AuthStore>;

  const mockUser: User = {
    id: '123',
    username: 'testuser',
    createdAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    // Create mocks
    mockRepository = {
      login: jest.fn(),
      verifyToken: jest.fn()
    } as any;

    mockRouter = {
      navigate: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      providers: [
        AuthFacade,
        AuthStore,
        { provide: AuthRepository, useValue: mockRepository },
        { provide: Router, useValue: mockRouter }
      ]
    });

    facade = TestBed.inject(AuthFacade);
    store = TestBed.inject(AuthStore);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialize', () => {
    it('should restore session from localStorage', () => {
      const token = 'stored-token';
      const userJson = JSON.stringify({
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt.toISOString()
      });

      localStorage.setItem('auth_token', token);
      localStorage.setItem('current_user', userJson);

      facade.initialize();

      expect(facade.isAuthenticated()).toBe(true);
      expect(facade.token()).toBe(token);
      expect(facade.user()?.username).toBe(mockUser.username);
    });

    it('should not restore session if no data in localStorage', () => {
      facade.initialize();

      expect(facade.isAuthenticated()).toBe(false);
      expect(facade.token()).toBeNull();
      expect(facade.user()).toBeNull();
    });

    it('should handle corrupted user data in localStorage', () => {
      localStorage.setItem('auth_token', 'token');
      localStorage.setItem('current_user', 'invalid-json');

      facade.initialize();

      expect(facade.isAuthenticated()).toBe(false);
    });
  });

  describe('login', () => {
    it('should successfully login and store credentials', (done) => {
      const credentials = { username: 'testuser', password: 'password123' };
      const token = 'new-token';

      mockRepository.login.mockReturnValue(
        of({ token, user: mockUser })
      );

      facade.login(credentials).subscribe({
        next: () => {
          expect(mockRepository.login).toHaveBeenCalledWith(credentials);
          expect(facade.isAuthenticated()).toBe(true);
          expect(facade.token()).toBe(token);
          expect(facade.user()).toEqual(mockUser);
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/main']);
          expect(localStorage.getItem('auth_token')).toBe(token);
          done();
        }
      });
    });

    it('should set loading state during login', (done) => {
      mockRepository.login.mockReturnValue(
        of({ token: 'token', user: mockUser })
      );

      expect(facade.loading()).toBe(false);

      facade.login({ username: 'test', password: 'pass' }).subscribe({
        next: () => {
          expect(facade.loading()).toBe(false); // Should be false after completion
          done();
        }
      });
    });

    it('should handle login error', (done) => {
      const errorMessage = 'Invalid credentials';
      mockRepository.login.mockReturnValue(
        throwError(() => new Error(errorMessage))
      );

      facade.login({ username: 'test', password: 'wrong' }).subscribe({
        error: () => {
          expect(facade.error()).toBe(errorMessage);
          expect(facade.isAuthenticated()).toBe(false);
          expect(mockRouter.navigate).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should persist user data to localStorage', (done) => {
      mockRepository.login.mockReturnValue(
        of({ token: 'token', user: mockUser })
      );

      facade.login({ username: 'test', password: 'pass' }).subscribe({
        next: () => {
          const storedUser = JSON.parse(localStorage.getItem('current_user')!);
          expect(storedUser.id).toBe(mockUser.id);
          expect(storedUser.username).toBe(mockUser.username);
          done();
        }
      });
    });
  });

  describe('logout', () => {
    it('should clear authentication state and navigate to login', () => {
      // Setup authenticated state
      store.setAuthenticated(mockUser, 'token');
      localStorage.setItem('auth_token', 'token');
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      facade.logout();

      expect(facade.isAuthenticated()).toBe(false);
      expect(facade.token()).toBeNull();
      expect(facade.user()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('current_user')).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', (done) => {
      mockRepository.verifyToken.mockReturnValue(of(true));

      facade.verifyToken().subscribe({
        next: (result) => {
          expect(result).toBe(true);
          expect(mockRepository.verifyToken).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should return false for invalid token', (done) => {
      mockRepository.verifyToken.mockReturnValue(of(false));

      facade.verifyToken().subscribe({
        next: (result) => {
          expect(result).toBe(false);
          done();
        }
      });
    });
  });

  describe('getToken', () => {
    it('should return current token', () => {
      store.setAuthenticated(mockUser, 'current-token');
      expect(facade.getToken()).toBe('current-token');
    });

    it('should return null when not authenticated', () => {
      expect(facade.getToken()).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error from store', () => {
      store.setError('Test error');
      expect(facade.error()).toBe('Test error');

      facade.clearError();
      expect(facade.error()).toBeNull();
    });
  });

  describe('Signal exposure', () => {
    it('should expose all necessary signals from store', () => {
      expect(facade.user).toBeDefined();
      expect(facade.token).toBeDefined();
      expect(facade.isAuthenticated).toBeDefined();
      expect(facade.loading).toBeDefined();
      expect(facade.error).toBeDefined();
      expect(facade.username).toBeDefined();
    });

    it('should reflect store state changes', () => {
      store.setAuthenticated(mockUser, 'token');
      expect(facade.user()).toEqual(mockUser);
      expect(facade.username()).toBe(mockUser.username);
    });
  });
});
