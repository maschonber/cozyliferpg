/**
 * Mixed Stats Service (Phase 2.5.4)
 * Calculates Poise, Creativity, and Wit based on activity patterns
 * These stats have weaker overnight effects than defensive stats (3x vs 5x multiplier)
 * and focus on variety over consistency
 */

import { Pool } from 'pg';
import { PlayerCharacter, PlayerActivity, StatChangeComponent, StatName } from '../../../../shared/types';
import { getActivitiesForDay, getActivitiesForLastNDays } from '../activity-history';
import { STAT_CATEGORIES } from '../stat';
import { TIME_WINDOWS, POISE_CONFIG, CREATIVITY_CONFIG, WIT_CONFIG } from './config';

// ===== Helper Functions =====

/**
 * Get the primary stat category for an activity
 * Uses first relevant stat if available, otherwise null
 */
function getActivityCategory(activity: PlayerActivity): 'physical' | 'mental' | 'social' | null {
  if (!activity.relevantStats || activity.relevantStats.length === 0) {
    return null;
  }
  const primaryStat = activity.relevantStats[0];
  return STAT_CATEGORIES[primaryStat] || null;
}

/**
 * Check if activity is a leisure activity (not work or recovery)
 */
function isLeisureActivity(activity: PlayerActivity): boolean {
  // Exclude activities tagged with 'work' or 'recovery'
  if (activity.tags?.includes('work') || activity.tags?.includes('recovery')) {
    return false;
  }
  return true;
}

/**
 * Check if activity is physical (primary stat is fitness, vitality, or poise)
 */
function isPhysicalActivity(activity: PlayerActivity): boolean {
  const category = getActivityCategory(activity);
  return category === 'physical';
}

/**
 * Check if activity is a quick interaction (< 60 minutes)
 */
function isQuickInteraction(activity: PlayerActivity): boolean {
  return activity.category === 'social' && activity.timeCost < WIT_CONFIG.thresholds.quickInteraction;
}

/**
 * Check if activity is social
 */
function isSocialActivity(activity: PlayerActivity): boolean {
  return activity.category === 'social';
}

/**
 * Get unique activity IDs from a list
 */
function getUniqueActivityIds(activities: PlayerActivity[]): Set<string> {
  return new Set(activities.map(a => a.activityId));
}

/**
 * Get unique NPC IDs from a list
 */
function getUniqueNpcIds(activities: PlayerActivity[]): Set<string> {
  return new Set(activities.filter(a => a.npcId).map(a => a.npcId!));
}

/**
 * Count activities by predicate in a time window
 */
function countActivities(activities: PlayerActivity[], predicate: (a: PlayerActivity) => boolean): number {
  return activities.filter(predicate).length;
}

/**
 * Check if all activities in a list match a predicate
 */
function allActivities(activities: PlayerActivity[], predicate: (a: PlayerActivity) => boolean): boolean {
  if (activities.length === 0) return false;
  return activities.every(predicate);
}

// ===== Poise Calculations =====

/**
 * Calculate Poise change based on grace, excellence, and physical variety
 * Rewards graceful execution and diverse physical experiences
 */
export async function calculatePoiseChange(
  pool: Pool,
  player: PlayerCharacter
): Promise<{ change: number; components: StatChangeComponent[] }> {
  let change = 0;
  const components: StatChangeComponent[] = [];

  // Get activities for different time windows
  const todayActivities = await getActivitiesForDay(pool, player.id, player.currentDay);
  const last3Days = await getActivitiesForLastNDays(pool, player.id, TIME_WINDOWS.shortTerm);
  const last7Days = await getActivitiesForLastNDays(pool, player.id, TIME_WINDOWS.mediumTerm);

  // POSITIVE: Physical activity variety in last 3 days (3x multiplier, scaling bonus)
  const physicalActivities = last3Days.filter(isPhysicalActivity);
  const uniquePhysicalTypes = new Set(physicalActivities.map(a => a.activityId));
  const physicalVarietyCount = uniquePhysicalTypes.size;

  const cfg = POISE_CONFIG.bonuses.physicalVariety;
  if (physicalVarietyCount >= cfg.thresholds.min) {
    let value = 0;
    if (physicalVarietyCount === cfg.thresholds.low) value = cfg.values.low;
    else if (physicalVarietyCount === cfg.thresholds.medium) value = cfg.values.medium;
    else value = cfg.values.high; // 4+

    change += value;
    components.push({
      source: 'poise_physical_variety',
      category: 'Mixed Stats (Poise)',
      description: 'Physical activity variety',
      value,
      details: `${physicalVarietyCount} different physical activities in last ${cfg.lookbackDays} days`
    });
  }

  // POSITIVE: Best outcome achieved today (3x multiplier)
  const hadBestOutcomeToday = todayActivities.some(a => a.outcomeTier === 'best');
  if (hadBestOutcomeToday) {
    const value = POISE_CONFIG.bonuses.bestOutcome.value;
    change += value;
    components.push({
      source: 'poise_best_outcome',
      category: 'Mixed Stats (Poise)',
      description: 'Achieved best outcome',
      value,
      details: 'Graceful execution today'
    });
  }

  // POSITIVE: Social activity with best outcome this week (3x multiplier)
  const socialBestOutcomeThisWeek = last7Days.some(
    a => a.category === 'social' && a.outcomeTier === 'best'
  );
  if (socialBestOutcomeThisWeek) {
    const value = POISE_CONFIG.bonuses.socialBest.value;
    change += value;
    components.push({
      source: 'poise_social_best',
      category: 'Mixed Stats (Poise)',
      description: 'Social grace demonstrated',
      value,
      details: `Best outcome in social activity in last ${POISE_CONFIG.bonuses.socialBest.lookbackDays} days`
    });
  }

  // NEGATIVE: Only sedentary activities for 3+ days (3x multiplier)
  const hasPhysicalActivities = physicalActivities.length > 0;
  if (!hasPhysicalActivities && last3Days.length > 0) {
    const value = POISE_CONFIG.penalties.sedentary.value;
    change += value;
    components.push({
      source: 'poise_sedentary',
      category: 'Mixed Stats (Poise)',
      description: 'Body stagnation',
      value,
      details: `No physical activities in last ${POISE_CONFIG.penalties.sedentary.lookbackDays} days`
    });
  }

  // NEGATIVE: Napped 2+ times today (3x multiplier)
  const napCount = todayActivities.filter(a => a.tags?.includes('recovery') && a.activityName.includes('Nap')).length;
  if (napCount >= POISE_CONFIG.penalties.multipleNaps.threshold) {
    const value = POISE_CONFIG.penalties.multipleNaps.value;
    change += value;
    components.push({
      source: 'poise_multiple_naps',
      category: 'Mixed Stats (Poise)',
      description: 'Excessive napping',
      value,
      details: `${napCount} naps today`
    });
  }

  return { change, components };
}

// ===== Creativity Calculations =====

/**
 * Calculate Creativity change based on spontaneity and cross-domain exploration
 * Rewards breaking routines through diverse, novel experiences
 */
export async function calculateCreativityChange(
  pool: Pool,
  player: PlayerCharacter
): Promise<{ change: number; components: StatChangeComponent[] }> {
  let change = 0;
  const components: StatChangeComponent[] = [];

  // Get activities for different time windows
  const todayActivities = await getActivitiesForDay(pool, player.id, player.currentDay);
  const yesterdayActivities = await getActivitiesForDay(pool, player.id, player.currentDay - 1);
  const last3Days = await getActivitiesForLastNDays(pool, player.id, TIME_WINDOWS.shortTerm);
  const last7Days = await getActivitiesForLastNDays(pool, player.id, TIME_WINDOWS.mediumTerm);
  const last14Days = await getActivitiesForLastNDays(pool, player.id, TIME_WINDOWS.longTerm);

  // Filter for leisure activities only
  const todayLeisure = todayActivities.filter(isLeisureActivity);
  const yesterdayLeisure = yesterdayActivities.filter(isLeisureActivity);
  const last3DaysLeisure = last3Days.filter(isLeisureActivity);
  const last7DaysLeisure = last7Days.filter(isLeisureActivity);

  // POSITIVE: Today's leisure activities different from yesterday's (3x multiplier)
  const todayActivityIds = new Set(todayLeisure.map(a => a.activityId));
  const yesterdayActivityIds = new Set(yesterdayLeisure.map(a => a.activityId));

  const hasNewActivityToday = todayLeisure.some(a => !yesterdayActivityIds.has(a.activityId));
  if (hasNewActivityToday && todayLeisure.length > 0) {
    const value = CREATIVITY_CONFIG.bonuses.dailyVariety.value;
    change += value;
    components.push({
      source: 'creativity_daily_variety',
      category: 'Mixed Stats (Creativity)',
      description: 'Daily spontaneity',
      value,
      details: 'Different activities from yesterday'
    });
  }

  // POSITIVE: Tried activity not done in previous 7 days (3x multiplier)
  const last7to14Days = last14Days.filter(a => {
    const dayDiff = player.currentDay - a.dayNumber;
    return dayDiff >= CREATIVITY_CONFIG.bonuses.novelty.lookbackDays && dayDiff < TIME_WINDOWS.longTerm;
  }).filter(isLeisureActivity);
  const oldActivityIds = new Set(last7to14Days.map(a => a.activityId));

  const triedNovelActivity = todayLeisure.some(a => !oldActivityIds.has(a.activityId));
  if (triedNovelActivity && todayLeisure.length > 0) {
    const value = CREATIVITY_CONFIG.bonuses.novelty.value;
    change += value;
    components.push({
      source: 'creativity_novelty',
      category: 'Mixed Stats (Creativity)',
      description: 'Seeking novelty',
      value,
      details: 'Tried activity not done recently'
    });
  }

  // POSITIVE: Leisure activities span all 3 categories this week (3x multiplier)
  const categoriesThisWeek = new Set(
    last7DaysLeisure
      .map(getActivityCategory)
      .filter((c): c is 'physical' | 'mental' | 'social' => c !== null)
  );
  if (categoriesThisWeek.size === CREATIVITY_CONFIG.bonuses.crossDomain.requiredCategories) {
    const value = CREATIVITY_CONFIG.bonuses.crossDomain.value;
    change += value;
    components.push({
      source: 'creativity_cross_domain',
      category: 'Mixed Stats (Creativity)',
      description: 'Holistic exploration',
      value,
      details: 'Activities span physical, mental, and social domains'
    });
  }

  // NEGATIVE: Same leisure activity 3+ days in a row (3x multiplier)
  // Check if any activity appears in all of the last 3 days
  const day1 = todayActivities.filter(isLeisureActivity);
  const day2 = (await getActivitiesForDay(pool, player.id, player.currentDay - 1)).filter(isLeisureActivity);
  const day3 = (await getActivitiesForDay(pool, player.id, player.currentDay - 2)).filter(isLeisureActivity);

  const day1Ids = new Set(day1.map(a => a.activityId));
  const day2Ids = new Set(day2.map(a => a.activityId));
  const day3Ids = new Set(day3.map(a => a.activityId));

  const repeatedActivities = Array.from(day1Ids).filter(id => day2Ids.has(id) && day3Ids.has(id));
  if (repeatedActivities.length > 0) {
    const value = CREATIVITY_CONFIG.penalties.stuckInRut.value;
    change += value;
    components.push({
      source: 'creativity_stuck_in_rut',
      category: 'Mixed Stats (Creativity)',
      description: 'Stuck in rut',
      value,
      details: `Same activity ${repeatedActivities.length > 1 ? 'activities' : 'activity'} ${CREATIVITY_CONFIG.penalties.stuckInRut.lookbackDays} days in a row`
    });
  }

  // NEGATIVE: No leisure activities today (3x multiplier)
  if (todayLeisure.length === 0) {
    const value = CREATIVITY_CONFIG.penalties.noLeisure.value;
    change += value;
    components.push({
      source: 'creativity_no_leisure',
      category: 'Mixed Stats (Creativity)',
      description: 'No leisure',
      value,
      details: 'No leisure activities today'
    });
  }

  // NEGATIVE: Repeated NPCs in social activities (3x multiplier)
  // Check if any NPCs appear in all of the last 3 days
  const day1NpcIds = new Set(day1.filter(a => a.npcId).map(a => a.npcId!));
  const day2NpcIds = new Set(day2.filter(a => a.npcId).map(a => a.npcId!));
  const day3NpcIds = new Set(day3.filter(a => a.npcId).map(a => a.npcId!));

  const repeatedNpcs = Array.from(day1NpcIds).filter(id => day2NpcIds.has(id) && day3NpcIds.has(id));
  if (repeatedNpcs.length > 0) {
    const value = CREATIVITY_CONFIG.penalties.repeatedNpcs.valuePerNpc * repeatedNpcs.length;
    change += value;
    components.push({
      source: 'creativity_repeated_npcs',
      category: 'Mixed Stats (Creativity)',
      description: 'Social routine',
      value,
      details: `Talked to same ${repeatedNpcs.length} ${repeatedNpcs.length === 1 ? 'person' : 'people'} all 3 days`
    });
  }

  return { change, components };
}

// ===== Wit Calculations =====

/**
 * Calculate Wit change based on social agility and playful practice
 * Rewards conversational breadth through quick, varied interactions
 */
export async function calculateWitChange(
  pool: Pool,
  player: PlayerCharacter
): Promise<{ change: number; components: StatChangeComponent[] }> {
  let change = 0;
  const components: StatChangeComponent[] = [];

  // Get activities for different time windows
  const todayActivities = await getActivitiesForDay(pool, player.id, player.currentDay);
  const last3Days = await getActivitiesForLastNDays(pool, player.id, TIME_WINDOWS.shortTerm);
  const last7Days = await getActivitiesForLastNDays(pool, player.id, TIME_WINDOWS.mediumTerm);

  // Filter for social activities
  const todaySocial = todayActivities.filter(isSocialActivity);
  const last3DaysSocial = last3Days.filter(isSocialActivity);
  const last7DaysSocial = last7Days.filter(isSocialActivity);

  // POSITIVE: 3+ different social partners in last 3 days (3x multiplier)
  const uniquePartners = getUniqueNpcIds(last3DaysSocial);
  if (uniquePartners.size >= WIT_CONFIG.bonuses.conversationalRange.minPartners) {
    const value = WIT_CONFIG.bonuses.conversationalRange.value;
    change += value;
    components.push({
      source: 'wit_conversational_range',
      category: 'Mixed Stats (Wit)',
      description: 'Conversational range',
      value,
      details: `Interacted with ${uniquePartners.size} different people in last ${WIT_CONFIG.bonuses.conversationalRange.lookbackDays} days`
    });
  }

  // POSITIVE: Had quick/playful interaction today (3x multiplier)
  const hadQuickInteraction = todaySocial.some(isQuickInteraction);
  if (hadQuickInteraction) {
    const value = WIT_CONFIG.bonuses.quickInteraction.value;
    change += value;
    components.push({
      source: 'wit_quick_interaction',
      category: 'Mixed Stats (Wit)',
      description: 'Quick thinking practiced',
      value,
      details: 'Quick interaction today'
    });
  }

  // POSITIVE: Mixed interaction types in last 3 days (3x multiplier)
  // Check for variety: quick (< 60 min) and longer interactions
  const hasQuickInteractions = last3DaysSocial.some(isQuickInteraction);
  const hasLongInteractions = last3DaysSocial.some(a => a.timeCost >= WIT_CONFIG.thresholds.longInteraction);
  if (hasQuickInteractions && hasLongInteractions) {
    const value = WIT_CONFIG.bonuses.tonalAgility.value;
    change += value;
    components.push({
      source: 'wit_tonal_agility',
      category: 'Mixed Stats (Wit)',
      description: 'Tonal agility',
      value,
      details: `Mixed interaction types in last ${WIT_CONFIG.bonuses.tonalAgility.lookbackDays} days`
    });
  }

  // NEGATIVE: No social interaction today (3x multiplier)
  if (todaySocial.length === 0) {
    const value = WIT_CONFIG.penalties.noPractice.value;
    change += value;
    components.push({
      source: 'wit_no_practice',
      category: 'Mixed Stats (Wit)',
      description: 'Wit needs practice',
      value,
      details: 'No social interaction today'
    });
  }

  // NEGATIVE: Only talked to 1 person in last 3 days (3x multiplier)
  if (uniquePartners.size === 1 && last3DaysSocial.length > 0) {
    const value = WIT_CONFIG.penalties.conversationalRut.value;
    change += value;
    components.push({
      source: 'wit_conversational_rut',
      category: 'Mixed Stats (Wit)',
      description: 'Conversational rut',
      value,
      details: `Only talked to 1 person in last ${WIT_CONFIG.penalties.conversationalRut.lookbackDays} days`
    });
  }

  // NEGATIVE: Only deep conversations, no quick/playful this week (3x multiplier)
  const hasOnlyLongInteractions = last7DaysSocial.length > 0 &&
    allActivities(last7DaysSocial, a => a.timeCost >= WIT_CONFIG.thresholds.longInteraction);
  if (hasOnlyLongInteractions) {
    const value = WIT_CONFIG.penalties.noQuickThinking.value;
    change += value;
    components.push({
      source: 'wit_no_quick_thinking',
      category: 'Mixed Stats (Wit)',
      description: 'Lost quick-thinking edge',
      value,
      details: `Only deep conversations, no quick interactions in last ${WIT_CONFIG.penalties.noQuickThinking.lookbackDays} days`
    });
  }

  return { change, components };
}

// ===== Main Calculation Function =====

/**
 * Calculate all mixed stat changes during sleep
 * Returns changes for Poise, Creativity, and Wit with breakdown components
 */
export async function calculateMixedStatChanges(
  pool: Pool,
  player: PlayerCharacter
): Promise<{
  poise: number;
  creativity: number;
  wit: number;
  components: Map<StatName, StatChangeComponent[]>;
}> {
  const [poiseResult, creativityResult, witResult] = await Promise.all([
    calculatePoiseChange(pool, player),
    calculateCreativityChange(pool, player),
    calculateWitChange(pool, player)
  ]);

  const components = new Map<StatName, StatChangeComponent[]>();
  if (poiseResult.components.length > 0) {
    components.set('poise', poiseResult.components);
  }
  if (creativityResult.components.length > 0) {
    components.set('creativity', creativityResult.components);
  }
  if (witResult.components.length > 0) {
    components.set('wit', witResult.components);
  }

  return {
    poise: poiseResult.change,
    creativity: creativityResult.change,
    wit: witResult.change,
    components
  };
}
