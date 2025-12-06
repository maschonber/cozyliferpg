import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GameFacade } from '../../services/game.facade';
import { Relationship } from '../../../../../../shared/types';

@Component({
  selector: 'app-game-home',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './game-home.html',
  styleUrl: './game-home.css',
})
export class GameHome implements OnInit {
  private facade = inject(GameFacade);
  private router = inject(Router);

  // Expose Math for template
  Math = Math;

  // Expose facade signals
  npcsWithRelationships = this.facade.npcsWithRelationships;
  relationshipsLoading = this.facade.relationshipsLoading;
  npcsLoading = this.facade.npcsLoading;
  relationshipsError = this.facade.relationshipsError;
  activities = this.facade.activities;
  activityAvailability = this.facade.activityAvailability;
  player = this.facade.player;
  interacting = this.facade.interacting;
  interactionError = this.facade.interactionError;

  // Filter solo activities (not requiring NPC)
  soloActivities = computed(() => {
    return this.activities().filter(activity => !activity.requiresNPC);
  });

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

  /**
   * Get availability for a specific activity
   */
  getActivityAvailability(activityId: string) {
    const availability = this.activityAvailability();
    return availability.find(a => a.activityId === activityId);
  }

  /**
   * Format time cost (convert minutes to readable format)
   */
  formatTimeCost(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }

  /**
   * Get tooltip text for unavailable activity
   */
  getUnavailableTooltip(activityId: string): string {
    const availability = this.getActivityAvailability(activityId);
    if (!availability || availability.available) {
      return '';
    }
    return availability.reason || 'Activity not available';
  }

  /**
   * Check if activity is available
   */
  isActivityAvailable(activityId: string): boolean {
    const availability = this.getActivityAvailability(activityId);
    return availability?.available ?? true;
  }

  /**
   * Perform solo activity (no NPC required)
   */
  onPerformSoloActivity(activityId: string): void {
    this.facade.performSoloActivity(activityId).subscribe({
      next: () => {
        console.log(`Performed solo activity: ${activityId}`);
      },
      error: (error) => {
        console.error('Failed to perform activity:', error);
      }
    });
  }
}
