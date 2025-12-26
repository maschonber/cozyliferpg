/**
 * Pattern Evaluator Types
 *
 * Interface and types for the pattern evaluator framework.
 */

import { StatName, StatChangeComponent } from '../../../../shared/types';
import { PlayerPatternSnapshot } from '../player-patterns/types';

/**
 * A pattern evaluator assesses one behavioral pattern and returns
 * a stat bonus or penalty based on the player's pattern snapshot.
 *
 * Design principles:
 * - Each evaluator targets exactly one stat
 * - Each evaluator evaluates exactly one pattern
 * - Evaluators are pure functions (no side effects, no database access)
 * - Evaluators are independently testable
 */
export interface PatternEvaluator {
  /** Unique identifier for this evaluator */
  readonly id: string;

  /** Which stat this evaluator affects */
  readonly stat: StatName;

  /** Human-readable name for debugging/logging */
  readonly name: string;

  /**
   * Evaluate the pattern and return a stat change value.
   * Positive = bonus, negative = penalty, zero = no effect.
   */
  evaluate(snapshot: PlayerPatternSnapshot): number;

  /**
   * Generate the UI component describing this change.
   * Only called if evaluate() returned non-zero.
   */
  getComponent(snapshot: PlayerPatternSnapshot, value: number): StatChangeComponent;
}

/**
 * Result of evaluating all patterns for a stat.
 */
export interface StatEvaluationResult {
  stat: StatName;
  totalChange: number;
  components: StatChangeComponent[];
}

/**
 * Result of evaluating all stats with pattern evaluators.
 */
export interface LifestyleEvaluationResult {
  changes: Map<StatName, number>;
  components: Map<StatName, StatChangeComponent[]>;
}
