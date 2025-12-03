import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthFacade } from '../../services/auth.facade';

/**
 * Login Component
 * Thin presentation component that delegates to AuthFacade
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private authFacade = inject(AuthFacade);

  // Form fields
  username = '';
  password = '';

  // Local component state
  localError = signal<string>('');

  // Expose facade signals
  loading = this.authFacade.loading;
  error = this.authFacade.error;

  onSubmit(): void {
    // Clear previous errors
    this.localError.set('');
    this.authFacade.clearError();

    // Validate input
    if (!this.username || !this.password) {
      this.localError.set('Please enter both username and password');
      return;
    }

    // Delegate to facade
    this.authFacade.login({
      username: this.username,
      password: this.password
    }).subscribe({
      error: () => {
        // Error is already handled by facade and stored in store
      }
    });
  }

  /**
   * Get the error message to display (local or from facade)
   */
  getErrorMessage(): string {
    return this.localError() || this.error() || '';
  }
}
