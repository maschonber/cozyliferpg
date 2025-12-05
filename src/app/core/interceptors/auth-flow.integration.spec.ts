import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { httpErrorInterceptor } from './http-error.interceptor';
import { AuthFacade } from '../../features/auth/services/auth.facade';
import { AuthStore } from '../../features/auth/store/auth.store';

/**
 * Integration tests for authentication flow
 * Tests the complete lifecycle: token attachment, expiration handling, and logout
 */
describe('Auth Flow Integration', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authFacade: AuthFacade;
  let router: Router;

  beforeEach(() => {
    const routerMock = {
      navigate: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        // Setup both interceptors like in production
        provideHttpClient(withInterceptors([authInterceptor, httpErrorInterceptor])),
        provideHttpClientTesting(),
        AuthFacade,
        AuthStore,
        { provide: Router, useValue: routerMock }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authFacade = TestBed.inject(AuthFacade);
    router = TestBed.inject(Router);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
    localStorage.clear();
  });

  describe('Happy Path: Valid Token', () => {
    it('should attach token to request when authenticated', (done) => {
      // Setup: User is authenticated with valid token
      const mockToken = 'valid-jwt-token';
      authFacade['store'].setAuthenticated(
        { id: '1', username: 'testuser', createdAt: new Date() },
        mockToken
      );

      // Make request
      httpClient.get('/api/relationships').subscribe({
        next: (data) => {
          expect(data).toEqual({ success: true, data: [] });
          done();
        }
      });

      // Verify token was attached
      const req = httpMock.expectOne('/api/relationships');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

      // Respond with success
      req.flush({ success: true, data: [] });
    });
  });

  describe('Error Path: Expired Token', () => {
    it('should logout user when token expires (403 response)', (done) => {
      // Setup: User is authenticated with expired token
      const expiredToken = 'expired-jwt-token';
      authFacade['store'].setAuthenticated(
        { id: '1', username: 'testuser', createdAt: new Date() },
        expiredToken
      );

      jest.spyOn(authFacade, 'logout');

      // Make request
      httpClient.get('/api/relationships').subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          expect(authFacade.logout).toHaveBeenCalled();
          done();
        }
      });

      // Server responds with 403 (expired token)
      const req = httpMock.expectOne('/api/relationships');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${expiredToken}`);
      req.flush(
        { success: false, error: 'Invalid or expired token' },
        { status: 403, statusText: 'Forbidden' }
      );
    });

    it('should redirect to login page after logout on expired token', (done) => {
      // Setup: User is authenticated
      authFacade['store'].setAuthenticated(
        { id: '1', username: 'testuser', createdAt: new Date() },
        'expired-token'
      );

      // Make request
      httpClient.get('/api/relationships').subscribe({
        error: (error) => {
          // Verify logout was called and redirected to login
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
          done();
        }
      });

      // Server responds with 403
      const req = httpMock.expectOne('/api/relationships');
      req.flush(
        { success: false, error: 'Invalid or expired token' },
        { status: 403, statusText: 'Forbidden' }
      );
    });
  });

  describe('Error Path: No Token', () => {
    it('should NOT attach Authorization header when not authenticated', (done) => {
      // Setup: User is not authenticated
      authFacade['store'].clearAuthentication();

      // Make request
      httpClient.get('/api/relationships').subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      // Verify no Authorization header was attached
      const req = httpMock.expectOne('/api/relationships');
      expect(req.request.headers.has('Authorization')).toBe(false);

      // Server responds with 401 (no token provided)
      req.flush(
        { success: false, error: 'Authentication required' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('should NOT logout when receiving 401 if already logged out', (done) => {
      // Setup: User is not authenticated
      authFacade['store'].clearAuthentication();

      jest.spyOn(authFacade, 'logout');

      // Make request
      httpClient.get('/api/relationships').subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          // Should NOT call logout if already logged out
          expect(authFacade.logout).not.toHaveBeenCalled();
          done();
        }
      });

      // Server responds with 401
      const req = httpMock.expectOne('/api/relationships');
      req.flush(
        { success: false, error: 'Authentication required' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('Token Restoration on App Initialization', () => {
    it('should restore token from localStorage and attach to requests', (done) => {
      // Setup: Token exists in localStorage (simulates app restart)
      const storedToken = 'stored-valid-token';
      const storedUser = {
        id: '1',
        username: 'restoreduser',
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('auth_token', storedToken);
      localStorage.setItem('current_user', JSON.stringify(storedUser));

      // Initialize auth (simulates APP_INITIALIZER)
      authFacade.initialize().then(() => {
        // Verify auth was restored
        expect(authFacade.isAuthenticated()).toBe(true);
        expect(authFacade.getToken()).toBe(storedToken);

        // Make request
        httpClient.get('/api/relationships').subscribe({
          next: (data) => {
            expect(data).toEqual({ success: true, data: [] });
            done();
          }
        });

        // Verify token from localStorage was attached
        const req = httpMock.expectOne('/api/relationships');
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${storedToken}`);

        req.flush({ success: true, data: [] });
      });
    });
  });
});
