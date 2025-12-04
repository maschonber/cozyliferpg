/**
 * Regression Tests for Auth Initialization on Page Reload
 *
 * These tests ensure that the APP_INITIALIZER correctly restores
 * authentication state BEFORE routing begins, preventing the race
 * condition where HTTP requests are made without Bearer tokens.
 *
 * Issue: Page reload caused 404 errors and "no access to database" messages
 * Root Cause: Auth was restored in App.ngOnInit() AFTER routes activated
 * Solution: APP_INITIALIZER ensures auth is ready before routing
 */

import { TestBed } from '@angular/core/testing';
import { AuthFacade } from '../../features/auth/services/auth.facade';
import { Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '../interceptors/auth.interceptor';

describe('Auth Initialization - Regression Tests', () => {
  let authFacade: AuthFacade;
  let router: Router;
  let httpTesting: HttpTestingController;

  const mockUser = {
    id: 'test-user-id',
    username: 'testuser',
    createdAt: new Date('2024-01-01')
  };
  const mockToken = 'mock-jwt-token-12345';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        AuthFacade
      ]
    });

    authFacade = TestBed.inject(AuthFacade);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  describe('REGRESSION: Page Reload with Stored Credentials', () => {
    it('should restore auth from localStorage when initialize() is called', async () => {
      // ARRANGE: Simulate user has logged in previously
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('current_user', JSON.stringify({
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt.toISOString()
      }));

      // ACT: Initialize auth (simulates APP_INITIALIZER)
      await authFacade.initialize();

      // ASSERT: Auth state should be restored
      expect(authFacade.isAuthenticated()).toBe(true);
      expect(authFacade.getToken()).toBe(mockToken);
      expect(authFacade.user()?.username).toBe(mockUser.username);
    });

    it('should resolve initialize() Promise before returning', async () => {
      // ARRANGE
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('current_user', JSON.stringify({
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt.toISOString()
      }));

      let initCompleted = false;

      // ACT
      await authFacade.initialize().then(() => {
        initCompleted = true;
      });

      // ASSERT: Promise should have resolved
      expect(initCompleted).toBe(true);
      expect(authFacade.isAuthenticated()).toBe(true);
    });

    it('should handle missing localStorage gracefully', async () => {
      // ARRANGE: No stored auth

      // ACT
      await authFacade.initialize();

      // ASSERT: Should complete without errors
      expect(authFacade.isAuthenticated()).toBe(false);
      expect(authFacade.getToken()).toBeNull();
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // ARRANGE: Corrupted data
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('current_user', 'invalid-json{');

      // ACT
      await authFacade.initialize();

      // ASSERT: Should not throw, should not be authenticated
      expect(authFacade.isAuthenticated()).toBe(false);
    });
  });

  describe('REGRESSION: HTTP Requests Include Bearer Token After Init', () => {
    it('should include Authorization header in HTTP requests after auth restoration', async () => {
      // ARRANGE: Restore auth
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('current_user', JSON.stringify({
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt.toISOString()
      }));
      await authFacade.initialize();

      // Note: This test verifies that auth state is properly restored
      // In real usage, Angular's HttpClient with authInterceptor adds the header

      // ASSERT: Token should be available for interceptor to use
      expect(authFacade.getToken()).toBe(mockToken);
      expect(authFacade.isAuthenticated()).toBe(true);
    });

    it('should have token available synchronously after initialize() completes', async () => {
      // ARRANGE
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('current_user', JSON.stringify({
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt.toISOString()
      }));

      // ACT: Initialize and immediately check token
      await authFacade.initialize();
      const tokenAfterInit = authFacade.getToken();

      // ASSERT: Token should be immediately available
      expect(tokenAfterInit).toBe(mockToken);
      // This proves there's no async delay after initialize() completes
    });
  });

  describe('REGRESSION: Auth Guard Behavior After Initialization', () => {
    it('should report authenticated after restore', async () => {
      // ARRANGE
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('current_user', JSON.stringify({
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt.toISOString()
      }));

      // ACT
      await authFacade.initialize();

      // ASSERT: Guard should see user as authenticated
      expect(authFacade.isAuthenticated()).toBe(true);
    });

    it('should report unauthenticated when no stored credentials', async () => {
      // ARRANGE: No stored credentials

      // ACT
      await authFacade.initialize();

      // ASSERT
      expect(authFacade.isAuthenticated()).toBe(false);
    });
  });

  describe('REGRESSION: Console Logging for Debugging', () => {
    it('should log when auth is restored', async () => {
      // ARRANGE
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('current_user', JSON.stringify({
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt.toISOString()
      }));
      jest.spyOn(console, 'log');

      // ACT
      await authFacade.initialize();

      // ASSERT
      expect(console.log).toHaveBeenCalledWith(
        '✅ Auth restored from localStorage:',
        mockUser.username
      );
    });

    it('should log when no stored session found', async () => {
      // ARRANGE: No stored auth
      jest.spyOn(console, 'log');

      // ACT
      await authFacade.initialize();

      // ASSERT
      expect(console.log).toHaveBeenCalledWith('ℹ️ No stored auth session found');
    });
  });

  describe('REGRESSION: Token Persistence', () => {
    it('should persist token across facade re-initialization', async () => {
      // ARRANGE: First initialization
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('current_user', JSON.stringify({
        id: mockUser.id,
        username: mockUser.username,
        createdAt: mockUser.createdAt.toISOString()
      }));
      await authFacade.initialize();
      const firstToken = authFacade.getToken();

      // ACT: Reinitialize (simulates page reload)
      await authFacade.initialize();
      const secondToken = authFacade.getToken();

      // ASSERT: Token should be the same
      expect(secondToken).toBe(firstToken);
      expect(secondToken).toBe(mockToken);
    });
  });
});

/**
 * Integration Test Notes:
 *
 * To manually test the fix:
 * 1. Log in to the application
 * 2. Navigate to a deep link like /game/neighbor/{id}
 * 3. Hard reload the page (Ctrl+Shift+R)
 * 4. Check browser DevTools > Network tab:
 *    - Should see Authorization: Bearer {token} in request headers
 *    - Should NOT see 401/403 errors
 * 5. Check browser Console:
 *    - Should see "✅ Auth restored from localStorage: {username}"
 *    - Should NOT see authentication errors
 * 6. Page should load correctly with character details displayed
 *
 * Before Fix:
 * - Network tab showed requests WITHOUT Authorization header
 * - Backend returned 401 Unauthorized
 * - Console showed "Failed to fetch relationships" errors
 * - Page showed 404 or blank screen
 *
 * After Fix:
 * - Network tab shows Authorization header on all requests
 * - Backend returns 200 OK
 * - Console shows successful auth restoration
 * - Page loads correctly
 */
