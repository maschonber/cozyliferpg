/**
 * Stats Panel Component (Phase 2.5)
 * Displays player stats organized by category
 */

import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { GameFacade } from '../../services/game.facade';
import { PlayerStats, StatName } from '../../../../../../shared/types';

/**
 * Stat display info
 */
interface StatDisplay {
  name: StatName;
  label: string;
  description: string;
  icon: string;
  base: number;
  current: number;
  maxCurrent: number; // base + 30
}

/**
 * Stat category with stats
 */
interface StatCategory {
  name: string;
  description: string;
  icon: string;
  color: string;
  stats: StatDisplay[];
}

@Component({
  selector: 'app-stats-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatIconModule
  ],
  templateUrl: './stats-panel.html',
  styleUrl: './stats-panel.css'
})
export class StatsPanelComponent {
  private facade = inject(GameFacade);

  // Stat metadata
  private statMeta: Record<StatName, { label: string; description: string; icon: string }> = {
    fitness: {
      label: 'Fitness',
      description: 'Physical strength and endurance. Affects exercise and physical activities.',
      icon: 'fitness_center'
    },
    vitality: {
      label: 'Vitality',
      description: 'Health and energy reserves. Reduces energy costs and aids recovery.',
      icon: 'favorite'
    },
    poise: {
      label: 'Poise',
      description: 'Grace and composure. Helps handle stress and social pressure.',
      icon: 'self_improvement'
    },
    knowledge: {
      label: 'Knowledge',
      description: 'Learning and understanding. Improves study and intellectual tasks.',
      icon: 'school'
    },
    creativity: {
      label: 'Creativity',
      description: 'Imagination and artistic ability. Enhances creative activities.',
      icon: 'palette'
    },
    ambition: {
      label: 'Ambition',
      description: 'Drive and determination. Boosts work performance and career growth.',
      icon: 'trending_up'
    },
    confidence: {
      label: 'Confidence',
      description: 'Self-assurance and charisma. Improves social interactions.',
      icon: 'record_voice_over'
    },
    wit: {
      label: 'Wit',
      description: 'Quick thinking and humor. Makes conversations more engaging.',
      icon: 'lightbulb'
    },
    empathy: {
      label: 'Empathy',
      description: 'Understanding others\' feelings. Deepens relationships.',
      icon: 'volunteer_activism'
    }
  };

  // Computed stat categories
  statCategories = computed<StatCategory[]>(() => {
    const player = this.facade.player();
    if (!player?.stats) return [];

    const stats = player.stats;

    return [
      {
        name: 'Physical',
        description: 'Body and health stats',
        icon: 'directions_run',
        color: '#e57373', // red
        stats: this.buildStatDisplays(stats, ['fitness', 'vitality', 'poise'])
      },
      {
        name: 'Mental',
        description: 'Mind and intellect stats',
        icon: 'psychology',
        color: '#64b5f6', // blue
        stats: this.buildStatDisplays(stats, ['knowledge', 'creativity', 'ambition'])
      },
      {
        name: 'Social',
        description: 'Personality and relationship stats',
        icon: 'groups',
        color: '#81c784', // green
        stats: this.buildStatDisplays(stats, ['confidence', 'wit', 'empathy'])
      }
    ];
  });

  // Player loading state
  isLoading = this.facade.playerLoading;

  private buildStatDisplays(stats: PlayerStats, statNames: StatName[]): StatDisplay[] {
    return statNames.map(name => {
      const meta = this.statMeta[name];
      const base = this.getBaseStat(stats, name);
      const current = this.getCurrentStat(stats, name);

      return {
        name,
        label: meta.label,
        description: meta.description,
        icon: meta.icon,
        base,
        current,
        maxCurrent: Math.min(base + 30, 130) // Absolute max is 100 + 30 = 130
      };
    });
  }

  private getBaseStat(stats: PlayerStats, name: StatName): number {
    const key = `base${name.charAt(0).toUpperCase()}${name.slice(1)}` as keyof PlayerStats;
    return stats[key] as number;
  }

  private getCurrentStat(stats: PlayerStats, name: StatName): number {
    const key = `current${name.charAt(0).toUpperCase()}${name.slice(1)}` as keyof PlayerStats;
    return stats[key] as number;
  }

  /**
   * Calculate progress bar percentage for base stat (out of 100 max)
   */
  getBasePercent(stat: StatDisplay): number {
    return (stat.base / 100) * 100;
  }

  /**
   * Calculate progress bar percentage for current stat
   * Current can exceed base by up to 30, so we show it relative to maxCurrent
   */
  getCurrentPercent(stat: StatDisplay): number {
    return (stat.current / stat.maxCurrent) * 100;
  }

  /**
   * Get current stat bonus above base (if any)
   */
  getCurrentBonus(stat: StatDisplay): number {
    return Math.max(0, stat.current - stat.base);
  }

  /**
   * Format stat tooltip
   */
  getStatTooltip(stat: StatDisplay): string {
    const bonus = this.getCurrentBonus(stat);
    const bonusText = bonus > 0 ? ` (+${bonus.toFixed(1)} temporary)` : '';
    return `${stat.description}\n\nBase: ${stat.base.toFixed(1)}\nCurrent: ${stat.current.toFixed(1)}${bonusText}`;
  }
}
