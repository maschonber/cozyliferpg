import { Pool } from 'pg';
import { PasswordService } from './auth/password.service';

// Database connection pool
// Use DATABASE_PUBLIC_URL for local development (via railway run)
// Fall back to DATABASE_URL for production deployment
const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
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

        -- Time tracking (unified minutes since Day 1, 00:00)
        game_time_minutes INTEGER NOT NULL DEFAULT 360,

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


// NPC Archetype Removal Migration
// Removes the archetype column from npcs table (archetypes are no longer used)
export async function migrateRemoveNpcArchetype() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔄 Running NPC Archetype Removal migration...');

    // Check if archetype column exists
    const archetypeCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='npcs' AND column_name='archetype'
    `);

    if (archetypeCheck.rows.length > 0) {
      console.log('  Removing archetype column from npcs table...');
      await client.query(`
        ALTER TABLE npcs
        DROP COLUMN archetype
      `);
      console.log('  ✅ Removed archetype column');
    } else {
      console.log('  ⏭️  archetype column already removed');
    }

    await client.query('COMMIT');
    console.log('✅ NPC Archetype Removal migration completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ NPC Archetype Removal migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Game Time Minutes Migration
// Converts player time storage from separate day/time columns to unified minutes
export async function migrateGameTimeMinutes() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔄 Running Game Time Minutes migration...');

    // ===== 1. Add game_time_minutes column if not exists =====
    const gameTimeCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='player_characters' AND column_name='game_time_minutes'
    `);

    if (gameTimeCheck.rows.length === 0) {
      console.log('  Adding game_time_minutes column...');
      await client.query(`
        ALTER TABLE player_characters
        ADD COLUMN game_time_minutes INTEGER
      `);

      // Backfill from existing data: (day - 1) * 1440 + hours * 60 + minutes
      console.log('  Backfilling game_time_minutes from existing data...');
      await client.query(`
        UPDATE player_characters
        SET game_time_minutes = (current_day - 1) * 1440 +
          CAST(SPLIT_PART(time_of_day, ':', 1) AS INTEGER) * 60 +
          CAST(SPLIT_PART(time_of_day, ':', 2) AS INTEGER)
      `);

      // Set NOT NULL and default after backfill
      await client.query(`
        ALTER TABLE player_characters
        ALTER COLUMN game_time_minutes SET NOT NULL,
        ALTER COLUMN game_time_minutes SET DEFAULT 360
      `);

      console.log('  ✅ Added and populated game_time_minutes column');
    } else {
      console.log('  ⏭️  game_time_minutes column already exists');
    }

    // ===== 2. Drop old columns =====
    const columnsToRemove = ['current_day', 'time_of_day', 'last_slept_at'];
    for (const col of columnsToRemove) {
      const colCheck = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='player_characters' AND column_name=$1
      `, [col]);

      if (colCheck.rows.length > 0) {
        console.log(`  Dropping column ${col}...`);
        await client.query(`ALTER TABLE player_characters DROP COLUMN ${col}`);
        console.log(`  ✅ Dropped ${col} column`);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Game Time Minutes migration completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Game Time Minutes migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Social Activities Consolidation Migration
// Consolidates social activities into player_activities and removes interactions table
export async function migrateSocialActivitiesConsolidation() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔄 Running Social Activities Consolidation migration...');

    // ===== 1. Add relationship_effects column to player_activities =====
    const relationshipEffectsCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='player_activities' AND column_name='relationship_effects'
    `);

    if (relationshipEffectsCheck.rows.length === 0) {
      console.log('  Adding relationship_effects column to player_activities...');
      await client.query(`
        ALTER TABLE player_activities
        ADD COLUMN relationship_effects JSONB
      `);
      console.log('  ✅ Added relationship_effects column');
    } else {
      console.log('  ⏭️  relationship_effects column already exists');
    }

    // ===== 2. Remove interaction_id column from player_activities =====
    const interactionIdCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='player_activities' AND column_name='interaction_id'
    `);

    if (interactionIdCheck.rows.length > 0) {
      console.log('  Removing interaction_id column from player_activities...');
      await client.query(`
        ALTER TABLE player_activities
        DROP COLUMN interaction_id
      `);
      console.log('  ✅ Removed interaction_id column');
    } else {
      console.log('  ⏭️  interaction_id column already removed');
    }

    // ===== 3. Remove deprecated columns from player_activities =====
    // These were removed in the schema but may still exist in prod
    const columnsToRemove = ['activity_name', 'category', 'difficulty', 'relevant_stats', 'tags', 'time_cost', 'energy_cost', 'money_cost'];
    for (const col of columnsToRemove) {
      const colCheck = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='player_activities' AND column_name=$1
      `, [col]);

      if (colCheck.rows.length > 0) {
        console.log(`  Removing deprecated column ${col} from player_activities...`);
        await client.query(`ALTER TABLE player_activities DROP COLUMN ${col}`);
      }
    }

    // ===== 4. Add npc_id index if missing =====
    const npcIndexCheck = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename='player_activities' AND indexname='idx_player_activities_npc'
    `);

    if (npcIndexCheck.rows.length === 0) {
      console.log('  Creating npc_id index on player_activities...');
      await client.query(`
        CREATE INDEX idx_player_activities_npc
        ON player_activities(player_id, npc_id)
      `);
      console.log('  ✅ Created npc_id index');
    }

    // ===== 5. Drop interactions table =====
    const interactionsTableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name='interactions'
    `);

    if (interactionsTableCheck.rows.length > 0) {
      console.log('  Dropping interactions table...');
      await client.query(`DROP TABLE interactions`);
      console.log('  ✅ Dropped interactions table');
    } else {
      console.log('  ⏭️  interactions table already removed');
    }

    await client.query('COMMIT');
    console.log('✅ Social Activities Consolidation migration completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Social Activities Consolidation migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// NPC/Relationship Consolidation Migration
// Consolidates npcs and relationships tables into npc_templates and player_npcs
export async function migrateNpcRelationshipConsolidation() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔄 Running NPC/Relationship Consolidation migration...');

    // ===== 1. Check if already migrated (player_npcs table exists) =====
    const playerNpcsCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name='player_npcs'
    `);

    if (playerNpcsCheck.rows.length > 0) {
      console.log('  ⏭️  Migration already applied (player_npcs table exists)');
      await client.query('COMMIT');
      return;
    }

    // ===== 2. Create npc_templates table =====
    console.log('  Creating npc_templates table...');
    await client.query(`
      CREATE TABLE npc_templates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('female', 'male', 'other')),
        traits TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
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
        loras TEXT[] DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Created npc_templates table');

    // ===== 3. Create player_npcs table =====
    console.log('  Creating player_npcs table...');
    await client.query(`
      CREATE TABLE player_npcs (
        id VARCHAR(255) PRIMARY KEY,
        player_id VARCHAR(255) NOT NULL,
        npc_template_id VARCHAR(255) NOT NULL,
        trust INTEGER NOT NULL DEFAULT 0 CHECK (trust >= -100 AND trust <= 100),
        affection INTEGER NOT NULL DEFAULT 0 CHECK (affection >= -100 AND affection <= 100),
        desire INTEGER NOT NULL DEFAULT 0 CHECK (desire >= -100 AND desire <= 100),
        current_state VARCHAR(50) NOT NULL DEFAULT 'stranger',
        emotion_vector JSONB NOT NULL DEFAULT '{"joySadness":0,"acceptanceDisgust":0,"angerFear":0,"anticipationSurprise":0}',
        revealed_traits TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        current_location VARCHAR(50) NOT NULL,
        first_met INTEGER NOT NULL DEFAULT 360,
        last_interaction INTEGER NOT NULL DEFAULT 360,
        FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (npc_template_id) REFERENCES npc_templates(id) ON DELETE CASCADE,
        UNIQUE(player_id, npc_template_id)
      )
    `);
    console.log('  ✅ Created player_npcs table');

    // ===== 4. Create indexes =====
    console.log('  Creating indexes...');
    await client.query(`CREATE INDEX idx_player_npcs_player ON player_npcs(player_id)`);
    await client.query(`CREATE INDEX idx_player_npcs_template ON player_npcs(npc_template_id)`);
    await client.query(`CREATE INDEX idx_player_npcs_location ON player_npcs(player_id, current_location)`);
    console.log('  ✅ Created indexes');

    // ===== 5. Migrate data from npcs to npc_templates =====
    const npcsCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name='npcs'
    `);

    if (npcsCheck.rows.length > 0) {
      console.log('  Migrating data from npcs to npc_templates...');

      // Check if npcs has any rows
      const npcsCount = await client.query('SELECT COUNT(*) as count FROM npcs');
      const count = parseInt(npcsCount.rows[0].count, 10);

      if (count > 0) {
        // Insert static data into npc_templates
        await client.query(`
          INSERT INTO npc_templates (
            id, name, gender, traits,
            hair_color, hair_style, eye_color, face_details,
            body_type, torso_size, height, skin_tone,
            upper_trace, lower_trace, style, body_details,
            loras, created_at
          )
          SELECT
            id, name, gender, traits,
            hair_color, hair_style, eye_color, face_details,
            body_type, torso_size, height, skin_tone,
            upper_trace, lower_trace, style, body_details,
            loras, created_at
          FROM npcs
        `);
        console.log(`  ✅ Migrated ${count} NPC templates`);
      } else {
        console.log('  ⏭️  No NPCs to migrate');
      }
    }

    // ===== 6. Migrate data from relationships to player_npcs =====
    const relationshipsCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name='relationships'
    `);

    if (relationshipsCheck.rows.length > 0 && npcsCheck.rows.length > 0) {
      console.log('  Migrating data from relationships + npcs to player_npcs...');

      // Check if relationships has any rows
      const relsCount = await client.query('SELECT COUNT(*) as count FROM relationships');
      const count = parseInt(relsCount.rows[0].count, 10);

      if (count > 0) {
        // Check if trust column exists (new schema) or if we have old friendship/romance columns
        const trustCheck = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name='relationships' AND column_name='trust'
        `);

        if (trustCheck.rows.length > 0) {
          // New schema with trust/affection/desire
          await client.query(`
            INSERT INTO player_npcs (
              id, player_id, npc_template_id,
              trust, affection, desire, current_state,
              emotion_vector, revealed_traits, current_location,
              first_met, last_interaction
            )
            SELECT
              r.id, r.player_id, r.npc_id,
              COALESCE(r.trust, 0), COALESCE(r.affection, 0), COALESCE(r.desire, 0), r.current_state,
              COALESCE(n.emotion_vector, '{"joySadness":0,"acceptanceDisgust":0,"angerFear":0,"anticipationSurprise":0}'::jsonb),
              COALESCE(n.revealed_traits, ARRAY[]::TEXT[]),
              COALESCE(n.current_location, 'home'),
              360, 360
            FROM relationships r
            JOIN npcs n ON r.npc_id = n.id
          `);
        } else {
          // Old schema with friendship/romance - convert to new axes
          await client.query(`
            INSERT INTO player_npcs (
              id, player_id, npc_template_id,
              trust, affection, desire, current_state,
              emotion_vector, revealed_traits, current_location,
              first_met, last_interaction
            )
            SELECT
              r.id, r.player_id, r.npc_id,
              COALESCE(r.friendship, 0), COALESCE(r.friendship, 0), COALESCE(r.romance, 0), r.current_state,
              COALESCE(n.emotion_vector, '{"joySadness":0,"acceptanceDisgust":0,"angerFear":0,"anticipationSurprise":0}'::jsonb),
              COALESCE(n.revealed_traits, ARRAY[]::TEXT[]),
              COALESCE(n.current_location, 'home'),
              360, 360
            FROM relationships r
            JOIN npcs n ON r.npc_id = n.id
          `);
        }
        console.log(`  ✅ Migrated ${count} player NPCs`);
      } else {
        console.log('  ⏭️  No relationships to migrate');
      }
    }

    // ===== 7. Drop foreign key constraints that reference npcs =====
    // player_activities may have a foreign key to npcs - we need to drop it before dropping npcs
    const fkCheck = await client.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'player_activities'::regclass
      AND contype = 'f'
      AND confrelid = 'npcs'::regclass
    `);

    for (const row of fkCheck.rows) {
      console.log(`  Dropping foreign key constraint ${row.conname}...`);
      await client.query(`ALTER TABLE player_activities DROP CONSTRAINT ${row.conname}`);
      console.log(`  ✅ Dropped constraint ${row.conname}`);
    }

    // Update player_activities.npc_id - the old NPC IDs no longer exist
    // We need to clear these since they referenced npcs table, not player_npcs
    // The npc_id in player_npcs comes from relationships.id, not npcs.id
    const npcIdCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='player_activities' AND column_name='npc_id'
    `);

    if (npcIdCheck.rows.length > 0) {
      // Clear old npc_id values since they reference the old npcs table
      // which is being dropped - these IDs won't match player_npcs IDs
      console.log('  Clearing orphaned npc_id references in player_activities...');
      await client.query('UPDATE player_activities SET npc_id = NULL WHERE npc_id IS NOT NULL');
      console.log('  ✅ Cleared orphaned npc_id references');

      // Add new foreign key constraint to player_npcs (if player_npcs exists)
      const playerNpcsCheck = await client.query(`
        SELECT tablename FROM pg_tables WHERE tablename='player_npcs'
      `);

      if (playerNpcsCheck.rows.length > 0) {
        console.log('  Adding foreign key from player_activities to player_npcs...');
        await client.query(`
          ALTER TABLE player_activities
          ADD CONSTRAINT player_activities_npc_id_fkey
          FOREIGN KEY (npc_id) REFERENCES player_npcs(id) ON DELETE SET NULL
        `);
        console.log('  ✅ Added foreign key to player_npcs');
      }
    }

    // ===== 8. Drop old tables =====
    if (relationshipsCheck.rows.length > 0) {
      console.log('  Dropping relationships table...');
      await client.query('DROP TABLE relationships');
      console.log('  ✅ Dropped relationships table');
    }

    if (npcsCheck.rows.length > 0) {
      console.log('  Dropping npcs table...');
      await client.query('DROP TABLE npcs');
      console.log('  ✅ Dropped npcs table');
    }

    await client.query('COMMIT');
    console.log('✅ NPC/Relationship Consolidation migration completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ NPC/Relationship Consolidation migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
