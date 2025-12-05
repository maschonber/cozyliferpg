import { Router, Request, Response } from 'express';
import { pool, initDatabase } from '../db';

const router = Router();

/**
 * Admin endpoint to reinitialize database schema
 * This is safe to run multiple times - uses CREATE TABLE IF NOT EXISTS
 *
 * Usage: GET /api/admin/init-db?token=ADMIN_SECRET
 */
router.get('/init-db', async (req: Request, res: Response) => {
  try {
    // Simple token-based auth (use env variable in production)
    const adminToken = process.env.ADMIN_TOKEN || 'dev-admin-token';
    const providedToken = req.query.token;

    if (providedToken !== adminToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid admin token'
      });
    }

    console.log('🔧 Admin: Initializing database schema...');
    await initDatabase();

    return res.json({
      success: true,
      message: 'Database schema initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Admin init-db error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Check database schema status
 *
 * Usage: GET /api/admin/schema-status?token=ADMIN_SECRET
 */
router.get('/schema-status', async (req: Request, res: Response) => {
  try {
    // Simple token-based auth
    const adminToken = process.env.ADMIN_TOKEN || 'dev-admin-token';
    const providedToken = req.query.token;

    if (providedToken !== adminToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid admin token'
      });
    }

    // Check which tables exist
    const { rows: tables } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    // Check if player_characters table exists and get its columns
    const { rows: playerCharsCols } = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'player_characters'
      ORDER BY ordinal_position
    `);

    return res.json({
      success: true,
      tables: tables.map(t => t.table_name),
      playerCharactersTable: {
        exists: playerCharsCols.length > 0,
        columns: playerCharsCols
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Admin schema-status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check schema status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Force create player_characters table
 * This specifically creates the Phase 2 player_characters table
 *
 * Usage: POST /api/admin/create-player-table?token=ADMIN_SECRET
 */
router.post('/create-player-table', async (req: Request, res: Response) => {
  try {
    // Simple token-based auth
    const adminToken = process.env.ADMIN_TOKEN || 'dev-admin-token';
    const providedToken = req.query.token;

    if (providedToken !== adminToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid admin token'
      });
    }

    console.log('🔧 Admin: Creating player_characters table...');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create player_characters table (Phase 2)
      await client.query(`
        CREATE TABLE IF NOT EXISTS player_characters (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL UNIQUE,

          -- Resources
          current_energy INTEGER NOT NULL DEFAULT 100 CHECK (current_energy >= 0 AND current_energy <= 100),
          max_energy INTEGER NOT NULL DEFAULT 100,
          money INTEGER NOT NULL DEFAULT 200,

          -- Time tracking
          current_day INTEGER NOT NULL DEFAULT 1 CHECK (current_day >= 1),
          current_time VARCHAR(5) NOT NULL DEFAULT '06:00',
          last_slept_at VARCHAR(5) NOT NULL DEFAULT '06:00',

          -- Timestamps
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          -- Foreign key
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_player_characters_user ON player_characters(user_id)
      `);

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: 'player_characters table created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin create-player-table error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create player_characters table',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
