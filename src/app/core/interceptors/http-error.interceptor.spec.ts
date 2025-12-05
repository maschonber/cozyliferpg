import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { httpErrorInterceptor } from './http-error.interceptor';
import { AuthFacade } from '../../features/auth/services/auth.facade';
import { AuthStore } from '../../features/auth/store/auth.store';

describe('HttpErrorInterceptor', () => {
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
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
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
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should logout user on 401 Unauthorized when authenticated', (done) => {
    // Setup: Mock authenticated state
    authFacade['store'].setAuthenticated(
      { id: '1', username: 'test', createdAt: new Date() },
      'fake-token'
    );

    jest.spyOn(authFacade, 'logout');

    // Make HTTP request
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401);
        expect(authFacade.logout).toHaveBeenCalled();
        done();
      }
    });

    // Simulate 401 response
    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should logout user on 403 Forbidden when authenticated', (done) => {
    // Setup: Mock authenticated state
    authFacade['store'].setAuthenticated(
      { id: '1', username: 'test', createdAt: new Date() },
      'fake-token'
    );

    jest.spyOn(authFacade, 'logout');

    // Make HTTP request
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(403);
        expect(authFacade.logout).toHaveBeenCalled();
        done();
      }
    });

    // Simulate 403 response
    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
  });

  it('should NOT logout when receiving 401/403 if not authenticated', (done) => {
    // Setup: Ensure user is not authenticated
    authFacade['store'].clearAuthentication();

    jest.spyOn(authFacade, 'logout');

    // Make HTTP request
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401);
        expect(authFacade.logout).not.toHaveBeenCalled();
        done();
      }
    });

    // Simulate 401 response
    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should NOT intercept non-auth errors (404, 500, etc)', (done) => {
    jest.spyOn(authFacade, 'logout');

    // Make HTTP request
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(404);
        expect(authFacade.logout).not.toHaveBeenCalled();
        done();
      }
    });

    // Simulate 404 response
    const req = httpMock.expectOne('/api/test');
    req.flush({ error: 'Not Found' }, { status: 404, statusText: 'Not Found' });
  });

  it('should allow error to propagate to component error handlers', (done) => {
    // Setup: Mock authenticated state
    authFacade['store'].setAuthenticated(
      { id: '1', username: 'test', createdAt: new Date() },
      'fake-token'
    );

    // Make HTTP request
    httpClient.get('/api/test').subscribe({
      next: () => fail('Should have errored'),
      error: (error: HttpErrorResponse) => {
        // Error should still be thrown so component can handle it
        expect(error.status).toBe(403);
        expect(error.error.error).toBe('Invalid or expired token');
        done();
      }
    });

    // Simulate 403 response
    const req = httpMock.expectOne('/api/test');
    req.flush(
      { error: 'Invalid or expired token' },
      { status: 403, statusText: 'Forbidden' }
    );
  });
});
