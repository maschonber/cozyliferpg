/**
 * Stat Definitions
 *
 * Core metadata for all player stats.
 * Note: We intentionally do NOT track "training methods" here.
 * Whether a stat has activities or pattern evaluators is determined
 * by which activities/evaluators exist, not by a static definition.
 */

import { StatName } from '../../../../shared/types';

export type StatCategory = 'physical' | 'mental' | 'social';

export interface StatDefinition {
  name: StatName;
  category: StatCategory;
}

/**
 * Core stat definitions.
 */
export const STAT_DEFINITIONS: Record<StatName, StatDefinition> = {
  // Physical stats
  fitness:    { name: 'fitness',    category: 'physical' },
  vitality:   { name: 'vitality',   category: 'physical' },
  poise:      { name: 'poise',      category: 'physical' },

  // Mental stats
  knowledge:  { name: 'knowledge',  category: 'mental' },
  ambition:   { name: 'ambition',   category: 'mental' },
  creativity: { name: 'creativity', category: 'mental' },

  // Social stats
  confidence: { name: 'confidence', category: 'social' },
  empathy:    { name: 'empathy',    category: 'social' },
  wit:        { name: 'wit',        category: 'social' },
};

export const ALL_STATS = Object.keys(STAT_DEFINITIONS) as StatName[];

export function getStatCategory(stat: StatName): StatCategory {
  return STAT_DEFINITIONS[stat].category;
}
