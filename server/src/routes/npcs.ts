/**
 * NPC Routes
 * API endpoints for NPC generation and management
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { generateNPC } from '../services/npc-generator';
import { NPC, ApiResponse } from '../../../shared/types';
import { randomUUID } from 'crypto';

const router = Router();

/**
 * POST /api/npcs
 * Generate and create a new NPC
 */
router.post('/', async (req: Request, res: Response<ApiResponse<NPC>>) => {
  const client = await pool.connect();

  try {
    // Generate random NPC
    const npcData = generateNPC();
    const id = randomUUID();
    const createdAt = new Date();

    // Insert into database
    const result = await client.query(
      `
      INSERT INTO npcs (
        id, name, archetype, traits,
        hair_color, hair_style, eye_color, build, height, skin_tone,
        distinctive_features, style, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
      `,
      [
        id,
        npcData.name,
        npcData.archetype,
        npcData.traits,
        npcData.appearance.hairColor,
        npcData.appearance.hairStyle,
        npcData.appearance.eyeColor,
        npcData.appearance.build,
        npcData.appearance.height,
        npcData.appearance.skinTone,
        npcData.appearance.distinctiveFeatures || [],
        npcData.appearance.style,
        createdAt
      ]
    );

    const row = result.rows[0];

    // Map database row to NPC type
    const npc: NPC = {
      id: row.id,
      name: row.name,
      archetype: row.archetype,
      traits: row.traits,
      appearance: {
        hairColor: row.hair_color,
        hairStyle: row.hair_style,
        eyeColor: row.eye_color,
        build: row.build,
        height: row.height,
        skinTone: row.skin_tone,
        distinctiveFeatures: row.distinctive_features,
        style: row.style
      },
      createdAt: row.created_at.toISOString()
    };

    console.log(`✅ Created NPC: ${npc.name} (${npc.archetype})`);

    res.json({
      success: true,
      data: npc
    });
  } catch (error) {
    console.error('Error creating NPC:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create NPC'
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/npcs
 * Get all NPCs
 */
router.get('/', async (req: Request, res: Response<ApiResponse<NPC[]>>) => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT * FROM npcs ORDER BY created_at DESC`
    );

    const npcs: NPC[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      archetype: row.archetype,
      traits: row.traits,
      appearance: {
        hairColor: row.hair_color,
        hairStyle: row.hair_style,
        eyeColor: row.eye_color,
        build: row.build,
        height: row.height,
        skinTone: row.skin_tone,
        distinctiveFeatures: row.distinctive_features,
        style: row.style
      },
      createdAt: row.created_at.toISOString()
    }));

    res.json({
      success: true,
      data: npcs
    });
  } catch (error) {
    console.error('Error fetching NPCs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NPCs'
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/npcs/:id
 * Get NPC by ID
 */
router.get('/:id', async (req: Request, res: Response<ApiResponse<NPC>>) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT * FROM npcs WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'NPC not found'
      });
      return;
    }

    const row = result.rows[0];
    const npc: NPC = {
      id: row.id,
      name: row.name,
      archetype: row.archetype,
      traits: row.traits,
      appearance: {
        hairColor: row.hair_color,
        hairStyle: row.hair_style,
        eyeColor: row.eye_color,
        build: row.build,
        height: row.height,
        skinTone: row.skin_tone,
        distinctiveFeatures: row.distinctive_features,
        style: row.style
      },
      createdAt: row.created_at.toISOString()
    };

    res.json({
      success: true,
      data: npc
    });
  } catch (error) {
    console.error('Error fetching NPC:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NPC'
    });
  } finally {
    client.release();
  }
});

export default router;
