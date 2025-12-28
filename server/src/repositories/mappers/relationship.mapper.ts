/**
 * Relationship Mapper
 * Pure functions for converting database rows to Relationship domain objects
 */

import { Relationship, NPC, RelationshipState } from '../../../../shared/types';

/**
 * Database row structure for Relationship
 */
export interface RelationshipRow {
  id: string;
  player_id: string;
  npc_id: string;
  trust: number | null;
  affection: number | null;
  desire: number | null;
  desire_cap: number | null;
  current_state: string;
  unlocked_states: string[];
  first_met: Date;
  last_interaction: Date;
}

/**
 * Map database row to Relationship domain object
 *
 * @param row - Database row from relationships table
 * @param npc - Optional NPC object to attach (from join)
 * @returns Relationship domain object
 */
export function mapRowToRelationship(row: RelationshipRow, npc?: NPC): Relationship {
  return {
    id: row.id,
    playerId: row.player_id,
    npcId: row.npc_id,
    // Defensive: ensure axis values are never null/undefined
    trust: row.trust ?? 0,
    affection: row.affection ?? 0,
    desire: row.desire ?? 0,
    desireCap: row.desire_cap ?? undefined,
    currentState: row.current_state as RelationshipState,
    unlockedStates: row.unlocked_states as RelationshipState[],
    firstMet: row.first_met.toISOString(),
    lastInteraction: row.last_interaction.toISOString(),
    npc
  };
}
