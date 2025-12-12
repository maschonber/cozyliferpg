/**
 * Defensive Stats Service (Phase 2.5.2)
 * Calculates Vitality, Ambition, and Empathy based on lifestyle patterns
 */

import { Pool } from 'pg';
import { PlayerCharacter, PlayerActivity, StatTracking, StatName, StatChangeComponent } from '../../../../shared/types';
import { getActivitiesForDay } from '../activity-history';
import { getCurrentStat } from '../stat';

// ===== Helper Functions =====

/**
 * Parse time string to hours (for bedtime calculations)
 */
function parseTimeToHours(time: string): number {
  const [hours] = time.split(':').map(Number);
  return hours;
}

/**
 * Check if player slept before midnight
 */
function sleptBeforeMidnight(bedtime: string): boolean {
  const hours = parseTimeToHours(bedtime);
  // Hours 0-1 are considered "after midnight" (2 AM)
  // Hours 2-23 where hours < 24 means before midnight
  return hours >= 6 && hours < 24;
}

/**
 * Check if player slept after 2 AM
 */
function sleptAfter2AM(bedtime: string): boolean {
  const hours = parseTimeToHours(bedtime);
  // 2 AM or 3 AM (early morning)
  return hours >= 2 && hours < 6;
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
 * Rewards balanced energy management and healthy habits
 */
export async function calculateVitalityChange(
  player: PlayerCharacter,
  bedtime: string
): Promise<{ change: number; components: StatChangeComponent[] }> {
  let change = 0;
  const tracking = player.tracking;
  const components: StatChangeComponent[] = [];

  // Positive factors (5x multiplier for defensive stat growth)
  if (tracking.minEnergyToday >= 30) {
    const value = 2.5;
    change += value;
    components.push({
      source: 'vitality_min_energy',
      category: 'Defensive Stats (Vitality)',
      description: 'Maintained energy above 30',
      value,
      details: `Min energy: ${tracking.minEnergyToday}`
    });
  }

  if (sleptBeforeMidnight(bedtime)) {
    const value = 1.5;
    change += value;
    components.push({
      source: 'vitality_sleep_schedule',
      category: 'Defensive Stats (Vitality)',
      description: 'Slept before midnight',
      value,
      details: `Bedtime: ${bedtime}`
    });
  }

  if (tracking.endingEnergyToday >= 20 && tracking.endingEnergyToday <= 50) {
    const value = 1.5;
    change += value;
    components.push({
      source: 'vitality_energy_balance',
      category: 'Defensive Stats (Vitality)',
      description: 'Balanced energy usage',
      value,
      details: `Ending energy: ${tracking.endingEnergyToday} (optimal: 20-50)`
    });
  }

  if (!tracking.hadCatastrophicFailureToday) {
    const value = 1.0;
    change += value;
    components.push({
      source: 'vitality_no_catastrophe',
      category: 'Defensive Stats (Vitality)',
      description: 'No catastrophic failures',
      value
    });
  }

  // Rest day after work bonus
  const workedYesterday = tracking.workStreak >= 1;
  const restingToday = !tracking.workedToday;
  if (workedYesterday && restingToday) {
    const value = 2.0;
    change += value;
    components.push({
      source: 'vitality_rest_recovery',
      category: 'Defensive Stats (Vitality)',
      description: 'Rest day after work',
      value,
      details: 'Good recovery pattern'
    });
  }

  // Negative factors (5x multiplier with progressive penalties)
  if (tracking.minEnergyToday <= 0) {
    const penalty = -2.5 * (1 + tracking.burnoutStreak * 0.2);
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
    const penalty = -2.5 * (1 + tracking.lateNightStreak * 0.2);
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

  if (tracking.endingEnergyToday > 50) {
    const value = -1.5;
    change += value;
    components.push({
      source: 'vitality_wasted_energy',
      category: 'Defensive Stats (Vitality)',
      description: 'Ended day with excess energy',
      value,
      details: `Energy: ${tracking.endingEnergyToday} (optimal: 20-50)`
    });
  }

  // Consecutive work days without rest
  if (tracking.workStreak >= 3) {
    const penalty = -1.5 * (tracking.workStreak - 2);
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
  if (tracking.restStreak >= 3) {
    const penalty = -1.5 * (tracking.restStreak - 2);
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
 * Rewards consistent effort and challenging yourself
 */
export async function calculateAmbitionChange(
  pool: Pool,
  player: PlayerCharacter
): Promise<{ change: number; components: StatChangeComponent[] }> {
  let change = 0;
  const tracking = player.tracking;
  const components: StatChangeComponent[] = [];

  // Get today's activities
  const activities = await getActivitiesForDay(pool, player.id, player.currentDay);

  // Positive factors - Work consistency (5x multiplier for defensive stat growth)
  if (tracking.workedToday) {
    const value = 2.0;
    change += value;
    components.push({
      source: 'ambition_worked_today',
      category: 'Defensive Stats (Ambition)',
      description: 'Completed work activity',
      value
    });
  }

  if (tracking.workStreak >= 2) {
    const value = 1.5;
    change += value;
    components.push({
      source: 'ambition_work_streak',
      category: 'Defensive Stats (Ambition)',
      description: 'Work streak bonus',
      value,
      details: `${tracking.workStreak} consecutive work days`
    });
  }

  if (tracking.workStreak >= 5) {
    const value = 2.5;
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
      // Check if activity was above comfort level
      if (activity.difficulty && activity.difficulty > relevantStatValue) {
        pushedSelfCount++;
      }

      // Attempted hard activity
      if (activity.difficulty && activity.difficulty >= 50) {
        hardActivityCount++;
      }
    }

    if (pushedSelfCount > 0) {
      const value = 2.0 * pushedSelfCount;
      change += value;
      components.push({
        source: 'ambition_pushed_limits',
        category: 'Defensive Stats (Ambition)',
        description: 'Pushed beyond comfort level',
        value,
        details: `${pushedSelfCount} challenging ${pushedSelfCount === 1 ? 'activity' : 'activities'}`
      });
    }

    if (hardActivityCount > 0) {
      const value = 1.0 * hardActivityCount;
      change += value;
      components.push({
        source: 'ambition_hard_activities',
        category: 'Defensive Stats (Ambition)',
        description: 'Attempted hard activities',
        value,
        details: `${hardActivityCount} ${hardActivityCount === 1 ? 'activity' : 'activities'} with difficulty ≥50`
      });
    }
  }

  // Negative factors (5x multiplier with aggressive scaling)
  if (!tracking.workedToday) {
    const value = -1.0;
    change += value;
    components.push({
      source: 'ambition_no_work',
      category: 'Defensive Stats (Ambition)',
      description: 'No work activity today',
      value
    });
  }

  const noWorkStreak = tracking.restStreak;
  if (noWorkStreak >= 2) {
    const penalty = -1.5 * noWorkStreak;
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
    const easyThreshold = Math.max(20, highestStat.value - 20);
    const allEasy = activities.every(a =>
      !a.difficulty || a.difficulty < easyThreshold
    );

    if (allEasy) {
      const value = -1.5;
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
 * Rewards authentic care for others and diverse relationships
 */
export async function calculateEmpathyChange(
  pool: Pool,
  player: PlayerCharacter
): Promise<{ change: number; components: StatChangeComponent[] }> {
  let change = 0;
  const components: StatChangeComponent[] = [];
  const client = await pool.connect();

  try {
    // Get today's activities
    const activities = await getActivitiesForDay(pool, player.id, player.currentDay);

    // Daily triggers - meaningful conversation (>60 minutes) (5x multiplier)
    const hadMeaningfulConversation = activities.some(a =>
      a.category === 'social' && a.timeCost >= 60
    );
    if (hadMeaningfulConversation) {
      const value = 1.5;
      change += value;
      components.push({
        source: 'empathy_meaningful_conversation',
        category: 'Defensive Stats (Empathy)',
        description: 'Had meaningful conversation',
        value,
        details: 'Social activity ≥60 minutes'
      });
    }

    // Get all relationships for pattern analysis
    const relationshipsResult = await client.query(
      `SELECT npc_id, friendship, romance FROM relationships WHERE player_id = $1`,
      [player.userId]
    );
    const relationships = relationshipsResult.rows;

    // Define platonic friends and romantic interests
    const platonicFriends = relationships.filter(
      r => r.friendship > 30 && r.romance < 10
    );
    const romanticInterests = relationships.filter(r => r.romance > 20);

    // Get NPCs interacted with today
    const npcsInteractedToday = new Set(
      activities.filter(a => a.npcId).map(a => a.npcId)
    );

    // Check if interacted with platonic friend today
    const interactedWithPlatonicFriend = platonicFriends.some(
      r => npcsInteractedToday.has(r.npc_id)
    );
    if (interactedWithPlatonicFriend) {
      const value = 2.5;
      change += value;
      components.push({
        source: 'empathy_platonic_friend',
        category: 'Defensive Stats (Empathy)',
        description: 'Spent time with platonic friend',
        value
      });
    }

    // Pattern bonuses
    if (platonicFriends.length >= 2) {
      const value = 1.0;
      change += value;
      components.push({
        source: 'empathy_friend_circle',
        category: 'Defensive Stats (Empathy)',
        description: 'Have multiple platonic friends',
        value,
        details: `${platonicFriends.length} platonic friends`
      });
    }
    if (platonicFriends.length >= 4) {
      const value = 1.5;
      change += value;
      components.push({
        source: 'empathy_large_friend_circle',
        category: 'Defensive Stats (Empathy)',
        description: 'Have large friend circle',
        value,
        details: `${platonicFriends.length} platonic friends`
      });
    }

    // Get interactions from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentInteractionsResult = await client.query(
      `
      SELECT DISTINCT r.npc_id, r.friendship, r.romance
      FROM interactions i
      JOIN relationships r ON i.relationship_id = r.id
      WHERE r.player_id = $1 AND i.created_at >= $2
      `,
      [player.userId, sevenDaysAgo]
    );

    const uniqueNpcsThisWeek = recentInteractionsResult.rows.length;
    if (uniqueNpcsThisWeek >= 5) {
      const value = 1.0;
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
      `SELECT npc_id FROM relationships WHERE player_id = $1 AND friendship >= 50`,
      [player.userId]
    );
    const friends = friendsResult.rows;

    if (friends.length > 0) {
      const recentNpcIds = new Set(recentInteractionsResult.rows.map(r => r.npc_id));
      const allFriendsContacted = friends.every(f => recentNpcIds.has(f.npc_id));

      if (allFriendsContacted) {
        const value = 1.0;
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

    // Negative factors (5x multiplier)
    // Only interacted with romantic interests today
    if (npcsInteractedToday.size > 0) {
      const onlyRomanticToday = Array.from(npcsInteractedToday).every(npcId =>
        romanticInterests.some(r => r.npc_id === npcId)
      );
      if (onlyRomanticToday && romanticInterests.length > 0) {
        const value = -2.0;
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
      [player.userId, sevenDaysAgo]
    );

    let platonicInteractions = 0;
    let romanticInteractionsCount = 0;

    for (const row of weekInteractionsResult.rows) {
      const count = parseInt(row.interaction_count);
      if (row.friendship > 30 && row.romance < 10) {
        platonicInteractions += count;
      } else if (row.romance > 20) {
        romanticInteractionsCount += count;
      }
    }

    if (romanticInteractionsCount > 2 * platonicInteractions && platonicInteractions > 0) {
      const value = -1.5;
      change += value;
      components.push({
        source: 'empathy_romance_imbalance',
        category: 'Defensive Stats (Empathy)',
        description: 'Too focused on romance',
        value,
        details: `${romanticInteractionsCount} romantic vs ${platonicInteractions} platonic interactions this week`
      });
    }

    // Check for neglected friends (friendship > 40, not contacted in 7+ days)
    const allInteractionsResult = await client.query(
      `
      SELECT r.npc_id, MAX(i.created_at) as last_contact
      FROM relationships r
      LEFT JOIN interactions i ON i.relationship_id = r.id
      WHERE r.player_id = $1 AND r.friendship > 40
      GROUP BY r.npc_id
      `,
      [player.userId]
    );

    let neglectedCount = 0;
    for (const row of allInteractionsResult.rows) {
      if (!row.last_contact) {
        neglectedCount++; // Never contacted
      } else {
        const lastContact = new Date(row.last_contact);
        const daysSince = (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 7) {
          neglectedCount++;
        }
      }
    }

    if (neglectedCount > 0) {
      const value = -1.5 * neglectedCount;
      change += value;
      components.push({
        source: 'empathy_neglected_friends',
        category: 'Defensive Stats (Empathy)',
        description: 'Neglected friends',
        value,
        details: `${neglectedCount} ${neglectedCount === 1 ? 'friend' : 'friends'} not contacted in 7+ days`
      });
    }

    // Was dismissive or rude today (negative friendship delta)
    const hadNegativeInteraction = activities.some(a => {
      if (a.statEffects) {
        // Check if any stat effect in the recorded effects is negative
        // This would indicate a rude/dismissive activity
        return Object.values(a.statEffects).some(v => v < 0);
      }
      return false;
    });

    if (hadNegativeInteraction) {
      const value = -2.5;
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
 * Returns changes for Vitality, Ambition, and Empathy with breakdown components
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
