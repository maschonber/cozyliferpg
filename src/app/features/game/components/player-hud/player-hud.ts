/**
 * Player HUD Component (Phase 2)
 * Displays player stats: Day, Time, Energy, Money
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { GameFacade } from '../../services/game.facade';

@Component({
  selector: 'app-player-hud',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './player-hud.html',
  styleUrl: './player-hud.css',
})
export class PlayerHud {
  private facade = inject(GameFacade);

  // Expose player signal
  player = this.facade.player;
  playerLoading = this.facade.playerLoading;

  /**
   * Get time slot label (Morning, Afternoon, Evening, Night)
   */
  getTimeSlotLabel(time: string): string {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 18) return 'Afternoon';
    if (hour >= 18 && hour < 24) return 'Evening';
    return 'Night';
  }

  /**
   * Get energy percentage
   */
  getEnergyPercentage(energy: number, maxEnergy: number): number {
    return (energy / maxEnergy) * 100;
  }

  /**
   * Get energy bar color based on level
   */
  getEnergyColor(energy: number): string {
    if (energy >= 70) return 'primary';
    if (energy >= 40) return 'accent';
    return 'warn';
  }

  /**
   * Reset player progress (for debugging)
   */
  onResetPlayer(): void {
    if (confirm('Are you sure you want to reset your progress? This will delete all NPCs and return you to Day 1.')) {
      this.facade.resetPlayer().subscribe({
        next: () => {
          console.log('Player reset successfully');
        },
        error: (error) => {
          console.error('Failed to reset player:', error);
        }
      });
    }
  }
}
