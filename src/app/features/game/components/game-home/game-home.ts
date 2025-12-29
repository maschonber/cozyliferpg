import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { GameFacade } from '../../services/game.facade';
import { PlayerNPCView, LocationWithNPCCount, requiresNPC } from '../../../../../../shared/types';
import { SleepModal } from '../sleep-modal/sleep-modal';
import { ActivityResultModal } from '../activity-result-modal/activity-result-modal';
import { ArchetypeSelectionModal } from '../archetype-selection-modal/archetype-selection-modal';
import { ActivityButtonComponent } from '../../../../shared/components/activity-button/activity-button.component';
import { LocationMarkerComponent } from '../../../../shared/components/location-marker/location-marker.component';
import { StatsPanelComponent } from '../stats-panel/stats-panel';
import { getLocationDisplayName } from '../../../../shared/utils/location.utils';

@Component({
  selector: 'app-game-home',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    ActivityButtonComponent,
    LocationMarkerComponent,
    StatsPanelComponent
  ],
  templateUrl: './game-home.html',
  styleUrl: './game-home.css',
})
export class GameHome {
  private facade = inject(GameFacade);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // Track whether archetype selection has been shown for the current player state
  private archetypeShown = signal(false);

  // Expose Math for template
  Math = Math;

  // Expose facade signals
  playerNPCsAtCurrentLocation = this.facade.playerNPCsAtCurrentLocation;
  playerNPCsLoading = this.facade.playerNPCsLoading;
  playerNPCsError = this.facade.playerNPCsError;
  activities = this.facade.activities;
  activityAvailability = this.facade.activityAvailability;
  player = this.facade.player;
  interacting = this.facade.interacting;
  interactionError = this.facade.interactionError;
  locations = this.facade.locations;

  // Computed signal to check if player is in "new" state (needs archetype selection)
  private isPlayerNew = computed(() => {
    const player = this.player();
    if (!player) return false;

    return (
      player.currentDay === 1 &&
      player.archetype === 'balanced' &&
      player.stats.baseFitness === 15 &&
      player.stats.baseKnowledge === 15
    );
  });

  constructor() {
    // Watch for player state changes to show archetype selection for new players
    // Handles both initial load and player resets
    effect(() => {
      const player = this.player();
      const loading = this.facade.playerLoading();
      const isNew = this.isPlayerNew();

      // When player is loaded and not loading
      if (!loading && player) {
        // If player is new and we haven't shown archetype selection yet, show it
        if (isNew && !this.archetypeShown()) {
          this.archetypeShown.set(true);
          this.showArchetypeSelection();
        }
        // If player is no longer new (archetype was selected), reset the flag
        // This allows showing the modal again if the player resets
        else if (!isNew && this.archetypeShown()) {
          this.archetypeShown.set(false);
        }
      }
    });
  }

  // Filter solo activities available at current location
  // - Not requiring NPC
  // - Excluding sleep (has dedicated button)
  // - Available at current location (no location requirement or matches current)
  soloActivities = computed(() => {
    const player = this.player();
    const currentLocationId = player?.currentLocation;

    return this.activities().filter(activity => {
      // Must be solo activity and not sleep
      if (requiresNPC(activity) || activity.id === 'go_to_sleep') return false;

      // If activity has no location requirement, it's available everywhere
      if (!activity.location) return true;

      // Otherwise, must match current location
      return activity.location === currentLocationId;
    });
  });

  // Get full location data for current location
  currentLocation = computed((): LocationWithNPCCount | undefined => {
    const player = this.player();
    const locations = this.locations();
    if (!player || locations.length === 0) return undefined;
    return locations.find(loc => loc.id === player.currentLocation);
  });

  /**
   * Show archetype selection modal
   */
  private showArchetypeSelection(): void {
    const dialogRef = this.dialog.open(ArchetypeSelectionModal, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: true  // Can't dismiss - must choose
    });

    dialogRef.afterClosed().subscribe((archetype: string | null) => {
      if (archetype) {
        console.log(`Selected archetype: ${archetype}`);
        this.facade.setPlayerArchetype(archetype).subscribe({
          next: () => {
            console.log('✅ Archetype set successfully');
          },
          error: (error) => {
            console.error('❌ Failed to set archetype:', error);
            alert('Failed to set archetype. Please try again.');
          }
        });
      } else {
        // If user somehow closes without selecting, show again
        setTimeout(() => this.showArchetypeSelection(), 100);
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
  getStateColor(playerNPC: PlayerNPCView): string {
    // Determine color based on relationship axes (trust, affection, desire)
    const avgPositive = (playerNPC.trust + playerNPC.affection + playerNPC.desire) / 3;
    if (avgPositive >= 30) {
      return 'positive';
    } else if (avgPositive <= -20) {
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
   * Perform solo activity (no NPC required)
   * Phase 2.5: Shows result modal with stat changes and outcome
   */
  onPerformSoloActivity(activityId: string): void {
    // Special handling for "Meet Someone New" activity
    if (activityId === 'meet_someone') {
      this.onMeetSomeoneNew();
      return;
    }

    const activity = this.activities().find(a => a.id === activityId);
    if (!activity) return;

    this.facade.performActivity(activityId).subscribe({
      next: (result) => {
        // Helper to get outcome description
        const getOutcomeDescription = (tier: string): string => {
          switch (tier) {
            case 'best': return 'Everything went perfectly!';
            case 'okay': return 'Things went well.';
            case 'mixed': return 'Some good, some not so good.';
            case 'catastrophic': return 'Things went wrong...';
            default: return 'Activity completed.';
          }
        };

        // Transform result into ActivitySummary for unified modal
        const summary = {
          activity,
          activityType: result.activityType,
          player: result.player,
          outcome: result.outcome ? {
            tier: result.outcome.tier,
            description: getOutcomeDescription(result.outcome.tier)
          } : undefined,
          rollDetails: result.outcome ? {
            roll: result.outcome.roll,
            adjustedRoll: result.outcome.adjustedRoll,
            statBonus: result.outcome.statBonus,
            difficultyPenalty: result.outcome.difficultyPenalty,
            difficultyClass: result.difficultyBreakdown?.finalDifficulty || 100,
            statsUsed: result.outcome.statsUsed
          } : undefined,
          statChanges: result.statChanges,
          statsTrainedThisActivity: result.statsTrainedThisActivity,
          actualEnergyCost: result.actualEnergyCost,
          actualMoneyCost: result.actualMoneyCost,
          actualTimeCost: result.actualTimeCost,
          difficultyBreakdown: result.difficultyBreakdown
        };

        // Show result modal with unified summary
        this.dialog.open(ActivityResultModal, {
          width: '450px',
          data: { summary }
        });
      },
      error: (error) => {
        console.error('Failed to perform activity:', error);
      }
    });
  }

  /**
   * Meet someone new (generate NPC)
   * First consumes time/energy, then creates NPC
   * Stays on overview page - neighbor is added to the list
   */
  onMeetSomeoneNew(): void {
    // First, perform the activity to consume time/energy
    this.facade.performActivity('meet_someone').subscribe({
      next: () => {
        // Then create the player NPC (generates template + player relationship)
        this.facade.createPlayerNPC().subscribe({
          next: (playerNPC) => {
            console.log(`✅ Met ${playerNPC.name} at ${playerNPC.currentLocation}`);
            // Player NPC is already added to the store by createPlayerNPC
          },
          error: (error: Error) => {
            console.error('Failed to create NPC:', error);
          }
        });
      },
      error: (error: Error) => {
        console.error('Failed to perform meet someone activity:', error);
      }
    });
  }

  /**
   * Sleep and advance to next day
   */
  onSleep(): void {
    const currentPlayer = this.player();
    if (!currentPlayer) return;

    if (confirm('Go to sleep? This will advance to the next day.')) {
      this.facade.sleep().subscribe({
        next: (sleepResult) => {
          // Show sleep modal with results
          this.dialog.open(SleepModal, {
            width: '500px',
            disableClose: true,
            data: {
              sleepResult,
              previousDay: currentPlayer.currentDay
            }
          });
        },
        error: (error) => {
          console.error('Failed to sleep:', error);
          alert('Failed to go to sleep. Please try again.');
        }
      });
    }
  }

  /**
   * Navigate to travel view (Phase 3)
   */
  onOpenLocationSelector(): void {
    this.router.navigate(['/game/travel']);
  }

  /**
   * Get display name for location (Phase 3)
   * Now uses shared utility function
   */
  getLocationDisplayName = getLocationDisplayName;
}
