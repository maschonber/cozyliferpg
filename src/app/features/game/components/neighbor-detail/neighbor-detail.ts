import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { GameFacade } from '../../services/game.facade';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-neighbor-detail',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  templateUrl: './neighbor-detail.html',
  styleUrl: './neighbor-detail.css',
})
export class NeighborDetail implements OnInit, OnDestroy {
  private facade = inject(GameFacade);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptions = new Subscription();

  // Expose facade signals
  selectedNPC = this.facade.selectedNPC;
  selectedRelationship = this.facade.selectedRelationship;
  activities = this.facade.activities;
  interacting = this.facade.interacting;
  interactionError = this.facade.interactionError;
  relationshipsLoading = this.facade.relationshipsLoading;

  ngOnInit(): void {
    // Get NPC ID from route params
    const npcId = this.route.snapshot.paramMap.get('id');
    if (npcId) {
      this.facade.selectNPC(npcId);

      // Load relationship if not already loaded
      this.facade.getRelationship(npcId).subscribe({
        error: (error) => {
          console.error('Failed to load relationship:', error);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.facade.selectNPC(null);
  }

  /**
   * Navigate back to home
   */
  onBack(): void {
    this.router.navigate(['/game']);
  }

  /**
   * Perform an activity
   */
  onPerformActivity(activityId: string): void {
    const npcId = this.selectedNPC()?.id;
    if (!npcId) return;

    this.facade.performActivity(npcId, activityId).subscribe({
      error: (error) => {
        console.error('Failed to perform activity:', error);
      }
    });
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
   * Get progress bar value (convert -100/+100 to 0-100 range)
   */
  getProgressValue(value: number): number {
    return ((value + 100) / 200) * 100;
  }

  /**
   * Get color for progress bar
   */
  getProgressColor(value: number): string {
    if (value >= 50) return 'primary';
    if (value <= -20) return 'warn';
    return 'accent';
  }

  /**
   * Format appearance description
   */
  formatAppearance(): string {
    const npc = this.selectedNPC();
    if (!npc) return '';

    const { appearance } = npc;
    const parts = [
      `${appearance.height}, ${appearance.build} build`,
      `${appearance.skinTone} skin`,
      `${appearance.hairStyle} ${appearance.hairColor} hair`,
      `${appearance.eyeColor} eyes`
    ];

    if (appearance.distinctiveFeatures && appearance.distinctiveFeatures.length > 0) {
      parts.push(appearance.distinctiveFeatures.join(', '));
    }

    return parts.join(' • ');
  }
}
