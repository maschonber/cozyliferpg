import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { GameFacade } from '../../services/game.facade';
import { Subscription } from 'rxjs';
import { ActivityButtonComponent } from '../../../../shared/components/activity-button/activity-button.component';
import { EmotionDisplayComponent } from '../../../../shared/components/emotion-display/emotion-display.component';
import { ActivityResultModal } from '../activity-result-modal/activity-result-modal';
import {
  requiresNPC,
  isSocialActivity
} from '../../../../../../shared/types';

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
    MatChipsModule,
    ActivityButtonComponent,
    EmotionDisplayComponent
  ],
  templateUrl: './neighbor-detail.html',
  styleUrl: './neighbor-detail.css',
})
export class NeighborDetail implements OnInit, OnDestroy {
  private facade = inject(GameFacade);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private subscriptions = new Subscription();

  // Expose Math for template
  Math = Math;

  // Expose facade signals
  selectedNPC = this.facade.selectedNPC;
  selectedRelationship = this.facade.selectedRelationship;
  activities = this.facade.activities;
  activityAvailability = this.facade.activityAvailability;
  activitiesLoading = this.facade.activitiesLoading;
  interacting = this.facade.interacting;
  interactionError = this.facade.interactionError;
  relationshipsLoading = this.facade.relationshipsLoading;
  npcsLoading = this.facade.npcsLoading;
  isLoading = this.facade.isLoading;
  player = this.facade.player;

  /** NPC's current emotion interpretation (for display component) */
  npcEmotion = computed(() => this.selectedNPC()?.emotionInterpretation ?? null);

  // Filter social activities (require NPC and available at current location)
  socialActivities = computed(() => {
    const player = this.player();
    const currentLocationId = player?.currentLocation;

    return this.activities().filter(activity => {
      // Must be social activity
      if (!requiresNPC(activity)) return false;

      // If activity has no location requirement, it's available everywhere
      if (!activity.location) return true;

      // Otherwise, must match current location
      return activity.location === currentLocationId;
    });
  });

  ngOnInit(): void {
    // Get NPC ID from route params
    const npcId = this.route.snapshot.paramMap.get('id');
    if (npcId) {
      // Resolver has already loaded NPC, relationship, and activities data
      // Just select the NPC to update the store's selectedNPCId
      this.facade.selectNPC(npcId);

      // Check if resolver succeeded by verifying data in route
      const resolverData = this.route.snapshot.data['data'];
      if (resolverData) {
        if (!resolverData.npcLoaded) {
          console.warn('⚠️ Failed to load NPC via resolver');
        }
        if (!resolverData.relationshipLoaded) {
          console.warn('⚠️ Failed to load relationship via resolver');
        }
        if (!resolverData.activitiesLoaded) {
          console.warn('⚠️ Activities not loaded via resolver, attempting fallback...');
          // Final fallback: try to load activities directly
          this.facade.ensureActivitiesLoaded().subscribe({
            next: (success) => {
              if (success) {
                console.log('✅ Activities loaded via component fallback');
              } else {
                console.error('❌ Failed to load activities - spend time actions will not be available');
              }
            }
          });
        }
      }
    } else {
      console.error('No NPC ID in route parameters');
      this.router.navigate(['/game']);
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
   * Delete the current NPC
   */
  onDeleteNPC(): void {
    const npc = this.selectedNPC();
    if (!npc) return;

    // Confirm before deleting
    if (!confirm(`Are you sure you want to delete ${npc.name}? This action cannot be undone.`)) {
      return;
    }

    this.facade.deleteNPC(npc.id).subscribe({
      next: () => {
        console.log('✅ NPC deleted successfully');
        this.router.navigate(['/game']);
      },
      error: (error) => {
        console.error('Failed to delete NPC:', error);
        alert('Failed to delete character. Please try again.');
      }
    });
  }

  /**
   * Perform an activity
   */
  onPerformActivity(activityId: string): void {
    const npc = this.selectedNPC();
    const npcId = npc?.id;
    if (!npcId || !npc) return;

    const activity = this.activities().find(a => a.id === activityId);
    if (!activity) return;

    // Capture previous emotion before performing activity (for transition animation)
    const previousEmotion = npc.emotionInterpretation;

    this.facade.performActivity(activityId, npcId).subscribe({
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
          npc: result.npc,
          player: result.player,
          outcome: result.outcome ? {
            tier: result.outcome.tier,
            description: getOutcomeDescription(result.outcome.tier)
          } : undefined,
          // Include roll details from the outcome
          rollDetails: result.outcome ? {
            roll: result.outcome.roll,
            adjustedRoll: result.outcome.adjustedRoll,
            statBonus: result.outcome.statBonus,
            difficultyPenalty: result.outcome.difficultyPenalty,
            difficultyClass: result.difficultyBreakdown?.finalDifficulty || 100,
            statsUsed: result.outcome.statsUsed
          } : undefined,
          // Stat changes (now included for social activities!)
          statChanges: result.statChanges,
          statsTrainedThisActivity: result.statsTrainedThisActivity,
          // Resource costs
          actualEnergyCost: result.actualEnergyCost,
          actualMoneyCost: result.actualMoneyCost,
          actualTimeCost: result.actualTimeCost,
          // Relationship changes (directly from result)
          relationshipChanges: result.relationshipChanges ? {
            ...result.relationshipChanges,
            stateChanged: result.stateChanged,
            previousState: result.previousState,
            newState: result.newState
          } : undefined,
          emotionalState: result.emotionalState,
          // Emotion transition for animated display
          emotionTransition: (previousEmotion && result.npc?.emotionInterpretation) ? {
            previous: previousEmotion,
            current: result.npc.emotionInterpretation
          } : undefined,
          discoveredTrait: result.discoveredTrait,
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
      `${appearance.height}, ${appearance.bodyType} build`,
      `${appearance.skinTone} skin`,
      `${appearance.hairStyle} ${appearance.hairColor} hair`,
      `${appearance.eyeColor} eyes`
    ];

    if (appearance.faceDetails && appearance.faceDetails.length > 0) {
      parts.push(appearance.faceDetails.join(', '));
    }

    return parts.join(' • ');
  }

  /**
   * Get availability for a specific activity
   */
  getActivityAvailability(activityId: string) {
    const availability = this.activityAvailability();
    return availability.find(a => a.activityId === activityId);
  }

  /**
   * Get variant for activity button (positive/negative coloring)
   */
  getActivityEffects(activity: any): { trust?: number; affection?: number; desire?: number } | undefined {
    if (isSocialActivity(activity)) {
      return activity.relationshipEffects;
    }
    return undefined;
  }

  getActivityVariant(activity: any): 'default' | 'positive' | 'negative' {
    const effects = this.getActivityEffects(activity);
    const trust = effects?.trust || 0;
    const affection = effects?.affection || 0;
    const desire = effects?.desire || 0;

    if (trust > 0 || affection > 0 || desire > 0) return 'positive';
    if (trust < 0 || affection < 0 || desire < 0) return 'negative';
    return 'default';
  }

  /**
   * Get icon for emotion type (Plutchik emotions)
   */
  getEmotionIcon(emotion: string): string {
    const icons: Record<string, string> = {
      // Base emotions
      joy: 'sentiment_very_satisfied',
      sadness: 'sentiment_dissatisfied',
      acceptance: 'handshake',
      disgust: 'sick',
      anger: 'mood_bad',
      fear: 'warning',
      anticipation: 'trending_up',
      surprise: 'priority_high',
      // Special states
      neutral: 'sentiment_neutral',
      mixed: 'shuffle',
      // Common dyads
      love: 'favorite',
      optimism: 'wb_sunny',
      submission: 'volunteer_activism',
      awe: 'auto_awesome',
      disappointment: 'sentiment_dissatisfied',
      remorse: 'heart_broken',
      contempt: 'thumb_down',
      aggression: 'flash_on',
    };
    return icons[emotion] || 'sentiment_neutral';
  }

  /**
   * Format emotion interpretation for display
   */
  formatEmotionLabel(interpretation: { emotion: string; intensity?: string }): string {
    const emotion = interpretation.emotion;
    const intensity = interpretation.intensity;

    // Capitalize the emotion name
    const emotionName = emotion.charAt(0).toUpperCase() + emotion.slice(1);

    // Add intensity prefix if present
    if (intensity === 'high') {
      return `Very ${emotionName}`;
    } else if (intensity === 'low') {
      return `Slightly ${emotionName}`;
    }

    return emotionName;
  }

  /**
   * Format trait name for display
   */
  formatTraitName(trait: string): string {
    return trait.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Get all revealed traits for display
   */
  getRevealedTraits(): string[] {
    const npc = this.selectedNPC();
    if (!npc) return [];
    return npc.revealedTraits;
  }

  /**
   * Check if NPC has hidden traits
   */
  hasHiddenTraits(): boolean {
    const npc = this.selectedNPC();
    if (!npc) return false;
    // If there are unrevealed traits, hint that more exist
    // NPCs have 1-3 traits total
    return npc.revealedTraits.length < npc.traits.length;
  }
}
