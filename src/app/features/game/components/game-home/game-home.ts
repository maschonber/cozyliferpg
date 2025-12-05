import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { GameFacade } from '../../services/game.facade';
import { Relationship } from '../../../../../../shared/types';
import { PlayerHud } from '../player-hud/player-hud';

@Component({
  selector: 'app-game-home',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
    PlayerHud
  ],
  templateUrl: './game-home.html',
  styleUrl: './game-home.css',
})
export class GameHome implements OnInit {
  private facade = inject(GameFacade);
  private router = inject(Router);

  // Expose facade signals
  npcsWithRelationships = this.facade.npcsWithRelationships;
  relationshipsLoading = this.facade.relationshipsLoading;
  npcsLoading = this.facade.npcsLoading;
  relationshipsError = this.facade.relationshipsError;

  ngOnInit(): void {
    // Initialize game data
    this.facade.initialize();
  }

  /**
   * Meet someone new (generate NPC)
   */
  onMeetSomeoneNew(): void {
    this.facade.createNPC().subscribe({
      next: (npc) => {
        // Navigate to the new NPC's detail page
        this.router.navigate(['/game/neighbor', npc.id]);
      },
      error: (error) => {
        console.error('Failed to create NPC:', error);
      }
    });
  }

  /**
   * View neighbor details
   */
  onViewNeighbor(npcId: string): void {
    this.router.navigate(['/game/neighbor', npcId]);
  }

  /**
   * Get display name for relationship state
   */
  getStateDisplayName(state: string): string {
    return state
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get color for relationship state
   */
  getStateColor(relationship: Relationship): string {
    // Determine color based on friendship and romance values
    if (relationship.friendship >= 50 || relationship.romance >= 50) {
      return 'positive';
    } else if (relationship.friendship <= -20 || relationship.romance <= -20) {
      return 'negative';
    }
    return 'neutral';
  }
}
