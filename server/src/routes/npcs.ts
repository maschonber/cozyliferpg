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
        id, name, archetype, traits, gender,
        hair_color, hair_style, eye_color, face_details,
        body_type, torso_size, height, skin_tone,
        upper_trace, lower_trace, style, body_details,
        loras, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
      `,
      [
        id,
        npcData.name,
        npcData.archetype,
        npcData.traits,
        npcData.gender,
        npcData.appearance.hairColor,
        npcData.appearance.hairStyle,
        npcData.appearance.eyeColor,
        npcData.appearance.faceDetails,
        npcData.appearance.bodyType,
        npcData.appearance.torsoSize,
        npcData.appearance.height,
        npcData.appearance.skinTone,
        npcData.appearance.upperTrace,
        npcData.appearance.lowerTrace,
        npcData.appearance.style,
        npcData.appearance.bodyDetails,
        npcData.loras,
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
      gender: row.gender,
      appearance: {
        hairColor: row.hair_color,
        hairStyle: row.hair_style,
        eyeColor: row.eye_color,
        faceDetails: row.face_details,
        bodyType: row.body_type,
        torsoSize: row.torso_size,
        height: row.height,
        skinTone: row.skin_tone,
        upperTrace: row.upper_trace,
        lowerTrace: row.lower_trace,
        style: row.style,
        bodyDetails: row.body_details
      },
      loras: row.loras,
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
      gender: row.gender,
      appearance: {
        hairColor: row.hair_color,
        hairStyle: row.hair_style,
        eyeColor: row.eye_color,
        faceDetails: row.face_details,
        bodyType: row.body_type,
        torsoSize: row.torso_size,
        height: row.height,
        skinTone: row.skin_tone,
        upperTrace: row.upper_trace,
        lowerTrace: row.lower_trace,
        style: row.style,
        bodyDetails: row.body_details
      },
      loras: row.loras,
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
      gender: row.gender,
      appearance: {
        hairColor: row.hair_color,
        hairStyle: row.hair_style,
        eyeColor: row.eye_color,
        faceDetails: row.face_details,
        bodyType: row.body_type,
        torsoSize: row.torso_size,
        height: row.height,
        skinTone: row.skin_tone,
        upperTrace: row.upper_trace,
        lowerTrace: row.lower_trace,
        style: row.style,
        bodyDetails: row.body_details
      },
      loras: row.loras,
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
