import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayerHud } from '../player-hud/player-hud';

/**
 * Game Layout Component
 * Wraps all game pages with the Player HUD
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
export class GameLayout {}
