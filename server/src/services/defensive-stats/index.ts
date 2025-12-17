/**
 * Defensive Stats Service (Phase 2.5.2)
 *
 * Calculates Vitality, Ambition, and Empathy based on lifestyle patterns.
 * All thresholds and bonuses extracted to config.ts for easy tuning.
 *
 * Architecture: Pure calculation logic, configuration-driven values
 */

import { Pool } from 'pg';
import { PlayerCharacter, PlayerActivity, StatTracking, StatName, StatChangeComponent } from '../../../../shared/types';
import { getActivitiesForDay } from '../activity-history';
import { getCurrentStat } from '../stat';
import { BEDTIME_HOURS, VITALITY_CONFIG, AMBITION_CONFIG, EMPATHY_CONFIG } from './config';

// ===== Helper Functions =====

/**
 * Parse time string to hours (for bedtime calculations)
 */
function parseTimeToHours(time: string): number {
  const [hours] = time.split(':').map(Number);
  return hours;
}

/**
 * Check if player slept before midnight (and at or after 8pm)
 */
function sleptBeforeMidnight(bedtime: string): boolean {
  const hours = parseTimeToHours(bedtime);
  return hours >= BEDTIME_HOURS.earlyBedMin && hours < BEDTIME_HOURS.earlyBedMax;
}

/**
 * Check if player slept after 2 AM
 */
function sleptAfter2AM(bedtime: string): boolean {
  const hours = parseTimeToHours(bedtime);
  return hours >= BEDTIME_HOURS.lateNightMin && hours < BEDTIME_HOURS.lateNightMax;
}

/**
 * Get highest stat value from activities performed today
 */
function getHighestRelevantStat(
  activities: PlayerActivity[],
  playerStats: PlayerCharacter['stats']
): { statName: StatName; value: number } | null {
  let highestStat: StatName | null = null;
  let highestValue = -1;

  for (const activity of activities) {
    for (const statName of activity.relevantStats) {
      const value = getCurrentStat(playerStats, statName);
      if (value > highestValue) {
        highestValue = value;
        highestStat = statName;
      }
    }
  }

  if (highestStat === null) {
    return null;
  }

  return { statName: highestStat, value: highestValue };
}

// ===== Vitality Calculations =====

/**
 * Calculate Vitality change based on sustainable living patterns
 *
 * Rewards balanced energy management and healthy habits.
 * Uses VITALITY_CONFIG for all thresholds and values.
 */
export async function calculateVitalityChange(
  player: PlayerCharacter,
  bedtime: string
): Promise<{ change: number; components: StatChangeComponent[] }> {
  let change = 0;
  const tracking = player.tracking;
  const components: StatChangeComponent[] = [];
  const cfg = VITALITY_CONFIG;

  // === Positive factors ===

  if (tracking.minEnergyToday >= cfg.bonuses.minEnergy.threshold) {
    const value = cfg.bonuses.minEnergy.value;
    change += value;
    components.push({
      source: 'vitality_min_energy',
      category: 'Defensive Stats (Vitality)',
      description: `Maintained energy above ${cfg.bonuses.minEnergy.threshold}`,
      value,
      details: `Min energy: ${tracking.minEnergyToday}`
    });
  }

  if (sleptBeforeMidnight(bedtime)) {
    const value = cfg.bonuses.sleepSchedule.value;
    change += value;
    components.push({
      source: 'vitality_sleep_schedule',
      category: 'Defensive Stats (Vitality)',
      description: 'Slept before midnight',
      value,
      details: `Bedtime: ${bedtime}`
    });
  }

  if (tracking.endingEnergyToday >= cfg.bonuses.energyBalance.min &&
      tracking.endingEnergyToday <= cfg.bonuses.energyBalance.max) {
    const value = cfg.bonuses.energyBalance.value;
    change += value;
    components.push({
      source: 'vitality_energy_balance',
      category: 'Defensive Stats (Vitality)',
      description: 'Balanced energy usage',
      value,
      details: `Ending energy: ${tracking.endingEnergyToday} (optimal: ${cfg.bonuses.energyBalance.min}-${cfg.bonuses.energyBalance.max})`
    });
  }

  if (!tracking.hadCatastrophicFailureToday) {
    const value = cfg.bonuses.noCatastrophe.value;
    change += value;
    components.push({
      source: 'vitality_no_catastrophe',
      category: 'Defensive Stats (Vitality)',
      description: 'No catastrophic failures',
      value
    });
  }

  // Rest day after work bonus
  const isFirstRestDayAfterWork = tracking.restStreak === 1 && tracking.workStreak === 0;
  if (isFirstRestDayAfterWork) {
    const value = cfg.bonuses.restRecovery.value;
    change += value;
    components.push({
      source: 'vitality_rest_recovery',
      category: 'Defensive Stats (Vitality)',
      description: 'Rest day after work',
      value,
      details: 'Good recovery pattern'
    });
  }

  // === Negative factors ===

  if (tracking.minEnergyToday <= 0) {
    const penalty = cfg.penalties.burnout.base *
                    (1 + tracking.burnoutStreak * cfg.penalties.burnout.streakMultiplier);
    change += penalty;
    components.push({
      source: 'vitality_burnout',
      category: 'Defensive Stats (Vitality)',
      description: 'Hit zero energy',
      value: penalty,
      details: tracking.burnoutStreak > 0
        ? `Burnout streak: ${tracking.burnoutStreak + 1} days`
        : undefined
    });
  }

  if (sleptAfter2AM(bedtime)) {
    const penalty = cfg.penalties.lateNight.base *
                    (1 + tracking.lateNightStreak * cfg.penalties.lateNight.streakMultiplier);
    change += penalty;
    components.push({
      source: 'vitality_late_night',
      category: 'Defensive Stats (Vitality)',
      description: 'Slept after 2 AM',
      value: penalty,
      details: tracking.lateNightStreak > 0
        ? `Late night streak: ${tracking.lateNightStreak + 1} days`
        : `Bedtime: ${bedtime}`
    });
  }

  if (tracking.endingEnergyToday > cfg.penalties.wastedEnergy.threshold) {
    const value = cfg.penalties.wastedEnergy.value;
    change += value;
    components.push({
      source: 'vitality_wasted_energy',
      category: 'Defensive Stats (Vitality)',
      description: 'Ended day with excess energy',
      value,
      details: `Energy: ${tracking.endingEnergyToday} (optimal: ${cfg.bonuses.energyBalance.min}-${cfg.bonuses.energyBalance.max})`
    });
  }

  // Consecutive work days without rest
  if (tracking.workStreak >= cfg.penalties.overwork.threshold) {
    const penalty = cfg.penalties.overwork.base * (tracking.workStreak - 2);
    change += penalty;
    components.push({
      source: 'vitality_overwork',
      category: 'Defensive Stats (Vitality)',
      description: 'Too many consecutive work days',
      value: penalty,
      details: `Work streak: ${tracking.workStreak} days`
    });
  }

  // Consecutive rest days (slacking)
  if (tracking.restStreak >= cfg.penalties.slacking.threshold) {
    const penalty = cfg.penalties.slacking.base * (tracking.restStreak - 2);
    change += penalty;
    components.push({
      source: 'vitality_slacking',
      category: 'Defensive Stats (Vitality)',
      description: 'Too many consecutive rest days',
      value: penalty,
      details: `Rest streak: ${tracking.restStreak} days`
    });
  }

  return { change, components };
}

// ===== Ambition Calculations =====

/**
 * Calculate Ambition change based on pushing limits and work ethic
 *
 * Rewards consistent effort and challenging yourself.
 * Uses AMBITION_CONFIG for all thresholds and values.
 */
export async function calculateAmbitionChange(
  pool: Pool,
  player: PlayerCharacter
): Promise<{ change: number; components: StatChangeComponent[] }> {
  let change = 0;
  const tracking = player.tracking;
  const components: StatChangeComponent[] = [];
  const cfg = AMBITION_CONFIG;

  // Get today's activities
  const activities = await getActivitiesForDay(pool, player.id, player.currentDay);

  // === Positive factors ===

  if (tracking.workedToday) {
    const value = cfg.bonuses.workedToday.value;
    change += value;
    components.push({
      source: 'ambition_worked_today',
      category: 'Defensive Stats (Ambition)',
      description: 'Completed work activity',
      value
    });
  }

  if (tracking.workStreak >= cfg.bonuses.workStreak.threshold) {
    const value = cfg.bonuses.workStreak.value;
    change += value;
    components.push({
      source: 'ambition_work_streak',
      category: 'Defensive Stats (Ambition)',
      description: 'Work streak bonus',
      value,
      details: `${tracking.workStreak} consecutive work days`
    });
  }

  if (tracking.workStreak >= cfg.bonuses.longWorkStreak.threshold) {
    const value = cfg.bonuses.longWorkStreak.value;
    change += value;
    components.push({
      source: 'ambition_long_work_streak',
      category: 'Defensive Stats (Ambition)',
      description: 'Long work streak bonus',
      value,
      details: `${tracking.workStreak} consecutive work days`
    });
  }

  // Training above comfort level
  const highestStat = getHighestRelevantStat(activities, player.stats);
  if (highestStat) {
    const relevantStatValue = highestStat.value;
    let pushedSelfCount = 0;
    let hardActivityCount = 0;

    for (const activity of activities) {
      // Check if activity was significantly above comfort level
      if (activity.difficulty &&
          activity.difficulty >= relevantStatValue + cfg.bonuses.pushedLimits.comfortGap) {
        pushedSelfCount++;
      }

      // Attempted hard activity (absolute threshold)
      if (activity.difficulty &&
          activity.difficulty >= cfg.bonuses.hardActivities.difficultyThreshold) {
        hardActivityCount++;
      }
    }

    // Cap challenging activities
    if (pushedSelfCount > 0) {
      const cappedCount = Math.min(pushedSelfCount, cfg.bonuses.pushedLimits.maxActivitiesPerDay);
      const value = cfg.bonuses.pushedLimits.valuePerActivity * cappedCount;
      change += value;
      components.push({
        source: 'ambition_pushed_limits',
        category: 'Defensive Stats (Ambition)',
        description: 'Pushed beyond comfort level',
        value,
        details: pushedSelfCount > cfg.bonuses.pushedLimits.maxActivitiesPerDay
          ? `${cappedCount} challenging ${cappedCount === 1 ? 'activity' : 'activities'} (capped from ${pushedSelfCount})`
          : `${cappedCount} challenging ${cappedCount === 1 ? 'activity' : 'activities'}`
      });
    }

    // Cap hard activities
    if (hardActivityCount > 0) {
      const cappedCount = Math.min(hardActivityCount, cfg.bonuses.hardActivities.maxActivitiesPerDay);
      const value = cfg.bonuses.hardActivities.valuePerActivity * cappedCount;
      change += value;
      components.push({
        source: 'ambition_hard_activities',
        category: 'Defensive Stats (Ambition)',
        description: 'Attempted hard activities',
        value,
        details: hardActivityCount > cfg.bonuses.hardActivities.maxActivitiesPerDay
          ? `${cappedCount} ${cappedCount === 1 ? 'activity' : 'activities'} with difficulty ≥${cfg.bonuses.hardActivities.difficultyThreshold} (capped from ${hardActivityCount})`
          : `${cappedCount} ${cappedCount === 1 ? 'activity' : 'activities'} with difficulty ≥${cfg.bonuses.hardActivities.difficultyThreshold}`
      });
    }
  }

  // === Negative factors ===

  if (!tracking.workedToday) {
    const value = cfg.penalties.noWork.value;
    change += value;
    components.push({
      source: 'ambition_no_work',
      category: 'Defensive Stats (Ambition)',
      description: 'No work activity today',
      value
    });
  }

  const noWorkStreak = tracking.restStreak;
  if (noWorkStreak >= cfg.penalties.restStreak.threshold) {
    const penalty = cfg.penalties.restStreak.base * noWorkStreak;
    change += penalty;
    components.push({
      source: 'ambition_rest_streak',
      category: 'Defensive Stats (Ambition)',
      description: 'Extended rest period',
      value: penalty,
      details: `${noWorkStreak} consecutive rest days`
    });
  }

  // Check if all activities were easy
  if (highestStat && activities.length > 0) {
    const easyThreshold = Math.max(
      cfg.penalties.coasting.minDifficulty,
      highestStat.value + cfg.penalties.coasting.comfortGap
    );
    const allEasy = activities.every(a =>
      !a.difficulty || a.difficulty < easyThreshold
    );

    if (allEasy) {
      const value = cfg.penalties.coasting.value;
      change += value;
      components.push({
        source: 'ambition_coasting',
        category: 'Defensive Stats (Ambition)',
        description: 'All activities were too easy',
        value,
        details: `Threshold: ${easyThreshold}`
      });
    }
  }

  return { change, components };
}

// ===== Empathy Calculations =====

/**
 * Calculate Empathy change based on genuine connections
 *
 * Rewards authentic care for others and diverse relationships.
 * Uses EMPATHY_CONFIG for all thresholds and values.
 */
export async function calculateEmpathyChange(
  pool: Pool,
  player: PlayerCharacter
): Promise<{ change: number; components: StatChangeComponent[] }> {
  let change = 0;
  const components: StatChangeComponent[] = [];
  const client = await pool.connect();
  const cfg = EMPATHY_CONFIG;

  try {
    // Get today's activities
    const activities = await getActivitiesForDay(pool, player.id, player.currentDay);

    // === Positive factors ===

    // Daily trigger - meaningful conversation
    const hadMeaningfulConversation = activities.some(a =>
      a.category === 'social' && a.timeCost >= cfg.bonuses.meaningfulConversation.minDuration
    );
    if (hadMeaningfulConversation) {
      const value = cfg.bonuses.meaningfulConversation.value;
      change += value;
      components.push({
        source: 'empathy_meaningful_conversation',
        category: 'Defensive Stats (Empathy)',
        description: 'Had meaningful conversation',
        value,
        details: `Social activity ≥${cfg.bonuses.meaningfulConversation.minDuration} minutes`
      });
    }

    // Get all relationships for pattern analysis
    const relationshipsResult = await client.query(
      `SELECT npc_id, friendship, romance FROM relationships WHERE player_id = $1`,
      [player.userId]
    );
    const relationships = relationshipsResult.rows;

    // Define platonic friends and romantic interests
    const platonicFriends = relationships.filter(r =>
      r.friendship > cfg.thresholds.platonicFriend.minFriendship &&
      r.romance < cfg.thresholds.platonicFriend.maxRomance
    );
    const romanticInterests = relationships.filter(r =>
      r.romance > cfg.thresholds.romanticInterest.minRomance
    );

    // Get NPCs interacted with today
    const npcsInteractedToday = new Set(
      activities.filter(a => a.npcId).map(a => a.npcId)
    );

    // Check if interacted with platonic friend today
    const interactedWithPlatonicFriend = platonicFriends.some(
      r => npcsInteractedToday.has(r.npc_id)
    );
    if (interactedWithPlatonicFriend) {
      const value = cfg.bonuses.platonicInteraction.value;
      change += value;
      components.push({
        source: 'empathy_platonic_friend',
        category: 'Defensive Stats (Empathy)',
        description: 'Spent time with platonic friend',
        value
      });
    }

    // Pattern bonuses - friend circle size
    if (platonicFriends.length >= cfg.bonuses.friendCircle.smallThreshold) {
      const value = cfg.bonuses.friendCircle.smallValue;
      change += value;
      components.push({
        source: 'empathy_friend_circle',
        category: 'Defensive Stats (Empathy)',
        description: 'Have multiple platonic friends',
        value,
        details: `${platonicFriends.length} platonic friends`
      });
    }
    if (platonicFriends.length >= cfg.bonuses.friendCircle.largeThreshold) {
      const value = cfg.bonuses.friendCircle.largeValue;
      change += value;
      components.push({
        source: 'empathy_large_friend_circle',
        category: 'Defensive Stats (Empathy)',
        description: 'Have large friend circle',
        value,
        details: `${platonicFriends.length} platonic friends`
      });
    }

    // Get interactions from last N days
    const recentDaysAgo = new Date();
    recentDaysAgo.setDate(recentDaysAgo.getDate() - cfg.timeWindows.recentInteractions);

    const recentInteractionsResult = await client.query(
      `
      SELECT DISTINCT r.npc_id, r.friendship, r.romance
      FROM interactions i
      JOIN relationships r ON i.relationship_id = r.id
      WHERE r.player_id = $1 AND i.created_at >= $2
      `,
      [player.userId, recentDaysAgo]
    );

    const uniqueNpcsThisWeek = recentInteractionsResult.rows.length;
    if (uniqueNpcsThisWeek >= cfg.bonuses.diversity.threshold) {
      const value = cfg.bonuses.diversity.value;
      change += value;
      components.push({
        source: 'empathy_diversity',
        category: 'Defensive Stats (Empathy)',
        description: 'Diverse social interactions',
        value,
        details: `Interacted with ${uniqueNpcsThisWeek} different NPCs this week`
      });
    }

    // Check if all friends were contacted this week
    const friendsResult = await client.query(
      `SELECT npc_id FROM relationships WHERE player_id = $1 AND friendship >= $2`,
      [player.userId, cfg.thresholds.closeFriend.minFriendship]
    );
    const friends = friendsResult.rows;

    if (friends.length > 0) {
      const recentNpcIds = new Set(recentInteractionsResult.rows.map(r => r.npc_id));
      const allFriendsContacted = friends.every(f => recentNpcIds.has(f.npc_id));

      if (allFriendsContacted) {
        const value = cfg.bonuses.maintainedFriendships.value;
        change += value;
        components.push({
          source: 'empathy_maintained_friendships',
          category: 'Defensive Stats (Empathy)',
          description: 'Maintained all friendships',
          value,
          details: `Contacted all ${friends.length} close friends this week`
        });
      }
    }

    // === Negative factors ===

    // Only interacted with romantic interests today
    if (npcsInteractedToday.size > 0) {
      const onlyRomanticToday = Array.from(npcsInteractedToday).every(npcId =>
        romanticInterests.some(r => r.npc_id === npcId)
      );
      if (onlyRomanticToday && romanticInterests.length > 0) {
        const value = cfg.penalties.onlyRomantic.value;
        change += value;
        components.push({
          source: 'empathy_only_romantic',
          category: 'Defensive Stats (Empathy)',
          description: 'Only interacted with romantic interests',
          value,
          details: 'No platonic interactions today'
        });
      }
    }

    // Count platonic vs romantic interactions this week
    const weekInteractionsResult = await client.query(
      `
      SELECT r.npc_id, r.friendship, r.romance, COUNT(*) as interaction_count
      FROM interactions i
      JOIN relationships r ON i.relationship_id = r.id
      WHERE r.player_id = $1 AND i.created_at >= $2
      GROUP BY r.npc_id, r.friendship, r.romance
      `,
      [player.userId, recentDaysAgo]
    );

    let platonicInteractions = 0;
    let romanticInteractionsCount = 0;

    for (const row of weekInteractionsResult.rows) {
      const count = parseInt(row.interaction_count);
      if (row.friendship > cfg.thresholds.platonicFriend.minFriendship &&
          row.romance < cfg.thresholds.platonicFriend.maxRomance) {
        platonicInteractions += count;
      } else if (row.romance > cfg.thresholds.romanticInterest.minRomance) {
        romanticInteractionsCount += count;
      }
    }

    if (romanticInteractionsCount > cfg.penalties.romanceImbalance.ratio * platonicInteractions &&
        platonicInteractions > 0) {
      const value = cfg.penalties.romanceImbalance.value;
      change += value;
      components.push({
        source: 'empathy_romance_imbalance',
        category: 'Defensive Stats (Empathy)',
        description: 'Too focused on romance',
        value,
        details: `${romanticInteractionsCount} romantic vs ${platonicInteractions} platonic interactions this week`
      });
    }

    // Check for neglected friends
    const allInteractionsResult = await client.query(
      `
      SELECT r.npc_id, MAX(i.created_at) as last_contact
      FROM relationships r
      LEFT JOIN interactions i ON i.relationship_id = r.id
      WHERE r.player_id = $1 AND r.friendship > $2
      GROUP BY r.npc_id
      `,
      [player.userId, cfg.thresholds.neglectedFriend.minFriendship]
    );

    let neglectedCount = 0;
    for (const row of allInteractionsResult.rows) {
      if (!row.last_contact) {
        neglectedCount++; // Never contacted
      } else {
        const lastContact = new Date(row.last_contact);
        const daysSince = (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > cfg.thresholds.neglectedFriend.daysSinceContact) {
          neglectedCount++;
        }
      }
    }

    if (neglectedCount > 0) {
      const value = cfg.penalties.neglectedFriend.valuePerFriend * neglectedCount;
      change += value;
      components.push({
        source: 'empathy_neglected_friends',
        category: 'Defensive Stats (Empathy)',
        description: 'Neglected friends',
        value,
        details: `${neglectedCount} ${neglectedCount === 1 ? 'friend' : 'friends'} not contacted in ${cfg.thresholds.neglectedFriend.daysSinceContact}+ days`
      });
    }

    // Was dismissive or rude today (negative social interaction)
    const hadNegativeInteraction = activities.some(a => {
      if (a.category !== 'social') return false;

      if (a.statEffects) {
        return (a.statEffects.empathy !== undefined && a.statEffects.empathy < 0) ||
               (a.statEffects.confidence !== undefined && a.statEffects.confidence < 0);
      }
      return false;
    });

    if (hadNegativeInteraction) {
      const value = cfg.penalties.negativeInteraction.value;
      change += value;
      components.push({
        source: 'empathy_negative_interaction',
        category: 'Defensive Stats (Empathy)',
        description: 'Was dismissive or rude',
        value,
        details: 'Had negative social interaction'
      });
    }

    return { change, components };
  } finally {
    client.release();
  }
}

// ===== Main Calculation Function =====

/**
 * Calculate all defensive stat changes during sleep
 *
 * Returns changes for Vitality, Ambition, and Empathy with breakdown components.
 */
export async function calculateDefensiveStatChanges(
  pool: Pool,
  player: PlayerCharacter,
  bedtime: string
): Promise<{
  vitality: number;
  ambition: number;
  empathy: number;
  components: Map<StatName, StatChangeComponent[]>;
}> {
  const [vitalityResult, ambitionResult, empathyResult] = await Promise.all([
    calculateVitalityChange(player, bedtime),
    calculateAmbitionChange(pool, player),
    calculateEmpathyChange(pool, player)
  ]);

  const components = new Map<StatName, StatChangeComponent[]>();
  if (vitalityResult.components.length > 0) {
    components.set('vitality', vitalityResult.components);
  }
  if (ambitionResult.components.length > 0) {
    components.set('ambition', ambitionResult.components);
  }
  if (empathyResult.components.length > 0) {
    components.set('empathy', empathyResult.components);
  }

  return {
    vitality: vitalityResult.change,
    ambition: ambitionResult.change,
    empathy: empathyResult.change,
    components
  };
}
