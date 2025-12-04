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

    // Create items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL CHECK (category IN ('furniture', 'crop', 'tool', 'fish')),
        rarity VARCHAR(50) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
        price INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        level INTEGER DEFAULT 1,
        gold INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table for authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
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
  const client = await pool.connect();

  try {
    const { rows } = await client.query('SELECT COUNT(*) FROM items');

    if (parseInt(rows[0].count) > 0) {
      console.log('⏭️  Database already has data, skipping seed');
      return;
    }

    console.log('🌱 Seeding database with demo data...');

    // Seed items
    await client.query(`
      INSERT INTO items (id, name, icon, category, rarity, price) VALUES
      ('item_1', 'Cozy Armchair', '🛋️', 'furniture', 'common', 150),
      ('item_2', 'Wooden Bookshelf', '📚', 'furniture', 'common', 200),
      ('item_3', 'Magical Bed', '🛏️', 'furniture', 'epic', 800),
      ('item_4', 'Tomato Seeds', '🍅', 'crop', 'common', 10),
      ('item_5', 'Carrot Seeds', '🥕', 'crop', 'common', 8),
      ('item_6', 'Pumpkin Seeds', '🎃', 'crop', 'rare', 25),
      ('item_7', 'Basic Fishing Rod', '🎣', 'tool', 'common', 100),
      ('item_8', 'Golden Fishing Rod', '⭐', 'tool', 'epic', 500),
      ('item_9', 'Master Fishing Rod', '💎', 'tool', 'legendary', 2000),
      ('item_10', 'Small Fish', '🐟', 'fish', 'common', 15),
      ('item_11', 'Rainbow Trout', '🌈', 'fish', 'rare', 75),
      ('item_12', 'Golden Koi', '🐠', 'fish', 'epic', 250),
      ('item_13', 'Legendary Dragon Fish', '🐉', 'fish', 'legendary', 1000)
    `);

    // Seed a demo player
    await client.query(`
      INSERT INTO players (id, username, level, gold) VALUES
      ('player_demo', 'DemoPlayer', 5, 500)
    `);

    console.log('✅ Database seeded with 13 items and 1 demo player');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    client.release();
  }
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

// Get database statistics
export async function getDatabaseStats() {
  const client = await pool.connect();

  try {
    const itemsCount = await client.query('SELECT COUNT(*) FROM items');
    const playersCount = await client.query('SELECT COUNT(*) FROM players');
    const npcsCount = await client.query('SELECT COUNT(*) FROM npcs');
    const relationshipsCount = await client.query('SELECT COUNT(*) FROM relationships');
    const interactionsCount = await client.query('SELECT COUNT(*) FROM interactions');

    return {
      items: parseInt(itemsCount.rows[0].count),
      players: parseInt(playersCount.rows[0].count),
      npcs: parseInt(npcsCount.rows[0].count),
      relationships: parseInt(relationshipsCount.rows[0].count),
      interactions: parseInt(interactionsCount.rows[0].count),
      connected: true
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      items: 0,
      players: 0,
      npcs: 0,
      relationships: 0,
      interactions: 0,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    client.release();
  }
}
