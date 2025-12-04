import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root App Component
 *
 * Note: Auth initialization is handled by APP_INITIALIZER in app.config.ts
 * This ensures authentication state is restored from localStorage BEFORE
 * routing begins, preventing race conditions with HTTP requests.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Auth is initialized via APP_INITIALIZER before this component is created
}
