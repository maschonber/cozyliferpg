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

// Phase 3 Migration: Add location columns
export async function migratePhase3Locations() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔄 Running Phase 3 location migration...');

    // Check if current_location column exists in player_characters
    const playerColCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='player_characters' AND column_name='current_location'
    `);

    if (playerColCheck.rows.length === 0) {
      console.log('  Adding current_location column to player_characters...');
      await client.query(`
        ALTER TABLE player_characters
        ADD COLUMN current_location VARCHAR(50) NOT NULL DEFAULT 'home'
      `);
      console.log('  ✅ Added current_location to player_characters');
    } else {
      console.log('  ⏭️  current_location already exists in player_characters');
    }

    // Check if current_location column exists in npcs
    const npcColCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='npcs' AND column_name='current_location'
    `);

    if (npcColCheck.rows.length === 0) {
      console.log('  Adding current_location column to npcs...');
      await client.query(`
        ALTER TABLE npcs
        ADD COLUMN current_location VARCHAR(50) NOT NULL DEFAULT 'park'
      `);
      console.log('  ✅ Added current_location to npcs');

      // Create index for faster location lookups
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_npcs_location ON npcs(current_location)
      `);
      console.log('  ✅ Created index on npcs.current_location');
    } else {
      console.log('  ⏭️  current_location already exists in npcs');
    }

    await client.query('COMMIT');
    console.log('✅ Phase 3 location migration completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Phase 3 migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Phase 2.5 Migration: Add player stats and archetype
export async function migratePhase25Stats() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔄 Running Phase 2.5 stats migration...');

    // Check if archetype column exists (use as migration marker)
    const archetypeCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='player_characters' AND column_name='archetype'
    `);

    if (archetypeCheck.rows.length === 0) {
      console.log('  Adding archetype column...');
      await client.query(`
        ALTER TABLE player_characters
        ADD COLUMN archetype VARCHAR(50) NOT NULL DEFAULT 'balanced'
      `);

      // Add Base stats (permanent, 0-100)
      console.log('  Adding base stat columns...');
      await client.query(`
        ALTER TABLE player_characters
        ADD COLUMN base_fitness REAL NOT NULL DEFAULT 15,
        ADD COLUMN base_vitality REAL NOT NULL DEFAULT 15,
        ADD COLUMN base_poise REAL NOT NULL DEFAULT 15,
        ADD COLUMN base_knowledge REAL NOT NULL DEFAULT 15,
        ADD COLUMN base_creativity REAL NOT NULL DEFAULT 15,
        ADD COLUMN base_ambition REAL NOT NULL DEFAULT 15,
        ADD COLUMN base_confidence REAL NOT NULL DEFAULT 15,
        ADD COLUMN base_wit REAL NOT NULL DEFAULT 15,
        ADD COLUMN base_empathy REAL NOT NULL DEFAULT 15
      `);

      // Add Current stats (active, 0 to base+30)
      console.log('  Adding current stat columns...');
      await client.query(`
        ALTER TABLE player_characters
        ADD COLUMN current_fitness REAL NOT NULL DEFAULT 15,
        ADD COLUMN current_vitality REAL NOT NULL DEFAULT 15,
        ADD COLUMN current_poise REAL NOT NULL DEFAULT 15,
        ADD COLUMN current_knowledge REAL NOT NULL DEFAULT 15,
        ADD COLUMN current_creativity REAL NOT NULL DEFAULT 15,
        ADD COLUMN current_ambition REAL NOT NULL DEFAULT 15,
        ADD COLUMN current_confidence REAL NOT NULL DEFAULT 15,
        ADD COLUMN current_wit REAL NOT NULL DEFAULT 15,
        ADD COLUMN current_empathy REAL NOT NULL DEFAULT 15
      `);

      // Add tracking columns for defensive stats
      console.log('  Adding stat tracking columns...');
      await client.query(`
        ALTER TABLE player_characters
        ADD COLUMN min_energy_today INTEGER NOT NULL DEFAULT 100,
        ADD COLUMN work_streak INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN rest_streak INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN burnout_streak INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN late_night_streak INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN worked_today BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN had_catastrophic_failure_today BOOLEAN NOT NULL DEFAULT false
      `);

      console.log('  ✅ Added all Phase 2.5 stat columns');
    } else {
      console.log('  ⏭️  Phase 2.5 stat columns already exist');
    }

    // Check if stats_trained_today column exists
    const trainedCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='player_characters' AND column_name='stats_trained_today'
    `);

    if (trainedCheck.rows.length === 0) {
      console.log('  Adding stats_trained_today column...');
      await client.query(`
        ALTER TABLE player_characters
        ADD COLUMN stats_trained_today TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
      `);
      console.log('  ✅ Added stats_trained_today column');
    }

    // Check if ending_energy_today column exists
    const endingEnergyCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='player_characters' AND column_name='ending_energy_today'
    `);

    if (endingEnergyCheck.rows.length === 0) {
      console.log('  Adding ending_energy_today column...');
      await client.query(`
        ALTER TABLE player_characters
        ADD COLUMN ending_energy_today INTEGER NOT NULL DEFAULT 100
      `);
      console.log('  ✅ Added ending_energy_today column');
    }

    await client.query('COMMIT');
    console.log('✅ Phase 2.5 stats migration completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Phase 2.5 migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Phase 2.5.1 Migration: Add player_activities table for activity history
export async function migratePhase251ActivityHistory() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔄 Running Phase 2.5.1 activity history migration...');

    // Check if player_activities table exists
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name='player_activities'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('  Creating player_activities table...');
      await client.query(`
        CREATE TABLE player_activities (
          id VARCHAR(255) PRIMARY KEY,
          player_id VARCHAR(255) NOT NULL,
          activity_id VARCHAR(100) NOT NULL,

          -- When it happened
          performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          day_number INTEGER NOT NULL,
          time_of_day VARCHAR(5) NOT NULL,

          -- Activity details (denormalized for historical accuracy)
          activity_name VARCHAR(200),
          category VARCHAR(50),
          difficulty INTEGER,
          relevant_stats TEXT[],

          -- Costs (actual costs paid)
          time_cost INTEGER NOT NULL,
          energy_cost INTEGER NOT NULL,
          money_cost INTEGER NOT NULL,

          -- Outcome (if activity had a roll)
          outcome_tier VARCHAR(20),  -- 'best', 'okay', 'mixed', 'catastrophic', NULL
          roll INTEGER,
          adjusted_roll INTEGER,
          stat_bonus INTEGER,
          difficulty_penalty INTEGER,

          -- Effects (actual effects received)
          stat_effects JSONB,  -- { "fitness": 3.5, "vitality": 1.2 }
          energy_delta INTEGER,
          money_delta INTEGER,

          -- For social activities (if NPC was involved)
          npc_id VARCHAR(255),
          interaction_id VARCHAR(255),

          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          -- Foreign keys
          FOREIGN KEY (player_id) REFERENCES player_characters(id) ON DELETE CASCADE,
          FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE SET NULL,
          FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL
        )
      `);

      // Create indexes for efficient querying
      console.log('  Creating indexes...');
      await client.query(`
        CREATE INDEX idx_player_activities_player_day
        ON player_activities(player_id, day_number DESC)
      `);
      await client.query(`
        CREATE INDEX idx_player_activities_performed_at
        ON player_activities(player_id, performed_at DESC)
      `);
      await client.query(`
        CREATE INDEX idx_player_activities_category
        ON player_activities(player_id, category)
      `);

      console.log('  ✅ Created player_activities table and indexes');
    } else {
      console.log('  ⏭️  player_activities table already exists');
    }

    await client.query('COMMIT');
    console.log('✅ Phase 2.5.1 activity history migration completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Phase 2.5.1 migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

