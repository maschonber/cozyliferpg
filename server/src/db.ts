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

    return {
      items: parseInt(itemsCount.rows[0].count),
      players: parseInt(playersCount.rows[0].count),
      connected: true
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      items: 0,
      players: 0,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    client.release();
  }
}
