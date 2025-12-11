/**
 * Defensive Stats Service (Phase 2.5.2)
 * Calculates Vitality, Ambition, and Empathy based on lifestyle patterns
 */

import { Pool } from 'pg';
import { PlayerCharacter, PlayerActivity, StatTracking, StatName } from '../../../../shared/types';
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
): Promise<number> {
  let change = 0;
  const tracking = player.tracking;

  // Positive factors
  if (tracking.minEnergyToday >= 30) {
    change += 0.5; // Never bottomed out
  }

  if (sleptBeforeMidnight(bedtime)) {
    change += 0.3; // Healthy sleep schedule
  }

  if (tracking.endingEnergyToday >= 20 && tracking.endingEnergyToday <= 50) {
    change += 0.3; // Used energy well, kept reserve
  }

  if (!tracking.hadCatastrophicFailureToday) {
    change += 0.2; // No disasters
  }

  // Rest day after work bonus
  const workedYesterday = tracking.workStreak >= 1;
  const restingToday = !tracking.workedToday;
  if (workedYesterday && restingToday) {
    change += 0.4; // Good recovery
  }

  // Negative factors (with progressive penalties)
  if (tracking.minEnergyToday <= 0) {
    const penalty = -0.5 * (1 + tracking.burnoutStreak * 0.2);
    change += penalty; // Gets worse if repeated
  }

  if (sleptAfter2AM(bedtime)) {
    const penalty = -0.5 * (1 + tracking.lateNightStreak * 0.2);
    change += penalty; // Gets worse if repeated
  }

  if (tracking.endingEnergyToday > 50) {
    change -= 0.3; // Wasted potential
  }

  // Consecutive work days without rest
  if (tracking.workStreak >= 3) {
    const penalty = -0.3 * (tracking.workStreak - 2);
    change += penalty; // Escalates: -0.3, -0.6, -0.9...
  }

  // Consecutive rest days (slacking)
  if (tracking.restStreak >= 3) {
    const penalty = -0.3 * (tracking.restStreak - 2);
    change += penalty; // Penalize pure laziness
  }

  return change;
}

// ===== Ambition Calculations =====

/**
 * Calculate Ambition change based on pushing limits and work ethic
 * Rewards consistent effort and challenging yourself
 */
export async function calculateAmbitionChange(
  pool: Pool,
  player: PlayerCharacter
): Promise<number> {
  let change = 0;
  const tracking = player.tracking;

  // Get today's activities
  const activities = await getActivitiesForDay(pool, player.id, player.currentDay);

  // Positive factors - Work consistency
  if (tracking.workedToday) {
    change += 0.4; // Completed work today
  }

  if (tracking.workStreak >= 2) {
    change += 0.3; // Work streak bonus
  }

  if (tracking.workStreak >= 5) {
    change += 0.5; // Additional bonus for long streak
  }

  // Training above comfort level
  const highestStat = getHighestRelevantStat(activities, player.stats);
  if (highestStat) {
    const relevantStatValue = highestStat.value;

    for (const activity of activities) {
      // Check if activity was above comfort level
      if (activity.difficulty && activity.difficulty > relevantStatValue) {
        change += 0.4; // Pushed yourself
      }

      // Attempted hard activity
      if (activity.difficulty && activity.difficulty >= 50) {
        change += 0.2; // Took on challenge
      }
    }
  }

  // Negative factors (aggressive scaling)
  if (!tracking.workedToday) {
    change -= 0.2; // Single day without work
  }

  const noWorkStreak = tracking.restStreak;
  if (noWorkStreak >= 2) {
    const penalty = -0.3 * noWorkStreak;
    change += penalty; // Escalates: -0.6, -0.9, -1.2...
  }

  // Check if all activities were easy
  if (highestStat && activities.length > 0) {
    const easyThreshold = Math.max(20, highestStat.value - 20);
    const allEasy = activities.every(a =>
      !a.difficulty || a.difficulty < easyThreshold
    );

    if (allEasy) {
      change -= 0.3; // Coasting on existing skills
    }
  }

  return change;
}

// ===== Empathy Calculations =====

/**
 * Calculate Empathy change based on genuine connections
 * Rewards authentic care for others and diverse relationships
 */
export async function calculateEmpathyChange(
  pool: Pool,
  player: PlayerCharacter
): Promise<number> {
  let change = 0;
  const client = await pool.connect();

  try {
    // Get today's activities
    const activities = await getActivitiesForDay(pool, player.id, player.currentDay);

    // Daily triggers - meaningful conversation (>60 minutes)
    const hadMeaningfulConversation = activities.some(a =>
      a.category === 'social' && a.timeCost >= 60
    );
    if (hadMeaningfulConversation) {
      change += 0.3;
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
      change += 0.5;
    }

    // Pattern bonuses
    if (platonicFriends.length >= 2) {
      change += 0.2;
    }
    if (platonicFriends.length >= 4) {
      change += 0.3; // Additional bonus
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
      change += 0.2; // Diversity bonus
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
        change += 0.2; // Maintained all friendships
      }
    }

    // Negative factors
    // Only interacted with romantic interests today
    if (npcsInteractedToday.size > 0) {
      const onlyRomanticToday = Array.from(npcsInteractedToday).every(npcId =>
        romanticInterests.some(r => r.npc_id === npcId)
      );
      if (onlyRomanticToday && romanticInterests.length > 0) {
        change -= 0.4;
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
      change -= 0.3; // Imbalanced toward romance
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
      change -= 0.3 * neglectedCount; // Penalty per neglected friend
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
      change -= 0.5;
    }

    return change;
  } finally {
    client.release();
  }
}

// ===== Main Calculation Function =====

/**
 * Calculate all defensive stat changes during sleep
 * Returns changes for Vitality, Ambition, and Empathy
 */
export async function calculateDefensiveStatChanges(
  pool: Pool,
  player: PlayerCharacter,
  bedtime: string
): Promise<{
  vitality: number;
  ambition: number;
  empathy: number;
}> {
  const [vitality, ambition, empathy] = await Promise.all([
    calculateVitalityChange(player, bedtime),
    calculateAmbitionChange(pool, player),
    calculateEmpathyChange(pool, player)
  ]);

  return { vitality, ambition, empathy };
}
