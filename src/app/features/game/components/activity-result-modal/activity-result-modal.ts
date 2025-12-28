/**
 * Activity Result Modal (Phase 2.5 + Social Activities)
 * Shows unified outcome summary for both solo and social activities
 * - Solo: stat changes, resource costs, outcome tier
 * - Social: relationship changes (trust/affection/desire), emotion state, trait discovery
 */

import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  ActivitySummary,
  StatChange,
  OutcomeTier
} from '../../../../../../shared/types';
import { EmotionDisplayComponent } from '../../../../shared/components/emotion-display/emotion-display.component';

export interface ActivityResultModalData {
  summary: ActivitySummary;
}

@Component({
  selector: 'app-activity-result-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    EmotionDisplayComponent
  ],
  templateUrl: './activity-result-modal.html',
  styleUrl: './activity-result-modal.css'
})
export class ActivityResultModal {
  private dialogRef = inject(MatDialogRef<ActivityResultModal>);
  data = inject<ActivityResultModalData>(MAT_DIALOG_DATA);

  /** Previous emotion (before activity) */
  previousEmotion = computed(() => this.data.summary.emotionTransition?.previous ?? null);

  /** Current emotion (after activity) */
  currentEmotion = computed(() => this.data.summary.emotionTransition?.current ?? null);

  /** Whether emotion actually changed */
  emotionChanged = computed(() => {
    const prev = this.previousEmotion();
    const curr = this.currentEmotion();
    if (!prev || !curr) return false;
    return prev.emotion !== curr.emotion || prev.intensity !== curr.intensity;
  });

  /**
   * Get display info for outcome tier
   */
  getTierInfo(tier: string): { label: string; icon: string; color: string; description: string } {
    switch (tier) {
      case 'best':
        return {
          label: 'Best Outcome',
          icon: 'stars',
          color: '#ffd700',
          description: 'Everything went perfectly!'
        };
      case 'okay':
        return {
          label: 'Good Outcome',
          icon: 'thumb_up',
          color: '#4caf50',
          description: 'Things went well.'
        };
      case 'mixed':
        return {
          label: 'Mixed Results',
          icon: 'swap_horiz',
          color: '#ff9800',
          description: 'Some good, some not so good.'
        };
      case 'catastrophic':
        return {
          label: 'Catastrophic',
          icon: 'error',
          color: '#f44336',
          description: 'Things went wrong...'
        };
      default:
        return {
          label: 'Unknown',
          icon: 'help',
          color: '#9e9e9e',
          description: ''
        };
    }
  }

  /**
   * Get icon for stat name
   */
  getStatIcon(stat: string): string {
    const icons: Record<string, string> = {
      fitness: 'fitness_center',
      vitality: 'favorite',
      poise: 'self_improvement',
      knowledge: 'school',
      creativity: 'palette',
      ambition: 'trending_up',
      confidence: 'record_voice_over',
      wit: 'lightbulb',
      empathy: 'volunteer_activism'
    };
    return icons[stat] || 'star';
  }

  /**
   * Format stat name for display
   */
  formatStatName(stat: string): string {
    return stat.charAt(0).toUpperCase() + stat.slice(1);
  }

  /**
   * Check if this is a solo or social activity
   */
  get isSoloActivity(): boolean {
    return this.data.summary.activityType === 'solo';
  }

  get isSocialActivity(): boolean {
    return this.data.summary.activityType === 'social';
  }

  /**
   * Get icon for activity based on type
   */
  get activityIcon(): string {
    const activityType = this.data.summary.activity.type;
    switch (activityType) {
      case 'work': return 'work';
      case 'social': return 'groups';
      case 'training': return 'school';
      case 'recovery': return 'spa';
      case 'discovery': return 'explore';
      default: return 'local_activity';
    }
  }

  /**
   * Get activity difficulty (safely handles optional field)
   */
  get activityDifficulty(): number {
    const activity = this.data.summary.activity;
    return ('difficulty' in activity && activity.difficulty !== undefined) ? activity.difficulty : 0;
  }

  /**
   * Get stat changes that increased current
   */
  get positiveChanges(): StatChange[] {
    return (this.data.summary.statChanges || []).filter(c => c.currentDelta > 0);
  }

  /**
   * Get stat changes that decreased current
   */
  get negativeChanges(): StatChange[] {
    return (this.data.summary.statChanges || []).filter(c => c.currentDelta < 0);
  }

  /**
   * Check if activity had a roll outcome
   */
  get hasOutcome(): boolean {
    return !!this.data.summary.outcome;
  }

  /**
   * Check if there are any stat changes
   */
  get hasStatChanges(): boolean {
    return (this.data.summary.statChanges?.length || 0) > 0;
  }

  /**
   * Get actual energy cost (including outcome effects)
   */
  get actualEnergyCost(): number {
    return this.data.summary.actualEnergyCost ?? this.data.summary.activity.energyCost;
  }

  /**
   * Get actual money cost (including outcome effects)
   */
  get actualMoneyCost(): number {
    return this.data.summary.actualMoneyCost ?? this.data.summary.activity.moneyCost;
  }

  /**
   * Get actual time cost (including outcome effects)
   */
  get actualTimeCost(): number {
    return this.data.summary.actualTimeCost ?? this.data.summary.activity.timeCost;
  }

  /**
   * Check if energy cost was increased by outcome
   */
  get hasAdditionalEnergyCost(): boolean {
    return this.actualEnergyCost < this.data.summary.activity.energyCost;
  }

  /**
   * Check if money cost was increased by outcome
   */
  get hasAdditionalMoneyCost(): boolean {
    return this.actualMoneyCost < this.data.summary.activity.moneyCost;
  }

  /**
   * Check if time cost was increased by outcome
   */
  get hasAdditionalTimeCost(): boolean {
    return this.actualTimeCost > this.data.summary.activity.timeCost;
  }

  /**
   * Check if outcome was a critical success
   */
  get isCritSuccess(): boolean {
    const rollDetails = this.data.summary.rollDetails;
    if (!rollDetails) return false;
    // Check if the roll was in the crit success range (152-200)
    return rollDetails.roll >= 152 && rollDetails.roll <= 200;
  }

  /**
   * Check if outcome was a critical failure
   */
  get isCritFail(): boolean {
    const rollDetails = this.data.summary.rollDetails;
    if (!rollDetails) return false;
    // Check if the roll was in the crit fail range (2-50)
    return rollDetails.roll >= 2 && rollDetails.roll <= 50;
  }

  /**
   * Get DC value for display
   */
  get dc(): number {
    const rollDetails = this.data.summary.rollDetails;
    if (rollDetails) {
      return rollDetails.difficultyClass;
    }
    // Fallback to old calculation for backwards compatibility
    return 100 + this.activityDifficulty;
  }

  /**
   * Check if there are relationship changes to display
   */
  get hasRelationshipChanges(): boolean {
    return !!this.data.summary.relationshipChanges;
  }

  /**
   * Get relationship axis changes with non-zero deltas
   */
  get relationshipAxisChanges(): Array<{ axis: string; delta: number; icon: string }> {
    if (!this.data.summary.relationshipChanges) return [];

    const changes = this.data.summary.relationshipChanges.deltas;
    const result = [];

    if (changes.trust !== 0) {
      result.push({ axis: 'Trust', delta: changes.trust, icon: 'security' });
    }
    if (changes.affection !== 0) {
      result.push({ axis: 'Affection', delta: changes.affection, icon: 'favorite' });
    }
    if (changes.desire !== 0) {
      result.push({ axis: 'Desire', delta: changes.desire, icon: 'local_fire_department' });
    }

    return result;
  }

  /**
   * Get icon for relationship axis
   */
  getRelationshipIcon(axis: string): string {
    const icons: Record<string, string> = {
      trust: 'security',
      affection: 'favorite',
      desire: 'local_fire_department'
    };
    return icons[axis.toLowerCase()] || 'favorite';
  }

  /**
   * Format relationship state for display
   */
  formatRelationshipState(state: string): string {
    return state
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Check if we have emotion transition data
   */
  get hasEmotionTransition(): boolean {
    return !!this.data.summary.emotionTransition;
  }


  /**
   * Calculate outcome probabilities based on current stat and difficulty
   * Replicates backend logic for client-side display
   */
  calculateProbabilities(): Record<OutcomeTier, number> {
    const rollDetails = this.data.summary.rollDetails;
    const statValue = rollDetails?.statBonus || 0;
    const difficulty = this.activityDifficulty;
    const dc = 100 + difficulty;

    const BASE_DC = 100;
    const OUTCOME_OFFSETS = { catastrophic: -50, best: 50 };
    const CRIT_RANGES = {
      fail: { min: 2, max: 50 },
      success: { min: 152, max: 200 }
    };

    const counts: Record<OutcomeTier, number> = {
      catastrophic: 0,
      mixed: 0,
      okay: 0,
      best: 0
    };

    let totalCombinations = 0;

    // Simulate all 2d100 rolls
    for (let die1 = 1; die1 <= 100; die1++) {
      for (let die2 = 1; die2 <= 100; die2++) {
        const diceRoll = die1 + die2;
        const total = diceRoll + statValue;

        // Check crits
        const isCritFail = diceRoll >= CRIT_RANGES.fail.min && diceRoll <= CRIT_RANGES.fail.max;
        const isCritSuccess = diceRoll >= CRIT_RANGES.success.min && diceRoll <= CRIT_RANGES.success.max;

        // Determine base tier
        let baseTier: OutcomeTier;
        if (total <= dc + OUTCOME_OFFSETS.catastrophic) baseTier = 'catastrophic';
        else if (total < dc) baseTier = 'mixed';
        else if (total >= dc + OUTCOME_OFFSETS.best) baseTier = 'best';
        else baseTier = 'okay';

        // Apply crit shifts
        let finalTier = baseTier;
        if (isCritSuccess) {
          if (baseTier === 'catastrophic') finalTier = 'mixed';
          else if (baseTier === 'mixed') finalTier = 'okay';
          else if (baseTier === 'okay') finalTier = 'best';
        } else if (isCritFail) {
          if (baseTier === 'best') finalTier = 'okay';
          else if (baseTier === 'okay') finalTier = 'mixed';
          else if (baseTier === 'mixed') finalTier = 'catastrophic';
        }

        counts[finalTier]++;
        totalCombinations++;
      }
    }

    return {
      catastrophic: Math.round((counts.catastrophic / totalCombinations) * 1000) / 10,
      mixed: Math.round((counts.mixed / totalCombinations) * 1000) / 10,
      okay: Math.round((counts.okay / totalCombinations) * 1000) / 10,
      best: Math.round((counts.best / totalCombinations) * 1000) / 10
    };
  }

  /**
   * Get outcome probabilities (memoized for performance)
   */
  private _probabilities?: Record<OutcomeTier, number>;
  get outcomeProbabilities(): Record<OutcomeTier, number> {
    if (!this._probabilities && this.hasOutcome) {
      this._probabilities = this.calculateProbabilities();
    }
    return this._probabilities || { catastrophic: 0, mixed: 0, okay: 0, best: 0 };
  }

  /**
   * Check if we have stat contribution data
   */
  get hasStatContributions(): boolean {
    return !!(this.data.summary.rollDetails?.statsUsed && this.data.summary.rollDetails.statsUsed.length > 0);
  }

  /**
   * Get formatted stat contributions for display
   */
  get statContributions(): Array<{ name: string; value: number; icon: string }> {
    const statsUsed = this.data.summary.rollDetails?.statsUsed || [];
    return statsUsed.map(stat => ({
      name: stat.displayName,
      value: stat.currentValue,
      icon: this.getStatIcon(stat.statName)
    }));
  }

  /**
   * Check if we have difficulty breakdown data
   */
  get hasDifficultyBreakdown(): boolean {
    return !!this.data.summary.difficultyBreakdown;
  }

  /**
   * Get difficulty modifiers for display
   */
  get difficultyModifiers(): Array<{ label: string; value: number; description: string }> {
    const breakdown = this.data.summary.difficultyBreakdown;
    if (!breakdown) return [];

    const modifiers: Array<{ label: string; value: number; description: string }> = [];

    // Base difficulty (always present)
    modifiers.push({
      label: 'Base DC',
      value: breakdown.baseDifficulty,
      description: 'Base difficulty class'
    });

    // Activity modifier (solo activities)
    if (breakdown.activityModifier !== undefined && breakdown.activityModifier !== 0) {
      modifiers.push({
        label: 'Activity',
        value: breakdown.activityModifier,
        description: 'Activity difficulty'
      });
    }

    // Relationship modifier (social activities)
    if (breakdown.relationshipModifier !== undefined && breakdown.relationshipModifier !== 0) {
      modifiers.push({
        label: 'Relationship',
        value: breakdown.relationshipModifier,
        description: breakdown.relationshipModifier > 0
          ? 'Strained relationship'
          : 'Good relationship'
      });
    }

    // Trait bonus (social activities)
    if (breakdown.traitBonus !== undefined && breakdown.traitBonus !== 0) {
      modifiers.push({
        label: 'Traits',
        value: breakdown.traitBonus,
        description: breakdown.traitBonus > 0
          ? 'NPC traits make this harder'
          : 'NPC traits make this easier'
      });
    }

    return modifiers;
  }

  /**
   * Check if we have individual trait contributions
   */
  get hasIndividualTraits(): boolean {
    const breakdown = this.data.summary.difficultyBreakdown;
    return !!(breakdown?.traitBreakdown?.individualTraits && breakdown.traitBreakdown.individualTraits.length > 0);
  }

  /**
   * Get individual trait contributions for display
   */
  get individualTraitContributions(): Array<{ name: string; bonus: number }> {
    const breakdown = this.data.summary.difficultyBreakdown;
    if (!breakdown?.traitBreakdown?.individualTraits) return [];

    return breakdown.traitBreakdown.individualTraits.map(trait => ({
      name: trait.traitName,
      bonus: trait.bonus
    }));
  }

  onContinue(): void {
    this.dialogRef.close();
  }
}
