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
import { ActivityResultModal } from '../activity-result-modal/activity-result-modal';

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
    ActivityButtonComponent
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

  // Filter social activities (require NPC and available at current location)
  socialActivities = computed(() => {
    const player = this.player();
    const currentLocationId = player?.currentLocation;

    return this.activities().filter(activity => {
      // Must be social activity
      if (!activity.requiresNPC) return false;

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

    const previousRelationship = this.selectedRelationship();

    this.facade.performActivity(npcId, activityId).subscribe({
      next: (response) => {
        // Transform response into ActivitySummary for unified modal
        const summary = {
          activity,
          activityType: 'social' as const,
          npc: npc,
          player: this.player()!,
          outcome: response.outcome ? {
            tier: response.outcome.tier,
            description: response.outcome.description
          } : undefined,
          // Include roll details from the outcome
          rollDetails: response.outcome ? {
            roll: response.outcome.roll || 0,
            adjustedRoll: response.outcome.adjustedRoll || 0,
            statBonus: response.outcome.statBonus,
            difficultyPenalty: undefined, // Not used in social activities
            difficultyClass: response.outcome.dc || 100
          } : undefined,
          actualEnergyCost: activity.energyCost,
          actualMoneyCost: activity.moneyCost,
          actualTimeCost: activity.timeCost,
          // Relationship changes
          relationshipChanges: response.relationship && previousRelationship ? {
            previousValues: {
              trust: previousRelationship.trust,
              affection: previousRelationship.affection,
              desire: previousRelationship.desire
            },
            newValues: {
              trust: response.relationship.trust,
              affection: response.relationship.affection,
              desire: response.relationship.desire
            },
            deltas: {
              trust: response.relationship.trust - previousRelationship.trust,
              affection: response.relationship.affection - previousRelationship.affection,
              desire: response.relationship.desire - previousRelationship.desire
            },
            stateChanged: response.stateChanged,
            previousState: response.previousState,
            newState: response.newState
          } : undefined,
          emotionalState: response.emotionalState,
          discoveredTrait: response.discoveredTrait,
          difficultyInfo: response.difficultyInfo
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
  getActivityVariant(activity: any): 'default' | 'positive' | 'negative' {
    const trust = activity.effects?.trust || 0;
    const affection = activity.effects?.affection || 0;
    const desire = activity.effects?.desire || 0;

    if (trust > 0 || affection > 0 || desire > 0) return 'positive';
    if (trust < 0 || affection < 0 || desire < 0) return 'negative';
    return 'default';
  }

  /**
   * Get icon for emotion type
   */
  getEmotionIcon(emotion: string): string {
    const icons: Record<string, string> = {
      joy: 'sentiment_very_satisfied',
      affection: 'favorite',
      excitement: 'star',
      calm: 'spa',
      sadness: 'sentiment_dissatisfied',
      anger: 'mood_bad',
      anxiety: 'psychology',
      romantic: 'favorite_border'
    };
    return icons[emotion] || 'sentiment_neutral';
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
   * Get traits by category
   */
  getTraitsByCategory(category: 'personality' | 'romance' | 'interest'): string[] {
    const npc = this.selectedNPC();
    if (!npc) return [];

    // Category mappings based on trait definitions
    const categoryMap = {
      personality: ['outgoing', 'reserved', 'logical', 'creative', 'intuitive',
                    'adventurous', 'cautious', 'spontaneous', 'optimistic',
                    'melancholic', 'passionate', 'stoic', 'empathetic',
                    'independent', 'nurturing', 'competitive'],
      romance: ['flirtatious', 'romantic', 'physical', 'intellectual',
                'slow_burn', 'intense', 'commitment_seeking', 'free_spirit'],
      interest: ['coffee_lover', 'fitness_enthusiast', 'music_fan',
                 'art_appreciator', 'foodie', 'reader', 'gamer', 'nature_lover']
    };

    return npc.revealedTraits.filter(trait =>
      categoryMap[category].includes(trait as string)
    );
  }

  /**
   * Check if NPC has hidden traits
   */
  hasHiddenTraits(): boolean {
    const npc = this.selectedNPC();
    if (!npc) return false;
    // If there are few revealed traits, hint that more exist
    // NPCs typically have 5-8 traits total
    return npc.revealedTraits.length < 7;
  }
}
