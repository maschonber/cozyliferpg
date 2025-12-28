/**
 * Player Mapper
 * Pure functions for converting database rows to PlayerCharacter domain objects
 */

import {
  PlayerCharacter,
  PlayerArchetype,
  SexualPreference,
  LocationId,
  StatName
} from '../../../../shared/types';

/**
 * Database row structure for PlayerCharacter
 */
export interface PlayerCharacterRow {
  id: string;
  user_id: string;
  current_energy: number;
  max_energy: number;
  money: number;
  current_day: number;
  time_of_day: string;
  last_slept_at: string;
  current_location: string | null;
  sexual_preference: string | null;
  archetype: string | null;

  // Base stats
  base_fitness: number | null;
  base_vitality: number | null;
  base_poise: number | null;
  base_knowledge: number | null;
  base_creativity: number | null;
  base_ambition: number | null;
  base_confidence: number | null;
  base_wit: number | null;
  base_empathy: number | null;

  // Current stats
  current_fitness: number | null;
  current_vitality: number | null;
  current_poise: number | null;
  current_knowledge: number | null;
  current_creativity: number | null;
  current_ambition: number | null;
  current_confidence: number | null;
  current_wit: number | null;
  current_empathy: number | null;

  // Tracking
  min_energy_today: number | null;
  ending_energy_today: number | null;
  work_streak: number | null;
  rest_streak: number | null;
  burnout_streak: number | null;
  late_night_streak: number | null;
  worked_today: boolean | null;
  had_catastrophic_failure_today: boolean | null;
  stats_trained_today: string[] | null;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

/**
 * Map database row to PlayerCharacter domain object
 *
 * @param row - Database row from player_characters table
 * @returns PlayerCharacter domain object
 */
export function mapRowToPlayerCharacter(row: PlayerCharacterRow): PlayerCharacter {
  return {
    id: row.id,
    userId: row.user_id,
    currentEnergy: row.current_energy,
    maxEnergy: row.max_energy,
    money: row.money,
    currentDay: row.current_day,
    currentTime: row.time_of_day,
    lastSleptAt: row.last_slept_at,
    currentLocation: (row.current_location || 'home') as LocationId,

    // Relationship preferences
    sexualPreference: (row.sexual_preference || 'everyone') as SexualPreference,

    // Stats
    archetype: (row.archetype || 'balanced') as PlayerArchetype,
    stats: {
      baseFitness: row.base_fitness ?? 15,
      baseVitality: row.base_vitality ?? 15,
      basePoise: row.base_poise ?? 15,
      baseKnowledge: row.base_knowledge ?? 15,
      baseCreativity: row.base_creativity ?? 15,
      baseAmbition: row.base_ambition ?? 15,
      baseConfidence: row.base_confidence ?? 15,
      baseWit: row.base_wit ?? 15,
      baseEmpathy: row.base_empathy ?? 15,
      currentFitness: row.current_fitness ?? 15,
      currentVitality: row.current_vitality ?? 15,
      currentPoise: row.current_poise ?? 15,
      currentKnowledge: row.current_knowledge ?? 15,
      currentCreativity: row.current_creativity ?? 15,
      currentAmbition: row.current_ambition ?? 15,
      currentConfidence: row.current_confidence ?? 15,
      currentWit: row.current_wit ?? 15,
      currentEmpathy: row.current_empathy ?? 15
    },
    tracking: {
      minEnergyToday: row.min_energy_today ?? 100,
      endingEnergyToday: row.ending_energy_today ?? 100,
      workStreak: row.work_streak ?? 0,
      restStreak: row.rest_streak ?? 0,
      burnoutStreak: row.burnout_streak ?? 0,
      lateNightStreak: row.late_night_streak ?? 0,
      workedToday: row.worked_today ?? false,
      hadCatastrophicFailureToday: row.had_catastrophic_failure_today ?? false,
      statsTrainedToday: (row.stats_trained_today ?? []) as StatName[]
    },

    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}
