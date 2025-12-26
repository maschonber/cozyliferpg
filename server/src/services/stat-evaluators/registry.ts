/**
 * Evaluator Registry
 *
 * Central registry of all pattern evaluators, organized by stat.
 * Import evaluators as they are implemented.
 */

import { StatName } from '../../../../shared/types';
import { PatternEvaluator } from './types';

// Vitality evaluators
import { MinEnergyEvaluator } from './vitality/min-energy';
import { SleepScheduleEvaluator } from './vitality/sleep-schedule';
import { EnergyBalanceEvaluator } from './vitality/energy-balance';
import { NoCatastropheEvaluator } from './vitality/no-catastrophe';
import { RestRecoveryEvaluator } from './vitality/rest-recovery';
import { BurnoutEvaluator } from './vitality/burnout';
import { LateNightEvaluator } from './vitality/late-night';
import { WastedEnergyEvaluator } from './vitality/wasted-energy';
import { OverworkEvaluator } from './vitality/overwork';
import { SlackingEvaluator } from './vitality/slacking';

// Ambition evaluators
import { WorkedTodayEvaluator } from './ambition/worked-today';
import { WorkStreakEvaluator } from './ambition/work-streak';
import { PushedLimitsEvaluator } from './ambition/pushed-limits';
import { HardActivitiesEvaluator } from './ambition/hard-activities';
import { NoWorkEvaluator } from './ambition/no-work';
import { RestStreakEvaluator } from './ambition/rest-streak';
import { CoastingEvaluator } from './ambition/coasting';

// Empathy evaluators
import { MeaningfulConversationEvaluator } from './empathy/meaningful-conversation';
import { FriendInteractionEvaluator } from './empathy/friend-interaction';
import { FriendCircleEvaluator } from './empathy/friend-circle';
import { SocialDiversityEvaluator } from './empathy/social-diversity';
import { MaintainedFriendshipsEvaluator } from './empathy/maintained-friendships';
import { ShallowRomanceEvaluator } from './empathy/shallow-romance';
import { NeglectedFriendsEvaluator } from './empathy/neglected-friends';
import { NegativeInteractionEvaluator } from './empathy/negative-interaction';

// Poise evaluators
import { PhysicalVarietyEvaluator } from './poise/physical-variety';
import { BestOutcomeEvaluator } from './poise/best-outcome';
import { SocialGraceEvaluator } from './poise/social-grace';
import { SedentaryEvaluator } from './poise/sedentary';
import { MultipleNapsEvaluator } from './poise/multiple-naps';

// Creativity evaluators
import { ActivityVarietyEvaluator } from './creativity/activity-variety';
import { NoveltyEvaluator } from './creativity/novelty';
import { CrossDomainEvaluator } from './creativity/cross-domain';
import { StuckInRutEvaluator } from './creativity/stuck-in-rut';
import { NoLeisureEvaluator } from './creativity/no-leisure';
import { RepeatedNpcsEvaluator } from './creativity/repeated-npcs';

// Wit evaluators
import { ConversationalRangeEvaluator } from './wit/conversational-range';
import { QuickInteractionEvaluator } from './wit/quick-interaction';
import { TonalAgilityEvaluator } from './wit/tonal-agility';
import { NoPracticeEvaluator } from './wit/no-practice';
import { ConversationalRutEvaluator } from './wit/conversational-rut';
import { NoQuickThinkingEvaluator } from './wit/no-quick-thinking';

/**
 * All registered evaluators, organized by stat.
 */
const EVALUATORS_BY_STAT: Map<StatName, PatternEvaluator[]> = new Map([
  ['vitality', [
    new MinEnergyEvaluator(),
    new SleepScheduleEvaluator(),
    new EnergyBalanceEvaluator(),
    new NoCatastropheEvaluator(),
    new RestRecoveryEvaluator(),
    new BurnoutEvaluator(),
    new LateNightEvaluator(),
    new WastedEnergyEvaluator(),
    new OverworkEvaluator(),
    new SlackingEvaluator(),
  ]],

  ['ambition', [
    new WorkedTodayEvaluator(),
    new WorkStreakEvaluator(),
    new PushedLimitsEvaluator(),
    new HardActivitiesEvaluator(),
    new NoWorkEvaluator(),
    new RestStreakEvaluator(),
    new CoastingEvaluator(),
  ]],

  ['empathy', [
    new MeaningfulConversationEvaluator(),
    new FriendInteractionEvaluator(),
    new FriendCircleEvaluator(),
    new SocialDiversityEvaluator(),
    new MaintainedFriendshipsEvaluator(),
    new ShallowRomanceEvaluator(),
    new NeglectedFriendsEvaluator(),
    new NegativeInteractionEvaluator(),
  ]],

  ['poise', [
    new PhysicalVarietyEvaluator(),
    new BestOutcomeEvaluator(),
    new SocialGraceEvaluator(),
    new SedentaryEvaluator(),
    new MultipleNapsEvaluator(),
  ]],

  ['creativity', [
    new ActivityVarietyEvaluator(),
    new NoveltyEvaluator(),
    new CrossDomainEvaluator(),
    new StuckInRutEvaluator(),
    new NoLeisureEvaluator(),
    new RepeatedNpcsEvaluator(),
  ]],

  ['wit', [
    new ConversationalRangeEvaluator(),
    new QuickInteractionEvaluator(),
    new TonalAgilityEvaluator(),
    new NoPracticeEvaluator(),
    new ConversationalRutEvaluator(),
    new NoQuickThinkingEvaluator(),
  ]],
]);

/**
 * Get all evaluators for a specific stat.
 */
export function getEvaluatorsForStat(stat: StatName): PatternEvaluator[] {
  return EVALUATORS_BY_STAT.get(stat) || [];
}

/**
 * Get all registered evaluators.
 */
export function getAllEvaluators(): PatternEvaluator[] {
  return Array.from(EVALUATORS_BY_STAT.values()).flat();
}

/**
 * Get all stats that have registered evaluators.
 */
export function getStatsWithEvaluators(): StatName[] {
  return Array.from(EVALUATORS_BY_STAT.keys());
}
