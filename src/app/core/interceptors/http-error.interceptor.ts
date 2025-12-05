import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthFacade } from '../../features/auth/services/auth.facade';

/**
 * HTTP Error Interceptor
 * Handles HTTP errors globally, especially authentication errors (401/403)
 * Automatically logs out users with expired/invalid tokens
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle authentication errors (401 Unauthorized or 403 Forbidden)
      if (error.status === 401 || error.status === 403) {
        console.warn(`🔒 Authentication error (${error.status}): ${error.error?.error || error.message}`);

        // Only logout if user is currently authenticated
        // This prevents logout loops when trying to access protected routes while not logged in
        if (authFacade.isAuthenticated()) {
          console.log('🚪 Token expired or invalid - logging out...');
          authFacade.logout();
        }
      }

      // Re-throw the error so components can still handle it if needed
      return throwError(() => error);
    })
  );
};
