import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { GameItem, ApiResponse } from '../../../shared/types';

const router = Router();

// GET /api/items - Get all items
router.get('/', async (_req: Request, res: Response<ApiResponse<GameItem[]>>) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, icon, category, rarity, price
      FROM items
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch items'
    });
  }
});

// GET /api/items/:id - Get single item
router.get('/:id', async (req: Request, res: Response<ApiResponse<GameItem>>) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT id, name, icon, category, rarity, price FROM items WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch item'
    });
  }
});

// POST /api/items - Create new item
router.post('/', async (req: Request, res: Response<ApiResponse<GameItem>>) => {
  try {
    const { id, name, icon, category, rarity, price } = req.body;

    // Basic validation
    if (!id || !name || !icon || !category || !rarity || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO items (id, name, icon, category, rarity, price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, name, icon, category, rarity, price]
    );

    res.status(201).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create item'
    });
  }
});

// DELETE /api/items/:id - Delete item
router.delete('/:id', async (req: Request, res: Response<ApiResponse<void>>) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM items WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete item'
    });
  }
});

export default router;
