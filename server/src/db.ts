import { Pool } from 'pg';
import { PasswordService } from './auth/password.service';

// Database connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Initialize database schema
export async function initDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create users table for authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        time_of_day VARCHAR(5) NOT NULL DEFAULT '06:00',
        last_slept_at VARCHAR(5) NOT NULL DEFAULT '06:00',

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- Foreign key
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create index for player_characters
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_player_characters_user ON player_characters(user_id)
    `);

    // Create NPCs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS npcs (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,

        -- Game-specific fields
        archetype VARCHAR(100) NOT NULL,
        traits TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

        -- Gender field
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('female', 'male', 'other')),

        -- Appearance (for visualization API + game logic)
        hair_color VARCHAR(50) NOT NULL,
        hair_style VARCHAR(50) NOT NULL,
        eye_color VARCHAR(50) NOT NULL,
        face_details TEXT[] DEFAULT ARRAY[]::TEXT[],
        body_type VARCHAR(50) NOT NULL,
        torso_size VARCHAR(50) NOT NULL,
        height VARCHAR(50) NOT NULL,
        skin_tone VARCHAR(50) NOT NULL,
        upper_trace VARCHAR(100) NOT NULL,
        lower_trace VARCHAR(100) NOT NULL,
        style VARCHAR(50),
        body_details TEXT[] DEFAULT ARRAY[]::TEXT[],

        -- LoRAs for AI model
        loras TEXT[] DEFAULT ARRAY[]::TEXT[],

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create relationships table
    await client.query(`
      CREATE TABLE IF NOT EXISTS relationships (
        id VARCHAR(255) PRIMARY KEY,
        player_id VARCHAR(255) NOT NULL,
        npc_id VARCHAR(255) NOT NULL,

        -- Dimension values (-100 to +100)
        friendship INTEGER NOT NULL DEFAULT 0 CHECK (friendship >= -100 AND friendship <= 100),
        romance INTEGER NOT NULL DEFAULT 0 CHECK (romance >= -100 AND romance <= 100),

        -- State tracking
        current_state VARCHAR(50) NOT NULL DEFAULT 'stranger',
        unlocked_states TEXT[] DEFAULT ARRAY['stranger']::TEXT[],

        -- Timestamps
        first_met TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_interaction TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        -- Foreign keys
        FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE CASCADE,

        -- Constraints
        UNIQUE(player_id, npc_id)
      )
    `);

    // Create indexes for relationships
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_relationships_player ON relationships(player_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_relationships_npc ON relationships(npc_id)
    `);

    // Create interactions table (history)
    await client.query(`
      CREATE TABLE IF NOT EXISTS interactions (
        id VARCHAR(255) PRIMARY KEY,
        relationship_id VARCHAR(255) NOT NULL,
        activity_type VARCHAR(100) NOT NULL,

        -- Effects
        friendship_delta INTEGER NOT NULL DEFAULT 0,
        romance_delta INTEGER NOT NULL DEFAULT 0,

        -- Context
        emotional_state VARCHAR(50),
        notes TEXT,

        -- Timestamp
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        -- Foreign key
        FOREIGN KEY (relationship_id) REFERENCES relationships(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for interactions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_interactions_relationship ON interactions(relationship_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at DESC)
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema initialized');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Seed sample data (optional, for development)
export async function seedDatabase() {
  // No demo data to seed - removed items and players tables
  console.log('⏭️  No demo data to seed');
}

// Seed initial user (run once)
export async function seedUsers() {
  const client = await pool.connect();

  try {
    const { rows } = await client.query('SELECT COUNT(*) FROM users');

    if (parseInt(rows[0].count) > 0) {
      console.log('⏭️  Users already exist, skipping user seed');
      return;
    }

    console.log('👤 Seeding initial user...');

    // Hash the password
    const passwordHash = await PasswordService.hash('glb34Vvj5!');

    // Insert the user
    await client.query(`
      INSERT INTO users (id, username, password_hash) VALUES
      ('user_1', 'qurbl', $1)
    `, [passwordHash]);

    console.log('✅ Initial user created (username: qurbl)');
  } catch (error) {
    console.error('❌ User seeding failed:', error);
  } finally {
    client.release();
  }
}

