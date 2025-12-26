/**
 * Evaluation Engine
 *
 * Executes pattern evaluators against player snapshots.
 */

import { StatName, StatChangeComponent } from '../../../../shared/types';
import { PlayerPatternSnapshot } from '../player-patterns/types';
import { PatternEvaluator, StatEvaluationResult, LifestyleEvaluationResult } from './types';
import { getEvaluatorsForStat, getStatsWithEvaluators } from './registry';

/**
 * Evaluate all patterns for a single stat.
 */
export function evaluateStat(
  stat: StatName,
  snapshot: PlayerPatternSnapshot
): StatEvaluationResult {
  const evaluators = getEvaluatorsForStat(stat);
  let totalChange = 0;
  const components: StatChangeComponent[] = [];

  for (const evaluator of evaluators) {
    const value = evaluator.evaluate(snapshot);

    if (value !== 0) {
      totalChange += value;
      components.push(evaluator.getComponent(snapshot, value));
    }
  }

  return { stat, totalChange, components };
}

/**
 * Evaluate all stats that have registered pattern evaluators.
 * This is the main entry point called during sleep.
 *
 * Note: Which stats are evaluated is determined by which evaluators
 * are registered, not by a static list. This keeps the system flexible.
 */
export function evaluateAllPatterns(
  snapshot: PlayerPatternSnapshot
): LifestyleEvaluationResult {
  const changes = new Map<StatName, number>();
  const components = new Map<StatName, StatChangeComponent[]>();

  for (const stat of getStatsWithEvaluators()) {
    const result = evaluateStat(stat, snapshot);

    if (result.totalChange !== 0 || result.components.length > 0) {
      changes.set(stat, result.totalChange);
      components.set(stat, result.components);
    }
  }

  return { changes, components };
}
