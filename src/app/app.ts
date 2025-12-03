import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthFacade } from './features/auth/services/auth.facade';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private authFacade = inject(AuthFacade);

  ngOnInit(): void {
    // Initialize auth state from localStorage
    this.authFacade.initialize();
  }
}
