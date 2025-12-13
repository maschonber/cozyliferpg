import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayerHud } from '../player-hud/player-hud';
import { GameFacade } from '../../services/game.facade';

/**
 * Game Layout Component
 * Wraps all game pages with the Player HUD
 * Ensures game data is initialized for all game routes
 */
@Component({
  selector: 'app-game-layout',
  imports: [RouterOutlet, PlayerHud],
  template: `
    <div class="game-layout">
      <!-- Player HUD - visible on all game pages -->
      <app-player-hud></app-player-hud>

      <!-- Page content -->
      <router-outlet></router-outlet>
    </div>
  `,
  styles: `
    .game-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
  `
})
export class GameLayout implements OnInit {
  private facade = inject(GameFacade);

  ngOnInit(): void {
    // Initialize game data for all game routes
    // This ensures the Player HUD has data even on page reload
    this.facade.initialize();
  }
}
